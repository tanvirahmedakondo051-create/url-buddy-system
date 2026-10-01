import { createFileRoute, Link } from "@tanstack/react-router";
import artServer from "@/assets/art-server.png";
import artShield from "@/assets/art-shield.png";
import {
  Terminal,
  KeyRound,
  Network,
  FolderGit2,
  DatabaseBackup,
  Activity,
  Github,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Zerobot | A complete hosting stack" },
      {
        name: "description",
        content:
          "Web console, env variables, static IPs, SFTP file manager, automated backups, resource monitoring, and GitHub integration — all in one dashboard.",
      },
      { property: "og:title", content: "Zerobot Features — A complete hosting stack" },
      {
        property: "og:description",
        content: "Databases, files, backups, monitoring — everything your bot needs in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeaturesPage,
});

const iconStyles = {
  brand: "bg-brand/20 border-brand/30 text-brand",
  cyan: "bg-cyan/20 border-cyan/30 text-cyan",
  mint: "bg-mint/20 border-mint/30 text-mint",
} as const;

const features = [
  {
    icon: Terminal,
    color: "brand" as const,
    title: "Web Console & Logs",
    desc: "Stream real-time logs in the dashboard. Restart your bot with one click.",
    details: [
      "Live stdout/stderr streaming in the browser",
      "One-click restart, stop, and rebuild",
      "Searchable log history with timestamps",
      "Crash traces captured automatically",
    ],
  },
  {
    icon: KeyRound,
    color: "cyan" as const,
    title: "Env Variables Manager",
    desc: "Set startup commands, manage secrets and environment variables from the dashboard.",
    details: [
      "Encrypted secret storage",
      "Edit vars without redeploying",
      "Custom startup commands per server",
      "Scoped access per environment",
    ],
  },
  {
    icon: Network,
    color: "mint" as const,
    title: "Custom Ports & Static IP",
    desc: "Expose ports and get a static IP. No NAT, no proxy in front.",
    details: [
      "Stable public IP across restarts",
      "Expose any inbound port",
      "Point your own domain (Pro and up)",
      "Webhook URLs that never change",
    ],
  },
  {
    icon: FolderGit2,
    color: "brand" as const,
    title: "File Manager + SFTP",
    desc: "Browse, edit, upload files in-browser. Or connect over SFTP.",
    details: [
      "In-browser file browser and editor",
      "Drag-and-drop uploads",
      "Full SFTP credentials per server",
      "Edit code and restart in one flow",
    ],
  },
  {
    icon: DatabaseBackup,
    color: "cyan" as const,
    title: "Automated Backups",
    desc: "Daily snapshots. Restore to any point in a single click.",
    details: [
      "Scheduled daily snapshots",
      "One-click restore to any point",
      "Manual snapshot before risky deploys",
      "Backups stored off-server",
    ],
  },
  {
    icon: Activity,
    color: "mint" as const,
    title: "Resource Monitoring",
    desc: "CPU, RAM, disk graphs. Scale your server when you need more.",
    details: [
      "Live CPU, RAM, and disk graphs",
      "Per-process resource breakdown",
      "Upgrade plan without downtime",
      "Usage history for capacity planning",
    ],
  },
  {
    icon: Github,
    color: "brand" as const,
    title: "GitHub Integration",
    desc: "Import a repo. Redeploy on push. CI/CD without the complexity.",
    details: [
      "Import any GitHub repository",
      "Auto-redeploy on push to main",
      "Runtime auto-detection",
      "Build logs streamed to console",
    ],
  },
];

function FeaturesPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-5 py-14">
      <div className="pointer-events-none absolute right-5 top-10 hidden gap-4 md:flex">
        <img src={artServer} alt="" width={816} height={816} className="art-float w-32" />
        <img src={artShield} alt="" width={816} height={816} className="art-float w-24 [animation-delay:2s]" />
      </div>
      <div className="max-w-2xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <span className="size-1.5 animate-pulse rounded-full bg-mint" />
          <span className="text-xs font-medium text-slate-300">Full platform, every plan</span>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Everything your bot{" "}
          <span className="bg-gradient-to-r from-brand via-cyan to-mint bg-clip-text text-transparent">
            needs.
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-400">
          A complete hosting stack — databases, files, backups, monitoring — all
          in one dashboard. No feature gating on any plan.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-md transition hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-4">
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-xl border ${iconStyles[f.color]}`}
              >
                <f.icon className="size-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white">{f.title}</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            <ul className="mt-4 space-y-2">
              {f.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-cyan px-7 py-3.5 font-semibold text-white shadow-xl shadow-brand/30 transition hover:shadow-brand/50"
        >
          See pricing — from ৳100/mo →
        </Link>
      </div>
    </main>
  );
}
