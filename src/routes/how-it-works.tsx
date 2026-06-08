import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Search, ShieldCheck, Network, PenLine, Gauge, Send, Brain, Sparkles,
  Bot, Quote, Database, TrendingUp, CheckCircle2, XCircle, ArrowRight,
  Layers, Target, Globe, Zap, FileText,
} from "lucide-react";

export const Route = createFileRoute("/how-it-works")({ component: HowItWorks });

/* ---------------------------------------------------------------- */

const PIPELINE = [
  { icon: Search, title: "Find real demand", desc: "Serper pulls live Google data — autocomplete, People-Also-Ask, related searches. Only topics people actually search survive.", color: "var(--pillar-1)" },
  { icon: ShieldCheck, title: "Filter for truth", desc: "Drops anything Kloudbean can't deliver: no Azure/Oracle, and Saudi = GCP Dammam only. Wrong facts = no AI citations.", color: "var(--pillar-2)" },
  { icon: Network, title: "Map the silo", desc: "Each topic becomes a hub or supporting article, interlinked into a semantic cluster. This is how topical authority is built.", color: "var(--pillar-3)" },
  { icon: PenLine, title: "Write like a human", desc: "Multi-pass writing + a humanization edit kills robotic AI phrasing. Answer-first, specific, readable.", color: "var(--pillar-4)" },
  { icon: Gauge, title: "Score & gate", desc: "A 0–100 scorecard checks keywords, readability, entities, schema, links, and blocks any false claims before publishing.", color: "var(--pillar-5)" },
  { icon: Send, title: "Publish & learn", desc: "Push to WordPress, then the system learns from what wins and feeds it back into the next round of ideas.", color: "var(--primary)" },
];

const OLD_VS_NEW = [
  { old: "Optimize for rank position (#1 blue link)", neu: "Optimize for citation — get named inside AI answers" },
  { old: "Backlinks are the main lever", neu: "Brand mentions + structure are the main lever (≈3× stronger)" },
  { old: "Keyword-stuffed, salesy copy", neu: "Neutral, evidence-led, answer-first writing" },
  { old: "Publish volume, hope for traffic", neu: "Publish demand-validated, fact-checked authority" },
  { old: "One big article per keyword", neu: "Interlinked silos that own a whole topic" },
];

const WHY_WINS = [
  { icon: Quote, stat: "≈0.66", label: "Brand mentions correlate with AI citations", sub: "vs ~0.22 for backlinks — we build mentions + structure, not link farms.", color: "var(--lime)" },
  { icon: XCircle, stat: "−26%", label: "Promotional tone hurts citations", sub: "Our anti-hype writing rules avoid the salesy language AI ignores.", color: "var(--pillar-2)" },
  { icon: FileText, stat: "86%", label: "of AI citations come from owned content", sub: "Your site + docs are the lever. This engine produces exactly that.", color: "var(--pillar-1)" },
  { icon: Target, stat: "40–60", label: "word answer blocks get quoted verbatim", sub: "We open sections with direct answers AI can lift as a citation.", color: "var(--pillar-4)" },
];

const ENGINES = [
  "Google AI Overviews", "ChatGPT Search", "Perplexity", "Gemini", "Claude", "Copilot",
];

const ICP_CARDS = [
  { icon: Sparkles, title: "Vibecoders", desc: "Built an app with Lovable, Bolt, Cursor or Replit and need it live on a real server they own." },
  { icon: Network, title: "AI & dev agencies", desc: "Run 10–20+ client apps on one managed server — white-label, one bill, no per-client DevOps." },
  { icon: Layers, title: "SaaS founders", desc: "App + API + managed DB + self-hosted n8n/Supabase on owned servers at a flat price." },
  { icon: PenLine, title: "Freelance devs", desc: "A fully managed server with security, backups, and CI/CD from ~$8/mo." },
  { icon: FileText, title: "WordPress & marketing", desc: "WordPress and Next.js/Vue/Node side by side on one platform — any stack." },
  { icon: ShieldCheck, title: "Enterprise & gov (KSA)", desc: "Compliance + in-region data residency (KSA = GCP Dammam), managed DBs, load balancers, S3." },
];

const MOAT = [
  { icon: Zap, title: "The deployment gap is our wedge", desc: "Millions of apps are now built with Lovable, Bolt, Cursor, and Replit — and they all hit the same wall: 'works on localhost, dies online.' Kloudbean is the one-click answer. We meet builders exactly at that moment of pain." },
  { icon: Layers, title: "One server, every app", desc: "Agencies and founders consolidate 10–20+ apps, sites, and self-hosted tools (n8n, Supabase, GitLab) onto one managed server they own — replacing SaaS sprawl and PaaS bill-shock. Real customers cut $4,000/mo to ~$100." },
  { icon: Globe, title: "Global reach, local edge", desc: "1,000+ businesses across 30+ countries. Win worldwide on managed-multi-cloud value, and own regulated niches like KSA with in-Kingdom GCP Dammam residency that Vercel, Render, and Railway can't match." },
];

/* ---------------------------------------------------------------- */

function HowItWorks() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-[1100px] px-8 py-10">
        {/* HERO */}
        <header className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <Bot className="h-3 w-3 text-primary" /> How it works · Why it wins
          </div>
          <h1 className="text-display mx-auto max-w-3xl text-[44px] font-semibold leading-[1.08] tracking-tight">
            An engine that gets <span className="grad-text">kloudbean.com</span> cited by the AIs people now ask.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Search changed. Nearly half of questions are answered by AI before anyone clicks a link.
            This system makes Kloudbean the source those AIs quote — through real demand, true facts,
            tight topic silos, and human-quality writing. Build. Deploy. Scale — for content.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ENGINES.map((e) => (
              <span key={e} className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-foreground/80">{e}</span>
            ))}
          </div>
        </header>

        {/* SECTION: The shift */}
        <SectionLabel kicker="01" title="The shift: from ranking to being quoted" />
        <div className="mb-16 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          <div className="bg-card/80 p-6">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <XCircle className="h-4 w-4 text-rose-400" /> Old SEO (fading)
            </div>
            <ul className="space-y-2.5">
              {OLD_VS_NEW.map((r) => (
                <li key={r.old} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400/60" />
                  {r.old}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card/80 p-6">
            <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[var(--lime)]" /> What this engine does (2026)
            </div>
            <ul className="space-y-2.5">
              {OLD_VS_NEW.map((r) => (
                <li key={r.neu} className="flex items-start gap-2 text-sm text-foreground/90">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {r.neu}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SECTION: Pipeline */}
        <SectionLabel kicker="02" title="Who this content is for" desc="Kloudbean's real customers, worldwide." />
        <div className="mb-16 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ICP_CARDS.map((icp) => {
            const Icon = icp.icon;
            return (
              <div key={icp.title} className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{icp.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{icp.desc}</p>
              </div>
            );
          })}
        </div>

        {/* SECTION: Pipeline */}
        <SectionLabel kicker="03" title="The 6-step pipeline" desc="What happens every time the engine runs." />
        <div className="mb-16 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="group relative rounded-xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/40">
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${step.color} 18%, transparent)` }}>
                    <Icon className="h-5 w-5" style={{ color: step.color }} />
                  </div>
                  <span className="num font-mono text-2xl font-semibold text-muted-foreground/30">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* SECTION: Why it wins (stats) */}
        <SectionLabel kicker="04" title="Why this wins — the evidence" desc="Backed by 2026 AI-citation research." />
        <div className="mb-16 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_WINS.map((w) => {
            const Icon = w.icon;
            return (
              <div key={w.label} className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
                <Icon className="h-5 w-5" style={{ color: w.color }} />
                <div className="num mt-3 text-display text-3xl font-semibold" style={{ color: w.color }}>{w.stat}</div>
                <div className="mt-1 text-[13px] font-medium leading-snug">{w.label}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{w.sub}</p>
              </div>
            );
          })}
        </div>

        {/* SECTION: The silo diagram */}
        <SectionLabel kicker="05" title="How topical authority is built" desc="One hub, many supporting articles, all linked." />
        <div className="mb-16 mt-6 rounded-xl border border-border bg-card/40 p-8 backdrop-blur">
          <div className="flex flex-col items-center">
            {/* Hub */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-5 py-3">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold">Pillar / Hub article</div>
                  <div className="text-[11px] text-muted-foreground">Broad topic · targets the head keyword</div>
                </div>
              </div>
            </div>
            {/* connector */}
            <div className="h-8 w-px bg-border" />
            {/* Supporting row */}
            <div className="grid w-full gap-3 sm:grid-cols-3">
              {["Answers 1 question", "Comparison vs competitor", "How-to / deploy guide"].map((s) => (
                <div key={s} className="rounded-lg border border-border bg-background/60 p-3 text-center">
                  <FileText className="mx-auto h-4 w-4 text-muted-foreground" />
                  <div className="mt-1.5 text-xs font-medium">Supporting</div>
                  <div className="text-[11px] text-muted-foreground">{s}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
              Supporting articles link <span className="text-foreground">up</span> to the hub and <span className="text-foreground">across</span> to each other.
              That dense internal mesh tells Google and AI engines: <span className="text-foreground">Kloudbean owns this topic.</span> No backlinks required.
            </p>
          </div>
        </div>

        {/* SECTION: The moat */}
        <SectionLabel kicker="06" title="Kloudbean's unfair advantage" />
        <div className="mb-16 mt-6 grid gap-4 md:grid-cols-3">
          {MOAT.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 text-sm font-semibold">{m.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{m.desc}</p>
              </div>
            );
          })}
        </div>

        {/* SECTION: Safeguards */}
        <SectionLabel kicker="07" title="What it will never do" desc="The guardrails that keep quality high." />
        <div className="mb-16 mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Publish thin, mass-produced AI filler",
            "Use salesy hype that AI engines ignore",
            "Invent stats, certifications, or fake provider claims",
            "Recommend a cloud Kloudbean doesn't actually offer",
            "Generate topics with no real search demand",
            "Publish anything that fails the quality gate",
          ].map((g) => (
            <div key={g} className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 px-4 py-3 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lime)]" />
              <span className="text-foreground/85">{g}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-border bg-card/60 p-8 text-center backdrop-blur">
          <Sparkles className="mx-auto h-7 w-7 text-primary" />
          <h2 className="text-display mt-3 text-2xl font-semibold tracking-tight">Ready to see it run?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start the engine to discover demand-validated topics, or open the dashboard to track your content authority as it grows.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild style={{ background: "var(--gradient-brand)", color: "var(--brand-foreground)" }}>
              <Link to="/engine"><Zap className="mr-2 h-4 w-4" /> Run the engine</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/strategy"><Brain className="mr-2 h-4 w-4" /> View strategy</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/"><TrendingUp className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
          </div>
        </div>

        <footer className="mt-12 flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Database className="h-3 w-3" /> SEO · GEO · AIO engine for kloudbean.com
        </footer>
      </div>
    </AppLayout>
  );
}

function SectionLabel({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-border pb-3">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">{kicker}</span>
        <h2 className="text-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {desc && <p className="hidden text-xs text-muted-foreground md:block">{desc}</p>}
    </div>
  );
}
