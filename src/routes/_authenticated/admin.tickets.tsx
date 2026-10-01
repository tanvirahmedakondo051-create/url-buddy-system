import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/auth";
import { PageHeader, Select, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/tickets")({ component: Tickets });

function Tickets() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/admin/tickets") return <Outlet />;
  return <List />;
}

function List() {
  const [filter, setFilter] = useState("active");
  const { data } = useQuery({
    queryKey: ["admin-tickets", filter],
    queryFn: async () => {
      let q = supabase.from("tickets").select("*, profiles(full_name,email)").order("updated_at", { ascending: false }).limit(200);
      if (filter === "active") q = q.neq("status", "Closed");
      else if (filter !== "all") q = q.eq("status", filter);
      return (await q).data ?? [];
    },
  });
  return (
    <>
      <PageHeader
        title="Support tickets"
        action={<Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">{["active", "Open", "Customer-Reply", "Answered", "Closed", "all"].map((s) => <option key={s}>{s}</option>)}</Select>}
      />
      <Table head={["Ticket", "Subject", "Client", "Department", "Priority", "Updated", "Status"]} empty={data?.length === 0}>
        {data?.map((t) => (
          <tr key={t.id} className="hover:bg-white/[0.03]">
            <Td className="font-mono text-white">#{t.ticket_no}</Td>
            <Td><Link to="/admin/tickets/$id" params={{ id: t.id }} className="text-cyan hover:underline">{t.subject}</Link></Td>
            <Td>{(t.profiles as { full_name: string | null; email: string | null } | null)?.email}</Td>
            <Td>{t.department}</Td>
            <Td className={t.priority === "High" ? "text-red-300" : ""}>{t.priority}</Td>
            <Td>{fmtDate(t.updated_at)}</Td>
            <Td><StatusBadge status={t.status} /></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
