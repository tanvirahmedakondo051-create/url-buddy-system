import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, Receipt, Server, Package, LifeBuoy, Megaphone, Settings, ScrollText, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PanelShell, type NavGroup } from "@/components/panel/PanelShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Admin — Zerobot" },
      { name: "description", content: "zerobot admin panel: clients, orders, services, billing and support." },
      { property: "og:title", content: "Admin — Zerobot" },
      { property: "og:description", content: "zerobot admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const groups: NavGroup[] = [
  { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    label: "Clients",
    items: [
      { to: "/admin/clients", label: "Clients", icon: Users },
      { to: "/admin/services", label: "Services", icon: Server },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/admin/orders", label: "Orders & payments", icon: Receipt },
      { to: "/admin/plans", label: "Products / plans", icon: Package },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/tickets", label: "Support tickets", icon: LifeBuoy },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/logs", label: "Activity log", icon: ScrollText },
    ],
  },
];

function AdminLayout() {
  const navigate = useNavigate();
  return (
    <PanelShell
      groups={groups}
      badge="Admin"
      onSearch={(q) => navigate({ to: "/admin/clients", search: { q } })}
      topRight={
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10">
          <User className="size-3.5" /> Client view
        </Link>
      }
    >
      <Outlet />
    </PanelShell>
  );
}
