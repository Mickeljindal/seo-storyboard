<?php
/**
 * Entity boilerplate + llms.txt (C4).
 *
 * - Serves /llms.txt — a Markdown index of the site's key pages for LLMs/AI
 *   crawlers to discover and cite (the AI-era robots.txt companion).
 * - Emits a stable Organization JSON-LD block (with sameAs) site-wide so AI
 *   engines build a consistent Kloudbean entity → higher citation odds.
 *
 * Both are additive and safe; nothing changes existing content or URLs.
 */

if (!defined('ABSPATH')) exit;

/** Entity facts (option-overridable; sameAs is never guessed). */
function kbseo_entity_data() {
    $sameas_raw = get_option('kbseo_entity_sameas', '');
    $sameas = array_filter(array_map('trim', preg_split('/[\r\n,]+/', $sameas_raw)));
    return [
        'name' => get_option('kbseo_entity_name', 'Kloudbean'),
        'legalName' => get_option('kbseo_entity_legal', 'Secured Orbis Pvt. Ltd.'),
        'url' => get_site_url(),
        'description' => get_option(
            'kbseo_entity_desc',
            'Kloudbean is a Zero-Ops managed multi-cloud hosting platform by Secured Orbis Pvt. Ltd., serving 1,000+ businesses across 30+ countries. It bundles managed cloud servers, databases, object storage, and a DevOps stack so builders, agencies, and founders can deploy, host, and own their apps on one platform.'
        ),
        'sameAs' => array_values($sameas),
    ];
}

/* ---------------- Organization JSON-LD (site-wide) ---------------- */

function kbseo_output_entity_schema() {
    if (get_option('kbseo_entity_schema_enabled', '1') !== '1') return;
    $e = kbseo_entity_data();
    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Organization',
        '@id' => rtrim($e['url'], '/') . '/#organization',
        'name' => $e['name'],
        'legalName' => $e['legalName'],
        'url' => $e['url'],
        'description' => $e['description'],
    ];
    if (!empty($e['sameAs'])) {
        $schema['sameAs'] = $e['sameAs'];
    }
    echo "\n<script type=\"application/ld+json\">" .
        wp_json_encode($schema, JSON_UNESCAPED_SLASHES) .
        "</script>\n";
}
add_action('wp_head', 'kbseo_output_entity_schema', 20);

/* ---------------- /llms.txt ---------------- */

/**
 * Build the llms.txt body (Markdown). Cached for an hour. Lists the site name,
 * a one-line summary, key pages, and Developer Tools.
 */
function kbseo_build_llms_txt() {
    $cached = get_transient('kbseo_llms_txt');
    if ($cached !== false) return $cached;

    $e = kbseo_entity_data();
    $lines = [];
    $lines[] = '# ' . $e['name'];
    $lines[] = '';
    $lines[] = '> ' . $e['description'];
    $lines[] = '';

    // Key pages (top-level published pages).
    $pages = get_posts([
        'post_type' => 'page',
        'post_status' => 'publish',
        'posts_per_page' => 30,
        'orderby' => 'menu_order title',
        'order' => 'ASC',
        'post_parent' => 0,
    ]);
    if ($pages) {
        $lines[] = '## Key pages';
        foreach ($pages as $p) {
            $excerpt = kbseo_llms_excerpt($p);
            $lines[] = '- [' . get_the_title($p) . '](' . get_permalink($p) . ')'
                . ($excerpt ? ': ' . $excerpt : '');
        }
        $lines[] = '';
    }

    // Developer Tools category pages.
    $term = get_term_by('slug', 'developer-tools', 'category');
    if (!$term) $term = get_term_by('name', 'Developer Tools', 'category');
    if ($term && !is_wp_error($term)) {
        $tools = get_posts([
            'post_type' => ['post', 'page'],
            'post_status' => 'publish',
            'posts_per_page' => 200,
            'orderby' => 'title',
            'order' => 'ASC',
            'category' => $term->term_id,
        ]);
        if ($tools) {
            $lines[] = '## Developer Tools';
            foreach ($tools as $t) {
                $lines[] = '- [' . get_the_title($t) . '](' . get_permalink($t) . ')';
            }
            $lines[] = '';
        }
    }

    // Recent posts.
    $posts = get_posts([
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => 50,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);
    if ($posts) {
        $lines[] = '## Articles';
        foreach ($posts as $p) {
            $lines[] = '- [' . get_the_title($p) . '](' . get_permalink($p) . ')';
        }
        $lines[] = '';
    }

    $body = implode("\n", $lines);
    set_transient('kbseo_llms_txt', $body, HOUR_IN_SECONDS);
    return $body;
}

function kbseo_llms_excerpt($post) {
    $text = has_excerpt($post) ? get_the_excerpt($post) : '';
    $text = trim(wp_strip_all_tags($text));
    if (strlen($text) > 140) $text = substr($text, 0, 137) . '...';
    return $text;
}

/** Serve /llms.txt as text/plain (Markdown). */
function kbseo_maybe_serve_llms_txt() {
    $path = trim(wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '', '/');
    if ($path !== 'llms.txt') return;
    if (get_option('kbseo_llms_enabled', '1') !== '1') return;

    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex');
    echo kbseo_build_llms_txt();
    exit;
}
add_action('template_redirect', 'kbseo_maybe_serve_llms_txt');

/** Clear the llms.txt cache when content changes. */
function kbseo_flush_llms_cache() {
    delete_transient('kbseo_llms_txt');
}
add_action('save_post', 'kbseo_flush_llms_cache');
add_action('deleted_post', 'kbseo_flush_llms_cache');
