# AuraPay payments + WHMCS-style admin redesign

## 1. AuraPay (automatic payment)
- New "AuraPay" button at checkout, renewal and wallet top-up (shown only when turned on in Admin → Settings)
- Customer clicks Pay → goes to the AuraPay payment page → pays with bKash/Nagad/Rocket there → comes back to zerobot
- On return, zerobot asks AuraPay "was this really paid?" before approving. Only then: order approved, server created, or wallet credited — no admin click needed
- If payment fails or is cancelled, the invoice stays unpaid and the customer sees a clear message with "Try again"
- Admin → Orders shows AuraPay payments with their AuraPay transaction ID; duplicate or fake confirmations are ignored

## 2. Admin panel redesign (WHMCS look)
```text
+--------------------------------------------------------------+
| zerobot  Clients  Orders  Billing  Support  Setup   [search] |  top menu bar with dropdowns
+--------------------------------------------------------------+
| Home > Clients > #12                                          |  breadcrumb
+-----------+--------------------------------------------------+
| Shortcuts |  KPI strip: Pending orders | Tickets | Overdue   |
| Add client|  ------------------------------------------------ |
| Add order |  Wide tables, compact rows, filter bar, paging,  |
| Stats     |  bulk select, status colour pills                |
+-----------+--------------------------------------------------+
```
- Top horizontal menu with dropdowns (Clients, Orders, Billing, Support, Setup, Utilities), like WHMCS, instead of only the left sidebar; small left column with shortcuts and quick stats
- Dashboard: WHMCS-style widgets — orders pending, tickets awaiting reply, overdue invoices, income today/month/year, recent activity, system health (game panel connected or not)
- Tables everywhere get: search/filter bar, status tabs (All / Pending / Active / Suspended...), pagination, compact dense rows
- Client profile page with WHMCS tabs: Summary, Profile, Services, Invoices, Transactions, Tickets, Log
- Keeps the zerobot dark frosted-glass colours and fonts, works on mobile (menu collapses)

## Needed from you
- AuraPay API key (paste in Admin → Settings → API keys)
- The AuraPay docs page shows only the two web addresses (create payment and verify payment), not the exact field names. I'll build it on the standard AuraPay format. After you add your key, I'll run one small test payment to confirm it works.

## Technical details
- Server fn `aurapayCreate` (auth) creates a pending order (method `aurapay`), POSTs to `https://pay.aurapay.top/api/payment/create` with key from `gateway_secrets`, amount, customer name/email, metadata `{order_id}`, redirect/cancel/webhook URLs; returns `payment_url`
- Return route `/dashboard/pay/return` + webhook `/api/public/aurapay/webhook`: both call `/api/payment/verify` with the invoice id, check status COMPLETED, amount matches, and order is pending, then run a new service-role SQL function `system_approve_order` (same logic as `approve_order`, unique `trx_id` guard) and trigger Pterodactyl provisioning
- Orders insert policy updated to allow method `aurapay` only via server fn; unique index on (method, trx_id)
- Admin layout: new `AdminShell` component (top nav + dropdowns + shortcut column) replacing PanelShell for admin routes; shared `DataTable` with filter/tabs/paging
