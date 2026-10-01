import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { confirmAurapay } from "@/lib/aurapay.functions";
import { PageHeader, Panel } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/pay/return")({
  validateSearch: z.object({ order: z.string().optional(), invoice_id: z.string().optional(), cancel: z.string().optional() }),
  component: PayReturn,
});

function PayReturn() {
  const { order, invoice_id, cancel } = Route.useSearch();
  const confirm = useServerFn(confirmAurapay);
  const qc = useQueryClient();
  const [state, setState] = useState<{ ok: boolean | null; message: string }>({ ok: null, message: "Checking your payment with AuraPay…" });

  useEffect(() => {
    if (cancel || !order || !invoice_id) {
      setState({ ok: false, message: cancel ? "Payment was cancelled." : "Payment details are missing." });
      return;
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
