import React from 'react';
import { Label } from '@/components/ui/label';

export default function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? '' : opt.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all"
            style={{
              borderColor: value === opt.value ? 'var(--tiffany-blue)' : '#e5e7eb',
              backgroundColor: value === opt.value ? '#e6f7f5' : 'white',
              color: value === opt.value ? '#3A8A82' : '#6b7280'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}