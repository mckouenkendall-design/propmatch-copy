import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_email, type, title, body: msgBody, link, related_id } = body;

    if (!user_email || !type || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      type,
      title,
      body: msgBody || '',
      link: link || '',
      read: false,
      related_id: related_id || '',
    });

    return Response.json({ notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});