import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';

const ACCENT = '#818cf8'; // lavender — requirement color

function CollapsiblePanel({ title, summary, children, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen || false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
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
// Preferred amenities a tenant can request. Mirrors the listing building + space amenities
// (including Cafe / Grab-and-Go) so requirements can ask for anything a listing can advertise.
const PREFERRED_AMENITIES = [
  { value: 'access_247', label: '24/7 Access' },
  { value: 'ada_building', label: 'ADA Compliant Building' },
  { value: 'natural_light', label: 'Natural Light' },
  { value: 'fitness_center', label: 'Fitness Center / Gym' },
  { value: 'cafe_food_service', label: 'Cafe / Food Service' },
  { value: 'covered_parking', label: 'Covered / Garage Parking' },
  { value: 'ev_charging', label: 'EV Charging Stations' },
  { value: 'elevators', label: 'Elevators' },
  { value: 'shared_loading_dock', label: 'Shared Loading Dock' },
  { value: 'shared_conference', label: 'Shared Conference Rooms' },
  { value: 'tenant_lounge', label: 'Tenant Lounge / Break Room' },
  { value: 'grab_and_go', label: 'Grab-and-Go Station' },
  { value: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' },
  { value: 'golf_simulator', label: 'Golf Simulator' },
  { value: 'backup_generator', label: 'Backup Generator' },
  { value: 'janitorial_common', label: 'Janitorial (Common Areas)' },
];

const MEDICAL_SPECIALTIES = ['Primary Care', 'Dental', 'Cardiology', 'Orthopedic', 'Dermatology', 'Oncology', 'Imaging / Radiology', 'Physical Therapy', 'Dialysis', 'Urgent Care', 'Pediatrics', 'Ophthalmology', 'Other'];

const AMPERAGE_OPTIONS = ['200A', '400A', '600A', '800A', '1000A', '1200A', '1600A', '2000A+'];

// Reusable preferred-amenities picker for requirement forms.
function PreferredAmenities({ details, setDetail }) {
  const selected = details.preferred_amenities || [];
  const toggle = (v) => setDetail('preferred_amenities', selected.includes(v) ? selected.filter(a => a !== v) : [...selected, v]);
  return (
    <CollapsiblePanel title="Preferred Amenities" summary={selected.length > 0 ? `${selected.length} selected` : 'Building features your client wants'}>
      <div className="flex flex-wrap gap-2 pt-1">
        {PREFERRED_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={selected.includes(a.value)} onClick={() => toggle(a.value)} />)}
      </div>
    </CollapsiblePanel>
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
// ══════════════════════════════════════════════════════════════════════════════
// INVESTMENT CRITERIA — appended at the bottom of a commercial SALE requirement.
// No separate sale-type mode: the normal lease-requirement form always shows, and
// when the transaction is a sale we add this compact minimums block underneath.
// Option A — just the core min financial fields, no extra asset-preference toggles.
// ══════════════════════════════════════════════════════════════════════════════

const REQ_FINANCIAL_FIELDS = {
  office: [
    { field: 'min_noi', label: 'Min NOI / Year ($)', placeholder: 'e.g. 100000', hint: 'Net Operating Income' },
    { field: 'min_cap_rate', label: 'Min Cap Rate (%)', placeholder: 'e.g. 6.0', step: '0.1', hint: 'Class A: 4–6% · Class B: 6–8%' },
    { field: 'min_occupancy', label: 'Min Occupancy (%)', placeholder: 'e.g. 85' },
    { field: 'min_walt', label: 'Min WALT (years)', placeholder: 'e.g. 3', step: '0.1', hint: 'Weighted Average Lease Term' },
    { field: 'min_nra_sf', label: 'Min Net Rentable Area (SF)', placeholder: 'e.g. 15000' },
  ],
  medical_office: [
    { field: 'min_noi', label: 'Min NOI / Year ($)', placeholder: 'e.g. 150000' },
    { field: 'min_cap_rate', label: 'Min Cap Rate (%)', placeholder: 'e.g. 5.5', step: '0.1', hint: 'MOB avg: ~6.3% Q1 2026' },
    { field: 'min_occupancy', label: 'Min Occupancy (%)', placeholder: 'e.g. 90' },
    { field: 'min_walt', label: 'Min WALT (years)', placeholder: 'e.g. 5', step: '0.1', hint: 'Medical tenants sign 7–15 yr leases' },
    { field: 'min_rent_escalations', label: 'Min Annual Rent Escalations (%)', placeholder: 'e.g. 2.0', step: '0.1' },
  ],
  retail: [
    { field: 'min_noi', label: 'Min NOI / Year ($)', placeholder: 'e.g. 120000' },
    { field: 'min_cap_rate', label: 'Min Cap Rate (%)', placeholder: 'e.g. 5.5', step: '0.1', hint: 'Well-located: 5.5–7.5%' },
    { field: 'min_occupancy', label: 'Min Occupancy (%)', placeholder: 'e.g. 90' },
    { field: 'min_gla_sf', label: 'Min GLA (SF)', placeholder: 'e.g. 20000' },
    { field: 'min_avg_lease_remaining', label: 'Min Avg Lease Term Remaining (yrs)', placeholder: 'e.g. 3', step: '0.1' },
    { field: 'min_traffic_count', label: 'Min Traffic Count (vehicles/day)', placeholder: 'e.g. 20000' },
  ],
  industrial_flex: [
    { field: 'min_noi', label: 'Min NOI / Year ($)', placeholder: 'e.g. 200000', hint: 'Leave blank if targeting vacant / owner-occupied' },
    { field: 'min_cap_rate', label: 'Min Cap Rate (%)', placeholder: 'e.g. 5.5', step: '0.1', hint: 'Industrial: 5–9.5% by type/market' },
    { field: 'max_price_per_sf', label: 'Max Price / SF ($)', placeholder: 'e.g. 110', hint: 'Use when targeting vacant or owner-occupied deals' },
    { field: 'min_occupancy', label: 'Min Occupancy (%)', placeholder: 'e.g. 85' },
    { field: 'min_walt', label: 'Min WALT (years)', placeholder: 'e.g. 2', step: '0.1' },
  ],
  special_use: [
    { field: 'min_noi', label: 'Min NOI / Year ($)', placeholder: 'e.g. 150000' },
    { field: 'min_cap_rate', label: 'Min Cap Rate (%)', placeholder: 'e.g. 6.5', step: '0.1' },
  ],
};

function InvestmentCriteria({ type, details, setDetail }) {
  const fields = REQ_FINANCIAL_FIELDS[type];
  if (!fields) return null;
  return (
    <>
      <SectionTitle>Investment Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          f.field === 'max_price_per_sf'
            ? <Field key={f.field} label={f.label} hint={f.hint}><Num field={f.field} placeholder={f.placeholder} step={f.step} details={details} setDetail={setDetail} /></Field>
            : <MinField key={f.field} label={f.label} field={f.field} placeholder={f.placeholder} step={f.step} hint={f.hint} details={details} setDetail={setDetail} />
        ))}
      </div>
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
        <Field label="Offices Needed"><Num field="offices_needed" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Conference Rooms Needed"><Num field="conf_rooms_needed" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Parking Spaces Needed"><Num field="min_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
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
      <SectionTitle>Amenities</SectionTitle>
      <PreferredAmenities details={details} setDetail={setDetail} />
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Any other must-haves for your office space…" rows={2} />
      </Field>
    </>
  );
}

function MedicalOfficeRequirement({ details, setDetail }) {
  const specialties = details.specialties || [];
  const toggleSpecialty = (s) => setDetail('specialties', specialties.includes(s) ? specialties.filter(x => x !== s) : [...specialties, s]);
  return (
    <>
      <SectionTitle>Clinical Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
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
        <Toggle label="Sterilization Area Required" value={!!details.sterilization_req} onChange={v => setDetail('sterilization_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="HIPAA Compliant Layout Required" value={!!details.hipaa_req} onChange={v => setDetail('hipaa_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Lab Space Required" value={!!details.lab_req} onChange={v => setDetail('lab_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Suite Restrooms Required" value={!!details.in_suite_restrooms_req} onChange={v => setDetail('in_suite_restrooms_req', v)} />
      </div>
      <ToggleGroup label="Campus Location" value={details.campus_pref || ''} onChange={v => setDetail('campus_pref', v)}
        options={[{ value: 'on_campus', label: 'On-Campus' }, { value: 'adjacent', label: 'Adjacent' }, { value: 'off_campus', label: 'Off-Campus' }, { value: 'any', label: 'Any' }]} />
      <Field label="Specialty / Practice Type (select all that apply)">
        <div className="flex flex-wrap gap-2">
          {MEDICAL_SPECIALTIES.map(s => <Chip key={s} label={s} selected={specialties.includes(s)} onClick={() => toggleSpecialty(s)} />)}
        </div>
      </Field>
      <SectionTitle>Amenities</SectionTitle>
      <PreferredAmenities details={details} setDetail={setDetail} />
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
        <Field label="Expected Capacity" hint="People (occupancy)"><Num field="expected_capacity" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Street Frontage (ft)" hint="Informational"><Num field="min_frontage" placeholder="e.g. 25" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Preferred Space Dimensions</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Preferred Length (ft)"><Num field="pref_length" placeholder="e.g. 60" details={details} setDetail={setDetail} /></Field>
        <Field label="Preferred Width (ft)"><Num field="pref_width" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
        <Field label="Preferred Ceiling Height (ft)"><Num field="pref_ceiling_height" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Traffic Count" value={details.traffic_tier_pref || ''} onChange={v => setDetail('traffic_tier_pref', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }, { value: 'any', label: 'Any' }]} />
      {details.traffic_tier_pref && details.traffic_tier_pref !== 'any' && <Field label="Min Traffic Count (vehicles/day)" hint="Optional — informational only"><Num field="min_traffic_count" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>}
      <ToggleGroup label="Location Type" value={details.location_type_pref || ''} onChange={v => setDetail('location_type_pref', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'mixed_use', label: 'Within Mixed-Use Building' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Foot Traffic" value={details.foot_traffic_pref || ''} onChange={v => setDetail('foot_traffic_pref', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium+' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="ADA Compliant Required" value={!!details.ada_req} onChange={v => setDetail('ada_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <Toggle label="In-Suite Restrooms Required" value={!!details.in_suite_restrooms_req} onChange={v => setDetail('in_suite_restrooms_req', v)} />
      </div>
      <SectionTitle>Special Requirements</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Drive-Thru Required" value={!!details.drive_thru_req} onChange={v => setDetail('drive_thru_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Hood / Venting Required" value={!!details.hood_req} onChange={v => setDetail('hood_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Grease Trap Required" value={!!details.grease_trap_req} onChange={v => setDetail('grease_trap_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Cold Storage / Walk-in Freezer Required" value={!!details.cold_storage_req} onChange={v => setDetail('cold_storage_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outdoor Seating Required" value={!!details.outdoor_seating_req} onChange={v => setDetail('outdoor_seating_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Rear Loading / Alley Access Required" value={!!details.rear_loading_req} onChange={v => setDetail('rear_loading_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Auto Bay / Garage Doors Required" value={!!details.auto_bay_req} onChange={v => setDetail('auto_bay_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Signage (Building / Pylon) Required" value={!!details.signage_req} onChange={v => setDetail('signage_req', v)} />
      </div>
      <ToggleGroup label="Building Class Preference" value={details.building_class_pref || ''} onChange={v => setDetail('building_class_pref', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B+' }, { value: 'C', label: 'Class C+' }, { value: 'any', label: 'Any' }]} />
      <Field label="Business Type / Concept">
        <Input value={details.business_type || ''} onChange={e => setDetail('business_type', e.target.value)} placeholder="e.g. QSR restaurant, boutique retail, medical spa" />
      </Field>
      <Field label="Co-Tenancy Preference" hint="Neighbors you want nearby or want to avoid (informational)">
        <Input value={details.co_tenancy_pref || ''} onChange={e => setDetail('co_tenancy_pref', e.target.value)} placeholder="e.g. near grocery anchor, avoid competing QSR" />
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
        <Field label="Min Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 18" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Dock-High Doors"><Num field="min_dock_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Drive-In Doors"><Num field="min_drive_in_doors" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Truck Court Depth (ft)"><Num field="min_truck_court" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Floor Load (lbs/sqft)"><Num field="min_floor_load" placeholder="e.g. 250" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Land / Lot (acres)"><Num field="min_acres" placeholder="e.g. 1.0" step="0.1" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Power & Yard</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Amperage">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            value={details.min_amperage || ''} onChange={e => setDetail('min_amperage', e.target.value)}>
            <option value="" style={{ background: '#0E1318' }}>No preference</option>
            {AMPERAGE_OPTIONS.map(a => <option key={a} value={a} style={{ background: '#0E1318' }}>{a}</option>)}
          </select>
        </Field>
      </div>
      <ToggleGroup label="Power Voltage Preference" value={details.voltage_pref || ''} onChange={v => setDetail('voltage_pref', v)}
        options={[{ value: '240v', label: '240V' }, { value: '480v', label: '480V' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power Required" value={!!details.three_phase_req} onChange={v => setDetail('three_phase_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Fenced / Secured Yard Required" value={!!details.fenced_yard_req} onChange={v => setDetail('fenced_yard_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Crane System Required" value={!!details.crane_req} onChange={v => setDetail('crane_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Rail Access Required" value={!!details.rail_access_req} onChange={v => setDetail('rail_access_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outside Storage Permitted Required" value={!!details.outside_storage_req} onChange={v => setDetail('outside_storage_req', v)} />
      </div>
      <SectionTitle>Systems & Equipment</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="ESFR Sprinklers Required" value={!!details.esfr_req} onChange={v => setDetail('esfr_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Warehouse HVAC (Conditioned) Required" value={!!details.warehouse_hvac_req} onChange={v => setDetail('warehouse_hvac_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Skylights Required" value={!!details.skylights_req} onChange={v => setDetail('skylights_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="LED Lighting Required" value={!!details.led_lighting_req} onChange={v => setDetail('led_lighting_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Dock Levelers Required" value={!!details.dock_levelers_req} onChange={v => setDetail('dock_levelers_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Dock Seals Required" value={!!details.dock_seals_req} onChange={v => setDetail('dock_seals_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Dock Restraints Required" value={!!details.dock_restraints_req} onChange={v => setDetail('dock_restraints_req', v)} />
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
  const utilities = details.utilities_req || [];
  const toggleUtility = (key) => setDetail('utilities_req', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  return (
    <>
      {/* Acreage range is collected in Step 1 (shown as "Acreage Range" for land)
          and scored by the shared Size comparison. Do not add it again here. */}
      <SectionTitle>Buildability & Access</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Must Be Buildable / Developable" value={!!details.buildable_req} onChange={v => setDetail('buildable_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Must Have Direct Site Access (no landlocked parcels)" value={!!details.site_access_req} onChange={v => setDetail('site_access_req', v)} />
      </div>
      <SectionTitle>Site Characteristics</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="No Wetlands / No Flood Zone" value={!!details.no_wetlands_req} onChange={v => setDetail('no_wetlands_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Prefer Flat / Level Land" value={!!details.flat_req} onChange={v => setDetail('flat_req', v)} />
      </div>
      <ToggleGroup label="Road Surface Preference" value={details.road_surface_pref || ''} onChange={v => setDetail('road_surface_pref', v)}
        options={[{ value: 'paved', label: 'Paved' }, { value: 'gravel', label: 'Gravel OK' }, { value: 'any', label: 'Any' }]} />
      <SectionTitle>Utilities Needed at Site</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[{ key: 'municipal_water', label: 'Municipal Water' }, { key: 'sanitary_sewer', label: 'Sanitary Sewer' }, { key: 'electric', label: 'Electric' }, { key: 'natural_gas', label: 'Natural Gas' }, { key: 'fiber_internet', label: 'Fiber / Internet' }].map((u, idx) => (
          <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
        ))}
      </div>
      <SectionTitle>Informational Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Road Frontage (ft)" hint="Informational"><Num field="min_frontage" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Traffic Count (vehicles/day)" hint="Informational"><Num field="min_traffic_count" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Acceptable Zoning" hint="Informational — tag each acceptable zone type">
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
        <Field label="Min Seating / Capacity"><Num field="min_seating" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Bed / Room Count" hint="Hotels or Assisted Living"><Num field="min_bed_room_count" placeholder="e.g. 50" details={details} setDetail={setDetail} /></Field>
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
  // The requirement Step 1 form stores the buy-side transaction as 'purchase'
  // (the listing side stores 'sale'). This previously checked only for 'sale',
  // so it was never true on a requirement — which meant the Investment Criteria
  // block below never rendered and there was nowhere to enter a minimum cap
  // rate, NOI, or occupancy. 'sale' is kept as a fallback for any legacy rows.
  const isSale    = data.transaction_type === 'purchase' || data.transaction_type === 'sale';

  // Commercial sales show the normal requirement form plus an Investment Criteria
  // block appended at the bottom. Land is investment-agnostic (no criteria block).
  const showCriteria = isSale && type !== 'land';

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Tell us what you need in a <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>{isSale ? ' purchase' : ' space'}.
      </p>

      {type === 'office'          && <OfficeRequirement        details={details} setDetail={setDetail} />}
      {type === 'medical_office'  && <MedicalOfficeRequirement details={details} setDetail={setDetail} />}
      {type === 'retail'          && <RetailRequirement        details={details} setDetail={setDetail} />}
      {type === 'industrial_flex' && <IndustrialFlexRequirement details={details} setDetail={setDetail} />}
      {type === 'land'            && <LandRequirement          details={details} setDetail={setDetail} />}
      {type === 'special_use'     && <SpecialUseRequirement    details={details} setDetail={setDetail} />}

      {showCriteria && <InvestmentCriteria type={type} details={details} setDetail={setDetail} />}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: '#00DBC5' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}