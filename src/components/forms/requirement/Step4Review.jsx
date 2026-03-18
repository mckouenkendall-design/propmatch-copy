import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Visible to all users on PropMatch' },
  { value: 'team', label: 'Team / Group Only', desc: 'Only members of selected networking groups' },
  { value: 'brokerage', label: 'Brokerage Only', desc: 'Only users sharing your Brokerage ID' },
  { value: 'private', label: 'Private (Invite Only)', desc: 'Direct access link sent to a specific person' },
];

const fmt = (v) => {
  if (!v && v !== 0) return null;
  if (typeof v === 'number') return `$${v.toLocaleString()}`;
  return String(v).replace(/_/g, ' ');
};

export default function ReqStep4({ data, update, onSubmit, isLoading }) {
  const visibility = data.visibility || 'public';

  const rows = [
    { label: 'Client', value: data.client_name },
    { label: 'Property Type', value: data.property_type },
    { label: 'Transaction', value: data.transaction_type },
    { label: 'Price Period', value: data.price_period },
    { label: 'Timeline', value: data.timeline },
    {
      label: 'Size Range',
      value: data.min_size_sqft || data.max_size_sqft
        ? `${Number(data.min_size_sqft || 0).toLocaleString()} – ${Number(data.max_size_sqft || 0).toLocaleString()} SF`
        : null
    },
    {
      label: 'Price Range',
      value: data.min_price || data.max_price
        ? `$${Number(data.min_price || 0).toLocaleString()} – $${Number(data.max_price || 0).toLocaleString()}`
        : null
    },
    { label: 'Preferred Areas', value: data.cities?.length ? data.cities.join(', ') : null },
  ].filter(r => r.value);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">{data.title}</h3>
        <p className="text-sm text-gray-500">Review everything before submitting.</p>
      </div>

      <div className="rounded-xl border divide-y overflow-hidden text-sm">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-medium text-gray-800 capitalize">{fmt(r.value)}</span>
          </div>
        ))}
      </div>

      {data.required_amenities?.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Must-Have Amenities</p>
          <div className="flex flex-wrap gap-2">
            {data.required_amenities.map(a => (
              <span key={a} className="px-3 py-1 rounded-full text-xs" style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {data.notes && (
        <div>
          <p className="text-sm text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{data.notes}</p>
        </div>
      )}

      {/* Visibility */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-800 uppercase tracking-wide text-xs border-b border-gray-100 pb-2 block">
          Visibility &amp; Access
        </Label>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update && update({ visibility: opt.value })}
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
        {visibility === 'team' && (
          <div className="space-y-1.5 mt-2">
            <Label className="text-sm">Select Networking Group(s)</Label>
            <Input
              value={data.visibility_groups || ''}
              onChange={e => update && update({ visibility_groups: e.target.value })}
              placeholder="e.g. Detroit Commercial RE Group"
            />
          </div>
        )}
        {visibility === 'private' && (
          <div className="space-y-1.5 mt-2">
            <Label className="text-sm">Recipient Email</Label>
            <Input
              type="email"
              value={data.visibility_recipient_email || ''}
              onChange={e => update && update({ visibility_recipient_email: e.target.value })}
              placeholder="recipient@email.com"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onSubmit} disabled={isLoading} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Submit Requirement
        </Button>
      </div>
    </div>
  );
}