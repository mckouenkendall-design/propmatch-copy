import React from 'react';
import {
  itemsForPropertyType,
  IMPORTANCE_LEVELS,
  IMPORTANCE_LABELS,
} from '@/utils/clientWeightDefaults';

const ACCENT = '#00DBC5';

// Colors for each importance level's selected state.
const LEVEL_COLORS = {
  none: '#6B7280',
  low: '#94A3B8',
  normal: '#00DBC5',
  high: '#F59E0B',
  dealbreaker: '#EF4444',
};

// One row: item label + the 5 importance buttons (or a locked pill).
function RankerRow({ item, value, onChange }) {
  if (item.default === 'locked') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: 0.55 }}>
        <div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>{item.label}</div>
          {item.note && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.note}</div>}
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>
          Required
        </span>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
        {item.label}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {IMPORTANCE_LEVELS.map(level => {
          const selected = value === level;
          const color = LEVEL_COLORS[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(item.key, level)}
              style={{
                flex: '1 1 auto',
                minWidth: '58px',
                padding: '7px 8px',
                borderRadius: '8px',
                border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.15)'}`,
                background: selected ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: selected ? color : 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: selected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
              }}
            >
              {IMPORTANCE_LABELS[level]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The full ranker screen. `weights` is the current client_weights object,
// `onChange(key, level)` updates one item, `onReset` restores defaults.
export default function ClientPriorityRanker({ propertyType, weights, onChange, onReset }) {
  const items = itemsForPropertyType(propertyType);

  if (items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
          Custom priority ranking isn't available for this property type yet. Your requirement will use PropMatch's default scoring.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>
            Rank What Matters to Your Client
          </h3>
          <button type="button" onClick={onReset}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Reset to Default
          </button>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.4 }}>
          These are pre-set to PropMatch's recommended priorities. Adjust any that matter more or less to this specific client. Mark something a <span style={{ color: LEVEL_COLORS.dealbreaker, fontWeight: 600 }}>Dealbreaker</span> and listings without it won't match at all.
        </p>
      </div>

      <div>
        {items.map(item => (
          <RankerRow
            key={item.key}
            item={item}
            value={weights?.[item.key] ?? item.default}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
