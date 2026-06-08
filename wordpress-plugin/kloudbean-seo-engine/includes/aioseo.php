<?php
/**
 * AIOSEO (All in One SEO) integration.
 * Sets meta title, description, focus keyword, canonical, OG image, and schema
 * through AIOSEO's data model (aioseo_posts table).
 */

function kbseo_set_aioseo_meta($post_id, $meta) {
    // Try AIOSEO's native method first (v4+)
    if (function_exists('aioseo') && method_exists(aioseo()->meta, 'savePost')) {
        $aioseo_data = [
            'title' => $meta['title'] ?? '',
            'description' => $meta['description'] ?? '',
            'keywords' => $meta['focus_keyword'] ?? '',
            'canonical_url' => $meta['canonical'] ?? '',
            'og_title' => $meta['title'] ?? '',
            'og_description' => $meta['description'] ?? '',
        ];
        
        if (!empty($meta['og_image'])) {
            $aioseo_data['og_image_custom_url'] = $meta['og_image'];
            $aioseo_data['og_image_type'] = 'custom';
        }
        
        // AIOSEO stores data in its own table
        global $wpdb;
        $table = $wpdb->prefix . 'aioseo_posts';
        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE post_id = %d", $post_id));
        
        $row = [
            'post_id' => $post_id,
            'title' => $meta['title'] ?? null,
            'description' => $meta['description'] ?? null,
            'keyphrases' => json_encode(['focus' => ['keyphrase' => $meta['focus_keyword'] ?? '']]),
            'canonical_url' => $meta['canonical'] ?? null,
            'og_title' => $meta['title'] ?? null,
            'og_description' => $meta['description'] ?? null,
            'og_image_custom_url' => $meta['og_image'] ?? null,
            'og_image_type' => !empty($meta['og_image']) ? 'custom' : 'default',
            'twitter_title' => $meta['title'] ?? null,
            'twitter_description' => $meta['description'] ?? null,
            'twitter_image_custom_url' => $meta['og_image'] ?? null,
            'twitter_image_type' => !empty($meta['og_image']) ? 'custom' : 'default',
            'twitter_use_og' => 1,
        ];
        
        // Schema
        if (!empty($meta['schema'])) {
            $row['schema'] = json_encode($meta['schema']);
        }
        
        if ($exists) {
            $wpdb->update($table, $row, ['post_id' => $post_id]);
        } else {
            $wpdb->insert($table, $row);
        }
        
        return true;
    }
    
    // Fallback: set as post meta (works with basic WP SEO or if AIOSEO not installed)
    if (!empty($meta['title'])) {
        update_post_meta($post_id, '_aioseo_title', $meta['title']);
        update_post_meta($post_id, '_yoast_wpseo_title', $meta['title']); // compat
        update_post_meta($post_id, 'rank_math_title', $meta['title']); // compat
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
