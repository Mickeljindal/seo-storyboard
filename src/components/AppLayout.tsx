import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarDays,
  Search,
  FileText,
  TrendingUp,
  Settings,
  Dices,
  Brain,
  Cog,
  Sparkles,
  Network,
  Lock,
  Wrench,
  Brain as BrainIcon,
  Clapperboard,
  Film,
  BookOpen,
  Quote,
  Globe,
  DollarSign,
  Lightbulb,
  ShieldCheck,
  Link2,
  Activity,
} from "lucide-react";
import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SystemHealthBanner, SystemHealthOkBadge } from "./SystemHealthBanner";
import { AssistantWidget } from "./AssistantWidget";
import { wpStatus } from "@/lib/wordpress.functions";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, kbd: "1" },
  { to: "/activity", label: "Activity", icon: Activity, kbd: "A" },
  { to: "/how-it-works", label: "How it works", icon: Sparkles, kbd: "2" },
  { to: "/strategy", label: "Strategy", icon: Brain, kbd: "3" },
  { to: "/topical-map", label: "Topical Map", icon: Network, kbd: "4" },
  { to: "/scope", label: "Scope", icon: Lock, kbd: "5" },
  { to: "/engine", label: "Engine", icon: Cog, kbd: "6" },
  { to: "/publish-queue", label: "Publish Queue", icon: ShieldCheck, kbd: "Q" },
  { to: "/tools", label: "Tool Pages", icon: Wrench, kbd: "T" },
  { to: "/kloudgraph", label: "Competitor Graph", icon: Network, kbd: "G" },
  { to: "/internal-links", label: "Internal Links", icon: Link2, kbd: "I" },
  { to: "/knowledge", label: "Knowledge", icon: BrainIcon, kbd: "K" },
  { to: "/experience", label: "Experience Lessons", icon: Lightbulb, kbd: "X" },
  { to: "/reels", label: "Reels Studio", icon: Clapperboard, kbd: "R" },
  { to: "/studio", label: "Media Studio", icon: Film, kbd: "M" },
  { to: "/raffle", label: "Idea Raffle", icon: Dices, kbd: "7" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, kbd: "8" },
  { to: "/keywords", label: "Keywords", icon: Search, kbd: "9" },
  { to: "/briefs", label: "Briefs", icon: FileText, kbd: "0" },
  { to: "/performance", label: "Performance", icon: TrendingUp, kbd: "P" },
  { to: "/citations", label: "AI Citations", icon: Quote, kbd: "C" },
  { to: "/learning", label: "Learning Loop", icon: Brain, kbd: "L" },
  { to: "/conversions", label: "Conversions", icon: DollarSign, kbd: "V" },
  { to: "/entity", label: "Entity Distribution", icon: Globe, kbd: "E" },
  { to: "/settings", label: "Settings", icon: Settings, kbd: "S" },
  { to: "/help", label: "Help & Docs", icon: BookOpen, kbd: "H" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const loc = useLocation();
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="grid h-9 w-9 place-items-center rounded-md text-[var(--brand-foreground)]"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span className="font-mono text-base font-bold">K</span>
            </div>
            <div className="leading-tight">
              <div className="text-display text-[15px] font-semibold tracking-tight">
                kloudbean<span className="text-primary">.</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                SEO · Engine
              </div>
            </div>
          </Link>
        </div>

        <div className="mx-3 mb-3 rounded-md border border-sidebar-border bg-card/40 px-3 py-2.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--lime)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--lime)]" />
            </span>
            Engine running · <SystemHealthOkBadge />
          </div>
          <div className="mt-1 text-[11px] text-foreground/85">
            Autonomous SEO pipeline for <span className="font-mono">kloudbean.com</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                <span className="flex-1">{n.label}</span>
                <kbd className="hidden font-mono text-[10px] text-muted-foreground/60 group-hover:inline">
                  {n.kbd}
                </kbd>
                {active && <span className="h-4 w-0.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <WordpressNavStatus />
      </aside>
      <main className="flex-1 overflow-auto">
        <SystemHealthBanner />
        <div
          className="grid-bg min-h-full"
          style={{ background: "var(--gradient-surface), var(--background)" }}
        >
          {children}
        </div>
      </main>
      <AssistantWidget />
    </div>
  );
}

/**
 * Live WordPress connection badge for the sidebar footer. Reads the SAME
 * status the Settings page uses (shared `wp-status` query key) so the two can
 * never disagree — this used to be a hardcoded "Not linked" label, which is
 * why it showed "Not linked" even when Settings said Connected.
 *
 * Note: this reflects the WordPress REST API connection (Application Password),
 * which is what drives article auto-publish. The Tool Pages sync/optimize/Fix
 * HTML use a SEPARATE connection (the Kloudbean SEO Engine plugin API key).
 */
function WordpressNavStatus() {
  const fn = useServerFn(wpStatus);
  const { data } = useQuery({
    queryKey: ["wp-status"],
    queryFn: () => fn({}),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  // wpStatus returns a union (site/user only exist on the configured branch).
  const s = data as { connected?: boolean; site?: string; user?: string } | undefined;
  const connected = !!s?.connected;
  const site = s?.site?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>WordPress</span>
        {connected ? (
          <span className="rounded-sm bg-[var(--lime)]/15 px-1.5 py-0.5 text-[var(--lime)]">
            Linked
          </span>
        ) : (
          <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-amber-400">Not linked</span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-foreground/70">
        {connected ? (
          <>
            Publishing to <span className="font-mono">{site ?? "kloudbean.com"}</span>
            {s?.user ? ` as ${s.user}` : ""}.
          </>
        ) : (
          "Connect in Settings to enable auto-publish."
        )}
      </div>
    </div>
  );
}
