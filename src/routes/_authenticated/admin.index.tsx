import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka } from "@/lib/auth";
import { Btn, PageHeader, Panel, Stat, StatusBadge } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/")({ component: AdminHome });

function AdminHome() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [paid, pending, clients, active, tickets, recent] = await Promise.all([
        supabase.from("orders").select("amount,created_at").eq("status", "approved").neq("kind", "topup").gte("created_at", monthStart),
        supabase.from("orders").select("*, profiles(full_name,email)").eq("status", "pending").order("created_at").limit(6),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("tickets").select("*, profiles(full_name)").in("status", ["Open", "Customer-Reply"]).order("updated_at", { ascending: false }).limit(6),
        supabase.from("orders").select("amount,created_at").eq("status", "approved").gte("created_at", new Date(Date.now() - 14 * 864e5).toISOString()),
      ]);
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() - (13 - i) * 864e5).toDateString();
        return { d, v: (recent.data ?? []).filter((o) => new Date(o.created_at).toDateString() === d).reduce((a, o) => a + Number(o.amount), 0) };
      });
      return {
        income: (paid.data ?? []).reduce((a, o) => a + Number(o.amount), 0),
        pending: pending.data ?? [],
        clients: clients.count ?? 0,
        active: active.count ?? 0,
        tickets: tickets.data ?? [],
        days,
      };
    },
  });
  const max = Math.max(1, ...(data?.days ?? []).map((d) => d.v));

  return (
    <>
      <PageHeader title="Admin dashboard" sub="Today's snapshot of your hosting business." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Income this month" value={taka(data?.income)} tone="mint" />
        <Stat label="Pending payments" value={data?.pending.length ?? 0} tone="amber" hint="Waiting for approval" />
        <Stat label="Active services" value={data?.active ?? 0} tone="cyan" />
        <Stat label="Clients" value={data?.clients ?? 0} tone="brand" />
      </div>
      <Panel className="mt-6 p-5">
        <h2 className="mb-4 font-display font-semibold text-white">Payments — last 14 days</h2>
        <div className="flex h-36 items-end gap-1.5">
          {data?.days.map((d) => (
            <div key={d.d} className="group relative flex-1">
              <div className="rounded-t-md bg-gradient-to-t from-brand to-cyan opacity-80 transition group-hover:opacity-100" style={{ height: `${Math.max(3, (d.v / max) * 128)}px` }} />
              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink2 px-1.5 py-0.5 text-[10px] text-white group-hover:block">{taka(d.v)}</span>
            </div>
          ))}
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">Pending payments</h2>
            <Link to="/admin/orders"><Btn variant="ghost" className="px-3 py-1 text-xs">View all</Btn></Link>
          </div>
          {data?.pending.length === 0 && <p className="py-6 text-center text-sm text-slate-500">All caught up.</p>}
          <ul className="divide-y divide-white/5">
            {data?.pending.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-mono text-white">#{o.invoice_no}</span>
                <span className="truncate text-slate-400">{(o.profiles as { full_name: string | null; email: string | null } | null)?.email}</span>
                <span className="ml-auto font-mono">{taka(o.amount)}</span>
                <span className="text-xs uppercase text-slate-500">{o.method}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">Tickets awaiting reply</h2>
            <Link to="/admin/tickets"><Btn variant="ghost" className="px-3 py-1 text-xs">View all</Btn></Link>
          </div>
          {data?.tickets.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No open tickets.</p>}
          <ul className="divide-y divide-white/5">
            {data?.tickets.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <Link to="/admin/tickets/$id" params={{ id: t.id }} className="truncate text-cyan hover:underline">{t.subject}</Link>
                <span className="ml-auto text-xs text-slate-500">{fmtDate(t.updated_at)}</span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
