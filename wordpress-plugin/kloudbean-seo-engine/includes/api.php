<?php
/**
 * REST API route registration for the Kloudbean SEO Engine plugin.
 * All routes under: /wp-json/kbseo/v1/
 */

function kbseo_register_routes() {
    $namespace = 'kbseo/v1';
    
    // Health check (no auth for connectivity test)
    register_rest_route($namespace, '/health', [
        'methods' => 'GET',
        'callback' => 'kbseo_health',
        'permission_callback' => '__return_true',
    ]);
    
    // Publish/update a post with full SEO automation
    register_rest_route($namespace, '/publish', [
        'methods' => 'POST',
        'callback' => 'kbseo_publish_post',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    
    // Inject internal links into existing posts (backfill)
    register_rest_route($namespace, '/inject-links', [
        'methods' => 'POST',
        'callback' => 'kbseo_inject_links',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    
    // On-page SEO audit for a post
    register_rest_route($namespace, '/audit/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'kbseo_audit_post',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    
    // Bulk audit
    register_rest_route($namespace, '/audit-bulk', [
        'methods' => 'GET',
        'callback' => 'kbseo_audit_bulk',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

function kbseo_health() {
    return [
        'ok' => true,
        'plugin' => 'kloudbean-seo-engine',
        'version' => KBSEO_VERSION,
        'aioseo' => function_exists('aioseo'),
        'site' => get_site_url(),
    ];
}

/**
 * Main publish endpoint — creates or updates a post with FULL on-page SEO.
 * 
 * Expected payload:
 * {
 *   "title": string,
 *   "content": string (HTML),
 *   "slug": string,
 *   "status": "draft" | "publish" | "future",
 *   "publish_date": string (ISO, for scheduled publishing),
 *   "meta_title": string,
 *   "meta_description": string,
 *   "focus_keyword": string,
 *   "secondary_keywords": string[],
 *   "canonical_url": string,
 *   "og_image_url": string,
 *   "featured_image_url": string,
 *   "category": string (cluster name → auto-created if needed),
 *   "tags": string[],
 *   "schema_jsonld": object|array,
 *   "toc": bool (auto-insert table of contents),
 *   "internal_links": [{ "anchor": string, "url": string }],
 *   "existing_post_id": int|null (update if provided),
 *   "reading_time": int (minutes),
 *   "excerpt": string
 * }
 */
function kbseo_publish_post($request) {
    // Rate limit: max 30 publishes per hour per IP
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $transient_key = 'kbseo_rate_' . md5($ip);
    $count = (int) get_transient($transient_key);
    if ($count >= 30) {
        return new WP_Error('rate_limited', 'Too many requests (max 30/hour)', ['status' => 429]);
    }
    set_transient($transient_key, $count + 1, HOUR_IN_SECONDS);
    
    $data = $request->get_json_params();
    if (!$data || !is_array($data)) {
        return new WP_Error('invalid_body', 'Request body must be valid JSON', ['status' => 400]);
    }
    
    // Determine if creating or updating
    $post_id = isset($data['existing_post_id']) ? intval($data['existing_post_id']) : 0;
    
    // Build content with TOC if requested
    $content = wp_kses_post($data['content'] ?? '');
    if (!empty($data['toc'])) {
        $content = kbseo_insert_toc($content);
    }
    
    // Validate status (whitelist only safe values)
    $allowed_statuses = ['draft', 'publish', 'future', 'pending', 'private'];
    $status = in_array($data['status'] ?? 'draft', $allowed_statuses, true)
        ? $data['status']
        : 'draft';
    
    // Prepare post array
    $post_arr = [
        'post_title' => sanitize_text_field($data['title'] ?? ''),
        'post_content' => $content,
        'post_status' => $status,
        'post_type' => 'post',
        'post_name' => sanitize_title($data['slug'] ?? ''),
        'post_excerpt' => sanitize_text_field($data['excerpt'] ?? ''),
    ];
    
    // Scheduled publishing
    if ($status === 'future' && !empty($data['publish_date'])) {
        $post_arr['post_date'] = date('Y-m-d H:i:s', strtotime($data['publish_date']));
        $post_arr['post_date_gmt'] = get_gmt_from_date($post_arr['post_date']);
    }
    
    if ($post_id > 0) {
        $post_arr['ID'] = $post_id;
        $result = wp_update_post($post_arr, true);
    } else {
        $result = wp_insert_post($post_arr, true);
    }
    
    if (is_wp_error($result)) {
        return new WP_Error('post_failed', $result->get_error_message(), ['status' => 500]);
    }
    
    $post_id = $result;
    
    // Featured image
    if (!empty($data['featured_image_url'])) {
        kbseo_set_featured_image($post_id, $data['featured_image_url']);
    }
    
    // Categories (auto-create from cluster name)
    if (!empty($data['category'])) {
        kbseo_assign_category($post_id, $data['category']);
    }
    
    // Tags (from secondary keywords)
    if (!empty($data['tags']) && is_array($data['tags'])) {
        wp_set_post_tags($post_id, $data['tags'], false);
    }
    
    // AIOSEO meta
    kbseo_set_aioseo_meta($post_id, [
        'title' => $data['meta_title'] ?? '',
        'description' => $data['meta_description'] ?? '',
        'focus_keyword' => $data['focus_keyword'] ?? '',
        'canonical' => $data['canonical_url'] ?? '',
        'og_image' => $data['og_image_url'] ?? $data['featured_image_url'] ?? '',
        'schema' => $data['schema_jsonld'] ?? null,
    ]);
    
    // Reading time meta
    if (!empty($data['reading_time'])) {
        update_post_meta($post_id, '_kbseo_reading_time', intval($data['reading_time']));
    }
    
    // Ping sitemaps
    kbseo_ping_sitemaps();
    
    // Backfill: inject links TO this post from related existing posts
    if (!empty($data['focus_keyword'])) {
        kbseo_backfill_links_to_post($post_id, $data['focus_keyword'], $data['title'] ?? '');
    }
    
    return [
        'ok' => true,
        'post_id' => $post_id,
        'link' => get_permalink($post_id),
        'status' => get_post_status($post_id),
        'created' => !isset($data['existing_post_id']),
    ];
}
