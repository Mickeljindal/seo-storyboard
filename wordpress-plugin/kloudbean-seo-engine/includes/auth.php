<?php
/**
 * Authentication for the Kloudbean SEO Engine REST API.
 * Uses a shared API key (set in WP admin + engine .env).
 */

function kbseo_verify_request($request) {
    $key = get_option('kbseo_api_key', '');
    if (!$key) return new WP_Error('no_key', 'Plugin API key not configured', ['status' => 500]);
    
    // Only accept key via header (never query param — those leak in logs)
    $provided = $request->get_header('X-KB-API-Key');
    
    if (!$provided || !hash_equals($key, $provided)) {
        return new WP_Error('unauthorized', 'Invalid API key', ['status' => 401]);
    }
    
    return true;
}
