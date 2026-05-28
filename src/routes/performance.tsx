import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/performance")({ component: Performance });

function Performance() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-8 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Performance Tracker</h1>
        <p className="mb-6 text-sm text-muted-foreground">Connect Google Search Console to see impressions, clicks, CTR, and ranking history per article.</p>

        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <TrendingUp className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-lg font-medium">Connect Google Search Console</h2>
          <p className="mt-1 text-sm text-muted-foreground">OAuth flow is wired in Settings. Once connected, this page surfaces quick-win articles ranked 4–15 and lets you export monthly PDF reports.</p>
          <Button className="mt-4" variant="secondary"><Link2 className="mr-2 h-4 w-4" /> Connect GSC</Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Impressions", "Clicks", "Avg position"].map((m) => (
            <div key={m} className="rounded-lg border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{m}</div>
              <div className="mt-2 text-2xl font-semibold">—</div>
              <div className="mt-3 h-12 rounded bg-secondary/40" />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
