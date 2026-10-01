import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/auth";
import { Btn, Loading, Panel, Select, StatusBadge, Textarea } from "./ui";
import { cn } from "@/lib/utils";

export function TicketThread({ ticketId, userId, staff }: { ticketId: string; userId: string; staff: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const [t, m] = await Promise.all([
        supabase.from("tickets").select("*, profiles:user_id(full_name,email)").eq("id", ticketId).single(),
        supabase.from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at"),
      ]);
      if (t.error) throw t.error;
      return { t: t.data, msgs: m.data ?? [] };
    },
  });
  if (isLoading || !data) return <Loading />;
  const { t, msgs } = data;

  const setStatus = async (status: string) => {
    const { error } = await supabase.from("tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", ticketId);
    if (error) return toast.error(error.message);
    if (staff) await supabase.from("admin_logs").insert({ admin_id: userId, action: `Ticket set to ${status}`, target: "#" + t.ticket_no });
    qc.invalidateQueries();
  };

  const reply = async () => {
    if (!body.trim()) return;
    try {
      const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticketId, user_id: userId, is_staff: staff, body: body.trim() });
      if (error) throw error;
      await setStatus(staff ? "Answered" : "Customer-Reply");
      setBody("");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const owner = t.profiles as unknown as { full_name: string | null; email: string | null } | null;
  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-center gap-3 p-5">
        <div>
          <p className="font-display text-lg font-semibold text-white">#{t.ticket_no} — {t.subject}</p>
          <p className="text-xs text-slate-500">{t.department} · {t.priority} priority{staff && owner ? ` · ${owner.full_name ?? ""} ${owner.email ?? ""}` : ""}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StatusBadge status={t.status} />
          {staff ? (
            <Select value={t.status} onChange={(e) => setStatus(e.target.value)} className="w-40 py-1.5">
              {["Open", "Answered", "Customer-Reply", "Closed"].map((s) => <option key={s}>{s}</option>)}
            </Select>
          ) : t.status !== "Closed" && <Btn variant="ghost" onClick={() => setStatus("Closed")}>Close ticket</Btn>}
        </div>
      </Panel>
      {msgs.map((m) => (
        <Panel key={m.id} className={cn("p-5", m.is_staff && "border-brand/30 bg-brand/[0.07]")}>
          <p className="mb-2 text-xs font-semibold text-slate-400">{m.is_staff ? "zerobot Staff" : staff ? owner?.full_name || "Client" : "You"} · <span className="font-normal text-slate-600">{new Date(m.created_at).toLocaleString()}</span></p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{m.body}</p>
        </Panel>
      ))}
      <Panel className="p-5">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a reply…" />
        <div className="mt-3 flex justify-end"><Btn onClick={reply}>Send reply</Btn></div>
      </Panel>
    </div>
  );
}
