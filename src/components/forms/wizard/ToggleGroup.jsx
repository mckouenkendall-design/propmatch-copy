import React from 'react';
import { Label } from '@/components/ui/label';

export default function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      {label && <Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>}
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value === value ? '' : opt.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all"
            style={{
              borderColor: value === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
              backgroundColor: value === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
              color: value === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}