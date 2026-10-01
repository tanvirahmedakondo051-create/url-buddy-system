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
- Pterodactyl calls live in `src/lib/ptero.server.ts` (runPtero), invoked from admin-checked `ptero.functions.ts` or verified AuraPay confirmation. Why: keeps the API key server-side.
- AuraPay: `aurapay.server.ts` always re-verifies with AuraPay API before `system_approve_order` (service-role only); webhook at `/api/public/aurapay/webhook`. Why: callbacks can be forged.
- Admin uses `AdminShell` (WHMCS-style top menu + shortcuts column); client area keeps `PanelShell`. Why: matches WHMCS admin layout.
- Overdue services are suspended by a daily pg_cron job calling `suspend_overdue()`. Why: no external scheduler needed.
- Marketing header/footer are hidden on /dashboard and /admin in `__root.tsx`. Why: panels have their own sidebar shell.
- Game panel accounts: `ensurePteroUser` in `ptero.server.ts` creates/links the customer's Pterodactyl user (saved on profiles) on first dashboard load; provisioning reuses it. Why: one panel login per customer.
- Vouchers credit the wallet via `claim_voucher`; coupons are applied by the `orders_set_amount` trigger from `coupon_code`. Why: discounts can't be tampered with client-side.
- Logo/favicon are stored as small data URLs in `settings` (public storage buckets are blocked). Why: no file storage needed.
- Plan upgrades are `orders.kind = 'upgrade'`; price difference is computed server-side by `upgrade_diff`, due_date is never changed, and panel limits sync via `runPtero(..., "upgrade")`. Why: customers can't tamper with the upgrade price.
- Signup verification switch lives in `settings.email_verification`; when off, `signupNoVerify` creates confirmed users server-side. Why: the toggle can't be bypassed from the browser.
