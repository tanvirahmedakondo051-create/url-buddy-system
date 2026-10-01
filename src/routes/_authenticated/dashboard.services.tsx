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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-services", user.id],
    queryFn: async () =>
      (await supabase.from("services").select("*, plans(name,price,ram_mb,disk_gb,cpu_pct)").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <>
      <PageHeader title="My services" sub="Your servers, their resources and renewal dates." action={<Link to="/dashboard/order"><Btn>Order new</Btn></Link>} />
      {isLoading ? <Loading /> : data?.length === 0 ? (
        <Panel className="p-10 text-center text-sm text-slate-500">You don't have any services yet.</Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data?.map((s) => {
            const p = s.plans as { name: string; price: number; ram_mb: number; disk_gb: number; cpu_pct: number } | null;
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
                  {[["RAM", p ? (p.ram_mb >= 1024 ? p.ram_mb / 1024 + " GB" : p.ram_mb + " MB") : "—"], ["Disk", (p?.disk_gb ?? 0) + " GB"], ["CPU", (p?.cpu_pct ?? 0) + "%"]].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-white/10 bg-white/5 py-2.5">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">{k}</p>
                      <p className="font-mono text-sm text-white">{v}</p>
                    </div>
                  ))}
                </div>
                {s.status === "pending_setup" && <p className="mt-3 text-xs text-amber">Your server is being set up. It will appear in the game panel soon.</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {s.status !== "terminated" && <Btn variant="ghost" onClick={() => setRenew(renew === s.id ? null : s.id)}>Renew 30 days</Btn>}
                  {s["ptero_identifier"] && settings?.["ptero_url"] && (
                    <a href={`${settings["ptero_url"].replace(/\/$/, "")}/server/${s["ptero_identifier"]}`} target="_blank" rel="noreferrer">
                      <Btn>Open game panel <ExternalLink className="size-3.5" /></Btn>
                    </a>
                  )}
                </div>
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
