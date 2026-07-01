import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { seedArticles } from "@/lib/seed.functions";
import { wpStatus } from "@/lib/wordpress.functions";
import { testDataForSeoConnection } from "@/lib/dataforseo.functions";
import { testSerperConnectionFn } from "@/lib/serper.functions";
import { testAiConnectionFn, refreshSupportKbFn } from "@/lib/ai.functions";
import {
  testGscConnectionFn,
  saveGscSettingsFn,
  gscSettingsStatusFn,
  testBingConnectionFn,
  saveBingSettingsFn,
  bingSettingsStatusFn,
} from "@/lib/analytics.functions";
import {
  KLOUDBEAN_CAPABILITY_GUARD,
  KSA_GCP_DAMMAM_FACTS,
  SUPPORT_KB_BASE,
} from "@/lib/kloudbean-knowledge";
import { toast } from "sonner";
import {
  Database,
  KeyRound,
  Sparkles,
  Plug,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  LineChart,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const testDfs = useServerFn(testDataForSeoConnection);
  const dfsTest = useQuery({ queryKey: ["dfs-test"], queryFn: () => testDfs({}) });

  const testSerper = useServerFn(testSerperConnectionFn);
  const serperTest = useQuery({ queryKey: ["serper-test"], queryFn: () => testSerper({}) });

  const testAi = useServerFn(testAiConnectionFn);
  const aiTest = useQuery({ queryKey: ["ai-test"], queryFn: () => testAi({}) });

  const refreshKb = useServerFn(refreshSupportKbFn);
  const kbRefresh = useMutation({
    mutationFn: () => refreshKb({}),
    onSuccess: (r) => {
      if (r.ok) toast.success(r.message);
      else toast.error(r.message);
    },
    onError: (e) => toast.error(String(e)),
  });

  const seedFn = useServerFn(seedArticles);
  const reseed = useMutation({
    mutationFn: () => seedFn({ data: { force: true } }),
    onSuccess: (r: { inserted?: number }) => toast.success(`Reseeded ${r.inserted ?? 0} articles`),
    onError: (e: Error) => toast.error(e.message),
  });

  const wpStatusFn = useServerFn(wpStatus);
  const wp = useQuery({ queryKey: ["wp-status"], queryFn: () => wpStatusFn({}) });
  const wpData = wp.data ?? {};

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-8 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect DataForSEO for live keywords and WordPress for one-click publishing. Credentials
          live in <code className="rounded bg-secondary px-1">.env</code> — restart the dev server
          after changes.
        </p>

        <GscCard />
        <BingCard />

        <Section
          icon={Search}
          title="Serper.dev — keyword & idea discovery (recommended)"
          desc="Cheap Google SERP API: autocomplete keyword expansion, People Also Ask, related searches, and SERP competitors. Preferred over DataForSEO."
        >
          <StatusLine
            loading={serperTest.isLoading}
            ok={serperTest.data?.ok}
            message={serperTest.data?.message ?? "Not tested"}
          />
          <ol className="mb-4 ml-4 list-decimal space-y-2 text-xs text-muted-foreground">
            <li>
              Get an API key at{" "}
              <a
                href="https://serper.dev/"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                serper.dev <ExternalLink className="h-3 w-3" />
              </a>{" "}
              (2,500 free credits, then very low cost per search).
            </li>
            <li>
              Add to <code>.env</code>:
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px]">{`SERPER_API_KEY=your-serper-key`}</pre>
            </li>
            <li>
              Restart the server: <code>npm run dev</code>
            </li>
            <li>
              In{" "}
              <Link to="/engine" className="text-primary hover:underline">
                Engine
              </Link>
              , set Discovery source = <b>Serper.dev</b>.
            </li>
          </ol>
          <Button size="sm" variant="outline" onClick={() => serperTest.refetch()}>
            <Search className="mr-1.5 h-3 w-3" /> Test Serper connection
          </Button>
        </Section>

        <Section
          icon={KeyRound}
          title="DataForSEO (optional — volume data)"
          desc="Live keyword volume, SERP features, search intent, related keywords, and competitor gaps. Costlier; optional if using Serper."
        >
          <StatusLine
            loading={dfsTest.isLoading}
            ok={dfsTest.data?.ok}
            message={dfsTest.data?.message ?? "Not tested"}
          />
          <ol className="mb-4 ml-4 list-decimal space-y-2 text-xs text-muted-foreground">
            <li>
              Sign up at{" "}
              <a
                href="https://app.dataforseo.com/"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                app.dataforseo.com <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              Open <b>API Access</b> and copy your API login (email) and API password (not your
              account login).
            </li>
            <li>
              Add to <code>.env</code> in the project root:
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px]">{`DATAFORSEO_LOGIN=your-api-login@email.com
DATAFORSEO_PASSWORD=your-api-password`}</pre>
            </li>
            <li>
              Restart the server: <code>npm run dev</code>
            </li>
            <li>
              Test below, then use{" "}
              <Link to="/keywords" className="text-primary hover:underline">
                Keywords
              </Link>{" "}
              or open an article → <b>DataForSEO Research</b>
            </li>
          </ol>
          <Button size="sm" variant="outline" onClick={() => dfsTest.refetch()}>
            <Search className="mr-1.5 h-3 w-3" /> Test DataForSEO connection
          </Button>
        </Section>

        <Section
          icon={Database}
          title="Kloudbean PostgreSQL (DBS)"
          desc="Managed database — credentials from DBS → Administration. IP whitelist required."
        >
          <ol className="mb-4 ml-4 list-decimal space-y-2 text-xs text-muted-foreground">
            <li>
              Launch PostgreSQL:{" "}
              <a
                href="https://support.kloudbean.com/docs/database-launch/launching-postgres"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Kloudbean docs <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <b>Firewall tab</b> → if &quot;Allow database public access&quot; is ON, IP whitelist
              is not needed
            </li>
            <li>
              <b>Access tab</b> → copy Host, Port, <b>Database Name</b>, <b>Master User</b>,
              Password into <code>.env</code>
              (instance title &quot;Kloudbean&quot; on dashboard may differ from Database Name):
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px]">{`DATABASE_HOST=your-db.kloudbeansite.com
DATABASE_PORT=5432
DATABASE_NAME=your_db
DATABASE_USER=master_user
DATABASE_PASSWORD=from_panel`}</pre>
            </li>
            <li>
              Run <code>npm run setup</code> then restart <code>npm run dev</code>
            </li>
          </ol>
        </Section>

        <Section
          icon={Sparkles}
          title="AI Provider (DeepSeek recommended)"
          desc="Briefs and draft content. DeepSeek is tried first; OpenRouter/OpenAI fallback."
        >
          <StatusLine
            loading={aiTest.isLoading}
            ok={aiTest.data?.ok}
            message={aiTest.data?.message ?? "Not tested"}
          />
          <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px] text-muted-foreground">{`# Preferred — DeepSeek (platform.deepseek.com)
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Fallback — OpenRouter / OpenAI-compatible
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-4o-mini

# Or put DeepSeek key here instead:
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# AI_MODEL=deepseek-chat`}</pre>
          <p className="mb-3 text-xs text-muted-foreground">
            After editing <code>.env</code>, restart <code>npm run dev</code>. DeepSeek key takes
            priority over OpenAI key.
            {aiTest.data?.configured && (
              <>
                {" "}
                Active: <b>{aiTest.data.provider ?? aiTest.data.message}</b>
              </>
            )}
          </p>
          <Button size="sm" variant="outline" onClick={() => aiTest.refetch()}>
            <Sparkles className="mr-1.5 h-3 w-3" /> Test AI connection
          </Button>
        </Section>

        <Section
          icon={Database}
          title="Knowledge graph & KSA alignment"
          desc="How the engine ideates — grounded in support.kloudbean.com, no over-promising."
        >
          <p className="mb-3 text-xs text-muted-foreground">
            Primary KB:{" "}
            <a
              href={SUPPORT_KB_BASE}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              {SUPPORT_KB_BASE} <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <div className="mb-3 rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">
              KSA · GCP Dammam ({KSA_GCP_DAMMAM_FACTS.regionId})
            </p>
            <p className="mb-2">{KSA_GCP_DAMMAM_FACTS.positioning}</p>
            <ul className="ml-4 list-disc space-y-1">
              {KSA_GCP_DAMMAM_FACTS.pricingNotes.slice(0, 2).map((n) => (
                <li key={n.slice(0, 40)}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Content guardrails</p>
            <p className="mb-1">
              <b>Can claim:</b> {KLOUDBEAN_CAPABILITY_GUARD.canClaim.slice(0, 3).join(" · ")} …
            </p>
            <p className="mb-3">
              <b>Must not:</b> {KLOUDBEAN_CAPABILITY_GUARD.mustNotClaim.slice(0, 2).join(" · ")} …
            </p>
            <p className="mb-2 text-muted-foreground">
              Briefs and drafts pull live excerpts from support docs (cached 24h) so ideas stay
              aligned with what Kloudbean actually ships.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={kbRefresh.isPending}
              onClick={() => kbRefresh.mutate()}
            >
              <Database className="mr-1.5 h-3 w-3" /> Refresh support KB cache
            </Button>
          </div>
        </Section>

        <Section
          icon={Plug}
          title="WordPress"
          desc="Publish briefs or full drafts to kloudbean.com via the WordPress REST API."
        >
          <StatusLine
            loading={wp.isLoading}
            ok={wpData.connected}
            message={
              wpData.connected
                ? `Connected to ${wpData.site} as ${wpData.user}${wpData.canPublish === false ? " (may lack publish permission)" : ""}`
                : (wpData.error ?? "Not connected")
            }
          />
          {wpData.hint && <p className="mb-3 text-xs text-amber-400">{wpData.hint}</p>}
          <ol className="mb-4 ml-4 list-decimal space-y-2 text-xs text-muted-foreground">
            <li>
              In WordPress admin go to <b>Users → Profile → Application Passwords</b>
            </li>
            <li>
              Create a password named e.g. <code>Kloudbean SEO Engine</code> (copy it once)
            </li>
            <li>
              Add to <code>.env</code>:
              <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px]">{`WP_SITE_URL=https://kloudbean.com
WP_USERNAME=your-wp-admin-username
WP_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
# Spaces in the app password are OK — we strip them automatically`}</pre>
            </li>
            <li>
              Ensure permalinks are <b>not</b> “Plain” (Settings → Permalinks → Post name)
            </li>
            <li>
              Restart dev server, click <b>Test WordPress</b> below
            </li>
            <li>
              In any article panel: <b>Send to WP (Draft)</b> or <b>Auto-Publish</b> (uses draft
              content if generated, else brief outline)
            </li>
          </ol>
          <Button size="sm" variant="outline" onClick={() => wp.refetch()}>
            Test WordPress connection
          </Button>
        </Section>

        <Section icon={Database} title="Database">
          <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-background/60 p-3 text-[11px] text-muted-foreground">{`DATABASE_URL=postgresql://user:pass@host:5432/seo_storyboard`}</pre>
          <p className="text-xs text-muted-foreground">
            Run <code>npm run db:migrate</code> after Postgres is up.
          </p>
        </Section>

        <Section icon={Database} title="Defaults">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Default geo</Label>
              <Select defaultValue="sa">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sa">Saudi Arabia</SelectItem>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="ae">UAE</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default language</Label>
              <Select defaultValue="en">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Section
          icon={Database}
          title="Seed database"
          desc="Load the 59 Kloudbean-focused starter articles."
        >
          <Button
            variant="destructive"
            disabled={reseed.isPending}
            onClick={() => {
              if (confirm("Delete all articles and reseed?")) reseed.mutate();
            }}
          >
            Reseed 59 articles
          </Button>
        </Section>
      </div>
    </AppLayout>
  );
}

function BingCard() {
  const statusFn = useServerFn(bingSettingsStatusFn);
  const saveFn = useServerFn(saveBingSettingsFn);
  const testFn = useServerFn(testBingConnectionFn);

  const status = useQuery({ queryKey: ["bing-status"], queryFn: () => statusFn({}) });
  const test = useQuery({ queryKey: ["bing-test"], queryFn: () => testFn({}) });

  const [apiKey, setApiKey] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          apiKey: apiKey.trim() || undefined,
          siteUrl: siteUrl.trim() || undefined,
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Could not save");
        return;
      }
      setApiKey("");
      toast.success(
        r.test?.ok ? `Saved & connected — ${r.test.message}` : "Saved. " + (r.test?.message ?? ""),
      );
      status.refetch();
      test.refetch();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });

  const s = status.data;

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Bing Webmaster Tools (ChatGPT Search & Copilot visibility)</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        ChatGPT Search and Microsoft Copilot use <b>Bing's index</b>. Adding this makes rankings +
        impressions on Bing a direct proxy for AI-answer visibility, filling the gap Google can't
        show.
      </p>

      <StatusLine
        loading={test.isLoading}
        ok={test.data?.ok}
        message={test.data?.message ?? "Not tested"}
      />

      {s?.configured && (
        <div className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-muted-foreground">
          Saved via <b>{s.source === "dashboard" ? "dashboard" : ".env"}</b>
          {s.siteUrl ? (
            <>
              {" "}
              · site <code>{s.siteUrl}</code>
            </>
          ) : null}
        </div>
      )}

      <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-xs text-muted-foreground">
        <li>
          Sign in at{" "}
          <a
            href="https://www.bing.com/webmasters/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-primary hover:underline"
          >
            bing.com/webmasters <ExternalLink className="h-3 w-3" />
          </a>{" "}
          — use <b>Sign in with Google</b> and import your site from GSC (one click).
        </li>
        <li>
          Top-right gear → <b>API Access → API Key → Generate</b>. Copy the key.
        </li>
        <li>Paste it below with your site URL, then Save. That's it.</li>
      </ol>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Bing API key</Label>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="e.g. 0c556b0a9caf4312ac9447b87f59e63d"
            className="font-mono text-[11px]"
          />
        </div>
        <div>
          <Label className="text-xs">Site URL (exactly as verified in Bing Webmaster)</Label>
          <Input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder={s?.siteUrl ?? "https://www.kloudbean.com/"}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={save.isPending || (!apiKey.trim() && !siteUrl.trim())}
            onClick={() => save.mutate()}
            title="Save the Bing Webmaster credentials and connect."
          >
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Search className="mr-1.5 h-3 w-3" />
            )}
            Save & connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => test.refetch()}
            title="Re-check the Bing Webmaster connection."
          >
            <Search className="mr-1.5 h-3 w-3" /> Test connection
          </Button>
        </div>
      </div>
    </div>
  );
}

function GscCard() {
  const statusFn = useServerFn(gscSettingsStatusFn);
  const saveFn = useServerFn(saveGscSettingsFn);
  const testFn = useServerFn(testGscConnectionFn);

  const status = useQuery({ queryKey: ["gsc-status"], queryFn: () => statusFn({}) });
  const test = useQuery({ queryKey: ["gsc-test"], queryFn: () => testFn({}) });

  const [json, setJson] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          serviceAccountJson: json.trim() || undefined,
          siteUrl: siteUrl.trim() || undefined,
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Could not save");
        return;
      }
      setJson("");
      toast.success(
        r.test?.ok ? `Saved & connected — ${r.test.message}` : "Saved. " + (r.test?.message ?? ""),
      );
      status.refetch();
      test.refetch();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });

  const s = status.data;

  return (
    <div className="mb-4 rounded-lg border border-primary/30 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <LineChart className="h-4 w-4 text-primary" />
        <h3 className="font-medium">
          Google Search Console (clicks, rankings & the learning loop)
        </h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Connect once here — no <code>.env</code> editing. This feeds real Google clicks and rankings
        into the engine so it learns what actually wins.
      </p>

      <StatusLine
        loading={test.isLoading}
        ok={test.data?.ok}
        message={test.data?.message ?? "Not tested"}
      />

      {s?.configured && (
        <div className="mb-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-muted-foreground">
          Saved via <b>{s.source === "dashboard" ? "dashboard" : ".env"}</b>
          {s.clientEmail ? (
            <>
              {" "}
              · account <code>{s.clientEmail}</code>
            </>
          ) : null}
          {s.siteUrl ? (
            <>
              {" "}
              · site <code>{s.siteUrl}</code>
            </>
          ) : null}
        </div>
      )}

      <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-xs text-muted-foreground">
        <li>
          In{" "}
          <a
            href="https://console.cloud.google.com/iam-admin/serviceaccounts"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Google Cloud <ExternalLink className="h-3 w-3" />
          </a>{" "}
          create a <b>Service Account</b>, then <b>Keys → Add key → JSON</b> and download it.
        </li>
        <li>
          In{" "}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Search Console <ExternalLink className="h-3 w-3" />
          </a>{" "}
          → Settings → Users and permissions → add that service-account email (Restricted is fine).
        </li>
        <li>Paste the whole JSON file below and your site URL, then Save.</li>
      </ol>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Service account JSON (paste the whole file)</Label>
          <Textarea
            rows={5}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{ "type": "service_account", "client_email": "...", "private_key": "-----BEGIN PRIVATE KEY-----\n..." }'
            className="font-mono text-[11px]"
          />
        </div>
        <div>
          <Label className="text-xs">Site URL (as verified in Search Console)</Label>
          <Input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder={s?.siteUrl ?? "https://www.kloudbean.com/   (or sc-domain:kloudbean.com)"}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            disabled={save.isPending || (!json.trim() && !siteUrl.trim())}
            onClick={() => save.mutate()}
            title="Save the Google Search Console credentials and connect."
          >
            {save.isPending ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <LineChart className="mr-1.5 h-3 w-3" />
            )}
            Save & connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => test.refetch()}
            title="Re-check the Google Search Console connection."
          >
            <Search className="mr-1.5 h-3 w-3" /> Test connection
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusLine({
  loading,
  ok,
  message,
}: {
  loading?: boolean;
  ok?: boolean;
  message: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm">
      {loading ? (
        <span className="text-muted-foreground">Checking…</span>
      ) : ok ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-emerald-400">{message}</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-amber-500" />
          <span>{message}</span>
        </>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-lg border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      {desc && <p className="mb-3 text-xs text-muted-foreground">{desc}</p>}
      {children}
    </div>
  );
}
