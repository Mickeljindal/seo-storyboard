<?php
/**
 * Sitemap pinging after publish — tells Google & Bing about new content.
 */

function kbseo_ping_sitemaps() {
    $sitemap_url = get_site_url() . '/sitemap.xml';
    
    // Google
    $google = wp_remote_get('https://www.google.com/ping?sitemap=' . urlencode($sitemap_url), [
        'timeout' => 5,
        'blocking' => false,
    ]);
    
    // Bing (IndexNow is preferred but basic ping still works)
    $bing = wp_remote_get('https://www.bing.com/ping?sitemap=' . urlencode($sitemap_url), [
        'timeout' => 5,
        'blocking' => false,
    ]);
    
    return true;
}
