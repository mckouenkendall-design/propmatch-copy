import React, { useState } from 'react';
import {
  itemsForPropertyType,
  amenityGroup,
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

// The row of 5 importance buttons. `compact` shrinks them for nested amenity rows.
function LevelButtons({ itemKey, value, defaultLevel, onChange, compact }) {
  return (
    <div style={{ display: 'flex', gap: compact ? '4px' : '6px', flexWrap: 'wrap' }}>
      {IMPORTANCE_LEVELS.map(level => {
        const selected = (value ?? defaultLevel) === level;
        const color = LEVEL_COLORS[level];
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(itemKey, level)}
            style={{
              flex: '1 1 auto',
              minWidth: compact ? '48px' : '58px',
              padding: compact ? '5px 6px' : '7px 8px',
              borderRadius: '8px',
              border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.15)'}`,
              background: selected ? `${color}22` : 'rgba(255,255,255,0.04)',
              color: selected ? color : 'rgba(255,255,255,0.6)',
              fontFamily: "'Inter', sans-serif",
              fontSize: compact ? '11px' : '12px',
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
  );
}

// One top-level item row. If the item is expandable, shows a toggle that
// reveals the individual amenities beneath it.
function RankerRow({ item, weights, onChange }) {
  const [open, setOpen] = useState(false);

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

  const subItems = item.expandable ? amenityGroup(item.expandable) : [];

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
          {item.label}
        </div>
        {item.expandable && (
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: ACCENT,
              fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {open ? 'Hide' : 'Rank each'}
            <span style={{ fontSize: '10px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
          </button>
        )}
      </div>

      <LevelButtons itemKey={item.key} value={weights?.[item.key]} defaultLevel={item.default} onChange={onChange} />

      {item.expandable && open && subItems.length > 0 && (
        <div style={{ marginTop: '12px', paddingLeft: '12px', borderLeft: `2px solid ${ACCENT}33` }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', lineHeight: 1.4 }}>
            Set importance for individual amenities. Anything left alone follows the group setting above.
          </p>
          {subItems.map(sub => (
            <div key={sub.key} style={{ marginBottom: '10px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '5px' }}>
                {sub.label}
              </div>
              <LevelButtons itemKey={sub.key} value={weights?.[sub.key]} defaultLevel={'normal'} onChange={onChange} compact />
            </div>
          ))}
        </div>
      )}
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
            You Rank What Matters Most to Your Client
          </h3>
          <button type="button" onClick={onReset}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
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
            weights={weights}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
