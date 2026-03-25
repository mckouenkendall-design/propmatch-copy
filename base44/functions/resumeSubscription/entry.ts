import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

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

    const bankedDays = agentProfile.banked_days || 0;
    const subscriptionId = agentProfile.stripe_subscription_id;

    if (subscriptionId) {
      if (bankedDays > 0) {
        const newAnchorUnix = Math.floor(Date.now() / 1000) + (bankedDays * 86400);

        const resumeResult = await stripePatch(`/subscriptions/${subscriptionId}`, {
          'pause_collection': '',
          'billing_cycle_anchor': String(newAnchorUnix),
          'proration_behavior': 'none',
        });

        if (resumeResult.error) {
          console.error('Stripe resume error:', resumeResult.error);
        } else {
          console.log(`Resumed subscription ${subscriptionId} with ${bankedDays} banked days`);
        }
      } else {
        const resumeResult = await stripePatch(`/subscriptions/${subscriptionId}`, {
          'pause_collection': '',
        });
        if (resumeResult.error) {
          console.error('Stripe unpause error:', resumeResult.error);
        }
      }
    }

    const restorePlan = bankedDays > 0 ? 'individual' : 'free';
    const restoreStatus = bankedDays > 0 ? 'active' : 'expired';

    await base44.asServiceRole.entities.UserProfile.update(agentProfile.id, {
      selected_plan: restorePlan,
      subscription_status: restoreStatus,
      banked_days: 0,
      individual_plan_paused_date: '',
    });

    return Response.json({ ok: true, restored_plan: restorePlan, banked_days_used: bankedDays });

  } catch (error) {
    console.error('resumeSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});