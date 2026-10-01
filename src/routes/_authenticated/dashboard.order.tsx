import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { taka } from "@/lib/auth";
import { Field, Input, Loading, PageHeader, Panel } from "@/components/panel/ui";
import { PayForm } from "@/components/panel/PayForm";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/order")({ component: Order });

function Order() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await supabase.from("plans").select("*").eq("active", true).order("sort")).data ?? [],
  });
  const plan = plans?.find((p) => p.id === planId);

  return (
    <>
      <PageHeader title="Order a new server" sub="Pick a plan, name your server and pay. Billed monthly." />
      {isLoading ? <Loading /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans?.map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)} className="text-left">
              <Panel className={cn("h-full p-5 transition hover:border-white/20", planId === p.id && "border-cyan/60 ring-2 ring-cyan/30")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{p.tier}</span>
                  {p.featured && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">Popular</span>}
                </div>
                <p className="mt-1 font-display text-lg font-bold text-white">{p.name}</p>
                <p className="mt-2 font-display text-2xl font-bold text-white">{taka(p.price)}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2"><MemoryStick className="size-3.5 text-cyan" />{p.ram_mb >= 1024 ? p.ram_mb / 1024 + " GB" : p.ram_mb + " MB"} RAM</li>
                  <li className="flex items-center gap-2"><HardDrive className="size-3.5 text-cyan" />{p.disk_mb >= 1024 ? +(p.disk_mb / 1024).toFixed(1) + " GB" : p.disk_mb + " MB"} SSD</li>
                  <li className="flex items-center gap-2"><Cpu className="size-3.5 text-cyan" />{p.cpu_pct}% CPU</li>
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-3.5 text-mint" />{f}</li>)}
                </ul>
              </Panel>
            </button>
          ))}
        </div>
      )}
      {plan && (
        <Panel className="mt-6 max-w-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-white">Checkout — {plan.name}</h2>
          <div className="mt-4 space-y-4">
            <Field label="Server name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="my-discord-bot" /></Field>
            <PayForm userId={user.id} kind="new" amount={Number(plan.price)} planId={plan.id} serverName={name} onDone={() => navigate({ to: "/dashboard/invoices" })} />
          </div>
        </Panel>
      )}
    </>
  );
}
