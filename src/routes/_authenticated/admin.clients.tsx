import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka } from "@/lib/auth";
import { Input, PageHeader, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/clients")({
  validateSearch: z.object({ q: z.string().optional() }),
  component: Clients,
});

function Clients() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/admin/clients") return <Outlet />;
  return <ClientList />;
}

function ClientList() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const { data } = useQuery({
    queryKey: ["admin-clients", q],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*, services(id)").order("created_at", { ascending: false }).limit(200);
      if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, "")}%,email.ilike.%${q.replace(/[%,()]/g, "")}%`);
      return (await query).data ?? [];
    },
  });
  return (
    <>
      <PageHeader
        title="Clients"
        sub={`${data?.length ?? 0} clients`}
        action={
          <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/admin/clients", search: { q: term } }); }}>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter by name or email" className="w-64" />
          </form>
        }
      />
      <Table head={["Name", "Email", "Services", "Balance", "Joined", "Status"]} empty={data?.length === 0}>
        {data?.map((c) => (
          <tr key={c.id} className="hover:bg-white/[0.03]">
            <Td><Link to="/admin/clients/$id" params={{ id: c.id }} className="font-medium text-cyan hover:underline">{c.full_name || "—"}</Link></Td>
            <Td>{c.email}</Td>
            <Td>{(c.services as unknown[]).length}</Td>
            <Td className="font-mono">{taka(c.balance)}</Td>
            <Td>{fmtDate(c.created_at)}</Td>
            <Td><StatusBadge status={c.status} /></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
