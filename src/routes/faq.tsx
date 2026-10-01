import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Hexa Hoster | Common questions answered" },
      {
        name: "description",
        content:
          "How fast is activation? Do servers sleep? Payment methods, refunds, runtimes — all your Hexa Hoster hosting questions answered.",
      },
      { property: "og:title", content: "Hexa Hoster FAQ — Common questions answered" },
      {
        property: "og:description",
        content: "Activation, payments, refunds, runtimes — everything about Hexa Hoster hosting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  {
    q: "How fast is activation?",
    a: "Instantly. As soon as your payment is confirmed, your server is provisioned and you can deploy within 60 seconds. No manual review, no waiting.",
  },
  {
    q: "Do servers sleep when idle?",
    a: "Never. Your container runs 24/7 regardless of traffic. Unlike free tiers elsewhere, we don't suspend or throttle idle bots — your Telegram or Discord bot stays online around the clock.",
  },
  {
    q: "Can I upgrade or downgrade anytime?",
    a: "Yes. Switch plans anytime from the dashboard. Upgrades apply immediately with no downtime, and downgrades take effect at the next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bKash, Nagad, and Rocket — all billed in BDT. No credit card required and no international transaction fees.",
  },
  {
    q: "Do you offer refunds?",
    a: "If your server fails to run within the first 48 hours due to an issue on our side, we refund the full amount. Contact support with your transaction ID and we'll sort it out.",
  },
  {
    q: "What runtimes are supported?",
    a: "Node.js, Python, Go, and Bun are first-class runtimes with auto-detection. If it runs on Linux, we can host it — custom startup commands let you run almost anything.",
  },
  {
    q: "Can I host a website, not just a bot?",
    a: "Absolutely. Any web app, API, or static site works. Pro plans and above include a custom domain so you can point your own domain at your server.",
  },
  {
    q: "What happens if my bot crashes?",
    a: "The supervisor restarts it automatically within seconds and captures the failing logs. You can review the full crash trace in the web console.",
  },
];

function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <div className="text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" />
          <span className="text-xs font-medium text-slate-300">Common questions</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Questions,{" "}
          <span className="bg-gradient-to-r from-brand via-cyan to-mint bg-clip-text text-transparent">
            answered.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-slate-400">
          Everything you need to know about hosting on Hexa Hoster. Can't find your
          answer? Create an account and ask support.
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-white marker:hidden">
              {f.q}
              <span className="ml-4 font-mono text-slate-500 transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-brand/20 via-white/5 to-cyan/15 p-10 text-center backdrop-blur-xl">
        <h2 className="font-display text-2xl font-bold text-white">Ready to deploy?</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
          Start from ৳100/mo. Pay with bKash, Nagad, or Rocket.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-cyan px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-brand/30 transition hover:shadow-brand/50"
        >
          Create account →
        </Link>
      </div>
    </main>
  );
}
