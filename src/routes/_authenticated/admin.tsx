import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/panel/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Admin — Hexa Hoster" },
      { name: "description", content: "Hexa Hoster admin panel: clients, orders, services, billing and support." },
      { property: "og:title", content: "Admin — Hexa Hoster" },
      { property: "og:description", content: "Hexa Hoster admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
