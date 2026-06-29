import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Globe, Loader2, Plus, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  entityDistributionFn,
  seedEntityDistributionFn,
  upsertEntityAssetFn,
  updateEntityAssetStatusFn,
  deleteEntityAssetFn,
} from "@/lib/entity-distribution.functions";

export const Route = createFileRoute("/entity")({ component: EntityPage });

type Asset = {
  id: string;
  platform: string;
  asset_type: string | null;
  name: string;
  url: string | null;
  status: string;
  priority: number;
  name_consistent: boolean | null;
  notes: string | null;
};
type Facts = {
  name: string;
  legalName: string;
  url: string;
  tagline: string;
  description: string;
  oneLiner: string;
};

const STATUSES = ["todo", "in_progress", "live", "verified"] as const;
const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  live: "Live",
  verified: "Verified",
};
const STATUS_COLOR: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-100 text-amber-800",
  live: "bg-sky-100 text-sky-800",
  verified: "bg-emerald-100 text-emerald-800",
};
const PRIORITY_LABEL: Record<number, string> = { 1: "High", 2: "Med", 3: "Low" };

function EntityPage() {
  const qc = useQueryClient();
  const dataFn = useServerFn(entityDistributionFn);
  const seedFn = useServerFn(seedEntityDistributionFn);
  const upsertFn = useServerFn(upsertEntityAssetFn);
  const statusFn = useServerFn(updateEntityAssetStatusFn);
  const delFn = useServerFn(deleteEntityAssetFn);

  const { data, isLoading } = useQuery({
    queryKey: ["entity-distribution"],
    queryFn: () => dataFn({}),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["entity-distribution"] });

  const assets = (data?.assets ?? []) as Asset[];
  const summary = data?.summary;
  const facts = data?.facts as Facts | undefined;

  const [copied, setCopied] = useState(false);
  const [newPlatform, setNewPlatform] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  const seedMut = useMutation({
    mutationFn: () => seedFn({}),
    onSuccess: (r) => {
      toast.success(r.seeded ? `Added ${r.seeded} starter tasks` : "Checklist already seeded");
      invalidate();
    },
  });
  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      statusFn({ data: { id: v.id, status: v.status as (typeof STATUSES)[number] } }),
    onSuccess: invalidate,
  });
  const consistentMut = useMutation({
    mutationFn: (v: { id: string; nameConsistent: boolean }) =>
      statusFn({ data: { id: v.id, nameConsistent: v.nameConsistent } }),
    onSuccess: invalidate,
  });
  const addMut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          platform: newPlatform.trim(),
          name: newName.trim() || newPlatform.trim(),
          url: newUrl.trim() || null,
          status: "todo",
          priority: 2,
          assetType: "listing",
        },
      }),
    onSuccess: () => {
      toast.success("Asset added");
      setNewPlatform("");
      setNewName("");
      setNewUrl("");
      invalidate();
    },
    onError: (e) => toast.error(String((e as Error)?.message ?? e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: invalidate,
  });

  const copyFacts = () => {
    if (!facts) return;
    const text = `${facts.name}\n${facts.legalName}\n${facts.url}\n${facts.tagline}\n\n${facts.description}`;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Globe className="h-6 w-6" /> Entity Distribution
            </h1>
            <p className="text-sm text-muted-foreground">
              Off-site mentions correlate ~3x stronger with AI citations than backlinks. Track the
              high-value listings/profiles and keep Kloudbean's facts identical everywhere.
            </p>
          </div>
          {assets.length === 0 && (
            <Button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
              {seedMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Seed starter checklist
            </Button>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Assets tracked" value={String(summary.total)} />
            <Stat
              label="Live / verified"
              value={summary.total ? `${Math.round(summary.liveRate * 100)}%` : "—"}
              accent="text-emerald-600"
            />
            <Stat label="To do" value={String(summary.byStatus.todo ?? 0)} />
            <Stat
              label="High-priority open"
              value={String(summary.highPriorityTodo)}
              accent={summary.highPriorityTodo ? "text-amber-600" : ""}
            />
          </div>
        )}

        {/* Canonical facts */}
        {facts && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium">
                Canonical facts — copy verbatim onto every platform
              </h2>
              <Button size="sm" variant="outline" onClick={copyFacts}>
                {copied ? (
                  <Check className="mr-1.5 h-3 w-3" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                Copy
              </Button>
            </div>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Fact k="Name" v={facts.name} />
              <Fact k="Legal name" v={facts.legalName} />
              <Fact k="URL" v={facts.url} />
              <Fact k="Tagline" v={facts.tagline} />
            </dl>
            <p className="mt-2 text-sm text-muted-foreground">{facts.description}</p>
          </div>
        )}

        {/* Add custom asset */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <input
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            placeholder="Platform (e.g. AlternativeTo)"
            className="w-44 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Asset name"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL (optional)"
            className="w-56 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button
            variant="outline"
            disabled={addMut.isPending || newPlatform.trim().length < 2}
            onClick={() => addMut.mutate()}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>

        {/* Assets table */}
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3 text-sm font-medium">Off-site assets</div>
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No assets yet. Click “Seed starter checklist” to load the high-value platforms.
            </div>
          ) : (
            <div className="divide-y">
              {assets.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      a.priority === 1
                        ? "bg-rose-100 text-rose-700"
                        : a.priority === 2
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                    }`}
                    title={`Priority: ${PRIORITY_LABEL[a.priority]}`}
                  >
                    {PRIORITY_LABEL[a.priority]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {a.platform}
                      {a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.name}</div>
                    {a.notes && (
                      <div className="mt-1 text-xs text-muted-foreground/80">{a.notes}</div>
                    )}
                    <label className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={a.name_consistent === true}
                        onChange={(e) =>
                          consistentMut.mutate({ id: a.id, nameConsistent: e.target.checked })
                        }
                      />
                      Name/facts consistent
                    </label>
                  </div>
                  <select
                    value={a.status}
                    onChange={(e) => statusMut.mutate({ id: a.id, status: e.target.value })}
                    className={`shrink-0 rounded px-2 py-1 text-xs ${STATUS_COLOR[a.status] ?? ""}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => delMut.mutate(a.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground/60 hover:text-rose-600"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words font-medium">{v}</dd>
    </div>
  );
}
