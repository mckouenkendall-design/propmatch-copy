import { supabase } from '@/api/supabaseClient';

// ─── Notification Helper — matches REAL PropMatch Copy schema ─────────────────
// Real fields: user_email, type, title, body, link, read, related_id
// Real type enum: "match", "message", "subscription", "announcement", "event", "group_post"

export async function createNotification(userEmail, type, title, body, options = {}) {
  if (!userEmail) return;
  try {
    await supabase.from('Notification').insert({
      user_email: userEmail,
      type,
      title,
      body: body || '',
      link: options.link || null,
      read: false,
      related_id: options.relatedId || null,
    });
  } catch (e) {
    console.warn('Notification create failed:', e);
  }
}

// Icon per type
export const NOTIF_ICONS = {
  match:        '🎯',
  message:      '💬',
  subscription: '💳',
  announcement: '📣',
  event:        '📅',
  group_post:   '🐟',
};

// Color per type
export const NOTIF_COLORS = {
  match:        '#00DBC5',
  message:      '#34d399',
  subscription: '#f59e0b',
  announcement: '#ef4444',
  event:        '#60a5fa',
  group_post:   '#818cf8',
};