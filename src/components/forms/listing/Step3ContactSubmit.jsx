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
  { value: 'public',    label: 'Public',               desc: 'Visible to all users on PropMatch' },
  { value: 'team',      label: 'Fishtank(s)',           desc: 'Only members of selected networking groups' },
  { value: 'brokerage', label: 'Brokerage Only',        desc: 'Only users sharing your Brokerage ID' },
  { value: 'private',   label: 'Private (Invite Only)', desc: 'Direct access link sent to a specific person' },
];

// ─── Private recipient picker — search by name, username, or email ────────────
function PrivateRecipientPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles-picker'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const filtered = allProfiles.filter(p =>
    (p.full_name    || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.username     || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.user_email   || '').toLowerCase().includes(query.toLowerCase()) ||
    (p.brokerage_name || '').toLowerCase().includes(query.toLowerCase())
  ).slice(0, 20);

  const selected = allProfiles.find(p => p.user_email === value);

  return (
    <div style={{ position:'relative' }}>
      {selected ? (
        <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', background:'rgba(0,219,197,0.08)', border:`1px solid ${ACCENT}35`, borderRadius:'8px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'12px', fontWeight:700 }}>
            {selected.profile_photo_url
              ? <img src={selected.profile_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (selected.full_name||selected.user_email||'?')[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'white', margin:0 }}>{selected.full_name || selected.user_email}</p>
            {selected.username && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>@{selected.username}</p>}
          </div>
          <button type="button" onClick={() => { onChange(''); setQuery(''); }}
            style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'flex' }}>
            <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)' }}/>
          </button>
        </div>
      ) : (
        <div style={{ position:'relative' }}>
          <Search style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', width:'13px', height:'13px', color:'rgba(255,255,255,0.35)', pointerEvents:'none' }}/>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, @username, or email..."
            style={{ width:'100%', padding:'9px 9px 9px 30px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}
          />
        </div>
      )}
      {open && !selected && query && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:'4px', background:'#1a1f25', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'8px', zIndex:50, maxHeight:'200px', overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          {filtered.length === 0 ? (
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.35)', padding:'12px', margin:0 }}>No agents found</p>
          ) : filtered.map(p => (
            <div key={p.user_email}
              onClick={() => { onChange(p.user_email); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'11px', fontWeight:700 }}>
                {p.profile_photo_url
                  ? <img src={p.profile_photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : (p.full_name||p.user_email||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white' }}>{p.full_name || p.user_email}</span>
                  {p.username && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>@{p.username}</span>}
                </div>
                {p.brokerage_name && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{p.brokerage_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListStep3ContactSubmit({ data, update, onSubmit, isLoading, editMode }) {
  const [termsAccepted, setTermsAccepted]           = useState(true);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState(false);
  const [groupSearchInput, setGroupSearchInput]     = useState('');
  const [currentUserEmail, setCurrentUserEmail]     = useState(null);
  const [showSaveTemplate, setShowSaveTemplate]     = useState(false);

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
            <button key={opt.value} type="button" onClick={() => update({ visibility: opt.value })}
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
        <Field label="Select Networking Group(s)" hint="Search and select Fish Tanks you belong to">
          <div className="relative">
            <Input
              value={groupSearchInput || data.visibility_groups || ''}
              onChange={e => { setGroupSearchInput(e.target.value); update({ visibility_groups: e.target.value }); setGroupsDropdownOpen(true); }}
              onFocus={() => setGroupsDropdownOpen(true)}
              placeholder="Search your Fish Tanks..."
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }} />
            {groupsDropdownOpen && filteredGroups.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-lg shadow-lg" style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.2)', maxHeight: '200px', overflowY: 'auto' }}>
                {filteredGroups.map(group => (
                  <button key={group.id} type="button" onClick={() => handleGroupSelect(group.name)}
                    className="w-full px-4 py-2.5 text-left text-sm"
                    style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
      )}

      {visibility === 'private' && (
        <Field label="Send To" hint="Search by name, @username, or email">
          <PrivateRecipientPicker
            value={data.visibility_recipient_email || ''}
            onChange={email => update({ visibility_recipient_email: email })}
          />
        </Field>
      )}

      {/* Terms + Submit */}
      <div className="pt-2 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer" onClick={() => !editMode && setTermsAccepted(!termsAccepted)}>
          <div style={{ marginTop: '2px', width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, border: `2px solid ${termsAccepted ? ACCENT : 'rgba(255,255,255,0.25)'}`, background: termsAccepted ? ACCENT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', cursor: editMode ? 'default' : 'pointer' }}>
            {termsAccepted && (
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2 7 5.5 10.5 12 3.5" />
              </svg>
            )}
          </div>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            By posting, I confirm the information provided is accurate and agree to the{' '}
            <a href="/Terms" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
              PropMatch Terms of Service
            </a>
            . I understand that other PropMatch users may contact me directly via email, phone, or in-app messaging based on this post.
          </span>
        </label>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => setShowSaveTemplate(true)} className="gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
            <Bookmark className="w-4 h-4" />
            Save as Template
          </Button>

          <Button onClick={onSubmit} disabled={isLoading || !termsAccepted} className="gap-2 px-6"
            style={{ backgroundColor: (termsAccepted && !isLoading) ? ACCENT : 'rgba(255,255,255,0.3)', color: 'white' }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {editMode ? 'Save Changes' : 'Post Listing'}
          </Button>
        </div>
      </div>

      {showSaveTemplate && (
        <SaveTemplateModal formData={data} templateType="listing" onClose={() => setShowSaveTemplate(false)} />
      )}
    </div>
  );
}