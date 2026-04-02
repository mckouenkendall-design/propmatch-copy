import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, Sparkles, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { NOTIF_ICONS, NOTIF_COLORS, resolveNotificationLink } from '@/utils/notifications';

const ACCENT = '#00DBC5';
const CRITICAL_TYPES = ['broker_removed', 'subscription_expired', 'new_match'];

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Critical Modal Popup ─────────────────────────────────────────────────────
function CriticalPopup({ notification, onDismiss, navigate }) {
  const isBrokerRemoved = notification.type === 'broker_removed';
  const isExpired       = notification.type === 'subscription_expired';
  const isMatch         = notification.type === 'new_match';
  const accentColor     = isBrokerRemoved ? '#ef4444' : isMatch ? ACCENT : '#f59e0b';
  const PopupIcon       = isBrokerRemoved ? AlertTriangle : isMatch ? Sparkles : CreditCard;
  const link            = resolveNotificationLink(notification);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
      <div style={{ background:'#0E1318', border:`1px solid ${accentColor}40`, borderRadius:'20px', width:'100%', maxWidth:'420px', padding:'32px', boxShadow:`0 0 60px ${accentColor}20` }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'20px' }}>
          <div style={{ width:'68px', height:'68px', borderRadius:'50%', background:`${accentColor}15`, border:`1px solid ${accentColor}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <PopupIcon style={{ width:'30px', height:'30px', color:accentColor }}/>
          </div>
          <div>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'20px', fontWeight:600, color:'white', margin:'0 0 10px' }}>{notification.title}</h2>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.55)', margin:0, lineHeight:1.65 }}>{notification.message}</p>
          </div>
          <div style={{ display:'flex', gap:'12px', width:'100%' }}>
            <button onClick={onDismiss}
              style={{ flex:1, padding:'12px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>
              Dismiss
            </button>
            {link && (
              <button onClick={() => { onDismiss(); navigate(link); }}
                style={{ flex:1, padding:'12px', background:accentColor, border:'none', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:isBrokerRemoved||isExpired?'white':'#111827', cursor:'pointer' }}>
                {isBrokerRemoved ? 'View Plans' : isMatch ? 'View Match' : 'Manage Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────
function NotifRow({ n, onRead, onNavigate }) {
  const color = NOTIF_COLORS[n.type] || 'rgba(255,255,255,0.4)';
  const icon  = NOTIF_ICONS[n.type]  || '🔔';
  const link  = resolveNotificationLink(n);

  return (
    <div onClick={() => { if (!n.read) onRead(n.id); if (link) onNavigate(link); }}
      style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:link?'pointer':'default', background:n.read?'transparent':`${ACCENT}05`, transition:'background 0.15s', display:'flex', gap:'12px', alignItems:'flex-start' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
      onMouseLeave={e => e.currentTarget.style.background=n.read?'transparent':`${ACCENT}05`}>
      <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:`${color}18`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'15px' }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px', marginBottom:'2px' }}>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:n.read?400:600, color:n.read?'rgba(255,255,255,0.65)':'white', margin:0, lineHeight:1.4 }}>{n.title}</p>
          {!n.read && <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:ACCENT, flexShrink:0, marginTop:'4px' }}/>}
        </div>
        {n.message && (
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:'2px 0 0', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {n.message}
          </p>
        )}
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.22)', margin:'4px 0 0' }}>
          {timeAgo(n.created_date)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [open, setOpen]             = useState(false);
  const [dismissedPopups, setDismissed] = useState(new Set());
  const ref         = useRef(null);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn:  () => base44.entities.Notification.filter({ recipient_email: user?.email }),
    enabled:  !!user?.email,
    refetchInterval: 30000, // poll every 30s
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

  const deleteNotif = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] }),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Critical popup — show unread critical notifications one at a time
  const criticalNotif = notifications.find(
    n => !n.read && (n.critical || CRITICAL_TYPES.includes(n.type)) && !dismissedPopups.has(n.id)
  );

  const dismissPopup = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    markReadMutation.mutate(id);
  };

  const sorted = [...notifications]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 40);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Critical popup modal */}
      {criticalNotif && (
        <CriticalPopup
          notification={criticalNotif}
          onDismiss={() => dismissPopup(criticalNotif.id)}
          navigate={navigate}
        />
      )}

      <div ref={ref} style={{ position:'relative' }}>
        {/* Bell button */}
        <button onClick={() => setOpen(o => !o)}
          style={{ width:'36px', height:'36px', borderRadius:'8px', background:open?`${ACCENT}15`:'rgba(255,255,255,0.06)', border:`1px solid ${open?`${ACCENT}30`:'rgba(255,255,255,0.1)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background=`${ACCENT}12`; e.currentTarget.style.borderColor=`${ACCENT}28`; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; } }}>
          <Bell style={{ width:'16px', height:'16px', color:open?ACCENT:'rgba(255,255,255,0.7)' }}/>
          {unreadCount > 0 && (
            <span style={{ position:'absolute', top:'-5px', right:'-5px', minWidth:'17px', height:'17px', borderRadius:'9px', background:'#ef4444', color:'white', fontSize:'10px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif", border:'2px solid #0E1318', padding:'0 3px', lineHeight:1 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div style={{ position:'absolute', top:'44px', right:0, width:'360px', maxHeight:'500px', background:'#161d25', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', boxShadow:'0 24px 60px rgba(0,0,0,0.6)', overflow:'hidden', display:'flex', flexDirection:'column', zIndex:500 }}>
            {/* Header */}
            <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'white' }}>
                Notifications {unreadCount > 0 && <span style={{ color:ACCENT }}>({unreadCount})</span>}
              </span>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {unreadCount > 0 && (
                  <button onClick={() => markAllReadMutation.mutate()}
                    style={{ background:'transparent', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:ACCENT, padding:0, display:'flex', alignItems:'center', gap:'4px' }}>
                    <Check style={{ width:'11px', height:'11px' }}/> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', padding:'2px', display:'flex' }}>
                  <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)' }}/>
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY:'auto', flex:1 }}>
              {sorted.length === 0 ? (
                <div style={{ padding:'48px 16px', textAlign:'center' }}>
                  <Bell style={{ width:'36px', height:'36px', color:'rgba(255,255,255,0.15)', margin:'0 auto 12px', display:'block' }}/>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.35)', margin:'0 0 4px' }}>All caught up</p>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.2)', margin:0 }}>New matches and messages will appear here</p>
                </div>
              ) : sorted.map(n => (
                <NotifRow key={n.id} n={n}
                  onRead={(id) => markReadMutation.mutate(id)}
                  onNavigate={handleNavigate}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}