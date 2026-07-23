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

1. While signed into the account that owns the sheet, open `https://script.google.com/` and create a new Apps Script project.
2. Replace its default code with `google-apps-script/Code.gs` from this project. The sheet ID and `Orders` tab are already set.
3. Replace `REPLACE_WITH_THE_SAME_SECRET_AS_.env.local` with a long random secret. Keep it private.
4. **Deploy → New deployment → Web app**. Set **Execute as: Me** and choose the least permissive access that still lets the site call it; copy the resulting `/exec` URL.
5. Copy `.env.example` to `.env.local`, then set:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
GOOGLE_SHEETS_WEBHOOK_SECRET=the-same-secret
```

6. Restart the local server and submit a test order. On the first successful request, the script creates the header row and appends the order into the `Orders` tab.

The webhook URL and secret stay on the server; do not expose either via `NEXT_PUBLIC_` variables or browser code.

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

Last verified: 4 test files / 8 tests passed, and the production build completed successfully.
