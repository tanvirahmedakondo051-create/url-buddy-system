import { createFileRoute } from "@tanstack/react-router";

// AuraPay calls this after a payment. Nothing here is trusted: the transaction is re-verified with AuraPay's API.
async function handle(request: Request) {
  const url = new URL(request.url);
  let b: Record<string, unknown> = {};
  if (request.method === "POST") {
    const text = await request.text().catch(() => "");
    try { b = JSON.parse(text); } catch { b = Object.fromEntries(new URLSearchParams(text)); }
  }
  const pick = (...k: string[]) => { for (const x of k) { const v = url.searchParams.get(x) ?? b[x]; if (v) return String(v); } return ""; };
  const trx = pick("transactionId", "transaction_id", "invoice_id");
  const order = pick("order");
  if (!trx || trx.length > 200 || !/^[0-9a-f-]{36}$/i.test(order)) return new Response("bad request", { status: 400 });
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { aurapayConfirm } = await import("@/lib/aurapay.server");
  try {
    const r = await aurapayConfirm(supabaseAdmin, trx, order);
    return Response.json({ ok: r.ok });
  } catch (e) {
    console.error("aurapay webhook", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/aurapay/webhook")({
  server: { handlers: { POST: ({ request }) => handle(request), GET: ({ request }) => handle(request) } },
});
