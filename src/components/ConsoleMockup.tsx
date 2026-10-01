export function ConsoleMockup() {
  return (
    <div className="relative animate-floaty">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand/20 to-cyan/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber/80" />
          <span className="size-3 rounded-full bg-mint/80" />
          <span className="ml-3 font-mono text-xs text-slate-400">
            zerobot — my-bot · console
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-mint">
            <span className="size-1.5 animate-pulse rounded-full bg-mint" />
            Running
          </span>
        </div>
        {/* tabs */}
        <div className="flex gap-1 px-3 pt-3 font-mono text-xs">
          <span className="rounded-md border border-brand/30 bg-brand/20 px-3 py-1.5 text-brand">
            Console
          </span>
          <span className="rounded-md px-3 py-1.5 text-slate-400 transition hover:text-white">
            Files
          </span>
          <span className="rounded-md px-3 py-1.5 text-slate-400 transition hover:text-white">
            Backups
          </span>
          <span className="rounded-md px-3 py-1.5 text-slate-400 transition hover:text-white">
            Network
          </span>
        </div>
        {/* stats */}
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">CPU</div>
            <div className="mt-0.5 font-mono text-sm text-white">34%</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand to-cyan" />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">RAM</div>
            <div className="mt-0.5 font-mono text-sm text-white">512MB</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-cyan" />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Disk</div>
            <div className="mt-0.5 font-mono text-sm text-white">1.2GB</div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/5 rounded-full bg-mint" />
            </div>
          </div>
        </div>
        {/* console logs */}
        <div className="mx-3 mb-3 rounded-lg border border-white/10 bg-ink2/80 p-3 font-mono text-[11px] leading-relaxed">
          <div className="text-slate-500">$ zerobot deploy my-bot</div>
          <div className="text-cyan">▸ pulling image node:20-alpine …</div>
          <div className="text-mint">✓ isolated container created</div>
          <div className="text-slate-400">▸ mounting /app · port 3000</div>
          <div className="text-mint">✓ env loaded (5 vars)</div>
          <div className="text-slate-400">[00:00:03] webhook listening on :3000</div>
          <div className="text-brand">[00:00:04] bot connected to telegram API</div>
          <div className="text-mint">
            [00:00:05] 200 OK · /health{" "}
            <span className="inline-block w-2 animate-blink">▌</span>
          </div>
        </div>
      </div>
    </div>
  );
}
