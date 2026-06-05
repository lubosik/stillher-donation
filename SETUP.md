# StillHer Foundation — Donation Page Setup

## Prerequisites
- Node.js 18+
- npm
- Stripe account (test mode for development)
- Resend account (free tier covers all testing)

## Installation
```bash
npm install
```

## Environment Setup
```bash
cp .env.example .env
```
Then fill in your keys:

### Stripe keys
Dashboard → Developers → API Keys
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stripe webhook secret (local testing)
```bash
stripe listen --forward-to localhost:3000/webhook
```
Copy the `whsec_...` signing secret it prints and add to .env:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Resend key
dashboard.resend.com → API Keys → Create API Key
```
RESEND_API_KEY=re_...
```

## CRITICAL: Disable Stripe's built-in receipt emails
Stripe Dashboard → Settings → Emails → Customer emails → Toggle OFF "Successful payments"
This prevents donors from receiving two emails (one from Stripe, one from Resend).

## Update the Stripe publishable key in HTML
In `index.html` and `thank-you.html`, replace:
```
const STRIPE_PUBLISHABLE_KEY = 'pk_test_PLACEHOLDER';
```
with your actual `pk_test_...` key.

## Running locally
```bash
npm start
# or for auto-reload:
npm run dev
```
Server starts at http://localhost:3000

## Testing webhook locally (requires Stripe CLI)
```bash
stripe listen --forward-to localhost:3000/webhook
```
Leave this running in a separate terminal while testing donations.

## Test card
```
Card number: 4242 4242 4242 4242
Expiry:      Any future date (e.g. 12/26)
CVC:         Any 3 digits (e.g. 123)
Postcode:    Any (e.g. 10001)
```

## Going live checklist
1. Switch to live Stripe keys in .env: `sk_live_...`
2. Update `STRIPE_PUBLISHABLE_KEY` in `index.html` and `thank-you.html` to `pk_live_...`
3. Register production webhook endpoint in Stripe Dashboard:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/webhook`
   - Event: `payment_intent.succeeded`
4. Copy the new webhook signing secret to .env: `STRIPE_WEBHOOK_SECRET=whsec_...`
5. Register your sending domain in Resend dashboard (dashboard.resend.com → Domains)
6. Update `FOUNDATION_EMAIL` in .env to your verified domain email
7. Run `npm start` and test with a real card — confirm email arrives

## Railway deploy
```bash
railway init
railway up
```
Set all env vars in Railway dashboard under Variables.

## Architecture reminder
```
Donor submits form
  → POST /create-payment-intent (server creates PaymentIntent)
  → Stripe.js confirms payment (client)
  → Redirect to /thank-you.html
  → Stripe fires payment_intent.succeeded webhook to /webhook
  → Webhook calls Resend → branded email sent to donor
```
