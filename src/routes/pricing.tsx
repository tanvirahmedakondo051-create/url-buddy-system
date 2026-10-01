import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Cpu, HardDrive, MemoryStick } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Zerobot | Hosting plans from ৳100/mo" },
      {
        name: "description",
        content:
          "Simple BDT pricing for bot & app hosting. 8 plans from ৳100 to ৳850/mo. Pay with bKash, Nagad, or Rocket.",
      },
      { property: "og:title", content: "Zerobot Pricing — Plans from ৳100/mo" },
      {
        property: "og:description",
        content: "8 hosting plans from ৳100 to ৳850/mo. Pay with bKash, Nagad, or Rocket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const plans = [
  { name: "Mini-v1", price: 100, ram: "512 MB", ssd: "2 GB", cpu: "50%", domain: false, popular: false },
  { name: "Mini-v2", price: 150, ram: "768 MB", ssd: "3 GB", cpu: "50%", domain: false, popular: false },
  { name: "Mini-v3", price: 200, ram: "1 GB", ssd: "4 GB", cpu: "75%", domain: false, popular: false },
  { name: "Pro-v1", price: 350, ram: "2 GB", ssd: "10 GB", cpu: "100%", domain: true, popular: true },
  { name: "Pro-v2", price: 450, ram: "3 GB", ssd: "20 GB", cpu: "150%", domain: true, popular: false },
  { name: "Pro-v3", price: 550, ram: "4 GB", ssd: "30 GB", cpu: "200%", domain: true, popular: false },
  { name: "Mega-v1", price: 600, ram: "4 GB", ssd: "40 GB", cpu: "300%", domain: true, popular: false },
  { name: "Mega-v2", price: 850, ram: "6 GB", ssd: "60 GB", cpu: "400%", domain: true, popular: false },
];

const included = [
  "24/7 uptime — containers never sleep",
  "Auto-restart on crash",
  "Isolated containers — no shared resources",
  "File manager + SFTP access",
  "Real-time console logs",
  "Custom startup commands",
  "DDoS protection",
  "bKash, Nagad, Rocket payments",
];

function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <div className="text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" />
          <span className="text-xs font-medium text-slate-300">
            Simple, transparent pricing
          </span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Hosting plans for{" "}
          <span className="bg-gradient-to-r from-brand via-cyan to-mint bg-clip-text text-transparent">
            every bot.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Plans start from ৳100/mo. No surprises, no hidden charges. Pay easily
          with bKash, Nagad, or Rocket.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.popular
                ? "relative rounded-2xl border border-brand/40 bg-gradient-to-b from-brand/15 to-white/5 p-6 shadow-xl shadow-brand/20 backdrop-blur-xl"
                : "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition hover:bg-white/[0.07]"
            }
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-cyan px-3 py-1 text-[11px] font-semibold text-white">
                Most popular
              </div>
            )}
            <div className={`text-sm font-medium ${plan.popular ? "text-brand" : "text-slate-400"}`}>
              {plan.name}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-white">
                ৳{plan.price}
              </span>
              <span className="text-slate-500">/mo</span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <MemoryStick className="size-4 text-cyan" /> {plan.ram} RAM
              </li>
              <li className="flex items-center gap-2">
                <HardDrive className="size-4 text-cyan" /> {plan.ssd} SSD
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="size-4 text-cyan" /> {plan.cpu} CPU
              </li>
              {plan.domain && (
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-mint" /> Custom domain included
                </li>
              )}
            </ul>
            <Link
              to="/register"
              className={
                plan.popular
                  ? "mt-6 block rounded-xl bg-gradient-to-r from-brand to-cyan py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:shadow-brand/50"
                  : "mt-6 block rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-medium text-white transition hover:bg-white/10"
              }
            >
              Deploy server
            </Link>
          </div>
        ))}
      </div>

      {/* Every plan includes */}
      <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
        <h2 className="font-display text-xl font-semibold text-white">
          What every plan includes
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          No feature gating. Every plan gets the full platform.
        </p>
        <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Payment methods */}
      <div className="mt-10 text-center">
        <p className="text-sm text-slate-500">We accept</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          {["bKash", "Nagad", "Rocket"].map((m) => (
            <span
              key={m}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 font-mono text-sm text-slate-300 backdrop-blur-md"
            >
              {m}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
