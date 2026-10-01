import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, StatusBadge, Textarea } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/announcements")({ component: Ann });

function Ann() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const { data } = useQuery({ queryKey: ["admin-ann"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  return (
    <>
      <PageHeader title="Announcements" sub="Shown on every client's dashboard." />
      <Panel className="mb-6 max-w-2xl space-y-4 p-6">
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Message"><Textarea value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <Btn onClick={async () => {
          if (!title || !body) return toast.error("Title and message required");
          const { error } = await supabase.from("announcements").insert({ title, body });
          if (error) return toast.error(error.message);
          setTitle(""); setBody(""); toast.success("Published");
          qc.invalidateQueries({ queryKey: ["admin-ann"] });
        }}>Publish</Btn>
      </Panel>
      <div className="space-y-3">
        {data?.map((a) => (
          <Panel key={a.id} className="flex items-start gap-4 p-5">
            <div className="flex-1">
              <p className="font-medium text-white">{a.title}</p>
              <p className="mt-1 text-sm text-slate-400">{a.body}</p>
              <p className="mt-2 text-xs text-slate-600">{fmtDate(a.created_at)}</p>
            </div>
            <StatusBadge status={a.published ? "active" : "closed"} />
            <Btn variant="ghost" className="px-3 py-1 text-xs" onClick={async () => { await supabase.from("announcements").update({ published: !a.published }).eq("id", a.id); qc.invalidateQueries({ queryKey: ["admin-ann"] }); }}>{a.published ? "Hide" : "Show"}</Btn>
            <Btn variant="danger" className="px-3 py-1 text-xs" onClick={async () => { if (!confirm("Delete?")) return; await supabase.from("announcements").delete().eq("id", a.id); qc.invalidateQueries({ queryKey: ["admin-ann"] }); }}>Delete</Btn>
          </Panel>
        ))}
      </div>
    </>
  );
}
