# zerobot admin: WHMCS-level upgrade + AuraPay + Pterodactyl setup

## 1. Products / plans
- Delete button on each plan, with a confirmation step. If customers already use a plan, it is hidden instead of deleted, so their services are not affected
- Duplicate plan, product groups (Mini / Pro / Mega), drag to reorder
- Billing cycles: monthly, quarterly, yearly, each with its own price

## 2. Pterodactyl connection, all from the admin panel
- New "Game panel" settings page: panel URL + Application API key field (saved securely, never shown again after saving)
- "Test connection" button that shows the result: connected, wrong key, or unreachable
- Pick the nest, egg and location from dropdowns loaded from your panel (no typing IDs)
- Step-by-step guide on the page: Pterodactyl → Admin → Application API → Create key (all permissions Read & Write) → paste here

## 3. AuraPay payment gateway
- Customers can pay by AuraPay at checkout, renewal and wallet top-up. On success, the order is approved automatically and the server is created
- Admin → Payment gateways: turn each method on/off (AuraPay, bKash, Nagad, Rocket, wallet), with an API key field for AuraPay
- Every AuraPay payment is checked with AuraPay before it is approved, so fake payments are not accepted

## 4. Admin features added from WHMCS
- **Clients:** add client manually, edit details, notes, login as client, close account, full history tabs
- **Orders:** add order manually, mark paid, cancel, refund to wallet, fraud flag
- **Invoices:** create a manual invoice, mark paid/unpaid, add a late fee, download as PDF
- **Billing:** transactions list, income report by month and by gateway
- **Coupons / promo codes:** percent or fixed amount, expiry, usage limit
- **Support:** departments, priority, ready-made replies, assign to staff
- **Staff:** add staff admins with limited permissions (support only, billing only, full)
- **Automation settings:** days before suspend, days before terminate, invoice created X days before due
- **Email:** invoice, payment received, suspension and expiry reminder emails
- **Reports:** new clients, income, active services per plan

## Needed from you
- AuraPay API key and its documentation link (or the sample code from your old panel), since I need its exact payment address and verification method
- Pterodactyl Application API key, entered by you in the admin panel

## Technical details
- Gateway secrets stored in a server-only `gateway_secrets` table (admin-only RLS, write-only from UI, read only in server functions); PTERODACTYL key moves from env to this store with env fallback
- AuraPay: server fn creates payment, `/api/public/aurapay/callback` webhook verifies with the API before calling `approve_order`
- Plan delete: SECURITY DEFINER `admin_delete_plan` — hard delete if unused, else `active=false, archived=true`
- New tables: coupons, ticket_departments, canned_replies, staff_permissions, client_notes; orders gain coupon/discount, billing_cycle
- Ptero helper endpoints: test, list nests/eggs/locations in `ptero.functions.ts`
- Emails via Lovable built-in email once a sender domain is set up
