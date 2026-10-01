import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { taka } from "@/lib/auth";
import { PageHeader, Panel, Stat, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/reports")({ component: Reports });

function Reports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const since = new Date(); since.setMonth(since.getMonth() - 11); since.setDate(1);
      const [o, p] = await Promise.all([
        supabase.from("orders").select("amount,created_at,kind,plan_id,plans(name),method").eq("status", "approved").gte("created_at", since.toISOString()),
        supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
      ]);
      const months: { key: string; label: string; income: number; clients: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(since); d.setMonth(since.getMonth() + i);
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en", { month: "short", year: "2-digit" }), income: 0, clients: 0 });
      }
      const k = (s: string) => { const d = new Date(s); return `${d.getFullYear()}-${d.getMonth()}`; };
      const plans: Record<string, { name: string; count: number; income: number }> = {};
      for (const r of o.data ?? []) {
        if (r.method === "wallet" && r.kind !== "topup") { /* wallet spend already counted as top-up */ } else {
          const m = months.find((x) => x.key === k(r.created_at)); if (m) m.income += Number(r.amount);
        }
        const n = (r.plans as { name: string } | null)?.name;
        if (n && r.kind !== "topup") { plans[n] ??= { name: n, count: 0, income: 0 }; plans[n].count++; plans[n].income += Number(r.amount); }
      }
      for (const r of p.data ?? []) { const m = months.find((x) => x.key === k(r.created_at)); if (m) m.clients++; }
      return { months, plans: Object.values(plans).sort((a, b) => b.count - a.count) };
    },
  });
  const months = data?.months ?? [];
  const max = Math.max(1, ...months.map((m) => m.income));
  const total = months.reduce((a, m) => a + m.income, 0);
  return (
    <>
      <PageHeader title="Reports" sub="Last 12 months" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Income (12 months)" value={taka(total)} tone="mint" />
        <Stat label="New clients (12 months)" value={months.reduce((a, m) => a + m.clients, 0)} tone="cyan" />
        <Stat label="Orders sold" value={(data?.plans ?? []).reduce((a, p) => a + p.count, 0)} tone="brand" />
      </div>
      <Panel className="mb-6 p-5">
        <h2 className="mb-4 font-display font-semibold text-white">Income by month</h2>
        <div className="flex h-48 items-end gap-2">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1" title={taka(m.income)}>
              <div className="w-full rounded-t bg-gradient-to-t from-brand to-cyan" style={{ height: `${(m.income / max) * 100}%`, minHeight: 2 }} />
              <span className="text-[10px] text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-3 font-display font-semibold text-white">Top plans</h2>
          <Table head={["Plan", "Sold", "Income"]}>{(data?.plans ?? []).map((p) => <tr key={p.name}><Td className="text-white">{p.name}</Td><Td>{p.count}</Td><Td>{taka(p.income)}</Td></tr>)}</Table>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-3 font-display font-semibold text-white">New clients by month</h2>
          <Table head={["Month", "Clients", "Income"]}>{[...months].reverse().map((m) => <tr key={m.key}><Td>{m.label}</Td><Td>{m.clients}</Td><Td>{taka(m.income)}</Td></tr>)}</Table>
        </Panel>
      </div>
    </>
  );
}
