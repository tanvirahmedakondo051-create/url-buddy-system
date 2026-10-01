import { useSettings } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  const { data: brand } = useSettings();
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-cyan">
            <span className="font-mono text-xs font-bold text-white">z</span>
          </div>
          <span className="font-display font-semibold text-slate-300">{brand?.["site_name"] || "zerobot"}</span>
        </div>
        <div className="flex gap-6">
          <Link to="/pricing" className="transition hover:text-white">
            Pricing
          </Link>
          <Link to="/features" className="transition hover:text-white">
            Features
          </Link>
          <Link to="/faq" className="transition hover:text-white">
            FAQ
          </Link>
          <Link to="/login" className="transition hover:text-white">
            Sign in
          </Link>
        </div>
        <span className="font-mono text-xs">{brand?.["footer_text"] || `© 2026 ${brand?.["site_name"] || "zerobot"}`}</span>
      </div>
    </footer>
  );
}
