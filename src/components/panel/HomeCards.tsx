import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Gift, Lock, Server, KeyRound } from "lucide-react";
import { getPanelAccount, newPanelPassword } from "@/lib/panel.functions";
import { errMsg } from "@/lib/auth";
import { Btn, Panel } from "./ui";

const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`truncate text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <button onClick={() => copy(value)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={`Copy ${label}`}><Copy className="size-4" /></button>
    </div>
  );
}

export function PanelAccessCard() {
  const get = useServerFn(getPanelAccount);
  const gen = useServerFn(newPanelPassword);
  const [pass, setPass] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["panel-account"], queryFn: () => get(), staleTime: 5 * 60_000 });

  const generate = async () => {
    setBusy(true);
    try { const r = await gen(); setPass(r.password); toast.success("New panel password created"); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Panel className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-white/5 text-slate-300"><Lock className="size-5" /></span>
        <div><p className="font-display font-semibold text-white">Panel Access</p><p className="text-sm text-slate-400">Manage your bot servers</p></div>
      </div>
      {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !data?.ready ? (
        <p className="rounded-xl border border-amber/30 bg-amber/10 p-3 text-sm text-amber">{data?.message ?? "Not available yet."}</p>
      ) : (
        <div className="space-y-2">
          <Row label="Username" value={data.username} mono />
          <Row label="Email" value={data.email} />
          {pass && <Row label="Password (shown once)" value={pass} mono />}
          <div className="flex gap-2 pt-1">
            <Btn variant="ghost" onClick={generate} disabled={busy} className="flex-1"><KeyRound className="mr-1.5 inline size-4" />{busy ? "Generating…" : pass ? "Generate again" : "Gen Password"}</Btn>
            <a href={data.url} target="_blank" rel="noreferrer"><Btn><ExternalLink className="mr-1.5 inline size-4" />Open panel</Btn></a>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function QuickCards() {
  const items = [
    { to: "/dashboard/rewards", title: "Claim Rewards", sub: "Gift voucher or reward", icon: Gift, tone: "bg-mint/15 text-mint" },
    { to: "/dashboard/order", title: "Hosting Plans", sub: "Browse available plans", icon: Server, tone: "bg-brand/20 text-indigo-300" },
  ] as const;
  return (
    <>
      {items.map((i) => (
        <Link key={i.to} to={i.to}>
          <Panel className="flex items-center gap-3 p-5 transition hover:border-white/20">
            <span className={`grid size-11 place-items-center rounded-xl ${i.tone}`}><i.icon className="size-5" /></span>
            <div><p className="font-display font-semibold text-white">{i.title}</p><p className="text-sm text-slate-400">{i.sub}</p></div>
          </Panel>
        </Link>
      ))}
    </>
  );
}
