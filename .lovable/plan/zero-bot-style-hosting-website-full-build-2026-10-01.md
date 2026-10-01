# Zero-Bot style hosting website — full build

A professional multi-page hosting platform website (like zero-bot.net) in the selected **Frosted Glass Dark** direction: deep navy-black background, indigo→cyan gradient accents, frosted glass cards, Space Grotesk + DM Sans typography, JetBrains Mono for console text.

## Pages

1. **Home (`/`)** — hero with gradient headline "Get your bot online.", floating live-console dashboard mockup (tabs, CPU/RAM/Disk stats, streaming logs), stats (200+ servers, 99.99% uptime, 550+ developers), runtime cards (Node.js, Python, Go, Bun), 7-feature grid (Web Console & Logs, Env Variables, Custom Ports & Static IP, File Manager + SFTP, Automated Backups, Resource Monitoring, GitHub Integration), "Live in 60 seconds" 3-step section, pricing teaser, "every plan includes" checklist, FAQ accordion, final CTA, footer.
2. **Pricing / Store (`/pricing`)** — all 8 real plans from zero-bot.net: Mini-v1 ৳100, Mini-v2 ৳150, Mini-v3 ৳200, Pro-v1 ৳350, Pro-v2 ৳450, Pro-v3 ৳550, Mega-v1 ৳600, Mega-v2 ৳850 — each with RAM/SSD/CPU specs, "custom domain included" on Pro+, Deploy button, payment note (bKash, Nagad, Rocket).
3. **Login (`/login`)** — frosted glass auth card: email/username + password, forgot password link, Google sign-in button, link to register.
4. **Register (`/register`)** — first/last name, username, email, password, terms checkbox, Google sign-up, link to login.
5. **Features (`/features`)** — detailed feature page expanding the 7 platform features.
6. **FAQ (`/faq`)** — full FAQ page (activation speed, idle sleep, upgrades, payments, refunds, runtimes).

Shared header (logo, nav, Sign in + Launch console buttons) and footer across all pages. Auth pages get a minimal centered layout with ambient gradient background.

## Design tokens (from chosen direction)

- Background `#060814`, panels `white/5` with `backdrop-blur`, borders `white/10`
- Brand indigo `#6366f1`, accent cyan `#22d3ee`, mint `#34d399`, amber `#fbbf24`
- Fonts: Space Grotesk (headings), DM Sans (body), JetBrains Mono (console/labels)
- Motion: gentle float on dashboard mockup, blinking cursor, soft ambient blurred glows, hover lifts — restrained

## Technical notes

- TanStack Start routes: `index.tsx`, `pricing.tsx`, `features.tsx`, `faq.tsx`, `login.tsx`, `register.tsx`; shared chrome in `__root.tsx`
- Design tokens in `src/styles.css` via `@theme`; fonts loaded via `<link>` in root head
- Each route gets its own `head()` metadata (title, description, og tags)
- Frontend-only for now (auth buttons are visual); real login/database can be added later with Lovable Cloud if wanted
- No backend, no Supabase — pure marketing site
