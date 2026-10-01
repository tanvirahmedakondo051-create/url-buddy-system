import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { confirmAurapay } from "@/lib/aurapay.functions";
import { PageHeader, Panel } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/pay/return")({
  validateSearch: z.object({ order: z.string().optional(), invoice_id: z.string().optional(), transactionId: z.string().optional(), transaction_id: z.string().optional(), cancel: z.string().optional() }),
  component: PayReturn,
});

function PayReturn() {
  const sp = Route.useSearch();
  const { order, cancel } = sp;
  const invoice_id = sp.transactionId ?? sp.transaction_id ?? sp.invoice_id;
  const confirm = useServerFn(confirmAurapay);
  const qc = useQueryClient();
  const [state, setState] = useState<{ ok: boolean | null; message: string }>({ ok: null, message: "Checking your payment with AuraPay…" });

  useEffect(() => {
    if (cancel || !order) {
      setState({ ok: false, message: cancel ? "Payment was cancelled." : "Payment details are missing." });
      return;
    }
    if (!invoice_id) {
      // No transaction in the URL: wait for AuraPay's confirmation to arrive.
      let n = 0;
      const t = setInterval(async () => {
        n++;
        const { data } = await supabase.from("orders").select("status").eq("id", order).maybeSingle();
        if (data?.status === "approved") { clearInterval(t); setState({ ok: true, message: "Payment confirmed." }); qc.invalidateQueries(); }
        else if (n >= 20) { clearInterval(t); setState({ ok: false, message: "Still waiting for AuraPay. Check your invoices in a minute." }); }
      }, 3000);
      return () => clearInterval(t);
    }
    confirm({ data: { invoiceId: invoice_id, orderId: order } })
      .then((r) => { setState({ ok: r.ok, message: r.message }); qc.invalidateQueries(); })
      .catch(() => setState({ ok: false, message: "Could not check the payment. Try again in a minute." }));
  }, [order, invoice_id, cancel]);

  return (
    <>
      <PageHeader title="AuraPay payment" />
      <Panel className="max-w-lg p-8 text-center">
        {state.ok === null ? <Loader2 className="mx-auto size-10 animate-spin text-cyan" /> : state.ok ? <CheckCircle2 className="mx-auto size-10 text-mint" /> : <XCircle className="mx-auto size-10 text-amber" />}
        <p className="mt-4 font-display text-lg font-semibold text-white">{state.message}</p>
        {state.ok === true && <p className="mt-1 text-sm text-slate-400">Your invoice is paid. New servers are set up automatically.</p>}
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <Link to="/dashboard/invoices" className="rounded-xl bg-brand px-4 py-2 font-semibold text-white">View invoices</Link>
          <Link to="/dashboard/services" className="rounded-xl border border-white/10 px-4 py-2 text-slate-300">My services</Link>
        </div>
      </Panel>
    </>
  );
}
