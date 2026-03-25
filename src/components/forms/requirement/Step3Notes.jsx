import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ChevronDown, Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SaveTemplateModal from '@/components/templates/SaveTemplateModal';

const AMENITIES = [
  'Elevator', 'ADA Compliant', 'High Speed Internet', 'Generator', 'Storage',
  'Rooftop Access', 'Security System', '24/7 Access', 'Loading Dock', 'HVAC',
  'Kitchenette', 'Gym', 'Parking', 'EV Charging', 'Fiber Optic'
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Visible to all users on PropMatch' },
  { value: 'team', label: 'Team / Group Only', desc: 'Only members of selected networking groups' },
  { value: 'brokerage', label: 'Brokerage Only', desc: 'Only users sharing your Brokerage ID' },
  { value: 'private', label: 'Private (Invite Only)', desc: 'Direct access link sent to a specific person' },
];

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

export default function ReqStep3({ data, update, onSubmit, isLoading }) {
  const [showSave, setShowSave] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState(false);
  const [groupSearchInput, setGroupSearchInput] = useState('');

  useEffect(() => {
    async function prefill() {
      const user = await base44.auth.me();
      if (!user) return;
      setCurrentUserEmail(user.email);
      const patch = {};
      if (!data.contact_agent_name && user.full_name) patch.contact_agent_name = user.full_name;
      if (!data.contact_agent_email && user.email) patch.contact_agent_email = user.email;
      if (!data.contact_agent_phone && user.phone) patch.contact_agent_phone = user.phone;
      if (!data.company_name && user.brokerage_name) patch.company_name = user.brokerage_name;
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

  const toggle = (a) => {
    const cur = data.required_amenities || [];
    update({ required_amenities: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };

  const filteredGroups = userGroups.filter(g =>
    g.name.toLowerCase().includes(groupSearchInput.toLowerCase())
  );

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

  const visibility = data.visibility || 'public';

  return (
    <div className="space-y-6" onClick={e => e.stopPropagation()}>
      {/* Amenities */}
      <SectionTitle>Must-Have Amenities</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map(a => {
          const sel = (data.required_amenities || []).includes(a);
          return (
            <button key={a} type="button" onClick={() => toggle(a)}
              className="px-3 py-1.5 rounded-full text-sm border-2 transition-all"
              style={{ borderColor: sel ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)', backgroundColor: sel ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)', color: sel ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)' }}>
              {a}
            </button>
          );
        })}
      </div>

      {/* Notes */}
      <Field label="Additional Notes">
        <Textarea value={data.notes || ''} onChange={e => update({ notes: e.target.value })}
          placeholder="Any deal-breakers, special requirements, or context about the client..." rows={3}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
      </Field>

      {/* Contact Info */}
      <SectionTitle>Contact Information</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Name">
          <Input value={data.contact_agent_name || ''} onChange={e => update({ contact_agent_name: e.target.value })} placeholder="Jane Smith" />
        </Field>
        <Field label="Company / Brokerage Name">
          <Input value={data.company_name || ''} onChange={e => update({ company_name: e.target.value })} placeholder="Premier Realty Group" />
        </Field>
        <Field label="Contact Email">
          <Input type="email" value={data.contact_agent_email || ''} onChange={e => update({ contact_agent_email: e.target.value })} placeholder="jane@realty.com" />
        </Field>
        <Field label="Contact Phone">
          <Input value={data.contact_agent_phone || ''} onChange={e => update({ contact_agent_phone: e.target.value })} placeholder="(555) 123-4567" />
        </Field>
      </div>

      {/* Visibility */}
      <SectionTitle>Visibility &amp; Access</SectionTitle>
      <div className="space-y-2">
        {VISIBILITY_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => update({ visibility: opt.value })}
            className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
            style={{ borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)', backgroundColor: visibility === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)' }}>
            <div className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
              style={{ borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.3)' }}>
              {visibility === opt.value && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--tiffany-blue)' }} />}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{opt.label}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {visibility === 'team' && (
        <Field label="Select Networking Group(s)" hint="Search and select groups you belong to">
          <div className="relative">
            <Input
              value={groupSearchInput || data.visibility_groups || ''}
              onChange={e => { setGroupSearchInput(e.target.value); update({ visibility_groups: e.target.value }); setGroupsDropdownOpen(true); }}
              onFocus={() => setGroupsDropdownOpen(true)}
              placeholder="e.g. Detroit Commercial RE Group"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(255,255,255,0.5)' }} />
            {groupsDropdownOpen && filteredGroups.length > 0 && (
              <div className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.2)', maxHeight: '200px', overflowY: 'auto' }}>
                {filteredGroups.map(group => (
                  <button key={group.id} type="button" onClick={() => handleGroupSelect(group.name)}
                    className="w-full px-4 py-2.5 text-left text-sm transition-colors"
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
        <Field label="Recipient Email">
          <Input type="email" value={data.visibility_recipient_email || ''} onChange={e => update({ visibility_recipient_email: e.target.value })} placeholder="recipient@email.com" />
        </Field>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setShowSave(true)} className="gap-2">
          <Bookmark className="w-4 h-4" /> Save as Template
        </Button>
        <Button onClick={onSubmit} disabled={isLoading} className="gap-2 px-6" style={{ backgroundColor: 'var(--tiffany-blue)', color: '#111827' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Submit Requirement
        </Button>
      </div>

      {showSave && <SaveTemplateModal formData={data} templateType="requirement" onClose={() => setShowSave(false)} />}
    </div>
  );
}