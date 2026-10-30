# Lease Coach

A phone-friendly web app (installable PWA) to negotiate a **Kia Telluride** or **Hyundai Palisade** lease in
South Florida (tuned for Deerfield Beach / Broward County, 7% sales tax).

It runs entirely on the device: no accounts, no tracking, no network calls. Once installed it works offline.

## What it does

| Tab | Purpose |
|---|---|
| **Home** | Game plan, month-end timing, targets at a glance, next prep steps, quick tools. |
| **Targets** | What a *Great*, *Good* and *Walk-away* lease looks like for each top trim (price, money factor, residual, fees, monthly, due at signing, true monthly cost). Editable program numbers, incentives, head-to-head, reality check. |
| **Check** | Enter any dealer quote: grade (A+ to F), red flags, and the exact levers to push on with scripts. Plus **Decode quote** (back out the hidden price or money factor from a payment), **Miles** planner, **Lease vs buy**, **Lease end**. |
| **Playbook** | Prep checklist, questions to ask, 16 tactics, copy-ready email/text scripts, dealer traps, Florida essentials, glossary. |
| **Offers** | Log every quote, grade it, compare up to 3 side by side by true monthly cost. Backup/restore from Settings. |

## Install on a phone

Host the folder on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages, ...), open the URL on the phone, then:

- **iPhone (Safari):** Share, then *Add to Home Screen*.
- **Android (Chrome):** menu, then *Install app*.

## Where the numbers live

All reference data is in [`js/data.js`](js/data.js):

- Trim MSRPs: Kia and Hyundai press releases (2027 Telluride, 2027 Palisade).
- Lender base money factors and residuals: Edmunds lease-deals forum moderator posts, Oct 9-29, 2026
  (36-month figures; other terms and mileage tiers use the adjustments in `rvAdj` / `mfAdj`).
- Florida tax and fees: DOR DR-15DSS (2026) and FLHSMV fee schedule.
- Great/Good/Walk-away price tiers, dealer-fee norms and invoice ratio are **estimates**.

The app lets the user override MSRP, residual, money factor, lease cash and acquisition fee per trim
(Targets, *Edit program numbers*), which is the best way to sharpen every result.

To refresh for a new month: update `rv` / `mf` / `leaseCash` on the trims and `asOf` / `programEnds` in `data.js`,
then bump `VERSION` in `sw.js` so installed copies pick up the change.

## Develop

```powershell
npm test        # unit tests for the lease math, targets and grading (node:test, no dependencies)
npm start       # http://127.0.0.1:8765 (no-store dev server; the service worker is skipped on localhost)
```

Test the service worker locally with `http://127.0.0.1:8765/index.html?sw=1`.

Structure:

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/calc.js       pure lease math (payment, taxes, due at signing, reverse solves, loan helpers)
js/data.js       reference data (trims, program numbers, Florida fees, sources)
js/advisor.js    target tiers, grading, red flags, negotiation levers
js/store.js      state + localStorage + scenario helpers
js/ui.js         DOM helpers and form controls
js/content.js    playbook content
js/views/*.js    Home, Targets, Check, tools, Playbook, Offers, Settings
test/            unit tests
scripts/         icon generator (Pillow) and dev server
```

## Disclaimer

Estimates for planning and negotiation only. Residuals, money factors, incentives and fees change monthly and vary by
dealer, ZIP and credit. Always verify against the dealer worksheet and the lease contract.
