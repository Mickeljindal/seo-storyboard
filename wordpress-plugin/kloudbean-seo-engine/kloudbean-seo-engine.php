<?php
/**
 * Plugin Name: Kloudbean SEO Engine
 * Plugin URI: https://kloudbean.com
 * Description: Full WordPress control for the Kloudbean autonomous SEO engine. Handles AIOSEO meta, featured images, categories, internal link injection, TOC, sitemap pings, on-page SEO automation, and Elementor-native tool pages.
 * Version: 1.6.0
 * Author: Kloudbean
 * Author URI: https://kloudbean.com
 * License: Proprietary
 * Requires PHP: 7.4
 * Requires at least: 5.8
 */

if (!defined('ABSPATH')) exit;

define('KBSEO_VERSION', '1.6.0');
define('KBSEO_PLUGIN_DIR', plugin_dir_path(__FILE__));

// Load modules
require_once KBSEO_PLUGIN_DIR . 'includes/auth.php';
require_once KBSEO_PLUGIN_DIR . 'includes/api.php';
require_once KBSEO_PLUGIN_DIR . 'includes/aioseo.php';
require_once KBSEO_PLUGIN_DIR . 'includes/images.php';
require_once KBSEO_PLUGIN_DIR . 'includes/taxonomy.php';
require_once KBSEO_PLUGIN_DIR . 'includes/internal-links.php';
require_once KBSEO_PLUGIN_DIR . 'includes/toc.php';
require_once KBSEO_PLUGIN_DIR . 'includes/sitemap.php';
require_once KBSEO_PLUGIN_DIR . 'includes/audit.php';
require_once KBSEO_PLUGIN_DIR . 'includes/tools.php';
require_once KBSEO_PLUGIN_DIR . 'includes/indexing.php';
require_once KBSEO_PLUGIN_DIR . 'includes/entity.php';
require_once KBSEO_PLUGIN_DIR . 'includes/conversions.php';

// Register REST API routes on init
add_action('rest_api_init', 'kbseo_register_routes');

// Admin settings page
add_action('admin_menu', function() {
    add_options_page(
        'Kloudbean SEO Engine',
        'KB SEO Engine',
        'manage_options',
        'kloudbean-seo-engine',
        'kbseo_settings_page'
    );
});

function kbseo_settings_page() {
    $api_key = get_option('kbseo_api_key', '');
    $engine_url = get_option('kbseo_engine_url', '');
    
    if (isset($_POST['kbseo_save']) && wp_verify_nonce($_POST['_wpnonce'], 'kbseo_settings')) {
        update_option('kbseo_api_key', sanitize_text_field($_POST['kbseo_api_key']));
        update_option('kbseo_engine_url', esc_url_raw($_POST['kbseo_engine_url']));
        $api_key = get_option('kbseo_api_key');
        $engine_url = get_option('kbseo_engine_url');
        echo '<div class="updated"><p>Settings saved.</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>Kloudbean SEO Engine</h1>
        <p>Connect this WordPress site to your Kloudbean SEO Engine instance for fully automated publishing, on-page SEO, and internal linking.</p>
        <form method="POST">
            <?php wp_nonce_field('kbseo_settings'); ?>
            <table class="form-table">
                <tr>
                    <th>API Key</th>
                    <td>
                        <input type="text" name="kbseo_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" />
                        <p class="description">Set this same key in your engine's .env as <code>WP_PLUGIN_API_KEY</code>. The engine uses it to authenticate requests.</p>
                    </td>
                </tr>
                <tr>
                    <th>Engine URL</th>
                    <td>
                        <input type="url" name="kbseo_engine_url" value="<?php echo esc_attr($engine_url); ?>" class="regular-text" placeholder="https://your-engine.kloudbean.com" />
                        <p class="description">The URL where your SEO Engine is hosted (for bidirectional communication).</p>
                    </td>
                </tr>
            </table>
            <p class="submit">
                <input type="submit" name="kbseo_save" class="button-primary" value="Save Settings" />
            </p>
        </form>
        <hr />
        <h2>Status</h2>
        <ul>
            <li><strong>Plugin version:</strong> <?php echo KBSEO_VERSION; ?></li>
            <li><strong>AIOSEO detected:</strong> <?php echo function_exists('aioseo') ? '✅ Yes' : '❌ Not installed'; ?></li>
            <li><strong>REST endpoint:</strong> <code><?php echo rest_url('kbseo/v1/health'); ?></code></li>
            <li><strong>API key set:</strong> <?php echo $api_key ? '✅' : '❌ Not configured'; ?></li>
        </ul>
    </div>
    <?php
}

// Activation hook — create options
register_activation_hook(__FILE__, function() {
    if (!get_option('kbseo_api_key')) {
        update_option('kbseo_api_key', wp_generate_password(32, false));
    }
});
