# Brief: codeigniter-404

## Keyword grounding (competitor organic.Positions exports, 2026-07-22 crawl)

| Keyword | Vol | KD | Best competitor position |
|---|---|---|---|
| **codeigniter 404** (primary) | **14,800** | **16** | cloudways #5 |

The single largest opportunity found in the whole project at this difficulty: 14,800 volume at KD 16.
It never appeared in the gap exports and only surfaced from the organic.Positions mine. A competitor
holds position 5 with it, which confirms both that a hosting company can rank here and that nobody has
taken it properly.

**Secondary terms woven in:** codeigniter 404 page not found, codeigniter htaccess not working,
codeigniter url without index.php, codeigniter 4 public folder, setAutoRoute, php spark routes,
codeigniter controller not found, uri_protocol, index_page, try_files codeigniter, AllowOverride All,
mod_rewrite codeigniter.

## Placement
Primary keyword in H1, title, meta description, the first sentence of the lead, the TL;DR question, and
the first FAQ. Both major versions addressed, since CodeIgniter 3 is still very widely deployed and its
causes are different.

## Cannibalisation check
Zero prior CodeIgniter coverage, and no existing article covers front-controller rewrites or 404
diagnosis. `403-forbidden-error` and `405-method-not-allowed` are adjacent status codes and are linked,
including a genuinely useful cross-reference: a CodeIgniter verb mismatch returns 404 where 405 would be
more informative, which is the connection between the two articles.
`fix-cannot-find-module-node` is linked as the Node.js instance of the identical case-sensitivity trap,
which strengthens both rather than competing.

## Structure choice
Diagnostic split first, then causes grouped by which layer produced them, closing with an ordered
diagnosis list. Deliberately not a numbered tutorial, because the whole point is that following the wrong
fix list is what wastes the reader's afternoon.

## Original value competitors do not have
- **THE SPINE: two unrelated problems share one number.** Either CodeIgniter ran and no route matched, or
  the web server never handed the request over. Competing pages mix fixes for both into one list, which is
  why people apply routing fixes to a rewrite problem. The article makes the reader classify first.
- **The decisive one-line test**: request `/index.php/your/route`. If that works, your controllers and
  routes are fine and the problem is entirely server configuration. That single command replaces most of
  a typical article.
- **A second confirmation via logs**: requests reaching the framework appear in `writable/logs/`, so an
  empty framework log during live traffic proves the request never arrived. Reuses the
  empty-log-is-information angle from the 403 work.
- **THE SILENT FAILURE NAMED: `AllowOverride None`.** A perfectly correct `.htaccess` is simply never
  read, with no error, no log line, and no warning. So every fix the reader makes to that file changes
  nothing and they conclude the rules are wrong. Almost nobody states this, and it is the reason
  htaccess debugging goes in circles.
- **THE CODEIGNITER 4 DOCROOT ISSUE TREATED AS A SECURITY INCIDENT, NOT A ROUTING BUG.** Pointing the
  document root at the project root instead of `public/` exposes `.env` with database credentials, `app/`,
  and `writable/`. Includes the `curl -sI https://example.com/.env` test, states that a 200 there means
  credentials are public, and tells the reader to rotate them because they cannot know who fetched them.
  Also rejects the widely-suggested workaround of adding rewrite rules at the project root, with the
  reason: it leaves the application directory reachable and relies on rules to hide files that should
  never have been exposed. This is the most valuable section and no competing page frames it this way.
- **Auto-routing being off by default in CodeIgniter 4**, VERIFIED against the official user guide rather
  than recalled ("Auto Routing (Improved) is disabled by default"). Explains the security rationale, which
  makes it memorable rather than arbitrary.
- **The verb-in-method-name trap**: with improved auto-routing a POST looks for `postSave()` rather than
  `save()`, which is why a form submission 404s while the same URL loads in a browser. GET works, POST
  does not, and the error message hints at nothing.
- **The case-sensitivity trap with its full signature**: works locally, 404s in production, nothing in any
  log, file visibly present. Plus the follow-through nobody includes, that `git mv` is required because
  Git may not record a case-only rename made in an editor, so the fix appears to work locally and never
  reaches the server.
- **`php spark routes` recommended BEFORE editing anything**, because it prints the routing table that was
  actually built and exposes verb and placeholder mistakes instantly.
- **Five specific route-definition failures** including the two subtle ones: `(:num)` silently missing a
  non-numeric segment, and `'Products::view'` where `'Products::view/$1'` was meant, which drops the
  captured argument and 404s from inside the method.
- **CodeIgniter 3 given real treatment** rather than a footnote: `index_page` disagreeing with rewrite
  rules produces a half-broken state, and `uri_protocol` is the setting for a site that 404s after a
  server move with no code change.
- **Founder position stated**: explicit routes over auto-routing, with the reason that the routes file
  becomes the inventory of everything the application exposes.

## Facts discipline (one deliberate omission)
CodeIgniter is NOT in the confirmed one-click application list in kloudbean-facts.md (which names
WordPress, WooCommerce, Laravel, Magento, Drupal, Joomla). So the article makes NO one-click CodeIgniter
claim. It stays on confirmed ground: managed PHP servers across 7 clouds, free SSL issued and renewed,
automatic backups, Shorewall and Fail2ban by default, the 6 managed databases, and cron from the UI
without SSH.

It also VOLUNTEERS AN HONEST GAP: one-click staging covers WordPress and Laravel, so a CodeIgniter project
needs its own staging copy. Stated plainly, and made relevant by pointing out that most of the article is
about rewrite changes that can take a whole site down, so somewhere to test first matters. Same
credibility move as the no-Joomla-staging admission in joomla-vs-wordpress.

Also careful: the article does not promise the reader can change the document root in the dashboard, since
the facts file does not document that. It identifies the docroot and rewrite config as the infrastructure
half of the problem without claiming a specific UI control.

## Internal links (7, all verified)
fix-cannot-find-module-node, 403-forbidden-error, 405-method-not-allowed, nginx-reverse-proxy-for-node,
fix-502-bad-gateway-node-nginx, environment-variables-done-right, zero-downtime-deployments
