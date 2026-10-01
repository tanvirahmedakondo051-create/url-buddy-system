import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate, taka } from "@/lib/auth";
import { Btn, Input, PageHeader, Panel } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/rewards")({ component: Rewards });

function Rewards() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const { data } = useQuery({
    queryKey: ["my-claims", user.id],
    queryFn: async () => (await supabase.from("voucher_claims").select("id,amount,created_at,vouchers(code)").eq("user_id", user.id).order("created_at", { ascending: false })).data ?? [],
  });
  const claim = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { data: amt, error } = await supabase.rpc("claim_voucher" as never, { _code: code } as never);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(`${taka(amt as unknown as number)} added to your wallet!`);
    setCode("");
    qc.invalidateQueries();
  };
  return (
    <>
      <PageHeader title="Claim Rewards" sub="Have a gift voucher? Redeem it for wallet credit." />
      <Panel className="max-w-xl p-6">
        <div className="mb-4 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-mint/15 text-mint"><Gift className="size-5" /></span><p className="text-sm text-slate-300">Enter your voucher code below.</p></div>
        <div className="flex gap-2">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. ZERO100" className="font-mono" onKeyDown={(e) => e.key === "Enter" && claim()} />
          <Btn onClick={claim} disabled={busy}>{busy ? "Claiming…" : "Claim"}</Btn>
        </div>
      </Panel>
      {!!data?.length && (
        <Panel className="mt-6 max-w-xl p-5">
          <h2 className="mb-3 font-display font-semibold text-white">Claimed vouchers</h2>
          <ul className="divide-y divide-white/5 text-sm">
            {data.map((c) => (
              <li key={c.id} className="flex py-2.5"><span className="font-mono text-white">{(c.vouchers as { code: string } | null)?.code}</span><span className="ml-auto text-mint">+{taka(c.amount)}</span><span className="ml-4 text-slate-500">{fmtDate(c.created_at)}</span></li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
