<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Client and admin panels live under `src/routes/_authenticated/` (dashboard.*, admin.*); admin layout checks `has_role` before rendering. Why: one auth gate, role checked server-side.
- Money and status changes (approve/reject order, wallet pay, balance, service status) go through SECURITY DEFINER SQL functions that verify the caller. Why: clients can't tamper with prices or balances.
- `orders` doubles as invoices and payments. Why: one record per payment keeps billing simple.
- Pterodactyl calls only happen in `src/lib/ptero.functions.ts` (admin-checked server fn, key in `PTERODACTYL_API_KEY`, URL in `settings`). Why: keeps the API key server-side.
- Overdue services are suspended by a daily pg_cron job calling `suspend_overdue()`. Why: no external scheduler needed.
- Marketing header/footer are hidden on /dashboard and /admin in `__root.tsx`. Why: panels have their own sidebar shell.
