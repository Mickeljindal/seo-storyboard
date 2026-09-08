import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Users, Upload, Trash2, Loader2, Search, FileSpreadsheet, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  contactCountsFn,
  listContactsFn,
  importContactsCsvFn,
  updateContactStatusFn,
  setContactSubscribedFn,
  deleteContactFn,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/crm")({ component: CrmPage });

const STATUSES = ["paying", "abandoned", "registered", "lead", "unknown"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLE: Record<string, string> = {
  paying: "bg-emerald-100 text-emerald-700 border-emerald-200",
  abandoned: "bg-amber-100 text-amber-700 border-amber-200",
  registered: "bg-sky-100 text-sky-700 border-sky-200",
  lead: "bg-violet-100 text-violet-700 border-violet-200",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

function CrmPage() {
  const qc = useQueryClient();
  const counts = useServerFn(contactCountsFn);
  const list = useServerFn(listContactsFn);
  const importCsv = useServerFn(importContactsCsvFn);
  const setStatus = useServerFn(updateContactStatusFn);
  const setSub = useServerFn(setContactSubscribedFn);
  const del = useServerFn(deleteContactFn);

  const [segment, setSegment] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [defaultStatus, setDefaultStatus] = useState<Status>("unknown");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: countData, refetch: refetchCounts } = useQuery({
    queryKey: ["crm-counts"],
    queryFn: () => counts({}),
  });
  const { data: listData, refetch: refetchList } = useQuery({
    queryKey: ["crm-list", segment, search],
    queryFn: () => list({ data: { segment, search: search || undefined, limit: 300 } }),
  });

  const contacts = listData?.contacts ?? [];
  const c = countData?.counts;
  const segments = countData?.segments ?? [];

  const runImport = useMutation({
    mutationFn: (csv: string) => importCsv({ data: { csv, defaultStatus } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Import failed");
        return;
      }
      toast.success(
        `Imported ${r.inserted} new, updated ${r.updated}${r.invalidRows ? `, skipped ${r.invalidRows} invalid` : ""}`,
      );
      refetchCounts();
      refetchList();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => runImport.mutate(String(reader.result ?? ""));
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsText(file);
  };

  const changeStatus = useMutation({
    mutationFn: (v: { id: string; status: Status }) => setStatus({ data: v }),
    onSuccess: () => {
      refetchCounts();
      refetchList();
    },
  });
  const toggleSub = useMutation({
    mutationFn: (v: { id: string; subscribed: boolean }) => setSub({ data: v }),
    onSuccess: () => {
      refetchCounts();
      refetchList();
    },
  });
  const removeContact = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      refetchCounts();
      refetchList();
    },
  });

  const [paste, setPaste] = useState("");

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#000f27] text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CRM Contacts</h1>
            <p className="text-sm text-slate-500">
              Your customer list for prompt-to-email. Upload a CSV, tag people by lifecycle, then send to a segment.
            </p>
          </div>
        </div>

        {/* Segment tiles */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => setSegment("all")}
            className={`rounded-xl border p-3 text-left transition ${segment === "all" ? "border-[#4F1AF3] ring-2 ring-[#4F1AF3]/20" : "border-slate-200 hover:border-slate-300"}`}
          >
            <div className="text-xs font-medium text-slate-500">Total</div>
            <div className="text-xl font-bold text-slate-900">{c?.total ?? 0}</div>
            <div className="text-[11px] text-slate-400">{c?.subscribed ?? 0} subscribed</div>
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setSegment(s)}
              className={`rounded-xl border p-3 text-left capitalize transition ${segment === s ? "border-[#4F1AF3] ring-2 ring-[#4F1AF3]/20" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="text-xs font-medium text-slate-500">{s}</div>
              <div className="text-xl font-bold text-slate-900">{c?.byStatus?.[s] ?? 0}</div>
            </button>
          ))}
        </div>

        {/* Upload */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileSpreadsheet className="h-4 w-4 text-[#4F1AF3]" /> Import contacts
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Upload or paste a CSV. We look for <code>email</code>, <code>name</code>, <code>company</code> and{" "}
            <code>status</code> columns; anything else is kept as-is. Using Excel? Export to CSV first. Import
            updates people by email, so re-uploading a fuller list is safe.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-slate-600">
              Stamp rows with no status as:
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value as Status)}
                className="ml-2 rounded-md border border-slate-200 px-2 py-1 text-xs capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={runImport.isPending}
              className="bg-[#4F1AF3] hover:bg-[#3d13c4]"
            >
              {runImport.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload CSV file
            </Button>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500">or paste CSV text</summary>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={5}
              placeholder="email,name,company,status&#10;jane@acme.com,Jane,Acme,paying"
              className="mt-2 w-full rounded-md border border-slate-200 p-2 font-mono text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={!paste.trim() || runImport.isPending}
              onClick={() => runImport.mutate(paste)}
            >
              Import pasted text
            </Button>
          </details>
        </div>

        {/* Search + table */}
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, name or company"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <span className="text-xs text-slate-500">{contacts.length} shown</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Subscribed</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No contacts yet. Import a CSV to get started.
                  </td>
                </tr>
              )}
              {contacts.map((ct) => (
                <tr key={ct.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{ct.name || ct.email}</div>
                    <div className="text-xs text-slate-500">{ct.email}</div>
                    {ct.company && <div className="text-xs text-slate-400">{ct.company}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ct.status}
                      onChange={(e) => changeStatus.mutate({ id: ct.id, status: e.target.value as Status })}
                      className={`rounded-full border px-2 py-1 text-xs font-medium capitalize ${STATUS_STYLE[ct.status] ?? STATUS_STYLE.unknown}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSub.mutate({ id: ct.id, subscribed: !ct.subscribed })}
                      className={`text-xs font-medium ${ct.subscribed ? "text-emerald-600" : "text-slate-400"}`}
                    >
                      {ct.subscribed ? "Subscribed" : "Unsubscribed"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{ct.source}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeContact.mutate(ct.id)}
                      className="text-slate-400 hover:text-red-500"
                      title="Delete contact"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <Mail className="h-3.5 w-3.5" /> Ready to send? Head to Vibe Emailing to write one prompt and reach a segment.
        </p>
      </div>
    </AppLayout>
  );
}
