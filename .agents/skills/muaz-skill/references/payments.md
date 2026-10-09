# Payment Integration Guidance

This reference helps you integrate payments into your web app — typically e-commerce, SaaS, or any app that sells products or services. It assumes you are a frontend developer with little or no backend experience. It explains payment concepts in plain language and gives concrete recommendations.

---

## What payments are and why the integration matters

**Payment integration** is how your app accepts money from customers — credit cards, digital wallets, etc. It involves three parts:
1. **Checkout:** The customer enters payment info and confirms the purchase.
2. **Payment processing:** The payment provider (Stripe, PayPal) processes the payment — charges the card, handles fraud, communicates with the bank.
3. **Confirmation:** Your app is notified that the payment succeeded (via webhook or redirect) and takes action (creates an order, grants access, sends confirmation email).

**Why it matters:** If you sell anything (products, services, subscriptions), you need payments. Getting payments wrong means lost revenue, frustrated customers, or security/compliance problems. Getting payments right means smooth checkout, reliable order processing, and confidence that you're paid correctly.

**The basic payment flow (hosted checkout — recommended for most apps):**
1. Customer clicks "Checkout" on your app.
2. Your app creates a checkout session with the payment provider (Stripe Checkout, PayPal Checkout) — tells them what's being purchased, the amount, currency, etc.
3. The customer is redirected to the payment provider's hosted checkout page — they enter payment info there (not on your site).
4. The customer completes the payment on the provider's page.
5. The customer is redirected back to your app (success or cancel URL).
6. Your app receives a webhook from the provider confirming the payment — creates the order, grants access, sends confirmation.

---

## Payment provider options — choosing your provider

### Stripe — the default for most online businesses

**What it is:** A payment gateway with credit/debit card processing, digital wallets (Apple Pay, Google Pay, etc.), 100+ payment methods, 135+ currencies, hosted checkout (Stripe Checkout), payment links (no-code checkout), subscriptions (Stripe Billing), custom UI components (Stripe Elements), webhooks, fraud prevention (Radar), tax calculation, marketplaces/platforms (Stripe Connect).

**Why Stripe is the default:**
- **Best online pricing:** 2.9% + 30¢ per successful card charge (US). Lower than many competitors for online payments.
- **Best developer experience:** Excellent documentation, clean API, good SDKs, strong community. Integration is straightforward.
- **Best subscriptions:** Stripe Billing is the best-in-class for subscriptions — recurring payments, trials, coupons, usage-based pricing, metered billing, invoicing.
- **Broad coverage:** 100+ payment methods, 135+ currencies, international cards, localized payment methods per region. Good for international businesses.
- **Hosted checkout:** Stripe Checkout is the easiest way to accept payments — hosted page, minimal code, secure, PCI-DSS compliant (you don't handle card data).

**Pricing:** 2.9% + 30¢ per successful card charge (US). International cards: +1%. No monthly fees. Volume discounts available.

**Tradeoffs:** Higher per-transaction fee than some competitors for in-person (use Stripe Terminal for in-person). Can be expensive for very high-volume businesses (negotiate volume discounts). Vendor lock-in (you're tied to Stripe's API and features).

**When to use Stripe:** Almost every online business. SaaS (subscriptions via Stripe Billing), e-commerce, digital products, services, marketplaces (Stripe Connect). If you're selling online and don't have a specific reason to use another provider, use Stripe.

### PayPal — additional option for conversion lift and international reach

**What it is:** A payment gateway and digital wallet. Credit/debit card processing, PayPal wallet (430M+ accounts), PayPal Checkout (hosted), subscriptions (via Billing), webhooks, REST API, buyer/seller protection, widely recognized brand, Venmo integration (US).

**Why use PayPal:**
- **Conversion lift:** Many customers prefer PayPal — offering it as an option can increase conversion. Some customers won't buy without PayPal.
- **International reach:** PayPal is available in 200+ markets, supports 25+ currencies, widely recognized internationally. Good for international customers who prefer PayPal.
- **Buyer/seller protection:** PayPal offers protection for buyers and sellers — can increase confidence.

**Pricing:** 3.49% + 49¢ per transaction (standard). Higher than Stripe for online. In-person: 2.27% + 9¢ (Zettle). No monthly fees (standard).

**Tradeoffs:** Higher per-transaction fee than Stripe for online. Less developer-friendly than Stripe (API is okay, but Stripe's DX is better). Subscriptions via PayPal Billing are generally considered less feature-rich than Stripe Billing.

**When to use PayPal:** As an additional payment option alongside Stripe. If you want to offer PayPal for conversion lift, international customers, or buyer/seller protection. Rarely the only payment provider (Stripe is usually better as the primary).

### Lemon Squeezy / Paddle — merchant of record for global SaaS

**What they are:** Merchant of Record (MoR) payment providers. They handle sales tax/VAT/compliance globally — you don't collect or remit taxes. They process payments (cards, PayPal, etc.), handle subscriptions, issue invoices, and remit taxes to the appropriate authorities. Lemon Squeezy and Paddle are similar — both are MoRs for digital products/SaaS.

**Why use a MoR:**
- **Tax compliance handled:** If you sell digital products/SaaS globally, you may need to collect and remit sales tax/VAT in multiple jurisdictions. This is complex and time-consuming. A MoR handles it for you — they collect and remit taxes.
- **Simpler for solo/small teams:** If you're selling globally and don't want to deal with tax compliance in multiple countries, a MoR simplifies things significantly.

**Pricing:** Lemon Squeezy: 10% + 50¢ per transaction. Paddle: 5% + 50¢ per transaction. Higher per-transaction fee than Stripe, but includes tax compliance (which can save significant time/money for global SaaS).

**Tradeoffs:** Higher per-transaction fee than Stripe. Less flexible than Stripe (you're tied to their MoR model). Fewer features than Stripe in some areas. Vendor lock-in.

**When to use a MoR:** SaaS or digital products selling globally, especially for solo founders or small teams who don't want to deal with sales tax/VAT compliance in multiple jurisdictions. If tax compliance is a concern and you're okay with the higher per-transaction fee, a MoR simplifies things. If you're not selling globally or can handle tax compliance yourself, Stripe may be better (lower fees, more features).

### Square — for businesses with in-person presence

**What it is:** A payment gateway with online payments (cards, digital wallets), in-person payments (Square Terminal, readers), invoicing, subscriptions (basic), APIs for online and in-person, POS system, inventory management.

**Why use Square:** If you have both online and physical presence (retail, restaurant, service business), Square gives you an all-in-one solution. In-person payments via Square hardware.

**Pricing:** Online: 2.9% + 30¢ per transaction. In-person: 2.6% + 10¢ (swiped/dipped/tapped). No monthly fees (standard).

**Tradeoffs:** Online payment features are less robust than Stripe (subscriptions, etc. are basic). Best for businesses with in-person needs. Not the default for pure online businesses.

**When to use Square:** Businesses with both online and physical presence, or in-person sales. If you're purely online, Stripe is usually better.

---

## Checkout flow — how the customer pays

### Hosted checkout (recommended for most apps)

**What it is:** The customer is redirected to the payment provider's hosted checkout page to enter payment info. Your app creates a checkout session, the customer is redirected, they pay on the provider's page, they're redirected back to your app.

**Why hosted checkout is recommended:**
- **Simplest:** Minimal code — create a checkout session, redirect, handle the redirect back.
- **Most secure:** The customer enters payment info on the provider's page, not your site. You never see or handle raw card data. PCI-DSS compliance is much simpler (you're not handling card data).
- **Less liability:** The provider handles fraud, chargebacks, compliance. You're not responsible for securing card data.

**Stripe Checkout example:**
```typescript
// Create a checkout session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [{ price_data: { currency: "usd", product_data: { name: "My Product" }, unit_amount: 2000 }, quantity: 1 }],
  mode: "payment", // or "subscription" for subscriptions
  success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${url}/cancel`,
});
// Redirect to session.url
```

**PayPal Checkout example:**
```typescript
// Create a PayPal order
const order = await paypal.orders.create({
  intent: "CAPTURE",
  purchase_units: [{ amount: { currency_code: "USD", value: "20.00" } }],
});
// Redirect to order.links.find(link => link.rel === "approve").href
```

### Custom checkout (only when you need full control)

**What it is:** You build the checkout UI yourself (using Stripe Elements, PayPal Braintree, etc.) and the customer enters payment info on your site. You send the payment info directly to the provider.

**Why custom checkout is less recommended:**
- **More complex:** You build the UI, handle validation, manage the payment flow.
- **More PCI-DSS exposure:** You're handling payment info on your site (even if you don't store it, you're transmitting it). This increases your PCI-DSS scope.
- **More responsibility:** You handle the checkout UX, error states, loading states, etc.

**When custom checkout makes sense:** You need full control over the checkout UX (branded checkout, specific flow, etc.) and you're willing to handle the complexity and PCI-DSS exposure. For most apps, hosted checkout is simpler and more secure.

### Payment links (no-code checkout)

**What it is:** Stripe and PayPal offer payment links — a URL that opens a hosted checkout for a specific product/amount. No code needed to create the link (you create it in the dashboard or via API).

**When to use payment links:** Simple products, one-off purchases, invoicing, selling without building a full checkout flow. Good for simple use cases.

---

## Webhooks — how your app knows the payment succeeded

**What webhooks are:** Async notifications from the payment provider to your app. When a payment event happens (payment succeeded, payment failed, subscription created, subscription cancelled, refund issued, etc.), the provider sends an HTTP request (webhook) to your app's webhook endpoint with details about the event.

**Why payment apps need webhooks:**
- **Async confirmation:** The customer pays on the provider's hosted page and is redirected back to your app. But the redirect alone isn't reliable — the customer might close the browser before the redirect, the redirect might fail, the payment might be pending and not complete immediately. The webhook is the reliable way to know the payment actually succeeded.
- **Async events:** Many payment events happen outside the checkout flow — subscriptions renew, payments fail and retry, refunds are issued, disputes are opened. You need webhooks to handle these events.

**How to handle webhooks:**
1. **Create a webhook endpoint** in your app (e.g., `/api/webhooks/stripe`).
2. **Register the endpoint** with the payment provider (in the dashboard, provide the URL and select which events to receive).
3. **Handle incoming webhooks:**
   - **Verify the webhook signature** (the provider signs the webhook with a secret; verify the signature to ensure the webhook is actually from the provider, not a fake). This is critical — without signature verification, anyone can send fake webhooks to your endpoint.
   - **Check the event type** (payment succeeded, payment failed, subscription created, etc.) and handle accordingly.
   - **Be idempotent:** Handle the same webhook multiple times without double-charging or double-creating orders. Webhooks can be sent multiple times (retries). Use the event ID to check if you've already processed it.
   - **Return a 2xx response quickly** to acknowledge the webhook. If you return an error (5xx), the provider retries. Handle the event and return 200 ASAP.
4. **Handle failures:** If your webhook endpoint returns an error or times out, the provider retries. Make sure your webhook handler is robust — doesn't depend on external services that might be down, handles errors gracefully, and acknowledges the webhook even if some downstream action fails (log the failure, retry later if needed).

**Stripe webhook example:**
```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch { return new Response("Signature verification failed", { status: 400 }); }

  switch (event.type) {
    case "checkout.session.completed": {
      // Payment succeeded — create order, grant access, send confirmation
      await createOrder(event.data.object);
      break;
    }
    case "payment_intent.payment_failed": { /* handle failed payment */ break; }
  }
  return new Response("OK", { status: 200 });
}
```

**Key webhook best practices:**
- **Always verify the signature.** Without this, anyone can send fake webhooks.
- **Be idempotent.** Use the event ID to check if you've already processed it. Store processed event IDs in your database.
- **Handle the event and return 200 ASAP.** Don't do long-running work in the webhook handler — acknowledge the webhook, then do the work asynchronously if needed.
- **Handle failures gracefully.** If something fails (database down, etc.), return 200 (acknowledge) and log the failure to retry later. Returning an error causes the provider to retry, which is fine, but your handler should be robust.
- **Test webhooks locally.** Use the provider's CLI (Stripe CLI, etc.) to send test webhooks to your local server during development.

---

## What you can and can't store — payment data security

**What you can store:**
- **Customer ID:** The provider's customer identifier (e.g., Stripe customer ID). Links the customer to their payment info on the provider's side. You can use this to charge the customer again (recurring payments, subscriptions).
- **Payment intent ID / charge ID:** The identifier for a specific payment. Useful for looking up payment details, handling disputes, showing payment history.
- **Subscription ID:** For subscriptions, the subscription identifier. Used to manage the subscription (cancel, update, etc.).
- **Email, name, address:** Customer contact info — you can store this (it's not payment data). Useful for order history, shipping, communication.
- **Order/purchase data:** What was purchased, amount, currency, date, status — store this in your own database. This is your business data, not payment data.

**What you CANNOT store:**
- **Raw card numbers (PAN):** Never store full card numbers. This is a PCI-DSS violation and a major security risk.
- **Card verification codes (CVC/CVV):** Never store CVC. This is a PCI-DSS violation.
- **Full track data:** Never store the magnetic stripe data or chip data.
- **Expired card numbers (without the full card):** Even storing partial card data can be a concern — follow PCI-DSS guidelines.

**The rule:** Use the payment provider's tokens/IDs, not raw card data. When a customer pays, the provider gives you a token or customer ID — store that, not the card number. The provider handles the card data; you handle the token/ID.

**Practical guidance:** With hosted checkout (Stripe Checkout, PayPal Checkout), you never see card data — the customer enters it on the provider's page. You get a session ID or order ID. With custom checkout (Stripe Elements), the card data goes directly to Stripe (not through your server) and you get a token/payment method ID. Either way, you don't store card data — you store the provider's token/ID.

---

## Error handling — what can go wrong and how to handle it

**Payment errors you need to handle:**
- **Declined card:** Insufficient funds, expired card, wrong CVC, card blocked, etc. Show a clear error to the customer ("Your card was declined. Please try a different card or payment method.") and let them try again.
- **Expired card:** Card has expired. Ask the customer to update their payment method.
- **Insufficient funds:** Card doesn't have enough funds. Ask the customer to try a different card or payment method.
- **Authentication required (3DS):** Some cards require 3D Secure authentication (extra step). Handle the 3DS flow — the provider redirects to the bank for authentication, then back to your app.
- **Network errors:** Your server can't reach the payment provider (network issue, provider downtime). Retry with backoff, show a friendly error, let the customer try again.
- **Webhook failures:** Webhook endpoint returns an error or times out. The provider retries. Make sure your webhook handler is robust (see webhook best practices).
- **Redirect failures:** The customer doesn't complete the redirect back to your app (closes browser, loses connection). Rely on webhooks for confirmation, not just the redirect.
- **Duplicate payments:** Customer accidentally pays twice (clicked twice, network issue caused retry). Use idempotency to prevent duplicate charges.

**General error handling guidance:**
- **Show clear, friendly errors.** "Your card was declined" is clear. "Error 500" is not. Help the customer understand what went wrong and what to do next.
- **Let the customer retry.** If a payment fails, let them try again with the same or different payment method.
- **Log errors for debugging.** Log payment errors (without card data) so you can debug issues.
- **Handle async failures.** Subscription payments can fail (expired card, etc.) — handle webhook events for failed payments, notify the customer, retry or cancel the subscription.

---

## Refunds and voids

**Void:** Cancels an authorized payment before it's captured. The authorization is reversed, no money changes hands. Use void when you want to cancel a payment before it's completed (e.g., order cancelled before shipping).

**Refund:** Returns money to the customer after a payment has been captured. Use refund when you need to return money (order returned, service not delivered, customer dissatisfied).

**When to void vs. refund:**
- **Void:** Before the payment is captured (authorization only). Cancels the authorization.
- **Refund:** After the payment is captured. Returns the money.

**How to process (Stripe example):**
```typescript
// Void a payment intent (before capture)
await stripe.paymentIntents.cancel(paymentIntentId);

// Refund a charge (after capture)
await stripe.refunds.create({
  charge: chargeId,
  amount: 2000, // optional — partial refund (in cents). Omit for full refund.
});
```

**Best practices:**
- **Process refunds promptly.** If a customer is entitled to a refund, process it quickly.
- **Keep records.** Store refund data (refund ID, amount, date) in your database for order history and dispute handling.
- **Communicate with the customer.** Let them know the refund was processed and when to expect the money (refunds can take several days to appear on the customer's statement).

---

## PCI-DSS — what it means and how to reduce your exposure

**What PCI-DSS is:** The Payment Card Industry Data Security Standard — a set of security requirements for any business that handles card data. If you accept cards, you're subject to PCI-DSS (the level depends on your volume and how you handle cards).

**What it means for you:**
- If you use hosted checkout (Stripe Checkout, PayPal Checkout), your PCI-DSS exposure is minimal — the customer enters card data on the provider's page, not your site. You're eligible for the simplest PCI-DSS validation (SAQ A — a short self-assessment, no penetration testing required).
- If you use custom checkout with Stripe Elements (card data goes directly to Stripe, not through your server), your PCI-DSS exposure is still relatively low (SAQ A-EP — slightly more involved, but still manageable).
- If you store, process, or transmit card data on your own servers (you shouldn't), your PCI-DSS exposure is much higher (SAQ D or full PCI audit — penetration testing, extensive requirements).

**How to reduce PCI-DSS exposure:**
- **Use hosted checkout** (Stripe Checkout, PayPal Checkout) — the simplest and most secure. You never see card data.
- **Use client-side tokenization** (Stripe Elements, PayPal Braintree) — card data goes directly to the provider, you get a token. You don't handle card data on your server.
- **Never store card data.** Use the provider's tokens/IDs, not card numbers.
- **Use the provider's PCI-DSS compliance.** Stripe, PayPal, and other providers are PCI-DSS compliant — leverage their compliance by using their hosted/checkout/tokenization solutions.

**When you need a full PCI audit:** Only if you store, process, or transmit card data on your own systems (which you shouldn't). With hosted checkout or client-side tokenization, you avoid the full audit.

---

## Quick decision guide

| Question | Answer | Recommendation |
|---|---|---|
| Selling online (SaaS, e-commerce, digital products) | Yes | **Stripe** (primary) |
| Want simplest, most secure checkout? | Yes | **Hosted checkout** (Stripe Checkout, PayPal Checkout) |
| Need subscriptions? | Yes | **Stripe Billing** (best-in-class) |
| Selling globally and worried about tax compliance (sales tax/VAT)? | Yes | **Lemon Squeezy or Paddle** (MoR — tax compliance handled) |
| Want to offer PayPal for conversion lift? | Yes | **PayPal** alongside Stripe |
| Have in-person sales (retail, restaurant, service)? | Yes | **Square** (online + in-person) |
| Need marketplaces/platforms (connect buyers and sellers)? | Yes | **Stripe Connect** |
| Don't want to handle card data at all? | Yes | **Hosted checkout** — you never see card data |

---

## What's next

- **Database** — `references/database.md` for choosing and setting up your database (PostgreSQL + Prisma recommended).
- **Auth** — `references/auth.md` for adding authentication (Clerk recommended for most apps).
- **Backend structure** — `references/backend.md` for how to structure your backend and connect it to the frontend.
- **Deployment** — `references/deployment.md` for deploying your full-stack app (frontend + backend + database + secrets).
