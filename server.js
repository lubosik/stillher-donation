require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const path = require('path');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.static(path.join(__dirname)));

// Webhook must use raw body BEFORE express.json()
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const donorEmail = paymentIntent.receipt_email || paymentIntent.metadata?.donor_email;
      const donorName = paymentIntent.metadata?.donor_name || 'Friend';
      const amount = (paymentIntent.amount / 100).toFixed(2);
      const currency = paymentIntent.currency.toUpperCase();
      const paymentId = paymentIntent.id;
      const isMonthly = paymentIntent.metadata?.is_monthly === 'true';

      if (donorEmail) {
        try {
          await sendDonationThankYouEmail({ to: donorEmail, donorName, amount, currency, paymentId, isMonthly });
          console.log(`Thank-you email sent to ${donorEmail}`);
        } catch (emailErr) {
          console.error('Failed to send thank-you email:', emailErr.message);
        }
      }
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const { amount, donorName, donorEmail, isMonthly, bracketTier } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid donation amount.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      receipt_email: donorEmail || undefined,
      description: `${process.env.DONATION_PRODUCT_NAME} — One-time donation`,
      metadata: {
        donor_name: donorName || 'Anonymous',
        donor_email: donorEmail || '',
        is_monthly: 'false',
        bracket_tier: bracketTier || 'Custom',
        product: process.env.DONATION_PRODUCT_NAME,
      },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('PaymentIntent creation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inkind', (req, res) => {
  const { category, description, name, email, phone } = req.body;
  const entry = { category, description, name, email, phone, timestamp: new Date().toISOString() };
  console.log('In-kind submission received:', JSON.stringify(entry));
  const fs = require('fs');
  const filePath = path.join(__dirname, 'data', 'inkind-submissions.json');
  try {
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
    existing.push(entry);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
  } catch (e) {
    console.error('Failed to save in-kind submission to file:', e.message);
  }
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function sendDonationThankYouEmail({ to, donorName, amount, currency, paymentId, isMonthly }) {
  const firstName = donorName.split(' ')[0];
  const formattedAmount = `${currency} $${amount}`;
  const givingType = isMonthly ? 'monthly' : 'one-time';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for your gift</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F0E8;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0E8;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1A1410;padding:40px 48px;text-align:center;">
              <p style="margin:0;color:#C9A96E;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">StillHer Foundation</p>
              <h1 style="margin:16px 0 0;color:#FAFAF7;font-family:Georgia,serif;font-size:28px;font-weight:400;font-style:italic;line-height:1.3;">Road to Her Smile</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1A1410;padding:0 48px;">
              <div style="height:1px;background-color:#C9A96E;opacity:0.4;"></div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAFAF7;padding:56px 48px;">
              <p style="margin:0 0 8px;color:#9A9590;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">A message from the Foundation</p>
              <h2 style="margin:0 0 32px;color:#1A1410;font-family:Georgia,serif;font-size:32px;font-weight:400;font-style:italic;line-height:1.3;">${firstName}, thank you.</h2>
              <p style="margin:0 0 20px;color:#3A3530;font-family:Georgia,serif;font-size:17px;line-height:1.8;">Because of you, Lia's road to her smile gets a little closer today.</p>
              <p style="margin:0 0 20px;color:#3A3530;font-family:Georgia,serif;font-size:17px;line-height:1.8;">Your ${givingType} gift of <strong>${formattedAmount}</strong> goes directly toward the production, legal advocacy, and distribution of <em>Road to Her Smile</em> — a documentary that has never been more necessary.</p>
              <p style="margin:0 0 20px;color:#3A3530;font-family:Georgia,serif;font-size:17px;line-height:1.8;">Lia's story is one of extraordinary resilience. An immigrant mother who left everything behind for a promise of love, who was failed by a husband, a doctor, and an institution she trusted — and who still chose to stand. Your support means that story will finally be heard.</p>
              <p style="margin:0 0 40px;color:#3A3530;font-family:Georgia,serif;font-size:17px;line-height:1.8;">She is still her. And because of you — so is her voice.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,0.4);border-radius:4px;margin-bottom:40px;">
                <tr>
                  <td style="padding:24px 28px;background-color:#F5F0E8;">
                    <p style="margin:0 0 12px;color:#9A9590;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Donation Receipt</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#3A3530;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">Amount</td>
                        <td align="right" style="color:#1A1410;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:6px 0;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="color:#3A3530;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">Type</td>
                        <td align="right" style="color:#1A1410;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">${isMonthly ? 'Monthly recurring gift' : 'One-time gift'}</td>
                      </tr>
                      <tr>
                        <td style="color:#3A3530;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">Project</td>
                        <td align="right" style="color:#1A1410;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">Road to Her Smile</td>
                      </tr>
                      <tr>
                        <td style="color:#3A3530;font-family:Arial,sans-serif;font-size:14px;padding:6px 0;">Reference</td>
                        <td align="right" style="color:#9A9590;font-family:'Courier New',monospace;font-size:12px;padding:6px 0;">${paymentId}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#3A3530;font-family:Georgia,serif;font-size:16px;font-style:italic;line-height:1.8;">With deepest gratitude,</p>
              <p style="margin:0;color:#1A1410;font-family:Georgia,serif;font-size:16px;font-weight:600;">The StillHer Foundation</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1A1410;padding:32px 48px;text-align:center;">
              <p style="margin:0 0 8px;color:#C9A96E;font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">StillHer Foundation</p>
              <p style="margin:0 0 8px;color:rgba(250,250,247,0.5);font-family:Arial,sans-serif;font-size:12px;">Restoring dignity. One story at a time.</p>
              <p style="margin:0;color:rgba(250,250,247,0.3);font-family:Arial,sans-serif;font-size:11px;">This email serves as your donation receipt. Please retain it for your records.${isMonthly ? ' Your monthly gift will automatically renew each month.' : ''}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: `${process.env.FOUNDATION_NAME} <${process.env.FOUNDATION_EMAIL}>`,
    to,
    subject: `Thank you for supporting Road to Her Smile — your gift matters`,
    html,
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StillHer Foundation server running on port ${PORT}`);
  console.log(`Stripe mode: ${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'LIVE' : 'TEST'}`);
});
