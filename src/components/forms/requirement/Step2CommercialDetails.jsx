import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';

function Field({ label, children, hint }) {
  return <div className="space-y-1.5"><Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>{children}{hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{hint}</p>}</div>;
}

function Num({ field, placeholder, details, setDetail, step }) {
  return (
    <input
      type="number"
      step={step || 1}
      value={details[field] || ''}
      onChange={e => setDetail(field, e.target.value)}
      placeholder={placeholder}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
    />
  );
}

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide pb-2" style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</h3>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
      style={{
        borderColor: selected ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
        backgroundColor: selected ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
        color: selected ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)',
      }}
    >
      {label}
    </button>
  );
}

function TagsInput({ value = [], onChange, placeholder }) {
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
          <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "e.g., Ground Floor Only, Corner Unit (press Enter to add)"}
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  );
}

const BUILDING_CLASSES = ['A', 'B', 'C'];

function BuildingClassSelector({ details, setDetail }) {
  const buildingClasses = details.building_classes || [];
  const toggleClass = (c) => setDetail('building_classes', buildingClasses.includes(c) ? buildingClasses.filter(x => x !== c) : [...buildingClasses, c]);
  return (
    <Field label="Building Class (select all acceptable)">
      <div className="flex gap-3">
        {BUILDING_CLASSES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => toggleClass(c)}
            className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
            style={{
              borderColor: buildingClasses.includes(c) ? 'var(--tiffany-blue)' : '#e5e7eb',
              backgroundColor: buildingClasses.includes(c) ? '#e6f7f5' : 'white',
              color: buildingClasses.includes(c) ? '#3A8A82' : '#6b7280',
            }}
          >
            Class {c}
          </button>
        ))}
      </div>
    </Field>
  );
}

// ── Building Amenities (Office & Medical Office) ──────────────────────────────
const BUILDING_AMENITIES = [
  { value: 'on_site_management',   label: 'On-Site Management' },
  { value: 'security_247',         label: '24/7 Security / Controlled Access' },
  { value: 'concierge',            label: 'Concierge Services' },
  { value: 'janitorial_common',    label: 'Janitorial (Common Areas)' },
  { value: 'mail_room',            label: 'Mail Room / Package Handling' },
  { value: 'shared_loading_dock',  label: 'Shared Loading Dock' },
  { value: 'lobby_reception',      label: 'Lobby / Reception Area' },
  { value: 'shared_conference',    label: 'Shared Conference Rooms' },
  { value: 'tenant_lounge',        label: 'Tenant Lounge / Break Room' },
  { value: 'fitness_center',       label: 'Fitness Center / Gym' },
  { value: 'outdoor_space',        label: 'Outdoor Space / Patio / Terrace' },
  { value: 'fiber_optic',          label: 'Fiber Optic Connectivity' },
  { value: 'multi_isp',            label: 'Multiple Internet Providers' },
  { value: 'backup_generator',     label: 'Backup Generator' },
  { value: 'ada_building',         label: 'ADA Compliant Building' },
  { value: 'elevators',            label: 'Elevators' },
  { value: 'covered_parking',      label: 'Covered / Garage Parking' },
  { value: 'ev_charging',          label: 'EV Charging Stations' },
  { value: 'bicycle_storage',      label: 'Bicycle Storage' },
  { value: 'energy_efficient',     label: 'Energy Efficient Building' },
  { value: 'leed_certified',       label: 'LEED Certified / Green Building' },
];

function BuildingAmenitiesSection({ details, setDetail, label = "Required Building Amenities" }) {
  const [open, setOpen] = React.useState(false);
  const amenities = details.building_amenities_required || [];
  const toggle = (val) =>
    setDetail('building_amenities_required', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const selected = amenities.length;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</p>
          {!open && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{selected > 0 ? `${selected} required` : 'Select must-have building features'}</p>}
        </div>
        <span className="text-lg leading-none ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {BUILDING_AMENITIES.map(a => (
              <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggle(a.value)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Office Requirement ────────────────────────────────────────────────────────
const OFFICE_FEATURES = [
  { key: 'reception',      label: 'Reception Area' },
  { key: 'kitchenette',    label: 'Kitchenette' },
  { key: 'server_room',    label: 'Server Room' },
  { key: 'file_storage',   label: 'File / Storage Room' },
  { key: 'natural_light',  label: 'Natural Light' },
  { key: 'access_247',     label: '24/7 Access' },
];

function OfficeDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);

  return (
    <>
      {/* Intended Use */}
      <SectionTitle>Intended Use & Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <Textarea
          value={details.intended_use || ''}
          onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Professional services firm needing private offices and conference rooms."
          rows={3}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Field>

      {/* Office & Meeting Rooms */}
      <SectionTitle>Office & Meeting Space</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Private Offices"><Num field="min_offices" placeholder="e.g. 5" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Private Offices"><Num field="max_offices" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Conference Rooms"><Num field="min_conf_rooms" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Conference Rooms"><Num field="max_conf_rooms" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* Restrooms */}
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="In-Suite Restrooms Required?" value={!!details.insuit_restrooms} onChange={() => toggleBool('insuit_restrooms')} />
      </div>
      {details.insuit_restrooms && (
        <Field label="Min. Restroom Count">
          <Num field="min_restrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        </Field>
      )}

      {/* Layout & Floor */}
      <SectionTitle>Layout & Floor</SectionTitle>
      <ToggleGroup label="Layout Type" value={details.layout || ''} onChange={v => setDetail('layout', v)}
        options={[{ value: 'open', label: 'Open Plan' }, { value: 'private', label: 'Private' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'any', label: 'No Preference' }]} />
      <ToggleGroup label="Floor Preference" value={details.floor_pref || ''} onChange={v => setDetail('floor_pref', v)}
        options={[{ value: 'ground', label: 'Ground Floor' }, { value: 'upper', label: 'Upper Floor' }, { value: 'any', label: 'No Preference' }]} />

      {/* Ceiling Height */}
      <SectionTitle>Ceiling Height</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Ceiling Height (ft)"><Num field="min_ceiling_height" placeholder="e.g. 9" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Ceiling Height (ft)"><Num field="max_ceiling_height" placeholder="e.g. 14" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* In-Suite / Space Must-Haves */}
      <SectionTitle>In-Suite / Space Must-Have Features</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {OFFICE_FEATURES.map((f, idx) => (
          <React.Fragment key={f.key}>
            <Toggle label={f.label} value={!!details[f.key + '_required']} onChange={() => toggleBool(f.key + '_required')} />
            {idx < OFFICE_FEATURES.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
      </div>
      <Field label="Other In-Suite Must-Have">
        <Input
          value={details.other_feature || ''}
          onChange={e => setDetail('other_feature', e.target.value)}
          placeholder="e.g., Dedicated server closet with cooling"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Field>

      {/* Building Amenities */}
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />

      {/* Parking */}
      <SectionTitle>Parking</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Ratio" hint="Spaces per 1,000 SF">
          <Input value={details.min_parking_ratio || ''} onChange={e => setDetail('min_parking_ratio', e.target.value)} placeholder="e.g. 3/1,000 SF" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Min. Total Parking Spaces">
          <Num field="min_total_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Max. Parking Spaces">
          <Num field="max_parking" placeholder="e.g. 60" details={details} setDetail={setDetail} />
        </Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Required?" value={!!details.dedicated_parking_required} onChange={() => toggleBool('dedicated_parking_required')} />
      </div>

      {/* General Preferences */}
      <SectionTitle>General Preferences & Search Filters</SectionTitle>
      <BuildingClassSelector details={details} setDetail={setDetail} />
      <Field label="Tags">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

// ── Medical Office Requirement ────────────────────────────────────────────────
const PRACTICE_TYPES = [
  'General Practice', 'Dental', 'Cardiology', 'Orthopedic',
  'Dermatology', 'Pediatrics', 'Physical Therapy', 'Urgent Care', 'Other Specialty',
];

const MEDICAL_FEATURES = [
  { key: 'xray',          label: 'X-Ray Shielding Required' },
  { key: 'medical_gas',   label: 'Medical Gas Lines Required' },
  { key: 'sterilization', label: 'Sterilization Area Required' },
  { key: 'ada',           label: 'ADA Compliant Required' },
  { key: 'hipaa',         label: 'HIPAA Compliant Layout Required' },
];

function MedicalOfficeReqDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);

  return (
    <>
      {/* Intended Use */}
      <SectionTitle>Intended Use & Practice Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <div className="flex flex-wrap gap-2 mb-2">
          {PRACTICE_TYPES.map(pt => (
            <Chip
              key={pt}
              label={pt}
              selected={details.intended_use === pt}
              onClick={() => setDetail('intended_use', pt)}
            />
          ))}
        </div>
      </Field>
      {details.intended_use === 'Other Specialty' && (
        <Field label="Specify Practice Type">
          <Input
            value={details.intended_use_other || ''}
            onChange={e => setDetail('intended_use_other', e.target.value)}
            placeholder="e.g., Oncology, Ophthalmology"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </Field>
      )}

      {/* Exam & Procedure Capacity */}
      <SectionTitle>Exam & Procedure Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Exam Rooms"><Num field="min_exam_rooms" placeholder="e.g. 6" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Procedure Rooms"><Num field="min_procedure_rooms" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Lab Space (SF)"><Num field="min_lab_sf" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Waiting Room Capacity"><Num field="min_waiting_capacity" placeholder="e.g. 15" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* In-Suite / Practice-Specific Must-Haves */}
      <SectionTitle>In-Suite / Practice-Specific Must-Haves</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {MEDICAL_FEATURES.map((f, idx) => (
          <React.Fragment key={f.key}>
            <Toggle label={f.label} value={!!details[f.key + '_required']} onChange={() => toggleBool(f.key + '_required')} />
            {idx < MEDICAL_FEATURES.length && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <Toggle label="Medical Waste Disposal Required?" value={!!details.waste_disposal_required} onChange={() => toggleBool('waste_disposal_required')} />
      </div>

      {/* Building Amenities */}
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />

      {/* General Preferences */}
      <SectionTitle>Parking & General Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Ratio" hint="Spaces per 1,000 SF">
          <Input value={details.min_parking_ratio || ''} onChange={e => setDetail('min_parking_ratio', e.target.value)} placeholder="e.g. 5/1,000 SF" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Min. Total Parking Spaces">
          <Num field="min_total_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. O-1 Medical" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Required?" value={!!details.dedicated_parking_required} onChange={() => toggleBool('dedicated_parking_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Valet Parking Required?" value={!!details.valet_parking_required} onChange={() => toggleBool('valet_parking_required')} />
      </div>
      <BuildingClassSelector details={details} setDetail={setDetail} />
      <Field label="Tags" hint="Press Enter to add specific needs">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

// ── Retail Requirement ─────────────────────────────────────────────────────────
const RETAIL_SPECIAL_FEATURES = [
  { key: 'drive_thru',        label: 'Drive-Thru Window' },
  { key: 'grease_trap',       label: 'Grease Trap' },
  { key: 'venting_hood',      label: 'Venting / Hood' },
  { key: 'cold_storage',      label: 'Cold Storage / Walk-in Freezer' },
  { key: 'outdoor_seating',   label: 'Outdoor Seating / Patio' },
  { key: 'capped_utilities',  label: 'Capped / Stubbed Utilities' },
  { key: 'showroom',          label: 'Dedicated Showroom' },
  { key: 'fitting_rooms',     label: 'Fitting Rooms' },
  { key: 'high_end_lighting', label: 'High-End Lighting' },
  { key: 'rear_loading',      label: 'Rear Loading / Alley Access' },
  { key: 'vault',             label: 'Secure Vault / Safe Room' },
  { key: 'medical_flooring',  label: 'Medical Grade Flooring' },
  { key: 'auto_bay',          label: 'Auto Bay / Garage Doors' },
];

function RetailDetails({ details, setDetail }) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const features = details.retail_features || [];
  const toggleFeature = (key) =>
    setDetail('retail_features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);

  const hasRestrooms = !!details.in_suite_restrooms;

  return (
    <>
      {/* Primary Specs */}
      <SectionTitle>Primary Retail Specs</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Total SF"><Num field="min_total_sf" placeholder="e.g. 1500" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Total SF"><Num field="max_total_sf" placeholder="e.g. 4000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Sales Floor SF"><Num field="min_sales_floor_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Street Frontage (ft)"><Num field="min_frontage" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Ceiling Height (ft)"><Num field="min_ceiling_height" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Traffic Count (vehicles/day)"><Num field="min_traffic_count" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
      </div>

      <Field label="Signage Preference">
        <select
          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={details.signage_pref || ''}
          onChange={e => setDetail('signage_pref', e.target.value)}
        >
          <option value="" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>No preference</option>
          {['Building', 'Pylon / Monument', 'Electronic', 'Window'].map(s => (
            <option key={s} value={s} style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>{s}</option>
          ))}
        </select>
      </Field>

      <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />

      <ToggleGroup
        label="Foot Traffic Preference"
        value={details.foot_traffic_pref || ''}
        onChange={v => setDetail('foot_traffic_pref', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'any', label: 'Any' }]}
      />

      {/* Collapsible Required Features */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          type="button"
          onClick={() => setFeaturesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <span>Required Features {features.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{features.length} selected</span>}</span>
          <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>{featuresOpen ? '−' : '+'}</span>
        </button>
        {featuresOpen && (
          <div className="px-4 py-3">
            {RETAIL_SPECIAL_FEATURES.map((f, idx) => (
              <React.Fragment key={f.key}>
                <Toggle label={f.label} value={features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
                {idx < RETAIL_SPECIAL_FEATURES.length && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
              </React.Fragment>
            ))}
            <Toggle label="Other" value={details.feature_other !== undefined} onChange={v => setDetail('feature_other', v ? '' : undefined)} />
            {details.feature_other !== undefined && (
              <div className="pb-2 pt-1">
                <Input
                  value={details.feature_other || ''}
                  onChange={e => setDetail('feature_other', e.target.value)}
                  placeholder="Describe the required feature…"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADA & Restrooms */}
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="ADA Compliant Required" value={!!details.ada_required} onChange={v => setDetail('ada_required', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Suite Restrooms Required" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && (
          <div className="pb-2 pt-1">
            <Field label="Min. Restroom Pairs">
              <Num field="in_suite_restrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} />
            </Field>
          </div>
        )}
      </div>

      {/* Co-Tenancy */}
      <SectionTitle>Co-Tenancy Preferences</SectionTitle>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Preferred Co-Tenancy" hint="Press Enter to add">
          <TagsInput value={details.preferred_co_tenancy || []} onChange={v => setDetail('preferred_co_tenancy', v)} placeholder="e.g., Grocery store, National clothing brand (press Enter)" />
        </Field>
        <Field label="Undesirable Co-Tenancy" hint="Press Enter to add">
          <TagsInput value={details.undesirable_co_tenancy || []} onChange={v => setDetail('undesirable_co_tenancy', v)} placeholder="e.g., Direct competitor, Liquor store (press Enter)" />
        </Field>
      </div>

      {/* General Preferences */}
      <SectionTitle>Parking & General Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Total Parking Spaces">
          <Num field="min_total_parking_spaces" placeholder="e.g. 10" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. C-2" />
        </Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Shared Parking Access Required" value={!!details.shared_parking_access_required} onChange={v => setDetail('shared_parking_access_required', v)} />
      </div>

      <BuildingClassSelector details={details} setDetail={setDetail} />

      <Field label="Tags" hint="Press Enter to add each tag">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

// ── Industrial/Flex Requirement ───────────────────────────────────────────────
const AMPERAGE_OPTIONS = ['200A', '400A', '600A', '800A', '1000A', '1200A', '1600A', '2000A+'];

const REQUIRED_SYSTEMS = [
  { key: 'esfr',           label: 'ESFR Sprinklers' },
  { key: 'hvac_warehouse', label: 'Warehouse HVAC (Conditioned)' },
  { key: 'led_lighting',   label: 'LED Warehouse Lighting' },
  { key: 'skylights',      label: 'Skylights' },
];

function IndustrialFlexReqDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const systems = details.required_systems || [];
  const toggleSystem = (key) => setDetail('required_systems', systems.includes(key) ? systems.filter(s => s !== key) : [...systems, key]);
  const buildingClasses = details.building_classes || [];
  const toggleClass = (c) => setDetail('building_classes', buildingClasses.includes(c) ? buildingClasses.filter(x => x !== c) : [...buildingClasses, c]);

  return (
    <>
      {/* Intended Use */}
      <SectionTitle>Intended Use & Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <Textarea
          value={details.intended_use || ''}
          onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Third-party logistics (3PL) requiring heavy power and 5 docks."
          rows={3}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Field>

      {/* Loading & Space */}
      <SectionTitle>Loading & Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Loading Docks"><Num field="min_dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Drive-In Doors"><Num field="min_drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Truck Court Depth (ft)"><Num field="min_truck_court_depth" placeholder="e.g. 120" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Showroom SF"><Num field="min_showroom_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Office % Min">
          <Input type="number" value={details.office_pct_min || ''} onChange={e => setDetail('office_pct_min', e.target.value)} placeholder="e.g. 10" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Office % Max">
          <Input type="number" value={details.office_pct_max || ''} onChange={e => setDetail('office_pct_max', e.target.value)} placeholder="e.g. 30" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Cross-Dock Required" value={!!details.cross_dock_required} onChange={() => toggleBool('cross_dock_required')} />
      </div>

      {/* Power & Infrastructure */}
      <SectionTitle>Power & Infrastructure Needs</SectionTitle>
      <Field label="Min. Amperage">
        <select
          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={details.min_power_amps || ''}
          onChange={e => setDetail('min_power_amps', e.target.value)}
        >
          <option value="" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>No preference</option>
          {AMPERAGE_OPTIONS.map(a => <option key={a} value={a} style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>{a}</option>)}
        </select>
      </Field>

      <ToggleGroup
        label="Required Power Voltage"
        value={details.required_power_voltage || ''}
        onChange={v => setDetail('required_power_voltage', v)}
        options={[{ value: '240v', label: '240V' }, { value: '480v', label: '480V' }, { value: 'any', label: 'No Preference' }]}
      />

      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power Required" value={!!details.three_phase_required} onChange={() => toggleBool('three_phase_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Substation On-Site Required" value={!!details.substation_on_site_required} onChange={() => toggleBool('substation_on_site_required')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Crane Capacity (Tons)"><Num field="min_crane_tons" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Hook Height (ft)"><Num field="min_hook_height" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Floor Load (lbs/sqft)"><Num field="min_floor_load" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* Systems & Exterior */}
      <SectionTitle>Systems & Exterior Features</SectionTitle>
      <Field label="Required Systems">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {REQUIRED_SYSTEMS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <Toggle label={s.label} value={systems.includes(s.key)} onChange={() => toggleSystem(s.key)} />
              {idx < REQUIRED_SYSTEMS.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Rail Access Required" value={!!details.rail_access_required} onChange={() => toggleBool('rail_access_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Fenced / Secured Yard Required" value={!!details.fenced_yard_required} onChange={() => toggleBool('fenced_yard_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outside Storage Required" value={!!details.outside_storage_required} onChange={() => toggleBool('outside_storage_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Dock Levelers Required" value={!!details.dock_levelers_required} onChange={() => toggleBool('dock_levelers_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Gated Access Required" value={!!details.gated_access_required} onChange={() => toggleBool('gated_access_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Security Cameras Required" value={!!details.security_cameras_required} onChange={() => toggleBool('security_cameras_required')} />
      </div>

      {/* General Preferences */}
      <SectionTitle>General Preferences & Search Filters</SectionTitle>
      <Field label="Tags" hint="Press Enter to add specific needs">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. Must be zoned M-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>
      <Field label="Building Class (select all acceptable)">
        <div className="flex gap-3">
          {BUILDING_CLASSES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => toggleClass(c)}
              className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
              style={{
                borderColor: buildingClasses.includes(c) ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: buildingClasses.includes(c) ? '#e6f7f5' : 'white',
                color: buildingClasses.includes(c) ? '#3A8A82' : '#6b7280',
              }}
            >
              Class {c}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}

// ── Land Requirement ──────────────────────────────────────────────────────────
const LOCATION_SETTINGS = [
  { key: 'highway_frontage', label: 'Highway Frontage' },
  { key: 'main_road',        label: 'Main Road' },
  { key: 'industrial_park',  label: 'Industrial Park' },
  { key: 'suburban',         label: 'Suburban' },
  { key: 'rural',            label: 'Rural' },
];

const ENTITLEMENTS_OPTIONS = [
  { key: 'raw',               label: 'Raw Land' },
  { key: 'shovel_ready',      label: 'Shovel Ready' },
  { key: 'site_plan_approved',label: 'Site Plan Approved' },
];

function LandDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const utilities = details.utilities_required || [];
  const toggleUtility = (key) => setDetail('utilities_required', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const locationSettings = details.location_settings || [];
  const toggleLocationSetting = (key) => setDetail('location_settings', locationSettings.includes(key) ? locationSettings.filter(l => l !== key) : [...locationSettings, key]);
  const entitlements = details.entitlements_preferred || [];
  const toggleEntitlement = (key) => setDetail('entitlements_preferred', entitlements.includes(key) ? entitlements.filter(e => e !== key) : [...entitlements, key]);
  const siteChars = details.site_characteristics || [];
  const toggleSiteChar = (key) => setDetail('site_characteristics', siteChars.includes(key) ? siteChars.filter(s => s !== key) : [...siteChars, key]);

  return (
    <>
      <SectionTitle>Intended Use & Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <Textarea
          value={details.intended_use || ''}
          onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Retail pad site for a fast-food drive-thru requiring high traffic count and visibility."
          rows={3}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Field>

      <SectionTitle>Size Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Acreage"><Num field="min_acres" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Acreage"><Num field="max_acres" placeholder="e.g. 10" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Total SF"><Num field="min_sqft" placeholder="e.g. 10000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Total SF"><Num field="max_sqft" placeholder="e.g. 50000" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Access & Visibility</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Road Frontage (ft)"><Num field="min_road_frontage" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Road Frontage (ft)"><Num field="max_road_frontage" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Traffic Count (Cars/Day)"><Num field="min_traffic_count" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Build SF">
          <Num field="min_build_sf" placeholder="e.g. 20000" details={details} setDetail={setDetail} />
          <p className="text-xs text-gray-400 mt-1">Ensures the lot legally supports the client's building size</p>
        </Field>
      </div>

      <Field label="Road Surface Required">
        <select
          className="w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={details.road_surface_required || ''}
          onChange={e => setDetail('road_surface_required', e.target.value)}
        >
          <option value="" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>No Preference</option>
          <option value="paved" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>Paved/Asphalt Only</option>
          <option value="gravel" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>Gravel OK</option>
          <option value="no_preference" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>No Preference</option>
        </select>
      </Field>

      <Field label="Location Setting Preference (select all that apply)">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {LOCATION_SETTINGS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <Toggle label={s.label} value={locationSettings.includes(s.key)} onChange={() => toggleLocationSetting(s.key)} />
              {idx < LOCATION_SETTINGS.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </Field>

      <SectionTitle>Zoning & Development</SectionTitle>
      <Field label="Zoning Required">
        <Input value={details.zoning_required || ''} onChange={e => setDetail('zoning_required', e.target.value)} placeholder="e.g., Must allow for Heavy Industrial M-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </Field>

      <SectionTitle>Utilities Required</SectionTitle>
      <p className="text-xs -mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Must be at Site / Curb</p>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[
          { key: 'municipal_water', label: 'Municipal Water' },
          { key: 'sanitary_sewer',  label: 'Sanitary Sewer' },
          { key: 'electric_3phase', label: 'Electric (3-Phase)' },
          { key: 'natural_gas',     label: 'Natural Gas' },
          { key: 'fiber_internet',  label: 'Fiber / Internet' },
        ].map((u, idx) => (
          <React.Fragment key={u.key}>
            <Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />
            {idx < 5 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <Toggle label="Perc Test Required" value={!!details.perc_test_required} onChange={() => toggleBool('perc_test_required')} />
      </div>

      <SectionTitle>Site Characteristic Preferences</SectionTitle>
      <p className="text-xs -mt-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Required State</p>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[
          { key: 'level',           label: 'Level / Flat' },
          { key: 'cleared',         label: 'Cleared' },
          { key: 'wooded',          label: 'Wooded' },
          { key: 'build_to_suit',   label: 'Build-to-Suit Only' },
        ].map((s, idx) => (
          <React.Fragment key={s.key}>
            <Toggle label={s.label} value={siteChars.includes(s.key)} onChange={() => toggleSiteChar(s.key)} />
            {idx < 3 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Other" value={!!details.site_char_other_enabled} onChange={v => setDetail('site_char_other_enabled', v)} />
        {details.site_char_other_enabled && (
          <div className="py-2">
            <Input value={details.site_char_other || ''} onChange={e => setDetail('site_char_other', e.target.value)} placeholder="Describe specific land requirement…" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>
        )}
      </div>

      <SectionTitle>Development Readiness</SectionTitle>
      <Field label="Entitlements Preferred (select all acceptable)">
        <div className="flex flex-wrap gap-2">
          {ENTITLEMENTS_OPTIONS.map(e => (
            <Chip key={e.key} label={e.label} selected={entitlements.includes(e.key)} onClick={() => toggleEntitlement(e.key)} />
          ))}
        </div>
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Survey Available Required" value={!!details.survey_required} onChange={() => toggleBool('survey_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Environmental Phase 1 Required" value={!!details.phase1_required} onChange={() => toggleBool('phase1_required')} />
      </div>

      <SectionTitle>General Search Details</SectionTitle>
      <Field label="Tags">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g., corner lot, opportunity zone, rail access (press ENTER to add)" />
      </Field>
    </>
  );
}

// ── Special Use Requirement ───────────────────────────────────────────────────
const SPECIAL_INFRA_REQ = [
  { key: 'commercial_kitchen', label: 'Commercial Kitchen' },
  { key: 'stage_platform',     label: 'Stage / Platform' },
  { key: 'gymnasium',          label: 'Gymnasium' },
  { key: 'assembly_hall',      label: 'Large Assembly Hall' },
  { key: 'sound_acoustic',     label: 'Sound / Acoustic Treatment' },
  { key: 'commercial_laundry', label: 'Commercial Laundry' },
  { key: 'elevator_access',    label: 'Elevator Access' },
];

const SPECIAL_USE_BUILDING_AMENITIES = [
  { value: 'on_site_management',   label: 'On-Site Management' },
  { value: 'security_247',         label: '24/7 Security / Controlled Access' },
  { value: 'janitorial_common',    label: 'Janitorial (Common Areas)' },
  { value: 'outdoor_space',        label: 'Outdoor Space / Patio / Terrace' },
  { value: 'fiber_optic',          label: 'Fiber Optic Connectivity' },
  { value: 'backup_generator',     label: 'Backup Generator' },
  { value: 'ada_building',         label: 'ADA Compliant Building' },
  { value: 'elevators',            label: 'Elevators' },
  { value: 'covered_parking',      label: 'Covered / Garage Parking' },
  { value: 'ev_charging',          label: 'EV Charging Stations' },
  { value: 'energy_efficient',     label: 'Energy Efficient Building' },
  { value: 'leed_certified',       label: 'LEED Certified / Green Building' },
];

function SpecialUseReqDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const [amenitiesOpen, setAmenitiesOpen] = React.useState(false);
  const buildingAmenities = details.building_amenities_required || [];
  const toggleAmenity = (val) =>
    setDetail('building_amenities_required', buildingAmenities.includes(val) ? buildingAmenities.filter(a => a !== val) : [...buildingAmenities, val]);

  return (
    <>
      <SectionTitle>Intended Use & Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <Textarea
          value={details.intended_use || ''}
          onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Religious organization seeking a sanctuary with a commercial kitchen and parking for 200+ vehicles."
          rows={3}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </Field>

      <SectionTitle>Size Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Total SF"><Num field="min_total_sf" placeholder="e.g. 5000" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Total SF"><Num field="max_total_sf" placeholder="e.g. 30000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Seating Capacity" hint="Sanctuaries, theaters, stadiums">
          <Num field="min_seating_capacity" placeholder="e.g. 200" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Max. Seating Capacity">
          <Num field="max_seating_capacity" placeholder="e.g. 1000" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Min. Bed / Room Count" hint="Hotels or Assisted Living">
          <Num field="min_bed_room_count" placeholder="e.g. 20" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Max. Bed / Room Count">
          <Num field="max_bed_room_count" placeholder="e.g. 100" details={details} setDetail={setDetail} />
        </Field>
      </div>

      <SectionTitle>Required Specialty Features</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {SPECIAL_INFRA_REQ.map((f, idx) => (
          <React.Fragment key={f.key}>
            <Toggle label={f.key === 'commercial_kitchen' ? 'Commercial Kitchen Required' : f.label + ' Required'} value={!!details[f.key + '_required']} onChange={() => toggleBool(f.key + '_required')} />
            {idx < SPECIAL_INFRA_REQ.length && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <Toggle label="ADA Compliant Required" value={!!details.ada_required} onChange={() => toggleBool('ada_required')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Other" value={!!details.other_feature_enabled} onChange={v => setDetail('other_feature_enabled', v)} />
      </div>
      {details.other_feature_enabled && (
        <Field label="Describe Required Feature">
          <Input value={details.other_feature || ''} onChange={e => setDetail('other_feature', e.target.value)} placeholder="e.g., Baptismal pool, Indoor track, Recording studio" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Structural Modifications Required">
          <Input value={details.structural_modifications_required || ''} onChange={e => setDetail('structural_modifications_required', e.target.value)} placeholder="e.g., Reinforced floors, soundproofing" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="HVAC / Environmental Systems Required">
          <Input value={details.hvac_systems_required || ''} onChange={e => setDetail('hvac_systems_required', e.target.value)} placeholder="e.g., High-capacity HVAC, air filtration" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>

      {/* Building Amenities */}
      <SectionTitle>Building Amenities</SectionTitle>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          type="button"
          onClick={() => setAmenitiesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Required Building Amenities</p>
            {!amenitiesOpen && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{buildingAmenities.length > 0 ? `${buildingAmenities.length} required` : 'Select must-have building features'}</p>}
          </div>
          <span className="text-lg leading-none ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{amenitiesOpen ? '−' : '+'}</span>
        </button>
        {amenitiesOpen && (
          <div className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {SPECIAL_USE_BUILDING_AMENITIES.map(a => (
                <Chip key={a.value} label={a.label} selected={buildingAmenities.includes(a.value)} onClick={() => toggleAmenity(a.value)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <SectionTitle>General Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 50" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Parking Spaces"><Num field="max_parking" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g., Must allow for School use" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Licensing Required">
          <Input value={details.licensing_required || ''} onChange={e => setDetail('licensing_required', e.target.value)} placeholder="e.g., State-approved daycare license" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>

      <Field label="Building Class (select all acceptable)">
        <div className="flex gap-3">
          {['A', 'B', 'C'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => {
                const classes = details.building_classes || [];
                setDetail('building_classes', classes.includes(c) ? classes.filter(x => x !== c) : [...classes, c]);
              }}
              className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all"
              style={{
                borderColor: (details.building_classes || []).includes(c) ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: (details.building_classes || []).includes(c) ? '#e6f7f5' : 'white',
                color: (details.building_classes || []).includes(c) ? '#3A8A82' : '#6b7280',
              }}
            >
              Class {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Tags">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g., soundproof, ground floor (press ENTER to add)" />
      </Field>
    </>
  );
}

export default function ReqStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;
  const typeName = type?.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Specific needs for a <strong className="capitalize">{typeName}</strong> space.</p>
      {type === 'office'          && <OfficeDetails              details={details} setDetail={setDetail} />}
      {type === 'medical_office' && <MedicalOfficeReqDetails     details={details} setDetail={setDetail} />}
      {type === 'retail' && <RetailDetails details={details} setDetail={setDetail} />}
      {type === 'industrial_flex' && <IndustrialFlexReqDetails details={details} setDetail={setDetail} />}
      {type === 'land' && <LandDetails details={details} setDetail={setDetail} />}
      {type === 'special_use' && <SpecialUseReqDetails details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}