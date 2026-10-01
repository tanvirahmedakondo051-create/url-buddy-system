import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ChevronDown, LogOut, Menu, Search, User, X, UserPlus, Package, Megaphone, Receipt, LifeBuoy, Server, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/auth";

type Item = { to: string; label: string };
const menus: { label: string; to?: string; items?: Item[] }[] = [
  { label: "Home", to: "/admin" },
  { label: "Clients", items: [{ to: "/admin/clients", label: "View / search clients" }, { to: "/admin/services", label: "Products / services" }] },
  { label: "Orders", items: [{ to: "/admin/orders", label: "List all orders" }] },
  { label: "Billing", items: [{ to: "/admin/orders", label: "Invoices & transactions" }, { to: "/admin/promotions", label: "Vouchers & coupons" }] },
  { label: "Support", items: [{ to: "/admin/tickets", label: "Support tickets" }, { to: "/admin/announcements", label: "Announcements" }, { to: "/admin/replies", label: "Ready-made replies" }] },
  { label: "Setup", items: [{ to: "/admin/plans", label: "Products / plans" }, { to: "/admin/settings", label: "General settings" }, { to: "/admin/settings", label: "Payment gateways" }] },
  { label: "Reports", items: [{ to: "/admin/reports", label: "Income & clients" }] },
  { label: "Utilities", items: [{ to: "/admin/logs", label: "Activity log" }] },
];

const crumbs: Record<string, string> = {
  clients: "Clients", services: "Services", orders: "Orders", plans: "Products / plans", tickets: "Support tickets",
  announcements: "Announcements", settings: "Settings", logs: "Activity log", promotions: "Vouchers & coupons", reports: "Reports", replies: "Ready-made replies",
};

function useCounts() {
  return useQuery({
    queryKey: ["admin-shell-counts"],
    queryFn: async () => {
      const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
      const [orders, tickets, active, overdue] = await Promise.all([
        c(supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending")),
        c(supabase.from("tickets").select("id", { count: "exact", head: true }).neq("status", "Closed")),
        c(supabase.from("services").select("id", { count: "exact", head: true }).eq("status", "active")),
        c(supabase.from("services").select("id", { count: "exact", head: true }).eq("status", "suspended")),
      ]);
      return { orders, tickets, active, overdue };
    },
    refetchInterval: 60_000,
  });
}

export function AdminShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState("");
  const { data: n } = useCounts();
  const { data: brand } = useSettings();
  const seg = path.split("/")[2];

  const isActive = (m: (typeof menus)[number]) =>
    m.to ? path === m.to : m.items!.some((i) => path === i.to || path.startsWith(i.to + "/"));

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/login" }); };

  return (
    <div className="min-h-screen" onClick={() => setOpen(null)}>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6">
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden" onClick={(e) => { e.stopPropagation(); setMobile(!mobile); }} aria-label="Menu">
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            {brand?.["logo_url"] ? <img src={brand["logo_url"]} alt="" className="size-8 rounded-lg object-contain" /> : <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-cyan font-mono font-bold text-white">z</span>}
            <span className="font-display font-bold text-white">{brand?.["site_name"] || "zerobot"}</span>
            <span className="rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Admin</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
            {menus.map((m) => (
              <div key={m.label} className="relative" onClick={(e) => e.stopPropagation()}>
                {m.to ? (
                  <Link to={m.to} className={cn("rounded-lg px-3 py-2 text-sm font-medium", isActive(m) ? "bg-brand/25 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}>{m.label}</Link>
                ) : (
                  <button onClick={() => setOpen(open === m.label ? null : m.label)} className={cn("flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium", isActive(m) ? "bg-brand/25 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white")}>
                    {m.label} <ChevronDown className="size-3.5 opacity-60" />
                  </button>
                )}
                {open === m.label && m.items && (
                  <div className="absolute left-0 top-full mt-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink2/95 py-1 shadow-2xl backdrop-blur-xl">
                    {m.items.map((i) => (
                      <Link key={i.label} to={i.to} onClick={() => setOpen(null)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">{i.label}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <form className="relative ml-auto hidden w-64 md:block" onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin/clients", search: { q } }); }}>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand/50" />
          </form>
          <Link to="/dashboard" className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 md:ml-0">
            <User className="size-3.5" /> Client view
          </Link>
          <button onClick={signOut} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Sign out"><LogOut className="size-4" /></button>
        </div>
        {mobile && (
          <div className="border-t border-white/10 px-4 py-3 lg:hidden">
            {menus.map((m) => (
              <div key={m.label} className="py-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{m.label}</p>
                {(m.items ?? [{ to: m.to!, label: m.label }]).map((i) => (
                  <Link key={i.label} to={i.to} onClick={() => setMobile(false)} className="block py-1.5 text-sm text-slate-300">{i.label}</Link>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-white/5 bg-white/[0.02] px-4 py-1.5 text-xs text-slate-500 lg:px-6">
          <Link to="/admin" className="hover:text-white">Admin</Link>
          {seg && <><span>/</span><span className="text-slate-300">{crumbs[seg] ?? seg}</span></>}
          {path.split("/")[3] && <><span>/</span><span className="text-slate-300">Details</span></>}
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-white/10 p-4 xl:block">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Shortcuts</p>
          {[
            { to: "/admin/clients", label: "Add / find client", icon: UserPlus },
            { to: "/admin/orders", label: "Pending orders", icon: Receipt },
            { to: "/admin/services", label: "Services", icon: Server },
            { to: "/admin/plans", label: "Add product", icon: Package },
            { to: "/admin/tickets", label: "Open tickets", icon: LifeBuoy },
            { to: "/admin/announcements", label: "New announcement", icon: Megaphone },
            { to: "/admin/promotions", label: "New voucher", icon: Gift },
          ].map((s) => (
            <Link key={s.label} to={s.to} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
              <s.icon className="size-4 text-cyan" /> {s.label}
            </Link>
          ))}
          <p className="mb-2 mt-6 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick stats</p>
          <div className="space-y-1 text-sm">
            {[
              ["Pending orders", n?.orders, "/admin/orders"],
              ["Open tickets", n?.tickets, "/admin/tickets"],
              ["Active services", n?.active, "/admin/services"],
              ["Suspended", n?.overdue, "/admin/services"],
            ].map(([l, v, to]) => (
              <Link key={l as string} to={to as string} className="flex justify-between rounded-lg px-2 py-1.5 text-slate-400 hover:bg-white/5">
                <span>{l}</span><span className="font-mono font-semibold text-white">{v ?? "–"}</span>
              </Link>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
