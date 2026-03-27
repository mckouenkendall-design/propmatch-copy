import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, Check } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function StartConversationModal({ currentUser, profiles, onClose, onCreated }) {
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const filtered = useMemo(() =>
    profiles.filter(p =>
      p.user_email !== currentUser?.email &&
      (
        (p.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.user_email || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.brokerage_name || '').toLowerCase().includes(query.toLowerCase())
      )
    ),
    [profiles, query, currentUser?.email]
  );

  const handleStart = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const existing1 = await base44.entities.Conversation.filter({ participant_1: currentUser?.email, participant_2: selected.user_email });
      const existing2 = await base44.entities.Conversation.filter({ participant_1: selected.user_email, participant_2: currentUser?.email });
      const existing  = [...existing1, ...existing2];
      if (existing.length > 0) { onCreated(existing[0].id); return; }
      const convo = await base44.entities.Conversation.create({
        participant_1: currentUser?.email,
        participant_2: selected.user_email,
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_by_1: 0,
        unread_by_2: 0,
      });
      onCreated(convo.id);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'440px', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:400, color:'white', margin:0 }}>New Conversation</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>
        <div style={{ padding:'16px 20px' }}>
          <div style={{ position:'relative', marginBottom:'14px' }}>
            <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)' }}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search agents by name or brokerage..." autoFocus
              style={{ width:'100%', padding:'10px 10px 10px 32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
          </div>
          <div style={{ maxHeight:'280px', overflowY:'auto', marginBottom:'14px' }}>
            {filtered.length === 0 ? (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'24px 0', margin:0 }}>
                {query ? 'No agents found' : 'Start typing to search agents'}
              </p>
            ) : filtered.map(profile => {
              const isSel = selected?.user_email === profile.user_email;
              return (
                <div key={profile.user_email} onClick={() => setSelected(isSel ? null : profile)}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'9px', cursor:'pointer', background:isSel?`${ACCENT}12`:'transparent', border:isSel?`1px solid ${ACCENT}35`:'1px solid transparent', marginBottom:'4px', transition:'all 0.15s' }}
                  onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if(!isSel) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'15px', fontWeight:700 }}>
                    {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (profile.full_name||profile.user_email||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.full_name||profile.user_email}</p>
                    {profile.brokerage_name && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{profile.brokerage_name}</p>}
                  </div>
                  {isSel && <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Check style={{width:'12px',height:'12px',color:'#111827'}}/></div>}
                </div>
              );
            })}
          </div>
          {error && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'#f87171', margin:'0 0 12px' }}>{error}</p>}
          <button onClick={handleStart} disabled={!selected || loading}
            style={{ width:'100%', padding:'11px', background:selected?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:selected?'#111827':'rgba(255,255,255,0.3)', cursor:selected?'pointer':'not-allowed', transition:'all 0.15s' }}>
            {loading ? 'Opening...' : selected ? `Message ${selected.full_name||selected.user_email}` : 'Select an agent'}
          </button>
        </div>
      </div>
    </div>
  );
}