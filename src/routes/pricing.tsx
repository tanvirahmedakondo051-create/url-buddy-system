import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PlanGrid } from "@/components/PlanGrid";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Hexa Hoster | Hosting plans from ৳100/mo" },
      {
        name: "description",
        content:
          "Simple BDT pricing for bot & app hosting. 8 plans from ৳100 to ৳850/mo. Pay with bKash, Nagad, or Rocket.",
      },
      { property: "og:title", content: "Hexa Hoster Pricing — Plans from ৳100/mo" },
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

      <div className="mt-12"><PlanGrid /></div>

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
