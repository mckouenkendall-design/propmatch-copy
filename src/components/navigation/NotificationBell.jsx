import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, Sparkles, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ACCENT = '#00DBC5';

const TYPE_COLORS = {
  match:          ACCENT,
  group_post:     '#818cf8',
  message:        '#34d399',
  subscription:   '#f59e0b',
  announcement:   '#fb7185',
  event:          '#60a5fa',
  broker_removed: '#ef4444',
  strong_match:   ACCENT,
};

const TYPE_ICONS = {
  match:          '🎯',
  group_post:     '🐟',
  message:        '💬',
  subscription:   '⭐',
  announcement:   '📣',
  event:          '📅',
  broker_removed: '🚫',
  strong_match:   '🎯',
};

const CRITICAL_TYPES = ['broker_removed', 'subscription_expired', 'strong_match'];

function CriticalPopup({ notification, onDismiss, onAction }) {
  const isBrokerRemoved = notification.type === 'broker_removed';
  const isStrongMatch   = notification.type === 'strong_match';
  const accentColor     = isBrokerRemoved ? '#ef4444' : isStrongMatch ? ACCENT : '#f59e0b';
  const PopupIcon       = isBrokerRemoved ? AlertTriangle : isStrongMatch ? Sparkles : CreditCard;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0E1318', border: `1px solid ${accentColor}40`, borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '32px', boxShadow: `0 0 60px ${accentColor}20` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PopupIcon style={{ width: '28px', height: '28px', color: accentColor }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>{notification.title}</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{notification.body}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button onClick={onDismiss} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              Dismiss
            </button>
            {notification.link && (
              <button onClick={() => { onDismiss(); onAction(notification.link); }}
                style={{ flex: 1, padding: '11px', background: accentColor, border: 'none', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: isBrokerRemoved ? 'white' : '#111827', cursor: 'pointer' }}>
                {isBrokerRemoved ? 'View Plans' : isStrongMatch ? 'View Match' : 'Manage Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen]                 = useState(false);
  const [dismissedPopups, setDismissed] = useState(new Set());
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const criticalNotification = notifications.find(
    n => !n.read && CRITICAL_TYPES.includes(n.type) && !dismissedPopups.has(n.id)
  );

  const dismissPopup = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    markReadMutation.mutate(id);
  };

  const sorted = [...notifications]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 30);

  return (
    <>
      {criticalNotification && (
        <CriticalPopup
          notification={criticalNotification}
          onDismiss={() => dismissPopup(criticalNotification.id)}
          onAction={(link) => navigate(link)}
        />
      )}

      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: '36px', height: '36px', borderRadius: '8px', background: open ? 'rgba(0,219,197,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${open ? 'rgba(0,219,197,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,219,197,0.12)'; e.currentTarget.style.borderColor = 'rgba(0,219,197,0.3)'; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}>
          <Bell style={{ width: '16px', height: '16px', color: open ? ACCENT : 'rgba(255,255,255,0.7)' }} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', minWidth: '16px', height: '16px', borderRadius: '8px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", border: '2px solid #0E1318', padding: '0 3px' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div style={{ position: 'absolute', top: '44px', right: 0, width: '360px', maxHeight: '480px', background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white' }}>
                Notifications {unreadCount > 0 && <span style={{ color: ACCENT }}>({unreadCount})</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {unreadCount > 0 && (
                  <button onClick={() => markAllReadMutation.mutate()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, padding: 0 }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                  <X style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                </button>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {sorted.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <Bell style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No notifications yet</p>
                </div>
              ) : sorted.map(n => (
                <div key={n.id}
                  onClick={() => {
                    if (!n.read) markReadMutation.mutate(n.id);
                    if (n.link) { setOpen(false); navigate(n.link); }
                  }}
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: n.link ? 'pointer' : 'default', background: n.read ? 'transparent' : 'rgba(0,219,197,0.04)', transition: 'background 0.15s', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(0,219,197,0.04)'}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${TYPE_COLORS[n.type] || ACCENT}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: n.read ? 400 : 600, color: n.read ? 'rgba(255,255,255,0.7)' : 'white', margin: 0, lineHeight: '1.4' }}>
                        {n.title}
                      </p>
                      {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: '4px' }} />}
                    </div>
                    {n.body && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: '3px 0 0', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {n.body}
                      </p>
                    )}
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '4px 0 0' }}>
                      {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}