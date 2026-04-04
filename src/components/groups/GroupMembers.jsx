import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Shield, UserCheck, UserX, UserPlus, Search, X, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AgentContactModal from '@/components/shared/AgentContactModal';

const ROLE_CONFIG = {
  admin:     { label: 'Admin',     icon: Crown,      color: '#f59e0b' },
  moderator: { label: 'Moderator', icon: Shield,     color: '#6366f1' },
  member:    { label: 'Member',    icon: UserCheck,  color: '#4FB3A9' },
};
const ACCENT = '#00DBC5';

function Avatar({ profile, displayName, size = 36 }) {
  const photo = profile?.profile_photo_url;
  const initial = (displayName || '?')[0]?.toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:ACCENT, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:Math.round(size*0.39), fontWeight:700 }}>
      {photo ? <img src={photo} alt={displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : initial}
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ groupId, groupName, groupType, currentUserEmail, existingMemberEmails, allProfiles, onClose }) {
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(null);
  const [sending, setSending]  = useState(false);
  const [sent, setSent]        = useState(false);
  const queryClient = useQueryClient();

  const filtered = useMemo(() =>
    allProfiles.filter(p =>
      p.user_email !== currentUserEmail &&
      !existingMemberEmails.has(p.user_email) && (
        !query ||
        (p.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.username  || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.user_email|| '').toLowerCase().includes(query.toLowerCase()) ||
        (p.brokerage_name || '').toLowerCase().includes(query.toLowerCase())
      )
    ).slice(0, 25),
    [allProfiles, query, currentUserEmail, existingMemberEmails]
  );

  const sendInvite = async () => {
    if (!selected) return;
    setSending(true);
    try {
      // Public group: immediately active. Private: pending (still needs admin approval after accept)
      const inviteStatus = groupType === 'private' ? 'pending' : 'active';
      await base44.entities.GroupMember.create({
        group_id: groupId,
        user_email: selected.user_email,
        user_name: selected.full_name || selected.user_email,
        role: 'member',
        status: inviteStatus,
      });
      // Send notification to invited person
      await base44.entities.Notification.create({
        user_email: selected.user_email,
        type: 'announcement',
        title: `You've been invited to join ${groupName || 'a Fish Tank'}`,
        body: groupType === 'private'
          ? 'Click to view and accept. An admin will approve your request.'
          : 'Click to view and accept to join immediately.',
        link: '/Groups',
        read: false,
      });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      setSent(true);
    } catch (e) { console.error('Invite failed:', e); }
    setSending(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px', width:'100%', maxWidth:'440px', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:400, color:'white', margin:0 }}>Invite to Fish Tank</h3>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>
        <div style={{ padding:'16px 20px' }}>
          {sent ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>✅</div>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:'0 0 4px' }}>Invite sent!</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.45)', margin:'0 0 16px' }}>
                {selected?.full_name || selected?.user_email} will see a notification to join.
              </p>
              <button onClick={onClose} style={{ padding:'9px 20px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'#111827', cursor:'pointer' }}>Done</button>
            </div>
          ) : (
            <>
              {selected ? (
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:`${ACCENT}10`, border:`1px solid ${ACCENT}30`, borderRadius:'9px', marginBottom:'10px' }}>
                  <Avatar profile={selected} displayName={selected.full_name || selected.user_email} size={36}/>
                  <div style={{ flex:1 }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:'white', margin:0 }}>{selected.full_name || selected.user_email}</p>
                    {selected.username && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>@{selected.username}</p>}
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0 }}>
                    <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)' }}/>
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ position:'relative', marginBottom:'10px' }}>
                    <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)' }}/>
                    <input value={query} onChange={e => setQuery(e.target.value)}
                      placeholder="Search by name, @username, or brokerage..."
                      autoFocus
                      style={{ width:'100%', padding:'10px 10px 10px 32px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}/>
                  </div>
                  <div style={{ maxHeight:'240px', overflowY:'auto', marginBottom:'12px' }}>
                    {filtered.length === 0 ? (
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', textAlign:'center', padding:'20px 0', margin:0 }}>
                        {query ? 'No agents found' : 'Start typing to search'}
                      </p>
                    ) : filtered.map(p => (
                      <div key={p.user_email} onClick={() => setSelected(p)}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'9px', cursor:'pointer', marginBottom:'2px' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <Avatar profile={p} displayName={p.full_name || p.user_email} size={36}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:'white', margin:0 }}>{p.full_name || p.user_email}</p>
                            {p.username && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>@{p.username}</span>}
                          </div>
                          {p.brokerage_name && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{p.brokerage_name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button onClick={sendInvite} disabled={!selected || sending}
                style={{ width:'100%', padding:'11px', background:selected?ACCENT:'rgba(255,255,255,0.08)', border:'none', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:selected?'#111827':'rgba(255,255,255,0.3)', cursor:selected?'pointer':'not-allowed', transition:'all 0.15s' }}>
                {sending ? 'Sending...' : selected ? `Invite ${selected.full_name || selected.user_email}` : 'Select someone to invite'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GroupMembers({ groupId, groupName, groupType, currentUserRole, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [viewingAgent, setViewingAgent]  = useState(null); // { profile, email }
  const [showInvite, setShowInvite]      = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.filter({}),
  });

  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));
  const existingMemberEmails = new Set(members.map(m => m.user_email));

  const getDisplayName = (member) => {
    const profile = profileMap[member.user_email];
    return profile?.full_name || member.user_name || member.user_email || 'Member';
  };

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupMember.update(id, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const activeMembers  = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const isAdmin = currentUserRole === 'admin';

  if (isLoading) return (
    <div style={{ textAlign:'center', padding:'32px', color:'rgba(255,255,255,0.4)', fontFamily:"'Inter',sans-serif" }}>Loading members...</div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header with Invite button */}
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={() => setShowInvite(true)}
          style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'#111827', cursor:'pointer' }}>
          <UserPlus style={{ width:'14px', height:'14px' }}/> Invite Member
        </button>
      </div>

      {/* Pending requests */}
      {pendingMembers.length > 0 && isAdmin && (
        <div>
          <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', margin:'0 0 12px' }}>
            Pending Requests ({pendingMembers.length})
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {pendingMembers.map(member => {
              const displayName = getDisplayName(member);
              return (
                <div key={member.id} style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <Avatar profile={profileMap[member.user_email]} displayName={displayName}/>
                    <div>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'white', margin:0 }}>{displayName}</p>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{member.user_email}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => approveMutation.mutate(member.id)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:500, color:'#111827', background:ACCENT, border:'none', cursor:'pointer' }}>
                      <UserCheck style={{ width:'14px', height:'14px' }}/> Approve
                    </button>
                    <button onClick={() => removeMutation.mutate(member.id)} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.6)', background:'rgba(255,255,255,0.06)', border:'none', cursor:'pointer' }}>
                      <UserX style={{ width:'14px', height:'14px' }}/> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active members */}
      <div>
        <h3 style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'rgba(255,255,255,0.4)', margin:'0 0 12px' }}>
          Members ({activeMembers.length})
        </h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {activeMembers.map(member => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const RoleIcon   = roleConfig.icon;
            const displayName = getDisplayName(member);
            const profile = profileMap[member.user_email];
            const isMe = member.user_email === currentUser?.email;
            return (
              <div key={member.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <Avatar profile={profile} displayName={displayName}/>
                  <div>
                    {/* Clickable name */}
                    <p onClick={() => !isMe && setViewingAgent({ profile, email: member.user_email })}
                      style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'white', margin:0, cursor:isMe?'default':'pointer', display:'inline' }}
                      onMouseEnter={e => { if(!isMe) e.currentTarget.style.color=ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.color='white'; }}>
                      {displayName}
                    </p>
                    {profile?.username && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', marginLeft:'6px' }}>@{profile.username}</span>}
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{profile?.brokerage_name || member.user_email}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:500, color:roleConfig.color }}>
                    <RoleIcon style={{ width:'13px', height:'13px' }}/> {roleConfig.label}
                  </span>
                  {!isMe && (
                    <button onClick={() => navigate('/Messages')}
                      style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.6)', cursor:'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background=`${ACCENT}15`; e.currentTarget.style.color=ACCENT; }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.6)'; }}>
                      <MessageCircle style={{ width:'12px', height:'12px' }}/> Message
                    </button>
                  )}
                  {isAdmin && member.role !== 'admin' && (
                    <button onClick={() => removeMutation.mutate(member.id)} style={{ padding:'4px', background:'transparent', border:'none', cursor:'pointer', borderRadius:'4px' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <UserX style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.3)' }}/>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {showInvite && (
        <InviteModal groupId={groupId} groupName={groupName} groupType={groupType}
          currentUserEmail={currentUser?.email}
          existingMemberEmails={existingMemberEmails}
          allProfiles={userProfiles}
          onClose={() => setShowInvite(false)}/>
      )}
      {viewingAgent && (
        <AgentContactModal profile={viewingAgent.profile} email={viewingAgent.email} onClose={() => setViewingAgent(null)}/>
      )}

    </div>
  );
}