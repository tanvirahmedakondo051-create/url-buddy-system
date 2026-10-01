import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, taka, useProfile } from "@/lib/auth";
import { Field, Input, PageHeader, Panel, Stat, Table, Td } from "@/components/panel/ui";
import { PayForm } from "@/components/panel/PayForm";

export const Route = createFileRoute("/_authenticated/dashboard/wallet")({ component: WalletPage });

function WalletPage() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);
  const [amount, setAmount] = useState(500);
  const { data: tx } = useQuery({
    queryKey: ["wallet", user.id],
    queryFn: async () => (await supabase.from("wallet_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <>
      <PageHeader title="Wallet" sub="Add money once, pay for servers and renewals instantly." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Stat label="Available balance" value={taka(profile?.balance)} tone="mint" />
        </div>
        <Panel className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold text-white">Add money</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {[200, 500, 1000, 2000].map((a) => (
              <button key={a} onClick={() => setAmount(a)} className={`rounded-lg border px-3 py-1.5 text-sm ${amount === a ? "border-cyan/60 text-white" : "border-white/10 text-slate-400"}`}>{taka(a)}</button>
            ))}
          </div>
          <Field label="Amount (৳)"><Input type="number" min={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field>
          <div className="mt-4">
            <PayForm userId={user.id} kind="topup" amount={amount} allowWallet={false} onDone={() => {}} />
          </div>
        </Panel>
      </div>
      <h2 className="mb-3 mt-8 font-display font-semibold text-white">History</h2>
      <Table head={["Date", "Description", "Amount"]} empty={tx?.length === 0}>
        {tx?.map((t) => (
          <tr key={t.id}>
            <Td>{fmtDate(t.created_at)}</Td>
            <Td>{t.note}</Td>
            <Td className={Number(t.amount) >= 0 ? "font-mono text-mint" : "font-mono text-red-300"}>{Number(t.amount) >= 0 ? "+" : ""}{taka(t.amount)}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
