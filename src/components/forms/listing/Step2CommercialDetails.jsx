import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Upload, FileText, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ACCENT = '#00DBC5';

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{hint}</p>}
    </div>
  );
}
function Num({ field, placeholder, details, setDetail, step }) {
  return <Input type="number" step={step || 1} value={details[field] || ''} onChange={e => setDetail(field, e.target.value)} placeholder={placeholder} />;
}
function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick} className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
      style={{ borderColor: selected ? ACCENT : 'rgba(255,255,255,0.2)', backgroundColor: selected ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)', color: selected ? ACCENT : 'rgba(255,255,255,0.7)' }}>
      {label}
    </button>
  );
}
function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? ACCENT : 'rgba(255,255,255,0.2)' }}>
        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}
function CollapsiblePanel({ title, summary, children, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen || false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{title}</p>
          {!open && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{summary}</p>}
        </div>
        <span className="text-lg leading-none ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
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
function FileUpload({ label, accept, field, details, setDetail, hint }) {
  const ref = useRef();
  const [uploading, setUploading] = React.useState(false);
  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDetail(field, file_url);
    setUploading(false);
  };
  const url = details[field];
  return (
    <Field label={label} hint={hint}>
      <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors"
        style={{ borderColor: url ? ACCENT : '#d1d5db' }} onClick={() => ref.current.click()}>
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {uploading ? <p className="text-sm text-gray-500">Uploading…</p>
          : url ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm text-gray-600 truncate max-w-xs">Uploaded ✓</span>
              <button type="button" onClick={e => { e.stopPropagation(); setDetail(field, ''); }}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload</p>
            </div>
          )}
      </div>
    </Field>
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

// ── Building Amenities ──────────────────────────────────────────────────────
const BUILDING_AMENITIES = [
  { value: 'on_site_management', label: 'On-Site Management' },
  { value: 'security_247', label: '24/7 Security / Controlled Access' },
  { value: 'concierge', label: 'Concierge Services' },
  { value: 'janitorial_common', label: 'Janitorial (Common Areas)' },
  { value: 'mail_room', label: 'Mail Room / Package Handling' },
  { value: 'shared_loading_dock', label: 'Shared Loading Dock' },
  { value: 'lobby_reception', label: 'Lobby / Reception Area' },
  { value: 'shared_conference', label: 'Shared Conference Rooms' },
  { value: 'tenant_lounge', label: 'Tenant Lounge / Break Room' },
  { value: 'fitness_center', label: 'Fitness Center / Gym' },
  { value: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' },
  { value: 'fiber_optic', label: 'Fiber Optic Connectivity' },
  { value: 'multi_isp', label: 'Multiple Internet Providers' },
  { value: 'backup_generator', label: 'Backup Generator' },
  { value: 'ada_building', label: 'ADA Compliant Building' },
  { value: 'elevators', label: 'Elevators' },
  { value: 'covered_parking', label: 'Covered / Garage Parking' },
  { value: 'ev_charging', label: 'EV Charging Stations' },
  { value: 'bicycle_storage', label: 'Bicycle Storage' },
  { value: 'energy_efficient', label: 'Energy Efficient Building' },
  { value: 'leed_certified', label: 'LEED Certified / Green Building' },
];
function BuildingAmenitiesSection({ details, setDetail }) {
  const amenities = details.building_amenities || [];
  const toggle = (val) => setDetail('building_amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const hasOther = amenities.includes('other');
  return (
    <CollapsiblePanel title="Building Amenities" summary={amenities.length > 0 ? `${amenities.length} selected` : 'Shared building-level features & services'}>
      <div className="flex flex-wrap gap-2 pt-1">
        {BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggle(a.value)} />)}
        <Chip label="Other" selected={hasOther} onClick={() => toggle('other')} />
      </div>
      {hasOther && <div className="mt-3"><Input value={details.building_amenities_other || ''} onChange={e => setDetail('building_amenities_other', e.target.value)} placeholder="Describe the amenity…" /></div>}
    </CollapsiblePanel>
  );
}

// ── SALE TYPE SELECTOR ──────────────────────────────────────────────────────
function SaleTypeSelector({ value, onChange }) {
  const opts = [
    { val: 'owner_user', icon: '🏢', label: 'Owner / User', desc: 'Buyer will occupy and operate from this property' },
    { val: 'investment', icon: '📈', label: 'Investment', desc: 'Buyer purchasing for income and returns' },
  ];
  return (
    <div className="space-y-3">
      <SectionTitle>Sale Type</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {opts.map(opt => (
          <button key={opt.val} type="button" onClick={() => onChange(opt.val)}
            style={{ padding: '16px', borderRadius: '12px', border: `2px solid ${value === opt.val ? ACCENT : 'rgba(255,255,255,0.15)'}`, background: value === opt.val ? `${ACCENT}12` : 'rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{opt.icon}</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: value === opt.val ? ACCENT : 'white', margin: '0 0 4px' }}>{opt.label}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SALE INVESTMENT COMPONENTS ──────────────────────────────────────────────
function OfficeSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)" hint="Net Operating Income — income minus operating expenses, before debt">
          <Num field="noi" placeholder="e.g. 150000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Cap Rate (%)" hint="Class A: 4–6% · Class B: 6–8% · Class C: 8–10%">
          <Num field="cap_rate" placeholder="e.g. 7.0" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Occupancy (%)" hint="Current physical occupancy">
          <Num field="occupancy_pct" placeholder="e.g. 92" details={details} setDetail={setDetail} />
        </Field>
        <Field label="WALT (years)" hint="Weighted Average Lease Term — 3+ yrs is investor target">
          <Num field="walt" placeholder="e.g. 4.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Net Rentable Area (SF)">
          <Num field="nra_sf" placeholder="e.g. 25000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Number of Tenants">
          <Num field="num_tenants" placeholder="e.g. 8" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Year Built">
          <Num field="year_built" placeholder="e.g. 2001" details={details} setDetail={setDetail} />
        </Field>
      </div>
      <SectionTitle>Lease & Asset Info</SectionTitle>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <ToggleGroup label="Lease Type" value={details.lease_type || ''} onChange={v => setDetail('lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'fsg', label: 'Full Service' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Recent Major CapEx / Improvements" value={!!details.recent_capex} onChange={v => setDetail('recent_capex', v)} />
        {details.recent_capex && (
          <div className="py-2">
            <Field label="CapEx Amount ($)" hint="Approximate total invested">
              <Num field="capex_amount" placeholder="e.g. 250000" details={details} setDetail={setDetail} />
            </Field>
          </div>
        )}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
      <Field label="Investment Summary">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Highlight occupancy trends, lease expiration schedule, upside potential…" rows={3} />
      </Field>
    </>
  );
}

function MOBSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)">
          <Num field="noi" placeholder="e.g. 200000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Cap Rate (%)" hint="Institutional avg: 6.3% Q1 2026 · Range: 5.5–8.5%">
          <Num field="cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Occupancy (%)">
          <Num field="occupancy_pct" placeholder="e.g. 97" details={details} setDetail={setDetail} />
        </Field>
        <Field label="WALT (years)" hint="Medical tenants typically sign 7–15 yr leases">
          <Num field="walt" placeholder="e.g. 8.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Total SF">
          <Num field="total_sf" placeholder="e.g. 18000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Number of Tenants">
          <Num field="num_tenants" placeholder="e.g. 4" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Annual Rent Escalations (%)" hint="2–3% is standard for MOBs">
          <Num field="annual_rent_escalations" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Year Built">
          <Num field="year_built" placeholder="e.g. 2012" details={details} setDetail={setDetail} />
        </Field>
      </div>
      <SectionTitle>Property & Tenant Info</SectionTitle>
      <ToggleGroup label="Campus Location" value={details.campus_location || ''} onChange={v => setDetail('campus_location', v)}
        options={[{ value: 'on_campus', label: 'On-Campus' }, { value: 'adjacent', label: 'Adjacent' }, { value: 'off_campus', label: 'Off-Campus' }]} />
      <ToggleGroup label="Lease Structure" value={details.lease_type || ''} onChange={v => setDetail('lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'gross', label: 'Gross' }, { value: 'mixed', label: 'Mixed' }]} />
      <ToggleGroup label="Tenancy" value={details.tenancy_type || ''} onChange={v => setDetail('tenancy_type', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }]} />
      <Field label="Tenant Specialty Mix" hint="Press Enter to add each specialty">
        <TagsInput value={details.tenant_specialties || []} onChange={v => setDetail('tenant_specialties', v)} placeholder="e.g. Cardiology, PT, Primary Care (press Enter)" />
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
      <Field label="Investment Summary">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Highlight tenant quality, lease term, payor mix, campus relationship…" rows={3} />
      </Field>
    </>
  );
}

function RetailSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)">
          <Num field="noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Cap Rate (%)" hint="Well-located: 5.5–7.5% · Prime NNN single-tenant: sub-5%">
          <Num field="cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Occupancy (%)">
          <Num field="occupancy_pct" placeholder="e.g. 96" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Gross Leasable Area (SF)">
          <Num field="gla_sf" placeholder="e.g. 35000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Number of Tenants">
          <Num field="num_tenants" placeholder="e.g. 12" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Avg Lease Term Remaining (years)">
          <Num field="avg_lease_remaining" placeholder="e.g. 4.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Traffic Count (vehicles/day)">
          <Num field="traffic_count" placeholder="e.g. 28000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Year Built">
          <Num field="year_built" placeholder="e.g. 2002" details={details} setDetail={setDetail} />
        </Field>
      </div>
      <SectionTitle>Anchor & Lease Info</SectionTitle>
      <Field label="Anchor Tenant" hint="National tenants with long leases drive the most value">
        <Input value={details.anchor_tenant || ''} onChange={e => setDetail('anchor_tenant', e.target.value)}
          placeholder="e.g. Kroger, Walgreens, Dollar General, Starbucks NNN" />
      </Field>
      <ToggleGroup label="Lease Type" value={details.lease_type || ''} onChange={v => setDetail('lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'gross', label: 'Gross' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Grocery-Anchored" value={!!details.grocery_anchored} onChange={v => setDetail('grocery_anchored', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Co-Tenancy Clauses Present" value={!!details.co_tenancy_clauses} onChange={v => setDetail('co_tenancy_clauses', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
      <Field label="Investment Summary">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Highlight anchor quality, occupancy cost ratio, traffic trends, upside…" rows={3} />
      </Field>
    </>
  );
}

function IndustrialFlexSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)" hint="Leave blank if owner-occupied or vacant — priced on $/SF">
          <Num field="noi" placeholder="e.g. 300000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Cap Rate (%)" hint="Industrial: 5–9.5% depending on type and market">
          <Num field="cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Occupancy (%)" hint="For multi-tenant assets">
          <Num field="occupancy_pct" placeholder="e.g. 100" details={details} setDetail={setDetail} />
        </Field>
        <Field label="WALT (years)" hint="If tenanted">
          <Num field="walt" placeholder="e.g. 3.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Total Land / Lot (acres)" hint="Excess land = value-add">
          <Num field="total_acres" placeholder="e.g. 4.5" step="0.1" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Year Built">
          <Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} />
        </Field>
      </div>
      <SectionTitle>Key Physical Specs</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 60000" details={details} setDetail={setDetail} /></Field>
        <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 28" details={details} setDetail={setDetail} /></Field>
        <Field label="# Dock-High Doors"><Num field="dock_doors" placeholder="e.g. 6" details={details} setDetail={setDetail} /></Field>
        <Field label="# Drive-In Doors"><Num field="drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Office % of Total"><Num field="office_pct" placeholder="e.g. 15" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Tenancy & Lease</SectionTitle>
      <ToggleGroup label="Tenancy" value={details.tenancy_type || ''} onChange={v => setDetail('tenancy_type', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }, { value: 'owner_occupied', label: 'Owner-Occupied' }]} />
      <ToggleGroup label="Lease Type" value={details.lease_type || ''} onChange={v => setDetail('lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'mg', label: 'Modified Gross' }, { value: 'gross', label: 'Gross' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power" value={!!details.three_phase} onChange={v => setDetail('three_phase', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
      <Field label="Investment Summary">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Highlight tenant quality, lease term, physical attributes driving demand…" rows={3} />
      </Field>
    </>
  );
}

// Special use sale sub-type components
function SelfStorageSale({ details, setDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Total Units / Spaces"><Num field="total_units" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
      <Field label="Climate-Controlled Units"><Num field="climate_units" placeholder="e.g. 120" details={details} setDetail={setDetail} /></Field>
      <Field label="Occupied Units"><Num field="occupied_units" placeholder="e.g. 285" details={details} setDetail={setDetail} /></Field>
      <Field label="Occupancy (%)"><Num field="occupancy_pct" placeholder="e.g. 95" details={details} setDetail={setDetail} /></Field>
      <Field label="Avg Monthly Unit Rent ($)"><Num field="avg_unit_rent" placeholder="e.g. 85" details={details} setDetail={setDetail} /></Field>
      <Field label="NOI / Year ($)"><Num field="noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} /></Field>
      <Field label="Cap Rate (%)" hint="Class A urban: 5% · Secondary: 6–7% · Value-add: 8–10%">
        <Num field="cap_rate" placeholder="e.g. 7.0" step="0.1" details={details} setDetail={setDetail} />
      </Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2008" details={details} setDetail={setDetail} /></Field>
      <div className="col-span-2 rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
    </div>
  );
}
function HotelSale({ details, setDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="# of Rooms"><Num field="num_rooms" placeholder="e.g. 120" details={details} setDetail={setDetail} /></Field>
        <Field label="ADR ($)" hint="Average Daily Rate"><Num field="adr" placeholder="e.g. 145" details={details} setDetail={setDetail} /></Field>
        <Field label="RevPAR ($)" hint="Revenue Per Available Room — primary hotel metric"><Num field="revpar" placeholder="e.g. 112" details={details} setDetail={setDetail} /></Field>
        <Field label="Occupancy (%)"><Num field="occupancy_pct" placeholder="e.g. 77" details={details} setDetail={setDetail} /></Field>
        <Field label="NOI / Year ($)"><Num field="noi" placeholder="e.g. 900000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 8.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1998" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Last Renovated" hint="Optional"><Num field="year_renovated" placeholder="e.g. 2019" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Brand / Flag" value={details.hotel_brand || ''} onChange={v => setDetail('hotel_brand', v)}
        options={[{ value: 'branded', label: 'Branded / Flagged' }, { value: 'independent', label: 'Independent' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={v => setDetail('value_add', v)} />
      </div>
    </div>
  );
}
function GasStationSale({ details, setDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="# of Fuel Pumps"><Num field="num_pumps" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Monthly Fuel Volume (gallons)"><Num field="monthly_fuel_gallons" placeholder="e.g. 150000" details={details} setDetail={setDetail} /></Field>
        <Field label="C-Store Revenue / Year ($)"><Num field="cstore_revenue" placeholder="e.g. 420000" details={details} setDetail={setDetail} /></Field>
        <Field label="NOI / Year ($)"><Num field="noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 7.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Brand" value={details.gas_brand || ''} onChange={v => setDetail('gas_brand', v)}
        options={[{ value: 'branded', label: 'Branded (BP, Shell, etc.)' }, { value: 'unbranded', label: 'Unbranded / Independent' }]} />
      <ToggleGroup label="Property Ownership" value={details.property_ownership || ''} onChange={v => setDetail('property_ownership', v)}
        options={[{ value: 'fee_simple', label: 'Fee Simple (own land)' }, { value: 'land_lease', label: 'Land Lease' }]} />
    </div>
  );
}
function CarWashSale({ details, setDetail }) {
  return (
    <div className="space-y-4">
      <ToggleGroup label="Car Wash Type" value={details.carwash_type || ''} onChange={v => setDetail('carwash_type', v)}
        options={[{ value: 'express', label: 'Express / Tunnel' }, { value: 'full_service', label: 'Full Service' }, { value: 'self_serve', label: 'Self-Serve' }]} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Active Monthly Memberships"><Num field="memberships" placeholder="e.g. 1200" details={details} setDetail={setDetail} /></Field>
        <Field label="Membership Revenue (% of total)"><Num field="membership_revenue_pct" placeholder="e.g. 65" details={details} setDetail={setDetail} /></Field>
        <Field label="Avg Daily Wash Volume"><Num field="daily_wash_volume" placeholder="e.g. 350" details={details} setDetail={setDetail} /></Field>
        <Field label="NOI / Year ($)"><Num field="noi" placeholder="e.g. 500000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 7.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2018" details={details} setDetail={setDetail} /></Field>
      </div>
    </div>
  );
}
function ChurchSchoolSale({ details, setDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Seating / Student Capacity"><Num field="seating_capacity" placeholder="e.g. 400" details={details} setDetail={setDetail} /></Field>
      <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 18000" details={details} setDetail={setDetail} /></Field>
      <Field label="Acreage"><Num field="acres" placeholder="e.g. 3.5" step="0.1" details={details} setDetail={setDetail} /></Field>
      <Field label="Parking Spaces"><Num field="parking" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1985" details={details} setDetail={setDetail} /></Field>
      <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. P-1 Public" /></Field>
      <div className="col-span-2">
        <ToggleGroup label="Condition" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
          options={[{ value: 'A', label: 'Excellent' }, { value: 'B', label: 'Good' }, { value: 'C', label: 'Fair / Needs Work' }]} />
      </div>
    </div>
  );
}

const SPECIAL_SALE_SUBTYPES = [
  { value: 'self_storage', label: 'Self-Storage' },
  { value: 'hotel', label: 'Hotel / Motel' },
  { value: 'gas_station', label: 'Gas Station / C-Store' },
  { value: 'car_wash', label: 'Car Wash' },
  { value: 'church_school', label: 'Church / School / Civic' },
  { value: 'other', label: 'Other Special Use' },
];

function SpecialUseSaleInvestment({ details, setDetail }) {
  const subType = details.sale_sub_type || '';
  return (
    <>
      <SectionTitle>Special Use Type</SectionTitle>
      <Field label="What type of special use property is this?">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={subType} onChange={e => setDetail('sale_sub_type', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select type</option>
          {SPECIAL_SALE_SUBTYPES.map(t => <option key={t.value} value={t.value} style={{ background: '#0E1318' }}>{t.label}</option>)}
        </select>
      </Field>
      {subType && <SectionTitle>Investment Details</SectionTitle>}
      {subType === 'self_storage'  && <SelfStorageSale  details={details} setDetail={setDetail} />}
      {subType === 'hotel'         && <HotelSale         details={details} setDetail={setDetail} />}
      {subType === 'gas_station'   && <GasStationSale    details={details} setDetail={setDetail} />}
      {subType === 'car_wash'      && <CarWashSale        details={details} setDetail={setDetail} />}
      {subType === 'church_school' && <ChurchSchoolSale  details={details} setDetail={setDetail} />}
      {subType === 'other' && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="NOI / Year ($)"><Num field="noi" placeholder="e.g. 200000" details={details} setDetail={setDetail} /></Field>
          <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 7.5" step="0.1" details={details} setDetail={setDetail} /></Field>
          <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 12000" details={details} setDetail={setDetail} /></Field>
          <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
          <div className="col-span-2">
            <Field label="Investment Summary">
              <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
                placeholder="Describe the property, its income, and investment highlights…" rows={3} />
            </Field>
          </div>
        </div>
      )}
    </>
  );
}

// ── EXISTING LEASE COMPONENTS (unchanged) ───────────────────────────────────
const SPACE_AMENITIES = [
  { value: 'reception', label: 'Reception Area' }, { value: 'kitchenette', label: 'Kitchenette' },
  { value: 'server_room', label: 'Server Room' }, { value: 'storage', label: 'File / Storage Room' },
  { value: 'natural_light', label: 'Natural Light / Windows' }, { value: 'access_247', label: '24/7 Access' },
];
const LAYOUT_OPTIONS = [
  { value: 'open_plan', label: 'Open Plan' }, { value: 'partitioned', label: 'Partitioned' },
  { value: 'executive_suite', label: 'Executive Suite' }, { value: 'mixed', label: 'Mixed' }, { value: 'other', label: 'Other' },
];

function OfficeDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (val) => setDetail('amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const hasRestrooms = !!details.in_suite_restrooms;
  return (
    <>
      <SectionTitle>Layout & Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 200" /></Field>
        <Field label="Number of Offices"><Num field="offices" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Conference Rooms"><Num field="conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="In-Suite Restrooms" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && <div className="pb-2"><Field label="Restroom Pairs" hint={`${details.in_suite_restrooms || 1} Men's + ${details.in_suite_restrooms || 1} Women's`}><Num field="in_suite_restrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field></div>}
        {!hasRestrooms && <p className="text-xs pb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Shared floor restrooms (standard)</p>}
      </div>
      <Field label="Layout Type">
        <div className="flex flex-wrap gap-2">{LAYOUT_OPTIONS.map(opt => <Chip key={opt.value} label={opt.label} selected={details.layout === opt.value} onClick={() => setDetail('layout', opt.value)} />)}</div>
      </Field>
      <SectionTitle>In-Suite / Space Features</SectionTitle>
      <Field label="Select all that apply">
        <div className="flex flex-wrap gap-2">{SPACE_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggleAmenity(a.value)} />)}</div>
      </Field>
      <Field label="In-Suite IT Infrastructure"><Input value={details.it_infrastructure || ''} onChange={e => setDetail('it_infrastructure', e.target.value)} placeholder="e.g., Cat6 wiring, dedicated fiber drop" /></Field>
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tags" hint="Keywords"><Input value={details.tags || ''} onChange={e => setDetail('tags', e.target.value)} placeholder="e.g. renovated, corner location" /></Field>
        <Field label="Parking Ratio" hint="Spaces per 1,000 SF"><Input value={details.parking_ratio || ''} onChange={e => setDetail('parking_ratio', e.target.value)} placeholder="e.g. 4/1,000 SF" /></Field>
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height"><Input value={details.ceiling_height || ''} onChange={e => setDetail('ceiling_height', e.target.value)} placeholder="e.g. 9 ft" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2" /></Field>
      </div>
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Available" value={!!details.dedicated_parking} onChange={v => setDetail('dedicated_parking', v)} />
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const MEDICAL_FEATURES = [
  { value: 'xray', label: 'X-Ray Room / Shielding' }, { value: 'medical_gas', label: 'Medical Gas Lines' },
  { value: 'sterilization', label: 'Sterilization Area' }, { value: 'ada', label: 'ADA Compliant' }, { value: 'hipaa', label: 'HIPAA Compliant Layout' },
];

function MedicalOfficeDetails({ details, setDetail }) {
  const features = details.medical_features || [];
  const toggleFeature = (val) => setDetail('medical_features', features.includes(val) ? features.filter(f => f !== val) : [...features, val]);
  return (
    <>
      <SectionTitle>Exam & Procedure Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 300" /></Field>
        <Field label="Exam Rooms"><Num field="exam_rooms" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Procedure Rooms"><Num field="procedure_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Lab Space (SF)"><Num field="lab_sf" placeholder="e.g. 400" details={details} setDetail={setDetail} /></Field>
        <Field label="Waiting Room Capacity"><Num field="waiting_capacity" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>In-Suite / Practice-Specific Features</SectionTitle>
      <Field label="Select all that apply">
        <div className="flex flex-wrap gap-2">{MEDICAL_FEATURES.map(f => <Chip key={f.value} label={f.label} selected={features.includes(f.value)} onClick={() => toggleFeature(f.value)} />)}</div>
      </Field>
      <Field label="Medical Waste Disposal"><Input value={details.waste_disposal || ''} onChange={e => setDetail('waste_disposal', e.target.value)} placeholder="e.g., Sharps containers, biohazard" /></Field>
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking Ratio" hint="Spaces per 1,000 SF"><Input value={details.parking_ratio || ''} onChange={e => setDetail('parking_ratio', e.target.value)} placeholder="e.g. 5/1,000 SF" /></Field>
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height"><Input value={details.ceiling_height || ''} onChange={e => setDetail('ceiling_height', e.target.value)} placeholder="e.g. 9 ft" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. O-1 Medical" /></Field>
      </div>
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Available" value={!!details.dedicated_parking} onChange={v => setDetail('dedicated_parking', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Valet Parking Available" value={!!details.valet_parking} onChange={v => setDetail('valet_parking', v)} />
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const RETAIL_SPECIAL_FEATURES = [
  { key: 'drive_thru', label: 'Drive-Thru Window' }, { key: 'grease_trap', label: 'Grease Trap' },
  { key: 'venting_hood', label: 'Venting / Hood' }, { key: 'cold_storage', label: 'Cold Storage / Walk-in Freezer' },
  { key: 'outdoor_seating', label: 'Outdoor Seating / Patio' }, { key: 'capped_utilities', label: 'Capped / Stubbed Utilities' },
  { key: 'showroom', label: 'Dedicated Showroom' }, { key: 'fitting_rooms', label: 'Fitting Rooms' },
  { key: 'high_end_lighting', label: 'High-End Lighting' }, { key: 'rear_loading', label: 'Rear Loading / Alley Access' },
  { key: 'vault', label: 'Secure Vault / Safe Room' }, { key: 'medical_flooring', label: 'Medical Grade Flooring' },
  { key: 'auto_bay', label: 'Auto Bay / Garage Doors' },
];

function RetailDetails({ details, setDetail }) {
  const [featuresOpen, setFeaturesOpen] = React.useState(false);
  const features = details.retail_features || [];
  const toggleFeature = (key) => setDetail('retail_features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);
  const hasRestrooms = !!details.in_suite_restrooms;
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  return (
    <>
      <SectionTitle>Primary Retail Specs</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 150" /></Field>
        <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 2500" details={details} setDetail={setDetail} /></Field>
        <Field label="Sales Floor SF"><Num field="sales_floor_sf" placeholder="e.g. 1800" details={details} setDetail={setDetail} /></Field>
        <Field label="Street Frontage (ft)"><Num field="frontage" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height (ft)"><Num field="ceiling_height" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
        <Field label="Traffic Count (vehicles/day)"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Signage Rights">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={selectStyle}
          value={details.signage_rights || ''} onChange={e => setDetail('signage_rights', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select signage type</option>
          {['Building','Pylon / Monument','Electronic','Window','None'].map(s => <option key={s} value={s} style={{ background: '#0E1318' }}>{s}</option>)}
        </select>
      </Field>
      <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />
      <ToggleGroup label="Foot Traffic" value={details.foot_traffic || ''} onChange={v => setDetail('foot_traffic', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button type="button" onClick={() => setFeaturesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <span>Special Features {features.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: ACCENT }}>{features.length} selected</span>}</span>
          <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>{featuresOpen ? '−' : '+'}</span>
        </button>
        {featuresOpen && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {RETAIL_SPECIAL_FEATURES.map((f, idx) => (
              <React.Fragment key={f.key}>
                <Toggle label={f.label} value={features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
                {idx < RETAIL_SPECIAL_FEATURES.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
              </React.Fragment>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
            <Toggle label="Other" value={!!details.feature_other} onChange={v => setDetail('feature_other', v ? '' : undefined)} />
            {details.feature_other !== undefined && <div className="pb-2 pt-1"><Input value={details.feature_other || ''} onChange={e => setDetail('feature_other', e.target.value)} placeholder="Describe the feature…" /></div>}
          </div>
        )}
      </div>
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="ADA Compliant" value={!!details.ada_compliant} onChange={v => setDetail('ada_compliant', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <Toggle label="In-Suite Restrooms" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && <div className="pb-2 pt-1"><Field label="Restroom Pairs" hint={`${details.in_suite_restrooms || 1} Men's + ${details.in_suite_restrooms || 1} Women's`}><Num field="in_suite_restrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field></div>}
      </div>
      <SectionTitle>Property Details & Media</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. C-2" /></Field>
      </div>
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Shared Parking Access" value={!!details.shared_parking_access} onChange={v => setDetail('shared_parking_access', v)} />
      </div>
      <ToggleGroup label="Parking Type" value={details.parking_type || ''} onChange={v => setDetail('parking_type', v)}
        options={[{ value: 'surface_lot', label: 'Surface Lot' }, { value: 'garage', label: 'Garage' }, { value: 'street', label: 'Street' }, { value: 'valet', label: 'Valet' }]} />
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <Field label="Anchor Tenants"><Textarea value={details.anchor_tenants || ''} onChange={e => setDetail('anchor_tenants', e.target.value)} placeholder="e.g. Target, Starbucks" rows={2} /></Field>
      <Field label="Nearby Businesses"><TagsInput value={details.nearby_businesses || []} onChange={v => setDetail('nearby_businesses', v)} /></Field>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const AMPERAGE_OPTIONS = ['200A','400A','600A','800A','1000A','1200A','1600A','2000A+'];
const SYSTEMS_CHECKLIST = [
  { key: 'sprinkler', label: 'Sprinkler System' }, { key: 'esfr', label: 'ESFR Sprinklers' },
  { key: 'hvac_warehouse', label: 'Warehouse HVAC (Conditioned)' }, { key: 'led_lighting', label: 'LED Warehouse Lighting' }, { key: 'skylights', label: 'Skylights' },
];
const DOCK_EQUIPMENT = [{ key: 'dock_levelers', label: 'Levelers' }, { key: 'dock_seals', label: 'Seals' }, { key: 'dock_restraints', label: 'Restraints' }];

function IndustrialFlexDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const systems = details.systems || [];
  const toggleSystem = (key) => setDetail('systems', systems.includes(key) ? systems.filter(s => s !== key) : [...systems, key]);
  const dockEq = details.dock_equipment || [];
  const toggleDockEq = (key) => setDetail('dock_equipment', dockEq.includes(key) ? dockEq.filter(d => d !== key) : [...dockEq, key]);
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  return (
    <>
      <SectionTitle>Primary Loading & Access</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Loading Docks / Dock-Height Doors"><Num field="dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Drive-In / Grade-Level Doors"><Num field="drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Truck Court Depth (ft)"><Input value={details.truck_court_depth || ''} onChange={e => setDetail('truck_court_depth', e.target.value)} placeholder="e.g. 130" /></Field>
        <Field label="Column Spacing (ft)"><Input value={details.column_spacing || ''} onChange={e => setDetail('column_spacing', e.target.value)} placeholder="e.g. 50 x 50" /></Field>
        <Field label="Loading Bay Size (ft)"><Input value={details.loading_bay_size || ''} onChange={e => setDetail('loading_bay_size', e.target.value)} placeholder="e.g. 100 x 50" /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Cross-Dock Capable" value={!!details.cross_dock} onChange={() => toggleBool('cross_dock')} />
      </div>
      <SectionTitle>Power & Infrastructure</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amperage">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={selectStyle}
            value={details.power_amps || ''} onChange={e => setDetail('power_amps', e.target.value)}>
            <option value="" style={{ background: '#0E1318' }}>Select amperage</option>
            {AMPERAGE_OPTIONS.map(a => <option key={a} value={a} style={{ background: '#0E1318' }}>{a}</option>)}
          </select>
        </Field>
        <Field label="Additional Power Specs"><Input value={details.power_specs || ''} onChange={e => setDetail('power_specs', e.target.value)} placeholder="e.g. 480V, 3-Phase" /></Field>
      </div>
      <ToggleGroup label="Power Voltage" value={details.power_voltage || ''} onChange={v => setDetail('power_voltage', v)}
        options={[{ value: '240v', label: '240V' }, { value: '480v', label: '480V' }, { value: 'other', label: 'Other' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power" value={!!details.three_phase} onChange={() => toggleBool('three_phase')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Substation On-Site" value={!!details.substation_on_site} onChange={() => toggleBool('substation_on_site')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Crane System"><Input value={details.crane_system || ''} onChange={e => setDetail('crane_system', e.target.value)} placeholder="e.g. 10-ton bridge crane" /></Field>
        <Field label="Hook Height (ft)"><Num field="hook_height" placeholder="e.g. 22" details={details} setDetail={setDetail} /></Field>
        <Field label="Floor Load (lbs/sqft)"><Num field="floor_load" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Space Composition & Systems</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Office % of Total" hint="Helps distinguish Flex vs. Warehouse"><Num field="office_pct" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Showroom SF"><Num field="showroom_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Systems Checklist">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {SYSTEMS_CHECKLIST.map((s, idx) => (
            <React.Fragment key={s.key}>
              <Toggle label={s.label} value={systems.includes(s.key)} onChange={() => toggleSystem(s.key)} />
              {idx < SYSTEMS_CHECKLIST.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </Field>
      <SectionTitle>Exterior & Site Details</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[['rail_access','Rail Access'],['fenced_yard','Fenced / Secured Yard'],['outside_storage','Outside Storage Allowed'],['gated_access','Gated Access'],['security_cameras','Security Cameras']].map(([key, label], idx) => (
          <React.Fragment key={key}>
            <Toggle label={label} value={!!details[key]} onChange={() => toggleBool(key)} />
            {idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
      </div>
      <Field label="Dock Equipment">
        <div className="flex flex-wrap gap-2">{DOCK_EQUIPMENT.map(d => <Chip key={d.key} label={d.label} selected={dockEq.includes(d.key)} onClick={() => toggleDockEq(d.key)} />)}</div>
      </Field>
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, highlights, and ideal use…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking"><Input value={details.parking || ''} onChange={e => setDetail('parking', e.target.value)} placeholder="e.g. 40 spaces, truck parking" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. M-1, I-2" /></Field>
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

function LandDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const utilities = details.utilities_to_site || [];
  const toggleUtility = (key) => setDetail('utilities_to_site', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography || [];
  const toggleTopo = (key) => setDetail('topography', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  const optStyle = { background: '#0E1318', color: 'rgba(255,255,255,0.85)' };
  const Sel = ({ field, opts, placeholder }) => (
    <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={selectStyle}
      value={details[field] || ''} onChange={e => setDetail(field, e.target.value)}>
      <option value="" style={optStyle}>{placeholder}</option>
      {opts.map(o => <option key={o} value={o} style={optStyle}>{o}</option>)}
    </select>
  );
  return (
    <>
      <CollapsiblePanel title="Property Access & Road Quality" summary={[details.road_surface, details.access_type].filter(Boolean).join(' · ') || 'Tap to configure'}>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Field label="Road Surface"><Sel field="road_surface" opts={['Paved/Asphalt','Concrete','Gravel','Dirt/Unimproved']} placeholder="Select surface" /></Field>
          <Field label="Access Type"><Sel field="access_type" opts={['Direct Frontage','Easement/Deeded','Shared Drive','Private Road']} placeholder="Select access type" /></Field>
        </div>
        <Toggle label={`Road Maintenance: ${details.road_maintenance === 'private' ? 'Privately Maintained' : 'Publicly Maintained'}`} value={details.road_maintenance === 'private'} onChange={v => setDetail('road_maintenance', v ? 'private' : 'public')} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Location Setting & Environment" summary={[details.location_setting, details.visibility].filter(Boolean).join(' · ') || 'Tap to configure'}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location Setting"><Sel field="location_setting" opts={['Highway Frontage','Main Road','Industrial Park','Suburban/Residential','Rural/Country']} placeholder="Select setting" /></Field>
          <Field label="Visibility"><Sel field="visibility" opts={['High Visibility','Average','Hidden/Private']} placeholder="Select visibility" /></Field>
        </div>
      </CollapsiblePanel>
      <SectionTitle>Primary Land Dimensions</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Acreage"><Num field="acres" placeholder="e.g. 5.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Lot Dimensions (ft × ft)"><Input value={details.lot_dimensions || ''} onChange={e => setDetail('lot_dimensions', e.target.value)} placeholder="e.g. 300 x 725" /></Field>
        <Field label="Gross Square Feet"><Num field="gross_sqft" placeholder="e.g. 217800" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Toggle label="Divisible" value={!!details.divisible} onChange={v => setDetail('divisible', v)} /></div>
      <SectionTitle>Zoning & Development Status</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2, M-1" /></Field>
        <Field label="Entitlements"><Sel field="entitlements" opts={['Raw','Shovel Ready','Site Plan Approved']} placeholder="Select status" /></Field>
        <Field label="Curb Cuts"><Num field="curb_cuts" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Max Build SF"><Num field="max_build_sf" placeholder="e.g. 50000" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Utilities & Infrastructure</SectionTitle>
      <Field label="Utilities to Site">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{key:'municipal_water',label:'Municipal Water'},{key:'sanitary_sewer',label:'Sanitary Sewer'},{key:'electric',label:'Electric'},{key:'natural_gas',label:'Natural Gas'},{key:'fiber_internet',label:'Fiber / Internet'}].map((u, idx) => (
            <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <Field label="Perc Test Status"><Sel field="perc_test" opts={['Completed','Needs Testing','Not Required']} placeholder="Select status" /></Field>
      <SectionTitle>Physical Site Characteristics</SectionTitle>
      <Field label="Topography (select all that apply)">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{key:'level',label:'Level / Flat'},{key:'wooded',label:'Wooded'},{key:'cleared',label:'Cleared'},{key:'wetlands',label:'Wetlands / Marsh'},{key:'sloped',label:'Sloped'}].map((t, idx) => (
            <React.Fragment key={t.key}><Toggle label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Road Frontage (ft)"><Num field="road_frontage" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
        <Field label="Traffic Count (vehicles/day)"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Environmental Phase 1 Completed" value={!!details.phase1_completed} onChange={v => setDetail('phase1_completed', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Survey Available" value={!!details.survey_available} onChange={v => setDetail('survey_available', v)} />
      </div>
      <SectionTitle>Property Details & Media</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Annual Property Tax ($)"><Num field="annual_tax" placeholder="e.g. 8500" details={details} setDetail={setDetail} /></Field>
        <Field label="Parcel Number"><Input value={details.parcel_number || ''} onChange={e => setDetail('parcel_number', e.target.value)} placeholder="e.g. 12-34-567-890" /></Field>
        <Field label="Zoning Overlay"><Input value={details.zoning_overlay || ''} onChange={e => setDetail('zoning_overlay', e.target.value)} placeholder="e.g. Opportunity Zone" /></Field>
      </div>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the site, its highlights, and development potential…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure / Site Plan (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF" />
      </div>
    </>
  );
}

const SPECIAL_USE_TYPES = ['Religious/Church','Educational/School','Hospitality/Hotel','Event Center/Banquet','Sports/Recreation','Automotive/Specialty','Other'];
const SPECIAL_INFRA = [
  { key: 'commercial_kitchen', label: 'Commercial Kitchen' }, { key: 'stage_platform', label: 'Stage / Platform' },
  { key: 'gymnasium', label: 'Gymnasium' }, { key: 'assembly_hall', label: 'Large Assembly Hall' },
  { key: 'sound_acoustic', label: 'Sound / Acoustic Treatment' }, { key: 'commercial_laundry', label: 'Commercial Laundry' },
  { key: 'elevator_access', label: 'Elevator Access' },
];
const SU_BUILDING_AMENITIES = [
  { value: 'on_site_management', label: 'On-Site Management' }, { value: 'security_247', label: '24/7 Security / Controlled Access' },
  { value: 'janitorial_common', label: 'Janitorial (Common Areas)' }, { value: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' },
  { value: 'fiber_optic', label: 'Fiber Optic Connectivity' }, { value: 'backup_generator', label: 'Backup Generator' },
  { value: 'ada_building', label: 'ADA Compliant Building' }, { value: 'elevators', label: 'Elevators' },
  { value: 'covered_parking', label: 'Covered / Garage Parking' }, { value: 'ev_charging', label: 'EV Charging Stations' },
  { value: 'energy_efficient', label: 'Energy Efficient Building' }, { value: 'leed_certified', label: 'LEED Certified / Green Building' },
];

function SpecialUseDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const buildingAmenities = details.building_amenities || [];
  const toggleBA = (val) => setDetail('building_amenities', buildingAmenities.includes(val) ? buildingAmenities.filter(a => a !== val) : [...buildingAmenities, val]);
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  return (
    <>
      <SectionTitle>Current Use & Classification</SectionTitle>
      <Field label="Current Specific Use">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={selectStyle}
          value={details.specific_use || ''} onChange={e => setDetail('specific_use', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select current use</option>
          {SPECIAL_USE_TYPES.map(t => <option key={t} value={t} style={{ background: '#0E1318' }}>{t}</option>)}
        </select>
      </Field>
      {details.specific_use === 'Other' && <Field label="Describe Current Use"><Input value={details.specific_use_other || ''} onChange={e => setDetail('specific_use_other', e.target.value)} placeholder="e.g., Funeral Home, Bowling Alley" /></Field>}
      <SectionTitle>Key Capacity & Size</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
        <Field label="Acreage"><Num field="acres" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Seating Capacity" hint="Sanctuaries, theaters, stadiums"><Num field="seating_capacity" placeholder="e.g. 500" details={details} setDetail={setDetail} /></Field>
        <Field label="Bed / Room Count" hint="Hotels or Assisted Living"><Num field="bed_room_count" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Specialty Infrastructure</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {SPECIAL_INFRA.map((f, idx) => (
          <React.Fragment key={f.key}>
            <Toggle label={f.label} value={!!details[f.key]} onChange={() => toggleBool(f.key)} />
            {idx < SPECIAL_INFRA.length && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <Toggle label="ADA Compliant" value={!!details.ada_compliant} onChange={() => toggleBool('ada_compliant')} />
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Specialty Equipment Included" value={!!details.specialty_equipment} onChange={() => toggleBool('specialty_equipment')} />
      </div>
      {details.specialty_equipment && <Field label="List Specialty Equipment"><Textarea value={details.specialty_equipment_list || ''} onChange={e => setDetail('specialty_equipment_list', e.target.value)} placeholder="e.g., Dental chairs, Commercial ovens…" rows={3} /></Field>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Structural Modifications"><Input value={details.structural_modifications || ''} onChange={e => setDetail('structural_modifications', e.target.value)} placeholder="e.g., Reinforced floors, soundproofing" /></Field>
        <Field label="HVAC / Environmental Systems"><Input value={details.hvac_systems_details || ''} onChange={e => setDetail('hvac_systems_details', e.target.value)} placeholder="e.g., High-capacity HVAC, air filtration" /></Field>
      </div>
      <SectionTitle>Building Amenities</SectionTitle>
      <CollapsiblePanel title="Building Amenities" summary={buildingAmenities.length > 0 ? `${buildingAmenities.length} selected` : 'Shared building-level features & services'}>
        <div className="flex flex-wrap gap-2 pt-1">{SU_BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={buildingAmenities.includes(a.value)} onClick={() => toggleBA(a.value)} />)}</div>
      </CollapsiblePanel>
      <SectionTitle>Site & Compliance</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking Spaces"><Num field="parking" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. C-3, P-1" /></Field>
        <Field label="Zoning Overlay"><Input value={details.zoning_overlay || ''} onChange={e => setDetail('zoning_overlay', e.target.value)} placeholder="e.g. Historical District" /></Field>
        <Field label="Licensing Status"><Input value={details.licensing_status || ''} onChange={e => setDetail('licensing_status', e.target.value)} placeholder="e.g., Licensed daycare, State-approved school" /></Field>
      </div>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the property, its unique features, and ideal use…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function ListStep2Commercial({ data, update, onNext }) {
  const details   = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type      = data.property_type;
  const isSale    = data.transaction_type === 'sale';

  // Commercial always defaults to investment when sale. Land has no default — user must pick.
  const saleTypeDefault = type === 'land' ? null : 'investment';
  const saleType = details.sale_type || saleTypeDefault;

  const showLease      = !isSale || saleType === 'owner_user';
  const showInvestment = isSale && saleType === 'investment';

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>{isSale ? ' sale' : ' space'}.
      </p>

      {/* Sale type selector — all commercial types when transaction is sale */}
      {isSale && (
        <SaleTypeSelector value={saleType} onChange={v => setDetail('sale_type', v)} />
      )}

      {/* Lease content (also used for owner/user sale) */}
      {showLease && (
        <>
          {type === 'office'          && <OfficeDetails         details={details} setDetail={setDetail} />}
          {type === 'medical_office'  && <MedicalOfficeDetails  details={details} setDetail={setDetail} />}
          {type === 'retail'          && <RetailDetails         details={details} setDetail={setDetail} />}
          {type === 'industrial_flex' && <IndustrialFlexDetails details={details} setDetail={setDetail} />}
          {type === 'land'            && <LandDetails           details={details} setDetail={setDetail} />}
          {type === 'special_use'     && <SpecialUseDetails     details={details} setDetail={setDetail} />}
        </>
      )}

      {/* Investment sale content */}
      {showInvestment && (
        <>
          {type === 'office'          && <OfficeSaleInvestment          details={details} setDetail={setDetail} />}
          {type === 'medical_office'  && <MOBSaleInvestment             details={details} setDetail={setDetail} />}
          {type === 'retail'          && <RetailSaleInvestment          details={details} setDetail={setDetail} />}
          {type === 'industrial_flex' && <IndustrialFlexSaleInvestment  details={details} setDetail={setDetail} />}
          {type === 'land'            && <LandDetails                   details={details} setDetail={setDetail} />}
          {type === 'special_use'     && <SpecialUseSaleInvestment      details={details} setDetail={setDetail} />}
        </>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: ACCENT }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}