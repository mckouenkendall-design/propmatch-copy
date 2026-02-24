import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';

const fmt = (v) => {
  if (!v && v !== 0) return null;
  if (typeof v === 'number') return `$${v.toLocaleString()}`;
  return String(v).replace(/_/g, ' ');
};

export default function ReqStep4({ data, onSubmit, isLoading }) {
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

      <div className="flex justify-end pt-2">
        <Button onClick={onSubmit} disabled={isLoading} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Submit Requirement
        </Button>
      </div>
    </div>
  );
}