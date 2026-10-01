import { createFileRoute } from "@tanstack/react-router";

// AuraPay calls this after a payment. The body is never trusted: we re-verify with AuraPay's API.
export const Route = createFileRoute("/api/public/aurapay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let invoiceId = "";
        try {
          const text = await request.text();
          let b: Record<string, unknown> = {};
          try { b = JSON.parse(text); } catch { b = Object.fromEntries(new URLSearchParams(text)); }
          invoiceId = String(b["invoice_id"] ?? (b["data"] as Record<string, unknown> | undefined)?.["invoice_id"] ?? "");
        } catch { /* empty */ }
        if (!invoiceId || invoiceId.length > 200) return new Response("bad request", { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { aurapayConfirm } = await import("@/lib/aurapay.server");
        try {
          const r = await aurapayConfirm(supabaseAdmin, invoiceId);
          return Response.json({ ok: r.ok });
        } catch (e) {
          console.error("aurapay webhook", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
