import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, useSettings } from "@/lib/auth";
import { pteroTest } from "@/lib/ptero.functions";
import { Btn, Field, Input, PageHeader, Panel, Textarea } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

const sections: { title: string; fields: { key: string; label: string; hint?: string; long?: boolean }[] }[] = [
  {
    title: "General",
    fields: [
      { key: "site_name", label: "Site name" },
      { key: "support_email", label: "Support email" },
      { key: "footer_text", label: "Footer text" },
      { key: "terminate_after_days", label: "Auto-terminate after suspended (days)", hint: "Leave empty to never auto-terminate" },
    ],
  },
  {
    title: "Payment numbers",
    fields: [
      { key: "bkash_number", label: "bKash number" },
      { key: "nagad_number", label: "Nagad number" },
      { key: "rocket_number", label: "Rocket number" },
    ],
  },
  {
    title: "Game panel (Pterodactyl)",
    fields: [
      { key: "ptero_url", label: "Panel URL", hint: "e.g. https://panel.yourdomain.com" },
      { key: "ptero_location_id", label: "Location ID", hint: "Use Test connection to see your locations" },
      { key: "ptero_docker_image", label: "Default docker image" },
      { key: "ptero_startup", label: "Default startup command" },
      { key: "ptero_environment", label: "Default environment (JSON)", long: true, hint: '{"USER_UPLOAD":"0","AUTO_UPDATE":"0"}' },
    ],
  },
];

const gateways = [
  { key: "gw_bkash", label: "bKash" },
  { key: "gw_nagad", label: "Nagad" },
  { key: "gw_rocket", label: "Rocket" },
  { key: "gw_wallet", label: "Wallet" },
  { key: "gw_aurapay", label: "AuraPay" },
];

const secrets = [
  { key: "ptero_api_key", label: "Pterodactyl Application API key" },
  { key: "aurapay_brand_key", label: "AuraPay Brand key" },
];

type TestResult = Awaited<ReturnType<typeof pteroTest>>;

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useSettings();
  const [v, setV] = useState<Record<string, string>>({});
  const [sv, setSv] = useState<Record<string, string>>({});
  const [test, setTest] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const runTest = useServerFn(pteroTest);
  useEffect(() => { if (data) setV(data); }, [data]);
  const { data: saved } = useQuery({
    queryKey: ["gw-secrets"],
    queryFn: async () => ((await supabase.rpc("list_gateway_secrets" as never)).data as { key: string }[] | null) ?? [],
  });
  const isSet = (k: string) => saved?.some((s) => s.key === k);

  const save = async () => {
    if (v["ptero_environment"]) {
      try { JSON.parse(v["ptero_environment"]); } catch { return toast.error("Environment must be valid JSON"); }
    }
    const keys = ["logo_url", "favicon_url", ...sections.flatMap((s) => s.fields.map((f) => f.key)), ...gateways.map((g) => g.key)];
    const rows = keys.map((k) => ({ key: k, value: v[k] ?? "" }));
    const { error } = await supabase.from("settings").upsert(rows);
    if (error) return toast.error(error.message);
    for (const [k, val] of Object.entries(sv)) {
      if (!val.trim()) continue;
      const { error: e } = await supabase.rpc("set_gateway_secret" as never, { _key: k, _value: val.trim() } as never);
      if (e) return toast.error(errMsg(e));
    }
    setSv({});
    await supabase.from("admin_logs").insert({ admin_id: user.id, action: "Updated settings" });
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
    qc.invalidateQueries({ queryKey: ["gw-secrets"] });
  };

  const doTest = async () => {
    setTesting(true);
    try { setTest(await runTest()); } catch (e) { toast.error(errMsg(e)); } finally { setTesting(false); }
  };

  return (
    <>
      <PageHeader title="Settings" action={<Btn onClick={save}>Save settings</Btn>} />
      <div className="grid max-w-4xl gap-6">
        <Panel className="p-6">
          <h2 className="mb-1 font-display font-semibold text-white">Logo & favicon</h2>
          <p className="mb-4 text-sm text-slate-400">PNG, SVG or ICO under 150 KB. Click Save settings after choosing.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([["logo_url", "Logo"], ["favicon_url", "Favicon"]] as const).map(([k, label]) => (
              <Field key={k} label={label}>
                <div className="flex items-center gap-3">
                  {v[k] ? <img src={v[k]} alt="" className="size-12 rounded-lg border border-white/10 bg-white/5 object-contain" /> : <span className="grid size-12 place-items-center rounded-lg border border-dashed border-white/15 text-xs text-slate-600">none</span>}
                  <input type="file" accept="image/*" className="text-xs text-slate-400" onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    if (f.size > 150_000) return toast.error("File is too large (max 150 KB)");
                    const r = new FileReader(); r.onload = () => setV((cur) => ({ ...cur, [k]: String(r.result) })); r.readAsDataURL(f);
                  }} />
                  {v[k] && <button className="text-xs text-rose-400" onClick={() => setV({ ...v, [k]: "" })}>Remove</button>}
                </div>
              </Field>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-1 font-display font-semibold text-white">Email</h2>
          <p className="mb-4 text-sm text-slate-400">When on, new customers must click the link in their email before they can sign in.</p>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={(v["email_verification"] ?? "1") === "1"} onChange={(e) => setV({ ...v, email_verification: e.target.checked ? "1" : "0" })} /> Require email verification on signup
          </label>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-1 font-display font-semibold text-white">Payment gateways</h2>
          <p className="mb-4 text-sm text-slate-400">Turn payment methods on or off at checkout.</p>
          <div className="flex flex-wrap gap-5 text-sm text-slate-300">
            {gateways.map((g) => (
              <label key={g.key} className="flex items-center gap-2">
                <input type="checkbox" checked={(v[g.key] ?? "1") === "1"} onChange={(e) => setV({ ...v, [g.key]: e.target.checked ? "1" : "0" })} /> {g.label}
              </label>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-1 font-display font-semibold text-white">API keys</h2>
          <p className="mb-4 text-sm text-slate-400">Saved securely. Saved keys are never shown again; type a new one to replace it.</p>
          <div className="grid gap-4">
            {secrets.map((s) => (
              <Field key={s.key} label={s.label} hint={isSet(s.key) ? "Saved ✓" : "Not set"}>
                <Input type="password" autoComplete="off" value={sv[s.key] ?? ""} placeholder={isSet(s.key) ? "••••••••  (saved)" : "Paste key"} onChange={(e) => setSv({ ...sv, [s.key]: e.target.value })} />
              </Field>
            ))}
          </div>
        </Panel>

        {sections.map((s) => (
          <Panel key={s.title} className="p-6">
            <h2 className="mb-4 font-display font-semibold text-white">{s.title}</h2>
            {s.title.startsWith("Game panel") && (
              <ol className="mb-4 list-decimal space-y-1 rounded-xl border border-white/10 bg-white/5 p-4 pl-8 text-sm text-slate-300">
                <li>Open your Pterodactyl panel → Admin → Application API → Create New.</li>
                <li>Set every permission to Read &amp; Write, then create and copy the key.</li>
                <li>Paste it under "API keys" above, enter the Panel URL below, and save.</li>
                <li>Click Test connection. Then put an egg ID on each plan.</li>
              </ol>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {s.fields.map((f) => (
                <div key={f.key} className={f.long || f.key === "ptero_url" ? "sm:col-span-2" : ""}>
                  <Field label={f.label} hint={f.hint}>
                    {f.long ? <Textarea value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="min-h-20 font-mono" /> : <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
                  </Field>
                </div>
              ))}
            </div>
            {s.title.startsWith("Game panel") && (
              <div className="mt-4 space-y-3">
                <Btn variant="ghost" onClick={doTest} disabled={testing}>{testing ? "Testing…" : "Test connection"}</Btn>
                {test && (
                  <div className={`rounded-xl border p-4 text-sm ${test.ok ? "border-mint/30 text-mint" : "border-amber/30 text-amber"}`}>
                    <p className="font-semibold">{test.message}</p>
                    {test.ok && (
                      <div className="mt-3 grid gap-4 text-slate-300 sm:grid-cols-2">
                        <div><p className="mb-1 text-xs uppercase text-slate-500">Eggs (ID — name)</p>{test.eggs.map((e) => <p key={e.id} className="font-mono text-xs">{e.id} — {e.name}</p>)}</div>
                        <div><p className="mb-1 text-xs uppercase text-slate-500">Locations (ID — name)</p>{test.locations.map((l) => <p key={l.id} className="font-mono text-xs">{l.id} — {l.name}</p>)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Panel>
        ))}
      </div>
    </>
  );
}
