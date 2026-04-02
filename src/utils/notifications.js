// ─── Notification Helper ─────────────────────────────────────────────────────
// Call this from anywhere in the app to create a notification for a user.
// Usage: await createNotification(base44, recipientEmail, 'new_message', 'New Message', 'You have a new message from X', { linkType: 'inbox' })

export async function createNotification(base44Client, recipientEmail, type, title, message, options = {}) {
  if (!recipientEmail) return;
  try {
    await base44Client.entities.Notification.create({
      recipient_email: recipientEmail,
      sender_email:    options.senderEmail  || null,
      type,
      title,
      message,
      read:     false,
      critical: options.critical  || false,
      link_type: options.linkType || null,
      link_id:   options.linkId   || null,
      metadata:  options.metadata ? JSON.stringify(options.metadata) : null,
    });
  } catch (e) {
    console.warn('Notification create failed:', e);
  }
}

// Navigation helper — maps link_type to a route path
export function resolveNotificationLink(notification) {
  const { link_type, link_id } = notification;
  switch (link_type) {
    case 'matches':  return '/Matches';
    case 'inbox':    return link_id ? `/Messages` : '/Messages';
    case 'settings': return '/Settings';
    case 'pricing':  return '/Settings';
    case 'inventory': return '/Inventory';
    default:         return null;
  }
}

// Notification type → icon emoji
export const NOTIF_ICONS = {
  new_match:            '🎯',
  new_message:          '💬',
  match_followup:       '⏰',
  broker_removed:       '🚫',
  subscription_expired: '💳',
  subscription_expiring:'⭐',
  general:              '🔔',
};

// Notification type → accent color
export const NOTIF_COLORS = {
  new_match:            '#00DBC5',
  new_message:          '#34d399',
  match_followup:       '#00DBC5',
  broker_removed:       '#ef4444',
  subscription_expired: '#f59e0b',
  subscription_expiring:'#f59e0b',
  general:              'rgba(255,255,255,0.4)',
};