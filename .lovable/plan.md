# zerobot: AuraPay fix, Pterodactyl accounts, vouchers, branding, client hub

## 1. Fix the AuraPay checkout error (first)
- The "orders_method_check" error happens because the database only allows bKash/Nagad/Rocket/wallet as payment methods. Add "aurapay" to the allowed list.
- AuraPay needs only the **Brand key**. Remove the "AuraPay secret" field from Admin → Settings and rename the key field to "AuraPay Brand key".

## 2. Pterodactyl account on signup
- When someone signs up, zerobot also creates their account on your game panel (same email, username made from their name, random strong password).
- If the game panel isn't connected yet, the account is created later, the first time it's needed. Admin can also press "Create panel account" on the client's page.
- New servers are created under that customer's own panel account.

## 3. "Panel Access" card (client home, like zero-bot.net)
- Shows panel **username** and **email** with copy buttons.
- "Generate password" button: sets a new panel password and shows it once, with a copy button.
- "Open panel" button goes straight to your game panel.

## 4. Vouchers / Claim Rewards
- Admin → Billing → Vouchers: create a code with an amount (৳), how many times it can be used, one use per customer, expiry date, on/off.
- Client → "Claim Rewards": enter the code, the amount is added to their wallet. Admin sees who claimed what.

## 5. Branding (WHMCS-style General settings)
- Admin → Settings → General: site name, logo, favicon (upload), support email, footer text.
- Used across the website, client area and admin panel.

## 6. Client area like zero-bot.net
- Mobile bottom bar: Home, Servers, Billing, Tickets, Menu.
- Home cards: Claim Rewards, Hosting Plans, Panel Access, Your Servers.
- Side menu: Console Hub, Instances, Hosting Plans, Help Center, Claim Rewards, Account Settings, plus About/FAQ/Terms/Privacy.

## 7. More WHMCS features (in this round)
- Coupons / discount codes at checkout (percent or fixed).
- Admin creates a manual invoice for a client; refund an order to wallet.
- Ticket departments and ready-made replies.
- Auto-terminate setting: X days after suspension (admin chooses).
- Reports page: income by month, new clients, top plans.

Not in this round (tell me if you want them next): staff with limited permissions, email notifications, affiliate program, bot marketplace.

## Technical details
- Migration: drop/recreate `orders_method_check` to include `aurapay`; new tables `vouchers`, `voucher_claims`, `coupons`, `canned_replies`, `ticket_departments`; `profiles.ptero_user_id`, `ptero_username`; `orders.coupon_id`, `discount`. All with GRANTs + RLS; `claim_voucher(code)` and coupon apply as SECURITY DEFINER.
- `set_gateway_secret` allow-list: `aurapay_brand_key` (replaces api_key/secret); `aurapay.server.ts` sends brand key header only.
- Ptero user: server fn `ensurePteroUser` (auth) called after signup/first dashboard load → `POST /api/application/users`; `resetPanelPassword` → `PATCH /users/{id}`; provisioning uses `ptero_user_id`.
- Branding: storage bucket `branding` (public), settings keys `logo_url`, `favicon_url`, `support_email`, `footer_text`; `__root.tsx` head reads favicon from settings.
- Auto-terminate: extend daily cron with `terminate_after_days` setting.
