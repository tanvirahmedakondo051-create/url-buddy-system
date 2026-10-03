import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getSignupMode, signupNoVerify } from "@/lib/signup.functions";
import { AuthCard, Divider, GoogleButton } from "@/components/AuthCard";
import { Btn, Field, Input } from "@/components/panel/ui";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Hexa Hoster" },
      { name: "description", content: "Create your Hexa Hoster account and deploy bots and apps in seconds." },
      { property: "og:title", content: "Create account — Hexa Hoster" },
      { property: "og:description", content: "Create your Hexa Hoster account and deploy in seconds." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hexahoster.xyz/register" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hexahoster.xyz/register" }],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const noVerify = useServerFn(signupNoVerify);
  const mode = useServerFn(getSignupMode);

  if (sent)
    return (
      <AuthCard title="Check your email" sub={`We sent a confirmation link to ${email}.`}>
        <p className="text-center text-sm text-slate-400">Click the link in the email to activate your account, then sign in. Check your spam folder too.</p>
        <Btn variant="ghost" className="mt-4 w-full" onClick={async () => {
          const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin + "/login" } });
          if (error) toast.error(error.message); else toast.success("Confirmation email sent again.");
        }}>Resend email</Btn>
        <Link to="/login" className="mt-6 block text-center text-sm font-medium text-cyan hover:underline">Back to sign in</Link>
      </AuthCard>
    );

  return (
    <AuthCard title="Create your account" sub="Join to deploy high-performance servers.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (password.length < 8) return toast.error("Password must be at least 8 characters");
          setBusy(true);
          try {
            const { verify } = await mode();
            if (!verify) {
              await noVerify({ data: { email, password, name } });
              const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
              setBusy(false);
              if (e2) return toast.error(e2.message);
              return navigate({ to: "/dashboard" });
            }
          } catch (err) {
            setBusy(false);
            return toast.error(err instanceof Error ? err.message : "Sign up failed");
          }
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/login", data: { full_name: name } },
          });
          setBusy(false);
          if (error) return toast.error(error.message);
          if (data.session) navigate({ to: "/dashboard" });
          else setSent(true);
        }}
      >
        <Field label="Full name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Email address">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <Btn type="submit" disabled={busy} className="w-full py-3">{busy ? "Creating…" : "Create account"}</Btn>
      </form>
      <Divider />
      <GoogleButton onDone={() => navigate({ to: "/dashboard" })} />
      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account? <Link to="/login" className="font-medium text-cyan hover:underline">Sign in</Link>
      </p>
    </AuthCard>
  );
}
