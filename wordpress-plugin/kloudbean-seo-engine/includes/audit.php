<?php
/**
 * On-page SEO audit — returns a checklist of on-page factors for any post.
 * The engine uses this to verify published posts are properly optimized.
 */

function kbseo_audit_post($request) {
    $post_id = intval($request->get_param('id'));
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);
    
    return kbseo_run_audit($post);
}

function kbseo_audit_bulk($request) {
    $limit = intval($request->get_param('limit') ?: 20);
    $posts = get_posts([
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'orderby' => 'date',
        'order' => 'DESC',
    ]);
    
    $results = [];
    foreach ($posts as $post) {
        $results[] = kbseo_run_audit($post);
    }
    
    return ['posts' => $results, 'total' => count($results)];
}

function kbseo_run_audit($post) {
    $content = $post->post_content;
    $title = $post->post_title;
    $meta = kbseo_get_aioseo_meta($post->ID);
    $word_count = str_word_count(strip_tags($content));
    $focus_keyword = $meta['focus_keyword'] ?? '';
    
    $checks = [];
    
    // 1. Title contains keyword
    $kw_in_title = $focus_keyword && stripos($title, $focus_keyword) !== false;
    $checks[] = ['id' => 'kw_in_title', 'pass' => $kw_in_title, 'label' => 'Focus keyword in title'];
    
    // 2. Keyword in first paragraph
    $first_p = '';
    if (preg_match('/<p[^>]*>(.*?)<\/p>/is', $content, $m)) {
        $first_p = strip_tags($m[1]);
    }
    $kw_in_intro = $focus_keyword && stripos($first_p, $focus_keyword) !== false;
    $checks[] = ['id' => 'kw_in_intro', 'pass' => $kw_in_intro, 'label' => 'Focus keyword in first paragraph'];
    
    // 3. Meta title set and proper length
    $meta_title = $meta['title'] ?? '';
    $checks[] = ['id' => 'meta_title', 'pass' => strlen($meta_title) >= 30 && strlen($meta_title) <= 60, 'label' => 'Meta title 30-60 chars', 'detail' => strlen($meta_title) . ' chars'];
    
    // 4. Meta description set and proper length
    $meta_desc = $meta['description'] ?? '';
    $checks[] = ['id' => 'meta_desc', 'pass' => strlen($meta_desc) >= 100 && strlen($meta_desc) <= 160, 'label' => 'Meta description 100-160 chars', 'detail' => strlen($meta_desc) . ' chars'];
    
    // 5. Has H2 headings
    $h2_count = preg_match_all('/<h2/i', $content);
    $checks[] = ['id' => 'h2_count', 'pass' => $h2_count >= 3, 'label' => 'Has ≥3 H2 headings', 'detail' => $h2_count];
    
    // 6. Word count
    $checks[] = ['id' => 'word_count', 'pass' => $word_count >= 1500, 'label' => 'Word count ≥1500', 'detail' => $word_count];
    
    // 7. Has featured image
    $has_image = has_post_thumbnail($post->ID);
    $checks[] = ['id' => 'featured_image', 'pass' => $has_image, 'label' => 'Has featured image'];
    
    // 8. Images have alt text
    preg_match_all('/<img[^>]*>/i', $content, $imgs);
    $imgs_without_alt = 0;
    foreach ($imgs[0] as $img) {
        if (!preg_match('/alt=["\'][^"\']+["\']/i', $img)) $imgs_without_alt++;
    }
    $checks[] = ['id' => 'img_alt', 'pass' => $imgs_without_alt === 0, 'label' => 'All images have alt text', 'detail' => $imgs_without_alt . ' missing'];
    
    // 9. Internal links count
    $site_url = get_site_url();
    preg_match_all('/<a[^>]+href=["\'](' . preg_quote($site_url, '/') . '[^"\']*)/i', $content, $int_links);
    $internal_count = count($int_links[1]);
    $checks[] = ['id' => 'internal_links', 'pass' => $internal_count >= 3, 'label' => 'Has ≥3 internal links', 'detail' => $internal_count];
    
    // 10. Has external links (shows authority/research)
    preg_match_all('/<a[^>]+href=["\']https?:\/\/(?!' . preg_quote(parse_url($site_url, PHP_URL_HOST), '/') . ')[^"\']+/i', $content, $ext_links);
    $external_count = count($ext_links[0]);
    $checks[] = ['id' => 'external_links', 'pass' => $external_count >= 1, 'label' => 'Has external links (authority)', 'detail' => $external_count];
    
    // 11. No broken / empty links
    preg_match_all('/<a[^>]+href=["\']([^"\']*)/i', $content, $all_links);
    $empty_links = 0;
    foreach ($all_links[1] as $href) {
        if (!$href || $href === '#' || $href === '/') $empty_links++;
    }
    $checks[] = ['id' => 'no_empty_links', 'pass' => $empty_links === 0, 'label' => 'No empty/broken links', 'detail' => $empty_links];
    
    // Score
    $passed = count(array_filter($checks, fn($c) => $c['pass']));
    $total = count($checks);
    $score = $total > 0 ? round(($passed / $total) * 100) : 0;
    
    return [
        'post_id' => $post->ID,
        'title' => $title,
        'url' => get_permalink($post->ID),
        'score' => $score,
        'passed' => $passed,
        'total' => $total,
        'word_count' => $word_count,
        'focus_keyword' => $focus_keyword,
        'checks' => $checks,
    ];
}
