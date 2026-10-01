import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg, fmtDate } from "@/lib/auth";
import { pteroAction } from "@/lib/ptero.functions";
import { Btn, PageHeader, Select, StatusBadge, Table, Td } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/services")({ component: Services });

function Services() {
  const qc = useQueryClient();
  const ptero = useServerFn(pteroAction);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin-services", filter],
    queryFn: async () => {
      let q = supabase.from("services").select("*, plans(name), profiles(id,full_name,email)").order("created_at", { ascending: false }).limit(300);
      if (filter !== "all") q = q.eq("status", filter);
      return (await q).data ?? [];
    },
  });

  const run = async (id: string, action: "provision" | "suspend" | "unsuspend" | "terminate") => {
    if (action === "terminate" && !window.confirm("Terminate this service? The server will be deleted from the game panel.")) return;
    setBusy(id);
    try {
      const r = await ptero({ data: { serviceId: id, action } });
      toast.success(r.message);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
      qc.invalidateQueries();
    }
  };

  const extend = async (id: string, due: string) => {
    const d = new Date(Math.max(new Date(due).getTime(), Date.now()) + 30 * 864e5).toISOString();
    const { data: cur } = await supabase.from("services").select("status").eq("id", id).single();
    const { error } = await supabase.rpc("admin_set_service", { _service_id: id, _status: cur?.status ?? "active", _due: d });
    if (error) return toast.error(error.message);
    toast.success("Extended 30 days");
    qc.invalidateQueries();
  };

  return (
    <>
      <PageHeader
        title="Services"
        sub="Create, suspend or terminate servers. Changes sync to the game panel."
        action={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
            {["all", "pending_setup", "active", "suspended", "terminated"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </Select>
        }
      />
      <Table head={["Service", "Client", "Plan", "Due", "Status", "Actions"]} empty={data?.length === 0}>
        {data?.map((s) => {
          const c = s.profiles as { id: string; full_name: string | null; email: string | null } | null;
          const b = busy === s.id;
          return (
            <tr key={s.id}>
              <Td className="text-white">{s.name}{s.ptero_identifier && <span className="block font-mono text-[11px] text-slate-500">{s.ptero_identifier}</span>}</Td>
              <Td>{c && <Link to="/admin/clients/$id" params={{ id: c.id }} className="text-cyan hover:underline">{c.full_name || c.email}</Link>}</Td>
              <Td>{(s.plans as { name: string } | null)?.name}</Td>
              <Td>{fmtDate(s.due_date)}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {s.status === "pending_setup" && <Btn disabled={b} className="px-2.5 py-1 text-xs" onClick={() => run(s.id, "provision")}>Create server</Btn>}
                  {s.status === "active" && <Btn disabled={b} variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => run(s.id, "suspend")}>Suspend</Btn>}
                  {s.status === "suspended" && <Btn disabled={b} variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => run(s.id, "unsuspend")}>Unsuspend</Btn>}
                  {s.status !== "terminated" && <Btn variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => extend(s.id, s.due_date)}>+30 days</Btn>}
                  {s.status !== "terminated" && <Btn disabled={b} variant="danger" className="px-2.5 py-1 text-xs" onClick={() => run(s.id, "terminate")}>Terminate</Btn>}
                </div>
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
