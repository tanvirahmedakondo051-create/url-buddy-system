import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingCart, Server, Wallet, FileText, LifeBuoy, UserCog, Shield } from "lucide-react";
import { PanelShell, type NavGroup } from "@/components/panel/PanelShell";
import { taka, useIsAdmin, useProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Client area — Zerobot" },
      { name: "description", content: "Manage your zerobot servers, invoices, wallet and tickets." },
      { property: "og:title", content: "Client area — Zerobot" },
      { property: "og:description", content: "Manage your zerobot servers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientLayout,
});

const groups: NavGroup[] = [
  { label: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    label: "Hosting",
    items: [
      { to: "/dashboard/order", label: "Order new server", icon: ShoppingCart },
      { to: "/dashboard/services", label: "My services", icon: Server },
    ],
  },
  {
    label: "Billing",
    items: [
      { to: "/dashboard/wallet", label: "Wallet", icon: Wallet },
      { to: "/dashboard/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/dashboard/tickets", label: "Support tickets", icon: LifeBuoy },
      { to: "/dashboard/profile", label: "Profile & security", icon: UserCog },
    ],
  },
];

function ClientLayout() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);
  const { data: isAdmin } = useIsAdmin(user.id);
  return (
    <PanelShell
      groups={groups}
      badge="Client"
      topRight={
        <>
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-brand/25">
              <Shield className="size-3.5" /> Admin
            </Link>
          )}
          <span className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-mint sm:inline">{taka(profile?.balance)}</span>
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-cyan text-xs font-bold text-white">
            {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
          </span>
        </>
      }
    >
      <Outlet />
    </PanelShell>
  );
}
