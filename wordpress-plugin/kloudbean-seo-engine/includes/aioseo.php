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

    return true;
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
