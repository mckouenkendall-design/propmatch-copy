import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Stripe price IDs from environment variables
const STRIPE_PRICE_IDS = {
  individual_monthly: Deno.env.get('STRIPE_PRICE_INDIVIDUAL_MONTHLY'),
  individual_annual: Deno.env.get('STRIPE_PRICE_INDIVIDUAL_ANNUAL'),
  brokerage_monthly: Deno.env.get('STRIPE_PRICE_BROKERAGE_MONTHLY'),
  brokerage_annual: Deno.env.get('STRIPE_PRICE_BROKERAGE_ANNUAL'),
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, billing = 'monthly', agentCount = 2 } = await req.json();

    // Validate inputs
    if (!['free', 'individual', 'brokerage'].includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return Response.json({ error: 'Invalid billing period' }, { status: 400 });
    }

    // Free plan — no checkout needed
    if (plan === 'free') {
      return Response.json({ checkoutUrl: null, plan: 'free' });
    }

    // Prepare line items for Stripe Checkout
    const lineItems = [];

    if (plan === 'individual') {
      const priceId = billing === 'annual' ? STRIPE_PRICE_IDS.individual_annual : STRIPE_PRICE_IDS.individual_monthly;
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    } else if (plan === 'brokerage') {
      const priceId = billing === 'annual' ? STRIPE_PRICE_IDS.brokerage_annual : STRIPE_PRICE_IDS.brokerage_monthly;
      lineItems.push({
        price: priceId,
        quantity: agentCount,
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': lineItems[0].price,
        'line_items[0][quantity]': String(lineItems[0].quantity),
        'mode': 'subscription',
        'success_url': `${req.headers.get('origin')}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${req.headers.get('origin')}/Onboarding`,
        'customer_email': user.email,
        'metadata[plan]': plan,
        'metadata[user_id]': user.id,
        'metadata[agent_count]': String(agentCount),
      }).toString(),
    }).then(r => r.json());

    if (checkoutSession.error) {
      return Response.json({ error: checkoutSession.error.message }, { status: 400 });
    }

    return Response.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      plan,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});