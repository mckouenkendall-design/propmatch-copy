import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const announcement = payload.data;

    if (!announcement?.brokerage_id) {
      return Response.json({ ok: true });
    }

    // Get all roster members for this brokerage
    const rosterEntries = await base44.asServiceRole.entities.BrokerageRoster.filter({
      broker_email: announcement.brokerage_id,
      status: 'active',
    });

    const notifyList = rosterEntries.filter(e => e.agent_email && e.agent_email !== announcement.author_email);

    await Promise.all(notifyList.map(entry =>
      base44.asServiceRole.entities.Notification.create({
        user_email: entry.agent_email,
        type: 'announcement',
        title: `New announcement: ${announcement.title}`,
        body: (announcement.content || '').substring(0, 120),
        link: '/Teams',
        read: false,
        related_id: announcement.id || '',
      })
    ));

    return Response.json({ ok: true, notified: notifyList.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});