import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">{children}</h3>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? 'var(--tiffany-blue)' : '#d1d5db' }}
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

  // Autofill contact info from logged-in user on mount
  useEffect(() => {
    async function prefill() {
      const user = await base44.auth.me();
      if (!user) return;
      const patch = {};
      if (!data.contact_agent_name && user.full_name) patch.contact_agent_name = user.full_name;
      if (!data.contact_agent_email && user.email) patch.contact_agent_email = user.email;
      if (!data.brokerage_id && user.brokerage_id) patch.brokerage_id = user.brokerage_id;
      if (!data.company_name && user.company_name) patch.company_name = user.company_name;
      if (Object.keys(patch).length > 0) update(patch);
    }
    prefill();
  }, []);

  const visibility = data.visibility || 'public';

  return (
    <div className="space-y-6">
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
        <Field label="Brokerage ID Number" hint="Used to power brokerage-only matching and visibility">
          <Input
            value={data.brokerage_id || ''}
            onChange={e => update({ brokerage_id: e.target.value })}
            placeholder="e.g. BRK-00123"
          />
        </Field>
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
                borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: visibility === opt.value ? '#e6f7f5' : 'white',
              }}
            >
              <div
                className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                style={{ borderColor: visibility === opt.value ? 'var(--tiffany-blue)' : '#d1d5db' }}
              >
                {visibility === opt.value && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--tiffany-blue)' }} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </Field>

      {/* Conditional sub-fields */}
      {visibility === 'team' && (
        <Field label="Select Networking Group(s)" hint="Search and select groups you belong to">
          <Input
            value={data.visibility_groups || ''}
            onChange={e => update({ visibility_groups: e.target.value })}
            placeholder="e.g. Detroit Commercial RE Group"
          />
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
      <div className="rounded-xl border border-gray-100 px-4 py-1">
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
          <span className="text-sm text-gray-600">
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
            className="text-white gap-2 px-6"
            style={{ backgroundColor: termsAccepted ? 'var(--tiffany-blue)' : undefined }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Post Listing
          </Button>
        </div>
      </div>
    </div>
  );
}