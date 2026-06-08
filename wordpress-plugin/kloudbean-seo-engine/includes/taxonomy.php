<?php
/**
 * Category/tag automation — map cluster names to WP categories.
 */

function kbseo_assign_category($post_id, $category_name) {
    if (!$category_name) return;
    
    $cat_name = sanitize_text_field($category_name);
    
    // Find or create category
    $cat = get_term_by('name', $cat_name, 'category');
    if (!$cat) {
        $result = wp_insert_term($cat_name, 'category', [
            'slug' => sanitize_title($cat_name),
        ]);
        if (is_wp_error($result)) return;
        $cat_id = $result['term_id'];
    } else {
        $cat_id = $cat->term_id;
    }
    
    wp_set_post_categories($post_id, [$cat_id], false);
}
