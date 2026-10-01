import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Btn, Field, Input } from "@/components/panel/ui";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — Zerobot" },
      { name: "description", content: "Choose a new password for your zerobot account." },
      { property: "og:title", content: "Set new password — Zerobot" },
      { property: "og:description", content: "Choose a new password for your zerobot account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <AuthCard title="Set a new password" sub="Enter your new password below.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return toast.error("Password must be at least 8 characters");
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          navigate({ to: "/dashboard" });
        }}
      >
        <Field label="New password">
          <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Btn type="submit" disabled={busy} className="w-full py-3">Update password</Btn>
      </form>
    </AuthCard>
  );
}
