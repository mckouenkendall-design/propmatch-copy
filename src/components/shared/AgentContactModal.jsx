import React from 'react';
import { X, Mail, Phone, MessageCircle, Building2 } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function AgentContactModal({ agent, onClose, onMessage }) {
  if (!agent) return null;

  const name    = agent.full_name || agent.contact_agent_name || agent.name || 'Agent';
  const email   = agent.contact_email || agent.contact_agent_email || agent.user_email || agent.email;
  const phone   = agent.phone || agent.contact_agent_phone;
  const company = agent.brokerage_name || agent.company_name;
  const photo   = agent.profile_photo_url;
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '400px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>
              Agent Contact
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px', cursor: 'pointer', display: 'flex' }}
          >
            <X style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Agent Info */}
        <div style={{ padding: '24px 20px' }}>
          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '22px', fontWeight: 700 }}>
              {photo
                ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial}
            </div>
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 500, color: 'white', margin: 0 }}>{name}</p>
              {company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                  <Building2 style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.35)' }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{company}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {email && (
              <a
                href={`mailto:${email}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, borderRadius: '10px', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}15`; e.currentTarget.style.borderColor = `${ACCENT}45`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}08`; e.currentTarget.style.borderColor = `${ACCENT}25`; }}
              >
                <Mail style={{ width: '16px', height: '16px', color: ACCENT, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
              </a>
            )}

            {phone && (
              <a
                href={`tel:${phone}`}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, borderRadius: '10px', textDecoration: 'none', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}15`; e.currentTarget.style.borderColor = `${ACCENT}45`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}08`; e.currentTarget.style.borderColor = `${ACCENT}25`; }}
              >
                <Phone style={{ width: '16px', height: '16px', color: ACCENT, flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT }}>{phone}</span>
              </a>
            )}

            {onMessage && (
              <button
                onClick={onMessage}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: ACCENT, border: 'none', borderRadius: '10px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <MessageCircle style={{ width: '16px', height: '16px', color: '#111827' }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827' }}>Send Message</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}