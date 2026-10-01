# zerobot — cPanel-ready PHP panel with WHMCS-style admin

## Important constraint
The preview website here runs on a modern JS server and cannot run on normal cPanel shared hosting. cPanel runs PHP + MySQL. So the final product will be a **PHP + MySQL package (ZIP)** you upload to `public_html` — the same type as the project you uploaded, but fully redesigned and upgraded. The current preview site stays as the visual design reference.

## What you get (ZIP in Files)
Built on top of your uploaded project (keeps all working logic: Pterodactyl auto-provision, ZiniPay/AuraPay, wallet, 2FA, tickets, marketplace, cron, mail).

1. **Public site** — redesigned in the frosted glass dark style (home, store/pricing, about, FAQ, login, register, forgot, terms, privacy).
2. **Client area** — sidebar dashboard: servers (with Pterodactyl panel link, status, expiry), billing/invoices, add funds, tickets, affiliate, rewards, marketplace, account + 2FA.
3. **Admin panel, WHMCS-style**
   - Left sidebar grouped: Dashboard / Clients / Orders / Billing / Support / Products / Setup / Utilities
   - Top bar: global search (clients, orders, servers, invoices), quick "Add New", admin profile
   - Dashboard: revenue cards (today/month/year), pending orders, open tickets, active/suspended servers, revenue chart (last 30 days), recent orders + activity log
   - Clients list with filters + **client profile page with tabs** (Summary, Servers, Invoices, Transactions, Tickets, Notes, Login-as-client)
   - Orders: accept / cancel / mark fraud, auto-provision on accept
   - Servers: suspend / unsuspend / terminate / extend via Pterodactyl API
   - Invoices + transactions, manual payment add, vouchers
   - Support tickets with departments, priority, staff replies
   - Products/plans (Pterodactyl egg, nest, node/location, limits)
   - Setup: general, payment gateways, Pterodactyl connection test, email templates, staff admins
   - Activity log for all admin actions
4. **One-click web installer** (`/install`) — enter DB + Pterodactyl details, creates tables and first admin account. No phpMyAdmin editing needed.
5. **Setup guide** (Bangla-English) for cPanel upload, cron job, webhooks.

## Technical details
- PHP 8.0+, MySQL/MariaDB, PDO prepared statements, CSRF tokens, password_hash, `.htaccess` blocking `lib/` and `install/` after setup.
- No Composer/Node needed on server; pure PHP + one shared CSS + small vanilla JS; Chart.js via CDN for admin graph.
- New tables: `admin_logs`, `client_notes`, `ticket_departments`, `staff` roles column on separate `admin_roles` table; migration file for existing installs.
- Your uploaded `lib/config.php` secrets will not be copied into the package; a `config.example.php` is provided instead.
- Verification: run the package locally with PHP built-in server + SQLite/MySQL smoke test, screenshot admin + client pages.
