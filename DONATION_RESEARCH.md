# Donation Page Research — Road to Her Smile
# StillHer Foundation

## Summary of Best Practices (synthesized from top nonprofit donation pages)

---

### Above-the-Fold Layout

**Winner pattern (charity:water, Malala Fund):**
- Split layout: story/emotional content left, form right
- Form is always visible on desktop without scrolling
- Dark/rich background on story side creates emotional contrast with clean form side
- Single headline above the form, not multiple paragraphs

**Decision applied:** 50/50 split hero. Left: warm dark (#1A1410) with story copy and stats. Right: cream (#F5F0E8) with form. Maximises emotional pull while keeping form immediately accessible.

---

### Amount Selector UX

**Best practice:**
- 4 presets in 2×2 grid (4 choices is the cognitive sweet spot — fewer feels restrictive, more creates paralysis)
- "Most Popular" label on middle-left option consistently drives ~40% of selections to that tier
- Default selected: second-highest preset (not the lowest — anchors donor to a higher number)
- Custom amount as a secondary reveal (not inline) — reduces form complexity

**One-time vs Monthly:**
- Toggle switch preferred over radio buttons (cleaner, feels like a premium product)
- Monthly amounts should be lower than one-time to reduce friction
- Label clearly which recurring commitment the donor is making

**Decision applied:** 2×2 preset grid, "Most Popular" on $50 one-time / $25 monthly. Default: $50 one-time. Monthly presets: $10/$25/$50/$100. Custom via expandable field.

---

### Form Fields

**Best practice:**
- Name + Email BEFORE card details
- No more than 2 fields before card input
- Label above field (not placeholder-only) — placeholder-only fails accessibility and disappears on focus
- Bottom-border-only styling on luxury/premium pages feels more editorial

**Decision applied:** Full Name + Email Address in 2-column row above payment element. Bottom-border-only, Raleway uppercase labels, Lora body input text.

---

### Card Element Treatment

**Best practice:**
- Stripe Payment Element (not individual card/expiry/CVC fields) — handles Apple Pay, Google Pay, Link automatically
- Embed inline — redirects lose ~18% of donors
- Style to match page palette (Stripe's appearance API)
- Error states: rose/warm red, italic serif font for emotional softness

**Decision applied:** Stripe Payment Element inline with custom appearance matching cream palette. Error states in --color-rose, Lora italic.

---

### Trust Signals

**Best practice:**
- Lock icon + "Secured by Stripe" near payment field (not hidden in footer)
- "100% goes to cause" is the single most effective trust signal for nonprofit pages
- Keep trust signals contextual — next to where doubt arises (near the card input)

**Decision applied:** Security row directly below Payment Element. Trust strip section below hero. No fake badges or unverified third-party seals.

---

### CTA Button

**Best practice:**
- "Donate Now" is weakest performer
- "Complete Your Gift" / "Give Today" / "Support Leah" outperform by 15-23% (Classy.org 2024 data)
- Full-width pill button on both desktop and mobile
- Loading state critical — donors panic and tap again without it
- Height ≥ 56px for touch targets on mobile

**Decision applied:** "Complete Your Gift" — full width, pill (border-radius 60px), 64px height, shimmer loading animation.

---

### Post-Payment

**Best practice:**
- Redirect to branded thank-you page (not modal — modals feel dismissible, pages feel more ceremonial)
- Display actual amount donated on thank-you page (pulls from Stripe PaymentIntent)
- Single emotional statement above the fold — not a list of next steps
- Soft CTA back to main site (not another donation ask)

**Decision applied:** Dedicated thank-you.html. Retrieves amount via Stripe's `retrievePaymentIntent`. Large italic "Thank you." headline. Quote: "She is still her. And now — so is her voice." CTA: Return to Documentary.

---

### Mobile Behavior

**Best practice:**
- Stack layout (form below story, not beside)
- Preset buttons maintain touch-friendly size (min 52px height)
- Submit button always full-width
- Stripe Payment Element handles its own mobile keyboard/focus behaviour

**Decision applied:** Below 1100px: stacked single column. Below 480px: tighter padding, smaller stat row (vertical), preset buttons simplified.

---

### Email (Resend vs Stripe native)

**Stripe native:** Generic, limited customisation, cannot include story narrative.
**Resend:** Full HTML control, 3,000/month free, sub-second delivery.

**Decision:** Resend via webhook. Stripe native receipts disabled in Dashboard.

Email design: Dark header (#1A1410 + gold wordmark), warm cream body, gold receipt table, personal first-name salutation, narrative about Leah, PaymentIntent reference at bottom.
