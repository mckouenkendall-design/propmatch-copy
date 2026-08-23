import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';
import FileUpload from '@/components/forms/shared/FileUpload';

const ACCENT = '#00DBC5';

// ── Shared helpers ────────────────────────────────────────────────────────────
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
  return (
    <Input
      type="number"
      step={step || 1}
      value={details[field] || ''}
      onChange={e => setDetail(field, e.target.value)}
      placeholder={placeholder}
    />
  );
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
      <button type="button" onClick={() => onChange(!value)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
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

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide pb-2" style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</h3>
    </div>
  );
}


function TagsInput({ value = [], onChange }) {
  const [input, setInput] = React.useState('');
  const handleKey = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!value.includes(input.trim())) onChange([...value, input.trim()]);
      setInput('');
    }
  };
  const remove = (tag) => onChange(value.filter(t => t !== tag));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ACCENT }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="e.g., move-in ready (press Enter to add)" />
    </div>
  );
}

// ── Building Amenities ────────────────────────────────────────────────────────
const BUILDING_AMENITIES = [
  { value: 'access_247', label: '24/7 Access' },
  { value: 'ada_building', label: 'ADA Compliant' },
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

function BuildingAmenitiesSection({ details, setDetail }) {
  const amenities = details.building_amenities || [];
  const toggle = (val) => setDetail('building_amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const hasOther = amenities.includes('other');
  const selected = amenities.length;
  return (
    <CollapsiblePanel title="Building Amenities" summary={selected > 0 ? `${selected} selected` : 'Shared building-level features & services'}>
      <div className="flex flex-wrap gap-2 pt-1">
        {BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggle(a.value)} />)}
        <Chip label="Other" selected={hasOther} onClick={() => toggle('other')} />
      </div>
      {hasOther && <div className="mt-3"><Input value={details.building_amenities_other || ''} onChange={e => setDetail('building_amenities_other', e.target.value)} placeholder="Describe the amenity…" /></div>}
    </CollapsiblePanel>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INVESTMENT FINANCIALS — appended at the bottom of any commercial SALE listing.
// No separate "sale type" mode anymore: the normal detail form always shows, and
// when the transaction is a sale we add this compact financials block underneath.
// Only the core financial number fields (Option A) — no extra sale profile toggles.
// ══════════════════════════════════════════════════════════════════════════════

// Core financial fields per property type. Each entry: { field, label, placeholder, hint?, step? }
const SALE_FINANCIAL_FIELDS = {
  office: [
    { field: 'sale_noi', label: 'NOI / Year ($)', placeholder: 'e.g. 180000', hint: 'Net Operating Income — gross income minus operating expenses' },
    { field: 'sale_cap_rate', label: 'Cap Rate (%)', placeholder: 'e.g. 6.5', step: '0.1', hint: 'Class A: 4–6% · Class B: 6–8% · Class C: 8–10%' },
    { field: 'sale_occupancy', label: 'Occupancy (%)', placeholder: 'e.g. 92' },
    { field: 'sale_nra', label: 'Net Rentable Area (SF)', placeholder: 'e.g. 25000' },
    { field: 'sale_num_tenants', label: 'Number of Tenants', placeholder: 'e.g. 6' },
    { field: 'sale_walt', label: 'WALT (years)', placeholder: 'e.g. 3.5', step: '0.1', hint: 'Weighted Avg Lease Term' },
    { field: 'sale_recent_capex', label: 'Recent CapEx ($)', placeholder: 'e.g. 200000', hint: 'Major improvements in last 3 years' },
  ],
  medical_office: [
    { field: 'sale_noi', label: 'NOI / Year ($)', placeholder: 'e.g. 220000' },
    { field: 'sale_cap_rate', label: 'Cap Rate (%)', placeholder: 'e.g. 6.5', step: '0.1', hint: 'National avg institutional quality: ~6.3%' },
    { field: 'sale_occupancy', label: 'Occupancy (%)', placeholder: 'e.g. 95' },
    { field: 'sale_walt', label: 'WALT (years)', placeholder: 'e.g. 7.5', step: '0.1', hint: 'Medical tenants avg 7–10 yr leases' },
    { field: 'sale_num_tenants', label: 'Number of Tenants', placeholder: 'e.g. 4' },
    { field: 'sale_rent_escalation', label: 'Annual Rent Escalations (%)', placeholder: 'e.g. 2.5', step: '0.1', hint: '2–3% is standard for MOBs' },
    { field: 'sale_total_sf', label: 'Total SF', placeholder: 'e.g. 18000' },
  ],
  retail: [
    { field: 'sale_noi', label: 'NOI / Year ($)', placeholder: 'e.g. 150000' },
    { field: 'sale_cap_rate', label: 'Cap Rate (%)', placeholder: 'e.g. 6.0', step: '0.1', hint: 'Based on actual in-place income' },
    { field: 'sale_occupancy', label: 'Occupancy (%)', placeholder: 'e.g. 94' },
    { field: 'sale_gla', label: 'Gross Leasable Area — GLA (SF)', placeholder: 'e.g. 12000' },
    { field: 'sale_num_tenants', label: 'Number of Tenants', placeholder: 'e.g. 8' },
    { field: 'sale_avg_lease_term', label: 'Avg Remaining Lease Term (yrs)', placeholder: 'e.g. 4.5', step: '0.1' },
    { field: 'sale_traffic_count', label: 'Traffic Count (vehicles/day)', placeholder: 'e.g. 28000' },
  ],
  industrial_flex: [
    { field: 'sale_noi', label: 'NOI / Year ($)', placeholder: 'e.g. 120000', hint: 'Leave blank if vacant / owner-occupied' },
    { field: 'sale_cap_rate', label: 'Cap Rate (%)', placeholder: 'e.g. 6.5', step: '0.1' },
    { field: 'sale_occupancy', label: 'Occupancy (%)', placeholder: 'e.g. 100' },
    { field: 'sale_walt', label: 'WALT (years)', placeholder: 'e.g. 4.0', step: '0.1' },
    { field: 'sale_price_per_sf', label: 'Asking Price / SF ($)', placeholder: 'e.g. 95', hint: 'Used when vacant or owner-occupied' },
    { field: 'sale_total_sf', label: 'Total SF', placeholder: 'e.g. 40000' },
    { field: 'sale_office_pct', label: 'Office % of Total SF', placeholder: 'e.g. 20', hint: 'Flex: ~25–30% · Pure warehouse: 5–10%' },
    { field: 'sale_land_acres', label: 'Total Land / Lot (acres)', placeholder: 'e.g. 3.5', step: '0.1' },
  ],
  special_use: [
    { field: 'sale_noi', label: 'NOI / Year ($)', placeholder: 'e.g. 180000' },
    { field: 'sale_cap_rate', label: 'Cap Rate (%)', placeholder: 'e.g. 7.0', step: '0.1', hint: 'Self-storage: 5–10% · Hotels vary widely' },
    { field: 'sale_occupancy', label: 'Occupancy (%)', placeholder: 'e.g. 90' },
    { field: 'sale_total_sf', label: 'Total SF', placeholder: 'e.g. 15000' },
  ],
};

function InvestmentFinancials({ type, details, setDetail }) {
  const fields = SALE_FINANCIAL_FIELDS[type];
  if (!fields) return null;
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>⚡ Optional — fill in if this is an income/investment sale. Use trailing 12-month <strong>actual</strong> income, not pro forma. Buyers will verify.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <Field key={f.field} label={f.label} hint={f.hint}>
            <Num field={f.field} placeholder={f.placeholder} step={f.step} details={details} setDetail={setDetail} />
          </Field>
        ))}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXISTING LEASE COMPONENTS (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

const SPACE_AMENITIES = [
  { value: 'reception', label: 'Reception Area' }, { value: 'kitchenette', label: 'Kitchenette' },
  { value: 'server_room', label: 'Server Room' }, { value: 'storage', label: 'File / Storage Room' },
  { value: 'natural_light', label: 'Natural Light / Windows' }, { value: 'in_suite_restrooms', label: 'In-Suite Restrooms' },
];
const LAYOUT_OPTIONS = [
  { value: 'open_plan', label: 'Open Plan' }, { value: 'partitioned', label: 'Partitioned' },
  { value: 'executive_suite', label: 'Executive Suite' }, { value: 'mixed', label: 'Mixed' }, { value: 'other', label: 'Other' },
];

function OfficeDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (val) => setDetail('amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  return (
    <>
      <SectionTitle>Layout & Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 200" /></Field>
        <Field label="Number of Offices"><Num field="offices" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Conference Rooms"><Num field="conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Layout Type"><div className="flex flex-wrap gap-2">{LAYOUT_OPTIONS.map(opt => <Chip key={opt.value} label={opt.label} selected={details.layout === opt.value} onClick={() => setDetail('layout', opt.value)} />)}</div></Field>
      <SectionTitle>In-Suite / Space Features</SectionTitle>
      <Field label="Select all that apply"><div className="flex flex-wrap gap-2">{SPACE_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggleAmenity(a.value)} />)}</div></Field>
      <Field label="In-Suite IT Infrastructure"><Input value={details.it_infrastructure || ''} onChange={e => setDetail('it_infrastructure', e.target.value)} placeholder="e.g., Cat6 wiring, dedicated fiber drop" /></Field>
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tags" hint="Keywords like 'renovated', 'corner location'"><Input value={details.tags || ''} onChange={e => setDetail('tags', e.target.value)} placeholder="e.g. renovated, corner location" /></Field>
        <Field label="Parking Ratio" hint="Spaces per 1,000 SF"><Input value={details.parking_ratio || ''} onChange={e => setDetail('parking_ratio', e.target.value)} placeholder="e.g. 4/1,000 SF" /></Field>
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height"><Input value={details.ceiling_height || ''} onChange={e => setDetail('ceiling_height', e.target.value)} placeholder="e.g. 9 ft" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2" /></Field>
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

const PRACTICE_TYPES = ['General Practice', 'Dental', 'Cardiology', 'Orthopedic', 'Dermatology', 'Pediatrics', 'Physical Therapy', 'Urgent Care', 'Other Specialty'];
const MEDICAL_FEATURES = [
  { value: 'xray', label: 'X-Ray Room / Shielding' }, { value: 'medical_gas', label: 'Medical Gas Lines' },
  { value: 'sterilization', label: 'Sterilization Area' }, { value: 'hipaa', label: 'HIPAA Compliant Layout' },
  { value: 'lab_space', label: 'Lab Space' }, { value: 'in_suite_restrooms', label: 'In-Suite Restrooms' },
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
        <Field label="Waiting Room Capacity"><Num field="waiting_capacity" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>In-Suite / Practice-Specific Features</SectionTitle>
      <Field label="Select all that apply"><div className="flex flex-wrap gap-2">{MEDICAL_FEATURES.map(f => <Chip key={f.value} label={f.label} selected={features.includes(f.value)} onClick={() => toggleFeature(f.value)} />)}</div></Field>
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
  { key: 'vault', label: 'Secure Vault / Safe Room' }, { key: 'medical_flooring', label: 'Medical Grade Flooring' }, { key: 'auto_bay', label: 'Auto Bay / Garage Doors' },
];

function RetailDetails({ details, setDetail }) {
  const [featuresOpen, setFeaturesOpen] = React.useState(false);
  const features = details.retail_features || [];
  const toggleFeature = (key) => setDetail('retail_features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);
  const hasRestrooms = !!details.in_suite_restrooms;
  return (
    <>
      <SectionTitle>Primary Retail Specs</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 150" /></Field>
        <Field label="Maximum Capacity" hint="People (occupancy limit)"><Num field="max_capacity" placeholder="e.g. 50" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Space Dimensions</SectionTitle>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Length (ft)"><Num field="space_length" placeholder="e.g. 60" details={details} setDetail={setDetail} /></Field>
        <Field label="Width (ft)"><Num field="space_width" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height (ft)"><Num field="ceiling_height" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Street Frontage (ft)" hint="Informational"><Num field="frontage" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Signage Rights">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={details.signage_rights || ''} onChange={e => setDetail('signage_rights', e.target.value)}>
            <option value="" style={{ background: '#0E1318' }}>Select signage type</option>
            {['Building', 'Pylon / Monument', 'Electronic', 'Window', 'None'].map(s => <option key={s} value={s} style={{ background: '#0E1318' }}>{s}</option>)}
          </select>
        </Field>
      </div>
      <ToggleGroup label="Traffic Count" value={details.traffic_tier || ''} onChange={v => setDetail('traffic_tier', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
      {details.traffic_tier && <Field label="Traffic Count (vehicles/day)" hint="Optional — informational only"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>}
      <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }, { value: 'mixed_use', label: 'Within Mixed-Use Building' }]} />
      <ToggleGroup label="Foot Traffic" value={details.foot_traffic || ''} onChange={v => setDetail('foot_traffic', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button type="button" onClick={() => setFeaturesOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
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
        <Field label="Total Parking Spaces" hint="Informational"><Num field="total_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. C-2" /></Field>
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <Field label="Anchor Tenants"><Textarea value={details.anchor_tenants || ''} onChange={e => setDetail('anchor_tenants', e.target.value)} placeholder="e.g. Target, Starbucks" rows={2} /></Field>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const AMPERAGE_OPTIONS = ['200A', '400A', '600A', '800A', '1000A', '1200A', '1600A', '2000A+'];
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
  return (
    <>
      <SectionTitle>Primary Loading & Access</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Loading Docks / Dock-Height Doors"><Num field="dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Drive-In / Grade-Level Doors"><Num field="drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Truck Court Depth (ft)"><Input value={details.truck_court_depth || ''} onChange={e => setDetail('truck_court_depth', e.target.value)} placeholder="e.g. 130" /></Field>
        <Field label="Column Spacing (ft)" hint="Informational"><Input value={details.column_spacing || ''} onChange={e => setDetail('column_spacing', e.target.value)} placeholder="e.g. 50 x 50" /></Field>
        <Field label="Loading Bay Size (ft)" hint="Informational"><Input value={details.loading_bay_size || ''} onChange={e => setDetail('loading_bay_size', e.target.value)} placeholder="e.g. 100 x 50" /></Field>
        <Field label="Total Land / Lot (acres)"><Num field="lot_acres" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Cross-Dock Capable" value={!!details.cross_dock} onChange={() => toggleBool('cross_dock')} />
      </div>
      <SectionTitle>Power & Infrastructure</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amperage">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
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
        <Toggle label="Rail Access" value={!!details.rail_access} onChange={() => toggleBool('rail_access')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Fenced / Secured Yard" value={!!details.fenced_yard} onChange={() => toggleBool('fenced_yard')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outside Storage Allowed" value={!!details.outside_storage} onChange={() => toggleBool('outside_storage')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Gated Access" value={!!details.gated_access} onChange={() => toggleBool('gated_access')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Security Cameras" value={!!details.security_cameras} onChange={() => toggleBool('security_cameras')} />
      </div>
      <Field label="Dock Equipment"><div className="flex flex-wrap gap-2">{DOCK_EQUIPMENT.map(d => <Chip key={d.key} label={d.label} selected={dockEq.includes(d.key)} onClick={() => toggleDockEq(d.key)} />)}</div></Field>
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, highlights, and ideal use…" rows={4} /></Field>
      <Field label="Building Condition Notes" hint="Roof age, concrete condition, HVAC/electric/plumbing age — informational"><Textarea value={details.condition_notes || ''} onChange={e => setDetail('condition_notes', e.target.value)} placeholder="e.g. Roof replaced 2022, concrete in good shape, HVAC ~10 yrs old" rows={2} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking" hint="Informational"><Input value={details.parking || ''} onChange={e => setDetail('parking', e.target.value)} placeholder="e.g. 40 spaces, truck parking" /></Field>
        <Field label="Zoning" hint="Informational"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. M-1, I-2" /></Field>
      </div>
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
  const selectCls = "w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2";
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  const optionStyle = { background: '#0E1318', color: 'rgba(255,255,255,0.85)' };
  return (
    <>
      <SectionTitle>Buildability</SectionTitle>
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Buildable / Developable" value={!!details.buildable} onChange={v => setDetail('buildable', v)} />
      </div>
      <SectionTitle>Physical Site Characteristics</SectionTitle>
      <Field label="Topography (select all that apply)">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{ key: 'level', label: 'Level / Flat' }, { key: 'sloped', label: 'Sloped' }, { key: 'wooded', label: 'Wooded' }, { key: 'cleared', label: 'Cleared' }, { key: 'wetlands', label: 'Wetlands / Marsh' }].map((t, idx) => (
            <React.Fragment key={t.key}><Toggle label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <SectionTitle>Utilities to Site</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[{ key: 'municipal_water', label: 'Municipal Water' }, { key: 'sanitary_sewer', label: 'Sanitary Sewer' }, { key: 'electric', label: 'Electric' }, { key: 'natural_gas', label: 'Natural Gas' }, { key: 'fiber_internet', label: 'Fiber / Internet' }].map((u, idx) => (
          <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
        ))}
      </div>
      <SectionTitle>Access & Road Quality</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Road Surface">
          <select className={selectCls} style={selectStyle} value={details.road_surface || ''} onChange={e => setDetail('road_surface', e.target.value)}>
            <option value="" style={optionStyle}>Select surface</option>
            {['Paved/Asphalt', 'Concrete', 'Gravel', 'Dirt/Unimproved'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}
          </select>
        </Field>
        <Field label="Site Access">
          <select className={selectCls} style={selectStyle} value={details.access_type || ''} onChange={e => setDetail('access_type', e.target.value)}>
            <option value="" style={optionStyle}>Select access type</option>
            {['Direct Frontage', 'Easement/Deeded', 'Shared Drive', 'Private Road', 'No Direct Access'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}
          </select>
        </Field>
      </div>
      <SectionTitle>Informational Details</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lot Dimensions (ft × ft)"><Input value={details.lot_dimensions || ''} onChange={e => setDetail('lot_dimensions', e.target.value)} placeholder="e.g. 300 x 725" /></Field>
        <Field label="Road Frontage (ft)" hint="Informational"><Num field="road_frontage" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
        <Field label="Traffic Count (vehicles/day)" hint="Informational"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
        <Field label="Current Zoning" hint="Informational"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2, M-1" /></Field>
        <Field label="Parcel Number" hint="Informational"><Input value={details.parcel_number || ''} onChange={e => setDetail('parcel_number', e.target.value)} placeholder="e.g. 12-34-567-890" /></Field>
        <Field label="Annual Property Tax ($)" hint="Informational"><Num field="annual_tax" placeholder="e.g. 8500" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <Field label="Location Setting" hint="Informational">
          <select className={selectCls} style={selectStyle} value={details.location_setting || ''} onChange={e => setDetail('location_setting', e.target.value)}>
            <option value="" style={optionStyle}>Select setting</option>
            {['Highway Frontage', 'Main Road', 'Industrial Park', 'Suburban/Residential', 'Rural/Country'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}
          </select>
        </Field>
        <Field label="Visibility" hint="Informational">
          <select className={selectCls} style={selectStyle} value={details.visibility || ''} onChange={e => setDetail('visibility', e.target.value)}>
            <option value="" style={optionStyle}>Select visibility</option>
            {['High Visibility', 'Average', 'Hidden/Private'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}
          </select>
        </Field>
      </div>
      <div className="rounded-xl px-4 py-1 mt-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Divisible" value={!!details.divisible} onChange={v => setDetail('divisible', v)} />
      </div>
      <SectionTitle>Property Details & Media</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the site, its highlights, and development potential…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure / Site Plan (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF" />
      </div>
    </>
  );
}

const SPECIAL_INFRA = [
  { key: 'commercial_kitchen', label: 'Commercial Kitchen' }, { key: 'stage_platform', label: 'Stage / Platform' },
  { key: 'gymnasium', label: 'Gymnasium' }, { key: 'assembly_hall', label: 'Large Assembly Hall' },
  { key: 'sound_acoustic', label: 'Sound / Acoustic Treatment' }, { key: 'commercial_laundry', label: 'Commercial Laundry' }, { key: 'elevator_access', label: 'Elevator Access' },
];
const SPECIAL_USE_BUILDING_AMENITIES = [
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
  const toggleBuildingAmenity = (val) => setDetail('building_amenities', buildingAmenities.includes(val) ? buildingAmenities.filter(a => a !== val) : [...buildingAmenities, val]);
  return (
    <>
      <SectionTitle>Current Use & Classification</SectionTitle>
      <Field label="Current Specific Use">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={details.specific_use || ''} onChange={e => setDetail('specific_use', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select current use</option>
          {['Religious/Church', 'Educational/School', 'Hospitality/Hotel', 'Event Center/Banquet', 'Sports/Recreation', 'Automotive/Specialty', 'Other'].map(t => <option key={t} value={t} style={{ background: '#0E1318' }}>{t}</option>)}
        </select>
      </Field>
      {details.specific_use === 'Other' && <Field label="Describe Current Use"><Input value={details.specific_use_other || ''} onChange={e => setDetail('specific_use_other', e.target.value)} placeholder="e.g., Funeral Home, Bowling Alley" /></Field>}
      <SectionTitle>Key Capacity & Size</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
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
      {details.specialty_equipment && <Field label="List Specialty Equipment"><Textarea value={details.specialty_equipment_list || ''} onChange={e => setDetail('specialty_equipment_list', e.target.value)} placeholder="e.g., Dental chairs, Commercial ovens, Industrial lifts…" rows={3} /></Field>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Structural Modifications"><Input value={details.structural_modifications || ''} onChange={e => setDetail('structural_modifications', e.target.value)} placeholder="e.g., Reinforced floors, soundproofing" /></Field>
        <Field label="HVAC / Environmental Systems"><Input value={details.hvac_systems_details || ''} onChange={e => setDetail('hvac_systems_details', e.target.value)} placeholder="e.g., High-capacity HVAC, air filtration" /></Field>
      </div>
      <SectionTitle>Building Amenities</SectionTitle>
      <CollapsiblePanel title="Building Amenities" summary={buildingAmenities.length > 0 ? `${buildingAmenities.length} selected` : 'Shared building-level features & services'}>
        <div className="flex flex-wrap gap-2 pt-1">{SPECIAL_USE_BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={buildingAmenities.includes(a.value)} onClick={() => toggleBuildingAmenity(a.value)} />)}</div>
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function ListStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  // Commercial sales show the normal detail form plus an Investment Financials
  // block appended at the bottom. Land is investment-agnostic (no financials block).
  const isSale = data.transaction_type === 'sale';
  const showFinancials = isSale && type !== 'land';

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong> space.
      </p>

      {type === 'office' && <OfficeDetails details={details} setDetail={setDetail} />}
      {type === 'medical_office' && <MedicalOfficeDetails details={details} setDetail={setDetail} />}
      {type === 'retail' && <RetailDetails details={details} setDetail={setDetail} />}
      {type === 'industrial_flex' && <IndustrialFlexDetails details={details} setDetail={setDetail} />}
      {type === 'land' && <LandDetails details={details} setDetail={setDetail} />}
      {type === 'special_use' && <SpecialUseDetails details={details} setDetail={setDetail} />}

      {showFinancials && <InvestmentFinancials type={type} details={details} setDetail={setDetail} />}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: ACCENT }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}