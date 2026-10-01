import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { Btn, Field, Input } from "@/components/panel/ui";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Zerobot" },
      { name: "description", content: "Get a link to reset your zerobot account password." },
      { property: "og:title", content: "Reset password — Zerobot" },
      { property: "og:description", content: "Reset your zerobot account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <AuthCard title="Forgot password" sub={sent ? "Check your inbox for a reset link." : "We'll email you a reset link."}>
      {!sent && (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
            setBusy(false);
            if (error) return toast.error(error.message);
            setSent(true);
          }}
        >
          <Field label="Email address">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Btn type="submit" disabled={busy} className="w-full py-3">Send reset link</Btn>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm text-cyan hover:underline">Back to sign in</Link>
    </AuthCard>
  );
}
