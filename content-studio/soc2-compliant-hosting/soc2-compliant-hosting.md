# SOC 2 Compliant Hosting: Your Questions, Answered Plainly

It usually starts with one email. A prospect, or their security team, asks: **"Is your hosting SOC 2 compliant?"** Suddenly a deal depends on a word most people have never had to define. So let's define it — in plain language, as a set of honest questions and answers.

No acronyms left unexplained, no hand-waving. Here's what SOC 2 actually is, what a host's compliance does and doesn't do for you, and how the pieces fit together.

## What is SOC 2, in plain words?

SOC 2 is a **report written by an independent auditor** about how a company protects customer data. The auditor checks the company's controls against a set of trust principles — mostly *security*, and optionally availability, confidentiality, processing integrity, and privacy — and then writes up whether those controls are designed well and actually followed. It isn't a licence or a sticker you buy. It's an outside expert examining your practices and reporting what they found. When a vendor says "we're SOC 2 compliant," they mean "an auditor reviewed our controls and produced a report you can read."

## Does SOC 2-compliant hosting make my app compliant?

This is the big one, and the honest answer is **no — not on its own**. A host's SOC 2 report covers *the host's* controls: their data centres, their staff access, their monitoring, their change process. It says nothing about the code you deploy on top. Compliance works on a **shared-responsibility model**: the platform secures the infrastructure layer, and you secure the application layer. Running on SOC 2-compliant infrastructure is a genuine head start — you inherit a well-run foundation — but your own app, your access rules, and how you handle user data are still yours to get right. Anyone who sells "SOC 2 hosting" as a one-click path to your own compliance is overselling it.

## So what does the host's SOC 2 actually cover?

Plenty that's valuable, and worth understanding so you can point to it. A hosting provider's report typically covers the **physical and infrastructure controls** you'd otherwise have to vouch for yourself: secure data centres, restricted and logged staff access to servers, monitoring and alerting, patch and change management, and incident response. When your customer's auditor asks "where does this run and how is it secured?", the host's report answers the infrastructure half cleanly. That's the half that's genuinely hard for a small team to build and prove alone, so inheriting it is real leverage.

## Then what's still my job?

The application half — and it's the half your customers' data actually flows through. That means **your own access controls** (who on your team can reach production, and with what permissions), how you store secrets and credentials, how you handle and encrypt user data in your code, your own logging of who did what, and your policies for onboarding and offboarding people. One of the most basic controls is simply not scattering credentials through your codebase — you keep them as managed environment variables with least-privilege access:

![The Kloudbean console — managing secrets as environment variables with least-privilege access](../assets/console/env-vars.png)

The platform can give you the tools — managed secrets, access controls, backups, monitoring — but *using* them correctly is the application-layer work only you can do.

## Type I or Type II — what's the difference?

You'll see both. A **Type I** report checks that the right controls are *designed* and in place at a single point in time — a snapshot. A **Type II** report goes further: it checks that those controls actually *operated effectively over a period*, usually several months to a year. Type II is the stronger, more respected one, because it shows the controls aren't just written down — they're lived. If a buyer specifies which they need, it's almost always Type II. If you're picking infrastructure, a provider with a Type II report has demonstrated its controls over time, not just on paper.

## Do I even need SOC 2?

Maybe not yet. SOC 2 is **voluntary** — no law requires it. You typically pursue it when you start **selling to larger companies**, because their procurement and security teams ask for it before trusting you with their data. If you're a small B2C app, you may never be asked. If you're selling B2B SaaS and hearing "send us your SOC 2," it's time. The trigger is your customers' requirements, not a legal deadline — so let real demand, not fear, decide when you invest in it.

## How do I actually get there?

Briefly, because the full journey is its own project. You choose your scope and trust principles, write down your policies, put the technical controls in place (access management, encryption, logging, backups, monitoring), run them for a while to generate evidence, and then bring in an independent auditor to examine everything and issue the report. Starting on infrastructure that already carries its own SOC 2 shrinks the work, because the whole infrastructure layer is already handled and documented — you're left to prove your application-layer controls rather than the entire stack. It's still real effort, but you're not starting from bare ground.

## What about my WordPress site specifically?

People search for "WordPress hosting with SOC 2 certification" for exactly the reason above: a client asked. The same rules apply, with a WordPress twist. The host's report can cover the servers and stack your WordPress site runs on — but not your **plugins, theme, or the data your forms collect**. WordPress's own risk usually lives in third-party plugins, so your side of the work is keeping them updated, limiting who has admin access, and being careful what personal data you collect and store. SOC 2-ready infrastructure gives your WordPress site a clean foundation to point to; the plugins and content on top are still your responsibility to run well.

## The honest summary

Put plainly: SOC 2 is an auditor's report on how data is protected, it's split between the host and you, and no host can hand you your own compliance. What a good managed host on a **Linux stack** can do is run the infrastructure well — secure servers, backups, patching, monitoring, managed secrets — and, where it holds its own SOC 2, give you a report that covers that layer. Your app, your team's access, and your data handling stay yours. That's not a limitation to hide; it's how compliance is supposed to work. Treat "SOC 2 hosting" as a strong foundation you build on, and you'll answer that prospect's email honestly — which is the only way that answer holds up under audit.

---

**Inherit the foundation, own your half.** Build on well-run, managed infrastructure with the controls to back it at [kloudbean.com](https://www.kloudbean.com/).

## FAQ

**What does "SOC 2 compliant hosting" mean?**
It means the hosting provider has been examined by an independent auditor and has a SOC 2 report describing how it protects customer data at the infrastructure level — data centres, staff access, monitoring, change management, and so on. It's not a sticker you buy; it's an outside review of the provider's controls that you can read.

**Does running on SOC 2 hosting make my application SOC 2 compliant?**
No. Compliance follows a shared-responsibility model: the host's report covers the infrastructure layer, and your application, access controls, and data handling are still your responsibility. SOC 2-compliant infrastructure is a real head start because you inherit a well-run foundation, but your own controls and, if you need one, your own audit are still up to you.

**What's the difference between SOC 2 Type I and Type II?**
Type I checks that the right controls are designed and in place at a single point in time — a snapshot. Type II checks that those controls actually operated effectively over a period, usually several months to a year. Type II is stronger and more respected because it shows the controls are lived, not just documented, and it's what most buyers ask for.

**Do I need SOC 2 for my app?**
Only if your customers require it. SOC 2 is voluntary — no law mandates it — and you typically pursue it when you start selling to larger companies whose security teams ask for it before trusting you with their data. If you're small or B2C, you may never be asked. Let real customer demand decide the timing.

**How does SOC 2-compliant hosting help me get certified?**
It shrinks the work. If your infrastructure already carries its own SOC 2, that entire layer is handled and documented, so you're left to prove your application-layer controls — access management, encryption, logging, backups — rather than the whole stack. You still do real work and bring in an auditor, but you're not starting from bare ground.

---

*Kloudbean · Compliance is a shared job.*
