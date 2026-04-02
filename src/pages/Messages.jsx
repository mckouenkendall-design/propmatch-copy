import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Send, Plus, Paperclip, X, Search, MessageCircle,
  FileText, Image, File, ChevronLeft, Building2, ExternalLink, Users, Pencil, Check, Camera
} from 'lucide-react';
import StartConversationModal from '@/components/messages/StartConversationModal';
import AgentContactModal from '@/components/shared/AgentContactModal';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7)   return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({ profile, name, size = 40 }) {
  const initial = (profile?.full_name || name || '?')[0].toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: size * 0.4, fontWeight: 700 }}>
      {profile?.profile_photo_url
        ? <img src={profile.profile_photo_url} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        : initial}
    </div>
  );
}

// ─── Shared Post Card (listing or requirement shared in chat) ─────────────────
function SharedPostCard({ postId, postType, allListings, allRequirements, onClick }) {
  const post = postType === 'listing'
    ? allListings.find(l => l.id === postId)
    : allRequirements.find(r => r.id === postId);

  if (!post) return null;
  const isListing = postType === 'listing';
  const color = isListing ? ACCENT : LAVENDER;

  const price = (() => {
    const fmt = (n) => { const num = parseFloat(n); if (!n||isNaN(num)) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
    const tx = post.transaction_type, pp = post.price_period;
    const u = isListing
      ? (tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':'')
      : (pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
    if (isListing) { const f=fmt(post.price); return f?`$${f}${u}`:null; }
    const lo=fmt(post.min_price),hi=fmt(post.max_price);
    if(lo&&hi) return `$${lo}–$${hi}${u}`;
    if(hi) return `Up to $${hi}${u}`;
    if(lo) return `From $${lo}${u}`;
    return null;
  })();

  return (
    <div onClick={() => onClick && onClick(post, postType)}
      style={{ background:`${color}08`, border:`1px solid ${color}25`, borderRadius:'10px', padding:'12px', cursor:'pointer', transition:'all 0.15s', maxWidth:'280px' }}
      onMouseEnter={e => { e.currentTarget.style.background=`${color}14`; e.currentTarget.style.borderColor=`${color}45`; }}
      onMouseLeave={e => { e.currentTarget.style.background=`${color}08`; e.currentTarget.style.borderColor=`${color}25`; }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:color }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color }}>{isListing?'Listing':'Requirement'}</span>
        <ExternalLink style={{ width:'10px', height:'10px', color:'rgba(255,255,255,0.3)', marginLeft:'auto' }}/>
      </div>
      <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</p>
      {price && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:700, color, margin:0 }}>{price}</p>}
      {(isListing ? post.city : post.cities?.join?.(', ')) && (
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:'2px 0 0' }}>
          {isListing ? [post.city, post.state].filter(Boolean).join(', ') : (() => { let c=post.cities; if(typeof c==='string'){try{c=JSON.parse(c);}catch{c=[c];}} return Array.isArray(c)?c.join(', '):c; })()}
        </p>
      )}
    </div>
  );
}

// ─── Post Detail Modal (non-match) ────────────────────────────────────────────
function PostDetailModal({ post, postType, onClose }) {
  if (!post) return null;
  const isListing = postType === 'listing';
  const color = isListing ? ACCENT : LAVENDER;

  const pd = (() => { if (!post.property_details) return {}; if (typeof post.property_details==='string'){try{return JSON.parse(post.property_details);}catch{return {};}} return post.property_details; })();

  const price = (() => {
    const fmt = (n) => { const num=parseFloat(n); if(!n||isNaN(num))return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
    const tx=post.transaction_type,pp=post.price_period;
    const u=isListing?(tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':''):(pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
    if(isListing){const f=fmt(post.price);return f?`$${f}${u}`:null;}
    const lo=fmt(post.min_price),hi=fmt(post.max_price);
    if(lo&&hi)return `$${lo}–$${hi}${u}`;
    if(hi)return `Up to $${hi}${u}`;
    if(lo)return `From $${lo}${u}`;
    return null;
  })();

  const DetailRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{label}</span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', fontWeight:500, textAlign:'right', maxWidth:'60%', wordBreak:'break-word' }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'560px', overflow:'hidden', marginBottom:'20px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:color }}/>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color }}>{isListing?'Listing':'Requirement'}</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>
        <div style={{ padding:'20px' }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'20px', fontWeight:500, color:'white', margin:'0 0 6px' }}>{post.title}</h2>
          {price && <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'22px', fontWeight:700, color, marginBottom:'14px' }}>{price}</div>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'16px' }}>
            {[
              [post.city, post.state].filter(Boolean).join(', ') || ((() => { let c=post.cities; if(typeof c==='string'){try{c=JSON.parse(c);}catch{c=[c];}} return Array.isArray(c)?c.join(', '):c; })()),
              post.property_type?.replace(/_/g,' '),
              post.transaction_type,
              post.status,
            ].filter(Boolean).map((v,i) => (
              <span key={i} style={{ padding:'3px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.6)', textTransform:'capitalize' }}>{v}</span>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
            <DetailRow label="Size" value={post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : ((post.min_size_sqft||post.max_size_sqft) ? `${post.min_size_sqft||0}–${post.max_size_sqft||'∞'} SF` : null)}/>
            <DetailRow label="Address" value={post.address}/>
            <DetailRow label="Zip Code" value={post.zip_code}/>
            <DetailRow label="Lease Type" value={post.lease_type?.replace(/_/g,' ')}/>
            <DetailRow label="Timeline" value={post.timeline?.replace(/_/g,' ')}/>
            {Object.entries(pd).slice(0,12).map(([k,v]) => typeof v === 'string' || typeof v === 'number' ? (
              <DetailRow key={k} label={k.replace(/_/g,' ')} value={String(v)}/>
            ) : null)}
          </div>
          {(post.description || post.notes) && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Notes</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:0 }}>{post.description||post.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Messages Page ───────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedConvoId, setSelectedConvoId] = useState(null);
  const [viewingAgent, setViewingAgent] = useState(null); // { profile, email }
  const [messageText, setMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [viewingPost, setViewingPost] = useState(null); // { post, postType }
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameDraft, setGroupNameDraft]     = useState('');
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [uploadingGroupPhoto, setUploadingGroupPhoto] = useState(false);
  const groupPhotoInputRef = React.useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef   = useRef(null);

  // ── Data queries ──────────────────────────────────────────────────────────
  const [selectedConvoType, setSelectedConvoType] = useState('dm'); // 'dm' | 'group'
  const [selectedGroupConvoId, setSelectedGroupConvoId] = useState(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: () => base44.entities.Conversation.filter({ participant_1: user?.email })
      .then(r1 => base44.entities.Conversation.filter({ participant_2: user?.email })
        .then(r2 => [...r1, ...r2].sort((a,b) => new Date(b.last_message_time) - new Date(a.last_message_time)))),
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const { data: allGroupConvos = [] } = useQuery({
    queryKey: ['group-convos'],
    queryFn: () => base44.entities.GroupConversation.filter({}).catch(() => []),
    enabled: !!user?.email,
    refetchInterval: 5000,
  });

  const myGroupConvos = useMemo(() => {
    return allGroupConvos.filter(gc => {
      try { const p = JSON.parse(gc.participant_emails || '[]'); return p.includes(user?.email); }
      catch { return false; }
    });
  }, [allGroupConvos, user?.email]);

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConvoId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: selectedConvoId })
      .then(msgs => msgs.sort((a,b) => new Date(a.sent_at) - new Date(b.sent_at))),
    enabled: !!selectedConvoId && selectedConvoType === 'dm',
    refetchInterval: 3000,
  });

  const { data: groupMessages = [] } = useQuery({
    queryKey: ['group-messages', selectedGroupConvoId],
    queryFn: () => base44.entities.GroupMessage.filter({ group_conversation_id: selectedGroupConvoId })
      .then(msgs => msgs.sort((a,b) => new Date(a.created_date) - new Date(b.created_date))),
    enabled: !!selectedGroupConvoId && selectedConvoType === 'group',
    refetchInterval: 3000,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings-messages'],
    queryFn: () => base44.entities.Listing.list('-created_date', 200),
  });

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['all-requirements-messages'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 200),
  });

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.user_email, p]));

  // ── Selected conversation helpers ─────────────────────────────────────────
  const selectedConvo = conversations.find(c => c.id === selectedConvoId);
  const selectedGroupConvo = myGroupConvos.find(gc => gc.id === selectedGroupConvoId);

  const otherEmail = selectedConvo
    ? (selectedConvo.participant_1 === user?.email ? selectedConvo.participant_2 : selectedConvo.participant_1)
    : null;
  const otherProfile = otherEmail ? profileMap[otherEmail] : null;
  const otherName = otherProfile?.full_name || otherEmail || 'Agent';

  const groupParticipants = useMemo(() => {
    if (!selectedGroupConvo) return [];
    try { return JSON.parse(selectedGroupConvo.participant_emails || '[]').filter(e => e !== user?.email); }
    catch { return []; }
  }, [selectedGroupConvo, user?.email]);

  const activeMessages = selectedConvoType === 'group' ? groupMessages : messages;

  // ── Posts shared in this conversation ─────────────────────────────────────
  const sharedPosts = useMemo(() =>
    messages.filter(m => m.post_id && m.post_type),
    [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async ({ text, attachment, postId, postType }) => {
      if (selectedConvoType === 'group' && selectedGroupConvoId) {
        const senderName = profileMap[user?.email]?.full_name || user?.email?.split('@')[0] || 'Agent';
        await base44.entities.GroupMessage.create({
          group_conversation_id: selectedGroupConvoId,
          sender_email: user?.email,
          sender_name: senderName,
          content: text || '',
          attachment_url: attachment?.url || '',
          attachment_type: attachment?.type || '',
        });
        const preview = text || (attachment ? `📎 ${attachment.name}` : '');
        const unreadCounts = (() => { try { return JSON.parse(selectedGroupConvo?.unread_counts || '{}'); } catch { return {}; } })();
        const participants = groupParticipants;
        participants.forEach(e => { unreadCounts[e] = (unreadCounts[e] || 0) + 1; });
        await base44.entities.GroupConversation.update(selectedGroupConvoId, {
          last_message: preview,
          last_message_time: new Date().toISOString(),
          last_message_sender: senderName,
          unread_counts: JSON.stringify(unreadCounts),
        });
      } else {
        if (!selectedConvoId) return;
        await base44.entities.Message.create({
          conversation_id: selectedConvoId,
          sender_email: user?.email,
          content: text || '',
          attachment_url: attachment?.url || '',
          attachment_type: attachment?.type || '',
          sent_at: new Date().toISOString(),
          post_id: postId || '',
          post_type: postType || '',
        });
        await base44.entities.Conversation.update(selectedConvoId, {
          last_message: text || (attachment ? `📎 ${attachment.name}` : 'Shared a post'),
          last_message_time: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      setMessageText('');
      setPendingAttachment(null);
      if (selectedConvoType === 'group') {
        queryClient.invalidateQueries({ queryKey: ['group-messages', selectedGroupConvoId] });
        queryClient.invalidateQueries({ queryKey: ['group-convos'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConvoId] });
        queryClient.invalidateQueries({ queryKey: ['conversations', user?.email] });
      }
    },
  });

  const handleSend = () => {
    if (!messageText.trim() && !pendingAttachment) return;
    if (selectedConvoType === 'group' && !selectedGroupConvoId) return;
    if (selectedConvoType === 'dm' && !selectedConvoId) return;
    sendMutation.mutate({ text: messageText.trim(), attachment: pendingAttachment });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file';
    const url  = URL.createObjectURL(file);
    setPendingAttachment({ url, type, name: file.name });
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle navigation from FloatingMessageCompose
  useEffect(() => {
    if (location.state?.openConvoId) {
      setSelectedConvoId(location.state.openConvoId);
      setSelectedConvoType('dm');
    }
    if (location.state?.openGroupConvoId) {
      setSelectedGroupConvoId(location.state.openGroupConvoId);
      setSelectedConvoType('group');
    }
  }, [location.state]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!selectedConvo || !user?.email) return;
    const isP1 = selectedConvo.participant_1 === user?.email;
    const unreadKey = isP1 ? 'unread_by_1' : 'unread_by_2';
    if (selectedConvo[unreadKey] > 0) {
      base44.entities.Conversation.update(selectedConvoId, { [unreadKey]: 0 });
    }
  }, [selectedConvoId]);

  const filteredConvos = conversations.filter(c => {
    const other = c.participant_1 === user?.email ? c.participant_2 : c.participant_1;
    const profile = profileMap[other];
    const name = profile?.full_name || other || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredGroupConvos = myGroupConvos.filter(gc => {
    return gc.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Merge and sort all conversations by last message time
  const allConvos = [
    ...filteredConvos.map(c => ({ ...c, _type: 'dm' })),
    ...filteredGroupConvos.map(gc => ({ ...gc, _type: 'group' })),
  ].sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0));

  const myUnread = (c) => c.participant_1 === user?.email ? c.unread_by_1 : c.unread_by_2;
  const groupUnread = (gc) => {
    try { const u = JSON.parse(gc.unread_counts || '{}'); return u[user?.email] || 0; }
    catch { return 0; }
  };

  // ── Attachment icon ───────────────────────────────────────────────────────
  const AttachmentDisplay = ({ url, type, name }) => {
    if (type === 'image') return <img src={url} alt="attachment" style={{ maxWidth:'200px', maxHeight:'160px', borderRadius:'8px', cursor:'pointer', display:'block', marginTop:'6px' }} onClick={() => window.open(url, '_blank')}/>;
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 10px', background:'rgba(255,255,255,0.08)', borderRadius:'7px', textDecoration:'none', color:'white', marginTop:'6px', width:'fit-content' }}>
        {type === 'pdf' ? <FileText style={{ width:'13px', height:'13px', color:ACCENT }}/> : <File style={{ width:'13px', height:'13px', color:ACCENT }}/>}
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
      </a>
    );
  };

  // ── Group chat management ──────────────────────────────────────────────────
  const saveGroupName = async () => {
    if (!groupNameDraft.trim() || !selectedGroupConvoId) return;
    try {
      await base44.entities.GroupConversation.update(selectedGroupConvoId, { name: groupNameDraft.trim() });
      queryClient.invalidateQueries({ queryKey: ['group-convos'] });
    } catch {}
    setEditingGroupName(false);
  };

  const handleGroupPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGroupConvoId) return;
    setUploadingGroupPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.GroupConversation.update(selectedGroupConvoId, { photo_url: file_url });
      queryClient.invalidateQueries({ queryKey: ['group-convos'] });
    } catch {}
    setUploadingGroupPhoto(false);
    e.target.value = '';
  };

  return (
    <div style={{ height:'calc(100vh - 70px)', display:'flex', background:'#0A0E13', overflow:'hidden' }}>

      {/* ── Left Panel — Conversation List ── */}
      <div style={{ width:'320px', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', background:'#0E1318' }}>
        {/* Header */}
        <div style={{ padding:'20px 16px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'20px', fontWeight:400, color:'white', margin:0 }}>Inbox</h2>
            <button onClick={() => setShowNewConvo(true)}
              style={{ background:ACCENT, border:'none', borderRadius:'8px', padding:'7px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Plus style={{ width:'15px', height:'15px', color:'#111827' }}/>
            </button>
          </div>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.3)' }}/>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              style={{ width:'100%', padding:'8px 8px 8px 30px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {allConvos.length === 0 ? (
            <div style={{ padding:'40px 20px', textAlign:'center' }}>
              <MessageCircle style={{ width:'32px', height:'32px', color:`${ACCENT}30`, margin:'0 auto 12px', display:'block' }}/>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', margin:0 }}>No conversations yet</p>
              <button onClick={() => setShowNewConvo(true)}
                style={{ marginTop:'12px', padding:'7px 16px', background:`${ACCENT}15`, border:`1px solid ${ACCENT}35`, borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:ACCENT, cursor:'pointer' }}>
                Start one
              </button>
            </div>
          ) : (
            allConvos.map(item => {
              const isGroup = item._type === 'group';
              const isSelected = isGroup ? item.id === selectedGroupConvoId : item.id === selectedConvoId;

              if (isGroup) {
                const unread = groupUnread(item);
                return (
                  <div key={`g-${item.id}`} onClick={() => { setSelectedGroupConvoId(item.id); setSelectedConvoId(null); setSelectedConvoType('group'); setActiveTab('chat'); }}
                    style={{ padding:'14px 16px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', background:isSelected?`${LAVENDER}10`:'transparent', borderLeft:isSelected?`3px solid ${LAVENDER}`:'3px solid transparent', transition:'all 0.15s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background=isSelected?`${LAVENDER}10`:'transparent'; }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ position:'relative' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`${LAVENDER}20`, border:`1px solid ${LAVENDER}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Users style={{ width:'18px', height:'18px', color:LAVENDER }}/>
                        </div>
                        {unread > 0 && (
                          <div style={{ position:'absolute', top:'-2px', right:'-2px', width:'16px', height:'16px', borderRadius:'50%', background:LAVENDER, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0E1318' }}>
                            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'9px', fontWeight:700, color:'white' }}>{unread > 9 ? '9+' : unread}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:unread>0?700:500, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px' }}>{item.name}</span>
                          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>{timeAgo(item.last_message_time)}</span>
                        </div>
                        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:unread>0?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.35)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.last_message_sender ? `${item.last_message_sender}: ` : ''}{item.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // DM conversation
              const other   = item.participant_1 === user?.email ? item.participant_2 : item.participant_1;
              const profile = profileMap[other];
              const name    = profile?.full_name || other || 'Agent';
              const unread  = myUnread(item);
              return (
                <div key={item.id} onClick={() => { setSelectedConvoId(item.id); setSelectedGroupConvoId(null); setSelectedConvoType('dm'); setActiveTab('chat'); }}
                  style={{ padding:'14px 16px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', background:isSelected?'rgba(0,219,197,0.07)':'transparent', borderLeft:isSelected?`3px solid ${ACCENT}`:'3px solid transparent', transition:'all 0.15s' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent'; }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ position:'relative' }}>
                      <Avatar profile={profile} name={name} size={40}/>
                      {unread > 0 && (
                        <div style={{ position:'absolute', top:'-2px', right:'-2px', width:'16px', height:'16px', borderRadius:'50%', background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #0E1318' }}>
                          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'9px', fontWeight:700, color:'#111827' }}>{unread > 9 ? '9+' : unread}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2px' }}>
                        <span onClick={e => { e.stopPropagation(); setViewingAgent({ profile, email: other }); }}
                          style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:unread>0?700:500, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'160px', cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color=ACCENT}
                          onMouseLeave={e => e.currentTarget.style.color='white'}>
                          {name}
                        </span>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>{timeAgo(item.last_message_time)}</span>
                      </div>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:unread>0?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.35)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel — Thread ── */}
      {(selectedConvo || selectedGroupConvo) ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Thread header */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'12px', background:'#0E1318', flexShrink:0, position:'relative' }}>
            {selectedConvoType === 'group' ? (
              // Group photo — clickable to change
              <div style={{ position:'relative', flexShrink:0 }}>
                <input ref={groupPhotoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleGroupPhotoUpload}/>
                <div onClick={() => groupPhotoInputRef.current?.click()}
                  style={{ width:'42px', height:'42px', borderRadius:'50%', background:`${LAVENDER}20`, border:`1px solid ${LAVENDER}40`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=LAVENDER; e.currentTarget.querySelector('.cam-overlay').style.opacity='1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=`${LAVENDER}40`; e.currentTarget.querySelector('.cam-overlay').style.opacity='0'; }}>
                  {uploadingGroupPhoto ? (
                    <div style={{ width:'16px', height:'16px', border:`2px solid ${LAVENDER}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                  ) : selectedGroupConvo?.photo_url ? (
                    <img src={selectedGroupConvo.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  ) : (
                    <Users style={{ width:'18px', height:'18px', color:LAVENDER }}/>
                  )}
                  <div className="cam-overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s', borderRadius:'50%' }}>
                    <Camera style={{ width:'14px', height:'14px', color:'white' }}/>
                  </div>
                </div>
              </div>
            ) : (
              <Avatar profile={otherProfile} name={otherName} size={38}/>
            )}

            <div style={{ flex:1, minWidth:0 }}>
              {selectedConvoType === 'group' ? (
                <>
                  {/* Editable group name */}
                  {editingGroupName ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <input
                        value={groupNameDraft}
                        onChange={e => setGroupNameDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveGroupName(); if (e.key === 'Escape') setEditingGroupName(false); }}
                        autoFocus
                        style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:500, color:'white', background:'rgba(255,255,255,0.08)', border:`1px solid ${LAVENDER}50`, borderRadius:'6px', padding:'3px 8px', outline:'none', width:'100%', maxWidth:'300px' }}
                      />
                      <button onClick={saveGroupName} style={{ background:`${LAVENDER}20`, border:`1px solid ${LAVENDER}40`, borderRadius:'6px', padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Check style={{ width:'13px', height:'13px', color:LAVENDER }}/>
                      </button>
                      <button onClick={() => setEditingGroupName(false)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px' }}>
                        <X style={{ width:'13px', height:'13px', color:'rgba(255,255,255,0.3)' }}/>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'16px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {selectedGroupConvo?.name}
                      </p>
                      <button onClick={() => { setGroupNameDraft(selectedGroupConvo?.name || ''); setEditingGroupName(true); }}
                        style={{ background:'transparent', border:'none', cursor:'pointer', padding:'3px', display:'flex', alignItems:'center', opacity:0.4, flexShrink:0 }}
                        onMouseEnter={e => e.currentTarget.style.opacity='1'}
                        onMouseLeave={e => e.currentTarget.style.opacity='0.4'}>
                        <Pencil style={{ width:'12px', height:'12px', color:'white' }}/>
                      </button>
                    </div>
                  )}
                  {/* Clickable member names */}
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {groupParticipants.map((e, i) => {
                      const p = profileMap[e];
                      return (
                        <span key={e}>
                          <span onClick={() => setViewingAgent({ profile: p, email: e })}
                            style={{ cursor:'pointer', textDecoration:'underline', textDecorationColor:'rgba(255,255,255,0.2)' }}
                            onMouseEnter={ev => ev.currentTarget.style.color=ACCENT}
                            onMouseLeave={ev => ev.currentTarget.style.color='rgba(255,255,255,0.35)'}>
                            {p?.full_name || e.split('@')[0]}
                          </span>
                          {i < groupParticipants.length - 1 && ', '}
                        </span>
                      );
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p onClick={() => setViewingAgent({ profile: otherProfile, email: otherEmail })}
                    style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'16px', fontWeight:500, color:'white', margin:0, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color=ACCENT}
                    onMouseLeave={e => e.currentTarget.style.color='white'}>
                    {otherName}
                  </p>
                  {otherProfile?.brokerage_name && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{otherProfile.brokerage_name}</p>}
                </>
              )}
            </div>

            {selectedConvoType === 'dm' && (
              <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'3px', gap:'2px' }}>
                {[{k:'chat',l:'Chat'},{k:'posts',l:`Posts${sharedPosts.length>0?` (${sharedPosts.length})`:''}`}].map(t => (
                  <button key={t.k} onClick={() => setActiveTab(t.k)}
                    style={{ padding:'6px 14px', background:activeTab===t.k?'rgba(255,255,255,0.1)':'transparent', border:'none', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:activeTab===t.k?'white':'rgba(255,255,255,0.45)', cursor:'pointer', whiteSpace:'nowrap' }}>
                    {t.l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── CHAT TAB ── */}
          {activeTab === 'chat' && (
            <>
              <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
                {activeMessages.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'60px 20px' }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.3)' }}>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  activeMessages.map((msg, i) => {
                    const isMe = msg.sender_email === user?.email;
                    const senderProfile = profileMap[msg.sender_email];
                    const senderName = senderProfile?.full_name || msg.sender_name || msg.sender_email?.split('@')[0] || 'Agent';
                    const prevMsg = activeMessages[i-1];
                    const showSenderLabel = selectedConvoType === 'group' && !isMe && prevMsg?.sender_email !== msg.sender_email;
                    const timestamp = msg.sent_at || msg.created_date;
                    return (
                      <div key={msg.id || i} style={{ display:'flex', flexDirection:isMe?'row-reverse':'row', alignItems:'flex-end', gap:'8px', marginBottom:'10px' }}>
                        {!isMe && (
                          <div style={{ width:'28px', flexShrink:0 }}>
                            {(i === 0 || prevMsg?.sender_email !== msg.sender_email) && <Avatar profile={senderProfile} name={senderName} size={28}/>}
                          </div>
                        )}
                        <div style={{ maxWidth:'65%' }}>
                          {showSenderLabel && (
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:'0 0 3px 4px' }}>{senderName}</p>
                          )}
                          {msg.content && (
                            <div style={{ padding:'10px 14px', background:isMe?ACCENT:'rgba(255,255,255,0.08)', borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:isMe?'#111827':'white', lineHeight:1.5, wordBreak:'break-word' }}>
                              {msg.content}
                            </div>
                          )}
                          {msg.attachment_url && <AttachmentDisplay url={msg.attachment_url} type={msg.attachment_type} name={msg.attachment_url.split('/').pop()}/>}
                          {msg.post_id && msg.post_type && (
                            <div style={{ marginTop:'6px' }}>
                              <SharedPostCard postId={msg.post_id} postType={msg.post_type} allListings={allListings} allRequirements={allRequirements} onClick={(post, type) => setViewingPost({ post, postType: type })}/>
                            </div>
                          )}
                          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.25)', margin:'3px 4px 0', textAlign:isMe?'right':'left' }}>
                            {timeAgo(timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef}/>
              </div>

              {/* Message input */}
              <div style={{ padding:'14px 20px', borderTop:'1px solid rgba(255,255,255,0.07)', background:'#0E1318', flexShrink:0 }}>
                {pendingAttachment && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'rgba(255,255,255,0.05)', borderRadius:'8px', marginBottom:'10px' }}>
                    {pendingAttachment.type === 'image'
                      ? <Image style={{ width:'14px', height:'14px', color:ACCENT }}/>
                      : <FileText style={{ width:'14px', height:'14px', color:ACCENT }}/>}
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.7)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{pendingAttachment.name}</span>
                    <button onClick={() => setPendingAttachment(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      <X style={{ width:'13px', height:'13px', color:'rgba(255,255,255,0.4)' }}/>
                    </button>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
                  <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleFileChange}/>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'9px', cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0 }}>
                    <Paperclip style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
                  </button>
                  <textarea value={messageText} onChange={e => setMessageText(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    style={{ flex:1, padding:'10px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'white', outline:'none', resize:'none', lineHeight:1.5, maxHeight:'120px', overflowY:'auto' }}/>
                  <button onClick={handleSend} disabled={(!messageText.trim() && !pendingAttachment) || sendMutation.isPending}
                    style={{ background:ACCENT, border:'none', borderRadius:'8px', padding:'9px 12px', cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0, opacity:(!messageText.trim()&&!pendingAttachment)?0.4:1 }}>
                    <Send style={{ width:'15px', height:'15px', color:'#111827' }}/>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── POSTS TAB ── */}
          {activeTab === 'posts' && (
            <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
              {sharedPosts.length === 0 ? (
                <div style={{ textAlign:'center', padding:'60px 20px' }}>
                  <Building2 style={{ width:'32px', height:'32px', color:`${ACCENT}30`, margin:'0 auto 12px', display:'block' }}/>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.3)', margin:0 }}>No posts shared in this conversation yet.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {sharedPosts.map((msg, i) => (
                    <div key={msg.id || i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
                        <Avatar profile={profileMap[msg.sender_email]} name={msg.sender_email} size={22}/>
                        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>
                          {profileMap[msg.sender_email]?.full_name || msg.sender_email} · {timeAgo(msg.sent_at)}
                        </span>
                      </div>
                      <SharedPostCard postId={msg.post_id} postType={msg.post_type} allListings={allListings} allRequirements={allRequirements} onClick={(post, type) => setViewingPost({ post, postType: type })}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
          <MessageCircle style={{ width:'56px', height:'56px', color:`${ACCENT}20` }}/>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'22px', fontWeight:300, color:'white', margin:0 }}>Your Messages</h3>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.35)', margin:0, textAlign:'center', maxWidth:'280px' }}>
            Select a conversation or start a new one to connect with other agents.
          </p>
          <button onClick={() => setShowNewConvo(true)}
            style={{ padding:'10px 24px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'#111827', cursor:'pointer' }}>
            New Conversation
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewConvo && (
        <StartConversationModal
          currentUser={user}
          profiles={allProfiles}
          onClose={() => setShowNewConvo(false)}
          onCreated={(convoId, type) => {
            setShowNewConvo(false);
            if (type === 'group') {
              queryClient.invalidateQueries({ queryKey: ['group-convos'] });
              setSelectedGroupConvoId(convoId);
              setSelectedConvoId(null);
              setSelectedConvoType('group');
            } else {
              queryClient.invalidateQueries({ queryKey: ['conversations', user?.email] });
              setSelectedConvoId(convoId);
              setSelectedGroupConvoId(null);
              setSelectedConvoType('dm');
            }
          }}
        />
      )}

      {viewingPost && (
        <PostDetailModal post={viewingPost.post} postType={viewingPost.postType} onClose={() => setViewingPost(null)}/>
      )}
      {viewingAgent && (
        <AgentContactModal profile={viewingAgent.profile} email={viewingAgent.email} onClose={() => setViewingAgent(null)}/>
      )}
    </div>
  );
}