import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public: reads the admin's "email verification on signup" switch.
export const getSignupMode = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("settings").select("value").eq("key", "email_verification").maybeSingle();
  return { verify: (data?.value ?? "1") !== "0" };
});

// Public: when verification is turned off, creates an already-confirmed account.
export const signupNoVerify = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().email().max(200), password: z.string().min(8).max(100), name: z.string().max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: st } = await supabaseAdmin.from("settings").select("value").eq("key", "email_verification").maybeSingle();
    if ((st?.value ?? "1") !== "0") throw new Error("Email verification is required.");
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true, user_metadata: { full_name: data.name },
    });
    if (error) throw new Error(/already/i.test(error.message) ? "This email is already registered." : "Could not create the account.");
    return { ok: true };
  });
