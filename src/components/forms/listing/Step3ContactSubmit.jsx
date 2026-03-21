import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

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

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Visible to all users on PropMatch' },
  { value: 'team', label: 'Team / Group Only', desc: 'Only members of selected networking groups' },
  { value: 'brokerage', label: 'Brokerage Only', desc: 'Only users sharing your Brokerage ID' },
  { value: 'private', label: 'Private (Invite Only)', desc: 'Direct access link sent to a specific person' },
];

export default function ListStep3ContactSubmit({ data, update, onSubmit, isLoading }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [groupsDropdownOpen, setGroupsDropdownOpen] = useState(false);
  const [groupSearchInput, setGroupSearchInput] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  // Autofill contact info from logged-in user on mount
  useEffect(() => {
    async function prefill() {
      const user = await base44.auth.me();
      if (!user) return;
      setCurrentUserEmail(user.email);
      const patch = {};
      if (!data.contact_agent_name && user.full_name) patch.contact_agent_name = user.full_name;
      if (!data.contact_agent_email && user.email) patch.contact_agent_email = user.email;
      if (!data.brokerage_id && user.brokerage_id) patch.brokerage_id = user.brokerage_id;
      if (!data.company_name && user.company_name) patch.company_name = user.company_name;
      if (Object.keys(patch).length > 0) update(patch);
    }
    prefill();
  }, []);

  // Fetch user's groups
  const { data: userGroups = [] } = useQuery({
    queryKey: ['userGroups', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      const memberships = await base44.entities.GroupMember.filter({ 
        user_email: currentUserEmail, 
        status: 'active' 
      });
      const groupIds = memberships.map(m => m.group_id);
      if (groupIds.length === 0) return [];
      const groups = await base44.entities.Group.list();
      return groups.filter(g => groupIds.includes(g.id));
    },
    enabled: !!currentUserEmail,
  });

  const visibility = data.visibility || 'public';
  
  // Filter groups based on search input
  const filteredGroups = userGroups.filter(g => 
    g.name.toLowerCase().includes(groupSearchInput.toLowerCase())
  );

  const handleGroupSelect = (groupName) => {
    update({ visibility_groups: groupName });
    setGroupSearchInput(groupName);
    setGroupsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setGroupsDropdownOpen(false);
    if (groupsDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [groupsDropdownOpen]);

  return (
    <div className="space-y-6" onClick={e => e.stopPropagation()}>
      {/* Contact Info */}
      <SectionTitle>Contact Information</SectionTitle>
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Name">
            <Input
              value={data.contact_agent_name || ''}
              onChange={e => update({ contact_agent_name: e.target.value })}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Company / Brokerage Name">
            <Input
              value={data.company_name || ''}
              onChange={e => update({ company_name: e.target.value })}
              placeholder="Premier Realty Group"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact Email">
            <Input
              type="email"
              value={data.contact_agent_email || ''}
              onChange={e => update({ contact_agent_email: e.target.value })}
              placeholder="jane@realty.com"
            />
          </Field>
          <Field label="Contact Phone">
            <Input
              value={data.contact_agent_phone || ''}
              onChange={e => update({ contact_agent_phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </Field>
        </div>
      </div>

      {/* Visibility */}
      <SectionTitle>Visibility & Access</SectionTitle>
      <Field label="Who can see this post?">
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ visibility: opt.value })}
              className="w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all"
              style={{
                borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
                backgroundColor: visibility === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{ borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.3)' }}
              >
                {visibility === opt.value && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--tiffany-blue)' }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{opt.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {/* Conditional sub-fields */}
      {visibility === 'team' && (
        <Field label="Select Networking Group(s)" hint="Search and select groups you belong to">
          <div className="relative">
            <Input
              value={groupSearchInput || data.visibility_groups || ''}
              onChange={e => {
                setGroupSearchInput(e.target.value);
                update({ visibility_groups: e.target.value });
                setGroupsDropdownOpen(true);
              }}
              onFocus={() => setGroupsDropdownOpen(true)}
              placeholder="e.g. Detroit Commercial RE Group"
            />
            <ChevronDown 
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" 
              style={{ color: 'rgba(255,255,255,0.5)' }}
            />
            {groupsDropdownOpen && filteredGroups.length > 0 && (
              <div 
                className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                style={{ 
                  background: '#0E1318', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupSelect(group.name)}
                    className="w-full px-4 py-2.5 text-left text-sm transition-colors"
                    style={{ 
                      color: 'rgba(255,255,255,0.9)',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>
      )}
      {visibility === 'private' && (
        <Field label="Recipient Email" hint="A direct access link will be sent to this person">
          <Input
            type="email"
            value={data.visibility_recipient_email || ''}
            onChange={e => update({ visibility_recipient_email: e.target.value })}
            placeholder="recipient@email.com"
          />
        </Field>
      )}

      {/* Allow Direct Contact toggle */}
      <SectionTitle>Settings</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle
          label="Allow Direct Contact (Email / Call buttons on post)"
          value={data.allow_direct_contact !== false}
          onChange={v => update({ allow_direct_contact: v })}
        />
      </div>

      {/* Terms + Submit */}
      <div className="pt-2 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-teal-500"
          />
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            I agree to the{' '}
            <span className="underline cursor-pointer" style={{ color: 'var(--tiffany-blue)' }}>
              PropMatch Terms of Service
            </span>{' '}
            and confirm that the information provided is accurate.
          </span>
        </label>

        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={isLoading || !termsAccepted}
            className="gap-2 px-6"
            style={{ 
              backgroundColor: termsAccepted ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.3)',
              color: 'white'
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Post Listing
          </Button>
        </div>
      </div>
    </div>
  );
}