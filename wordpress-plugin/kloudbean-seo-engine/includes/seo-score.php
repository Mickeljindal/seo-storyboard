<?php
/**
 * REAL on-page SEO + readability score — a TruSEO-equivalent computed entirely
 * in this plugin, NO AIOSEO Pro license required.
 *
 * WHY: AIOSEO's 0-100 score is Pro-gated (its /analyze endpoint returns
 * "No license or token provided" on Lite). But that score is nothing magic —
 * it's a weighted checklist of standard on-page factors + a readability pass,
 * all computable from the post's own title/meta/content. This module reproduces
 * the genuinely useful half of that analysis (the part that actually reflects
 * SEO quality) and skips the marketing-fluff checks vendors add to justify an
 * upsell (keyword-in-"power-words", title "sentiment", etc.).
 *
 * What it produces for any post/page:
 *   - seo_score (0-100): weighted on-page factors vs the focus keyword.
 *   - readability_score (0-100): Flesch + sentence/paragraph/subheading/passive
 *     analysis.
 *   - checks[]: each factor with status (good|ok|bad), weight, detail, and an
 *     actionable recommendation — so the dashboard can tell the user exactly
 *     what to fix, like Pro does.
 *
 * It works on Elementor pages (extracts the real content out of _elementor_data
 * HTML/heading/text widgets) as well as classic posts, persists the result to
 * post meta (+ best-effort into aioseo_posts.seo_score), and surfaces it as a
 * sortable "SEO" column in the wp-admin Posts and Pages lists.
 */

if (!defined('ABSPATH')) exit;

/* =========================================================================
 * Content extraction
 * ========================================================================= */

/**
 * Build an HTML string representing a post's real body content — handles both
 * Elementor pages (walk _elementor_data: html widgets keep their markup,
 * heading widgets become <hN>, text-editor widgets keep their HTML) and
 * classic posts (post_content). This is what all the checks analyze, so the
 * score reflects what's ACTUALLY on the page, not an empty post_content.
 */
function kbseo_extract_post_html($post) {
    $edit_mode = get_post_meta($post->ID, '_elementor_edit_mode', true);
    if ($edit_mode === 'builder') {
        $raw = get_post_meta($post->ID, '_elementor_data', true);
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $parts = [];
                kbseo_collect_elementor_html($decoded, $parts);
                if (!empty($parts)) return implode("\n", $parts);
            }
        }
    }
    return (string) $post->post_content;
}

/** Recursively collect renderable HTML from an Elementor element tree. */
function kbseo_collect_elementor_html($elements, &$parts) {
    if (!is_array($elements)) return;
    foreach ($elements as $el) {
        if (!is_array($el)) continue;
        if (($el['elType'] ?? '') === 'widget') {
            $type = $el['widgetType'] ?? '';
            $s = $el['settings'] ?? [];
            if ($type === 'html' && !empty($s['html'])) {
                $parts[] = (string) $s['html'];
            } elseif ($type === 'heading' && !empty($s['title'])) {
                $size = strtolower((string) ($s['header_size'] ?? 'h2'));
                if (!preg_match('/^h[1-6]$/', $size)) $size = 'h2';
                $parts[] = "<{$size}>" . $s['title'] . "</{$size}>";
            } elseif (($type === 'text-editor' || $type === 'theme-post-content') && !empty($s['editor'])) {
                $parts[] = (string) $s['editor'];
            }
        }
        if (!empty($el['elements']) && is_array($el['elements'])) {
            kbseo_collect_elementor_html($el['elements'], $parts);
        }
    }
}

/** Plain visible text from HTML (scripts/styles removed). */
function kbseo_visible_text($html) {
    $t = preg_replace('/<script\b[^>]*>.*?<\/script>/is', ' ', (string) $html);
    $t = preg_replace('/<style\b[^>]*>.*?<\/style>/is', ' ', $t);
    $t = wp_strip_all_tags($t);
    $t = html_entity_decode($t, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/', ' ', $t));
}

/* =========================================================================
 * Linguistic helpers (for readability)
 * ========================================================================= */

/** Split text into sentences (good-enough heuristic). */
function kbseo_sentences($text) {
    $parts = preg_split('/(?<=[.!?])\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY);
    return array_values(array_filter($parts, function ($s) {
        return str_word_count($s) > 0;
    }));
}

/** Heuristic syllable count for a word (English). */
function kbseo_syllables($word) {
    $word = strtolower(preg_replace('/[^a-z]/i', '', $word));
    if ($word === '') return 0;
    if (strlen($word) <= 3) return 1;
    $word = preg_replace('/(?:[^laeiouy]es|ed|[^laeiouy]e)$/', '', $word);
    $word = preg_replace('/^y/', '', $word);
    preg_match_all('/[aeiouy]{1,2}/', $word, $m);
    $count = count($m[0]);
    return max(1, $count);
}

/**
 * Flesch Reading Ease (0-100+, higher = easier). Standard formula:
 * 206.835 - 1.015*(words/sentences) - 84.6*(syllables/word).
 */
function kbseo_flesch($text) {
    $sentences = kbseo_sentences($text);
    $numSentences = max(1, count($sentences));
    $words = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
    $numWords = count($words);
    if ($numWords < 1) return 0;
    $syllables = 0;
    foreach ($words as $w) $syllables += kbseo_syllables($w);
    $score = 206.835 - 1.015 * ($numWords / $numSentences) - 84.6 * ($syllables / $numWords);
    return round(max(0, min(120, $score)), 1);
}

// Common English transition words/phrases — their presence is a strong
// readability signal (guides the reader through the argument).
// NOTE: 'moreover' and 'furthermore' were removed on purpose — they read as
// AI-cliché transitions and are penalized by the human-voice check below, so we
// must not also reward them here.
const KBSEO_TRANSITIONS = [
    'however', 'therefore', 'in addition', 'for example',
    'for instance', 'as a result', 'consequently', 'on the other hand', 'in contrast',
    'meanwhile', 'similarly', 'likewise', 'in fact', 'above all', 'in short', 'to summarize',
    'first', 'second', 'third', 'finally', 'next', 'then', 'because', 'although', 'instead',
    'that is', 'in other words', 'notably', 'specifically', 'overall', 'by comparison',
];

/** Rough passive-voice detector: "was/were/is/are/been + past participle". */
function kbseo_passive_ratio($sentences) {
    if (empty($sentences)) return 0;
    $passive = 0;
    foreach ($sentences as $s) {
        if (preg_match('/\b(?:was|were|is|are|been|being|be)\b\s+(?:\w+ly\s+)?\w+(?:ed|en)\b/i', $s)) {
            $passive++;
        }
    }
    return $passive / count($sentences);
}

// AI-writing "tells": clichés and filler that make copy read as machine-generated.
// Kept in sync with the engine's content scorecard so the WP score and the
// generator pull in the SAME direction (human voice, not AI slop).
const KBSEO_AI_TELL_PHRASES = [
    "in today's digital", "in the world of", "in the realm of", "when it comes to",
    "it's worth noting", "it is worth noting", "needless to say", "moreover", "furthermore",
    "in conclusion", "to sum up", "delve", "dive into", "diving into", "embark",
    "seamless", "seamlessly", "robust", "tailored to your", "unlock", "unleash", "elevate your",
    "game-changer", "game changer", "cutting-edge", "state-of-the-art", "harness the", "empower",
    "streamline your", "at the end of the day", "the bottom line", "plethora", "myriad",
    "a testament to", "in essence", "rest assured", "look no further", "let's dive", "let's explore",
    "navigating the", "ever-evolving", "fast-paced world",
];

/** AI-tell phrases present in the text (deduped). */
function kbseo_ai_tell_hits($text) {
    $lc = strtolower($text);
    $hits = [];
    foreach (KBSEO_AI_TELL_PHRASES as $p) {
        if (strpos($lc, $p) !== false) $hits[] = $p;
    }
    return array_values(array_unique($hits));
}

/** Em-dashes (U+2014) per 1000 words — the #1 AI-writing tell, want near zero. */
function kbseo_em_dash_per_1000($text, $words) {
    $count = preg_match_all('/\x{2014}/u', $text);
    if (!$count) $count = 0;
    return $words > 0 ? ($count / $words) * 1000 : 0;
}

// Claim shapes that are essentially never honest: self-directed superlatives,
// empty marketing absolutes, borrowed authority, and fabricated first-party
// evidence. A published page carrying one of these is a credibility problem the
// moment a reader checks it, so this is scored as a hard fail rather than a nudge.
//
// Kept in sync with CLAIM_INTEGRITY_PATTERNS in src/lib/content-scorecard.ts,
// STRATEGY_CONTRACT in src/lib/content-engine.ts, and section 6 of
// .kiro/steering/seo-operating-system.md. Change one, change all four.
//
// VALIDATED: this exact set was run against all 288 articles in content-studio
// and matched none of them, so it does not fire on ordinary technical prose.
// Two candidates were deliberately REMOVED after testing because they only ever
// produced false positives:
//   "unmatched"  -> nginx/router terminology ("unmatched requests", "unmatched routes")
//   "unbeatable" -> legitimate rhetoric ("looks unbeatable until you count the evenings")
// If you add a pattern, test it against the library first. A check that mostly
// cries wolf teaches everyone to ignore the score.
const KBSEO_CLAIM_INTEGRITY_PATTERNS = [
    'self-superlative' => '/\b(?:kloudbean|we|our\s+platform|our\s+hosting)\s+(?:is|are|remains?|offers?)\s+(?:the\s+)?(?:best|fastest|most\s+(?:secure|reliable|affordable|powerful|advanced))\b/i',
    'marketing absolute' => '/\b(?:industry[-\s]leading|world[-\s]class|best[-\s]in[-\s]class|award[-\s]winning|second\s+to\s+none)\b/i',
    'market-wide claim' => '/\bno\s+other\s+(?:host|provider|platform)\b/i',
    'borrowed authority' => '/\b(?:official(?:ly)?\s+(?:partner|certified|endorsed)|in\s+partnership\s+with|certified\s+by|endorsed\s+by)\b/i',
    'fabricated evidence' => '/\b(?:our|internal)\s+(?:benchmarks?|tests?|research|data|study|studies)\s+(?:show|shows|showed|found|prove|proves|indicate)\b/i',
    'unsourced metric' => '/\b(?:kloudbean|our\s+customers?|our\s+users?)\b[^.]{0,70}\b\d{1,3}(?:\.\d+)?%\s*(?:faster|cheaper|less|more|improvement|reduction|savings?)\b/i',
    'unresolved marker' => '/\[VERIFY[^\]]*\]/i',
];

// Sentence context that makes a flagged phrase a denial or a caveat rather than
// a claim. Auditing the 288-article library showed why this is mandatory: every
// single real hit was of this kind, e.g. "no host can make you PCI compliant" or
// the FAQ question "Is Kloudbean SOC 2 certified?" answered with a plain no.
// Scoring those as failures would push an editor to delete the honest sentence.
const KBSEO_NEGATION_CUES = '/\b(?:no|not|never|nobody|none|neither|nor|without|cannot|can\'t|won\'t|wouldn\'t|isn\'t|aren\'t|doesn\'t|don\'t|didn\'t|hasn\'t|haven\'t|myth|misconception|instead\s+of|rather\s+than)\b/i';

/**
 * Claim-integrity violations present in the text (returns the labels that matched).
 *
 * Evaluated per sentence. A match is excused when the sentence is a question or
 * when a negation cue sits OUTSIDE the matched span. The "outside" part matters:
 * a pattern containing its own cue would otherwise always excuse itself.
 */
function kbseo_claim_integrity_hits($text) {
    $sentences = preg_split('/(?<=[.!?])\s+/', $text) ?: [];
    $hits = [];
    foreach (KBSEO_CLAIM_INTEGRITY_PATTERNS as $label => $re) {
        foreach ($sentences as $s) {
            if (!preg_match($re, $s, $m)) continue;
            if (preg_match('/\?\s*$/', trim($s))) continue;
            $outside = str_replace($m[0], ' ', $s);
            if (preg_match(KBSEO_NEGATION_CUES, $outside)) continue;
            $hits[] = $label;
            break;
        }
    }
    return $hits;
}

/* =========================================================================
 * Scoring
 * ========================================================================= */

/**
 * Compute the full on-page SEO + readability analysis for a post.
 * $focus_keyword optional — falls back to the AIOSEO focus keyphrase.
 */
function kbseo_compute_seo_score($post, $focus_keyword = null) {
    if (is_numeric($post)) $post = get_post(intval($post));
    if (!$post) return null;

    $meta = function_exists('kbseo_get_aioseo_meta') ? kbseo_get_aioseo_meta($post->ID) : [];
    $focus = trim((string) ($focus_keyword !== null && $focus_keyword !== '' ? $focus_keyword : ($meta['focus_keyword'] ?? '')));
    $focusLc = strtolower($focus);

    $meta_title = (string) ($meta['title'] ?? '');
    $meta_desc = (string) ($meta['description'] ?? '');
    if ($meta_title === '') $meta_title = get_the_title($post);

    $html = kbseo_extract_post_html($post);
    $text = kbseo_visible_text($html);
    $textLc = strtolower($text);
    $words = str_word_count($text);
    $slug = $post->post_name;

    // First paragraph / intro (first ~160 words if no <p>).
    $intro = '';
    if (preg_match('/<p[^>]*>(.*?)<\/p>/is', $html, $pm)) {
        $intro = kbseo_visible_text($pm[1]);
    }
    if ($intro === '') $intro = implode(' ', array_slice(explode(' ', $text), 0, 60));
    $introLc = strtolower($intro);

    // Headings.
    preg_match_all('/<h1[^>]*>(.*?)<\/h1>/is', $html, $h1m);
    preg_match_all('/<h([2-3])[^>]*>(.*?)<\/h\1>/is', $html, $h23m);
    $h1_text = strtolower(kbseo_visible_text(implode(' ', $h1m[1] ?? [])));
    $subheads = array_map('kbseo_visible_text', $h23m[2] ?? []);
    $subheadCount = count($subheads);
    $subheadJoinedLc = strtolower(implode(' ', $subheads));

    // Links.
    $site_host = parse_url(get_site_url(), PHP_URL_HOST);
    preg_match_all('/<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>/i', $html, $links);
    $internal = 0; $external = 0;
    foreach (($links[1] ?? []) as $href) {
        if (strpos($href, '#') === 0 || $href === '' || $href === '/') continue;
        $host = parse_url($href, PHP_URL_HOST);
        if (!$host || $host === $site_host) $internal++;
        elseif (preg_match('/^https?:/i', $href)) $external++;
    }

    // Images + alt.
    preg_match_all('/<img\b[^>]*>/i', $html, $imgs);
    $imgCount = count($imgs[0] ?? []);
    $imgNoAlt = 0;
    foreach (($imgs[0] ?? []) as $img) {
        if (!preg_match('/\balt=["\'][^"\']+["\']/i', $img)) $imgNoAlt++;
    }

    $hasSchema = (bool) preg_match('/application\/ld\+json/i', $html) || !empty($meta['schema']);

    // E-E-A-T signals: does the page's structured data name an author + a
    // publisher? Check both our stored graph and any inline JSON-LD.
    $eeatSource = '';
    $schemaRaw = get_post_meta($post->ID, '_kbseo_schema', true);
    if (!empty($schemaRaw)) {
        $eeatSource .= is_string($schemaRaw) ? wp_unslash($schemaRaw) : wp_json_encode($schemaRaw);
    }
    if (preg_match_all('/<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/is', $html, $ldm)) {
        $eeatSource .= ' ' . implode(' ', $ldm[1]);
    }
    $hasAuthor = stripos($eeatSource, '"author"') !== false;
    $hasPublisher = stripos($eeatSource, '"publisher"') !== false;

    // Keyword density.
    $density = 0.0;
    if ($focusLc !== '' && $words > 0) {
        $occ = substr_count($textLc, $focusLc);
        $density = round(($occ * max(1, str_word_count($focus))) / $words * 100, 2);
    }

    // ---- Weighted on-page checks --------------------------------------------
    // Each: [id, label, weight, status(good=full|ok=half|bad=0), detail, rec]
    $checks = [];
    $add = function ($id, $label, $weight, $status, $detail, $rec) use (&$checks) {
        $checks[] = compact('id', 'label', 'weight', 'status', 'detail', 'rec');
    };

    if ($focus === '') {
        $add('focus_keyword', 'Focus keyword set', 12, 'bad', 'none', 'Set a focus keyword so the page can be optimized around it.');
    } else {
        $add('focus_keyword', 'Focus keyword set', 6, 'good', $focus, '');
        $add('kw_in_title', 'Keyword in SEO title', 12,
            (strpos(strtolower($meta_title), $focusLc) !== false) ? 'good' : 'bad',
            $meta_title, 'Put the focus keyword in the SEO title, ideally near the front.');
        $add('kw_in_meta_desc', 'Keyword in meta description', 8,
            (strpos(strtolower($meta_desc), $focusLc) !== false) ? 'good' : 'bad',
            ($meta_desc === '' ? 'no description' : 'present'), 'Include the focus keyword once in the meta description.');
        $add('kw_in_intro', 'Keyword in intro', 8,
            ($introLc !== '' && strpos($introLc, $focusLc) !== false) ? 'good' : 'bad',
            '', 'Mention the focus keyword in the first paragraph.');
        $add('kw_in_heading', 'Keyword in a heading', 7,
            (($h1_text !== '' && strpos($h1_text, $focusLc) !== false) || strpos($subheadJoinedLc, $focusLc) !== false) ? 'good' : 'bad',
            '', 'Use the focus keyword in the H1 or a subheading.');
        $add('kw_in_slug', 'Keyword in URL slug', 6,
            (strpos(str_replace('-', ' ', $slug), str_replace('-', ' ', $focusLc)) !== false
                || strpos($slug, sanitize_title($focus)) !== false) ? 'good' : 'ok',
            $slug, 'Where possible, include the keyword in the URL slug (do NOT change a slug that already ranks).');
        $densOk = $density >= 0.4 && $density <= 2.5;
        $add('kw_density', 'Keyword density 0.4–2.5%', 8,
            $densOk ? 'good' : ($density > 0 ? 'ok' : 'bad'),
            $density . '%', $density > 2.5 ? 'Reduce keyword repetition — it reads as stuffing.' : 'Use the keyword (and close variants) a few more times naturally.');
    }

    $tlen = strlen($meta_title);
    $add('title_length', 'SEO title length 30–60', 8,
        ($tlen >= 30 && $tlen <= 60) ? 'good' : (($tlen >= 20 && $tlen <= 65) ? 'ok' : 'bad'),
        $tlen . ' chars', 'Aim for a 30–60 character SEO title so it isn’t truncated in results.');

    $dlen = strlen($meta_desc);
    $add('desc_length', 'Meta description length 70–160', 8,
        ($dlen >= 70 && $dlen <= 160) ? 'good' : (($dlen >= 50 && $dlen <= 175) ? 'ok' : 'bad'),
        $dlen . ' chars', $dlen === 0 ? 'Write a 70–160 character meta description with the keyword and a reason to click.' : 'Tune the meta description to 70–160 characters.');

    // Content length — a tool PAGE needs less prose than an article.
    $isPage = ($post->post_type === 'page');
    $minWords = $isPage ? 250 : 600;
    $goodWords = $isPage ? 350 : 900;
    $add('content_length', "Content length ≥ {$goodWords} words", 8,
        ($words >= $goodWords) ? 'good' : ($words >= $minWords ? 'ok' : 'bad'),
        $words . ' words', "Add genuinely useful content — aim for ≥ {$goodWords} words of substance.");

    $add('internal_links', 'Internal links (≥1)', 6,
        ($internal >= 3 ? 'good' : ($internal >= 1 ? 'ok' : 'bad')),
        (string) $internal, 'Link to related pages/guides on your own site (topical authority).');

    $add('external_links', 'Outbound reference links', 4,
        ($external >= 1 ? 'good' : 'bad'),
        (string) $external, 'Cite at least one authoritative external source where relevant.');

    if ($imgCount > 0) {
        $add('image_alt', 'All images have alt text', 5,
            ($imgNoAlt === 0 ? 'good' : 'bad'),
            $imgNoAlt . ' missing', 'Add descriptive alt text to every image.');
    } else {
        $add('image_alt', 'Has at least one image', 3, 'ok', 'no images',
            'Consider adding a relevant image or diagram (optional for pure tools).');
    }

    $add('schema', 'Structured data (JSON-LD)', 6,
        $hasSchema ? 'good' : 'bad', $hasSchema ? 'present' : 'none',
        'Add JSON-LD schema (SoftwareApplication/FAQPage/Article) for rich results + AI citations.');

    $add('eeat', 'Author + publisher (E-E-A-T)', 5,
        ($hasAuthor && $hasPublisher) ? 'good' : (($hasAuthor || $hasPublisher) ? 'ok' : 'bad'),
        trim(($hasAuthor ? 'author ' : '') . ($hasPublisher ? 'publisher' : '')) ?: 'none',
        'Name an author and a publisher (Organization) in the page schema — re-optimize the page to inject these E-E-A-T signals.');

    // Claim integrity. Weighted high and scored 'bad' on any hit, with no partial
    // 'ok' tier, because these are truthfulness failures rather than optimisation
    // opportunities. A page that says "industry-leading" or cites a benchmark we
    // never ran is not 80% correct.
    $claimHits = kbseo_claim_integrity_hits($text);
    $add('claim_integrity', 'No unverifiable or fabricated claims', 12,
        empty($claimHits) ? 'good' : 'bad',
        empty($claimHits) ? 'clean' : implode(', ', $claimHits),
        'Remove the flagged claim(s). Replace a superlative with the specific checkable reason a reader would choose this, drop empty absolutes, and never cite research, a partnership, or a percentage that is not in the approved product-truth source. Resolve any [VERIFY...] marker before publishing.');

    // ---- Readability checks -------------------------------------------------
    $sentences = kbseo_sentences($text);
    $numSentences = max(1, count($sentences));
    $flesch = kbseo_flesch($text);
    $longSentences = 0;
    foreach ($sentences as $s) if (str_word_count($s) > 25) $longSentences++;
    $longRatio = $longSentences / $numSentences;
    $transitionHits = 0;
    foreach ($sentences as $s) {
        $sl = strtolower($s);
        foreach (KBSEO_TRANSITIONS as $t) {
            if (strpos($sl, $t) !== false) { $transitionHits++; break; }
        }
    }
    $transitionRatio = $transitionHits / $numSentences;
    $passiveRatio = kbseo_passive_ratio($sentences);
    $wordsPerHeading = $subheadCount > 0 ? $words / max(1, $subheadCount) : $words;

    $rchecks = [];
    $radd = function ($id, $label, $weight, $status, $detail, $rec) use (&$rchecks) {
        $rchecks[] = compact('id', 'label', 'weight', 'status', 'detail', 'rec');
    };
    $radd('flesch', 'Flesch reading ease', 30,
        ($flesch >= 60 ? 'good' : ($flesch >= 45 ? 'ok' : 'bad')),
        (string) $flesch, 'Shorten sentences and use simpler words — aim for 60+ (plain English).');
    $radd('sentence_length', 'Sentences ≤ 25 words', 20,
        ($longRatio <= 0.15 ? 'good' : ($longRatio <= 0.30 ? 'ok' : 'bad')),
        round($longRatio * 100) . '% long', 'Break up long sentences; keep most under ~25 words.');
    $radd('subheadings', 'A subheading every ~300 words', 20,
        ($wordsPerHeading <= 300 ? 'good' : ($wordsPerHeading <= 450 ? 'ok' : 'bad')),
        round($wordsPerHeading) . ' words/heading', 'Add more H2/H3 subheadings to break up the text.');
    $radd('transitions', 'Uses transition words', 15,
        ($transitionRatio >= 0.30 ? 'good' : ($transitionRatio >= 0.20 ? 'ok' : 'bad')),
        round($transitionRatio * 100) . '%', 'Use more transition words (however, because, for example) to connect ideas.');
    $radd('passive_voice', 'Limited passive voice', 15,
        ($passiveRatio <= 0.10 ? 'good' : ($passiveRatio <= 0.20 ? 'ok' : 'bad')),
        round($passiveRatio * 100) . '%', 'Rewrite passive sentences in the active voice where you can.');

    // Human voice: AI-tell phrases + em-dash density (kept in sync with the engine
    // scorecard). This is what stops published copy reading like AI slop.
    $aiHits = kbseo_ai_tell_hits($text);
    $numAiHits = count($aiHits);
    $radd('human_voice', 'No AI-cliche phrases', 20,
        ($numAiHits === 0 ? 'good' : ($numAiHits <= 2 ? 'ok' : 'bad')),
        $numAiHits ? implode(', ', array_slice($aiHits, 0, 4)) : 'clean',
        'Remove AI-cliche phrases (for example "moreover", "seamless", "when it comes to") and write the point plainly.');

    $emPer1000 = kbseo_em_dash_per_1000($text, $words);
    $radd('em_dashes', 'Near-zero em-dashes', 15,
        ($emPer1000 <= 1.5 ? 'good' : ($emPer1000 <= 4.0 ? 'ok' : 'bad')),
        round($emPer1000, 1) . ' per 1000 words',
        'Swap em-dashes for commas, periods, or parentheses. They are the biggest tell that copy was AI-written.');

    $statusVal = function ($s) { return $s === 'good' ? 1.0 : ($s === 'ok' ? 0.5 : 0.0); };
    $weighted = function ($list) use ($statusVal) {
        $earned = 0; $possible = 0;
        foreach ($list as $c) { $possible += $c['weight']; $earned += $c['weight'] * $statusVal($c['status']); }
        return $possible > 0 ? (int) round($earned / $possible * 100) : 0;
    };

    $seo_score = $weighted($checks);
    $readability_score = $weighted($rchecks);

    return [
        'post_id' => $post->ID,
        'title' => get_the_title($post),
        'url' => get_permalink($post->ID),
        'focus_keyword' => $focus,
        'seo_score' => $seo_score,
        'readability_score' => $readability_score,
        'word_count' => $words,
        'checks' => $checks,
        'readability_checks' => $rchecks,
        'stats' => [
            'flesch' => $flesch,
            'internal_links' => $internal,
            'external_links' => $external,
            'images' => $imgCount,
            'images_missing_alt' => $imgNoAlt,
            'keyword_density' => $density,
            'subheadings' => $subheadCount,
            'has_schema' => $hasSchema,
            'meta_title_len' => $tlen,
            'meta_desc_len' => $dlen,
        ],
    ];
}

/**
 * Return the stored score if it's still fresh (computed at/after the post's
 * last modification), otherwise compute + store it once. Keeps list endpoints
 * fast (compute happens at most once per page until the page changes) while
 * still self-populating real scores. Returns ['seo'=>int, 'readability'=>int].
 */
function kbseo_get_or_compute_score($post) {
    $stored = get_post_meta($post->ID, '_kbseo_seo_score', true);
    $updated = get_post_meta($post->ID, '_kbseo_score_updated', true);
    $modified = $post->post_modified_gmt ? strtotime($post->post_modified_gmt . ' UTC') : 0;
    $stale = !$updated || (strtotime($updated) < $modified);
    if ($stored !== '' && !$stale) {
        return [
            'seo' => intval($stored),
            'readability' => intval(get_post_meta($post->ID, '_kbseo_readability_score', true) ?: 0),
        ];
    }
    $a = kbseo_compute_seo_score($post);
    if (!$a) return ['seo' => null, 'readability' => null];
    kbseo_store_seo_score($post->ID, $a);
    return ['seo' => $a['seo_score'], 'readability' => $a['readability_score']];
}

/** Persist the computed scores so wp-admin + the dashboard can read them. */
function kbseo_store_seo_score($post_id, $analysis) {
    if (!$analysis) return;
    update_post_meta($post_id, '_kbseo_seo_score', intval($analysis['seo_score']));
    update_post_meta($post_id, '_kbseo_readability_score', intval($analysis['readability_score']));
    update_post_meta($post_id, '_kbseo_score_updated', current_time('mysql'));

    // Best-effort: mirror into AIOSEO's own column so, if its UI shows a stored
    // score, it shows OURS (the Pro gate is only on RECALCULATION, not display).
    global $wpdb;
    $table = $wpdb->prefix . 'aioseo_posts';
    $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if ($exists) {
        $has_row = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE post_id = %d", $post_id));
        if ($has_row) {
            $wpdb->update($table, ['seo_score' => intval($analysis['seo_score'])], ['post_id' => $post_id]);
        }
    }
}

/* =========================================================================
 * REST endpoints
 * ========================================================================= */

function kbseo_register_score_routes($namespace) {
    register_rest_route($namespace, '/seo-score/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'kbseo_rest_seo_score',
        'permission_callback' => 'kbseo_verify_request',
    ]);
    register_rest_route($namespace, '/seo-score-bulk', [
        'methods' => 'GET',
        'callback' => 'kbseo_rest_seo_score_bulk',
        'permission_callback' => 'kbseo_verify_request',
    ]);
}

function kbseo_rest_seo_score($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);
    if (!$post) return new WP_Error('not_found', 'Post not found', ['status' => 404]);
    $focus = $request->get_param('focus_keyword');
    $analysis = kbseo_compute_seo_score($post, $focus);
    kbseo_store_seo_score($post_id, $analysis);
    return ['ok' => true, 'analysis' => $analysis];
}

/**
 * GET /seo-score-bulk — compute + persist scores for a category of pages OR
 * recent posts. Paginated like /tools/list. Returns compact rows (no full
 * checklist) so it stays light across hundreds of pages.
 */
function kbseo_rest_seo_score_bulk($request) {
    $category = $request->get_param('category');
    $post_type = $request->get_param('post_type') ?: 'page';
    $per_page = min(50, max(1, intval($request->get_param('per_page') ?: 25)));
    $page = max(1, intval($request->get_param('page') ?: 1));

    $args = [
        'post_type' => $post_type,
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'modified',
        'order' => 'DESC',
    ];
    if ($category && function_exists('kbseo_find_page_term')) {
        $found = kbseo_find_page_term($category, 0);
        if ($found) {
            [$tax, $term] = $found;
            $args['tax_query'] = [['taxonomy' => $tax, 'field' => 'term_id', 'terms' => $term->term_id]];
        }
    }

    $query = new WP_Query($args);
    $rows = [];
    foreach ($query->posts as $post) {
        $a = kbseo_compute_seo_score($post);
        kbseo_store_seo_score($post->ID, $a);
        $rows[] = [
            'post_id' => $post->ID,
            'title' => get_the_title($post),
            'url' => get_permalink($post->ID),
            'seo_score' => $a['seo_score'],
            'readability_score' => $a['readability_score'],
            'word_count' => $a['word_count'],
            'focus_keyword' => $a['focus_keyword'],
        ];
    }

    return [
        'ok' => true,
        'total' => intval($query->found_posts),
        'page' => $page,
        'total_pages' => intval($query->max_num_pages),
        'items' => $rows,
    ];
}

/* =========================================================================
 * wp-admin "SEO" column (Posts + Pages) — a real score, no AIOSEO Pro needed
 * ========================================================================= */

add_filter('manage_posts_columns', 'kbseo_add_score_column');
add_filter('manage_pages_columns', 'kbseo_add_score_column');
function kbseo_add_score_column($cols) {
    $cols['kbseo_score'] = 'SEO';
    return $cols;
}

add_action('manage_posts_custom_column', 'kbseo_render_score_column', 10, 2);
add_action('manage_pages_custom_column', 'kbseo_render_score_column', 10, 2);
function kbseo_render_score_column($column, $post_id) {
    if ($column !== 'kbseo_score') return;
    $score = get_post_meta($post_id, '_kbseo_seo_score', true);
    $read = get_post_meta($post_id, '_kbseo_readability_score', true);
    if ($score === '') {
        echo '<span style="color:#888">—</span>';
        return;
    }
    $score = intval($score);
    $color = $score >= 80 ? '#16a34a' : ($score >= 50 ? '#d97706' : '#dc2626');
    echo '<span style="display:inline-block;min-width:34px;text-align:center;font-weight:600;color:#fff;background:' . esc_attr($color) . ';border-radius:6px;padding:2px 6px">' . $score . '</span>';
    if ($read !== '') {
        echo '<span style="color:#888;font-size:11px"> · R' . intval($read) . '</span>';
    }
}
