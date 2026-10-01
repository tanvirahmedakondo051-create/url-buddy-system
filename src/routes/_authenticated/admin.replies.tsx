import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel, Textarea } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/admin/replies")({ component: Replies });

function Replies() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "" });
  const { data } = useQuery({ queryKey: ["canned"], queryFn: async () => (await supabase.from("canned_replies").select("*").order("title")).data ?? [] });
  const add = async () => {
    if (!f.title.trim() || !f.body.trim()) return toast.error("Enter a title and message");
    const { error } = await supabase.from("canned_replies").insert(f);
    if (error) return toast.error(errMsg(error));
    setF({ title: "", body: "" }); qc.invalidateQueries({ queryKey: ["canned"] });
  };
  const del = async (id: string) => { await supabase.from("canned_replies").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["canned"] }); };
  return (
    <>
      <PageHeader title="Ready-made replies" sub="Insert these into ticket replies with one click." />
      <div className="grid max-w-4xl gap-6">
        <Panel className="p-5">
          <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="mt-3"><Field label="Message"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field></div>
          <Btn className="mt-4" onClick={add}>Add reply</Btn>
        </Panel>
        {(data ?? []).map((r) => (
          <Panel key={r.id} className="p-5">
            <div className="flex"><p className="font-semibold text-white">{r.title}</p><button className="ml-auto text-xs text-rose-400" onClick={() => del(r.id)}>Delete</button></div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">{r.body}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
