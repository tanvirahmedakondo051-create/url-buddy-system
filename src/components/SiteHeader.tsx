import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSettings } from "@/lib/auth";

const navLinks = [
  { to: "/pricing", label: "Pricing" },
  { to: "/features", label: "Features" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { data: brand } = useSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          {brand?.["logo_url"] ? <img src={brand["logo_url"]} alt="" className="size-9 rounded-xl object-contain" /> : (
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan shadow-lg shadow-brand/40">
            <span className="font-mono text-sm font-bold text-white">{(brand?.["site_name"] || "H").charAt(0)}</span>
          </div>)}
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            {brand?.["site_name"] || "Hexa Hoster"}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="transition hover:text-white"
              activeProps={{ className: "text-white" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            Launch console
          </Link>
        </div>

        <button
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-slate-300">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-gradient-to-r from-brand to-cyan px-4 py-2.5 text-center font-semibold text-white"
            >
              Launch console
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
