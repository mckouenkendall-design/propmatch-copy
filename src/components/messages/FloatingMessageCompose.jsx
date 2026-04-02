import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2, Search, Check, Users, Fish, ChevronDown } from 'lucide-react';
import { getScoreLabel } from '@/utils/matchScore';
import { useAuth } from '@/lib/AuthContext';
import { createNotification } from '@/utils/notifications';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

const CTA_ENDINGS = [
  "Would love to connect — does this look like a fit for your client?",
  "Happy to schedule a quick call if you'd like to discuss further.",
  "Can you tell me more about what your client is looking for?",
  "Would it be possible to arrange a showing?",
  "Let me know if you'd like to set up a time to connect.",
  "I have a client who may be very interested — can we get on a call?",
  "Feel free to reach out anytime — I'm happy to answer any questions.",
  "Looking forward to potentially working together on this one.",
];

export default function FloatingMessageCompose({
  recipientProfile,
  recipientEmail: recipientEmailProp,
  myPost,
  matchPost,
  matchResult,
  onClose,
}) {
  const { user: currentUser } = useAuth();
  const navigate   = useNavigate();
  const queryClient = useQueryClient();

  // ── Recipients ─────────────────────────────────────────────────────────────
  // Multi-mode: multiple agents or fish tanks
  const [multiMode, setMultiMode]           = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedEmails, setSelectedEmails] = useState([]); // for multi-select
  const [selectedTankIds, setSelectedTankIds] = useState([]); // fish tank ids
  const [showTanks, setShowTanks]           = useState(false);
  const [sendSeparately, setSendSeparately] = useState(false);
  const [text, setText]                     = useState('');
  const [generating, setGenerating]         = useState(false);
  const [sendMode, setSendMode]             = useState('idle'); // idle | sending | done

  // Single recipient (passed in from match modal etc.)
  const recipientEmail_ = recipientEmailProp || recipientProfile?.contact_email || recipientProfile?.user_email;

  // Load all profiles for recipient search
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  // Load user's fish tanks
  const { data: myTankMemberships = [] } = useQuery({
    queryKey: ['my-tank-memberships', currentUser?.email],
    queryFn: () => base44.entities.GroupMember.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });
  const { data: allTanks = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.Group.list(),
  });
  const myTankIds = new Set(myTankMemberships.map(m => m.group_id));
  const myTanks = allTanks.filter(t => myTankIds.has(t.id));

  // Filtered profiles for search (exclude self)
  const filteredProfiles = allProfiles.filter(p =>
    p.user_email !== currentUser?.email &&
    (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 20);

  // ── AI message generation ──────────────────────────────────────────────────
  const generateMessage = useCallback(async () => {
    if (!myPost || !matchPost || !matchResult) return;
    setGenerating(true);
    const { totalScore, breakdown } = matchResult;
    const label = getScoreLabel(totalScore) || '';
    const myIsListing = myPost.postType === 'listing' || !!myPost.size_sqft;
    const listing = myIsListing ? myPost : matchPost;
    const req = myIsListing ? matchPost : myPost;
    const lp = parseFloat(listing.price);
    const ls = parseFloat(listing.size_sqft);
    const isLease = listing.transaction_type === 'lease' || listing.transaction_type === 'sublease';
    const monthly = isLease && lp && ls ? `$${Math.round((lp*ls)/12).toLocaleString()}/mo` : null;
    const annual = isLease && lp && ls ? `$${Math.round(lp*ls).toLocaleString()}/yr` : null;
    const topCategories = [...breakdown].sort((a,b) => b.score-a.score).slice(0,2).map(b => b.category).join(' and ');
    const cta = CTA_ENDINGS[Math.floor(Math.random()*CTA_ENDINGS.length)];
    const prompt = `You are a commercial real estate agent writing a brief, professional first message to another agent about a potential match.

Match details:
- Your ${myIsListing?'listing':'requirement'}: ${myPost.title}
- Their ${myIsListing?'requirement':'listing'}: ${matchPost.title}
- Match score: ${totalScore}% (${label})
${monthly?`- Monthly total: ${monthly}`:''}${annual?`\n- Annual total: ${annual}`:''}
- Strongest alignment: ${topCategories}

Write 2-3 sentences maximum. Be conversational and specific. Reference actual numbers. End with exactly this sentence: "${cta}"
Rules: no bullet points, no em dashes, no markdown. Plain conversational text only.`;
    try {
      const r = await base44.functions.invoke('generateAIText', { prompt, maxTokens: 200 });
      const t = r.data?.text?.trim() || '';
      setText(t.replace(/\u2014/g, ','));
    } catch { setText(`Hi! I came across your ${myIsListing?'requirement':'listing'} and I think there could be a match. ${cta}`); }
    finally { setGenerating(false); }
  }, [myPost, matchPost, matchResult]);

  useEffect(() => {
    if (myPost && matchPost && matchResult) generateMessage();
  }, []);

  // ── Send logic ─────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async () => {
      const myEmail = currentUser?.email;
      const myName = currentUser?.full_name || myEmail?.split('@')[0] || 'Agent';
      const msgText = text.trim();
      const now = new Date().toISOString();

      // ── FISH TANK SENDS (always separate, one per tank) ──
      if (selectedTankIds.length > 0) {
        for (const tankId of selectedTankIds) {
          await base44.entities.GroupPost.create({
            group_id: tankId,
            author_email: myEmail,
            author_name: myName,
            content: msgText,
            post_type: 'text',
            media_urls: [], file_urls: [], file_names: [],
            comment_count: 0, reaction_counts: '{}',
          });
        }
        return { type: 'tanks', count: selectedTankIds.length };
      }

      const recipients = multiMode
        ? selectedEmails.filter(Boolean)
        : [recipientEmail_].filter(Boolean);

      if (recipients.length === 0) throw new Error('No recipients selected');

      // ── SEND SEPARATELY — individual DMs ──
      if (!multiMode || sendSeparately || recipients.length === 1) {
        for (const email of recipients) {
          const [ex1, ex2] = await Promise.all([
            base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: email }),
            base44.entities.Conversation.filter({ participant_1: email, participant_2: myEmail }),
          ]);
          const existing = [...ex1, ...ex2];
          let convoId;
          if (existing.length > 0) {
            convoId = existing[0].id;
          } else {
            const convo = await base44.entities.Conversation.create({
              participant_1: myEmail, participant_2: email,
              last_message: msgText.slice(0, 80),
              last_message_time: now,
              unread_by_1: 0, unread_by_2: 1,
            });
            convoId = convo.id;
          }
          await base44.entities.Message.create({
            conversation_id: convoId, sender_email: myEmail,
            content: msgText, attachment_url: '', attachment_type: '',
            sent_at: now, post_id: '', post_type: '',
          });
          await base44.entities.Conversation.update(convoId, {
            last_message: msgText.slice(0, 80),
            last_message_time: now,
            unread_by_2: (existing[0]?.unread_by_2 || 0) + 1,
          });
          const senderName = currentUser?.full_name || currentUser?.email?.split('@')[0] || 'An agent';
          await createNotification(base44, email, 'new_message', `New message from ${senderName}`, msgText.slice(0,100), { senderEmail: myEmail, linkType: 'inbox', linkId: convoId });
        }
        return { type: 'separate', count: recipients.length };
      }

      // ── CREATE / FIND GROUP CHAT ──
      const participantEmails = [myEmail, ...recipients];
      const sortedEmails = [...participantEmails].sort().join(',');
      let existingGroup = null;
      try {
        const myGCs = await base44.entities.GroupConversation.filter({ created_by: myEmail });
        existingGroup = myGCs.find(gc => {
          try {
            const p = JSON.parse(gc.participant_emails || '[]').sort().join(',');
            return p === sortedEmails;
          } catch { return false; }
        });
      } catch { /* no existing */ }

      let groupConvoId;
      if (existingGroup) {
        groupConvoId = existingGroup.id;
      } else {
        const groupName = recipients.map(e => {
          const p = allProfiles.find(pr => pr.user_email === e);
          return p?.full_name || e.split('@')[0];
        }).concat([myName]).join(', ');
        const gc = await base44.entities.GroupConversation.create({
          name: groupName,
          participant_emails: JSON.stringify(participantEmails),
          created_by: myEmail,
          last_message: msgText.slice(0, 80),
          last_message_time: now,
          last_message_sender: myName,
          unread_counts: JSON.stringify(Object.fromEntries(recipients.map(e => [e, 1]))),
        });
        groupConvoId = gc.id;
      }

      await base44.entities.GroupMessage.create({
        group_conversation_id: groupConvoId,
        sender_email: myEmail, sender_name: myName,
        content: msgText, attachment_url: '', attachment_type: '',
      });

      await base44.entities.GroupConversation.update(groupConvoId, {
        last_message: msgText.slice(0, 80),
        last_message_time: now,
        last_message_sender: myName,
      });

      return { type: 'group', groupConvoId, isNew: !existingGroup };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['group-convos'] });
      onClose();
      if (result?.type === 'group') {
        navigate('/Messages', { state: { openGroupConvoId: result.groupConvoId } });
      } else if (result?.type === 'separate' && !multiMode) {
        // navigate to inbox for single DM
        navigate('/Messages');
      }
    },
  });

  // ── Smart send button label ────────────────────────────────────────────────
  const getSendLabel = () => {
    if (selectedTankIds.length > 0) return `Post to ${selectedTankIds.length} Fish Tank${selectedTankIds.length>1?'s':''}`;
    if (!multiMode || selectedEmails.length === 0) return 'Send';
    if (sendSeparately || selectedEmails.length === 1) return `Send Separately (${selectedEmails.length})`;
    // Check if group already exists
    return `Create Group (${selectedEmails.length + 1})`;
  };

  const canSend = text.trim() && (
    selectedTankIds.length > 0 ||
    (multiMode ? selectedEmails.length > 0 : !!recipientEmail_)
  );

  const toggleEmail = (email) => {
    setSelectedEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const toggleTank = (id) => {
    setSelectedTankIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    if (!selectedTankIds.includes(id)) setSelectedEmails([]);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'20px', width:'100%', maxWidth:'680px', boxShadow:'0 32px 80px rgba(0,0,0,0.6)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:500, color:'white', margin:'0 0 2px' }}>
              {selectedTankIds.length > 0 ? 'Post to Fish Tanks' : multiMode ? 'Send to Multiple' : 'Send Message'}
            </h3>
            {!multiMode && recipientProfile && (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', margin:0 }}>
                To: {recipientProfile?.full_name || recipientEmail_}
              </p>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {/* Multi-mode toggle */}
            <button onClick={() => { setMultiMode(!multiMode); setSelectedEmails([]); setSelectedTankIds([]); setShowTanks(false); }}
              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:multiMode?`${LAVENDER}15`:'rgba(255,255,255,0.06)', border:`1px solid ${multiMode?LAVENDER+'40':'rgba(255,255,255,0.1)'}`, borderRadius:'7px', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:multiMode?LAVENDER:'rgba(255,255,255,0.5)' }}>
              <Users style={{ width:'12px', height:'12px' }}/> Multi
            </button>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px', cursor:'pointer', display:'flex' }}>
              <X style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)' }}/>
            </button>
          </div>
        </div>

        {/* Multi-select recipient area */}
        {multiMode && (
          <div style={{ padding:'12px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', maxHeight:'280px', overflowY:'auto' }}>

            {/* Section toggle: Agents or Fish Tanks */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
              <button onClick={() => { setShowTanks(false); setSelectedTankIds([]); }}
                style={{ padding:'5px 12px', borderRadius:'7px', border:`1px solid ${!showTanks?ACCENT+'50':'rgba(255,255,255,0.1)'}`, background:!showTanks?`${ACCENT}15`:'transparent', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:!showTanks?ACCENT:'rgba(255,255,255,0.5)', cursor:'pointer' }}>
                Agents
              </button>
              <button onClick={() => { setShowTanks(true); setSelectedEmails([]); }}
                style={{ padding:'5px 12px', borderRadius:'7px', border:`1px solid ${showTanks?ACCENT+'50':'rgba(255,255,255,0.1)'}`, background:showTanks?`${ACCENT}15`:'transparent', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:showTanks?ACCENT:'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                <Fish style={{ width:'12px', height:'12px' }}/> Fish Tanks
              </button>
            </div>

            {/* Fish Tanks */}
            {showTanks && (
              <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.3)', margin:'0 0 6px' }}>Posts to tanks are sent separately to each tank</p>
                {myTanks.length === 0 ? (
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', margin:0 }}>You haven't joined any Fish Tanks yet</p>
                ) : myTanks.map(t => {
                  const isSel = selectedTankIds.includes(t.id);
                  return (
                    <div key={t.id} onClick={() => toggleTank(t.id)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 10px', borderRadius:'8px', cursor:'pointer', background:isSel?`${ACCENT}10`:'transparent', transition:'background 0.1s' }}
                      onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if(!isSel) e.currentTarget.style.background=isSel?`${ACCENT}10`:'transparent'; }}>
                      <div style={{ width:'18px', height:'18px', borderRadius:'5px', flexShrink:0, border:`2px solid ${isSel?ACCENT:'rgba(255,255,255,0.2)'}`, background:isSel?ACCENT:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                        {isSel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 4.5 8.5 10 3.5"/></svg>}
                      </div>
                      <Fish style={{ width:'14px', height:'14px', color:isSel?ACCENT:'rgba(255,255,255,0.4)', flexShrink:0 }}/>
                      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white' }}>{t.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Agents */}
            {!showTanks && (
              <>
                {/* Selected chips */}
                {selectedEmails.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'8px' }}>
                    {selectedEmails.map(email => {
                      const p = allProfiles.find(pr => pr.user_email === email);
                      return (
                        <span key={email} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px 3px 10px', background:`${LAVENDER}15`, border:`1px solid ${LAVENDER}30`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:LAVENDER }}>
                          {p?.full_name || email.split('@')[0]}
                          <button onClick={e => { e.stopPropagation(); toggleEmail(email); }} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                            <X style={{ width:'10px', height:'10px', color:LAVENDER }}/>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search — always visible */}
                <div style={{ position:'relative', marginBottom:'6px' }}>
                  <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.3)' }}/>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name, @username, or email..."
                    style={{ width:'100%', padding:'8px 8px 8px 30px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
                </div>

                {/* Agent list — show when searching */}
                {searchQuery && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                    {filteredProfiles.length === 0 ? (
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', padding:'8px 0', margin:0 }}>No agents found</p>
                    ) : filteredProfiles.map(p => {
                      const isSel = selectedEmails.includes(p.user_email);
                      return (
                        <div key={p.user_email}
                          onClick={() => toggleEmail(p.user_email)}
                          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'8px', cursor:'pointer', background:isSel?`${LAVENDER}10`:'transparent', transition:'background 0.1s' }}
                          onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                          onMouseLeave={e => { if(!isSel) e.currentTarget.style.background=isSel?`${LAVENDER}10`:'transparent'; }}>
                          <div style={{ width:'18px', height:'18px', borderRadius:'5px', flexShrink:0, border:`2px solid ${isSel?LAVENDER:'rgba(255,255,255,0.2)'}`, background:isSel?LAVENDER:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                            {isSel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 4.5 8.5 10 3.5"/></svg>}
                          </div>
                          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'11px', fontWeight:700 }}>
                            {p.profile_photo_url ? <img src={p.profile_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : p.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.full_name || p.user_email}</p>
                              {p.username && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>@{p.username}</span>}
                            </div>
                            {p.brokerage_name && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{p.brokerage_name}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Send separately toggle for multiple agents */}
                {selectedEmails.length > 1 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px', padding:'8px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
                    <button onClick={() => setSendSeparately(!sendSeparately)}
                      style={{ width:'36px', height:'20px', borderRadius:'10px', background:sendSeparately?ACCENT:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'all 0.2s', flexShrink:0 }}>
                      <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'white', position:'absolute', top:'2px', left:sendSeparately?'18px':'2px', transition:'left 0.2s' }}/>
                    </button>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.55)' }}>
                      {sendSeparately ? 'Send Separately — individual DM each' : 'Create Group Chat — one thread'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Message input */}
        <div style={{ padding:'18px 22px' }}>
          {generating ? (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', marginBottom:'14px' }}>
              <Loader2 style={{ width:'15px', height:'15px', color:ACCENT, animation:'spin 1s linear infinite', flexShrink:0 }}/>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:0 }}>Generating your intro message...</p>
            </div>
          ) : (
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              style={{ width:'100%', padding:'14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'white', lineHeight:1.65, outline:'none', resize:'none', boxSizing:'border-box' }}/>
          )}

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px' }}>
            <div style={{ display:'flex', gap:'8px' }}>
              {myPost && matchPost && (
                <button onClick={generateMessage} disabled={generating}
                  style={{ padding:'7px 12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.5)', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                  ✨ Regenerate
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <button onClick={onClose}
                style={{ padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={() => sendMutation.mutate()} disabled={!canSend || sendMutation.isPending}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 20px', background:canSend?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:700, color:canSend?'#111827':'rgba(255,255,255,0.3)', cursor:canSend?'pointer':'not-allowed' }}>
                {sendMutation.isPending ? <Loader2 style={{ width:'14px', height:'14px', animation:'spin 1s linear infinite' }}/> : <Send style={{ width:'14px', height:'14px' }}/>}
                {sendMutation.isPending ? 'Sending...' : getSendLabel()}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}