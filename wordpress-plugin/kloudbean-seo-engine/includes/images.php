<?php
/**
 * Featured image handling — download from URL and set as post thumbnail.
 */

function kbseo_set_featured_image($post_id, $image_url) {
    if (!$image_url) return false;
    
    // SSRF protection: only allow external HTTPS URLs (not internal IPs)
    if (!preg_match('/^https:\/\//i', $image_url)) return false;
    $host = parse_url($image_url, PHP_URL_HOST);
    if (!$host) return false;
    $ip = gethostbyname($host);
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        error_log('[KB SEO] Blocked internal/private IP image URL: ' . $image_url);
        return false;
    }
    
    // Check if already set
    if (has_post_thumbnail($post_id)) {
        $existing = get_the_post_thumbnail_url($post_id, 'full');
        if ($existing === $image_url) return true; // already set
    }
    
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    
    // Download the image
    $tmp = download_url($image_url, 30);
    if (is_wp_error($tmp)) {
        error_log('[KB SEO] Image download failed: ' . $tmp->get_error_message());
        return false;
    }
    
    // Determine file info
    $post = get_post($post_id);
    $filename = sanitize_file_name(basename(parse_url($image_url, PHP_URL_PATH)));
    if (!$filename || $filename === '/') {
        $filename = sanitize_title($post->post_title) . '.jpg';
    }
    
    $file_array = [
        'name' => $filename,
        'tmp_name' => $tmp,
    ];
    
    // Upload to media library
    $attachment_id = media_handle_sideload($file_array, $post_id, $post->post_title);
    
    if (is_wp_error($attachment_id)) {
        @unlink($tmp);
        error_log('[KB SEO] Image sideload failed: ' . $attachment_id->get_error_message());
        return false;
    }
    
    // Set alt text
    update_post_meta($attachment_id, '_wp_attachment_image_alt', $post->post_title);
    
    // Set as featured image
    set_post_thumbnail($post_id, $attachment_id);
    
    return $attachment_id;
}
