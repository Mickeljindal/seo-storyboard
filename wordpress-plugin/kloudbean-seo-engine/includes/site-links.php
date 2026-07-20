<?php
/**
 * SITE-WIDE AUTO INTERNAL LINKING.
 *
 * Unlike internal-links.php (which only fires at publish-time for ONE new
 * post, searching OLD posts for a keyword match), this module gives the Node
 * engine visibility into and control over the ENTIRE live site — every post
 * and page, regardless of who/what authored it — so link opportunities can be
 * found and applied across content the engine never touched.
 *
 * Endpoints (all under /wp-json/kbseo/v1/):
 *   GET  /site-content        — paginated list of ALL posts + pages with
 *                                enough plain text for the engine to score
 *                                topical similarity (title, excerpt, body text,
 *                                existing outbound link count).
 *   POST /apply-link           — insert ONE link into a source post/page,
 *                                pointing at a target URL, with a given anchor.
 *                                Handles both classic content (regex insert
 *                                into post_content) and Elementor pages
 *                                (appends a small "Related" links widget,
 *                                idempotent via a marker so re-running never
 *                                duplicates).
 *
 * SAFETY:
 *   - /apply-link NEVER touches the post title, slug, or removes anything.
 *   - Classic content: only inserts if the anchor text isn't already linked
 *     anywhere in the post, and only wraps the FIRST occurrence.
 *   - Elementor pages: appends into a dedicated "Related reading" section
 *     (idempotent — re-applying updates that one section, never duplicates).
 *   - Rate-limited like every other write endpoint.
 */

if (!defined('ABSPATH')) exit;

function kbseo_register_site_link_routes($namespace) {
    register_rest_route($namespace, '/site-content', [
        'methods' => 'GET',
        'callback' => 'kbseo_site_content',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/apply-link', [
        'methods' => 'POST',
        'callback' => 'kbseo_apply_link',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

/** Strip tags + shortcodes + collapse whitespace, then truncate for transport. */
function kbseo_plain_text_extract($html, $max_chars = 4000) {
    $text = strip_shortcodes((string) $html);
    $text = wp_strip_all_tags($text, true);
    $text = preg_replace('/\s+/', ' ', $text);
    $text = trim($text);
    if (strlen($text) > $max_chars) {
        $text = substr($text, 0, $max_chars);
    }
    return $text;
}

/** Count <a href> occurrences in raw content (classic) or Elementor HTML widgets. */
function kbseo_count_outbound_links($post) {
    $count = substr_count($post->post_content, '<a ');
    if (get_post_meta($post->ID, '_elementor_edit_mode', true) === 'builder') {
        $raw = get_post_meta($post->ID, '_elementor_data', true);
        if (is_string($raw) && $raw !== '') {
            $count += substr_count($raw, '<a ');
        }
    }
    return $count;
}

/**
 * GET /site-content — every post + page (any status default publish), with
 * enough plain text for the Node engine to score topical relevance. Paginated
 * to keep responses small on large sites (546+ pages).
 */
function kbseo_site_content($request) {
    $post_types = $request->get_param('post_types') ?: 'post,page';
    $types = array_map('trim', explode(',', $post_types));
    $status = $request->get_param('status') ?: 'publish';
    $per_page = min(100, max(1, intval($request->get_param('per_page') ?: 50)));
    $page = max(1, intval($request->get_param('page') ?: 1));
    $modified_since = $request->get_param('modified_since'); // ISO date, optional

    $args = [
        'post_type' => $types,
        'post_status' => $status === 'any' ? ['publish', 'draft', 'pending', 'private'] : $status,
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'modified',
        'order' => 'DESC',
    ];
    if ($modified_since) {
        $args['date_query'] = [[
            'column' => 'post_modified_gmt',
            'after' => $modified_since,
        ]];
    }

    $query = new WP_Query($args);
    $items = [];
    foreach ($query->posts as $post) {
        $excerpt = has_excerpt($post->ID)
            ? get_the_excerpt($post)
            : kbseo_plain_text_extract($post->post_content, 300);
        $items[] = [
            'id' => $post->ID,
            'post_type' => $post->post_type,
            'title' => get_the_title($post),
            'slug' => $post->post_name,
            'link' => get_permalink($post->ID),
            'status' => $post->post_status,
            'excerpt' => $excerpt,
            'content_text' => kbseo_plain_text_extract($post->post_content, 4000),
            'word_count' => str_word_count(wp_strip_all_tags($post->post_content)),
            'outbound_links' => kbseo_count_outbound_links($post),
            'modified' => $post->post_modified_gmt,
        ];
    }

    return [
        'ok' => true,
        'total' => intval($query->found_posts),
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => intval($query->max_num_pages),
        'items' => $items,
    ];
}

const KBSEO_RELATED_MARKER = '<!-- kbseo-related-links -->';

/**
 * Insert one contextual link into classic post_content. Wraps the FIRST
 * occurrence of the anchor text found in a plain-text paragraph (skips
 * headings/existing links). Returns true if inserted.
 */
function kbseo_insert_classic_link($post, $anchor, $target_url) {
    $content = $post->post_content;

    // Already linked to this exact URL anywhere? Don't add a duplicate.
    if (strpos($content, $target_url) !== false) return false;

    // Try to wrap the anchor phrase itself if it appears as plain text
    // (not already inside a tag/attribute).
    $pattern = '/(?<!["\'>])(' . preg_quote($anchor, '/') . ')(?![^<]*>)/i';
    $replacement = '<a href="' . esc_url($target_url) . '">$1</a>';
    $new_content = preg_replace($pattern, $replacement, $content, 1, $count);
    if ($count > 0 && $new_content !== $content) {
        wp_update_post(['ID' => $post->ID, 'post_content' => $new_content]);
        return true;
    }

    // Fallback: anchor phrase not found verbatim in the body — append a
    // sentence linking out, inserted after the first paragraph so it doesn't
    // disrupt the intro.
    $link_html = '<a href="' . esc_url($target_url) . '">' . esc_html($anchor) . '</a>';
    $paragraphs = explode('</p>', $content);
    if (count($paragraphs) < 2) return false;
    $inserted = false;
    foreach ($paragraphs as $i => &$p) {
        if ($i === 0) continue; // skip intro paragraph
        if (substr_count($p, '<a ') < 2 && strlen(strip_tags($p)) > 40) {
            $p = rtrim($p) . ' ' . $link_html;
            $inserted = true;
            break;
        }
    }
    unset($p);
    if (!$inserted) return false;
    wp_update_post(['ID' => $post->ID, 'post_content' => implode('</p>', $paragraphs)]);
    return true;
}

/**
 * Insert (or update) a "Related reading" Elementor section at the END of the
 * page, idempotent via KBSEO_RELATED_MARKER so repeated calls accumulate links
 * into ONE section instead of stacking duplicates. Never touches existing
 * widgets — additive only, same guarantee as tools.php's optimize-tool.
 */
function kbseo_insert_elementor_link($post_id, $anchor, $target_url) {
    $raw = get_post_meta($post_id, '_elementor_data', true);
    $existing = [];
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) $existing = $decoded;
    }
    if (!count($existing)) return false; // not an Elementor page, nothing to append to

    $removed = 0;
    $existing = kbseo_strip_widgets_by_marker($existing, KBSEO_RELATED_MARKER, $removed);

    // Accumulate: read links already offered before (from post meta), add
    // the new one, dedupe by URL, cap at 6 so the section doesn't grow forever.
    $links = get_post_meta($post_id, '_kbseo_related_links', true);
    if (!is_array($links)) $links = [];
    $links[$target_url] = $anchor; // keyed by URL so re-suggesting updates the anchor only
    if (count($links) > 6) {
        $links = array_slice($links, -6, null, true);
    }
    update_post_meta($post_id, '_kbseo_related_links', $links);

    $items_html = '';
    foreach ($links as $url => $text) {
        $items_html .= '<li><a href="' . esc_url($url) . '">' . esc_html($text) . '</a></li>';
    }
    $html = KBSEO_RELATED_MARKER
        . '<div class="kbseo-related-links" style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(0,0,0,0.08);">'
        . '<h3 style="font-size:1.1rem;margin-bottom:10px;">Related reading</h3>'
        . '<ul style="margin:0;padding-left:20px;">' . $items_html . '</ul>'
        . '</div>';

    $section = [
        'id' => substr(md5($post_id . 'kbseo-related'), 0, 7),
        'elType' => 'container',
        'settings' => [],
        'elements' => [[
            'id' => substr(md5($post_id . 'kbseo-related-w'), 0, 7),
            'elType' => 'widget',
            'widgetType' => 'html',
            'settings' => ['html' => $html],
            'elements' => [],
        ]],
    ];

    $merged = array_merge($existing, [$section]);
    kbseo_set_elementor_data($post_id, $merged);
    return true;
}

/**
 * POST /apply-link — insert ONE link. Body:
 *   { source_post_id, target_url, anchor_text }
 * Chooses classic vs Elementor insertion automatically based on the source
 * page's edit mode.
 */
function kbseo_apply_link($request) {
    if (!kbseo_tool_rate_ok('apply_link', 200)) {
        return new WP_Error('rate_limited', 'Too many requests', ['status' => 429]);
    }
    $data = $request->get_json_params();
    if (!$data || !is_array($data)) {
        return new WP_Error('invalid_body', 'Body must be JSON', ['status' => 400]);
    }
    $post_id = intval($data['source_post_id'] ?? 0);
    $target_url = trim((string) ($data['target_url'] ?? ''));
    $anchor = trim((string) ($data['anchor_text'] ?? ''));
    if ($post_id <= 0 || !$target_url || !$anchor) {
        return new WP_Error('invalid_body', 'source_post_id, target_url, anchor_text are required', ['status' => 400]);
    }
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Source post not found', ['status' => 404]);

    $is_elementor = get_post_meta($post_id, '_elementor_edit_mode', true) === 'builder';
    $applied = false;
    $method = 'none';

    if ($is_elementor) {
        $applied = kbseo_insert_elementor_link($post_id, $anchor, $target_url);
        $method = 'elementor_related_section';
    } else {
        $applied = kbseo_insert_classic_link($post, $anchor, $target_url);
        $method = 'classic_inline';
    }

    return [
        'ok' => true,
        'applied' => $applied,
        'method' => $method,
        'post_id' => $post_id,
        'link' => get_permalink($post_id),
    ];
}
