# Fix-everything pass: AuraPay, plans, animations, email verification

Done in one go, then tested end-to-end before reporting back (to save your credits).

## 1. AuraPay "Invalid API Response"
The error page in your screenshot comes from AuraPay's own page after pressing Pay, not from our site. The exact cause isn't confirmed yet. Likely causes:
- The preview link is private (it needs a Lovable login), so AuraPay can't reach our return and confirmation links. AuraPay works only on the published site.
- The request is missing fields the module sends (metadata/invoice reference, amount format).

Steps:
- Check the server logs from your attempt and AuraPay's create response.
- Send exactly what the official module sends: the amount with 2 decimals, and the invoice id in metadata.
- Return and confirmation links always use the published site address, never the preview.
- Confirm payment through AuraPay's verify call, using every transaction id name AuraPay uses.
- Show a clear message on the return page instead of raw text.
- Test a real create call with your Brand key, and confirm the payment page opens.

## 2. Plans: disk in MB, live on the website
- Admin plan form: disk entered in **MB** (shown as GB on the site when 1024 MB or more).
- The Home and Pricing pages read plans straight from the admin list, so adding, editing or deleting a plan changes the site right away. The fixed design-only cards are removed.

## 3. More premium look
- Fade and slide-in animation as you scroll, glowing animated buttons, floating hero shapes, and a moving gradient border on the popular plan.
- Animated icons (moving pictures) on the feature cards. Keeps the frosted glass dark style.

## 4. Email verification at signup
- New accounts must click the email link before they can log in. The register page shows a "Check your inbox" screen with a resend button. Login shows "verify your email first" when needed.
- Emails can only reliably reach inboxes (not spam) from your own domain. Once you connect a domain, I'll set up branded zerobot emails: verification, password reset, and later payment and ticket emails. Without a domain, a default sender is used, which is slower and may land in spam.

## Technical details
- Migration: add `plans.disk_mb` (copy disk_gb*1024), update UI/types; keep `disk_gb` for the provisioning fallback, then switch `ptero.server.ts` to `disk_mb`.
- Fix the 4 SECURITY DEFINER linter warnings (revoke the anon execute grant, keep the internal auth checks).
- AuraPay: log status and body; build `origin` from the published URL setting/env.
- Auth: confirm that auto-confirm is off; `signUp` uses `emailRedirectTo`; handle the `email_not_confirmed` error.
- Typecheck, then use Playwright on the home, pricing, admin plans and register pages.
