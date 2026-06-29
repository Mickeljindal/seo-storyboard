<?php
/**
 * Instant indexing (B1) — IndexNow key hosting + auto-submit on publish.
 *
 * - Serves the IndexNow key file at /wp-json/kbseo/v1/indexnow-key (plain text)
 *   so search engines can verify ownership. The key is auto-generated once and
 *   stored in the kbseo_indexnow_key option.
 * - Auto-submits a page's URL to IndexNow whenever it is published or updated,
 *   so manual WordPress edits notify Bing/Yandex/etc. immediately too.
 * - Exposes an authenticated /indexnow endpoint the engine can call to push a
 *   batch of URLs.
 */

if (!defined('ABSPATH')) exit;

define('KBSEO_INDEXNOW_ENDPOINT', 'https://api.indexnow.org/indexnow');

/** Get (or create + store) the site's IndexNow key. */
function kbseo_get_indexnow_key() {
    $key = get_option('kbseo_indexnow_key', '');
    if (!$key) {
        // 32 lowercase hex chars — IndexNow allows a-z, A-Z, 0-9, -.
        $key = strtolower(wp_generate_password(32, false, false));
        // wp_generate_password without special chars can include mixed case; force hex-ish.
        $key = substr(preg_replace('/[^a-z0-9]/', '', $key . md5(uniqid('', true))), 0, 32);
        update_option('kbseo_indexnow_key', $key, false);
    }
    return $key;
}

/** Public plain-text key-file URL used as keyLocation. */
function kbseo_indexnow_key_location() {
    return rest_url('kbseo/v1/indexnow-key');
}

function kbseo_register_indexing_routes($namespace) {
    // Public key file (search engines + the engine fetch this).
    register_rest_route($namespace, '/indexnow-key', [
        'methods' => 'GET',
        'callback' => 'kbseo_serve_indexnow_key',
        'permission_callback' => '__return_true',
    ]);

    // Authenticated batch submit (engine → plugin → IndexNow).
    register_rest_route($namespace, '/indexnow', [
        'methods' => 'POST',
        'callback' => 'kbseo_indexnow_submit_endpoint',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

/**
 * Serve the key. ?format=json returns metadata for the engine; otherwise the
 * raw key as text/plain (the actual IndexNow key file).
 */
function kbseo_serve_indexnow_key($request) {
    $key = kbseo_get_indexnow_key();
    if ($request->get_param('format') === 'json') {
        return [
            'ok' => true,
            'key' => $key,
            'key_location' => kbseo_indexnow_key_location(),
        ];
    }
    // Raw key file — bypass JSON encoding so the file contains ONLY the key.
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex');
    echo $key;
    exit;
}

/**
 * Submit a list of URLs to IndexNow. Returns counts. Best-effort.
 */
function kbseo_submit_to_indexnow($urls) {
    $urls = array_values(array_unique(array_filter((array) $urls)));
    if (empty($urls)) {
        return ['ok' => true, 'submitted' => 0, 'detail' => 'no urls'];
    }
    $key = kbseo_get_indexnow_key();
    $host = wp_parse_url(get_site_url(), PHP_URL_HOST);
    $body = [
        'host' => $host,
        'key' => $key,
        'keyLocation' => kbseo_indexnow_key_location(),
        'urlList' => array_slice($urls, 0, 10000),
    ];
    $res = wp_remote_post(KBSEO_INDEXNOW_ENDPOINT, [
        'timeout' => 15,
        'headers' => ['Content-Type' => 'application/json; charset=utf-8'],
        'body' => wp_json_encode($body),
    ]);
    if (is_wp_error($res)) {
        return ['ok' => false, 'submitted' => 0, 'detail' => $res->get_error_message()];
    }
    $code = wp_remote_retrieve_response_code($res);
    $ok = ($code === 200 || $code === 202);
    return [
        'ok' => $ok,
        'submitted' => $ok ? count($urls) : 0,
        'detail' => 'HTTP ' . $code,
    ];
}

function kbseo_indexnow_submit_endpoint($request) {
    $data = $request->get_json_params();
    $urls = isset($data['urls']) ? $data['urls'] : [];
    $result = kbseo_submit_to_indexnow($urls);
    return $result;
}

/**
 * Auto-submit on publish/update. Fires when a post/page becomes published.
 * Throttled per-URL via a short transient so rapid re-saves don't spam.
 */
function kbseo_indexnow_on_publish($new_status, $old_status, $post) {
    if ($new_status !== 'publish') return;
    if (!in_array($post->post_type, ['post', 'page'], true)) return;
    if (wp_is_post_revision($post->ID) || wp_is_post_autosave($post->ID)) return;

    $url = get_permalink($post->ID);
    if (!$url) return;

    $throttle_key = 'kbseo_in_' . md5($url);
    if (get_transient($throttle_key)) return;
    set_transient($throttle_key, 1, 5 * MINUTE_IN_SECONDS);

    kbseo_submit_to_indexnow([$url]);
}
add_action('transition_post_status', 'kbseo_indexnow_on_publish', 10, 3);
