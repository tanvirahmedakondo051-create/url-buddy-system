import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE = "https://pay.aurapay.top/api/payment";
type Admin = SupabaseClient<Database>;

async function apiKey(admin: Admin) {
  const { data } = await admin.from("gateway_secrets").select("value").eq("key", "aurapay_api_key").maybeSingle();
  const key = data?.value || process.env["AURAPAY_API_KEY"];
  if (!key) throw new Error("AuraPay is not set up yet. Please choose another payment method.");
  return key;
}

async function call(key: string, path: "create" | "verify", body: unknown) {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "API-KEY": key,
      "RT-UDDOKTAPAY-API-KEY": key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON */ }
  if (!res.ok) {
    console.error("AuraPay error", path, res.status, text.slice(0, 500));
    throw new Error("AuraPay could not process the request. Please try again.");
  }
  return json;
}

export async function aurapayCreate(admin: Admin, o: { orderId: string; amount: number; name: string; email: string; origin: string }) {
  const key = await apiKey(admin);
  const r = await call(key, "create", {
    full_name: o.name || "Customer",
    email: o.email,
    amount: String(o.amount),
    metadata: { order_id: o.orderId },
    redirect_url: `${o.origin}/dashboard/pay/return?order=${o.orderId}`,
    return_type: "GET",
    cancel_url: `${o.origin}/dashboard/pay/return?order=${o.orderId}&cancel=1`,
    webhook_url: `${o.origin}/api/public/aurapay/webhook`,
  });
  const url = (r["payment_url"] ?? (r["data"] as Record<string, unknown> | undefined)?.["payment_url"]) as string | undefined;
  if (!url) {
    console.error("AuraPay create: no payment_url", JSON.stringify(r).slice(0, 500));
    throw new Error("AuraPay did not return a payment page.");
  }
  return url;
}

/** Verifies an invoice with AuraPay and approves the matching pending order. Safe to call repeatedly. */
export async function aurapayConfirm(admin: Admin, invoiceId: string, expectOrderId?: string) {
  const key = await apiKey(admin);
  const raw = await call(key, "verify", { invoice_id: invoiceId });
  const v = ((raw["data"] as Record<string, unknown> | undefined) ?? raw) as Record<string, unknown>;
  const status = String(v["status"] ?? "").toUpperCase();
  let meta = v["metadata"] as Record<string, unknown> | string | undefined;
  if (typeof meta === "string") { try { meta = JSON.parse(meta); } catch { meta = undefined; } }
  const orderId = String((meta as Record<string, unknown> | undefined)?.["order_id"] ?? "");
  if (!orderId || (expectOrderId && orderId !== expectOrderId)) return { ok: false as const, message: "Payment does not match this invoice." };
  if (status !== "COMPLETED") return { ok: false as const, message: status === "PENDING" ? "Payment is still pending." : "Payment was not completed." };

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.method !== "aurapay") return { ok: false as const, message: "Invoice not found." };
  if (order.status === "approved") return { ok: true as const, message: "Payment already confirmed.", orderId };
  if (Number(v["amount"] ?? 0) + 0.01 < Number(order.amount)) return { ok: false as const, message: "Paid amount is lower than the invoice." };

  const trx = String(v["transaction_id"] ?? invoiceId);
  const { data: sid, error } = await admin.rpc("system_approve_order" as never, { _order_id: orderId, _trx: trx } as never);
  if (error) {
    console.error("approve failed", error);
    return { ok: false as const, message: "Could not confirm the payment. Contact support." };
  }
  if (order.kind === "new" && sid) {
    try {
      const { runPtero } = await import("./ptero.server");
      await runPtero(admin, sid as unknown as string, "provision", null);
    } catch (e) {
      console.error("auto provision failed", e);
    }
  }
  return { ok: true as const, message: "Payment confirmed.", orderId };
}
