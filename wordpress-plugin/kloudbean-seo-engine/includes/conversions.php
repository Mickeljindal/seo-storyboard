<?php
/**
 * Conversion attribution webhook (v1.6.0).
 *
 * console.kloudbean.com posts signup/paid events here (with the kbsrc/kbsurface
 * attribution params it received on the inbound link). Events are buffered in an
 * option so the SEO engine can pull + attribute them to the exact page that
 * drove the conversion. De-duped by external_id; buffer capped to 500.
 */

if (!defined('ABSPATH')) exit;

define('KBSEO_CONV_OPTION', 'kbseo_conversions');
define('KBSEO_CONV_MAX', 500);

function kbseo_register_conversion_routes($namespace) {
    // Inbound webhook from the console (authenticated).
    register_rest_route($namespace, '/conversion', [
        'methods' => 'POST',
        'callback' => 'kbseo_record_conversion',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    // Engine pulls the buffer (authenticated).
    register_rest_route($namespace, '/conversions', [
        'methods' => 'GET',
        'callback' => 'kbseo_list_conversions',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

function kbseo_record_conversion($request) {
    $d = $request->get_json_params();
    if (!$d || !is_array($d)) {
        return new WP_Error('invalid_body', 'JSON body required', ['status' => 400]);
    }

    $event = sanitize_text_field($d['event'] ?? 'signup');
    $allowed = ['signup', 'paid', 'lead', 'view'];
    if (!in_array($event, $allowed, true)) $event = 'signup';

    $entry = [
        'event' => $event,
        'source_slug' => isset($d['source_slug']) ? sanitize_text_field($d['source_slug']) : null,
        'source_url' => isset($d['source_url']) ? esc_url_raw($d['source_url']) : null,
        'surface' => isset($d['surface']) ? sanitize_text_field($d['surface']) : null,
        'ref' => isset($d['ref']) ? sanitize_text_field($d['ref']) : null,
        'plan' => isset($d['plan']) ? sanitize_text_field($d['plan']) : null,
        'value' => isset($d['value']) ? floatval($d['value']) : null,
        'currency' => isset($d['currency']) ? sanitize_text_field($d['currency']) : 'USD',
        'external_id' => isset($d['external_id']) ? sanitize_text_field($d['external_id']) : null,
        'occurred_at' => isset($d['occurred_at']) ? sanitize_text_field($d['occurred_at']) : gmdate('c'),
        'received_at' => gmdate('c'),
    ];

    $buf = get_option(KBSEO_CONV_OPTION, []);
    if (!is_array($buf)) $buf = [];

    // De-dupe by external_id.
    if ($entry['external_id']) {
        foreach ($buf as $e) {
            if (($e['external_id'] ?? null) === $entry['external_id']) {
                return ['ok' => true, 'duplicate' => true];
            }
        }
    }

    $buf[] = $entry;
    if (count($buf) > KBSEO_CONV_MAX) {
        $buf = array_slice($buf, -KBSEO_CONV_MAX);
    }
    update_option(KBSEO_CONV_OPTION, $buf, false);

    return ['ok' => true, 'buffered' => count($buf)];
}

function kbseo_list_conversions($request) {
    $buf = get_option(KBSEO_CONV_OPTION, []);
    if (!is_array($buf)) $buf = [];
    $since = $request->get_param('since');
    if ($since) {
        $ts = strtotime($since);
        $buf = array_values(array_filter($buf, function ($e) use ($ts) {
            return strtotime($e['received_at'] ?? $e['occurred_at'] ?? 'now') >= $ts;
        }));
    }
    return ['ok' => true, 'conversions' => $buf, 'count' => count($buf)];
}
