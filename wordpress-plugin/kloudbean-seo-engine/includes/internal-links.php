<?php
/**
 * Internal link injection — the topical authority mesh builder.
 *
 * When a new post is published, this scans existing posts for keyword mentions
 * and injects a contextual link TO the new post. This is the backfill step
 * that makes the silo actually work — without it, new posts have zero inbound
 * internal links until someone manually edits old posts.
 */

/**
 * Backfill: find existing posts that mention the new post's keyword/title
 * and inject a link to it (max 3 injections to avoid over-linking).
 */
function kbseo_backfill_links_to_post($new_post_id, $keyword, $title) {
    if (!$keyword && !$title) return 0;
    
    $new_url = get_permalink($new_post_id);
    if (!$new_url) return 0;
    
    // Search terms: keyword + first 3 words of title
    $search_terms = array_filter([$keyword, implode(' ', array_slice(explode(' ', $title), 0, 3))]);
    
    $injected = 0;
    $max_injections = 3;
    
    foreach ($search_terms as $term) {
        if ($injected >= $max_injections) break;
        if (strlen($term) < 4) continue;
        
        // Find posts containing this term (exclude the new post itself)
        $query = new WP_Query([
            'post_type' => 'post',
            'post_status' => 'publish',
            's' => $term,
            'posts_per_page' => 10,
            'post__not_in' => [$new_post_id],
            'orderby' => 'date',
            'order' => 'DESC',
        ]);
        
        foreach ($query->posts as $post) {
            if ($injected >= $max_injections) break;
            
            $content = $post->post_content;
            
            // Skip if already links to this URL
            if (strpos($content, $new_url) !== false) continue;
            
            // Find the keyword in context and wrap it in a link (first occurrence only)
            $pattern = '/(?<!["\'>])(' . preg_quote($term, '/') . ')(?![^<]*>)/i';
            $replacement = '<a href="' . esc_url($new_url) . '">$1</a>';
            $new_content = preg_replace($pattern, $replacement, $content, 1, $count);
            
            if ($count > 0 && $new_content !== $content) {
                wp_update_post([
                    'ID' => $post->ID,
                    'post_content' => $new_content,
                ]);
                $injected++;
            }
        }
        
        wp_reset_postdata();
    }
    
    return $injected;
}

/**
 * Endpoint: inject links into specified posts (called by the engine for bulk operations).
 */
function kbseo_inject_links($request) {
    $data = $request->get_json_params();
    $links = $data['links'] ?? [];
    // links: [{ target_post_id: int, anchor: string, inject_into_post_ids: int[] }]
    
    $results = [];
    foreach ($links as $link) {
        $target_url = get_permalink($link['target_post_id'] ?? 0);
        if (!$target_url) continue;
        
        $anchor = sanitize_text_field($link['anchor'] ?? '');
        $inject_into = $link['inject_into_post_ids'] ?? [];
        
        $injected = 0;
        foreach ($inject_into as $post_id) {
            $post = get_post($post_id);
            if (!$post || strpos($post->post_content, $target_url) !== false) continue;
            
            $link_html = '<a href="' . esc_url($target_url) . '">' . esc_html($anchor) . '</a>';
            
            // Insert at end of first paragraph that doesn't already have a link
            $paragraphs = explode('</p>', $post->post_content);
            $inserted = false;
            foreach ($paragraphs as $i => &$p) {
                if ($i === 0) continue; // skip first paragraph
                if (substr_count($p, '<a ') < 2 && strlen(strip_tags($p)) > 50) {
                    $p = rtrim($p) . ' ' . $link_html;
                    $inserted = true;
                    break;
                }
            }
            unset($p);
            
            if ($inserted) {
                $new_content = implode('</p>', $paragraphs);
                wp_update_post(['ID' => $post_id, 'post_content' => $new_content]);
                $injected++;
            }
        }
        
        $results[] = [
            'target_post_id' => $link['target_post_id'],
            'injected_into' => $injected,
        ];
    }
    
    return ['ok' => true, 'results' => $results];
}
