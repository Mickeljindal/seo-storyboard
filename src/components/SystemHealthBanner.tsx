import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { getSystemHealth } from "@/lib/health.functions";

type Health = Awaited<ReturnType<typeof getSystemHealth>>;

export function SystemHealthBanner() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const h = await getSystemHealth();
      setHealth(h);
    } catch (e) {
      setHealth({
        ready: false,
        allOk: false,
        checks: {
          database: { ok: false, message: String((e as Error)?.message ?? e) },
          dataforseo: { ok: false, message: "—" },
          ai: { ok: false, message: "—" },
          wordpress: { ok: false, message: "—" },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return null;
  if (!health || health.ready) return null;

  const { checks } = health;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-100">Setup required — database not ready</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
            <li>
              <strong>Database:</strong> {checks.database.message}
            </li>
            {!checks.dataforseo.ok && (
              <li>
                <strong>DataForSEO:</strong> {checks.dataforseo.message}
              </li>
            )}
            {!checks.ai.ok && (
              <li>
                <strong>AI:</strong> {checks.ai.message}
              </li>
            )}
          </ul>
          <p className="mt-3 text-sm text-amber-100/80">
            Run{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npm run setup</code>
            {" "}then restart{" "}
            <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">npm run dev</code>
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 px-2 py-1 text-xs text-amber-100 hover:bg-amber-500/20"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    </div>
  );
}

export function SystemHealthOkBadge() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    getSystemHealth()
      .then((h) => setOk(h.ready))
      .catch(() => setOk(false));
  }, []);
  if (ok !== true) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-[var(--lime)]">
      <CheckCircle2 className="h-3 w-3" />
      DB live
    </span>
  );
}
