import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

async function verifyWebhookSignature(payload, sigHeader, secret) {
  try {
    const parts = sigHeader.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const sigPart = parts.find(p => p.startsWith('v1='));
    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = sigPart.split('=')[1];
    const signedPayload = `${timestamp}.${payload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return expected === signature;
  } catch {
    return false;
  }
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get('stripe-signature') || '';

  if (STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET !== 'placeholder') {
    const valid = await verifyWebhookSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      console.error('Invalid Stripe webhook signature');
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    console.log('Stripe webhook event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const plan = session.metadata && session.metadata.plan;
      const customerEmail = session.customer_email;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (!customerEmail || !plan || plan === 'free') {
        return Response.json({ received: true });
      }

      const profiles = await base44.asServiceRole.entities.UserProfile.list();
      const profile = profiles.find(p => p.user_email === customerEmail);
      if (!profile) {
        console.error('No UserProfile found for email:', customerEmail);
        return Response.json({ received: true });
      }

      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        selected_plan: plan,
        subscription_status: 'active',
        stripe_subscription_id: subscriptionId || '',
        stripe_customer_id: String(customerId || ''),
      });

      console.log('Updated plan for', customerEmail, '→', plan);
    }

    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const customerId = String(invoice.customer || '');

      const profiles = await base44.asServiceRole.entities.UserProfile.list();
      const profile = profiles.find(p => p.stripe_customer_id === customerId);
      if (!profile) {
        return Response.json({ received: true });
      }

      if (profile.user_type === 'principal_broker') {
        const roster = await base44.asServiceRole.entities.BrokerageRoster.list();
        const agentEntries = roster.filter(r =>
          r.employing_broker_number === profile.employing_broker_id &&
          r.status === 'active' &&
          r.agent_email
        );

        for (const entry of agentEntries) {
          const agentProfile = profiles.find(p => p.user_email === entry.agent_email);
          if (agentProfile && agentProfile.subscription_status !== 'grace_period') {
            await base44.asServiceRole.entities.UserProfile.update(agentProfile.id, {
              subscription_status: 'grace_period',
            });
            await base44.asServiceRole.entities.Notification.create({
              user_email: agentProfile.user_email,
              type: 'subscription',
              title: "Your broker's plan has a payment issue",
              body: `Your broker's PropMatch plan has a payment problem. You have 7 days of full access. Activate your own plan in Settings to avoid interruption — your banked days will apply.`,
              link: '/Settings',
              read: false,
              related_id: profile.id || '',
            });
          }
        }
      } else {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          subscription_status: 'grace_period',
        });
        await base44.asServiceRole.entities.Notification.create({
          user_email: profile.user_email,
          type: 'subscription',
          title: 'Payment failed',
          body: 'We could not process your PropMatch payment. Please update your payment method in Settings to avoid losing access.',
          link: '/Settings',
          read: false,
          related_id: profile.id || '',
        });
      }
    }

    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = String(subscription.customer || '');

      const profiles = await base44.asServiceRole.entities.UserProfile.list();
      const profile = profiles.find(p => p.stripe_customer_id === customerId);
      if (!profile) {
        return Response.json({ received: true });
      }

      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        selected_plan: 'free',
        subscription_status: 'expired',
        stripe_subscription_id: '',
      });
    }

    else if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.billing_reason !== 'subscription_cycle') {
        return Response.json({ received: true });
      }

      const customerId = String(invoice.customer || '');
      const profiles = await base44.asServiceRole.entities.UserProfile.list();
      const profile = profiles.find(p => p.stripe_customer_id === customerId);
      if (!profile) {
        return Response.json({ received: true });
      }

      if (profile.subscription_status !== 'active') {
        await base44.asServiceRole.entities.UserProfile.update(profile.id, {
          subscription_status: 'active',
        });
      }
    }

  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  return Response.json({ received: true });
});