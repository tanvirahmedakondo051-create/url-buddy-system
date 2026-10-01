import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { startAurapay } from "@/lib/aurapay.functions";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, taka, useProfile, useSettings } from "@/lib/auth";
import { Btn, Field, Input } from "./ui";
import { cn } from "@/lib/utils";

type Method = "aurapay" | "bkash" | "nagad" | "rocket" | "wallet";
const methods: { id: Method; label: string; color: string }[] = [
  { id: "aurapay", label: "AuraPay (instant)", color: "from-cyan/30" },
  { id: "bkash", label: "bKash", color: "from-pink-500/30" },
  { id: "nagad", label: "Nagad", color: "from-orange-500/30" },
  { id: "rocket", label: "Rocket", color: "from-purple-500/30" },
  { id: "wallet", label: "Wallet", color: "from-mint/30" },
];

export function PayForm({
  userId, kind, amount, planId, serviceId, serverName, allowWallet = true, onDone,
}: {
  userId: string; kind: "new" | "renew" | "topup"; amount: number; planId?: string; serviceId?: string; serverName?: string; allowWallet?: boolean; onDone: () => void;
}) {
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: profile } = useProfile(userId);
  const [method, setMethod] = useState<Method>("aurapay");
  const [trx, setTrx] = useState("");
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);
  const aura = useServerFn(startAurapay);
  const list = methods.filter((m) => (allowWallet || m.id !== "wallet") && (settings?.[`gw_${m.id}`] ?? "1") !== "0");
  if (list.length && !list.some((m) => m.id === method)) setMethod(list[0]!.id);

  const submit = async () => {
    setBusy(true);
    try {
      if (method === "aurapay") {
        const { url } = await aura({ data: { kind, planId, serviceId, serverName, amount: kind === "topup" ? amount : undefined } });
        window.location.href = url;
        return;
      }
      if (method === "wallet") {
        const { error } = await supabase.rpc("pay_with_wallet", { _kind: kind, _plan_id: planId ?? null, _service_id: serviceId ?? null, _server_name: serverName ?? "" } as never);
        if (error) throw error;
        toast.success("Paid from wallet. Your service is ready.");
      } else {
        if (trx.trim().length < 6) throw new Error("Enter a valid transaction ID");
        const { error } = await supabase.from("orders").insert({
          user_id: userId, kind, plan_id: planId ?? null, service_id: serviceId ?? null, server_name: serverName ?? null,
          amount, method, trx_id: trx.trim(), sender: sender.trim() || null,
        });
        if (error) throw error;
        toast.success("Payment submitted. An admin will verify it shortly.");
      }
      qc.invalidateQueries();
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={cn(
              "rounded-xl border bg-gradient-to-br to-transparent px-3 py-3 text-sm font-semibold transition",
              m.color,
              method === m.id ? "border-cyan/60 text-white ring-2 ring-cyan/30" : "border-white/10 text-slate-400 hover:text-white",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {method === "aurapay" ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          You'll go to the secure AuraPay page to pay <b className="text-white">{taka(amount)}</b> with bKash, Nagad or Rocket. Your order is confirmed automatically.
        </p>
      ) : method === "wallet" ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Wallet balance: <b className="text-mint">{taka(profile?.balance)}</b>. {Number(profile?.balance ?? 0) < amount && <span className="text-amber">Not enough balance — top up first.</span>}
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-slate-300">
            Send <b className="text-white">{taka(amount)}</b> using <b className="capitalize text-white">{method}</b> "Send Money" to{" "}
            <span className="font-mono text-cyan">{settings?.[`${method}_number`] ?? "…"}</span>, then enter the transaction ID below.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Transaction ID"><Input value={trx} onChange={(e) => setTrx(e.target.value)} placeholder="e.g. 9A7B6C5D4E" /></Field>
            <Field label="Your number (optional)"><Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" /></Field>
          </div>
        </>
      )}
      <Btn onClick={submit} disabled={busy} className="w-full py-3">{busy ? "Processing…" : `Pay ${taka(amount)}`}</Btn>
    </div>
  );
}
