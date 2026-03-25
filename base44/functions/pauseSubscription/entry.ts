import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

async function stripePatch(path, body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'POST only' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);

    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agent_user_email } = await req.json();
    if (!agent_user_email) {
      return Response.json({ error: 'agent_user_email is required' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.list();
    const agentProfile = profiles.find(p => p.user_email === agent_user_email);

    if (!agentProfile) {
      return Response.json({ error: 'Agent UserProfile not found' }, { status: 404 });
    }

    const subscriptionId = agentProfile.stripe_subscription_id;
    let bankedDays = agentProfile.banked_days || 0;

    if (subscriptionId) {
      const subscription = await stripeGet(`/subscriptions/${subscriptionId}`);

      if (subscription.current_period_end && subscription.status === 'active') {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const secondsRemaining = subscription.current_period_end - nowSeconds;
        bankedDays = Math.max(0, Math.floor(secondsRemaining / 86400));
        console.log(`Banking ${bankedDays} days for ${agent_user_email}`);

        const pauseResult = await stripePatch(`/subscriptions/${subscriptionId}`, {
          'pause_collection[behavior]': 'void',
        });

        if (pauseResult.error) {
          console.error('Stripe pause error:', pauseResult.error);
        }
      }
    }

    await base44.asServiceRole.entities.UserProfile.update(agentProfile.id, {
      selected_plan: 'broker_sponsored',
      subscription_status: 'paused',
      banked_days: bankedDays,
      individual_plan_paused_date: new Date().toISOString(),
    });

    return Response.json({ ok: true, banked_days: bankedDays });

  } catch (error) {
    console.error('pauseSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});