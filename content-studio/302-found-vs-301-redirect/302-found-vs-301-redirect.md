# 302 Found vs 301 Redirect: Why Permanent Is the Riskier Choice

*By Kloudbean Engineering · A wrong 302 is a mistake. A wrong 301 is a mistake you cannot recall.*

"302 Found" is not an error, despite arriving in search results next to genuine failures. It is a successful response that says the thing you asked for currently lives somewhere else, temporarily. Its sibling, 301 Moved Permanently, says the same thing without the temporarily. The usual advice is to prefer 301 because it is better for SEO, and that advice skips the part that actually bites people: browsers treat a permanent redirect as permission to stop asking, sometimes for a very long time. Choosing wrongly in that direction is much harder to undo.

> **Should I use a 301 or a 302 redirect?**
> Use 301 when the move is genuinely permanent and you are certain of the destination: a retired URL, a domain change, a canonical host. Use 302 for anything temporary or anything you might reverse: maintenance pages, A/B tests, geographic or device routing, a promotion. The reason to be careful with 301 is caching. Browsers may remember a permanent redirect indefinitely, so a wrong one keeps sending returning visitors to the wrong place even after you fix the server. If you are not sure, 302 is the safer default.

## What the four codes actually mean

| Code | Meaning | Method preserved? | Browser caching |
|---|---|---|---|
| **301** Moved Permanently | Use the new URL from now on | Not guaranteed | Aggressive, potentially indefinite |
| **302** Found | Temporarily elsewhere, keep asking here | Not guaranteed | Not cached by default |
| **307** Temporary Redirect | Same as 302, method guaranteed | **Yes** | Not cached by default |
| **308** Permanent Redirect | Same as 301, method guaranteed | **Yes** | Aggressive |

The method column matters more than it looks and is the reason 307 and 308 exist at all. Historically, clients receiving a 301 or 302 in response to a POST would often re-issue the request as a GET, dropping the body. That behaviour became so widespread it was effectively standard, so 307 and 308 were defined to say explicitly that the method and body must be preserved.

The practical rule: for ordinary page redirects, 301 and 302 are fine and universally understood. For anything that receives POST, PUT, or DELETE, use 307 or 308, because silently converting a POST to a GET turns a redirect into a data loss bug that is genuinely difficult to trace.

## The caching trap that makes 301 risky

This is the part worth internalising, because it turns a small mistake into a long-running one.

A 301 tells the browser the old address is finished. Browsers act on that: they store the redirect and stop requesting the original URL. Depending on the browser and the headers involved, that can persist for a very long time, and in practice users have carried stale 301s around for months.

Now imagine you 301 a URL to the wrong destination and notice an hour later. You fix the server immediately. New visitors are fine. Everyone who hit it during that hour still goes to the wrong place, because their browser is no longer asking your server for an opinion. You cannot recall the instruction. Your options are to make the wrong destination work, or to ask people to clear their cache, which at any scale is not a plan.

A wrong 302 has none of that. Fix the server and the next request is correct, because a 302 asks the browser to keep coming back.

My position, and it runs against the common advice: default to 302 while a redirect is new or uncertain, then promote it to 301 once you have watched it behave correctly for a while. The SEO cost of a few days on 302 is small and recoverable. The cost of a wrongly cached 301 is neither.

If you do want a 301 with a shorter leash, send an explicit cache lifetime with it, which at least gives browsers a defined period rather than their own default:

```nginx
location = /old-path {
    add_header Cache-Control "max-age=3600" always;
    return 301 https://example.com/new-path;
}
```

## The SEO question, without the folklore

The old rule was that only 301 passes ranking signals and 302 wastes them. That has not been accurate for some years. Google has stated that 3xx redirects generally pass signals, so the difference is smaller than the advice you will find suggests.

What still genuinely differs is what you are telling search engines to index. A 301 says replace the old URL with the new one, so the new URL is what should appear in results. A 302 says keep the old URL, because this arrangement is temporary. That is the real distinction, and it is about canonicalisation rather than about leaking value.

Which leads to a simple test that is more useful than any rule about ranking transfer: **which URL do you want in search results in six months?** If it is the new one, 301. If it is the old one, 302. Answering that question decides it correctly nearly every time.

One genuine SEO cost that does not depend on the code you choose: chains. Every hop adds latency and dilutes clarity, and long chains occasionally get truncated by crawlers. Keep it to one hop regardless of which status you use.

## Which to use, by situation

| Situation | Use | Why |
|---|---|---|
| Retired page, content moved for good | 301 | You want the new URL indexed |
| Domain change | 301 | Permanent by definition |
| Canonical host, `www` or not | 301 | Settled and unlikely to change |
| HTTP to HTTPS | 301 | Permanent, and pair it with HSTS |
| Maintenance page | 302 or 307 | Reversing it must be instant |
| A/B test or experiment | 302 | Temporary by design |
| Seasonal or promotional landing page | 302 | The old URL should return |
| Geographic or language routing | 302 | Destination varies per visitor |
| Post-login destination | 302 or 303 | Per-session, never cacheable |
| API endpoint that receives POST | 307 or 308 | Method and body must survive |
| After a form submission | 303 | Forces the follow-up to GET |

That last row is a different job worth knowing about. A 303 See Other is the correct response after processing a POST, because it guarantees the follow-up request is a GET. It is the basis of the POST-redirect-GET pattern, which is covered in [ERR_CACHE_MISS](https://www.kloudbean.com/blog/err-cache-miss/), and it removes the browser's form resubmission prompt entirely.

## Writing them properly

Prefer `return` over `rewrite` in nginx. It is faster, it is unambiguous, and it will not accidentally match its own destination:

```nginx
# Whole-host canonical redirect
server {
    listen 443 ssl;
    server_name www.example.com;
    return 301 https://example.com$request_uri;
}

# A single moved page
location = /old-pricing {
    return 301 /pricing;
}

# Temporary maintenance for everyone but your own address
location / {
    if ($remote_addr != 203.0.113.9) {
        return 302 /maintenance.html;
    }
    try_files $uri $uri/ /index.php?$args;
}
```

`$request_uri` in the host redirect is what preserves the path and query string, so `/blog/post?x=1` arrives intact rather than dumping every visitor on the homepage. Losing the path in a domain migration is a common and expensive mistake, and it is one character of configuration.

For Apache, the equivalent with explicit status codes:

```apache
Redirect 301 /old-pricing /pricing
Redirect 302 /promo /summer-sale
```

## Verify every redirect you write

Check the status code, not just that you arrive somewhere. It is easy to write a 302 believing it is a 301, since both work from the visitor's point of view:

```bash
# The full chain with status codes
curl -sIL --max-redirs 10 https://example.com/old-path | grep -iE '^HTTP|^location'

# Just the count and the final destination
curl -sIL -o /dev/null -w '%{num_redirects} hops, final: %{url_effective}\n' https://example.com/old-path

# Confirm the path and query survived
curl -sI 'https://www.example.com/blog/post?x=1' | grep -i location
```

That third command is the one people skip, and it catches the mistake that costs the most during a migration. If the response location is the bare homepage rather than the same path on the new host, your rule is dropping `$request_uri`.

Browsers cache redirects, which makes them poor test instruments. `curl` does not, so trust it while you are working. If you must test in a browser, use a private window each time.

## Common ways this goes wrong

**Redirecting everything to the homepage.** Tempting during a migration and bad for both visitors and rankings. A visitor who wanted one article gets a homepage and leaves. Map paths to paths, and use a genuine 404 or 410 where content really is gone rather than pretending it moved.

**Chains built by accretion.** HTTP to HTTPS, then non-`www` to `www`, then old path to new. Three hops that could be one, each added by a different person. Order your rules so any combination of entry points resolves in a single redirect.

**Loops from two rules disagreeing.** The failure mode of redirect configuration, covered in [ERR_TOO_MANY_REDIRECTS](https://www.kloudbean.com/blog/err-too-many-redirects/).

**Redirecting a POST endpoint with 301 or 302.** The method may be converted to GET and the body dropped, so the request silently does nothing. Use 307 or 308.

## Where hosting fits

Redirects are configuration you write, so this is mostly yours. Two practical things do come from the platform.

Free SSL issued and renewed means the HTTP to HTTPS redirect, which is the one nearly every site needs, is straightforward rather than a certificate project. And staging matters more here than people expect, because a redirect rule that is subtly wrong is difficult to spot on the site you already know and trivial to catch on a copy where you deliberately test old URLs. Getting a canonical rule wrong on production is how loops and lost paths reach real visitors.

Beyond that, this is a decision rather than a feature: pick the code that matches what you actually mean, keep chains to one hop, and verify with `curl` rather than assuming.

## Related reading

When two rules disagree, [ERR_TOO_MANY_REDIRECTS](https://www.kloudbean.com/blog/err-too-many-redirects/). For the 303 pattern after a form submission, [ERR_CACHE_MISS](https://www.kloudbean.com/blog/err-cache-miss/). On conditional responses and caching, [304 Not Modified](https://www.kloudbean.com/blog/304-not-modified/). For HTTPS and certificates, [custom domain and SSL](https://www.kloudbean.com/blog/custom-domain-and-ssl-for-your-app/) and [fixing SSL certificate errors](https://www.kloudbean.com/blog/fix-ssl-certificate-errors/). On headers including HSTS, [the security headers guide](https://www.kloudbean.com/blog/security-headers-guide/). And for the proxy layer, [the nginx reverse proxy guide](https://www.kloudbean.com/blog/nginx-reverse-proxy-for-node/).

## Test the rule before your visitors do

Managed servers with free SSL issued and renewed, one-click staging for testing redirect rules against real old URLs, and everything in one dashboard from $8/mo. Free migration assistance included. Start at [kloudbean.com](https://www.kloudbean.com/).

Free SSL · Staging sites · Managed nginx · One dashboard · Flat from $8/mo

## FAQ

**What does 302 Found mean?**
It is a successful HTTP response telling the client that the resource is temporarily at a different address, given in the `Location` header, and that the original URL should still be used for future requests. It is not an error, even though it appears alongside genuine failures in search results. The temporary part is what distinguishes it from a 301.

**What is the difference between a 301 and a 302 redirect?**
A 301 says the move is permanent, so search engines should index the new URL and browsers may stop requesting the old one. A 302 says it is temporary, so the original URL keeps its place and browsers keep asking. The practical difference is caching: a wrong 301 persists in browser caches after you fix the server, while a wrong 302 corrects itself on the next request.

**Is a 302 redirect bad for SEO?**
Less than folklore suggests. Google has stated that 3xx redirects generally pass signals, so the old claim that a 302 wastes ranking value is outdated. What still differs is which URL you are asking to have indexed: a 301 asks for the new one, a 302 asks to keep the old one. Choose by answering which URL you want in search results in six months.

**Why can a 301 redirect be risky?**
Because browsers may cache it for a very long time. If you send a 301 to the wrong destination, everyone who received it keeps going there even after you correct the server, since their browser no longer asks. You cannot withdraw the instruction. A 302 has no such problem, which is why it is the safer default while a redirect is new or uncertain.

**When should I use 307 or 308 instead?**
When the request method must survive. Clients receiving a 301 or 302 for a POST have historically re-issued it as a GET, dropping the body, which turns a redirect into silent data loss. A 307 is a temporary redirect that guarantees the method and body are preserved, and a 308 is the permanent equivalent. Use them for any endpoint that receives POST, PUT, or DELETE.

**How do I check what redirect a URL is actually sending?**
Use `curl -sIL --max-redirs 10` and grep for the status and location lines, which prints every hop with its code. Add the `num_redirects` and `url_effective` write-out variables for a quick count and final destination. Avoid testing in a normal browser window, since browsers cache redirects and will show you stale behaviour.

**Should I redirect old pages to my homepage?**
No. A visitor who wanted a specific article gets an unrelated page and usually leaves, and it tells search engines little about the relationship between the URLs. Map each old path to its closest equivalent, and where content is genuinely gone return a 404, or a 410 if you want to state that the removal is deliberate.

**How many redirects is too many?**
Aim for one. Each hop is a full round trip before anything renders, which is noticeable on mobile connections, and long chains are occasionally truncated by crawlers. Chains usually accumulate rather than being designed, with an HTTPS rule, a canonical host rule, and a path change each adding a hop. Order your rules so any entry point resolves in a single redirect.

*Kloudbean Engineering · Which URL do you want in search results in six months? That answers it.*
