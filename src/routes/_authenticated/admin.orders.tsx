import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate, taka } from "@/lib/auth";
import { pteroAction } from "@/lib/ptero.functions";
import { Btn, PageHeader, StatusBadge, Table, Td } from "@/components/panel/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: Orders });

const tabs = ["pending", "approved", "rejected", "all"] as const;

function Orders() {
  const qc = useQueryClient();
  const ptero = useServerFn(pteroAction);
  const [tab, setTab] = useState<(typeof tabs)[number]>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-orders", tab],
    queryFn: async () => {
      let q = supabase.from("orders").select("*, plans(name), profiles(id,full_name,email)").order("created_at", { ascending: false }).limit(200);
      if (tab !== "all") q = q.eq("status", tab);
      return (await q).data ?? [];
    },
  });

  const approve = async (id: string, kind: string) => {
    setBusy(id);
    try {
      const { data: sid, error } = await supabase.rpc("approve_order", { _order_id: id });
      if (error) throw error;
      toast.success("Payment approved");
      if (kind === "new" && sid) {
        try {
          const r = await ptero({ data: { serviceId: sid as string, action: "provision" } });
          toast.message(r.message);
        } catch (e) {
          toast.warning("Approved, but server not created: " + errMsg(e));
        }
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
      qc.invalidateQueries();
    }
  };

  const reject = async (id: string) => {
    const note = window.prompt("Reason for rejection (shown to the client):", "Transaction ID not found");
    if (note === null) return;
    const { error } = await supabase.rpc("reject_order", { _order_id: id, _note: note });
    if (error) return toast.error(error.message);
    toast.success("Payment rejected");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader title="Orders & payments" sub="Check the transaction ID in your bKash/Nagad/Rocket app, then approve." />
      <div className="mb-4 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-sm w-fit">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-lg px-3 py-1.5 capitalize", tab === t ? "bg-brand/30 text-white" : "text-slate-400 hover:text-white")}>{t}</button>
        ))}
      </div>
      <Table head={["Invoice", "Date", "Client", "Item", "Method", "Trx ID", "Amount", "Status", ""]} empty={data?.length === 0}>
        {data?.map((o) => {
          const c = o.profiles as { id: string; full_name: string | null; email: string | null } | null;
          return (
            <tr key={o.id}>
              <Td className="font-mono text-white">#{o.invoice_no}</Td>
              <Td>{fmtDate(o.created_at)}</Td>
              <Td>{c ? <Link to="/admin/clients/$id" params={{ id: c.id }} className="text-cyan hover:underline">{c.full_name || c.email}</Link> : "—"}</Td>
              <Td className="capitalize">{o.kind}{o.plans ? ` · ${(o.plans as { name: string }).name}` : ""}</Td>
              <Td className="capitalize">{o.method}</Td>
              <Td className="font-mono text-xs">{o.trx_id ?? "—"}{o.sender && <span className="block text-slate-500">{o.sender}</span>}</Td>
              <Td className="font-mono">{taka(o.amount)}</Td>
              <Td><StatusBadge status={o.status} /></Td>
              <Td>
                {o.status === "pending" && (
                  <div className="flex gap-2">
                    <Btn className="px-3 py-1 text-xs" disabled={busy === o.id} onClick={() => approve(o.id, o.kind)}>Approve</Btn>
                    <Btn variant="danger" className="px-3 py-1 text-xs" onClick={() => reject(o.id)}>Reject</Btn>
                  </div>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
