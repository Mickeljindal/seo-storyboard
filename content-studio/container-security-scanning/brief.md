# Brief — Container Security Scanning (quickstart + reference)

Cluster 9. Primary kw: container security scanning / scan docker image / container vulnerability scanning. Intent: how-to/reference. Signal: container security scanning tool 90.
FORMAT: Quickstart + reference. 8th distinct C9 format. Opener = the "your base image carries known CVEs" reveal.
Quickstart: what it is, why (base images inherit known vulnerabilities), scan before you ship. Reference: WHAT gets scanned (base image, OS packages, app deps) / WHERE in pipeline (build/CI — SCREENSHOT git-deployment.png, registry, runtime) / TOOLS (Trivy, Grype, Docker Scout — name generically) / reading RESULTS (severity, fixable vs not) / the FIX (update base image, bump deps, use slim/minimal images). Honest note: finds KNOWN vulns only; a layer; keep base images current.
Real: container security scanning tool 90.
Honesty woven: Linux/containers; scanning = known-CVE detection; you own base image + deps choices; managed build can run scans.
Byline: "Kloudbean · Catch it before it ships."
Slug: container-security-scanning. Links: docker-container-hosting (C8), what-a-waf-does, security-headers-guide.
