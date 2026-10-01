import type { SupabaseClient } from "@supabase/supabase-js";

export type PteroAct = "provision" | "suspend" | "unsuspend" | "terminate";

// Server-only: syncs a service with the Pterodactyl panel. Caller must be authorized already.
export async function runPtero(supabaseAdmin: SupabaseClient, serviceId: string, action: PteroAct, actorId: string | null) {
  const data = { serviceId, action };
  const context = { userId: actorId };
    const { data: rows } = await supabaseAdmin.from("settings").select("key,value");
  const s = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value])) as Record<string, string>;
  const { data: sec } = await supabaseAdmin.from("gateway_secrets").select("value").eq("key", "ptero_api_key").maybeSingle();
  const key = sec?.value || process.env["PTERODACTYL_API_KEY"];
  const base = (s["ptero_url"] || "").replace(/\/$/, "");

  const { data: svc } = await supabaseAdmin.from("services").select("*, plans(*), profiles(email,full_name)").eq("id", data.serviceId).single();
  if (!svc) throw new Error("Service not found");

  const statusFor = { provision: "active", suspend: "suspended", unsuspend: "active", terminate: "terminated" } as const;
  const log = async (msg: string) =>
    supabaseAdmin.from("admin_logs").insert({ admin_id: context.userId, action: msg, target: svc.name });

  // Without a panel connection, only the status changes.
  if (!base || !key) {
    await supabaseAdmin.from("services").update({ status: statusFor[data.action] }).eq("id", svc.id);
    await log(`Service ${data.action} (no game panel connected)`);
    return { ok: true, panel: false, message: "Status updated. Game panel is not connected yet." };
  }

  const api = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(base + "/api/application" + path, {
      ...init,
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json", "Content-Type": "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Pterodactyl error", res.status, text);
      throw new Error(`Game panel error (${res.status}). Check the panel settings.`);
    }
    return text ? JSON.parse(text) : {};
  };

  if (data.action === "provision") {
    if (svc.ptero_server_id) throw new Error("Already created on the game panel");
    const plan = svc.plans as { ram_mb: number; disk_gb: number; cpu_pct: number; egg_id: number | null } | null;
    const prof = svc.profiles as { email: string | null; full_name: string | null } | null;
    if (!plan || !prof?.email) throw new Error("Missing plan or customer email");
    if (!plan.egg_id) throw new Error("Set an egg ID on this plan first (Admin → Plans)");

    const found = await api(`/users?filter[email]=${encodeURIComponent(prof.email)}`);
    let pteroUser = found.data?.[0]?.attributes?.id as number | undefined;
    if (!pteroUser) {
      const uname = (prof.email.split("@")[0] ?? "user").replace(/[^a-z0-9]/gi, "").slice(0, 20) + Math.floor(Math.random() * 1000);
      const created = await api("/users", {
        method: "POST",
        body: JSON.stringify({ email: prof.email, username: uname, first_name: prof.full_name?.split(" ")[0] || "Client", last_name: prof.full_name?.split(" ").slice(1).join(" ") || "User" }),
      });
      pteroUser = created.attributes.id;
    }
    let env: Record<string, string> = {};
    try { env = JSON.parse(s["ptero_environment"] || "{}"); } catch { /* keep empty */ }
    const server = await api("/servers", {
      method: "POST",
      body: JSON.stringify({
        name: svc.name,
        user: pteroUser,
        egg: plan.egg_id,
        docker_image: s["ptero_docker_image"],
        startup: s["ptero_startup"],
        environment: env,
        limits: { memory: plan.ram_mb, swap: 0, disk: plan.disk_gb * 1024, io: 500, cpu: plan.cpu_pct },
        feature_limits: { databases: 1, backups: 2, allocations: 1 },
        deploy: { locations: [Number(s["ptero_location_id"] || 1)], dedicated_ip: false, port_range: [] },
      }),
    });
    await supabaseAdmin.from("services").update({ status: "active", ptero_server_id: server.attributes.id, ptero_identifier: server.attributes.identifier }).eq("id", svc.id);
    await log("Created server on game panel");
    return { ok: true, panel: true, message: "Server created on the game panel." };
  }

  if (!svc.ptero_server_id) {
    await supabaseAdmin.from("services").update({ status: statusFor[data.action] }).eq("id", svc.id);
    await log(`Service ${data.action}`);
    return { ok: true, panel: false, message: "Status updated (server not on game panel yet)." };
  }
  if (data.action === "terminate") await api(`/servers/${svc.ptero_server_id}`, { method: "DELETE" });
  else await api(`/servers/${svc.ptero_server_id}/${data.action}`, { method: "POST" });
  await supabaseAdmin.from("services").update({ status: statusFor[data.action], ...(data.action === "terminate" ? { ptero_server_id: null, ptero_identifier: null } : {}) }).eq("id", svc.id);
  await log(`Service ${data.action} on game panel`);
  return { ok: true, panel: true, message: `Service ${data.action}d.` };
}
