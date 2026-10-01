import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startInput = z.object({
  kind: z.enum(["new", "renew", "topup", "upgrade"]),
  planId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  serverName: z.string().max(60).optional(),
  amount: z.number().positive().max(100000).optional(),
  coupon: z.string().max(40).optional(),
});

// Creates a pending AuraPay invoice and returns the AuraPay payment page.
export const startAurapay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => startInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { aurapayCreate } = await import("./aurapay.server");
    const { data: gw } = await supabaseAdmin.from("settings").select("value").eq("key", "gw_aurapay").maybeSingle();
    if (gw?.value === "0") throw new Error("AuraPay is turned off.");
    if (data.kind === "topup" && !data.amount) throw new Error("Enter an amount");
    if (data.kind === "renew" || data.kind === "upgrade") {
      const { data: s } = await supabaseAdmin.from("services").select("user_id").eq("id", data.serviceId ?? "").maybeSingle();
      if (s?.user_id !== context.userId) throw new Error("Invalid service");
    }
    const { data: order, error } = await supabaseAdmin.from("orders").insert({
      user_id: context.userId, kind: data.kind, plan_id: data.planId ?? null, service_id: data.serviceId ?? null,
      server_name: data.serverName ?? null, amount: data.kind === "topup" ? data.amount! : 1, method: "aurapay", coupon_code: data.kind === "topup" ? null : data.coupon || null,
    }).select("id, amount").single();
    if (error || !order) throw new Error(error?.message ?? "Could not create invoice");
    const { data: prof } = await supabaseAdmin.from("profiles").select("full_name,email").eq("id", context.userId).single();
    let origin = new URL(getRequest().url).origin;
    // The preview link is private, so AuraPay can't reach it. Use the public site address instead.
    if (origin.includes("id-preview--") || origin.includes("localhost")) origin = "https://project--18c7e2dd-4c42-483b-b24a-1f17f3b7923a.lovable.app";
    const url = await aurapayCreate(supabaseAdmin, {
      orderId: order.id, amount: Number(order.amount), name: prof?.full_name ?? "", email: prof?.email ?? "", origin,
    });
    return { url };
  });

// Called by the return page: checks the payment with AuraPay before approving.
export const confirmAurapay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ invoiceId: z.string().min(3).max(200), orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: o } = await supabaseAdmin.from("orders").select("user_id").eq("id", data.orderId).maybeSingle();
    if (o?.user_id !== context.userId) return { ok: false, message: "Invoice not found." };
    const { aurapayConfirm } = await import("./aurapay.server");
    try {
      const r = await aurapayConfirm(supabaseAdmin, data.invoiceId, data.orderId);
      return { ok: r.ok, message: r.message };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Verification failed" };
    }
  });
