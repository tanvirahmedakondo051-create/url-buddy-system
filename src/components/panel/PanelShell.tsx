import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Menu, X, LogOut, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/auth";

export type NavGroup = { label: string; items: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }[] };

export function PanelShell({ groups, badge, children, topRight, onSearch }: { groups: NavGroup[]; badge: string; children: ReactNode; topRight?: ReactNode; onSearch?: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { data: brand } = useSettings();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const nav = (
    <nav className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2.5 px-5 py-5">
        {brand?.["logo_url"] ? <img src={brand["logo_url"]} alt="" className="size-9 rounded-xl object-contain" /> : (
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan font-mono font-bold text-white shadow-lg shadow-brand/40">{(brand?.["site_name"] || "H").charAt(0)}</span>)}
        <span className="font-display text-lg font-bold text-white">{brand?.["site_name"] || "Hexa Hoster"}</span>
        <span className="ml-auto rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{badge}</span>
      </Link>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{g.label}</p>
            {g.items.map((i) => {
              const active = i.exact ? path === i.to : path === i.to || path.startsWith(i.to + "/");
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    active ? "bg-gradient-to-r from-brand/25 to-transparent text-white ring-1 ring-brand/30" : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <i.icon className={cn("size-4", active && "text-cyan")} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
        <LogOut className="size-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-ink/70 backdrop-blur-2xl lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-ink2">{nav}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-ink/60 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          {onSearch && (
            <form
              className="relative max-w-md flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(q);
              }}
            >
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients by name or email…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand/50"
              />
            </form>
          )}
          <div className="ml-auto flex items-center gap-3">{topRight}</div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
