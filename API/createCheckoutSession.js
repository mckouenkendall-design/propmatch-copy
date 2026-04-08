import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  individual_monthly: process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY,
  individual_annual: process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL,
  brokerage_monthly: process.env.STRIPE_PRICE_BROKERAGE_MONTHLY,
  brokerage_annual: process.env.STRIPE_PRICE_BROKERAGE_ANNUAL,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { plan, billing = 'monthly', agentCount = 2, email } = req.body;

    if (!['individual', 'brokerage'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const priceKey = `${plan}_${billing}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      return res.status(400).json({ error: `No price configured for ${priceKey}` });
    }

    const origin = req.headers.origin || 'https://propmatch-copy.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: plan === 'brokerage' ? agentCount : 1,
      }],
      mode: 'subscription',
      success_url: `${origin}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/Onboarding`,
      customer_email: email,
      metadata: {
        plan,
        agent_count: String(agentCount),
      },
    });

    return res.status(200).json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
}
