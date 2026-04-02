import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Check, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

export default function StartConversationModal({ currentUser, profiles, onClose, onCreated }) {
  const { user } = useAuth();
  const [query, setQuery]             = useState('');
  const [selected, setSelected]       = useState([]); // array of profile objects
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [sendSeparately, setSendSeparately] = useState(false);

  const myEmail = currentUser?.email || user?.email;

  // Search by full name, username, email, or brokerage
  const filtered = useMemo(() =>
    profiles.filter(p =>
      p.user_email !== myEmail &&
      (
        (p.full_name    || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.username     || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.user_email   || '').toLowerCase().includes(query.toLowerCase()) ||
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
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();

      // Single recipient or send separately → individual DMs
      if (selected.length === 1 || sendSeparately) {
        let lastConvoId = null;
        for (const profile of selected) {
          const email = profile.user_email;
          const [ex1, ex2] = await Promise.all([
            base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: email }),
            base44.entities.Conversation.filter({ participant_1: email, participant_2: myEmail }),
          ]);
          const existing = [...ex1, ...ex2];
          if (existing.length > 0) {
            lastConvoId = existing[0].id;
          } else {
            const convo = await base44.entities.Conversation.create({
              participant_1: myEmail, participant_2: email,
              last_message: '', last_message_time: now,
              unread_by_1: 0, unread_by_2: 0,
            });
            lastConvoId = convo.id;
          }
        }
        onCreated(lastConvoId, 'dm');
        return;
      }

      // Multiple → create or find group chat
      const participantEmails = [myEmail, ...selected.map(p => p.user_email)];
      const sortedEmails = [...participantEmails].sort().join(',');

      const allGroupConvos = await base44.entities.GroupConversation.list('-last_message_time', 200);
      const existingGroup = allGroupConvos.find(gc => {
        try {
          return JSON.parse(gc.participant_emails || '[]').sort().join(',') === sortedEmails;
        } catch { return false; }
      });

      if (existingGroup) {
        onCreated(existingGroup.id, 'group');
        return;
      }

      const myName = profiles.find(p => p.user_email === myEmail)?.full_name || myEmail?.split('@')[0] || 'Me';
      const groupName = [...selected.map(p => p.full_name || p.user_email.split('@')[0]), myName].join(', ');

      const gc = await base44.entities.GroupConversation.create({
        name: groupName,
        participant_emails: JSON.stringify(participantEmails),
        created_by: myEmail,
        last_message: '', last_message_time: now,
        last_message_sender: '',
        unread_counts: '{}',
      });
      onCreated(gc.id, 'group');
    } catch (e) {
      console.error(e);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = () => {
    if (loading) return 'Opening...';
    if (selected.length === 0) return 'Select an agent';
    if (selected.length === 1) return `Message ${selected[0].full_name || selected[0].user_email}`;
    if (sendSeparately) return `Send Separately (${selected.length})`;
    return `Create Group Chat (${selected.length + 1})`;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'460px', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:400, color:'white', margin:0 }}>New Conversation</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>

        <div style={{ padding:'16px 20px' }}>
          {/* Selected chips */}
          {selected.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px' }}>
              {selected.map(p => (
                <span key={p.user_email} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', background:`${LAVENDER}15`, border:`1px solid ${LAVENDER}35`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:LAVENDER }}>
                  {p.full_name || p.user_email.split('@')[0]}
                  <button onClick={() => toggle(p)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                    <X style={{ width:'10px', height:'10px', color:LAVENDER }}/>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{ position:'relative', marginBottom:'10px' }}>
            <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)' }}/>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, @username, or brokerage..."
              autoFocus
              style={{ width:'100%', padding:'10px 10px 10px 32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
          </div>

          {/* Results */}
          <div style={{ maxHeight:'260px', overflowY:'auto', marginBottom:'12px' }}>
            {filtered.length === 0 ? (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'24px 0', margin:0 }}>
                {query ? 'No agents found' : 'Start typing to search agents'}
              </p>
            ) : filtered.map(profile => {
              const isSel = isSelected(profile);
              return (
                <div key={profile.user_email} onClick={() => toggle(profile)}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'9px', cursor:'pointer', background:isSel?`${LAVENDER}12`:'transparent', border:isSel?`1px solid ${LAVENDER}35`:'1px solid transparent', marginBottom:'4px', transition:'all 0.15s' }}
                  onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if(!isSel) e.currentTarget.style.background=isSel?`${LAVENDER}12`:'transparent'; }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'15px', fontWeight:700 }}>
                    {profile.profile_photo_url
                      ? <img src={profile.profile_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : (profile.full_name || profile.user_email || '?')[0].toUpperCase()}
                  </div>
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
                  {isSel && (
                    <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:LAVENDER, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Check style={{ width:'12px', height:'12px', color:'white' }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Send separately toggle — only for 2+ selected */}
          {selected.length > 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px', padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
              <button onClick={() => setSendSeparately(!sendSeparately)}
                style={{ width:'36px', height:'20px', borderRadius:'10px', background:sendSeparately?ACCENT:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left:sendSeparately?'18px':'2px', transition:'left 0.2s' }}/>
              </button>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.55)' }}>
                {sendSeparately
                  ? 'Send Separately — individual DM to each person'
                  : 'Create Group Chat — one thread with everyone'}
              </span>
            </div>
          )}

          {error && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'#f87171', margin:'0 0 12px' }}>{error}</p>}

          <button onClick={handleStart} disabled={selected.length === 0 || loading}
            style={{ width:'100%', padding:'11px', background:selected.length>0?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:selected.length>0?'#111827':'rgba(255,255,255,0.3)', cursor:selected.length>0?'pointer':'not-allowed', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {selected.length > 1 && !sendSeparately && <Users style={{ width:'15px', height:'15px' }}/>}
            {buttonLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}