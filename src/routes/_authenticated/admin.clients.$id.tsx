import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { adminEnsurePanelAccount } from "@/lib/panel.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate, taka } from "@/lib/auth";
import { Btn, Field, Input, Loading, PageHeader, Panel, Stat, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [inv, setInv] = useState({ amount: "", desc: "" });
  const ensurePanel = useServerFn(adminEnsurePanelAccount);
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
      <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-1 font-display font-semibold text-white">Create invoice</h2>
          <p className="mb-3 text-xs text-slate-500">Client sees it under Invoices. When paid and approved, the amount goes to their wallet.</p>
          <div className="grid gap-3">
            <Field label="Amount (৳)"><Input type="number" value={inv.amount} onChange={(e) => setInv({ ...inv, amount: e.target.value })} /></Field>
            <Field label="Description"><Input value={inv.desc} onChange={(e) => setInv({ ...inv, desc: e.target.value })} placeholder="e.g. Extra RAM upgrade" /></Field>
            <Btn onClick={async () => {
              const { data: no, error } = await supabase.rpc("admin_create_invoice" as never, { _user_id: id, _amount: Number(inv.amount), _description: inv.desc || "Invoice" } as never);
              if (error) return toast.error(errMsg(error));
              toast.success(`Invoice #${no} created`); setInv({ amount: "", desc: "" }); qc.invalidateQueries();
            }}>Create invoice</Btn>
          </div>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-1 font-display font-semibold text-white">Game panel account</h2>
          {p.ptero_user_id ? (
            <p className="text-sm text-slate-300">Username: <span className="font-mono text-white">{p.ptero_username}</span> · ID {p.ptero_user_id}</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-400">No panel account yet.</p>
              <Btn onClick={async () => {
                try { const r = await ensurePanel({ data: { userId: id } }); toast.success(`Panel account ${r.username} ready`); qc.invalidateQueries(); }
                catch (e) { toast.error(errMsg(e)); }
              }}>Create panel account</Btn>
            </>
          )}
        </Panel>
      </div>
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
