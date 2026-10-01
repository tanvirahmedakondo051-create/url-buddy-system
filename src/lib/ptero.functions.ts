import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  serviceId: z.string().uuid(),
  action: z.enum(["provision", "suspend", "unsuspend", "terminate"]),
});

// Admin-only: syncs a service with the Pterodactyl panel and updates its status.
export const pteroAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runPtero } = await import("./ptero.server");
    return runPtero(supabaseAdmin, data.serviceId, data.action, context.userId);
  });

// Admin-only: test the panel connection and list nests/eggs/locations.
export const pteroTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.from("settings").select("value").eq("key", "ptero_url").maybeSingle();
    const { data: sec } = await supabaseAdmin.from("gateway_secrets").select("value").eq("key", "ptero_api_key").maybeSingle();
    const base = (u?.value || "").replace(/\/$/, "");
    const key = sec?.value || process.env["PTERODACTYL_API_KEY"];
    if (!base) return { ok: false as const, message: "Enter the panel URL and save first." };
    if (!key) return { ok: false as const, message: "Save the API key first." };
    const get = async (p: string) => {
      const r = await fetch(base + "/api/application" + p, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } });
      if (r.status === 401 || r.status === 403) throw new Error("Wrong API key or missing permissions.");
      if (!r.ok) throw new Error(`Panel answered with error ${r.status}.`);
      return r.json();
    };
    try {
      const nests = await get("/nests?include=eggs&per_page=100");
      const locs = await get("/locations?per_page=100");
      type A = { attributes: { id: number; name?: string; short?: string; long?: string; relationships?: { eggs?: { data: A[] } } } };
      return {
        ok: true as const,
        message: "Connected to your game panel.",
        eggs: (nests.data as A[]).flatMap((n) => (n.attributes.relationships?.eggs?.data ?? []).map((e) => ({ id: e.attributes.id, name: `${n.attributes.name} / ${e.attributes.name}` }))),
        locations: (locs.data as A[]).map((l) => ({ id: l.attributes.id, name: l.attributes.long || l.attributes.short || String(l.attributes.id) })),
      };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error && !/fetch/i.test(e.message) ? e.message : "Could not reach the panel. Check the URL." };
    }
  });
