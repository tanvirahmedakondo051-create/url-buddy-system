import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl", className)}>{children}</div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "brand" }: { label: string; value: ReactNode; hint?: string; tone?: "brand" | "cyan" | "mint" | "amber" }) {
  const bar = { brand: "from-brand", cyan: "from-cyan", mint: "from-mint", amber: "from-amber" }[tone];
  return (
    <Panel className="relative overflow-hidden p-5">
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent", bar)} />
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Panel>
  );
}

const statusTone: Record<string, string> = {
  active: "bg-mint/15 text-mint border-mint/30",
  approved: "bg-mint/15 text-mint border-mint/30",
  paid: "bg-mint/15 text-mint border-mint/30",
  open: "bg-cyan/15 text-cyan border-cyan/30",
  answered: "bg-brand/20 text-indigo-300 border-brand/40",
  "customer-reply": "bg-amber/15 text-amber border-amber/30",
  pending: "bg-amber/15 text-amber border-amber/30",
  pending_setup: "bg-amber/15 text-amber border-amber/30",
  suspended: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  terminated: "bg-red-500/15 text-red-300 border-red-500/30",
  closed: "bg-white/5 text-slate-400 border-white/10",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize", statusTone[key] ?? "border-white/10 bg-white/5 text-slate-300")}>
      {status.replace("_", " ")}
    </span>
  );
}

export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v = {
    primary: "bg-gradient-to-r from-brand to-cyan text-white shadow-lg shadow-brand/25 hover:shadow-brand/45",
    ghost: "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
    danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  }[variant];
  return (
    <button
      {...p}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", v, className)}
    />
  );
}

const field = "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(field, p.className)} />;
}
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn(field, "[&>option]:bg-ink2", p.className)} />;
}
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn(field, "min-h-28", p.className)} />;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string | undefined }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-wider text-slate-500">
            <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">{children}</tbody>
        </table>
      </div>
      {empty && <p className="px-4 py-10 text-center text-sm text-slate-500">Nothing here yet.</p>}
    </Panel>
  );
}
export const Td = ({ children, className }: { children: ReactNode; className?: string }) => (
  <td className={cn("whitespace-nowrap px-4 py-3", className)}>{children}</td>
);

export function Loading() {
  return <div className="py-16 text-center text-sm text-slate-500">Loading…</div>;
}
