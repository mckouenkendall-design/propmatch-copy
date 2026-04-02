import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

function AgentRow({ profile, selected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const isSel = selected;

  return (
    <div
      onClick={() => onToggle(profile)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'9px', cursor:'pointer', background:isSel?`${LAVENDER}10`:'transparent', marginBottom:'2px', transition:'background 0.1s' }}
      onMouseEnterCapture={e => { if (!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
      onMouseLeaveCapture={e => { if (!isSel) e.currentTarget.style.background=isSel?`${LAVENDER}10`:'transparent'; }}>

      {/* Checkbox — visible on hover or when selected */}
      <div style={{
        width:'18px', height:'18px', borderRadius:'5px', flexShrink:0,
        border:`2px solid ${isSel ? LAVENDER : hovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
        background: isSel ? LAVENDER : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'all 0.15s',
      }}>
        {isSel && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 4.5 8.5 10 3.5"/>
          </svg>
        )}
      </div>

      {/* Avatar */}
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'14px', fontWeight:700 }}>
        {profile.profile_photo_url
          ? <img src={profile.profile_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : (profile.full_name || profile.user_email || '?')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {profile.full_name || profile.user_email}
          </p>
          {profile.username && (
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>@{profile.username}</span>
          )}
        </div>
        {profile.brokerage_name && (
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{profile.brokerage_name}</p>
        )}
      </div>
    </div>
  );
}

export default function StartConversationModal({ currentUser, profiles, onClose, onCreated }) {
  const { user } = useAuth();
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const myEmail = currentUser?.email || user?.email;

  const filtered = useMemo(() =>
    profiles.filter(p =>
      p.user_email !== myEmail && (
        (p.full_name      || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.username       || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.user_email     || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.brokerage_name || '').toLowerCase().includes(query.toLowerCase())
      )
    ).slice(0, 30),
    [profiles, query, myEmail]
  );

  const toggle = (profile) => {
    setSelected(prev =>
      prev.find(p => p.user_email === profile.user_email)
        ? prev.filter(p => p.user_email !== profile.user_email)
        : [...prev, profile]
    );
  };

  const isSelected = (profile) => !!selected.find(p => p.user_email === profile.user_email);

  const handleStart = async () => {
    if (selected.length === 0) return;
    setLoading(true); setError(null);
    try {
      const now = new Date().toISOString();

      if (selected.length === 1) {
        // Single — regular DM
        const email = selected[0].user_email;
        const [ex1, ex2] = await Promise.all([
          base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: email }),
          base44.entities.Conversation.filter({ participant_1: email, participant_2: myEmail }),
        ]);
        const existing = [...ex1, ...ex2];
        if (existing.length > 0) { onCreated(existing[0].id, 'dm'); return; }
        const convo = await base44.entities.Conversation.create({
          participant_1: myEmail, participant_2: email,
          last_message: '', last_message_time: now,
          unread_by_1: 0, unread_by_2: 0,
        });
        onCreated(convo.id, 'dm');
        return;
      }

      // Multiple — always create group chat
      const participantEmails = [myEmail, ...selected.map(p => p.user_email)];
      const sortedKey = [...participantEmails].sort().join(',');

      // Check if group already exists — filter by created_by first then check participants
      let existingGroup = null;
      try {
        const myGCs = await base44.entities.GroupConversation.filter({ created_by: myEmail });
        existingGroup = myGCs.find(gc => {
          try { return JSON.parse(gc.participant_emails || '[]').sort().join(',') === sortedKey; }
          catch { return false; }
        });
      } catch { /* no existing groups */ }

      if (existingGroup) { onCreated(existingGroup.id, 'group'); return; }

      const myName = profiles.find(p => p.user_email === myEmail)?.full_name || myEmail?.split('@')[0] || 'Me';
      const groupName = [...selected.map(p => p.full_name || p.user_email.split('@')[0]), myName].join(', ');

      const gc = await base44.entities.GroupConversation.create({
        name: groupName,
        participant_emails: JSON.stringify(participantEmails),
        created_by: myEmail,
        last_message: '', last_message_time: now,
        last_message_sender: '', unread_counts: '{}',
      });
      onCreated(gc.id, 'group');
    } catch (e) {
      console.error('StartConversationModal error:', e);
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const btnLabel = () => {
    if (loading) return 'Opening...';
    if (selected.length === 0) return 'Select an agent';
    if (selected.length === 1) return `Message ${selected[0].full_name || selected[0].user_email}`;
    return `Create Group Chat (${selected.length + 1} people)`;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'460px', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:400, color:'white', margin:'0 0 2px' }}>New Conversation</h3>
            {selected.length > 1 && (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:LAVENDER, margin:0 }}>
                {selected.length} selected — will create a group chat
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {/* Selected chips */}
          {selected.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
              {selected.map(p => (
                <span key={p.user_email} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px 3px 10px', background:`${LAVENDER}15`, border:`1px solid ${LAVENDER}35`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:LAVENDER }}>
                  {p.full_name || p.user_email.split('@')[0]}
                  <button onClick={() => toggle(p)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex', marginLeft:'2px' }}>
                    <X style={{ width:'10px', height:'10px', color:LAVENDER }}/>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search — always visible */}
          <div style={{ position:'relative', marginBottom:'10px' }}>
            <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)' }}/>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, @username, or brokerage..."
              autoFocus
              style={{ width:'100%', padding:'10px 10px 10px 32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
          </div>

          {/* Results */}
          <div style={{ maxHeight:'280px', overflowY:'auto', marginBottom:'12px' }}>
            {filtered.length === 0 ? (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'24px 0', margin:0 }}>
                {query ? 'No agents found' : 'Start typing to search agents'}
              </p>
            ) : filtered.map(profile => (
              <AgentRow
                key={profile.user_email}
                profile={profile}
                selected={isSelected(profile)}
                onToggle={toggle}
              />
            ))}
          </div>

          {error && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'#f87171', margin:'0 0 10px' }}>{error}</p>}

          <button onClick={handleStart} disabled={selected.length === 0 || loading}
            style={{ width:'100%', padding:'11px', background:selected.length>0?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:selected.length>0?'#111827':'rgba(255,255,255,0.3)', cursor:selected.length>0?'pointer':'not-allowed', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {selected.length > 1 && <Users style={{ width:'15px', height:'15px' }}/>}
            {btnLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}