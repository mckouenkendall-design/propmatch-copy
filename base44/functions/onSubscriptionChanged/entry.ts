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

    if (newPlan === oldPlan) {
      return Response.json({ ok: true });
    }

    let title = 'Subscription updated';
    let body = `Your plan has changed.`;

    if (newPlan && !oldPlan) {
      title = 'Welcome to PropMatch!';
      body = `You're now on the ${newPlan} plan. Enjoy your full access.`;
    } else if (!newPlan && oldPlan) {
      title = 'Subscription cancelled';
      body = 'Your subscription has been cancelled. You can resubscribe anytime.';
    } else if (newPlan && oldPlan) {
      title = 'Plan changed';
      body = `Your plan has been updated from ${oldPlan} to ${newPlan}.`;
    }

    await base44.asServiceRole.entities.Notification.create({
      user_email: profile.user_email,
      type: 'subscription',
      title,
      body,
      link: '/Settings',
      read: false,
      related_id: profile.id || '',
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});