import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Zerobot" },
      {
        name: "description",
        content: "Join zerobot to deploy high-performance servers from ৳100/mo.",
      },
      { property: "og:title", content: "Create account — Zerobot" },
      {
        property: "og:description",
        content: "Join zerobot to deploy high-performance servers from ৳100/mo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none backdrop-blur-md transition focus:border-brand/50 focus:ring-2 focus:ring-brand/20";

function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center px-5 py-14">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-cyan shadow-lg shadow-brand/40">
              <span className="font-mono text-lg font-bold text-white">z</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
              Create account
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Join to deploy high-performance servers.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  First name
                </label>
                <input type="text" placeholder="Rahim" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Last name
                </label>
                <input type="text" placeholder="Uddin" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Username
              </label>
              <input type="text" placeholder="rahim_dev" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Email address
              </label>
              <input type="email" placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">
                Password
              </label>
              <input type="password" placeholder="••••••••" className={inputClass} />
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-400">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-white/20 bg-white/5 accent-brand"
              />
              <span>
                I agree to the{" "}
                <span className="cursor-pointer text-cyan hover:text-white">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="cursor-pointer text-cyan hover:text-white">
                  Privacy Policy
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-brand to-cyan py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:shadow-brand/50"
            >
              Create account
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10">
            <GoogleIcon />
            Sign up with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-cyan transition hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
