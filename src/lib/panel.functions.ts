import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Creates (if needed) and returns the signed-in customer's game panel account.
export const getPanelAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensurePteroUser } = await import("./ptero.server");
    try {
      const acc = await ensurePteroUser(supabaseAdmin, context.userId);
      if (!acc) return { ready: false as const, message: "Game panel is not connected yet." };
      return { ready: true as const, username: acc.username, email: acc.email, url: acc.base };
    } catch (e) {
      return { ready: false as const, message: e instanceof Error ? e.message : "Could not reach the game panel." };
    }
  });

export const newPanelPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resetPteroPassword } = await import("./ptero.server");
    const r = await resetPteroPassword(supabaseAdmin, context.userId);
    return { username: r.username, email: r.email, password: r.password, url: r.base };
  });

// Admin: create the panel account for a client.
export const adminEnsurePanelAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensurePteroUser } = await import("./ptero.server");
    const acc = await ensurePteroUser(supabaseAdmin, data.userId);
    if (!acc) throw new Error("Game panel is not connected yet (Admin → Settings).");
    return { username: acc.username };
  });
