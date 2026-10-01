import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/auth";
import { Btn, Field, Input, PageHeader, Panel } from "@/components/panel/ui";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({ component: Profile });

function Profile() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useProfile(user.id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  useEffect(() => {
    if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); }
  }, [profile]);

  return (
    <>
      <PageHeader title="Profile & security" />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-6">
          <h2 className="font-display font-semibold text-white">Account details</h2>
          <Field label="Email"><Input value={user.email ?? ""} disabled /></Field>
          <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" /></Field>
          <Btn onClick={async () => {
            const { error } = await supabase.rpc("update_my_profile", { _full_name: name, _phone: phone });
            if (error) return toast.error(error.message);
            toast.success("Profile saved");
            qc.invalidateQueries({ queryKey: ["profile"] });
          }}>Save changes</Btn>
        </Panel>
        <Panel className="space-y-4 p-6">
          <h2 className="font-display font-semibold text-white">Change password</h2>
          <Field label="New password" hint="At least 8 characters"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Btn onClick={async () => {
            if (pw.length < 8) return toast.error("Password must be at least 8 characters");
            const { error } = await supabase.auth.updateUser({ password: pw });
            if (error) return toast.error(error.message);
            setPw("");
            toast.success("Password updated");
          }}>Update password</Btn>
        </Panel>
      </div>
    </>
  );
}
