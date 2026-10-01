import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka } from "@/lib/auth";
import { Btn, PageHeader, Panel, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/invoices")({ component: Invoices });

const kindLabel = { new: "New server", renew: "Renewal", topup: "Wallet top-up" } as Record<string, string>;

function Invoices() {
  const { user } = Route.useRouteContext();
  const [view, setView] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["my-orders", user.id],
    queryFn: async () => (await supabase.from("orders").select("*, plans(name)").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const inv = data?.find((o) => o.id === view);
  return (
    <>
      <PageHeader title="Invoices" sub="Every payment you've made or submitted." />
      <Table head={["Invoice", "Date", "Item", "Method", "Amount", "Status", ""]} empty={data?.length === 0}>
        {data?.map((o) => (
          <tr key={o.id}>
            <Td className="font-mono text-white">#{o.invoice_no}</Td>
            <Td>{fmtDate(o.created_at)}</Td>
            <Td>{kindLabel[o.kind]}{o.plans ? ` · ${(o.plans as { name: string }).name}` : ""}</Td>
            <Td className="capitalize">{o.method}</Td>
            <Td className="font-mono">{taka(o.amount)}</Td>
            <Td><StatusBadge status={o.status === "approved" ? "paid" : o.status} /></Td>
            <Td><Btn variant="ghost" className="px-3 py-1 text-xs" onClick={() => setView(o.id)}>View</Btn></Td>
          </tr>
        ))}
      </Table>
      {inv && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setView(null)}>
          <Panel className="w-full max-w-lg bg-ink2 p-8">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-white">Invoice #{inv.invoice_no}</p>
                  <p className="text-xs text-slate-500">{fmtDate(inv.created_at)}</p>
                </div>
                <StatusBadge status={inv.status === "approved" ? "paid" : inv.status} />
              </div>
              <dl className="mt-6 space-y-2 text-sm">
                {[
                  ["Item", kindLabel[inv.kind] + (inv.plans ? ` — ${(inv.plans as { name: string }).name}` : "")],
                  ["Payment method", inv.method],
                  ["Transaction ID", inv.trx_id ?? "—"],
                  ["Admin note", inv.admin_note ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/5 pb-2"><dt className="text-slate-500">{k}</dt><dd className="text-right capitalize text-slate-200">{v}</dd></div>
                ))}
                <div className="flex justify-between pt-2 text-base"><dt className="font-semibold text-white">Total</dt><dd className="font-mono font-bold text-white">{taka(inv.amount)}</dd></div>
              </dl>
              <div className="mt-6 flex justify-end gap-2">
                <Btn variant="ghost" onClick={() => window.print()}>Print</Btn>
                <Btn onClick={() => setView(null)}>Close</Btn>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
