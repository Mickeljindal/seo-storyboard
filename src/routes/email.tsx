import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Mail, Plus, Trash2, Loader2, Send, Wand2, ShieldCheck, ShieldAlert,
  Server, CheckCircle2, XCircle, PlugZap,
} from "lucide-react";
import { toast } from "sonner";
import {
  listSendersFn, saveSenderFn, deleteSenderFn, testSenderFn,
  composeCampaignFn, sendCampaignFn, listCampaignsFn, deleteCampaignFn,
} from "@/lib/email.functions";

export const Route = createFileRoute("/email")({ component: EmailPage });

const PROVIDERS = ["resend", "brevo", "smtp"] as const;
const SEGMENTS = [
  { key: "all", label: "Everyone subscribed" },
  { key: "paying", label: "Paying customers" },
  { key: "abandoned", label: "Abandoned checkout" },
  { key: "registered", label: "Registered, never bought" },
  { key: "lead", label: "Leads" },
] as const;

type Sender = {
  id: string; label: string; provider: string; fromName: string; fromEmail: string;
  replyTo: string; hasApiKey: boolean; smtpHost: string; smtpPort: number; smtpUser: string;
  hasSmtpPass: boolean; smtpSecure: boolean; dailyCap: number; enabled: boolean;
  lastOkAt: string | null; lastError: string | null;
};

const emptySender = {
  id: "" as string | undefined,
  label: "", provider: "smtp" as (typeof PROVIDERS)[number], fromName: "", fromEmail: "",
  replyTo: "", apiKey: "", smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "",
  smtpSecure: false, dailyCap: 200,
};

function EmailPage() {
  const qc = useQueryClient();
  const listSenders = useServerFn(listSendersFn);
  const saveSender = useServerFn(saveSenderFn);
  const delSender = useServerFn(deleteSenderFn);
  const testSender = useServerFn(testSenderFn);
  const compose = useServerFn(composeCampaignFn);
  const send = useServerFn(sendCampaignFn);
  const listCampaigns = useServerFn(listCampaignsFn);
  const delCampaign = useServerFn(deleteCampaignFn);

  const { data: sendersData, refetch: refetchSenders } = useQuery({
    queryKey: ["email-senders"],
    queryFn: () => listSenders({}),
  });
  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => listCampaigns({}),
    refetchInterval: 6000,
  });

  const senders = (sendersData?.senders ?? []) as Sender[];
  const armed = sendersData?.arm?.enabled ?? false;
  const campaigns = campaignsData?.campaigns ?? [];

  /* ---- sender form ---- */
  const [form, setForm] = useState<typeof emptySender>({ ...emptySender });
  const [showForm, setShowForm] = useState(false);
  const editing = !!form.id;
  const set = <K extends keyof typeof emptySender>(k: K, v: (typeof emptySender)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveMut = useMutation({
    mutationFn: () =>
      saveSender({
        data: {
          id: form.id || undefined,
          label: form.label || form.fromEmail,
          provider: form.provider,
          fromName: form.fromName,
          fromEmail: form.fromEmail,
          replyTo: form.replyTo,
          apiKey: form.apiKey,
          smtpHost: form.smtpHost,
          smtpPort: Number(form.smtpPort) || 587,
          smtpUser: form.smtpUser,
          smtpPass: form.smtpPass,
          smtpSecure: form.smtpSecure,
          dailyCap: Number(form.dailyCap) || 200,
          enabled: true,
        },
      }),
    onSuccess: () => {
      toast.success(editing ? "Sender updated" : "Sender attached");
      setForm({ ...emptySender });
      setShowForm(false);
      refetchSenders();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeSender = useMutation({
    mutationFn: (id: string) => delSender({ data: { id } }),
    onSuccess: () => refetchSenders(),
  });
  const pingSender = useMutation({
    mutationFn: (id: string) => testSender({ data: { id } }),
    onSuccess: (r: { ok: boolean; dryRun?: boolean; error?: string; note?: string }) => {
      if (r.error) toast.error(r.error);
      else if (r.dryRun) toast.message(r.note ?? "Dry run: nothing actually sent");
      else if (r.ok) toast.success("Test email sent");
      refetchSenders();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editSender = (s: Sender) => {
    setForm({
      id: s.id, label: s.label, provider: s.provider as (typeof PROVIDERS)[number],
      fromName: s.fromName, fromEmail: s.fromEmail, replyTo: s.replyTo, apiKey: "",
      smtpHost: s.smtpHost, smtpPort: s.smtpPort, smtpUser: s.smtpUser, smtpPass: "",
      smtpSecure: s.smtpSecure, dailyCap: s.dailyCap,
    });
    setShowForm(true);
  };

  /* ---- compose ---- */
  const [prompt, setPrompt] = useState("");
  const [segment, setSegment] = useState<string>("all");
  const [senderId, setSenderId] = useState<string>("");
  const [draft, setDraft] = useState<{
    campaignId: string; subject: string; html: string; recipientCount: number; segment: string;
  } | null>(null);

  const composeMut = useMutation({
    mutationFn: () =>
      compose({ data: { prompt, segment: segment as (typeof SEGMENTS)[number]["key"], senderId: senderId || undefined } }),
    onSuccess: (r) => {
      setDraft({ campaignId: r.campaignId, subject: r.subject, html: r.html, recipientCount: r.recipientCount, segment: r.segment });
      refetchCampaigns();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: (campaignId: string) => send({ data: { campaignId } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(("error" in r && r.error) || "Send failed");
        return;
      }
      if (r.dryRun) {
        toast.message(`Dry run: simulated ${r.recipients} recipient(s). Set EMAIL_SEND_ENABLED=1 to actually send.`);
      } else {
        toast.success(`Sent ${r.sent}, failed ${r.failed}, skipped ${r.skipped}`);
      }
      refetchCampaigns();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#000f27] text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vibe Emailing</h1>
            <p className="text-sm text-slate-500">
              One prompt writes an on-brand email and sends it to a CRM segment. Attach a sender, describe the email, review, send.
            </p>
          </div>
        </div>

        {/* Arming banner */}
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${armed ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}
        >
          {armed ? <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />}
          <div>
            <div className="font-semibold">
              {armed ? "Live sending is ARMED" : "Safe mode: sends are simulated"}
            </div>
            <div className="text-xs">
              {armed
                ? "EMAIL_SEND_ENABLED=1 is set. Sending a campaign will really deliver email to your subscribed contacts."
                : "Every send is a dry run until EMAIL_SEND_ENABLED=1 is set in the environment. Compose and preview freely; nothing goes out."}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Compose */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Wand2 className="h-4 w-4 text-[#4F1AF3]" /> Compose from a prompt
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Tell paying customers we just shipped managed GCS buckets in Dammam, and how it helps with data residency."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm"
            />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">
                Segment
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {SEGMENTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Send from
                <select
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                >
                  <option value="">Default (env)</option>
                  {senders.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.provider})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              className="mt-3 w-full bg-[#4F1AF3] hover:bg-[#3d13c4]"
              disabled={prompt.trim().length < 3 || composeMut.isPending}
              onClick={() => composeMut.mutate()}
            >
              {composeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Write the email
            </Button>

            {draft && (
              <div className="mt-4 rounded-lg border border-slate-200">
                <div className="border-b border-slate-100 px-4 py-2">
                  <div className="text-xs text-slate-500">Subject</div>
                  <div className="text-sm font-semibold text-slate-900">{draft.subject}</div>
                </div>
                <iframe
                  title="email preview"
                  srcDoc={draft.html}
                  className="h-72 w-full rounded-b-lg bg-white"
                />
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
                  <span className="text-xs text-slate-500">
                    {draft.recipientCount} subscribed contact(s) in “{draft.segment}”
                  </span>
                  <Button
                    size="sm"
                    className={armed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-800"}
                    disabled={sendMut.isPending}
                    onClick={() => sendMut.mutate(draft.campaignId)}
                  >
                    {sendMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {armed ? "Send to segment" : "Dry-run send"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Senders */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Server className="h-4 w-4 text-[#4F1AF3]" /> Sending accounts
              </div>
              <Button size="sm" variant="outline" onClick={() => { setForm({ ...emptySender }); setShowForm((v) => !v); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Attach
              </Button>
            </div>

            {senders.length === 0 && !showForm && (
              <p className="text-xs text-slate-400">
                No sender attached. Add a Resend or Brevo API key, or a Gmail/SMTP account.
              </p>
            )}

            <div className="space-y-2">
              {senders.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      {s.label}
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">{s.provider}</span>
                      {s.lastError ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : s.lastOkAt ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : null}
                    </div>
                    <div className="truncate text-xs text-slate-500">{s.fromEmail}</div>
                    {s.lastError && <div className="truncate text-[11px] text-red-500">{s.lastError}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => pingSender.mutate(s.id)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Send test">
                      {pingSender.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                    </button>
                    <button onClick={() => editSender(s)} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Edit</button>
                    <button onClick={() => removeSender.mutate(s.id)} className="rounded p-1.5 text-slate-400 hover:text-red-500" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showForm && (
              <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Label (e.g. CEO Gmail)" value={form.label} onChange={(e) => set("label", e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                  <select value={form.provider} onChange={(e) => set("provider", e.target.value as (typeof PROVIDERS)[number])} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input placeholder="From name" value={form.fromName} onChange={(e) => set("fromName", e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                  <input placeholder="From email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                  <input placeholder="Reply-to (optional)" value={form.replyTo} onChange={(e) => set("replyTo", e.target.value)} className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                </div>

                {form.provider !== "smtp" ? (
                  <input
                    placeholder={`${form.provider} API key${editing ? " (leave blank to keep current)" : ""}`}
                    value={form.apiKey}
                    onChange={(e) => set("apiKey", e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="SMTP host (e.g. smtp.gmail.com)" value={form.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} className="col-span-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                    <input placeholder="Port" type="number" value={form.smtpPort} onChange={(e) => set("smtpPort", Number(e.target.value))} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={form.smtpSecure} onChange={(e) => set("smtpSecure", e.target.checked)} /> TLS (port 465)
                    </label>
                    <input placeholder="SMTP user" value={form.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                    <input placeholder={`Password / app password${editing ? " (blank = keep)" : ""}`} type="password" value={form.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                  </div>
                )}
                {form.provider === "smtp" && (
                  <p className="text-[11px] text-slate-400">
                    SMTP needs the optional <code>nodemailer</code> package installed. Resend and Brevo send over HTTPS with no extra install.
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setForm({ ...emptySender }); }}>Cancel</Button>
                  <Button size="sm" className="bg-[#4F1AF3] hover:bg-[#3d13c4]" disabled={!form.fromEmail || saveMut.isPending} onClick={() => saveMut.mutate()}>
                    {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editing ? "Save" : "Attach sender"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaign history */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 text-sm font-semibold text-slate-900">Recent campaigns</div>
          {campaigns.length === 0 && <p className="text-xs text-slate-400">No campaigns yet.</p>}
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{c.subject}</div>
                  <div className="text-xs text-slate-500">
                    <span className="capitalize">{c.segment}</span> ·{" "}
                    {c.dryRun ? "dry run" : `sent ${c.recipientsSent}/${c.recipientsTotal}`}
                    {c.error ? <span className="text-red-500"> · {c.error}</span> : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.status === "sent" ? "bg-emerald-100 text-emerald-700" : c.status === "failed" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                    {c.status}
                  </span>
                  <button onClick={() => delCampaign({ data: { id: c.id } }).then(() => refetchCampaigns())} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
