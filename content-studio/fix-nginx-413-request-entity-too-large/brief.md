# Brief: fix-nginx-413-request-entity-too-large

Cluster: nginx / HTTP status error field guide. Intent: informational, urgent (an upload is failing right now).
Format: layered-diagnosis field guide, not a config snippet dump.

## Angle / information gain
"The status code names the layer." A 413 is refused by whichever component on the path has the smallest
limit, and the error page's own styling identifies who refused it. A default nginx error page means nginx
rejected the request before the application ever saw it, so raising the app's upload limit does nothing.
That misdirection is why people lose an hour on the wrong fix, and no competing page leads with it.

Second differentiator: the article argues against the obvious fix. Raising `client_max_body_size` is
correct for a slightly-too-big form, not an upload strategy. Past a few megabytes the answer is a
presigned direct-to-object-storage upload, so the file never travels through the app server at all,
which also fixes the separate problem of files written to a server's local disk not surviving a redeploy.

## Keywords
- **Primary:** 413 Request Entity Too Large (in H1, `<title>`, meta description, first 100 words, and an H2).
- **Secondary / woven:** nginx 413, client_max_body_size, 413 payload too large upload, 413 content too
  large, nginx upload limit, client_body_timeout, proxy_read_timeout large upload.
No volume or difficulty figures supplied for this term, so none are asserted (owner rule: never invent volumes).

## Intent
Informational, high implementation intent. Payoff is identifying the refusing layer and the right fix, not a signup.

## Shape (deliberately not intro/steps/conclusion)
Read the error page first -> the nginx directive and where it goes -> which config file wins and how to prove
it -> validate then reload -> nginx is one ceiling out of several (layered limits) -> buffers and timeouts on
big bodies -> why raising the limit is often wrong -> where the bytes should go instead -> related reading ->
CTA -> FAQ. 10 H2s, 8-question FAQ mirrored to FAQPage JSON-LD.

## Accuracy notes
- nginx's documented default `client_max_body_size` is 1m, stated as a documented default with a note to
  confirm against the reader's version. No measured or invented numbers anywhere.
- `client_max_body_size 0` disables the check, presented as a deliberate choice with the risk stated
  (unbounded request bodies are a denial-of-service and disk-pressure risk), never as a casual fix.
- Layer order covered: CDN/proxy in front, nginx, then the framework's own limit (Express `express.json({ limit })`
  and multer, PHP `upload_max_filesize` / `post_max_size`, Django `DATA_UPLOAD_MAX_MEMORY_SIZE`), with the
  point that the smallest limit still wins unless every layer is raised.
- `nginx -t` before reload.

## Opinion + anti-pattern (required beats)
- Opinion: raising the limit is a fix for slightly-too-big forms, not an upload strategy.
- Anti-pattern: raising every limit to a huge value and streaming multi-gigabyte bodies through the app
  process onto ephemeral local disk.

## Product mention (one, at the point of need)
One paragraph in "Where the bytes should go instead", after the reader's own requirement is established:
S3-compatible object storage with AWS SDK and CLI compatibility, data-transfer-out not metered, managed
servers where the stack is handled. No rival product named next to the egress point. Then one short CTA.
No uptime figure, no banned superlatives, no customer counts.

## Cannibalisation check
`nginx-reverse-proxy-for-node` owns the proxy setup, `fix-502-bad-gateway-node-nginx` owns the 502 path,
`fix-504-gateway-timeout` owns proxy timeouts, `http-error-413-content-too-large` owns the generic status-code
explainer, `s3-compatible-object-storage` owns the storage how-to. This page owns the nginx-specific 413
diagnosis and the layered-limit model, and links to those rather than repeating them.

## Internal links (7, all verified to exist)
nginx-reverse-proxy-for-node, fix-502-bad-gateway-node-nginx, fix-504-gateway-timeout,
http-error-413-content-too-large, cloudflare-5xx-error-codes, do-i-need-a-cdn, s3-compatible-object-storage.
(CTA links kloudbean.com and /pricing/.)

## Gate
`node _val.mjs fix-nginx-413-request-entity-too-large` -> [OK] (hero.png warn expected). 0 em-dashes both
files, 0 blurbs, Article + FAQPage + clean Organization block (@id https://kloudbean.com/#organization),
FAQ h3 parity with JSON-LD names, HTML code escaped with `&lt; &gt; &amp;`, img-slot spacers with
`src -> images/your-file.png` comments, banned-claim grep clean, .md and .html in sync.
Byline: "By Kloudbean Platform · The error page's own styling tells you who refused the upload."
