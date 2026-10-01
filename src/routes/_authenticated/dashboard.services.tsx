import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka, useSettings } from "@/lib/auth";
import { Btn, Loading, PageHeader, Panel, StatusBadge } from "@/components/panel/ui";
import { PayForm } from "@/components/panel/PayForm";

export const Route = createFileRoute("/_authenticated/dashboard/services")({ component: Services });

function Services() {
  const { user } = Route.useRouteContext();
  const { data: settings } = useSettings();
  const [renew, setRenew] = useState<string | null>(null);
  const [up, setUp] = useState<string | null>(null);
  const [target, setTarget] = useState<string>("");
  const { data: plans } = useQuery({
    queryKey: ["upgrade-plans"],
    queryFn: async () => (await supabase.from("plans").select("id,name,price,ram_mb,disk_mb,cpu_pct").eq("active", true).eq("archived", false).order("price")).data ?? [],
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-services", user.id],
    queryFn: async () =>
      (await supabase.from("services").select("*, plans(name,price,ram_mb,disk_mb,cpu_pct)").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageHeader title="My services" sub="Your servers, their resources and renewal dates." action={<Link to="/dashboard/order"><Btn>Order new</Btn></Link>} />
      {isLoading ? <Loading /> : data?.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-slate-500">You don't have any services yet.</Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.map((s) => {
            const p = s.plans as { name: string; price: number; ram_mb: number; disk_mb: number; cpu_pct: number } | null;
            return (
              <Panel key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-slate-500">{p?.name} · {taka(p?.price)}/mo · Due {fmtDate(s.due_date)}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[["RAM", p ? (p.ram_mb >= 1024 ? p.ram_mb / 1024 + " GB" : p.ram_mb + " MB") : "—"], ["Disk", (p ? (p.disk_mb >= 1024 ? +(p.disk_mb / 1024).toFixed(1) + " GB" : p.disk_mb + " MB") : "—")], ["CPU", (p?.cpu_pct ?? 0) + "%"]].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/5 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
                      <p className="font-mono text-sm text-white">{v}</p>
                    </div>
                  ))}
                </div>
                {s.status === "pending_setup" && <p className="mt-3 text-xs text-amber">Your server is being set up. It will appear in the game panel soon.</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.status !== "terminated" && <Btn variant="ghost" onClick={() => { setUp(null); setRenew(renew === s.id ? null : s.id); }}>Renew 30 days</Btn>}
                  {s.status !== "terminated" && p && plans?.some((x) => Number(x.price) > Number(p.price)) && (
                    <Btn variant="ghost" onClick={() => { setRenew(null); setTarget(""); setUp(up === s.id ? null : s.id); }}>Upgrade plan</Btn>
                  )}
                  {s["ptero_identifier"] && settings?.["ptero_url"] && (
                    <a href={`${settings["ptero_url"].replace(/\/$/, "")}/server/${s["ptero_identifier"]}`} target="_blank" rel="noreferrer">
                      <Btn>Open game panel <ExternalLink className="size-3.5" /></Btn>
                    </a>
                  )}
                </div>
                {up === s.id && p && (
                  <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                    <p className="text-xs text-slate-400">Pick a bigger plan. You only pay the difference, and your expiry date stays {fmtDate(s.due_date)}.</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plans?.filter((x) => Number(x.price) > Number(p.price)).map((x) => (
                        <button key={x.id} type="button" onClick={() => setTarget(x.id)}
                          className={`rounded-xl border p-3 text-left text-sm transition ${target === x.id ? "border-cyan/60 ring-2 ring-cyan/30" : "border-white/10 hover:border-white/30"}`}>
                          <p className="font-semibold text-white">{x.name}</p>
                          <p className="font-mono text-[11px] text-slate-400">{x.ram_mb >= 1024 ? x.ram_mb / 1024 + " GB" : x.ram_mb + " MB"} RAM · {x.cpu_pct}% CPU</p>
                          <p className="mt-1 text-xs text-mint">Pay {taka(Number(x.price) - Number(p.price))} now</p>
                        </button>
                      ))}
                    </div>
                    {target && (() => {
                      const t = plans?.find((x) => x.id === target);
                      return t ? <PayForm key={target} userId={user.id} kind="upgrade" amount={Number(t.price) - Number(p.price)} planId={t.id} serviceId={s.id} onDone={() => { setUp(null); refetch(); }} /> : null;
                    })()}
                  </div>
                )}
                {renew === s.id && p && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <PayForm userId={user.id} kind="renew" amount={Number(p.price)} serviceId={s.id} onDone={() => { setRenew(null); refetch(); }} />
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
