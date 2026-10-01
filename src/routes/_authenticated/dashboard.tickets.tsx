import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, Select, StatusBadge, Table, Td, Textarea } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/tickets")({ component: Tickets });

function Tickets() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/dashboard/tickets") return <Outlet />;
  return <TicketList />;
}

function TicketList() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subject: "", department: "Technical", priority: "Medium", body: "" });
  const { data } = useQuery({
    queryKey: ["my-tickets", user.id],
    queryFn: async () => (await supabase.from("tickets").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })).data ?? [],
  });

  const create = async () => {
    try {
      if (!f.subject.trim() || !f.body.trim()) throw new Error("Subject and message are required");
      const { data: t, error } = await supabase.from("tickets").insert({ user_id: user.id, subject: f.subject, department: f.department, priority: f.priority }).select().single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("ticket_messages").insert({ ticket_id: t.id, user_id: user.id, body: f.body });
      if (e2) throw e2;
      navigate({ to: "/dashboard/tickets/$id", params: { id: t.id } });
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <PageHeader title="Support tickets" sub="Our team usually replies within a few hours." action={<Btn onClick={() => setOpen(!open)}>Open new ticket</Btn>} />
      {open && (
        <Panel className="mb-6 max-w-2xl space-y-4 p-6">
          <Field label="Subject"><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Department"><Select value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}>{["Technical", "Billing", "Sales"].map((d) => <option key={d}>{d}</option>)}</Select></Field>
            <Field label="Priority"><Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{["Low", "Medium", "High"].map((d) => <option key={d}>{d}</option>)}</Select></Field>
          </div>
          <Field label="Message"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
          <Btn onClick={create}>Submit ticket</Btn>
        </Panel>
      )}
      <Table head={["Ticket", "Subject", "Department", "Updated", "Status"]} empty={data?.length === 0}>
        {data?.map((t) => (
          <tr key={t.id} className="hover:bg-white/[0.03]">
            <Td className="font-mono text-white">#{t.ticket_no}</Td>
            <Td><Link to="/dashboard/tickets/$id" params={{ id: t.id }} className="text-cyan hover:underline">{t.subject}</Link></Td>
            <Td>{t.department}</Td>
            <Td>{fmtDate(t.updated_at)}</Td>
            <Td><StatusBadge status={t.status} /></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
