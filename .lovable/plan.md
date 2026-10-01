# Email system, plan upgrade, animated visuals

## 1. Email system (Admin → Settings → Email)
- **Sender email:** to send emails from your own address (for example noreply@zero-bot.net), you need to own a domain. You connect it once with the "Set up email domain" button. After that, emails come from your name, use the zerobot design, and land in the inbox instead of spam.
- **Email verification on signup, On/Off switch:**
  - On: new users must click the link in the email before they can log in (this is how it works now).
  - Off: new users can log in right after they sign up.
- **Automatic emails, each sent to one customer:**
  - Order or payment confirmed (plan bought, invoice paid)
  - Plan upgraded
  - Service expires in 7 days, with a "Renew now" link that opens the renew invoice
  - Ticket reply from staff
- **"Updates to all users":** Lovable does not allow bulk or marketing emails, because they hurt delivery for every other email you send. Instead:
  - Admin announcements show as a banner and a list inside the client dashboard.
  - For newsletters, you can use a separate marketing email service later.

## 2. Plan upgrade (client → My Services → Upgrade)
- The customer sees every bigger plan, with the price difference for each.
- Example: Nano costs ৳80 and was bought on Aug 1. The customer upgrades to the ৳150 plan on Aug 8 and pays ৳70. The server gets the new RAM, CPU and disk right away. The expiry date stays Sep 1.
- Customers can pay with AuraPay, bKash/Nagad/Rocket (manual), or their wallet.
- Manual payments wait for admin approval, the same as now. AuraPay and wallet payments upgrade the server instantly.
- Renewals after an upgrade charge the new plan's price.

## 3. Animated visuals on the website
- Custom animated glowing bot, server and shield pictures for the home page, features page and empty screens. They float and pulse in the frosted glass dark style.

## Technical details
- Upgrade: new order kind `upgrade` with `service_id` and the new `plan_id`. The `orders_set_amount` trigger sets amount = new price - current plan price, and blocks downgrades and amounts of 0 or less. `approve_order`, `system_approve_order` and `pay_with_wallet` handle the upgrade: they update `services.plan_id`, keep `due_date` unchanged, then call the game panel to update server limits (`updateServerBuild` in ptero.server.ts).
- Verification toggle: `settings.email_verification`. When it is off, signup goes through a server function that creates the user already confirmed (admin create user). When it is on, signup works the normal way.
- Emails: scaffold auth and app email templates after the domain is set. Sends happen from server code with idempotency keys. A daily pg_cron job calls a protected `/api/public/cron/expiry-reminders` route, which sends one reminder per service at 7 days before expiry (tracked with `services.reminder_sent_at`).
- Animated visuals: generated transparent PNGs plus CSS float and glow animations, with reduced-motion support.
