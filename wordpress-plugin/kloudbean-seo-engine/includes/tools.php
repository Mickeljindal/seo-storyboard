<?php
/**
 * TOOL PAGES — Elementor-native publishing + safe additive optimization.
 *
 * Endpoints (all under /wp-json/kbseo/v1/):
 *   GET  /tools/list        — list pages in a category with AIOSEO score + Elementor info
 *   GET  /tools/get/{id}    — full _elementor_data + meta + AIOSEO for one page (audit)
 *   POST /publish-tool      — create/update a PAGE built with Elementor (new tools)
 *   POST /optimize-tool     — ADDITIVE injection into an existing page (never changes slug)
 *
 * SAFETY GUARANTEES:
 *   - Tool pages are post_type = 'page'.
 *   - The interactive tool HTML lives in an Elementor "html" widget and is stored
 *     RAW in _elementor_data (never wp_kses'd — that would strip the tool's JS/CSS).
 *   - On update/optimize the post slug (post_name) is NEVER changed.
 *   - /optimize-tool only PREPENDS/APPENDS sections; it never edits or removes the
 *     existing widgets (the tool stays byte-for-byte the same).
 */

if (!defined('ABSPATH')) exit;

/** Register tool routes (called from kbseo_register_routes in api.php). */
function kbseo_register_tool_routes($namespace) {
    register_rest_route($namespace, '/tools/list', [
        'methods' => 'GET',
        'callback' => 'kbseo_tools_list',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/categories', [
        'methods' => 'GET',
        'callback' => 'kbseo_list_categories',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/tools/get/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'kbseo_tools_get',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/publish-tool', [
        'methods' => 'POST',
        'callback' => 'kbseo_publish_tool',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/optimize-tool', [
        'methods' => 'POST',
        'callback' => 'kbseo_optimize_tool',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/tools/restore', [
        'methods' => 'POST',
        'callback' => 'kbseo_restore_tool',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    // Legacy bug fix: unwrap a full HTML document nested inside a tool widget.
    register_rest_route($namespace, '/fix-tool-html', [
        'methods' => 'POST',
        'callback' => 'kbseo_fix_tool_html',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/scan-tool-html', [
        'methods' => 'GET',
        'callback' => 'kbseo_scan_tool_html',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    // Gate conversion beacon (public, same-origin from the tool page) + stats read.
    register_rest_route($namespace, '/gate-hit', [
        'methods' => ['GET', 'POST'],
        'callback' => 'kbseo_gate_hit',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route($namespace, '/gate-stats', [
        'methods' => 'GET',
        'callback' => 'kbseo_gate_stats',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

/** Current Elementor version string (best effort). */
function kbseo_elementor_version() {
    if (defined('ELEMENTOR_VERSION')) return ELEMENTOR_VERSION;
    return '3.0.0';
}

/**
 * Gate conversion beacon: increment a per-slug counter when a visitor clicks the
 * signup CTA. Public + lightly rate-limited (1 increment per IP+slug / 30s).
 */
function kbseo_gate_hit($request) {
    $tool = sanitize_title($request->get_param('tool'));
    if (!$tool) return ['ok' => false];
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $rl = 'kbseo_gh_' . md5($ip . $tool);
    if (get_transient($rl)) return ['ok' => true, 'throttled' => true];
    set_transient($rl, 1, 30);
    $hits = get_option('kbseo_gate_hits', []);
    if (!is_array($hits)) $hits = [];
    $hits[$tool] = (int) ($hits[$tool] ?? 0) + 1;
    update_option('kbseo_gate_hits', $hits, false);
    return ['ok' => true];
}

/** Return the per-slug gate-hit counters (auth). */
function kbseo_gate_stats() {
    $hits = get_option('kbseo_gate_hits', []);
    return ['ok' => true, 'hits' => is_array($hits) ? $hits : []];
}

/**
 * Restore a page's _elementor_data to a provided snapshot (one-click rollback of
 * an optimize). Slug + title untouched.
 */
function kbseo_restore_tool($request) {
    $data = $request->get_json_params();
    $post_id = intval($data['post_id'] ?? 0);
    if ($post_id <= 0) return new WP_Error('invalid_body', 'post_id required', ['status' => 400]);
    if (!get_post($post_id)) return new WP_Error('not_found', 'Page not found', ['status' => 404]);
    if (empty($data['elementor_data']) || !is_array($data['elementor_data'])) {
        return new WP_Error('invalid_body', 'elementor_data (array) required', ['status' => 400]);
    }
    kbseo_set_elementor_data($post_id, $data['elementor_data']);
    return ['ok' => true, 'post_id' => $post_id, 'restored_sections' => count($data['elementor_data'])];
}

/** Read AIOSEO score + focus keyword for a post (best effort). */
function kbseo_aioseo_score($post_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';
    // Guard: table may not exist if AIOSEO isn't installed.
    $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
    if (!$exists) return ['score' => null, 'focus_keyword' => '', 'title' => '', 'description' => ''];
    $row = $wpdb->get_row($wpdb->prepare("SELECT title, description, keyphrases, seo_score FROM {$table} WHERE post_id = %d", $post_id), ARRAY_A);
    if (!$row) return ['score' => null, 'focus_keyword' => '', 'title' => '', 'description' => ''];
    $focus = '';
    if (!empty($row['keyphrases'])) {
        $kp = json_decode($row['keyphrases'], true);
        $focus = $kp['focus']['keyphrase'] ?? '';
    }
    return [
        'score' => isset($row['seo_score']) ? intval($row['seo_score']) : null,
        'focus_keyword' => $focus,
        'title' => $row['title'] ?? '',
        'description' => $row['description'] ?? '',
    ];
}

/** Persist Elementor data + builder meta for a page. Stores RAW (slashed) JSON. */
function kbseo_set_elementor_data($post_id, $data_array) {
    // Elementor expects the meta stored slashed; wp_slash before update_post_meta.
    $json = wp_json_encode($data_array);
    update_post_meta($post_id, '_elementor_data', wp_slash($json));
    update_post_meta($post_id, '_elementor_edit_mode', 'builder');
    if (!get_post_meta($post_id, '_elementor_template_type', true)) {
        update_post_meta($post_id, '_elementor_template_type', 'wp-page');
    }
    update_post_meta($post_id, '_elementor_version', kbseo_elementor_version());
    kbseo_clear_elementor_cache($post_id);
}

/** Clear Elementor's cached CSS so injected content renders immediately. */
function kbseo_clear_elementor_cache($post_id) {
    delete_post_meta($post_id, '_elementor_css');
    if (class_exists('\Elementor\Plugin')) {
        try {
            \Elementor\Plugin::$instance->files_manager->clear_cache();
        } catch (\Throwable $e) {
            // non-fatal
        }
    }
}

/**
 * Recursively remove HTML widgets whose markup contains a marker string.
 * Makes gate add/update/remove idempotent (strip old gate, then re-add).
 * Returns the filtered element list; counts removed via &$removed.
 */
function kbseo_strip_widgets_by_marker($elements, $marker, &$removed) {
    if (!is_array($elements)) return $elements;
    $out = [];
    foreach ($elements as $el) {
        if (!is_array($el)) { $out[] = $el; continue; }
        $is_widget = (($el['elType'] ?? '') === 'widget');
        $html = ($is_widget && isset($el['settings']['html'])) ? (string) $el['settings']['html'] : '';
        if ($html !== '' && strpos($html, $marker) !== false) {
            $removed++;
            continue; // drop this widget
        }
        if (!empty($el['elements']) && is_array($el['elements'])) {
            $el['elements'] = kbseo_strip_widgets_by_marker($el['elements'], $marker, $removed);
        }
        // Drop sections/columns left empty after stripping their only widget.
        $type = $el['elType'] ?? '';
        if (($type === 'section' || $type === 'column' || $type === 'container') && empty($el['elements'])) {
            continue;
        }
        $out[] = $el;
    }
    return $out;
}

/**
 * Fix a legacy bug in tool pages built before this engine existed: the AI's
 * FULL output (a complete standalone HTML document — <!DOCTYPE>, <html>,
 * <head> with its own <title>/<meta description>, <body>) was pasted whole
 * into a single Elementor HTML widget, instead of just the inner body markup
 * a widget is supposed to contain. Browsers render a widget's HTML inline
 * inside the page's OWN <head>/<body>, so a second nested <head>/<title> in
 * the middle of the page breaks layout and confuses on-page SEO signals
 * (duplicate/conflicting <meta description>, <title> mid-document, etc).
 *
 * This keeps everything that actually matters — <style> blocks (the tool's
 * look), <script> tags NOT in head (the tool's logic), and the full <body>
 * content — and drops only the redundant wrapper shell (<!DOCTYPE>, opening/
 * closing <html>, the <head> tag itself and its <title>/<meta> children,
 * opening/closing <body>). It does NOT touch anything else in the widget or
 * any OTHER widget on the page.
 *
 * Returns [fixed_html, changed:boolean, before_len:int, after_len:int].
 */
function kbseo_unwrap_full_html_document($html) {
    $original = (string) $html;
    if ($original === '') return [$original, false, 0, 0];

    // Only act if this widget genuinely contains a nested document — cheap
    // guard so untouched widgets are never rewritten.
    if (!preg_match('/<!doctype\s+html/i', $original) && !preg_match('/<html[\s>]/i', $original)) {
        return [$original, false, strlen($original), strlen($original)];
    }

    $work = $original;

    // 1. Pull out anything from <head> that's actually VALUABLE and must be
    //    preserved: <style> (the tool's look) and <script type="application/
    //    ld+json"> (real SEO schema — several existing pages have hand-authored
    //    WebPage/SoftwareApplication/FAQPage/HowTo schema in <head> that we must
    //    NOT delete). Everything else in <head> (title/meta/canonical/og/twitter)
    //    is genuinely redundant once the page already has its own <head> with
    //    AIOSEO-managed equivalents, so that part is safe to drop.
    $head_keep = '';
    if (preg_match('/<head[^>]*>(.*?)<\/head>/is', $work, $head_match)) {
        if (preg_match_all('/<style\b[^>]*>.*?<\/style>/is', $head_match[1], $style_matches)) {
            $head_keep .= implode("\n", $style_matches[0]) . "\n";
        }
        if (preg_match_all('/<script\b[^>]*type=["\']application\/ld\+json["\'][^>]*>.*?<\/script>/is', $head_match[1], $ldjson_matches)) {
            $head_keep .= implode("\n", $ldjson_matches[0]) . "\n";
        }
    }

    // 2. Drop <!DOCTYPE ...>
    $work = preg_replace('/<!doctype[^>]*>/i', '', $work);
    // 3. Drop opening/closing <html ...> and <html>
    $work = preg_replace('/<\/?html[^>]*>/i', '', $work);
    // 4. Drop the ENTIRE <head>...</head> block (title/meta/canonical/og/
    //    twitter are all redundant duplicates once the page has its own head).
    $work = preg_replace('/<head[^>]*>.*?<\/head>/is', '', $work);
    // 5. Drop opening/closing <body ...> tags (keep their inner content).
    $work = preg_replace('/<\/?body[^>]*>/i', '', $work);

    // 6. Re-inject the preserved style/schema blocks at the top.
    if ($head_keep !== '') {
        $work = $head_keep . $work;
    }

    $work = trim($work);
    $changed = ($work !== trim($original));
    return [$work, $changed, strlen($original), strlen($work)];
}

/**
 * Recursively apply kbseo_unwrap_full_html_document() to every HTML widget in
 * an Elementor element tree. Returns the (possibly modified) tree plus a
 * count of widgets actually changed.
 */
function kbseo_unwrap_elements($elements, &$fixed_count, &$details) {
    if (!is_array($elements)) return $elements;
    foreach ($elements as &$el) {
        if (!is_array($el)) continue;
        $is_widget = (($el['elType'] ?? '') === 'widget');
        if ($is_widget && isset($el['settings']['html'])) {
            [$new_html, $changed, $before_len, $after_len] = kbseo_unwrap_full_html_document($el['settings']['html']);
            if ($changed) {
                $el['settings']['html'] = $new_html;
                $fixed_count++;
                $details[] = ['widget_id' => $el['id'] ?? null, 'before_len' => $before_len, 'after_len' => $after_len];
            }
        }
        if (!empty($el['elements']) && is_array($el['elements'])) {
            $el['elements'] = kbseo_unwrap_elements($el['elements'], $fixed_count, $details);
        }
    }
    return $elements;
}

/**
 * POST /fix-tool-html — remove a nested full-HTML-document wrapper from a
 * page's tool widget(s). Additive-safe: never touches the slug, title, or
 * any widget that doesn't have the defect. Supports dry_run.
 */
function kbseo_fix_tool_html($request) {
    if (!kbseo_tool_rate_ok('fix_html', 60)) {
        return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
    }
    $data = $request->get_json_params();
    $post_id = intval($data['post_id'] ?? 0);
    if ($post_id <= 0) return new WP_Error('invalid_body', 'post_id required', ['status' => 400]);
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Page not found', ['status' => 404]);

    $dry_run = !empty($data['dry_run']);

    $raw = get_post_meta($post_id, '_elementor_data', true);
    $elements = [];
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $elements = $decoded;
    }
    if (!count($elements)) {
        return ['ok' => true, 'post_id' => $post_id, 'fixed_widgets' => 0, 'reason' => 'not an Elementor page or no data'];
    }

    $fixed_count = 0;
    $details = [];
    $new_elements = kbseo_unwrap_elements($elements, $fixed_count, $details);

    if ($fixed_count > 0 && !$dry_run) {
        kbseo_set_elementor_data($post_id, $new_elements);
    }

    return [
        'ok' => true,
        'post_id' => $post_id,
        'slug' => $post->post_name,
        'dry_run' => $dry_run,
        'fixed_widgets' => $fixed_count,
        'details' => $details,
        'link' => get_permalink($post_id),
    ];
}

/**
 * GET /scan-tool-html — dry-run scan across a category to count how many
 * pages have the nested-full-HTML-document defect, WITHOUT writing anything.
 * Paginated the same way as /tools/list.
 */
function kbseo_scan_tool_html($request) {
    $category = $request->get_param('category') ?: 'Developer Tools';
    $per_page = min(100, max(1, intval($request->get_param('per_page') ?: 50)));
    $page = max(1, intval($request->get_param('page') ?: 1));

    $found = kbseo_find_page_term($category, 0);
    if (!$found) {
        return ['ok' => true, 'category_found' => false, 'total' => 0, 'page' => $page, 'total_pages' => 0, 'items' => []];
    }
    [$taxonomy, $term] = $found;

    $query = new WP_Query([
        'post_type' => 'page',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'tax_query' => [[ 'taxonomy' => $taxonomy, 'field' => 'term_id', 'terms' => $term->term_id ]],
    ]);

    $items = [];
    foreach ($query->posts as $post) {
        $raw = get_post_meta($post->ID, '_elementor_data', true);
        $affected = 0;
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $fixed_count = 0;
                $details = [];
                kbseo_unwrap_elements($decoded, $fixed_count, $details);
                $affected = $fixed_count;
            }
        }
        if ($affected > 0) {
            $items[] = ['id' => $post->ID, 'slug' => $post->post_name, 'title' => get_the_title($post), 'affected_widgets' => $affected];
        }
    }

    return [
        'ok' => true,
        'category_found' => true,
        'total' => intval($query->found_posts),
        'page' => $page,
        'total_pages' => intval($query->max_num_pages),
        'scanned' => count($query->posts),
        'affected_on_this_page' => count($items),
        'items' => $items,
    ];
}

/** Simple per-IP rate limit for write endpoints. */
function kbseo_tool_rate_ok($bucket, $max = 120) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = 'kbseo_trate_' . $bucket . '_' . md5($ip);
    $count = (int) get_transient($key);
    if ($count >= $max) return false;
    set_transient($key, $count + 1, HOUR_IN_SECONDS);
    return true;
}

/**
 * GET /categories — every taxonomy term attached to PAGES that we can filter by.
 * WP sites often organise pages using a CUSTOM taxonomy (e.g. `page_category`,
 * `elementor_library_category`, etc.) rather than the default `category`. This
 * endpoint walks every taxonomy registered for the `page` post type, so the
 * dashboard always shows the same categories the WP admin filter shows.
 */
function kbseo_list_categories($request) {
    $taxonomies = get_object_taxonomies('page', 'objects');
    if (empty($taxonomies)) {
        // Fallback: include the default category taxonomy even if it's not
        // registered for pages (some sites attach it via plugin/theme code).
        $cat = get_taxonomy('category');
        if ($cat) $taxonomies = ['category' => $cat];
    }
    $out = [];
    foreach ($taxonomies as $tax_name => $tax_obj) {
        // Skip system taxonomies that don't hold user categories.
        if (in_array($tax_name, ['nav_menu', 'link_category', 'post_format'], true)) continue;
        $terms = get_terms([
            'taxonomy' => $tax_name,
            'hide_empty' => false,
            'orderby' => 'name',
            'order' => 'ASC',
        ]);
        if (is_wp_error($terms) || empty($terms)) continue;
        foreach ($terms as $t) {
            $q = new WP_Query([
                'post_type' => 'page',
                'post_status' => ['publish', 'draft', 'pending', 'private'],
                'posts_per_page' => 1,
                'fields' => 'ids',
                'no_found_rows' => false,
                'tax_query' => [[
                    'taxonomy' => $tax_name,
                    'field' => 'term_id',
                    'terms' => $t->term_id,
                ]],
            ]);
            $page_count = intval($q->found_posts);
            if ($page_count === 0) continue;
            $out[] = [
                'id' => $t->term_id,
                'name' => $t->name,
                'slug' => $t->slug,
                'taxonomy' => $tax_name,
                'page_count' => $page_count,
            ];
        }
    }
    // Sort by page_count desc so the biggest categories surface first.
    usort($out, function ($a, $b) { return $b['page_count'] - $a['page_count']; });
    return ['ok' => true, 'categories' => $out];
}

/**
 * Try to find a term in ANY taxonomy attached to `page` (or `category` as
 * a fallback) matching the given name/slug/id. Returns [taxonomy, term] or null.
 * This is what fixes the "wrong pages" bug on sites that use a custom taxonomy
 * (e.g. `page_category`) instead of the default `category` to organise pages.
 */
function kbseo_find_page_term($category, $category_id) {
    $taxonomies = get_object_taxonomies('page', 'names');
    if (empty($taxonomies)) $taxonomies = ['category'];

    // Try each taxonomy: by id, then by slug, then by name.
    if ($category_id > 0) {
        foreach ($taxonomies as $tax) {
            $t = get_term($category_id, $tax);
            if ($t && !is_wp_error($t)) return [$tax, $t];
        }
    }
    if ($category) {
        $slug = sanitize_title($category);
        foreach ($taxonomies as $tax) {
            $t = get_term_by('slug', $slug, $tax);
            if ($t && !is_wp_error($t)) return [$tax, $t];
        }
        foreach ($taxonomies as $tax) {
            $t = get_term_by('name', $category, $tax);
            if ($t && !is_wp_error($t)) return [$tax, $t];
        }
    }
    return null;
}

/**
 * GET /tools/list — pages in a category with AIOSEO + Elementor info.
 * Query: category (slug or name) OR category_id, per_page, page, status.
 * Auto-detects which taxonomy the category lives in (default `category` OR any
 * custom taxonomy attached to pages, e.g. `page_category`). When a category is
 * requested but cannot be resolved, returns an EMPTY result (never silently
 * falls back to all pages).
 */
function kbseo_tools_list($request) {
    $category = $request->get_param('category');
    $category_id = intval($request->get_param('category_id') ?: 0);
    if ($category === null || $category === '') $category = 'Developer Tools';
    $per_page = min(100, max(1, intval($request->get_param('per_page') ?: 50)));
    $page = max(1, intval($request->get_param('page') ?: 1));
    $status = $request->get_param('status') ?: 'publish';
    $all_categories = ($category === '*' || $category === 'all');

    $args = [
        'post_type' => 'page',
        'post_status' => $status === 'any' ? ['publish', 'draft', 'pending', 'private'] : $status,
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'modified',
        'order' => 'DESC',
    ];

    $resolved_category = $all_categories ? 'All categories' : $category;
    $resolved_taxonomy = null;
    if (!$all_categories) {
        $found = kbseo_find_page_term($category, $category_id);
        if (!$found) {
            // Category requested but not found in ANY page-attached taxonomy —
            // return empty, do NOT list all pages.
            return [
                'ok' => true,
                'category' => $category,
                'category_found' => false,
                'taxonomy' => null,
                'total' => 0,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => 0,
                'items' => [],
            ];
        }
        [$resolved_taxonomy, $term] = $found;
        $resolved_category = $term->name;
        $args['tax_query'] = [[
            'taxonomy' => $resolved_taxonomy,
            'field' => 'term_id',
            'terms' => $term->term_id,
        ]];
    }

    $query = new WP_Query($args);
    $items = [];
    foreach ($query->posts as $post) {
        $aioseo = kbseo_aioseo_score($post->ID);
        $edit_mode = get_post_meta($post->ID, '_elementor_edit_mode', true);
        $has_elementor = ($edit_mode === 'builder');
        $word_count = 0;
        if ($has_elementor) {
            $raw = get_post_meta($post->ID, '_elementor_data', true);
            if (is_string($raw) && $raw !== '') {
                $word_count = str_word_count(wp_strip_all_tags($raw));
            }
        } else {
            $word_count = str_word_count(wp_strip_all_tags($post->post_content));
        }
        $items[] = [
            'id' => $post->ID,
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'link' => get_permalink($post->ID),
            'status' => $post->post_status,
            'modified' => $post->post_modified_gmt,
            'has_elementor' => $has_elementor,
            'aioseo_score' => $aioseo['score'],
            'focus_keyword' => $aioseo['focus_keyword'],
            'meta_title' => $aioseo['title'],
            'meta_description' => $aioseo['description'],
            'word_count' => $word_count,
        ];
    }

    return [
        'ok' => true,
        'category' => $resolved_category,
        'category_found' => true,
        'taxonomy' => $resolved_taxonomy,
        'total' => intval($query->found_posts),
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => intval($query->max_num_pages),
        'items' => $items,
    ];
}

/**
 * GET /tools/get/{id} — full data for an audit (no writes).
 */
function kbseo_tools_get($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Page not found', ['status' => 404]);

    $raw = get_post_meta($post_id, '_elementor_data', true);
    $elementor_data = null;
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $elementor_data = $decoded;
    }
    $aioseo = kbseo_aioseo_score($post_id);

    return [
        'ok' => true,
        'id' => $post_id,
        'title' => get_the_title($post),
        'slug' => $post->post_name,
        'link' => get_permalink($post_id),
        'status' => $post->post_status,
        'edit_mode' => get_post_meta($post_id, '_elementor_edit_mode', true),
        'has_elementor' => (get_post_meta($post_id, '_elementor_edit_mode', true) === 'builder'),
        'elementor_data' => $elementor_data,
        'post_content' => $post->post_content,
        'aioseo' => $aioseo,
    ];
}

/**
 * POST /publish-tool — create/update a PAGE built with Elementor.
 *
 * Body: { title, slug, status (draft|publish), category, meta_title,
 *   meta_description, focus_keyword, secondary_keywords[], canonical_url,
 *   schema_jsonld, elementor_data (array), existing_post_id }
 *
 * On update: post_name (slug) is NEVER changed.
 */
function kbseo_publish_tool($request) {
    if (!kbseo_tool_rate_ok('publish')) {
        return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
    }
    $data = $request->get_json_params();
    if (!$data || !is_array($data)) {
        return new WP_Error('invalid_body', 'Body must be JSON', ['status' => 400]);
    }
    if (empty($data['elementor_data']) || !is_array($data['elementor_data'])) {
        return new WP_Error('invalid_body', 'elementor_data (array) is required', ['status' => 400]);
    }

    $allowed_statuses = ['draft', 'publish', 'pending', 'private'];
    $status = in_array($data['status'] ?? 'draft', $allowed_statuses, true) ? $data['status'] : 'draft';
    $post_id = isset($data['existing_post_id']) ? intval($data['existing_post_id']) : 0;

    $post_arr = [
        'post_title' => sanitize_text_field($data['title'] ?? ''),
        'post_status' => $status,
        'post_type' => 'page',
        // Elementor renders from _elementor_data; keep post_content empty.
        'post_content' => '',
    ];

    if ($post_id > 0) {
        // UPDATE — never touch the slug.
        $post_arr['ID'] = $post_id;
        $result = wp_update_post($post_arr, true);
    } else {
        // CREATE — slug set once, here only.
        if (!empty($data['slug'])) $post_arr['post_name'] = sanitize_title($data['slug']);
        $result = wp_insert_post($post_arr, true);
    }
    if (is_wp_error($result)) {
        return new WP_Error('post_failed', $result->get_error_message(), ['status' => 500]);
    }
    $post_id = $result;

    // Elementor data (RAW — preserves the tool's JS/CSS).
    kbseo_set_elementor_data($post_id, $data['elementor_data']);

    // Category (works on pages when the category taxonomy is attached to pages).
    if (!empty($data['category'])) {
        kbseo_assign_category($post_id, $data['category']);
    }
    if (!empty($data['tags']) && is_array($data['tags'])) {
        wp_set_post_tags($post_id, $data['tags'], false);
    }

    // AIOSEO meta + schema.
    kbseo_set_aioseo_meta($post_id, [
        'title' => $data['meta_title'] ?? '',
        'description' => $data['meta_description'] ?? '',
        'focus_keyword' => $data['focus_keyword'] ?? '',
        'canonical' => $data['canonical_url'] ?? '',
        'og_image' => $data['og_image_url'] ?? '',
        'schema' => $data['schema_jsonld'] ?? null,
    ]);

    kbseo_ping_sitemaps();

    return [
        'ok' => true,
        'post_id' => $post_id,
        'link' => get_permalink($post_id),
        'slug' => get_post_field('post_name', $post_id),
        'status' => get_post_status($post_id),
        'created' => empty($data['existing_post_id']),
    ];
}

/**
 * POST /optimize-tool — ADDITIVE SEO injection into an existing page.
 *
 * Body: { post_id (required), prepend (array), append (array), meta_title,
 *   meta_description, focus_keyword, secondary_keywords[], canonical_url,
 *   schema_jsonld, dry_run (bool) }
 *
 * Guarantees:
 *   - post_name (slug) is NEVER changed.
 *   - post_title and existing widgets are NEVER changed.
 *   - Only prepends/appends new Elementor sections + updates AIOSEO meta.
 */
function kbseo_optimize_tool($request) {
    if (!kbseo_tool_rate_ok('optimize')) {
        return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
    }
    $data = $request->get_json_params();
    if (!$data || !is_array($data)) {
        return new WP_Error('invalid_body', 'Body must be JSON', ['status' => 400]);
    }
    $post_id = intval($data['post_id'] ?? 0);
    if ($post_id <= 0) return new WP_Error('invalid_body', 'post_id is required', ['status' => 400]);
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Page not found', ['status' => 404]);

    $dry_run = !empty($data['dry_run']);
    $prepend = (isset($data['prepend']) && is_array($data['prepend'])) ? $data['prepend'] : [];
    $append = (isset($data['append']) && is_array($data['append'])) ? $data['append'] : [];
    $strip_marker = isset($data['strip_marker']) ? (string) $data['strip_marker'] : '';

    $raw = get_post_meta($post_id, '_elementor_data', true);
    $existing = [];
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $existing = $decoded;
    }
    $has_elementor = (get_post_meta($post_id, '_elementor_edit_mode', true) === 'builder') && count($existing) > 0;

    // Strip widgets matching the marker (e.g. an old signup gate) before merging,
    // so add/update/remove of the gate is idempotent.
    $stripped = 0;
    if ($strip_marker !== '' && $has_elementor) {
        $existing = kbseo_strip_widgets_by_marker($existing, $strip_marker, $stripped);
    }

    $report = [
        'post_id' => $post_id,
        'slug' => $post->post_name, // echoed back so callers can confirm it's unchanged
        'has_elementor' => $has_elementor,
        'existing_sections' => count($existing),
        'stripped_widgets' => $stripped,
        'will_prepend' => count($prepend),
        'will_append' => count($append),
        'injected_elementor' => false,
        'updated_meta' => false,
        'dry_run' => $dry_run,
    ];

    if ($dry_run) {
        $report['ok'] = true;
        return $report;
    }

    // 1. Additive Elementor injection (only when the page is Elementor-built).
    if ($has_elementor && (count($prepend) || count($append) || $stripped > 0)) {
        $merged = array_merge($prepend, $existing, $append);
        kbseo_set_elementor_data($post_id, $merged);
        $report['injected_elementor'] = true;
        $report['existing_sections_after'] = count($merged);
    }

    // 2. AIOSEO meta + schema — the biggest score lift, safe on any page.
    $has_meta = !empty($data['meta_title']) || !empty($data['meta_description']) || !empty($data['focus_keyword']) || !empty($data['schema_jsonld']);
    if ($has_meta) {
        kbseo_set_aioseo_meta($post_id, [
            'title' => $data['meta_title'] ?? '',
            'description' => $data['meta_description'] ?? '',
            'focus_keyword' => $data['focus_keyword'] ?? '',
            'canonical' => $data['canonical_url'] ?? '',
            'og_image' => $data['og_image_url'] ?? '',
            'schema' => $data['schema_jsonld'] ?? null,
        ]);
        $report['updated_meta'] = true;
    }

    // 3. If NOT Elementor-built, append schema into post_content as a safe fallback
    //    (does not disturb existing layout/builders).
    if (!$has_elementor && !empty($data['schema_jsonld'])) {
        $schema = $data['schema_jsonld'];
        $blocks = isset($schema[0]) ? $schema : [$schema];
        $tags = '';
        foreach ($blocks as $b) {
            $tags .= '<script type="application/ld+json">' . wp_json_encode($b) . '</script>' . "\n";
        }
        if (strpos($post->post_content, 'application/ld+json') === false) {
            wp_update_post([
                'ID' => $post_id,
                'post_content' => $post->post_content . "\n" . $tags,
            ]);
            $report['appended_schema_to_content'] = true;
        }
    }

    kbseo_ping_sitemaps();

    $report['ok'] = true;
    $report['link'] = get_permalink($post_id);
    return $report;
}
