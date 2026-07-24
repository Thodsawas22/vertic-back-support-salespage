# Back Support — Next.js sales page

Thai COD sales page for a back/waist support product. The copy is original and deliberately avoids unsupported medical-treatment claims.

## What is built

- The nine supplied product images are served from `public/products/1.png` through `9.png` and displayed in that exact order as the sales funnel.
- Persistent floating **สั่งซื้อเลย** button plus in-page CTAs smoothly scroll to the order form.
- COD packages: 1 piece ฿1,990; 2 pieces ฿3,490; 3 pieces ฿4,990.
- Delivery form: full name, phone, street/address detail, Province → District → Subdistrict, and postcode auto-fill.
- Thai address data is bundled locally in `public/thai-address-db.json`; the three address dropdowns work without a third-party runtime request.
- Client/server order validation and a server-side Google Apps Script webhook boundary.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Connect Google Sheets — required before accepting real orders

The target sheet is already configured in `google-apps-script/Code.gs`:

```text
https://docs.google.com/spreadsheets/d/1dJa71bTOoDhq5-dva81EjjhuRMgQFOYzHdYbQJxMpa8/edit
```

This machine has no authorized Google Workspace token, so the final Apps Script web-app deployment must be done from the owner’s logged-in Google account:

1. While signed into the account that owns the sheet, open the existing Apps Script project.
2. Replace its code with `google-apps-script/Code.gs` from this project. The sheet ID and `Orders` tab are already set.
3. In **Project Settings → Script properties**, set `WEBHOOK_SECRET` to the same private value used by Vercel.
4. Select `setupOrderSheet` in the function menu and click **Run** once. Authorize it when prompted. This appends the operational columns without moving the existing 13 columns, adds the Status dropdown, and installs the status timestamp trigger.
5. **Deploy → Manage deployments → Edit → New version → Deploy**. Keep **Execute as: Me** and **Who has access: Anyone** so Vercel can call it; retain the resulting `/exec` URL.
6. Set these server-side variables locally and in Vercel Production:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
GOOGLE_SHEETS_WEBHOOK_SECRET=the-same-secret
```

7. Restart the local server or redeploy Vercel, then submit a test order. The webhook appends it to the `Orders` tab.

The webhook URL and secret stay on the server; do not expose either via `NEXT_PUBLIC_` variables or browser code.

## COD status and paid-order workflow

New orders start as `NEW`. Update the `Status` dropdown manually using only:

```text
NEW → CONFIRMED → SHIPPED → PAID
                   ↘ CANCELLED / RETURNED
```

- Mark `PAID` only after the carrier confirms COD collection/settlement—not when the customer submits the form or when the parcel merely ships.
- Changes to `CONFIRMED`, `SHIPPED`, and `PAID` automatically stamp their matching date columns after `setupOrderSheet` installs the edit trigger.
- Record the carrier tracking number, actual COD amount received, and any return reason in the operational columns.
- `Order ID`, `Event ID`, `_fbp`, and `_fbc` are captured with each new web order to deduplicate its browser Purchase event and preserve attribution.
- `Meta Purchase sent at` remains reserved for a future server-side paid-status reconciliation; browser Purchase is sent immediately when the order webhook succeeds.

## Meta Pixel measurement

Dataset `1595122382217844` receives `PageView`, `ViewContent`, `InitiateCheckout`, and a deduplicatable `Purchase` after the order webhook succeeds. For this COD setup, Meta's browser `Purchase` means **order placed**, while the Sheet's `PAID` status remains the source of truth for cash actually collected. Report order-created CPP and mature paid CPP separately; do not treat Ads Manager Purchase ROAS as realized cash.

## Honest social proof

Do not show invented customer names or fake “someone just ordered” notifications. That would mislead shoppers. After the Sheet integration is live, this can instead show verified recent orders only, with personal details anonymized and only where the customer has consented.

## Before launching ads

- Confirm every size range, material, delivery time, return policy, and product claim against the actual SKU.
- Add an accessible privacy notice, business identity/contact channel, and return process before collecting orders at scale.
- Keep health-related wording factual; do not position the product as medical treatment.

## Verification

```bash
npm test
npm run build
```

Last verified: 6 test files / 15 tests passed, and the production build completed successfully.
