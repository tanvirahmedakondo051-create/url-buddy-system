import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka } from "@/lib/auth";
import { Btn, Field, Input, Loading, PageHeader, Panel, Stat, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-client", id],
    queryFn: async () => {
      const [p, s, o, t] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("services").select("*, plans(name)").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("tickets").select("*").eq("user_id", id).order("updated_at", { ascending: false }),
      ]);
      return { p: p.data, s: s.data ?? [], o: o.data ?? [], t: t.data ?? [] };
    },
  });
  if (isLoading || !data?.p) return <Loading />;
  const p = data.p;

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("admin_logs").insert({ admin_id: user.id, action: `Client set to ${status}`, target: p.email });
    qc.invalidateQueries();
  };

  return (
    <>
      <Link to="/admin/clients" search={{}} className="mb-3 inline-block text-sm text-slate-400 hover:text-white">← Clients</Link>
      <PageHeader
        title={p.full_name || p.email || "Client"}
        sub={`${p.email} · ${p.phone ?? "no phone"} · joined ${fmtDate(p.created_at)}`}
        action={p.status === "active" ? <Btn variant="danger" onClick={() => setStatus("suspended")}>Suspend client</Btn> : <Btn onClick={() => setStatus("active")}>Reactivate client</Btn>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Wallet balance" value={taka(p.balance)} tone="mint" />
        <Stat label="Services" value={data.s.length} tone="cyan" />
        <Stat label="Tickets" value={data.t.length} tone="brand" />
      </div>
      <Panel className="mt-6 max-w-2xl p-5">
        <h2 className="mb-3 font-display font-semibold text-white">Add / remove credit</h2>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
          <Field label="Amount (± ৳)"><Input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="500 or -200" /></Field>
          <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" /></Field>
          <Btn onClick={async () => {
            const n = Number(amt);
            if (!n) return toast.error("Enter an amount");
            const { error } = await supabase.rpc("admin_adjust_balance", { _user_id: id, _amount: n, _note: note || "Admin adjustment" });
            if (error) return toast.error(error.message);
            toast.success("Balance updated"); setAmt(""); setNote("");
            qc.invalidateQueries();
          }}>Apply</Btn>
        </div>
      </Panel>
      <h2 className="mb-3 mt-8 font-display font-semibold text-white">Services</h2>
      <Table head={["Name", "Plan", "Due", "Status"]} empty={data.s.length === 0}>
        {data.s.map((s) => (
          <tr key={s.id}><Td className="text-white">{s.name}</Td><Td>{(s.plans as { name: string } | null)?.name}</Td><Td>{fmtDate(s.due_date)}</Td><Td><StatusBadge status={s.status} /></Td></tr>
        ))}
      </Table>
      <h2 className="mb-3 mt-8 font-display font-semibold text-white">Recent invoices</h2>
      <Table head={["Invoice", "Date", "Type", "Method", "Amount", "Status"]} empty={data.o.length === 0}>
        {data.o.map((o) => (
          <tr key={o.id}><Td className="font-mono">#{o.invoice_no}</Td><Td>{fmtDate(o.created_at)}</Td><Td className="capitalize">{o.kind}</Td><Td className="capitalize">{o.method}</Td><Td className="font-mono">{taka(o.amount)}</Td><Td><StatusBadge status={o.status} /></Td></tr>
        ))}
      </Table>
    </>
  );
}
