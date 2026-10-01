import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Terminal,
  KeyRound,
  Network,
  FolderGit2,
  DatabaseBackup,
  Activity,
  Github,
  Check,
} from "lucide-react";
import { ConsoleMockup } from "../components/ConsoleMockup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zerobot — Get your bot online. Hosting from ৳100/mo" },
      {
        name: "description",
        content:
          "Deploy Telegram & Discord bots, websites, and apps in seconds. BDT payments via bKash, Nagad, Rocket. 99.99% uptime, plans from ৳100/mo.",
      },
      { property: "og:title", content: "Zerobot — Get your bot online" },
      {
        property: "og:description",
        content:
          "Deploy Telegram & Discord bots, websites, and apps in seconds. BDT payments. Plans from ৳100/mo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const runtimes = ["Node.js", "Python", "Go", "Bun"];

const features = [
  {
    icon: Terminal,
    title: "Web Console & Logs",
    desc: "Tail live output in-browser, replay history, and debug without SSH.",
    color: "brand",
  },
  {
    icon: KeyRound,
    title: "Env Variables Manager",
    desc: "Encrypted secrets, per-environment, editable without redeploying.",
    color: "cyan",
  },
  {
    icon: Network,
    title: "Custom Ports & Static IP",
    desc: "Expose any port, bind a static IP, and point your own domain.",
    color: "mint",
  },
  {
    icon: FolderGit2,
    title: "File Manager + SFTP",
    desc: "Browse, edit, and sync files over SFTP or straight from the UI.",
    color: "brand",
  },
  {
    icon: DatabaseBackup,
    title: "Automated Backups",
    desc: "Scheduled snapshots with one-click restore to any previous state.",
    color: "cyan",
  },
  {
    icon: Activity,
    title: "Resource Monitoring",
    desc: "Per-process CPU, RAM, and disk graphs with threshold alerts.",
    color: "mint",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    desc: "Push to main and watch it build, deploy, and restart automatically.",
    color: "brand",
  },
];

const steps = [
  {
    num: "01",
    title: "Push your repo",
    desc: "Connect GitHub or upload files. We detect your runtime.",
    color: "text-brand",
  },
  {
    num: "02",
    title: "Set env & port",
    desc: "Add secrets, pick a plan, choose your exposed port.",
    color: "text-cyan",
  },
  {
    num: "03",
    title: "It's online",
    desc: "Auto-restart, backups, and DDoS shield activate instantly.",
    color: "text-mint",
  },
];

const included = [
  "24/7 uptime monitoring",
  "Automatic restarts",
  "Isolated containers",
  "SFTP access",
  "Real-time logs",
  "DDoS protection",
];

const faqs = [
  {
    q: "How fast is a bot actually online?",
    a: "Most bots are live within 60 seconds — we pull your code, spin an isolated container, and start the process automatically.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All plans are billed in BDT via bKash, Nagad, and Rocket. No card required, no overseas fees.",
  },
  {
    q: "Do you guarantee uptime?",
    a: "Yes — 99.99% uptime with auto-restart, automated backups, and DDoS protection on every single plan.",
  },
];

function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5">
      {/* HERO */}
      <section className="grid items-center gap-10 pt-12 pb-16 lg:grid-cols-2 lg:gap-8">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-mint" />
            <span className="text-xs font-medium text-slate-300">
              Live in seconds · BDT payments
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Get your bot{" "}
            <span className="bg-gradient-to-r from-brand via-cyan to-mint bg-clip-text text-transparent">
              online.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-400">
            Deploy Telegram &amp; Discord bots, websites, and apps. Isolated
            containers, real-time logs, and live console — deployed in seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/pricing"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-cyan px-6 py-3.5 font-semibold text-white shadow-xl shadow-brand/30 transition hover:shadow-brand/50"
            >
              Start from ৳100/mo
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-slate-200 backdrop-blur-md transition hover:bg-white/10"
            >
              <span className="size-2 rounded-full bg-cyan" /> Explore features
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 font-mono text-xs text-slate-500">
            <span>200+ servers hosted</span>
            <span className="text-slate-700">•</span>
            <span>99.99% uptime</span>
            <span className="text-slate-700">•</span>
            <span>550+ developers</span>
          </div>
        </div>

        <ConsoleMockup />
      </section>

      {/* RUNTIMES */}
      <section className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {runtimes.map((rt) => (
          <div
            key={rt}
            className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
          >
            <div className="font-mono text-xs text-slate-500">runtime</div>
            <div className="mt-1 font-semibold text-white">{rt}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section className="pb-16">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Everything your bot needs to stay <span className="text-cyan">up.</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:bg-white/[0.07]"
            >
              <div
                className={`mb-4 grid size-10 place-items-center rounded-lg border bg-${f.color}/20 border-${f.color}/30 text-${f.color}`}
              >
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 STEPS */}
      <section className="pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
          <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Live in 60 seconds
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.num}>
                <div className={`font-mono text-sm ${s.color}`}>{s.num}</div>
                <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Simple BDT pricing
            </h2>
            <p className="mt-2 text-slate-400">
              Pay with bKash, Nagad, or Rocket. No hidden charges.
            </p>
          </div>
          <Link
            to="/pricing"
            className="text-sm font-medium text-cyan transition hover:text-white"
          >
            View all 8 plans →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {/* Mini */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">Mini</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-white">৳100</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Best for first bots &amp; side projects</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 512MB RAM</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 2GB storage</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 50% CPU allotment</li>
            </ul>
            <Link
              to="/pricing"
              className="mt-6 block rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
            >
              Choose Mini
            </Link>
          </div>
          {/* Pro featured */}
          <div className="relative rounded-2xl border border-brand/40 bg-gradient-to-b from-brand/15 to-white/5 p-6 shadow-xl shadow-brand/20 backdrop-blur-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-cyan px-3 py-1 text-[11px] font-semibold text-white">
              Most popular
            </div>
            <div className="text-sm font-medium text-brand">Pro</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-white">৳350</span>
              <span className="text-slate-400">/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">For growing bots that need reach</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 2GB RAM</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 10GB storage</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 100% CPU allotment</li>
              <li className="flex gap-2"><Check className="size-4 text-cyan" /> Custom domain + static IP</li>
            </ul>
            <Link
              to="/pricing"
              className="mt-6 block rounded-xl bg-gradient-to-r from-brand to-cyan py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:shadow-brand/50"
            >
              Choose Pro
            </Link>
          </div>
          {/* Mega */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400">Mega</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-white">৳850</span>
              <span className="text-slate-500">/mo</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Heavy workloads &amp; production fleets</p>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 6GB RAM</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 60GB storage</li>
              <li className="flex gap-2"><Check className="size-4 text-mint" /> 400% CPU allotment</li>
            </ul>
            <Link
              to="/pricing"
              className="mt-6 block rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
            >
              Choose Mega
            </Link>
          </div>
        </div>
      </section>

      {/* EVERY PLAN INCLUDES */}
      <section className="pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
          <h2 className="font-display text-xl font-semibold text-white">
            Every plan includes
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mint/15">
                  <Check className="size-3 text-mint" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl pb-16">
        <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Questions, answered.
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-white marker:hidden">
                {f.q}
                <span className="font-mono text-slate-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
        <Link
          to="/faq"
          className="mt-4 inline-block text-sm font-medium text-cyan transition hover:text-white"
        >
          See all questions →
        </Link>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand/20 via-white/5 to-cyan/15 p-10 text-center backdrop-blur-xl sm:p-14">
          <div className="absolute -top-24 left-1/2 size-[400px] -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />
          <h2 className="relative font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ship your bot today.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-slate-300">
            Deploy in seconds. Pay in BDT. Sleep through the night with 99.99% uptime.
          </p>
          <Link
            to="/register"
            className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-cyan px-7 py-3.5 font-semibold text-white shadow-xl shadow-brand/30 transition hover:shadow-brand/50"
          >
            Start from ৳100/mo →
          </Link>
        </div>
      </section>
    </main>
  );
}
