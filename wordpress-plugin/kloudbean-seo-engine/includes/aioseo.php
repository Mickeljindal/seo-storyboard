<?php
/**
 * AIOSEO (All in One SEO) integration.
 * Sets meta title, description, focus keyword, canonical, OG image, and schema
 * directly into AIOSEO's data model (wp_aioseo_posts table). This is a
 * confirmed-working write path (verified via live testing against a real
 * page — title/description/keyphrase all land correctly and AIOSEO's own
 * REST API reflects them).
 *
 * NOTE: this does NOT recalculate `seo_score` — see the comment above
 * kbseo_get_aioseo_meta() below for why that number is out of scope here.
 */
function kbseo_set_aioseo_meta($post_id, $meta) {
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';
    $table_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($table_exists) {
        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE post_id = %d", $post_id));

        $row = [
            'post_id' => $post_id,
        ];
        if (isset($meta['title']) && $meta['title'] !== '') {
            $row['title'] = $meta['title'];
            $row['og_title'] = $meta['title'];
            $row['twitter_title'] = $meta['title'];
        }
        if (isset($meta['description']) && $meta['description'] !== '') {
            $row['description'] = $meta['description'];
            $row['og_description'] = $meta['description'];
            $row['twitter_description'] = $meta['description'];
        }
        if (!empty($meta['focus_keyword'])) {
            $row['keyphrases'] = json_encode([
                'focus' => ['keyphrase' => $meta['focus_keyword']],
                'additional' => [],
            ]);
        }
        if (!empty($meta['canonical'])) $row['canonical_url'] = $meta['canonical'];
        if (!empty($meta['og_image'])) {
            $row['og_image_custom_url'] = $meta['og_image'];
            $row['og_image_type'] = 'custom';
            $row['twitter_image_custom_url'] = $meta['og_image'];
            $row['twitter_image_type'] = 'custom';
        }
        if (!empty($meta['schema'])) {
            $row['schema'] = json_encode(['blockGraphs' => [], 'graphs' => [], 'customGraphs' => $meta['schema']]);
        }

        if (count($row) > 1) {
            if ($exists) {
                $wpdb->update($table, $row, ['post_id' => $post_id]);
            } else {
                $row['twitter_use_og'] = 1;
                $wpdb->insert($table, $row);
            }
        }
    }

    // Also set post meta fallbacks (harmless, helps if a different SEO plugin
    // is ever swapped in, and gives us a value even if AIOSEO writes fail).
    if (!empty($meta['title'])) {
        update_post_meta($post_id, '_aioseo_title', $meta['title']);
        update_post_meta($post_id, '_yoast_wpseo_title', $meta['title']);
        update_post_meta($post_id, 'rank_math_title', $meta['title']);
    }
    if (!empty($meta['description'])) {
        update_post_meta($post_id, '_aioseo_description', $meta['description']);
        update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta['description']);
        update_post_meta($post_id, 'rank_math_description', $meta['description']);
    }
    if (!empty($meta['focus_keyword'])) {
        update_post_meta($post_id, '_aioseo_keywords', $meta['focus_keyword']);
        update_post_meta($post_id, 'rank_math_focus_keyword', $meta['focus_keyword']);
    }
    if (!empty($meta['canonical'])) {
        update_post_meta($post_id, '_aioseo_canonical_url', $meta['canonical']);
    }

    // Store our JSON-LD in post meta so we can render it OURSELVES in wp_head
    // (see kbseo_render_head_seo). AIOSEO Lite does not output custom schema
    // graphs, so without this our SoftwareApplication/FAQ/Article schema —
    // and the author/publisher E-E-A-T signals inside it — never reach the
    // page. Stored slashed; wp_head unslashes before decoding.
    if (!empty($meta['schema'])) {
        update_post_meta($post_id, '_kbseo_schema', wp_slash(wp_json_encode($meta['schema'])));
    }

    return true;
}

/**
 * Render our on-page SEO signals directly into <head>, independent of AIOSEO's
 * tier. This is what makes the structured data we generate ACTUALLY appear:
 *   - the full JSON-LD graph (SoftwareApplication / FAQPage / BreadcrumbList /
 *     Article) as <script type="application/ld+json">, and
 *   - HTML <meta name="author">, article:publisher and keywords derived from
 *     that graph — the exact tags on-page SEO auditors (and some AI crawlers)
 *     read, which show as "missing" when only AIOSEO Lite is present.
 * Works for both tool PAGES and blog POSTS (any singular with _kbseo_schema).
 */
add_action('wp_head', 'kbseo_render_head_seo', 5);
function kbseo_render_head_seo() {
    if (!is_singular()) return;
    $post_id = get_queried_object_id();
    if (!$post_id) return;

    $raw = get_post_meta($post_id, '_kbseo_schema', true);
    if (empty($raw)) return;
    $schema = json_decode(is_string($raw) ? wp_unslash($raw) : $raw, true);
    if (!is_array($schema) || empty($schema)) return;
    // Normalize to a list of graph blocks.
    $blocks = isset($schema['@type']) ? [$schema] : $schema;

    // Derive author / publisher / keywords from the graph for HTML meta tags.
    $author = '';
    $publisher = '';
    $keywords = '';
    foreach ($blocks as $b) {
        if (!is_array($b)) continue;
        if ($author === '' && !empty($b['author']['name'])) $author = (string) $b['author']['name'];
        if ($publisher === '' && !empty($b['publisher']['name'])) $publisher = (string) $b['publisher']['name'];
        if ($keywords === '' && !empty($b['keywords'])) $keywords = is_array($b['keywords']) ? implode(', ', $b['keywords']) : (string) $b['keywords'];
    }

    echo "\n<!-- Kloudbean SEO Engine: on-page signals -->\n";
    if ($author !== '') {
        echo '<meta name="author" content="' . esc_attr($author) . '" />' . "\n";
    }
    if ($publisher !== '') {
        echo '<meta property="article:publisher" content="' . esc_attr($publisher) . '" />' . "\n";
    }
    if ($keywords !== '') {
        echo '<meta name="keywords" content="' . esc_attr($keywords) . '" />' . "\n";
    }
    foreach ($blocks as $b) {
        if (!is_array($b)) continue;
        $json = wp_json_encode($b, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (!$json) continue;
        // Guard against an embedded </script> breaking out of the tag.
        $json = str_replace('</', '<\/', $json);
        echo '<script type="application/ld+json">' . $json . "</script>\n";
    }
    echo "<!-- /Kloudbean SEO Engine -->\n";
}

/**
 * NOTE on seo_score: AIOSEO's 0-100 TruSEO score is computed by AIOSEO's own
 * SEO Analysis engine (aioseo()->seoAnalysis), which requires a licensed
 * AIOSEO Pro connection — confirmed via direct testing against this site's
 * /wp-json/aioseo/v1/analyze endpoint, which returns
 * {"error":"invalid-token","message":"No license or token provided."} on
 * AIOSEO Lite. There is no in-process way to compute this score without that
 * license, so this plugin does NOT attempt to trigger a recalculation — it
 * only writes the real on-page SEO data (title, description, focus keyword,
 * canonical, schema), which is what actually affects search rankings. The
 * seo_score column will stay at its last real value (often 0 on Lite) even
 * after a correct optimize; that is expected and not a bug.
 */

/**
 * Get AIOSEO on-page score and meta for audit.
 */
function kbseo_get_aioseo_meta($post_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE post_id = %d", $post_id), ARRAY_A);
    
    if (!$row) {
        return [
            'title' => get_post_meta($post_id, '_aioseo_title', true) ?: '',
            'description' => get_post_meta($post_id, '_aioseo_description', true) ?: '',
            'focus_keyword' => get_post_meta($post_id, '_aioseo_keywords', true) ?: '',
            'seo_score' => null,
        ];
    }
    
    return [
        'title' => $row['title'] ?? '',
        'description' => $row['description'] ?? '',
        'focus_keyword' => json_decode($row['keyphrases'] ?? '{}', true)['focus']['keyphrase'] ?? '',
        'canonical' => $row['canonical_url'] ?? '',
        'og_image' => $row['og_image_custom_url'] ?? '',
        'seo_score' => $row['seo_score'] ?? null,
    ];
}
