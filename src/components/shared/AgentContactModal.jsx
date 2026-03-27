import React from 'react';
import { X, Mail, Phone, Building2, User } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function AgentContactModal({ profile, email, onClose }) {
  if (!profile && !email) return null;

  const name     = profile?.full_name || email || 'Agent';
  const username = profile?.username;
  const phone    = profile?.phone;
  const company  = profile?.brokerage_name;
  const contactEmail = profile?.contact_email || email;
  const photo    = profile?.profile_photo_url;
  const initial  = name[0]?.toUpperCase();

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}
    >
      <div
        style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'360px', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.4)' }}>Agent Profile</span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>

        <div style={{ padding:'20px 18px' }}>
          {/* Avatar + name */}
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'22px', fontWeight:700 }}>
              {photo ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initial}
            </div>
            <div>
              <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:500, color:'white', margin:0 }}>{name}</p>
              {username && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', margin:0 }}>@{username}</p>}
            </div>
          </div>

          {/* Contact rows */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {company && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'9px' }}>
                <Building2 style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)', flexShrink:0 }}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.75)' }}>{company}</span>
              </div>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:`${ACCENT}08`, border:`1px solid ${ACCENT}20`, borderRadius:'9px', textDecoration:'none', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background=`${ACCENT}15`; e.currentTarget.style.borderColor=`${ACCENT}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background=`${ACCENT}08`; e.currentTarget.style.borderColor=`${ACCENT}20`; }}>
                <Mail style={{ width:'14px', height:'14px', color:ACCENT, flexShrink:0 }}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:ACCENT }}>{contactEmail}</span>
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:`${ACCENT}08`, border:`1px solid ${ACCENT}20`, borderRadius:'9px', textDecoration:'none', transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background=`${ACCENT}15`; e.currentTarget.style.borderColor=`${ACCENT}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background=`${ACCENT}08`; e.currentTarget.style.borderColor=`${ACCENT}20`; }}>
                <Phone style={{ width:'14px', height:'14px', color:ACCENT, flexShrink:0 }}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:ACCENT }}>{phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}