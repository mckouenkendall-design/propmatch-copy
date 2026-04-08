import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xkbelavlpydxsarzvpkl.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email;
        const plan = session.metadata?.plan || 'individual';
        if (email) {
          await supabase.from('profiles').update({
            selected_plan: plan,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          }).eq('user_email', email);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const status = sub.status;
        if (sub.metadata?.user_email) {
          await supabase.from('profiles').update({
            subscription_status: status,
          }).eq('user_email', sub.metadata.user_email);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (sub.metadata?.user_email) {
          await supabase.from('profiles').update({
            selected_plan: 'free',
            subscription_status: 'canceled',
          }).eq('user_email', sub.metadata.user_email);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for:', invoice.customer_email);
        break;
      }
      case 'invoice.upcoming': {
        const invoice = event.data.object;
        console.log('Upcoming invoice for:', invoice.customer_email);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
  }

  return res.status(200).json({ received: true });
}
