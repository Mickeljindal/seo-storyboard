<?php
/**
 * AIOSEO (All in One SEO) integration.
 * Sets meta title, description, focus keyword, canonical, OG image, and schema
 * through AIOSEO's data model (aioseo_posts table), then asks AIOSEO itself to
 * recalculate the TruSEO score (writing the raw DB row does NOT trigger that;
 * AIOSEO only (re)computes seo_score through its own PHP analyzer/model layer).
 */

/**
 * Write SEO meta for a post through whichever AIOSEO API is actually available
 * on THIS site (versions differ), then trigger a real analysis so seo_score is
 * recalculated — not just the raw columns.
 */
function kbseo_set_aioseo_meta($post_id, $meta) {
    $wrote_via_model = false;

    if (function_exists('aioseo')) {
        $ao = aioseo();

        // Preferred path (AIOSEO 4.x): aioseo()->models->post($id) returns/creates
        // the Models\Post row; setting properties + ->save() runs AIOSEO's own
        // save pipeline (which is what recalculates seo_score correctly).
        if (isset($ao->models) && method_exists($ao->models, 'post')) {
            try {
                $model = $ao->models->post($post_id);
                if ($model) {
                    if (isset($meta['title']) && $meta['title'] !== '') $model->title = $meta['title'];
                    if (isset($meta['description']) && $meta['description'] !== '') $model->description = $meta['description'];
                    if (!empty($meta['focus_keyword'])) {
                        $model->keyphrases = json_encode([
                            'focus' => ['keyphrase' => $meta['focus_keyword']],
                            'additional' => [],
                        ]);
                    }
                    if (!empty($meta['canonical'])) $model->canonical_url = $meta['canonical'];
                    if (!empty($meta['og_image'])) {
                        $model->og_image_custom_url = $meta['og_image'];
                        $model->og_image_type = 'custom';
                    }
                    if (!empty($meta['schema'])) {
                        $model->schema = json_encode(['blockGraphs' => [], 'graphs' => [], 'customGraphs' => $meta['schema']]);
                    }
                    $model->save();
                    $wrote_via_model = true;
                }
            } catch (\Throwable $e) {
                // fall through to raw SQL below
                error_log('[kbseo] aioseo model save failed: ' . $e->getMessage());
            }
        }
    }

    // Fallback / belt-and-suspenders: also write the raw row directly so the
    // data is never lost even if the model API above isn't available on this
    // AIOSEO version.
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

    // Finally: ask AIOSEO to actually (re)run its own TruSEO analysis for this
    // post so `seo_score` gets recalculated. This is the step that was missing
    // before — writing the row alone never triggers AIOSEO's own analyzer.
    kbseo_trigger_aioseo_analysis($post_id);

    return true;
}

/**
 * Force AIOSEO to recompute its TruSEO score for a post right now, using
 * whichever mechanism is available on this AIOSEO install. Best-effort: never
 * throws, since this is a "nice to have" — the meta itself is already saved.
 *
 * SAFETY: this MUST NOT make an HTTP request back to the same site (a
 * wp_remote_post() loopback to the site's own REST API). On hosting with a
 * limited number of PHP workers, that creates a self-deadlock — the request
 * that's saving the post holds a worker open waiting on its own HTTP call,
 * which needs a free worker to run, so the whole site can stop responding
 * once enough of these stack up. In-process calls only, ever.
 */
function kbseo_trigger_aioseo_analysis($post_id) {
    if (!function_exists('aioseo')) return false;
    $ao = aioseo();

    // Only path: call an in-process method on AIOSEO's own Post model, if one
    // exists on this AIOSEO version. No HTTP, no new class instantiation of
    // internal API controllers (those aren't public API and may have
    // constructor/permission requirements we can't safely replicate).
    try {
        if (isset($ao->models) && method_exists($ao->models, 'post')) {
            $model = $ao->models->post($post_id);
            foreach (['runAnalyzer', 'analyze', 'refreshScore', 'updateSeoScore'] as $m) {
                if ($model && method_exists($model, $m)) {
                    $model->$m();
                    return true;
                }
            }
        }
    } catch (\Throwable $e) {
        error_log('[kbseo] aioseo analyzer fallback failed: ' . $e->getMessage());
    }

    return false;
}

/**
 * DIAGNOSTIC (temporary): dumps what's actually available for the AIOSEO
 * integration on this specific site/version, so mismatches can be fixed from
 * real data instead of guessing. Auth-gated like every other kbseo endpoint.
 */
function kbseo_aioseo_diagnose($post_id) {
    $out = [
        'aioseo_function_exists' => function_exists('aioseo'),
        'aioseo_class_exists' => class_exists('\AIOSEO\Plugin\Common\Api\Post'),
    ];
    if (function_exists('aioseo')) {
        $ao = aioseo();
        $out['aioseo_top_level_props'] = array_keys(get_object_vars($ao));

        // Inspect the objects that actually exist on THIS version, so we can
        // find the real way to (a) fetch a Post object for $post_id and
        // (b) trigger its analyzer, instead of guessing property names.
        foreach (['postSettings', 'core', 'standalone', 'seoAnalysis', 'cache', 'main', 'helpers'] as $prop) {
            if (isset($ao->$prop)) {
                $out["{$prop}_class"] = get_class($ao->$prop);
                $out["{$prop}_methods"] = get_class_methods($ao->$prop);
            }
        }

        // Try postSettings->post($id) or similar accessor patterns.
        foreach (['postSettings', 'core'] as $prop) {
            if (!isset($ao->$prop)) continue;
            foreach (['post', 'get', 'getPost'] as $m) {
                if (method_exists($ao->$prop, $m)) {
                    try {
                        $obj = $ao->$prop->$m($post_id);
                        if ($obj) {
                            $out["{$prop}_{$m}_result_class"] = get_class($obj);
                            $out["{$prop}_{$m}_result_methods"] = get_class_methods($obj);
                            $out["{$prop}_{$m}_result_props"] = array_keys(get_object_vars($obj));
                        }
                    } catch (\Throwable $e) {
                        $out["{$prop}_{$m}_error"] = $e->getMessage();
                    }
                }
            }
        }

        if (isset($ao->core) && isset($ao->core->db)) {
            $out['core_db_class'] = get_class($ao->core->db);
        }

        if (isset($ao->meta)) {
            $out['meta_methods'] = get_class_methods($ao->meta);
        }
        if (isset($ao->seoAnalysis)) {
            $out['seoAnalysis_methods'] = get_class_methods($ao->seoAnalysis);
        }
    }
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';
    $out['table_exists'] = (bool) $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($out['table_exists']) {
        $out['table_columns'] = $wpdb->get_col("DESCRIBE {$table}", 0);
        $out['row'] = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE post_id = %d", $post_id), ARRAY_A);
    }
    return $out;
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
