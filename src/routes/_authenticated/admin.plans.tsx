import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { taka } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, Select, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/plans")({ component: Plans });

type Form = { id?: string; name: string; tier: string; price: number; ram_mb: number; disk_gb: number; cpu_pct: number; features: string; featured: boolean; active: boolean; sort: number; egg_id: string };
const blank: Form = { name: "", tier: "Mini", price: 100, ram_mb: 512, disk_gb: 2, cpu_pct: 50, features: "", featured: false, active: true, sort: 99, egg_id: "" };

function Plans() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<Form | null>(null);
  const { data } = useQuery({ queryKey: ["admin-plans"], queryFn: async () => (await supabase.from("plans").select("*").order("sort")).data ?? [] });

  const save = async () => {
    if (!f) return;
    const row = { name: f.name, tier: f.tier, price: f.price, ram_mb: f.ram_mb, disk_gb: f.disk_gb, cpu_pct: f.cpu_pct, features: f.features.split(",").map((x) => x.trim()).filter(Boolean), featured: f.featured, active: f.active, sort: f.sort, egg_id: f.egg_id ? Number(f.egg_id) : null };
    const { error } = f.id ? await supabase.from("plans").update(row).eq("id", f.id) : await supabase.from("plans").insert(row);
    if (error) return toast.error(error.message);
    await supabase.from("admin_logs").insert({ admin_id: user.id, action: f.id ? "Updated plan" : "Created plan", target: f.name });
    toast.success("Plan saved");
    setF(null);
    qc.invalidateQueries();
  };

  const num = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => f && setF({ ...f, [k]: Number(e.target.value) });

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? If customers use it, it will be hidden instead.`)) return;
    const { data: r, error } = await supabase.rpc("admin_delete_plan" as never, { _plan_id: id } as never);
    if (error) return toast.error(error.message);
    toast.success(r === "deleted" ? "Plan deleted" : "Plan is in use, so it was hidden from ordering");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader title="Products / plans" sub="Prices and resources customers can order." action={<Btn onClick={() => setF({ ...blank })}>Add plan</Btn>} />
      {f && (
        <Panel className="mb-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Tier"><Select value={f.tier} onChange={(e) => setF({ ...f, tier: e.target.value })}>{["Mini", "Pro", "Mega"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Price (৳/month)"><Input type="number" value={f.price} onChange={num("price")} /></Field>
            <Field label="Sort order"><Input type="number" value={f.sort} onChange={num("sort")} /></Field>
            <Field label="RAM (MB)"><Input type="number" value={f.ram_mb} onChange={num("ram_mb")} /></Field>
            <Field label="Disk (GB)"><Input type="number" value={f.disk_gb} onChange={num("disk_gb")} /></Field>
            <Field label="CPU (%)"><Input type="number" value={f.cpu_pct} onChange={num("cpu_pct")} /></Field>
            <Field label="Game panel egg ID" hint="From Pterodactyl → Nests"><Input value={f.egg_id} onChange={(e) => setF({ ...f, egg_id: e.target.value })} /></Field>
            <div className="sm:col-span-2 lg:col-span-4"><Field label="Features (comma separated)"><Input value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} /></Field></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Available to order</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Mark as popular</label>
            <div className="ml-auto flex gap-2"><Btn variant="ghost" onClick={() => setF(null)}>Cancel</Btn><Btn onClick={save}>Save plan</Btn></div>
          </div>
        </Panel>
      )}
      <Table head={["Plan", "Price", "RAM", "Disk", "CPU", "Egg", "Status", ""]} empty={data?.length === 0}>
        {data?.map((p) => (
          <tr key={p.id}>
            <Td className="text-white">{p.name} <span className="text-xs text-slate-500">{p.tier}</span>{p.featured && <span className="ml-2 text-[10px] text-indigo-300">★ popular</span>}</Td>
            <Td className="font-mono">{taka(p.price)}</Td>
            <Td>{p.ram_mb} MB</Td><Td>{p.disk_gb} GB</Td><Td>{p.cpu_pct}%</Td><Td>{p.egg_id ?? "—"}</Td>
            <Td><StatusBadge status={p.active ? "active" : "closed"} /></Td>
            <Td>
              <div className="flex gap-2">
                <Btn variant="ghost" className="px-3 py-1 text-xs" onClick={() => setF({ ...p, price: Number(p.price), features: p.features.join(", "), egg_id: p.egg_id?.toString() ?? "" })}>Edit</Btn>
                <Btn variant="ghost" className="px-3 py-1 text-xs" onClick={() => setF({ ...p, id: undefined, name: p.name + " copy", price: Number(p.price), features: p.features.join(", "), egg_id: p.egg_id?.toString() ?? "" })}>Copy</Btn>
                <Btn variant="ghost" className="px-3 py-1 text-xs text-rose-300" onClick={() => del(p.id, p.name)}>Delete</Btn>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
