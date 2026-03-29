import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2 } from 'lucide-react';
import { getScoreLabel } from '@/utils/matchScore';
import { useAuth } from '@/lib/AuthContext';

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
  "Let me know if the details look right and we can take the next step.",
  "Would love to hear your thoughts and see if we can make this work.",
  "Does your client have any flexibility on the requirements?",
  "Happy to provide any additional information you might need.",
];

function randomCTA() {
  return CTA_ENDINGS[Math.floor(Math.random() * CTA_ENDINGS.length)];
}

function priceStr(post, isListing) {
  const tx = post?.transaction_type, pp = post?.price_period;
  const u = isListing
    ? (tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':'')
    : (pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
  if (isListing) {
    const num = parseFloat(post?.price);
    if (!num) return null;
    return `$${num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2})}${u}`;
  }
  const fmt = (n) => { const num=parseFloat(n); if(!n||isNaN(num))return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
  const lo=fmt(post?.min_price), hi=fmt(post?.max_price);
  if(lo&&hi) return `$${lo}–$${hi}${u}`;
  if(hi) return `Up to $${hi}${u}`;
  if(lo) return `From $${lo}${u}`;
  return null;
}

export default function FloatingMessageCompose({
  recipientProfile,  // UserProfile of the person being messaged
  recipientEmail,    // fallback email if no profile
  myPost,            // the user's own listing or requirement (if match context)
  matchPost,         // the other person's post (if match context)
  matchResult,       // result from calculateMatchScore (if match context)
  onClose,
}) {
  const navigate       = useNavigate();
  const queryClient    = useQueryClient();
  const { user: currentUser } = useAuth();
  const [text, setText]       = useState('');
  const [aiLoading, setAiLoad] = useState(false);

  const recipientName  = recipientProfile?.full_name || recipientEmail || 'Agent';
  const recipientEmail_ = recipientProfile?.contact_email || recipientEmail || recipientProfile?.user_email;
  const photo          = recipientProfile?.profile_photo_url;
  const isMatchContext = !!(myPost && matchPost && matchResult);

  // ── Build AI message ──────────────────────────────────────────────────────
  const buildPrompt = useCallback(() => {
    const myName     = currentUser?.full_name || 'a PropMatch agent';
    const myCompany  = currentUser?.brokerage_name || '';
    const myIsListing = !!myPost?.size_sqft || myPost?.postType === 'listing';
    const listing    = myIsListing ? myPost : matchPost;
    const requirement= myIsListing ? matchPost : myPost;
    const score      = matchResult?.totalScore;
    const label      = getScoreLabel(score) || '';
    const lPrice     = priceStr(listing, true) || 'price not listed';
    const rPrice     = priceStr(requirement, false) || 'budget not listed';
    const lSize      = listing?.size_sqft ? `${parseFloat(listing.size_sqft).toLocaleString()} SF` : 'size not listed';
    const lLoc       = [listing?.city, listing?.state].filter(Boolean).join(', ') || 'location not listed';
    const breakdown  = matchResult?.breakdown?.map(b => `${b.category}: ${b.score}%`).join(', ') || '';
    const cta        = randomCTA();

    return `Write a short, friendly, conversational real estate agent-to-agent message. Plain text only. No bullet points. No dashes of any kind. No em dashes. No hyphens used as dashes.

Sender: ${myName}${myCompany ? ' from ' + myCompany : ''}
Recipient: ${recipientName}
Match strength: ${score}% ${label}
${myIsListing ? 'Sender has a listing' : 'Sender has a requirement'}: ${listing?.title || ''}, priced at ${lPrice}, ${lSize}, located in ${lLoc}
${myIsListing ? 'Recipient has a requirement' : 'Recipient has a listing'}: ${requirement?.title || ''}, budget ${rPrice}

Write exactly 3 sentences:
1. Greeting by first name, introduce yourself and your company naturally. Example: "Hi [first name], this is [my name] from [company]."
2. Say you noticed a ${label} match between your ${myIsListing ? 'listing' : 'requirement'} and theirs, briefly describe what you have and what they are looking for in plain conversational terms, like you are texting a colleague. IMPORTANT: always use digits for numbers, never spell them out. Write "$20.50/SF/yr" not "twenty dollars and fifty cents per square foot per year". Write "1,100 SF" not "one thousand one hundred square feet".
3. End with this call to action word for word: "${cta}"

Do not use em dashes, hyphens as dashes, or any special punctuation. Always write numbers as digits. Keep it under 80 words. Sound like a real person, not a robot.`;
  }, [currentUser, myPost, matchPost, matchResult, recipientName]);

  const generateMessage = useCallback(async () => {
    if (!isMatchContext) return;
    setAiLoad(true);
    try {
      const response = await base44.functions.invoke('generateAIText', { prompt: buildPrompt(), maxTokens: 300 });
      const result = response.data;
      if (result?.text) setText(result.text.trim().replace(/—/g, ',').replace(/ - /g, ', '));
    } catch {
      // silently fail — user can type their own message
    } finally {
      setAiLoad(false);
    }
  }, [isMatchContext, buildPrompt]);

  useEffect(() => { generateMessage(); }, []);

  // ── Send ──────────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const myEmail   = currentUser?.email;
      const theirEmail = recipientEmail_;

      // Find or create conversation
      const [ex1, ex2] = await Promise.all([
        base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: theirEmail }),
        base44.entities.Conversation.filter({ participant_1: theirEmail, participant_2: myEmail }),
      ]);
      const existing = [...ex1, ...ex2];
      let convoId;

      if (existing.length > 0) {
        convoId = existing[0].id;
      } else {
        const convo = await base44.entities.Conversation.create({
          participant_1: myEmail,
          participant_2: theirEmail,
          last_message: text.trim().slice(0, 80),
          last_message_time: new Date().toISOString(),
          unread_by_1: 0,
          unread_by_2: 1,
        });
        convoId = convo.id;
      }

      // Send message
      await base44.entities.Message.create({
        conversation_id: convoId,
        sender_email: myEmail,
        content: text.trim(),
        attachment_url: '',
        attachment_type: '',
        sent_at: new Date().toISOString(),
        post_id: '',
        post_type: '',
      });

      // Update conversation preview
      await base44.entities.Conversation.update(convoId, {
        last_message: text.trim().slice(0, 80),
        last_message_time: new Date().toISOString(),
        unread_by_2: (existing[0]?.unread_by_2 || 0) + 1,
      });

      return convoId;
    },
    onSuccess: (convoId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
      navigate('/Messages', { state: { openConvoId: convoId } });
    },
  });

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}
    >
      <div
        style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'18px', width:'100%', maxWidth:'680px', overflow:'hidden', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'12px' }}>
          {/* Recipient avatar */}
          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'16px', fontWeight:700 }}>
            {photo ? <img src={photo} alt={recipientName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : recipientName[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:500, color:'white', margin:0 }}>
              Message {recipientName}
            </p>
            {isMatchContext && matchResult && (
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'2px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:getColorForScore(matchResult.totalScore) }}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>
                  {matchResult.totalScore}% match · {getScoreLabel(matchResult.totalScore)}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex', flexShrink:0 }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'16px 18px' }}>
          {isMatchContext && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:ACCENT }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)' }}>
                {aiLoading ? 'Drafting intro message…' : 'AI-drafted intro — edit freely'}
              </span>
              {aiLoading && <Loader2 style={{ width:'11px', height:'11px', color:ACCENT, animation:'spin 1s linear infinite' }}/>}
              <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={aiLoading ? '' : isMatchContext ? 'Generating your intro message…' : 'Type a message…'}
            rows={10}
            style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'white', outline:'none', resize:'none', lineHeight:1.6, boxSizing:'border-box', opacity: aiLoading ? 0.5 : 1 }}
          />

          <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'12px' }}>
            <button onClick={onClose}
              style={{ padding:'9px 18px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
              Cancel
            </button>
            <button
              onClick={() => sendMutation.mutate()}
              disabled={!text.trim() || sendMutation.isPending}
              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 20px', background:text.trim()?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:text.trim()?'#111827':'rgba(255,255,255,0.3)', cursor:text.trim()?'pointer':'not-allowed', transition:'all 0.15s' }}>
              {sendMutation.isPending ? <Loader2 style={{ width:'13px', height:'13px', animation:'spin 1s linear infinite' }}/> : <Send style={{ width:'13px', height:'13px' }}/>}
              Send & Open Inbox
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColorForScore(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#00DBC5';
  if (score >= 40) return '#f97316';
  return '#6b7280';
}