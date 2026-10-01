# zerobot: full panel inside Lovable (no PHP)

Rebuild the client area and the WHMCS-style admin panel in this project, using the same frosted-glass dark design. Everything can be tested live in the preview. Publishing puts it online on the free yoursite.lovable.app link; using your own domain needs a paid plan. No cPanel needed.

## What gets built

**Accounts**
- Real sign up and sign in (email + Google), forgot password, email verification
- Admin role kept separate and checked on the server

**Client area** (/dashboard)
- Overview: active services, wallet balance, open tickets, announcements
- Order a plan (the 8 existing plans) with bKash, Nagad, Rocket or wallet. The customer enters their transaction ID and an admin approves it
- My services: status, RAM/disk/CPU, renew, open the game panel
- Wallet: add money, history
- Invoices: list and detail
- Support tickets: create, reply, close
- Profile and security settings

**Admin panel** (/admin), WHMCS style
- Grouped side menu, top search, dashboard with income, new orders, pending payments and open tickets
- Clients: list, detail, edit, add credit, suspend
- Orders and payments: approve or reject a transaction ID, which creates the service automatically
- Services: suspend, unsuspend, terminate, renew
- Products/plans: add, edit, price, feature on homepage
- Invoices, support tickets (reply as staff), announcements
- Settings: site name, payment numbers, game panel connection
- Activity log of every admin action

**Game panel (Pterodactyl) link**
- When a payment is approved, the server is created on your Pterodactyl panel. Suspend and terminate follow the admin's actions
- Needs your panel URL and API key, saved securely. Until then, services are created as "pending setup"

**Automatic jobs**
- Daily check: expiry reminder before due date, auto-suspend when overdue

The pricing page and the "Launch console" buttons will open the real sign up and dashboard.

## Cost
- Lovable hosting: free link; custom domain on a paid Lovable plan
- No separate server or cPanel bill. Pterodactyl stays on your own server as it is now

## Technical details
- Lovable Cloud: auth, Postgres with RLS, `user_roles` + `has_role()` for admin
- Tables: profiles, plans (seeded with 8 plans), orders, payments, services, invoices, wallet_transactions, tickets, ticket_messages, announcements, settings, admin_logs
- Server functions with `requireSupabaseAuth`; admin functions verify `has_role` before any privileged work
- Pterodactyl Application API called from server functions; secret `PTERODACTYL_API_KEY`
- Routes: `_authenticated/dashboard/*`, `_authenticated/admin/*` (admin gate), existing marketing routes kept
- Daily job via a cron server route under `/api/public/cron`, protected by a shared secret
- First admin: the first account you create is promoted with a one-time SQL step
