import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const profile = payload.data;
    const oldProfile = payload.old_data;

    if (!profile?.user_email) {
      return Response.json({ ok: true });
    }

    const newPlan = profile.selected_plan;
    const oldPlan = oldProfile?.selected_plan;

    // No plan change — nothing to do
    if (newPlan === oldPlan) {
      return Response.json({ ok: true });
    }

    let title = '';
    let body = '';

    // ── New signup / first plan ──────────────────────────────────────────
    if (newPlan && !oldPlan) {
      if (newPlan === 'broker_sponsored') {
        title = 'You\'ve been added to a brokerage plan';
        body = 'Your broker is now covering your PropMatch subscription. You have full access at no cost.';
      } else if (newPlan === 'free') {
        title = 'Welcome to PropMatch!';
        body = 'You\'re on the Free plan. Upgrade anytime in Settings to unlock full access.';
      } else {
        title = 'Welcome to PropMatch!';
        body = `You're now on the ${newPlan} plan. Enjoy your full access.`;
      }
    }

    // ── Cancellation (any paid plan → free) ──────────────────────────────
    else if (newPlan === 'free' && oldPlan && oldPlan !== 'free') {
      title = 'Subscription cancelled';
      body = 'Your PropMatch subscription has been cancelled. You still have access until the end of your billing period, then your account reverts to Free.';
    }

    // ── Agent added to broker plan ───────────────────────────────────────
    else if (newPlan === 'broker_sponsored' && oldPlan && oldPlan !== 'broker_sponsored') {
      title = 'Your broker has added you to their plan';
      body = 'Your individual subscription has been paused and your broker is now covering your PropMatch access. Your banked days are saved — if you ever leave their plan, those days resume automatically.';
    }

    // ── Agent removed from broker plan (broker_sponsored → individual/free) ──
    else if (oldPlan === 'broker_sponsored' && newPlan !== 'broker_sponsored') {
      if (newPlan === 'individual') {
        const bankedDays = profile.banked_days || 0;
        title = 'Removed from brokerage plan';
        body = bankedDays > 0
          ? `You've been removed from your brokerage's PropMatch plan. Your individual access has been restored with ${bankedDays} days remaining.`
          : 'You\'ve been removed from your brokerage\'s PropMatch plan. Activate your own plan in Settings to continue.';
      } else {
        title = 'Removed from brokerage plan';
        body = 'You\'ve been removed from your brokerage\'s PropMatch plan. Activate your own plan in Settings to continue.';
      }
    }

    // ── Plan upgrade/downgrade ───────────────────────────────────────────
    else if (newPlan && oldPlan) {
      title = 'Plan updated';
      body = `Your PropMatch plan has been updated to ${newPlan}.`;
    }

    // Only create notification if we have something meaningful to say
    if (title) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: profile.user_email,
        type: 'subscription',
        title,
        body,
        link: '/Settings',
        read: false,
        related_id: profile.id || '',
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});