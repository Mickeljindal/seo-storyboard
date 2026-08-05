# Brief — Fix SSL Certificate Errors (teardown/troubleshooting)

Cluster 9. Primary kw: ssl certificate error / fix ssl error / your connection is not private. Intent: troubleshooting. STRONG signals: err_ssl_unrecognized_name_alert 720, ssl certificate issue 320, err_ssl_protocol_error 210, how to set ssl certificate 140, cloudflare certificate 140.
FORMAT: Teardown/troubleshooting (walk errors + fixes). Not adjacent to other teardown. Opener = the "Not Secure" / your-connection-is-not-private scenario.
Errors + fixes: 1 "your connection is not private"/NET::ERR_CERT (expired or mismatched) 2 ERR_SSL_PROTOCOL_ERROR (config/protocol) 3 name mismatch (cert for wrong domain / missing www) 4 incomplete cert CHAIN (browser ok, tools/APIs fail — the sneaky one) 5 mixed content (HTTPS page loads HTTP assets → padlock breaks) 6 expired cert (auto-renew failed). Managed angle: auto SSL + auto-renew removes most (SCREENSHOT add-application.png = app served over HTTPS). How to diagnose fast.
Real: err_ssl 720 etc.
Honesty woven: Linux/web server; managed auto-provisions + auto-renews Let's Encrypt; you own app-level mixed-content fixes.
Byline: "Kloudbean · The padlock, restored."
Slug: fix-ssl-certificate-errors. Links: security-headers-guide (HSTS), custom-domain-and-ssl (C1), what-a-waf-does.
