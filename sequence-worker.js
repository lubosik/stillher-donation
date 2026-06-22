require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const DATA_FILE = path.join(__dirname, 'data', 'sequences.json');
const MONTHLY_URL = process.env.MONTHLY_PAGE_URL || 'https://stillher-donation-production.up.railway.app/monthly.html';

function readSequences() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return {}; }
}

function writeSequences(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function sendDay3(donor) {
  await resend.emails.send({
    from: `StillHer Foundation <${process.env.FOUNDATION_EMAIL || 'hello@stillherfoundation.org'}>`,
    to: donor.email,
    subject: `Here is what your gift is already doing`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F5F0E8;margin:0;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;background:#FAFAF7;border-radius:4px;overflow:hidden;">
  <div style="background:#1A1410;padding:36px 48px;text-align:center;">
    <p style="color:#C9A96E;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">StillHer Foundation</p>
    <h1 style="color:#FAFAF7;font-size:26px;font-weight:400;font-style:italic;margin:0;">Road to Her Smile</h1>
  </div>
  <div style="padding:48px;">
    <p style="color:#9A9590;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">A note from the Foundation</p>
    <h2 style="color:#1A1410;font-size:28px;font-weight:400;font-style:italic;margin:0 0 28px;">Three days ago, you did something meaningful.</h2>
    <p style="color:#3A3530;font-size:17px;line-height:1.8;margin:0 0 18px;">Your gift is already at work. Here is what the production is focused on right now:</p>
    <ol style="color:#3A3530;font-size:16px;line-height:1.9;padding-left:20px;">
      <li style="margin-bottom:12px;">Documenting Lia's story in her own words, at her own pace. The first interviews begin this month.</li>
      <li style="margin-bottom:12px;">Researching the institutional record: the community, the hospital, the doctor who disappeared.</li>
      <li style="margin-bottom:12px;">Building the legal and advocacy framework that will give this documentary its accountability edge.</li>
    </ol>
    <p style="color:#3A3530;font-size:17px;line-height:1.8;margin:24px 0;">None of this is possible without you. Thank you for staying with us.</p>
    <p style="color:#3A3530;font-size:16px;font-style:italic;margin:0 0 4px;">With gratitude,</p>
    <p style="color:#1A1410;font-size:16px;font-weight:600;margin:0;">The StillHer Foundation</p>
  </div>
  <div style="background:#1A1410;padding:24px 48px;text-align:center;">
    <p style="color:rgba(250,250,247,0.35);font-family:Arial,sans-serif;font-size:10px;margin:0;">StillHer Foundation. Restoring dignity. One story at a time.</p>
  </div>
</div></body></html>`
  });
}

async function sendDay14(donor) {
  await resend.emails.send({
    from: `StillHer Foundation <${process.env.FOUNDATION_EMAIL || 'hello@stillherfoundation.org'}>`,
    to: donor.email,
    subject: `Lia wanted to say something to you`,
    html: `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#F5F0E8;margin:0;padding:40px 20px;">
<div style="max-width:600px;margin:0 auto;background:#FAFAF7;border-radius:4px;overflow:hidden;">
  <div style="background:#1A1410;padding:36px 48px;text-align:center;">
    <p style="color:#C9A96E;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 12px;">StillHer Foundation</p>
    <h1 style="color:#FAFAF7;font-size:26px;font-weight:400;font-style:italic;margin:0;">A message from Lia</h1>
  </div>
  <div style="padding:48px;">
    <h2 style="color:#1A1410;font-size:28px;font-weight:400;font-style:italic;margin:0 0 28px;">"I did not think anyone would care."</h2>
    <p style="color:#3A3530;font-size:17px;line-height:1.9;margin:0 0 18px;">That is what Lia told us when she first heard that people were donating to tell her story. She has been failed so many times that trust does not come easily anymore.</p>
    <p style="color:#3A3530;font-size:17px;line-height:1.9;margin:0 0 18px;">But you proved something to her. When people who have never met her, who owe her nothing, choose to stand with her, it changes something in a person.</p>
    <p style="color:#C9A96E;font-size:22px;font-style:italic;line-height:1.5;margin:28px 0;padding-left:20px;border-left:2px solid #C9A96E;">"Tell them I am still standing. And now I know I am not standing alone."</p>
    <p style="color:#3A3530;font-size:17px;line-height:1.9;margin:0 0 20px;">If you have been considering a monthly gift, now is the time. Monthly supporters make consistent production possible.</p>
    <a href="${MONTHLY_URL}" style="display:inline-block;padding:13px 28px;background:#1A1410;color:#FAFAF7;border-radius:2px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">GIVE MONTHLY</a>
  </div>
  <div style="background:#1A1410;padding:24px 48px;text-align:center;">
    <p style="color:rgba(250,250,247,0.35);font-family:Arial,sans-serif;font-size:10px;margin:0;">StillHer Foundation. Restoring dignity. One story at a time.</p>
  </div>
</div></body></html>`
  });
}

// Run daily at 9am
cron.schedule('0 9 * * *', async () => {
  console.log('[sequence-worker] Running daily sequence check');
  const sequences = readSequences();
  const now = Date.now();

  for (const [email, donor] of Object.entries(sequences)) {
    const days = Math.floor((now - donor.donatedAt) / 86400000);
    try {
      if (days >= 3 && !donor.sent_d3) {
        await sendDay3(donor);
        sequences[email].sent_d3 = true;
        console.log(`[sequence-worker] Day 3 email sent to ${email}`);
      }
      if (days >= 14 && !donor.sent_d14) {
        await sendDay14(donor);
        sequences[email].sent_d14 = true;
        console.log(`[sequence-worker] Day 14 email sent to ${email}`);
      }
    } catch (e) {
      console.error(`[sequence-worker] Email failed for ${email}:`, e.message);
    }
  }
  writeSequences(sequences);
});

console.log('[sequence-worker] Running. Daily emails scheduled at 9am.');
