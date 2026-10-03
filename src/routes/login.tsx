import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, Divider, GoogleButton } from "@/components/AuthCard";
import { Btn, Field, Input } from "@/components/panel/ui";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Hexa Hoster" },
      { name: "description", content: "Sign in to manage your Hexa Hoster servers, invoices and support tickets." },
      { property: "og:title", content: "Sign in — Hexa Hoster" },
      { property: "og:description", content: "Sign in to manage your Hexa Hoster servers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hexahoster.xyz/login" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hexahoster.xyz/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const go = () => navigate({ to: "/dashboard" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && go());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthCard title="Welcome back" sub="Sign in to manage your servers.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (error) {
            if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) {
              await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin + "/login" } });
              return toast.error("Please verify your email first. We just sent you a new confirmation link.");
            }
            return toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
          }
          go();
        }}
      >
        <Field label="Email address">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-cyan hover:underline">Forgot password?</Link>
        </div>
        <Btn type="submit" disabled={busy} className="w-full py-3">{busy ? "Signing in…" : "Sign in"}</Btn>
      </form>
      <Divider />
      <GoogleButton onDone={go} />
      <p className="mt-6 text-center text-sm text-slate-400">
        New to Hexa Hoster? <Link to="/register" className="font-medium text-cyan hover:underline">Create an account</Link>
      </p>
    </AuthCard>
  );
}
