import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';

const ACCENT = '#818cf8'; // lavender — requirement color

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{hint}</p>}
      {children}
    </div>
  );
}
function Num({ field, placeholder, details, setDetail, step }) {
  return (
    <input type="number" step={step || 1} value={details[field] || ''} onChange={e => setDetail(field, e.target.value)}
      placeholder={placeholder}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
  );
}
function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide pb-2"
        style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</h3>
    </div>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? ACCENT : 'rgba(255,255,255,0.2)' }}>
        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}
function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
      style={{ borderColor: selected ? ACCENT : 'rgba(255,255,255,0.2)', backgroundColor: selected ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)', color: selected ? ACCENT : 'rgba(255,255,255,0.7)' }}>
      {label}
    </button>
  );
}
function TagsInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = React.useState('');
  const handleKey = (e) => {
    if (e.key === 'Enter' && input.trim()) { e.preventDefault(); if (!value.includes(input.trim())) onChange([...value, input.trim()]); setInput(''); }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ACCENT }}>
            {tag}<button type="button" onClick={() => onChange(value.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={placeholder || 'Press Enter to add'} />
    </div>
  );
}
// Minimum-only number field (for investment requirements)
function MinField({ label, field, placeholder, hint, details, setDetail, step }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <span className="text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>Min</span>
        <Num field={field} placeholder={placeholder} details={details} setDetail={setDetail} step={step} />
      </div>
    </Field>
  );
}

// ── SALE TYPE SELECTOR ───────────────────────────────────────────────────────
function SaleTypeSelector({ value, onChange }) {
  const opts = [
    { val: 'owner_user', icon: '🏢', label: 'Owner / User', desc: 'Will occupy and operate from this property' },
    { val: 'investment', icon: '📈', label: 'Investment', desc: 'Purchasing for income and returns' },
  ];
  return (
    <div className="space-y-3">
      <SectionTitle>Sale Type Looking For</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {opts.map(opt => (
          <button key={opt.val} type="button" onClick={() => onChange(opt.val)}
            style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${value === opt.val ? ACCENT : 'rgba(255,255,255,0.15)'}`, background: value === opt.val ? `${ACCENT}12` : 'rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{opt.icon}</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: value === opt.val ? ACCENT : 'white', margin: '0 0 4px' }}>{opt.label}</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SALE INVESTMENT REQUIREMENT COMPONENTS ───────────────────────────────────
// All financial fields are MINIMUMS — buyer must see at least this threshold to match

function OfficeRequirementSaleInvestment({ details, setDetail }) {
  const classes = details.building_class_pref || [];
  const toggleClass = (v) => setDetail('building_class_pref', classes.includes(v) ? classes.filter(c => c !== v) : [...classes, v]);
  return (
    <>
      <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 100000" hint="Net Operating Income" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 6.0" step="0.1" hint="Class A: 4–6% · Class B: 6–8%" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 85" details={details} setDetail={setDetail} />
        <MinField label="Min WALT (years)" field="min_walt" placeholder="e.g. 3" step="0.1" hint="Weighted Average Lease Term" details={details} setDetail={setDetail} />
        <MinField label="Min Net Rentable Area (SF)" field="min_nra_sf" placeholder="e.g. 15000" details={details} setDetail={setDetail} />
      </div>
      <SectionTitle>Asset Preferences</SectionTitle>
      <Field label="Building Class (select all acceptable)">
        <div className="flex flex-wrap gap-2">
          {[{v:'A',l:'Class A'},{v:'B',l:'Class B'},{v:'C',l:'Class C'}].map(o => (
            <Chip key={o.v} label={o.l} selected={classes.includes(o.v)} onClick={() => toggleClass(o.v)} />
          ))}
        </div>
      </Field>
      <ToggleGroup label="Lease Type Preference" value={details.lease_type_pref || ''} onChange={v => setDetail('lease_type_pref', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'fsg', label: 'Full Service' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting 6.5%+ cap, prefer stabilized assets, open to light value-add with strong tenancy…" rows={3} />
      </Field>
    </>
  );
}

function MOBRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 150000" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 5.5" step="0.1" hint="MOB avg: ~6.3% Q1 2026" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 90" details={details} setDetail={setDetail} />
        <MinField label="Min WALT (years)" field="min_walt" placeholder="e.g. 5" step="0.1" hint="Medical tenants sign 7–15 yr leases" details={details} setDetail={setDetail} />
        <MinField label="Min Total SF" field="min_sf" placeholder="e.g. 10000" details={details} setDetail={setDetail} />
        <MinField label="Min Annual Rent Escalations (%)" field="min_rent_escalations" placeholder="e.g. 2.0" step="0.1" details={details} setDetail={setDetail} />
      </div>
      <SectionTitle>Property Preferences</SectionTitle>
      <ToggleGroup label="Campus Location Preference" value={details.campus_pref || ''} onChange={v => setDetail('campus_pref', v)}
        options={[{ value: 'on_campus', label: 'On-Campus' }, { value: 'adjacent', label: 'Adjacent' }, { value: 'off_campus', label: 'Off-Campus' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Lease Structure Preference" value={details.lease_type_pref || ''} onChange={v => setDetail('lease_type_pref', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'gross', label: 'Gross' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Tenancy" value={details.tenancy_pref || ''} onChange={v => setDetail('tenancy_pref', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }, { value: 'any', label: 'Any' }]} />
      <Field label="Preferred Tenant Specialties" hint="Press Enter to add each">
        <TagsInput value={details.preferred_specialties || []} onChange={v => setDetail('preferred_specialties', v)} placeholder="e.g. Primary Care, Cardiology (press Enter)" />
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting NNN leased MOBs near hospital systems, 7+ yr WALT preferred…" rows={3} />
      </Field>
    </>
  );
}

function RetailRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 120000" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 5.5" step="0.1" hint="Well-located: 5.5–7.5%" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 90" details={details} setDetail={setDetail} />
        <MinField label="Min GLA (SF)" field="min_gla_sf" placeholder="e.g. 20000" details={details} setDetail={setDetail} />
        <MinField label="Min Avg Lease Term Remaining (yrs)" field="min_avg_lease_remaining" placeholder="e.g. 3" step="0.1" details={details} setDetail={setDetail} />
      </div>
      <SectionTitle>Asset Preferences</SectionTitle>
      <ToggleGroup label="Lease Type Preference" value={details.lease_type_pref || ''} onChange={v => setDetail('lease_type_pref', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Grocery-Anchored Required" value={!!details.grocery_anchored_req} onChange={v => setDetail('grocery_anchored_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Open to Value-Add / Repositioning" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Preferred Anchor Tenants">
        <TagsInput value={details.preferred_anchors || []} onChange={v => setDetail('preferred_anchors', v)} placeholder="e.g. Walgreens, Dollar General (press Enter)" />
      </Field>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting grocery-anchored centers, NNN leases, 6%+ cap, stable metro markets…" rows={3} />
      </Field>
    </>
  );
}

function IndustrialFlexRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 200000" hint="Leave blank if targeting owner-occupied" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 5.5" step="0.1" hint="Industrial: 5–9.5% by type/market" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 85" details={details} setDetail={setDetail} />
        <MinField label="Min WALT (years)" field="min_walt" placeholder="e.g. 2" step="0.1" details={details} setDetail={setDetail} />
        <MinField label="Min Total SF" field="min_sf" placeholder="e.g. 40000" details={details} setDetail={setDetail} />
        <MinField label="Min Clear Height (ft)" field="min_clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} />
        <MinField label="Min Dock-High Doors" field="min_dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} />
        <MinField label="Min Land / Lot (acres)" field="min_acres" placeholder="e.g. 2" step="0.1" details={details} setDetail={setDetail} />
      </div>
      <SectionTitle>Asset Preferences</SectionTitle>
      <ToggleGroup label="Tenancy Preference" value={details.tenancy_pref || ''} onChange={v => setDetail('tenancy_pref', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Lease Type Preference" value={details.lease_type_pref || ''} onChange={v => setDetail('lease_type_pref', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power Required" value={!!details.three_phase_req} onChange={v => setDetail('three_phase_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting Class A/B NNN industrial, 5.5%+ cap, 24 ft+ clear height, strong logistics corridor…" rows={3} />
      </Field>
    </>
  );
}

const SPECIAL_SALE_REQ_TYPES = [
  { value: 'self_storage', label: 'Self-Storage' },
  { value: 'hotel', label: 'Hotel / Motel' },
  { value: 'gas_station', label: 'Gas Station / C-Store' },
  { value: 'car_wash', label: 'Car Wash' },
  { value: 'church_school', label: 'Church / School / Civic' },
  { value: 'any', label: 'Open to Any Special Use' },
];

function SpecialUseRequirementSaleInvestment({ details, setDetail }) {
  const subType = details.sale_sub_type || '';
  return (
    <>
      <SectionTitle>Special Use Type Sought</SectionTitle>
      <Field label="What type of special use investment are you targeting?">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={subType} onChange={e => setDetail('sale_sub_type', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select type</option>
          {SPECIAL_SALE_REQ_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: '#0E1318' }}>{t.label}</option>)}
        </select>
      </Field>

      {/* Self-Storage criteria */}
      {subType === 'self_storage' && (
        <>
          <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement.</p>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min Units / Spaces" field="min_units" placeholder="e.g. 150" details={details} setDetail={setDetail} />
            <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 85" details={details} setDetail={setDetail} />
            <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 120000" details={details} setDetail={setDetail} />
            <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
          </div>
          <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <Toggle label="Climate-Controlled Units Required" value={!!details.climate_req} onChange={v => setDetail('climate_req', v)} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
            <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
          </div>
        </>
      )}

      {/* Hotel criteria */}
      {subType === 'hotel' && (
        <>
          <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement.</p>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min Rooms" field="min_rooms" placeholder="e.g. 60" details={details} setDetail={setDetail} />
            <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 65" details={details} setDetail={setDetail} />
            <MinField label="Min RevPAR ($)" field="min_revpar" placeholder="e.g. 80" hint="Revenue Per Available Room" details={details} setDetail={setDetail} />
            <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 500000" details={details} setDetail={setDetail} />
            <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 7.5" step="0.1" details={details} setDetail={setDetail} />
          </div>
          <ToggleGroup label="Brand Preference" value={details.hotel_brand_pref || ''} onChange={v => setDetail('hotel_brand_pref', v)}
            options={[{ value: 'branded', label: 'Branded / Flagged' }, { value: 'independent', label: 'Independent' }, { value: 'any', label: 'Any' }]} />
        </>
      )}

      {/* Gas station criteria */}
      {subType === 'gas_station' && (
        <>
          <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement.</p>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min Monthly Fuel Volume (gallons)" field="min_fuel_gallons" placeholder="e.g. 80000" details={details} setDetail={setDetail} />
            <MinField label="Min C-Store Revenue / Year ($)" field="min_cstore_revenue" placeholder="e.g. 200000" details={details} setDetail={setDetail} />
            <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 100000" details={details} setDetail={setDetail} />
            <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
          </div>
          <ToggleGroup label="Property Ownership Preference" value={details.ownership_pref || ''} onChange={v => setDetail('ownership_pref', v)}
            options={[{ value: 'fee_simple', label: 'Fee Simple Only' }, { value: 'land_lease', label: 'Land Lease OK' }, { value: 'any', label: 'Any' }]} />
        </>
      )}

      {/* Car wash criteria */}
      {subType === 'car_wash' && (
        <>
          <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement.</p>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min Active Memberships" field="min_memberships" placeholder="e.g. 500" details={details} setDetail={setDetail} />
            <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 300000" details={details} setDetail={setDetail} />
            <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 6.0" step="0.1" details={details} setDetail={setDetail} />
          </div>
          <ToggleGroup label="Car Wash Type Preference" value={details.carwash_type_pref || ''} onChange={v => setDetail('carwash_type_pref', v)}
            options={[{ value: 'express', label: 'Express / Tunnel' }, { value: 'full_service', label: 'Full Service' }, { value: 'any', label: 'Any' }]} />
        </>
      )}

      {/* Church / School criteria */}
      {subType === 'church_school' && (
        <>
          <SectionTitle>Property Criteria</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min Seating / Capacity" field="min_seating" placeholder="e.g. 200" details={details} setDetail={setDetail} />
            <MinField label="Min Total SF" field="min_sf" placeholder="e.g. 8000" details={details} setDetail={setDetail} />
            <MinField label="Min Acreage" field="min_acres" placeholder="e.g. 1.0" step="0.1" details={details} setDetail={setDetail} />
            <MinField label="Min Parking Spaces" field="min_parking" placeholder="e.g. 100" details={details} setDetail={setDetail} />
          </div>
        </>
      )}

      {/* Any / Generic special use criteria */}
      {subType === 'any' && (
        <>
          <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement.</p>
          <div className="grid grid-cols-2 gap-4">
            <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 150000" details={details} setDetail={setDetail} />
            <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
          </div>
        </>
      )}

      <Field label="Notes / Acquisition Criteria">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Describe your ideal acquisition — target returns, market type, size, value-add appetite…" rows={3} />
      </Field>
    </>
  );
}

// ── EXISTING LEASE REQUIREMENT COMPONENTS (unchanged) ────────────────────────
function OfficeRequirement({ details, setDetail }) {
  const classes = details.building_class_pref || [];
  const toggleClass = (v) => setDetail('building_class_pref', classes.includes(v) ? classes.filter(c => c !== v) : [...classes, v]);
  return (
    <>
      <SectionTitle>Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min SF"><Num field="min_sf" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max SF"><Num field="max_sf" placeholder="e.g. 5000" details={details} setDetail={setDetail} /></Field>
        <Field label="Offices Needed"><Num field="offices_needed" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Conference Rooms Needed"><Num field="conf_rooms_needed" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Layout Preference" value={details.layout_pref || ''} onChange={v => setDetail('layout_pref', v)}
        options={[{ value: 'open_plan', label: 'Open Plan' }, { value: 'partitioned', label: 'Partitioned' }, { value: 'mixed', label: 'Mixed' }, { value: 'flexible', label: 'Flexible' }]} />
      <SectionTitle>Building & Lease Preferences</SectionTitle>
      <Field label="Building Class (select all acceptable)">
        <div className="flex flex-wrap gap-2">
          {[{v:'A',l:'Class A'},{v:'B',l:'Class B'},{v:'C',l:'Class C'}].map(o => (
            <Chip key={o.v} label={o.l} selected={classes.includes(o.v)} onClick={() => toggleClass(o.v)} />
          ))}
        </div>
      </Field>
      <ToggleGroup label="Lease Type" value={details.lease_type_pref || ''} onChange={v => setDetail('lease_type_pref', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'fsg', label: 'Full Service' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Required" value={!!details.dedicated_parking_req} onChange={v => setDetail('dedicated_parking_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Suite Restrooms Required" value={!!details.in_suite_restrooms_req} onChange={v => setDetail('in_suite_restrooms_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Server Room / IT Infrastructure Required" value={!!details.server_room_req} onChange={v => setDetail('server_room_req', v)} />
      </div>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Any other must-haves for your office space…" rows={2} />
      </Field>
    </>
  );
}

function MedicalOfficeRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Clinical Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min SF"><Num field="min_sf" placeholder="e.g. 1500" details={details} setDetail={setDetail} /></Field>
        <Field label="Max SF"><Num field="max_sf" placeholder="e.g. 4000" details={details} setDetail={setDetail} /></Field>
        <Field label="Exam Rooms Needed"><Num field="exam_rooms_needed" placeholder="e.g. 6" details={details} setDetail={setDetail} /></Field>
        <Field label="Procedure Rooms Needed"><Num field="procedure_rooms_needed" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Waiting Room Capacity"><Num field="waiting_capacity_needed" placeholder="e.g. 15" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Parking Ratio" hint="Spaces per 1,000 SF">
          <Input value={details.min_parking_ratio || ''} onChange={e => setDetail('min_parking_ratio', e.target.value)} placeholder="e.g. 4/1,000 SF" />
        </Field>
      </div>
      <SectionTitle>Clinical Infrastructure</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="X-Ray / Shielding Required" value={!!details.xray_req} onChange={v => setDetail('xray_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Medical Gas Lines Required" value={!!details.medical_gas_req} onChange={v => setDetail('medical_gas_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="ADA Compliant Required" value={!!details.ada_req} onChange={v => setDetail('ada_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Lab Space Required" value={!!details.lab_req} onChange={v => setDetail('lab_req', v)} />
      </div>
      <ToggleGroup label="Campus Location" value={details.campus_pref || ''} onChange={v => setDetail('campus_pref', v)}
        options={[{ value: 'on_campus', label: 'On-Campus' }, { value: 'adjacent', label: 'Adjacent' }, { value: 'off_campus', label: 'Off-Campus' }, { value: 'any', label: 'Any' }]} />
      <Field label="Specialty / Practice Type">
        <Input value={details.specialty || ''} onChange={e => setDetail('specialty', e.target.value)} placeholder="e.g. Orthopedics, Primary Care, Dental" />
      </Field>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Any other must-haves for your practice space…" rows={2} />
      </Field>
    </>
  );
}

function RetailRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min SF"><Num field="min_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max SF"><Num field="max_sf" placeholder="e.g. 3000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Street Frontage (ft)"><Num field="min_frontage" placeholder="e.g. 25" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Traffic Count (vehicles/day)"><Num field="min_traffic_count" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Location Type" value={details.location_type_pref || ''} onChange={v => setDetail('location_type_pref', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Foot Traffic" value={details.foot_traffic_pref || ''} onChange={v => setDetail('foot_traffic_pref', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium+' }, { value: 'any', label: 'Any' }]} />
      <SectionTitle>Special Requirements</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Drive-Thru Required" value={!!details.drive_thru_req} onChange={v => setDetail('drive_thru_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Hood / Venting Required" value={!!details.hood_req} onChange={v => setDetail('hood_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Grease Trap Required" value={!!details.grease_trap_req} onChange={v => setDetail('grease_trap_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outdoor Seating Required" value={!!details.outdoor_seating_req} onChange={v => setDetail('outdoor_seating_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Signage (Building / Pylon) Required" value={!!details.signage_req} onChange={v => setDetail('signage_req', v)} />
      </div>
      <Field label="Business Type / Concept">
        <Input value={details.business_type || ''} onChange={e => setDetail('business_type', e.target.value)} placeholder="e.g. QSR restaurant, boutique retail, medical spa" />
      </Field>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Any other must-haves…" rows={2} />
      </Field>
    </>
  );
}

function IndustrialFlexRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min SF"><Num field="min_sf" placeholder="e.g. 10000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max SF"><Num field="max_sf" placeholder="e.g. 50000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 18" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Dock-High Doors"><Num field="min_dock_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Drive-In Doors"><Num field="min_drive_in_doors" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Truck Court Depth (ft)"><Num field="min_truck_court" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Land / Lot (acres)"><Num field="min_acres" placeholder="e.g. 1.0" step="0.1" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Power & Yard</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power Required" value={!!details.three_phase_req} onChange={v => setDetail('three_phase_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Fenced / Secured Yard Required" value={!!details.fenced_yard_req} onChange={v => setDetail('fenced_yard_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Crane System Required" value={!!details.crane_req} onChange={v => setDetail('crane_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outside Storage Permitted Required" value={!!details.outside_storage_req} onChange={v => setDetail('outside_storage_req', v)} />
      </div>
      {details.crane_req && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Crane Capacity (tons)"><Num field="min_crane_tons" placeholder="e.g. 5" details={details} setDetail={setDetail} /></Field>
        </div>
      )}
      <Field label="Intended Use">
        <Input value={details.intended_use || ''} onChange={e => setDetail('intended_use', e.target.value)} placeholder="e.g. Distribution, Manufacturing, Flex Office/Warehouse" />
      </Field>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)} placeholder="Any other must-haves…" rows={2} />
      </Field>
    </>
  );
}

function LandRequirement({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const utilities = details.utilities_req || [];
  const toggleUtility = (key) => setDetail('utilities_req', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography_req || [];
  const toggleTopo = (key) => setDetail('topography_req', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);
  return (
    <>
      <SectionTitle>Size Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Road Frontage (ft)"><Num field="min_frontage" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Entitlements Needed" value={details.entitlements_needed || ''} onChange={v => setDetail('entitlements_needed', v)}
        options={[{ value: 'raw', label: 'Raw OK' }, { value: 'shovel_ready', label: 'Shovel Ready' }, { value: 'approved', label: 'Approved Plan' }]} />
      <SectionTitle>Utilities Required at Site</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[{key:'municipal_water',label:'Municipal Water'},{key:'sanitary_sewer',label:'Sanitary Sewer'},{key:'electric',label:'Electric'},{key:'natural_gas',label:'Natural Gas'},{key:'fiber_internet',label:'Fiber / Internet'}].map((u, idx) => (
          <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
        ))}
      </div>
      <SectionTitle>Site Characteristics</SectionTitle>
      <Field label="Topography Preferred">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{key:'level',label:'Level / Flat'},{key:'wooded',label:'Wooded'},{key:'cleared',label:'Cleared'}].map((t, idx) => (
            <React.Fragment key={t.key}><Toggle label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />{idx < 2 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Perc Test Completed Required" value={!!details.perc_test_req} onChange={() => toggleBool('perc_test_req')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="No Wetlands / No Flood Zone" value={!!details.no_wetlands_req} onChange={() => toggleBool('no_wetlands_req')} />
      </div>
      <Field label="Zoning Acceptable">
        <TagsInput value={details.zoning_acceptable || []} onChange={v => setDetail('zoning_acceptable', v)} placeholder="e.g. B-2, M-1, any commercial (press Enter)" />
      </Field>
      <Field label="Intended Use / Development Plan">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Strip mall, industrial park, self-storage facility…" rows={2} />
      </Field>
    </>
  );
}

const SPECIAL_USE_REQ_TYPES = [
  'Religious/Church','Educational/School','Hospitality/Hotel','Event Center/Banquet',
  'Sports/Recreation','Automotive/Specialty','Any Special Use',
];

function SpecialUseRequirement({ details, setDetail }) {
  const infra = details.required_infra || [];
  const toggleInfra = (key) => setDetail('required_infra', infra.includes(key) ? infra.filter(k => k !== key) : [...infra, key]);
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  return (
    <>
      <SectionTitle>Use & Space Requirements</SectionTitle>
      <Field label="Target Use Type">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={selectStyle}
          value={details.target_use || ''} onChange={e => setDetail('target_use', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select target use</option>
          {SPECIAL_USE_REQ_TYPES.map(t => <option key={t} value={t} style={{ background: '#0E1318' }}>{t}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min SF"><Num field="min_sf" placeholder="e.g. 5000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max SF"><Num field="max_sf" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Seating / Capacity"><Num field="min_seating" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Acreage"><Num field="min_acres" placeholder="e.g. 1.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Parking"><Num field="min_parking" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Required Infrastructure</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[{key:'commercial_kitchen',label:'Commercial Kitchen'},{key:'stage',label:'Stage / Platform'},{key:'gymnasium',label:'Gymnasium'},{key:'large_assembly',label:'Large Assembly Hall'},{key:'ada',label:'ADA Compliant'}].map((f, idx) => (
          <React.Fragment key={f.key}><Toggle label={f.label} value={infra.includes(f.key)} onChange={() => toggleInfra(f.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
        ))}
      </div>
      <Field label="Zoning Requirements">
        <Input value={details.zoning_req || ''} onChange={e => setDetail('zoning_req', e.target.value)} placeholder="e.g. Must allow assembly use, P-1 acceptable" />
      </Field>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Describe must-have features, intended use, conversion potential needed…" rows={2} />
      </Field>
    </>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ReqStep2Commercial({ data, update, onNext }) {
  const details   = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type      = data.property_type;
  const isSale    = data.transaction_type === 'sale';

  // Default to investment for commercial sale (land: no default — force pick)
  const saleTypeDefault = type === 'land' ? null : 'investment';
  const saleType = details.sale_type || saleTypeDefault;

  const showLease      = !isSale || saleType === 'owner_user';
  const showInvestment = isSale && saleType === 'investment';

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Tell us what you need in a <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>{isSale ? ' purchase' : ' space'}.
      </p>

      {isSale && (
        <SaleTypeSelector value={saleType} onChange={v => setDetail('sale_type', v)} />
      )}

      {showLease && (
        <>
          {type === 'office'          && <OfficeRequirement        details={details} setDetail={setDetail} />}
          {type === 'medical_office'  && <MedicalOfficeRequirement details={details} setDetail={setDetail} />}
          {type === 'retail'          && <RetailRequirement        details={details} setDetail={setDetail} />}
          {type === 'industrial_flex' && <IndustrialFlexRequirement details={details} setDetail={setDetail} />}
          {type === 'land'            && <LandRequirement          details={details} setDetail={setDetail} />}
          {type === 'special_use'     && <SpecialUseRequirement    details={details} setDetail={setDetail} />}
        </>
      )}

      {showInvestment && (
        <>
          {type === 'office'          && <OfficeRequirementSaleInvestment          details={details} setDetail={setDetail} />}
          {type === 'medical_office'  && <MOBRequirementSaleInvestment             details={details} setDetail={setDetail} />}
          {type === 'retail'          && <RetailRequirementSaleInvestment          details={details} setDetail={setDetail} />}
          {type === 'industrial_flex' && <IndustrialFlexRequirementSaleInvestment  details={details} setDetail={setDetail} />}
          {type === 'land'            && <LandRequirement                          details={details} setDetail={setDetail} />}
          {type === 'special_use'     && <SpecialUseRequirementSaleInvestment      details={details} setDetail={setDetail} />}
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: '#00DBC5' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}