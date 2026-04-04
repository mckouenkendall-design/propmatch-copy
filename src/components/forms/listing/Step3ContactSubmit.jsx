import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ChevronDown, Bookmark, Search, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SaveTemplateModal from '@/components/templates/SaveTemplateModal';

const ACCENT = '#00DBC5';

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide pb-2" style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</h3>
    </div>
  );
}

const VISIBILITY_OPTIONS = [
  { value: 'public',    label: 'Public',               desc: 'Visible to all users on PropMatch. Recommended for the highest chance of a match' },
  { value: 'team',      label: 'Fishtank(s)',           desc: 'Only members of selected networking groups' },
  { value: 'brokerage', label: 'Brokerage Only',        desc: 'Only users sharing your Brokerage ID' },
  { value: 'private',   label: 'Private (Invite Only)', desc: 'Direct access link sent to a specific person' },
];

// ─── Reusable agent row with checkbox ─────────────────────────────────────────
function AgentCheckRow({ profile, selected, onToggle }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={() => onToggle(profile.user_email)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'9px', cursor:'pointer', background:selected?`${ACCENT}10`:'transparent', transition:'background 0.1s' }}
      onMouseEnterCapture={e => { if(!selected) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
      onMouseLeaveCapture={e => { if(!selected) e.currentTarget.style.background=selected?`${ACCENT}10`:'transparent'; }}>
      <div style={{ width:'18px', height:'18px', borderRadius:'5px', flexShrink:0, border:`2px solid ${selected?ACCENT:hov?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.2)'}`, background:selected?ACCENT:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
        {selected && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 4.5 8.5 10 3.5"/></svg>}
      </div>
      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'13px', fontWeight:700 }}>
        {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (profile.full_name||profile.user_email||'?')[0].toUpperCase()}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.full_name || profile.user_email}</span>
          {profile.username && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}>@{profile.username}</span>}
        </div>
        {profile.brokerage_name && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{profile.brokerage_name}</p>}
      </div>
    </div>
  );
}

// ─── Private recipient picker ─────────────────────────────────────────────────
function PrivateRecipientPicker({ value, onChange, currentUserEmail }) {
  const [query, setQuery] = useState('');

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles-picker'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  // People you already have conversations with — shown first
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-picker', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      const [c1, c2] = await Promise.all([
        base44.entities.Conversation.filter({ participant_1: currentUserEmail }),
        base44.entities.Conversation.filter({ participant_2: currentUserEmail }),
      ]);
      return [...c1, ...c2];
    },
    enabled: !!currentUserEmail,
  });

  const knownEmails = new Set(conversations.map(c =>
    c.participant_1 === currentUserEmail ? c.participant_2 : c.participant_1
  ));

  // value is comma-separated emails — supports multiple recipients
  const selectedEmails = (value || '').split(',').map(s => s.trim()).filter(Boolean);
  const toggleEmail = (email) => {
    const next = selectedEmails.includes(email)
      ? selectedEmails.filter(e => e !== email)
      : [...selectedEmails, email];
    onChange(next.join(','));
  };

  const allFiltered = allProfiles.filter(p =>
    p.user_email !== currentUserEmail && (
      !query ||
      (p.full_name      || '').toLowerCase().includes(query.toLowerCase()) ||
      (p.username       || '').toLowerCase().includes(query.toLowerCase()) ||
      (p.user_email     || '').toLowerCase().includes(query.toLowerCase()) ||
      (p.brokerage_name || '').toLowerCase().includes(query.toLowerCase())
    )
  );

  const sorted = [
    ...allFiltered.filter(p => knownEmails.has(p.user_email)),
    ...allFiltered.filter(p => !knownEmails.has(p.user_email)),
  ].slice(0, 25);

  return (
    <div>
      {/* Selected chips */}
      {selectedEmails.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'8px' }}>
          {selectedEmails.map(email => {
            const p = allProfiles.find(pr => pr.user_email === email);
            return (
              <span key={email} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px 3px 10px', background:`${ACCENT}15`, border:`1px solid ${ACCENT}35`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:ACCENT }}>
                {p?.full_name || email.split('@')[0]}
                <button type="button" onClick={() => toggleEmail(email)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
                  <X style={{ width:'10px', height:'10px', color:ACCENT }}/>
                </button>
              </span>
            );
          })}
        </div>
      )}
      {/* Search — autoComplete off kills browser autofill */}
      <div style={{ position:'relative', marginBottom:'8px' }}>
        <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)', pointerEvents:'none' }}/>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, @username, or email..."
          autoComplete="off" autoCorrect="off" autoCapitalize="off"
          spellCheck="false" name="propmatch-private-recipient-field"
          style={{ width:'100%', padding:'9px 9px 9px 30px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}
        />
      </div>
      {/* Agent list */}
      <div style={{ maxHeight:'220px', overflowY:'auto', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', padding:'4px' }}>
        {sorted.length === 0 ? (
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', padding:'16px', textAlign:'center', margin:0 }}>No agents found</p>
        ) : (
          <>
            {!query && knownEmails.size > 0 && (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', padding:'6px 12px 2px', margin:0 }}>Recent</p>
            )}
            {sorted.map(p => (
              <AgentCheckRow key={p.user_email} profile={p} selected={selectedEmails.includes(p.user_email)} onToggle={toggleEmail}/>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


// ─── Visibility Confirmation Modal ───────────────────────────────────────────
const VISIBILITY_MESSAGES = {
  team: {
    title: 'Fish Tank Visibility',
    body: "This post will only be visible to members of the Fish Tank(s) you selected. It will not appear in public search, it will not show in your brokerage's listings/requirements, and agents outside those tanks will not be able to find or match with it.",
    storageKey: 'pm_vis_confirm_team_dismissed',
  },
  brokerage: {
    title: 'Brokerage Only Visibility',
    body: "This post will only be visible to agents who share your Brokerage ID. It will not appear in public search, it will not show in any Fish Tanks, and agents outside your brokerage will not be able to find or match with it.",
    storageKey: 'pm_vis_confirm_brokerage_dismissed',
  },
  private: {
    title: 'Private Post',
    body: "This post will only be visible to the specific person(s) you selected. No one else on PropMatch will see it, it won't show publicly, and it won't appear in any Fish Tank or brokerage listings/requirements.",
    storageKey: 'pm_vis_confirm_private_dismissed',
  },
};

function VisibilityConfirmModal({ visibilityType, onConfirm, onCancel }) {
  const info = VISIBILITY_MESSAGES[visibilityType];
  if (!info) return null;

  const handleNeverShow = () => {
    try { localStorage.setItem(info.storageKey, 'true'); } catch {}
    onConfirm();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}
      onClick={onCancel}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'20px', width:'100%', maxWidth:'440px', padding:'28px', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        {/* Title */}
        <div style={{ marginBottom:'16px' }}>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:600, color:'white', margin:0 }}>{info.title}</h3>
        </div>
        {/* Body */}
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.7, margin:'0 0 24px' }}>
          {info.body}
        </p>
        {/* Buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          <button onClick={onConfirm}
            style={{ width:'100%', padding:'12px', background:ACCENT, border:'none', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:'#111827', cursor:'pointer' }}>
            Got it, post
          </button>
          <button onClick={handleNeverShow}
            style={{ width:'100%', padding:'10px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.color='rgba(255,255,255,0.65)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
            Never show this again
          </button>
          <button onClick={onCancel}
            style={{ width:'100%', padding:'8px', background:'transparent', border:'none', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.25)', cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListStep3ContactSubmit({ data, update, onSubmit, isLoading, editMode }) {
  const [termsAccepted, setTermsAccepted]           = useState(true);
  const [showTermsModal, setShowTermsModal]           = useState(false);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState(false);
  const [groupSearchInput, setGroupSearchInput]     = useState('');
  const [currentUserEmail, setCurrentUserEmail]     = useState(null);
  const [showSaveTemplate, setShowSaveTemplate]     = useState(false);
  const [pendingVisibility, setPendingVisibility]     = useState(null); // visibility type awaiting confirmation
  const [showSubmitVisibilityModal, setShowSubmitVisibilityModal] = useState(false); // show on Post/Save click
  const [showGroupChoice, setShowGroupChoice]         = useState(false); // send separately vs group chat
  const [existingGroupChat, setExistingGroupChat]     = useState(null); // {id, name} if group exists

  useEffect(() => {
    async function prefill() {
      const user = await base44.auth.me();
      if (!user) return;
      setCurrentUserEmail(user.email);
      const patch = {};
      if (!data.contact_agent_name  && user.full_name)      patch.contact_agent_name  = user.full_name;
      if (!data.contact_agent_email && user.email)          patch.contact_agent_email = user.email;
      if (!data.contact_agent_phone && user.phone)          patch.contact_agent_phone = user.phone;
      if (!data.company_name        && user.brokerage_name) patch.company_name        = user.brokerage_name;
      if (Object.keys(patch).length > 0) update(patch);
    }
    prefill();
  }, []);

  const { data: userGroups = [] } = useQuery({
    queryKey: ['userGroups', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      const memberships = await base44.entities.GroupMember.filter({ user_email: currentUserEmail, status: 'active' });
      const groupIds = memberships.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const groups = await base44.entities.Group.list();
      return groups.filter(g => groupIds.includes(g.id));
    },
    enabled: !!currentUserEmail,
  });

  const visibility     = data.visibility || 'public';

  const isDismissed = (type) => {
    try { return localStorage.getItem(VISIBILITY_MESSAGES[type]?.storageKey) === 'true'; } catch { return false; }
  };

  const handleVisibilitySelect = (value) => {
    update({ visibility: value });
  };
  const filteredGroups = userGroups.filter(g => g.name.toLowerCase().includes(groupSearchInput.toLowerCase()));

  const handleGroupSelect = (groupName) => {
    update({ visibility_groups: groupName });
    setGroupSearchInput(groupName);
    setGroupsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = () => setGroupsDropdownOpen(false);
    if (groupsDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [groupsDropdownOpen]);

  const handleSubmitClick = async () => {
    const vis = data.visibility || 'public';
    // Check if visibility warning needs to show first
    if (vis !== 'public' && !isDismissed(vis) && !showSubmitVisibilityModal) {
      setShowSubmitVisibilityModal(true);
      return;
    }
    // Private with multiple recipients — check for existing group chat
    if (vis === 'private') {
      const recipients = (data.visibility_recipient_email || '').split(',').map(s => s.trim()).filter(Boolean);
      if (recipients.length > 1) {
        // Look for existing group chat with exactly these people
        try {
          const myEmail = currentUserEmail;
          const participantEmails = [myEmail, ...recipients];
          const sortedKey = [...participantEmails].sort().join(',');
          // Search all group convos, not just ones I created
          const allGCs = await base44.entities.GroupConversation.filter({});
          const found = allGCs.find(gc => {
            try {
              const parts = JSON.parse(gc.participant_emails || '[]');
              return parts.sort().join(',') === sortedKey;
            } catch { return false; }
          });
          setExistingGroupChat(found ? { id: found.id, name: found.name } : null);
        } catch { setExistingGroupChat(null); }
        setShowGroupChoice(true);
        return;
      }
    }
    onSubmit();
  };

  return (
    <div className="space-y-6" onClick={e => e.stopPropagation()}>

      <SectionTitle>Contact Information</SectionTitle>
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Name">
            <Input value={data.contact_agent_name || ''} onChange={e => update({ contact_agent_name: e.target.value })} placeholder="Jane Smith" />
          </Field>
          <Field label="Company / Brokerage Name">
            <Input value={data.company_name || ''} onChange={e => update({ company_name: e.target.value })} placeholder="Premier Realty Group" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Email">
            <Input type="email" value={data.contact_agent_email || ''} onChange={e => update({ contact_agent_email: e.target.value })} placeholder="jane@realty.com" />
          </Field>
          <Field label="Contact Phone">
            <Input value={data.contact_agent_phone || ''} onChange={e => update({ contact_agent_phone: e.target.value })} placeholder="(555) 123-4567" />
          </Field>
        </div>
      </div>

      <SectionTitle>Visibility & Access</SectionTitle>
      <Field label="Who can see this post?">
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => handleVisibilitySelect(opt.value)}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
              style={{ borderColor: visibility === opt.value ? ACCENT : 'rgba(255,255,255,0.2)', backgroundColor: visibility === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)' }}>
              <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{ borderColor: visibility === opt.value ? ACCENT : 'rgba(255,255,255,0.3)' }}>
                {visibility === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT }} />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{opt.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {visibility === 'team' && (
        <Field label="Select Fish Tank(s)" hint="Your post will only be visible in the selected tanks">
          <div style={{ maxHeight:'220px', overflowY:'auto', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', padding:'4px' }}>
            {userGroups.length === 0 ? (
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.3)', padding:'16px', textAlign:'center', margin:0 }}>You haven't joined any Fish Tanks yet</p>
            ) : userGroups.map(group => {
              const selectedIds = (data.visibility_groups || '').split(',').map(s=>s.trim()).filter(Boolean);
              const isSel = selectedIds.includes(group.id);
              const toggleGroup = () => {
                const next = isSel
                  ? selectedIds.filter(id => id !== group.id)
                  : [...selectedIds, group.id];
                update({ visibility_groups: next.join(',') });
              };
              return (
                <div key={group.id} onClick={toggleGroup}
                  style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'9px', cursor:'pointer', background:isSel?`${ACCENT}10`:'transparent', transition:'background 0.1s' }}
                  onMouseEnter={e => { if(!isSel) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background=isSel?`${ACCENT}10`:'transparent'; }}>
                  <div style={{ width:'18px', height:'18px', borderRadius:'5px', flexShrink:0, border:`2px solid ${isSel?ACCENT:'rgba(255,255,255,0.2)'}`, background:isSel?ACCENT:'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                    {isSel && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 4.5 8.5 10 3.5"/></svg>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{group.name}</p>
                    {group.location && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{group.location}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Field>
      )}

      {visibility === 'private' && (
        <Field label="Send To" hint="Search by name, @username, or email">
          <PrivateRecipientPicker
            value={data.visibility_recipient_email || ''}
            onChange={email => update({ visibility_recipient_email: email })}
            currentUserEmail={currentUserEmail}
          />
        </Field>
      )}

      {/* Terms + Submit */}
      <div className="pt-2 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
          <div style={{ marginTop: '2px', width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, border: `2px solid ${termsAccepted ? ACCENT : 'rgba(255,255,255,0.25)'}`, background: termsAccepted ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', cursor: 'pointer' }}>
            {termsAccepted && (
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 7 5.5 10.5 12 3.5" />
              </svg>
            )}
          </div>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            By posting, I confirm the information provided is accurate and agree to the{' '}
            <span onClick={e => { e.stopPropagation(); setShowTermsModal(true); }} style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: '2px', cursor:'pointer' }}>PropMatch Terms of Service</span>
            . I understand that other PropMatch users may contact me directly via email, phone, or in-app messaging based on this post.
          </span>
        </label>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => setShowSaveTemplate(true)} className="gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
            <Bookmark className="w-4 h-4" />
            Save as Template
          </Button>

          <Button onClick={handleSubmitClick} disabled={isLoading || !termsAccepted} className="gap-2 px-6"
            style={{ backgroundColor: (termsAccepted && !isLoading) ? ACCENT : 'rgba(255,255,255,0.3)', color: 'white' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editMode ? 'Save Changes' : 'Post Listing'}
          </Button>
        </div>
      </div>

      {/* Visibility confirmation modal */}
      {showSubmitVisibilityModal && (
        <VisibilityConfirmModal
          visibilityType={data.visibility || 'public'}
          onConfirm={() => {
            setShowSubmitVisibilityModal(false);
            // After confirming visibility, check if we still need group choice
            const recipients = (data.visibility_recipient_email || '').split(',').map(s => s.trim()).filter(Boolean);
            if ((data.visibility || 'public') === 'private' && recipients.length > 1) {
              setShowGroupChoice(true);
            } else {
              onSubmit();
            }
          }}
          onCancel={() => setShowSubmitVisibilityModal(false)}
        />
      )}

      {showGroupChoice && (() => {
        const recipients = (data.visibility_recipient_email || '').split(',').map(s => s.trim()).filter(Boolean);
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
            <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'20px', width:'100%', maxWidth:'400px', padding:'28px', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:600, color:'white', margin:'0 0 8px' }}>Send to {recipients.length} people</h3>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:'0 0 20px', lineHeight:1.6 }}>
                How would you like to send this post to {recipients.length} recipients?
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <button onClick={() => { setShowGroupChoice(false); onSubmit({ sendMode: existingGroupChat ? 'existing_group' : 'create_group', groupId: existingGroupChat?.id }); }}
                  style={{ width:'100%', padding:'13px', background:ACCENT, border:'none', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:'#111827', cursor:'pointer', textAlign:'left' }}>
                  {existingGroupChat ? `Send to "${existingGroupChat.name}"` : 'Create Group Chat'}
                </button>
                <button onClick={() => { setShowGroupChoice(false); onSubmit({ sendMode: 'separately' }); }}
                  style={{ width:'100%', padding:'13px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'white', cursor:'pointer', textAlign:'left' }}>
                  Send Separately - individual DM to each person
                </button>
                <button onClick={() => setShowGroupChoice(false)}
                  style={{ width:'100%', padding:'10px', background:'transparent', border:'none', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showTermsModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
          <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'20px', width:'100%', maxWidth:'600px', maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:600, color:'white', margin:0 }}>PropMatch Terms of Service</h3>
              <button onClick={() => setShowTermsModal(false)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
                <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'22px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.6)', lineHeight:1.8 }}>
                By posting on PropMatch, you confirm that all information provided is accurate to the best of your knowledge. You understand that other PropMatch users may contact you directly via email, phone, or in-app messaging based on your post. You agree not to post false, misleading, or fraudulent listings or requirements. PropMatch reserves the right to remove any post that violates these terms. Your use of PropMatch constitutes acceptance of these terms. For full terms and conditions, visit prop-match.ai/terms.
              </p>
            </div>
            <div style={{ padding:'16px 22px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
              <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                style={{ width:'100%', padding:'11px', background:'#00DBC5', border:'none', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:'#111827', cursor:'pointer' }}>
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveTemplate && (
        <SaveTemplateModal formData={data} templateType="listing" onClose={() => setShowSaveTemplate(false)} />
      )}
    </div>
  );
}