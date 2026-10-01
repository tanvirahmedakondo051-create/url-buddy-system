import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka, useProfile } from "@/lib/auth";
import { PageHeader, Panel, Stat, StatusBadge, Btn } from "@/components/panel/ui";
import { PanelAccessCard, QuickCards } from "@/components/panel/HomeCards";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);
  const { data } = useQuery({
    queryKey: ["client-overview", user.id],
    queryFn: async () => {
      const [s, o, t, a] = await Promise.all([
        supabase.from("services").select("id,name,status,due_date,plans(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending"),
        supabase.from("tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "Closed"),
        supabase.from("announcements").select("*").eq("published", true).order("created_at", { ascending: false }).limit(3),
      ]);
      return { services: s.data ?? [], pending: o.count ?? 0, tickets: t.count ?? 0, ann: a.data ?? [] };
    },
  });
  const services = data?.services ?? [];
  const soon = services.filter((s) => s.status !== "terminated" && new Date(s.due_date).getTime() - Date.now() < 3 * 864e5);

  return (
    <>
      <PageHeader
        title={`Hi, ${profile?.full_name?.split(" ")[0] || "there"} 👋`}
        sub="Here's what's happening with your servers."
        action={<Link to="/dashboard/order"><Btn>Order new server</Btn></Link>}
      />
      {soon.length > 0 && (
        <Panel className="mb-6 flex items-center gap-3 border-amber/30 bg-amber/10 p-4 text-sm text-amber">
          <AlertTriangle className="size-4 shrink-0" />
          {soon.length} service{soon.length > 1 ? "s are" : " is"} due within 3 days. Renew to avoid suspension.
          <Link to="/dashboard/services" className="ml-auto font-semibold underline">Renew</Link>
        </Panel>
      )}
      <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">Member since {fmtDate(profile?.created_at)}</p>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="grid gap-4"><QuickCards /></div>
        <div className="lg:col-span-2"><PanelAccessCard /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active services" value={services.filter((s) => s.status === "active").length} tone="mint" />
        <Stat label="Wallet balance" value={taka(profile?.balance)} tone="cyan" />
        <Stat label="Pending payments" value={data?.pending ?? 0} tone="amber" />
        <Stat label="Open tickets" value={data?.tickets ?? 0} tone="brand" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold text-white">Your services</h2>
          {services.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No servers yet. <Link to="/dashboard/order" className="text-cyan hover:underline">Order your first one</Link>.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {services.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="font-medium text-white">{s.name}</span>
                  <span className="text-slate-500">{(s.plans as { name: string } | null)?.name}</span>
                  <span className="ml-auto text-xs text-slate-500">Due {fmtDate(s.due_date)}</span>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-white"><Megaphone className="size-4 text-cyan" /> Announcements</h2>
          <div className="space-y-4">
            {(data?.ann ?? []).map((a) => (
              <div key={a.id}>
                <p className="text-sm font-medium text-white">{a.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.body}</p>
                <p className="mt-1 text-[11px] text-slate-600">{fmtDate(a.created_at)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
