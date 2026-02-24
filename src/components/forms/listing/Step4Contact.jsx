import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

const fmt = (v) => {
  if (!v && v !== 0) return null;
  if (typeof v === 'number') return `$${Number(v).toLocaleString()}`;
  return String(v).replace(/_/g, ' ');
};

export default function ListStep4({ data, update, onSubmit, isLoading }) {
  const rows = [
    { label: 'Property Type', value: data.property_type },
    { label: 'Transaction', value: data.transaction_type },
    { label: 'Price', value: data.price ? `$${Number(data.price).toLocaleString()}` : null },
    { label: 'Size', value: data.size_sqft ? `${Number(data.size_sqft).toLocaleString()} SF` : null },
    { label: 'Location', value: [data.city, data.state].filter(Boolean).join(', ') || null },
  ].filter(r => r.value);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border divide-y overflow-hidden text-sm bg-gray-50 mb-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-gray-500">{r.label}</span>
            <span className="font-medium text-gray-800 capitalize">{r.value}</span>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-gray-700">Your Contact Info</p>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <Label>Your Name</Label>
          <Input value={data.contact_agent_name} onChange={e => update({ contact_agent_name: e.target.value })} placeholder="John Smith" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={data.contact_agent_email} onChange={e => update({ contact_agent_email: e.target.value })} placeholder="john@realty.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={data.contact_agent_phone} onChange={e => update({ contact_agent_phone: e.target.value })} placeholder="(555) 123-4567" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onSubmit} disabled={isLoading} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Submit Listing
        </Button>
      </div>
    </div>
  );
}