import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const post = payload.data;

    if (!post || !post.group_id) {
      return Response.json({ ok: true });
    }

    // Get group members
    const members = await base44.asServiceRole.entities.GroupMember.filter({
      group_id: post.group_id,
      status: 'active',
    });

    // Get group info
    const groups = await base44.asServiceRole.entities.Group.filter({ id: post.group_id });
    const group = groups[0];
    const groupName = group?.name || 'a Fish Tank';

    // Notify all members except the author
    const authorEmail = post.author_email;
    const notifyList = members.filter(m => m.user_email !== authorEmail);

    await Promise.all(notifyList.map(member =>
      base44.asServiceRole.entities.Notification.create({
        user_email: member.user_email,
        type: 'group_post',
        title: `New post in ${groupName}`,
        body: post.author_name
          ? `${post.author_name} posted: "${(post.content || '').substring(0, 80)}"`
          : `New post: "${(post.content || '').substring(0, 80)}"`,
        link: `/GroupDetail?groupId=${post.group_id}`,
        read: false,
        related_id: post.id || '',
      })
    ));

    return Response.json({ ok: true, notified: notifyList.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});