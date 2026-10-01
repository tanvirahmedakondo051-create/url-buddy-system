import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const size = (mb: number) => (mb >= 1024 ? `${+(mb / 1024).toFixed(1)} GB` : `${mb} MB`);

export function usePublicPlans() {
  return useQuery({
    queryKey: ["public-plans"],
    queryFn: async () =>
      (await supabase.from("plans").select("id,name,tier,price,ram_mb,disk_mb,cpu_pct,features,featured").eq("active", true).order("sort")).data ?? [],
  });
}

/** Live plans from Admin → Products. `limit` shows only the first N. */
export function PlanGrid({ limit }: { limit?: number }) {
  const { data, isLoading } = usePublicPlans();
  const plans = limit ? (data ?? []).slice(0, limit) : data ?? [];
  if (isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: limit ?? 4 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
      </div>
    );
  if (!plans.length) return <p className="text-center text-slate-400">No plans available right now.</p>;
  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${limit && limit <= 3 ? "md:grid-cols-3" : "lg:grid-cols-4"}`}>
      {plans.map((p, i) => (
        <div key={p.id} className="reveal" style={{ animationDelay: `${i * 80}ms` }}>
          <div className={p.featured ? "plan-glow relative h-full rounded-2xl p-[1.5px]" : "h-full"}>
            <div className={`relative flex h-full flex-col rounded-2xl p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 ${p.featured ? "bg-background/90" : "border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"}`}>
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-cyan px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-brand/40">Most popular</div>
              )}
              <div className={`text-sm font-medium ${p.featured ? "text-cyan" : "text-slate-400"}`}>{p.tier} · {p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-white">৳{Number(p.price)}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-300">
                <li className="flex items-center gap-2"><MemoryStick className="size-4 text-cyan" /> {size(p.ram_mb)} RAM</li>
                <li className="flex items-center gap-2"><HardDrive className="size-4 text-cyan" /> {size(p.disk_mb)} SSD</li>
                <li className="flex items-center gap-2"><Cpu className="size-4 text-cyan" /> {p.cpu_pct}% CPU</li>
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-4 text-mint" /> {f}</li>)}
              </ul>
              <Link
                to="/dashboard/order"
                className={p.featured ? "btn-shine mt-6 block rounded-xl bg-gradient-to-r from-brand to-cyan py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand/30" : "mt-6 block rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"}
              >
                Deploy server
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
