# Flush DNS Cache: What It Does, and the Two Caches You Cannot Clear

*By Kloudbean Engineering · A useful command for one specific problem, and a placebo for most others.*

Flushing your DNS cache is the tech-support equivalent of turning it off and on again: sometimes exactly right, frequently irrelevant, and almost always suggested before anyone has worked out what is wrong. It does one thing well. It makes your computer forget the addresses it looked up recently, so the next lookup starts fresh. If your problem is a stale address, that is the whole fix. If your problem is anything else, you are about to spend a command and learn nothing. Worth knowing which you have before you start.

> **What does flushing DNS do?**
> Your computer remembers the answers to recent DNS lookups so it does not have to ask again for every request. Flushing empties that store, so the next time you visit a site your machine asks a resolver for a fresh answer. That fixes exactly one class of problem: a name whose address has changed while your machine still holds the old one. It does not fix a website being down, a slow connection, or most browser errors, because none of those involve a cached address. And there are typically four caches between you and a site. You can clear two of them.

## Will flushing help? Read this before running anything

Blunt table, because the honest answer is usually no.

| What is happening | Will flushing fix it? |
|---|---|
| You changed a DNS record and still get the old server | **Yes.** This is the case it exists for. |
| You moved hosts and see the previous site | **Yes,** for your own machine at least. |
| A site works everywhere except on your computer | **Probably.** Check your hosts file too. |
| You added a new subdomain and it does not resolve | **Maybe.** If a resolver cached the non-existence, the wait is not yours to skip. |
| A site is slow to load | No. Resolution is milliseconds of it. |
| A site is down or showing a 5xx error | No. You reached the server fine, it failed after that. |
| Your internet is generally flaky | No. Nothing to do with cached names. |
| A certificate warning | No. That is TLS, after the connection is made. |
| Some pages load and others do not | No. If DNS resolved once, it resolved. |

If you landed on the bottom half of that table, the useful pages are elsewhere. For a browser that cannot resolve a name at all, [ERR_NAME_NOT_RESOLVED](https://www.kloudbean.com/blog/err-name-not-resolved/) walks the actual diagnosis, including why a brand-new record can keep failing after you fixed it. For slowness, [fixing slow DNS lookups](https://www.kloudbean.com/blog/fix-slow-dns-lookup/) measures it properly first. For a site that responds and then errors, [500 Internal Server Error](https://www.kloudbean.com/blog/http-error-500-internal-server-error/).

## Four caches, and you control two of them

This is the part that explains the most common complaint about flushing, which is that it did not work.

A DNS answer can be held in several places on its way to you. Each one has its own lifetime, and each one is independently capable of handing you a stale answer:

| Cache | Yours to clear? | Notes |
|---|---|---|
| Your browser | **Yes** | Separate from the operating system. Chrome keeps its own. |
| Your operating system | **Yes** | This is what the flush commands below target. |
| Your router | Rarely | Many home routers cache. Rebooting it is the usual blunt instrument. |
| Your ISP or public resolver | **No** | Holds the answer until the record's TTL expires. You wait. |

So when someone flushes, reloads, and still sees the old site, nothing failed. They cleared the two caches they own and are now being served a stale answer by one they do not. That is not a bug and there is no command for it. The record's TTL governs how long it lasts, which is why the last section of this page is about setting TTL before you make a change rather than flushing after.

<!-- ADD IMAGE: diagram of the four DNS caches, the browser and OS marked as clearable, the router and ISP resolver marked as not -->

## The commands, by platform

**macOS.** Two parts, and both matter. The first clears the directory service cache, the second tells the multicast DNS responder to reload, and on current macOS the first alone does not do the job:

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

No output on success, which is normal and not a sign it failed. If you are on a much older release you may find only one of the two commands exists, in which case run the one that does.

**Windows.** One command, and it needs an administrator prompt. Right-click Command Prompt or PowerShell and choose to run as administrator, otherwise you get a permissions error:

```bat
ipconfig /flushdns

REM Useful neighbours while you are in there
ipconfig /displaydns
ipconfig /registerdns
```

**Linux, where it depends on what you are running.** This is the part most guides get wrong, because they assume a cache exists.

| What you run | Command |
|---|---|
| `systemd-resolved`, common on modern distributions | `sudo resolvectl flush-caches`, or `sudo systemd-resolve --flush-caches` on older versions |
| `nscd` | `sudo systemctl restart nscd`. It is restarted rather than flushed. |
| `dnsmasq` | `sudo systemctl restart dnsmasq` |
| **None of the above** | **Nothing to flush.** There is no cache. |

That last row is the one worth internalising. glibc, the C library most Linux systems resolve names through, does not cache DNS answers on its own. Caching only happens if something like the three above is installed and running. So on a plain server, every flush command you paste will either fail with a command-not-found or succeed while doing nothing, and either way the stale answer you are chasing is upstream rather than local. Check what you actually have first:

```bash
# Is a local resolver even in play?
systemctl is-active systemd-resolved nscd dnsmasq 2>/dev/null
# What is your system actually asking?
cat /etc/resolv.conf
```

If `/etc/resolv.conf` points at a public resolver directly and none of those services is active, your machine holds no cache, and there is nothing local to clear.

## Your browser keeps its own, separately

A frequent source of the flush that appeared to do nothing.

Chrome maintains a DNS cache independent of the operating system, so an OS-level flush leaves it untouched. Clear it at `chrome://net-internals/#dns`. While you are there, Chrome also pools open sockets, and a connection already established will keep being used regardless of what any DNS cache says, so a full browser restart is a reasonable follow-up when a flush seems ineffective.

Firefox and Edge behave similarly enough that the same rule applies: restart the browser rather than assuming the operating system command covered it. And if you are testing whether a change has taken effect, a private window avoids a second layer of confusion from the ordinary page cache.

> **One more local override worth checking.** Your hosts file beats DNS entirely, cache or no cache. A line added months ago to test a migration will keep pointing you at an old server forever, and it creates the specific comedy where a site works for everyone except the person who built it. Look in `/etc/hosts` on macOS and Linux, or `C:\Windows\System32\drivers\etc\hosts` on Windows.

## How to check whether it actually worked

Almost no guide includes this step, and it is what turns guesswork into a diagnosis. Ask three different sources the same question and compare.

```bash
# 1. What does my machine resolve right now?
dig +short example.com
nslookup example.com          # if dig is unavailable

# 2. What does the authoritative nameserver say? This is the truth.
dig +short example.com @ns1.yourprovider.com

# 3. What does a public resolver say? This is what most visitors get.
dig +short example.com @1.1.1.1

# How long until caches are allowed to forget the old answer?
dig +noall +answer example.com
```

Read the results like this. If 1 differs from 2 but 3 matches 2, your local cache was the problem and flushing fixed it. If both 1 and 3 differ from 2, the stale answer is in resolvers you do not control, and the remaining time is the TTL from that last command. If all three agree and the site still misbehaves, DNS is not your problem and you should stop here.

That last case is worth saying twice, because DNS gets blamed for a lot of things it did not do. Once resolution returns the right address, everything after that is the server, the application, or TLS.

<!-- ADD IMAGE: terminal comparing the three dig outputs side by side, with the authoritative answer differing from the local one -->

## The fix that stops you needing this: lower the TTL first

An opinion. Flushing is damage control. TTL is the control.

Every DNS record carries a time to live, which tells resolvers how long they may keep the answer. That value is what decides how long a change takes to reach everyone, and it is entirely in your hands ahead of time.

So if you know a change is coming, whether a host migration or a new server, drop the TTL on the records you are about to change well before you change them. Long enough before that the old, longer TTL has expired everywhere. Then make the change, let it settle, and put the TTL back up. Do that and there is no propagation drama, because no resolver was holding your record for hours in the first place.

Doing it the other way round, changing the record and then trying to hurry the world along, is where the flushing folklore comes from. There is no command that reaches other people's resolvers. [DNS explained](https://www.kloudbean.com/blog/dns-explained/) covers TTL and records properly, and [migrating hosting without downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/) puts the TTL step in its correct place in a real move.

## flush DNS Cache and who maintains the box

Straightforwardly: nothing on this page needs a hosting provider. These are operating system commands, and DNS is a public system that belongs to nobody.

Where it becomes a hosting question is the migration case, which is what sends most people looking for a flush command in the first place. On Kloudbean, free migration assistance means the cutover sequence, including lowering TTL before the switch rather than discovering it afterwards, is handled with you rather than left as a step you find out about from a support thread. SSL is issued and renewed free once the domain points at the server, so the certificate does not become a second problem the moment DNS resolves. Staging for WordPress and Laravel means you can confirm the new server serves the site correctly before any record changes at all, which is the real way to avoid a bad cutover. Seven cloud providers to move onto.

The boundary as usual. What is handled: the operating system, the stack, certificates, backups and patches. Your domain, your DNS records, and how long other people's resolvers hold them stay outside anyone's control.

## More on flush DNS Cache

If you are actually debugging rather than looking up a command: [ERR_NAME_NOT_RESOLVED](https://www.kloudbean.com/blog/err-name-not-resolved/) for a name that will not resolve, including why a record you just fixed can keep failing, and [fixing slow DNS lookups](https://www.kloudbean.com/blog/fix-slow-dns-lookup/) when resolution works but drags. For the concepts behind all of it, [DNS explained](https://www.kloudbean.com/blog/dns-explained/). For the cutover where TTL actually matters, [migrating hosting with zero downtime](https://www.kloudbean.com/blog/how-to-migrate-hosting-zero-downtime/) and [pointing a custom domain at your app](https://www.kloudbean.com/blog/custom-domain-and-ssl-for-your-app/). And when the name resolves fine but the server then fails, [500 Internal Server Error](https://www.kloudbean.com/blog/http-error-500-internal-server-error/).

---

### Move a site without the propagation drama.

Managed hosting across seven clouds with free migration assistance, so the cutover sequence and the TTL step are handled with you. Staging for WordPress and Laravel to verify the new server before you touch a single DNS record. Free SSL issued and renewed. Start at [kloudbean.com](https://www.kloudbean.com/) or see [pricing](https://www.kloudbean.com/pricing/).

Free migration assistance · Staging · Free SSL · Seven clouds · One dashboard

---

## FAQ

**What does flushing DNS do?**

It empties the store of recent name-to-address answers your computer keeps, so the next lookup asks a resolver for a fresh answer instead of reusing the remembered one. That is all it does. It fixes a stale address and nothing else.

**How do I flush the DNS cache on a Mac?**

Run sudo dscacheutil -flushcache followed by sudo killall -HUP mDNSResponder, which can be combined on one line separated by a semicolon. Both parts matter, because on current macOS the first command alone is not sufficient. Success produces no output, which is normal.

**How do I flush DNS on Windows?**

Open Command Prompt or PowerShell as an administrator and run ipconfig /flushdns. Without elevation you will get a permissions error. You can inspect the cache first with ipconfig /displaydns if you want to see what is being held.

**How do I flush the DNS cache on Linux?**

It depends what you run, and you may have no cache at all. With systemd-resolved use sudo resolvectl flush-caches. With nscd or dnsmasq you restart the service rather than flushing it. glibc does not cache DNS answers by default, so if none of those services is active there is nothing local to clear and the stale answer is upstream.

**Why did flushing DNS not fix anything?**

Most likely because the stale answer is not in a cache you can reach. There are usually four: your browser, your operating system, your router, and your ISP or public resolver. You can clear the first two. The resolver holds its answer until the record's TTL expires, and no command changes that.

**Does flushing DNS speed up my internet?**

No. Resolution is a small fraction of page load time, and a cache normally makes things faster rather than slower by avoiding repeat lookups. If pages are slow, the cause is almost always elsewhere. Measuring resolution time properly is the first step before assuming DNS is involved.

**Does flushing DNS clear my browser cache too?**

No, they are separate things, and Chrome additionally keeps its own DNS cache apart from the operating system. Clear that at chrome://net-internals/#dns. Chrome also reuses already-open sockets, so a full browser restart is a sensible follow-up when a flush appears to have done nothing.

**How long does DNS propagation actually take?**

It is governed by the TTL on the record, not by a fixed duration, so the honest answer is that it depends on what you set. Lowering the TTL well before a planned change is what makes a cutover quick, and doing that ahead of time is far more effective than flushing anything afterwards.

**Is there any risk in flushing my DNS cache?**

Practically none. The worst outcome is that the next few lookups are marginally slower because the answers have to be fetched again. It is a safe thing to try. It is just rarely the thing that was wrong.

---

*Kloudbean Engineering · Set the TTL before the change. Flushing after is just tidying up.*
