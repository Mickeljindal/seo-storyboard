# Brief — Deploy an Astro App (head-to-head)

Cluster 3. Primary kw: deploy astro app / astro ssr hosting / astro static vs server. Intent: how-to + comparison.
FORMAT: Head-to-head (table.cmp + verdict). Different skeleton from the other 7 C3 articles. Opener = comparison framing: Astro can build static OR server-rendered, and the deploy differs completely. The `output` setting decides everything.
Table.cmp: output:'static' vs output:'server' — build makes / what runs / where hosted / cost / scaling / per-request dynamic content / best for. Then: deploy the static version (static host + CDN), deploy the server version (Node adapter → node start on $PORT; SCREENSHOT add-application.png = add your Astro Node app), the hybrid/on-demand middle ground, verdict (static unless you need server; you can mix per-route with hybrid).
Honesty woven: static files / Node on Linux; managed=host/CDN/SSL/backups, you own build+content. Not a dedicated identical honesty block.
Dashboard: add-application.png (add the Astro SSR Node app to a server). Distinct byline: "Kloudbean · Static when you can, server when you must."
Slug: deploy-astro-app. Links: pillar, deploy-vue-app, s3/CDN, deploy-node (cluster 1).
