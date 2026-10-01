import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, Textarea } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

const sections: { title: string; fields: { key: string; label: string; hint?: string; long?: boolean }[] }[] = [
  { title: "General", fields: [{ key: "site_name", label: "Site name" }] },
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
      { key: "ptero_url", label: "Panel URL", hint: "e.g. https://panel.yourdomain.com — the API key is stored separately and securely" },
      { key: "ptero_location_id", label: "Location ID" },
      { key: "ptero_docker_image", label: "Default docker image" },
      { key: "ptero_startup", label: "Default startup command" },
      { key: "ptero_environment", label: "Default environment (JSON)", long: true, hint: '{"USER_UPLOAD":"0","AUTO_UPDATE":"0"}' },
    ],
  },
];

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useSettings();
  const [v, setV] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setV(data); }, [data]);

  const save = async () => {
    if (v["ptero_environment"]) {
      try { JSON.parse(v["ptero_environment"]); } catch { return toast.error("Environment must be valid JSON"); }
    }
    const rows = sections.flatMap((s) => s.fields).map((f) => ({ key: f.key, value: v[f.key] ?? "" }));
    const { error } = await supabase.from("settings").upsert(rows);
    if (error) return toast.error(error.message);
    await supabase.from("admin_logs").insert({ admin_id: user.id, action: "Updated settings" });
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <>
      <PageHeader title="Settings" action={<Btn onClick={save}>Save settings</Btn>} />
      <div className="grid max-w-4xl gap-6">
        {sections.map((s) => (
          <Panel key={s.title} className="p-6">
            <h2 className="mb-4 font-display font-semibold text-white">{s.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {s.fields.map((f) => (
                <div key={f.key} className={f.long || f.key === "ptero_url" ? "sm:col-span-2" : ""}>
                  <Field label={f.label} hint={f.hint}>
                    {f.long ? <Textarea value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} className="min-h-20 font-mono" /> : <Input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
                  </Field>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
