<?php
/**
 * Table of Contents auto-generation.
 * Parses H2/H3 headings from the content and inserts a TOC block at the top.
 */

function kbseo_insert_toc($content) {
    // Extract headings
    preg_match_all('/<h([23])[^>]*>(.*?)<\/h\1>/i', $content, $matches, PREG_SET_ORDER);
    
    if (count($matches) < 3) return $content; // Don't add TOC for very short articles
    
    $toc_items = [];
    foreach ($matches as $i => $match) {
        $level = intval($match[1]);
        $text = strip_tags($match[2]);
        $id = sanitize_title($text) . '-' . $i;
        
        // Add ID to the heading in content
        $old_heading = $match[0];
        $new_heading = preg_replace(
            '/(<h[23])([^>]*>)/i',
            '$1 id="' . esc_attr($id) . '"$2',
            $old_heading,
            1
        );
        $content = str_replace($old_heading, $new_heading, $content);
        
        $toc_items[] = [
            'level' => $level,
            'text' => $text,
            'id' => $id,
        ];
    }
    
    // Build TOC HTML
    $toc_html = '<div class="kbseo-toc" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:1.5em;margin-bottom:2em;">';
    $toc_html .= '<p style="font-weight:600;margin-bottom:0.75em;font-size:1.1em;">Table of Contents</p>';
    $toc_html .= '<ul style="list-style:none;padding:0;margin:0;">';
    
    foreach ($toc_items as $item) {
        $indent = $item['level'] === 3 ? 'padding-left:1.2em;' : '';
        $toc_html .= '<li style="margin-bottom:0.4em;' . $indent . '">';
        $toc_html .= '<a href="#' . esc_attr($item['id']) . '" style="color:#4F1AF3;text-decoration:none;">';
        $toc_html .= esc_html($item['text']);
        $toc_html .= '</a></li>';
    }
    
    $toc_html .= '</ul></div>';
    
    // Insert after the first paragraph (not before the title)
    $first_p_end = strpos($content, '</p>');
    if ($first_p_end !== false) {
        $content = substr($content, 0, $first_p_end + 4) . "\n" . $toc_html . "\n" . substr($content, $first_p_end + 4);
    } else {
        $content = $toc_html . $content;
    }
    
    return $content;
}
