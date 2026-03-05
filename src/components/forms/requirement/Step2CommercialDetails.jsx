import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Num({ field, placeholder, details, setDetail, step }) {
  return (
    <input
      type="number"
      step={step || 1}
      value={details[field] || ''}
      onChange={e => setDetail(field, e.target.value)}
      placeholder={placeholder}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">{children}</h3>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? 'var(--tiffany-blue)' : '#d1d5db' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
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
        placeholder="e.g., Ground Floor Only, Corner Unit (press Enter to add)"
      />
    </div>
  );
}

const AMPERAGE_OPTIONS = ['200A', '400A', '600A', '800A', '1000A', '1200A', '1600A', '2000A+'];
const BUILDING_CLASSES = ['A', 'B', 'C'];

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
      {/* Match Score Disclaimer */}
      <div className="rounded-xl p-3 text-sm text-gray-600 border border-blue-100 bg-blue-50">
        💡 <strong>Match Score:</strong> Fields left blank will be treated as "No Preference" and will not impact the Match Score.
      </div>

      {/* Intended Use */}
      <SectionTitle>Intended Use & Profile</SectionTitle>
      <Field label="Intended Use / Tenant Profile *">
        <Textarea
          value={details.intended_use || ''}
          onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Third-party logistics (3PL) requiring heavy power and 5 docks."
          rows={3}
        />
      </Field>

      {/* Loading & Space */}
      <SectionTitle>Loading & Space Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Loading Docks"><Num field="min_dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Drive-In Doors"><Num field="min_drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Showroom SF"><Num field="min_showroom_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Office % Min">
          <Input type="number" value={details.office_pct_min || ''} onChange={e => setDetail('office_pct_min', e.target.value)} placeholder="e.g. 10" />
        </Field>
        <Field label="Office % Max">
          <Input type="number" value={details.office_pct_max || ''} onChange={e => setDetail('office_pct_max', e.target.value)} placeholder="e.g. 30" />
        </Field>
      </div>

      {/* Power & Infrastructure */}
      <SectionTitle>Power & Infrastructure Needs</SectionTitle>
      <Field label="Min. Amperage">
        <select
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
          value={details.min_power_amps || ''}
          onChange={e => setDetail('min_power_amps', e.target.value)}
        >
          <option value="">No preference</option>
          {AMPERAGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
      <div className="rounded-xl border border-gray-100 px-4 py-1">
        <Toggle label="3-Phase Power Required" value={!!details.three_phase_required} onChange={() => toggleBool('three_phase_required')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Crane Capacity (Tons)"><Num field="min_crane_tons" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Hook Height (ft)"><Num field="min_hook_height" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Min. Floor Load (lbs/sqft)"><Num field="min_floor_load" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* Systems & Exterior */}
      <SectionTitle>Systems & Exterior Features</SectionTitle>
      <Field label="Required Systems">
        <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
          {REQUIRED_SYSTEMS.map(s => (
            <Toggle key={s.key} label={s.label} value={systems.includes(s.key)} onChange={() => toggleSystem(s.key)} />
          ))}
        </div>
      </Field>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Rail Access Required" value={!!details.rail_access_required} onChange={() => toggleBool('rail_access_required')} />
        <Toggle label="Fenced / Secured Yard Required" value={!!details.fenced_yard_required} onChange={() => toggleBool('fenced_yard_required')} />
        <Toggle label="Outside Storage Required" value={!!details.outside_storage_required} onChange={() => toggleBool('outside_storage_required')} />
        <Toggle label="Dock Levelers Required" value={!!details.dock_levelers_required} onChange={() => toggleBool('dock_levelers_required')} />
      </div>

      {/* General Preferences */}
      <SectionTitle>General Preferences & Search Filters</SectionTitle>
      <Field label="Tags" hint="Press Enter to add specific needs">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. Must be zoned M-1" />
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

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
      style={{
        borderColor: selected ? 'var(--tiffany-blue)' : '#e5e7eb',
        backgroundColor: selected ? '#e6f7f5' : 'white',
        color: selected ? '#3A8A82' : '#6b7280',
      }}
    >
      {label}
    </button>
  );
}

function MedicalOfficeReqDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const buildingClasses = details.building_classes || [];
  const toggleClass = (c) => setDetail('building_classes', buildingClasses.includes(c) ? buildingClasses.filter(x => x !== c) : [...buildingClasses, c]);

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

      {/* Medical Features */}
      <SectionTitle>Medical Feature Requirements</SectionTitle>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        {MEDICAL_FEATURES.map(f => (
          <Toggle key={f.key} label={f.label} value={!!details[f.key + '_required']} onChange={() => toggleBool(f.key + '_required')} />
        ))}
        <Toggle label="Medical Waste Disposal Required?" value={!!details.waste_disposal_required} onChange={() => toggleBool('waste_disposal_required')} />
      </div>

      {/* General Preferences */}
      <SectionTitle>General Preferences & Search Filters</SectionTitle>
      <Field label="Tags" hint="Press Enter to add specific needs">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. O-1 Medical" />
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
          placeholder="e.g., Professional services firm needing private offices and conference rooms."
          rows={3}
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
      <div className="rounded-xl border border-gray-100 px-4 py-1">
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

      {/* Must-Have Features */}
      <SectionTitle>Must-Have Features</SectionTitle>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        {OFFICE_FEATURES.map(f => (
          <Toggle key={f.key} label={f.label} value={!!details[f.key + '_required']} onChange={() => toggleBool(f.key + '_required')} />
        ))}
      </div>
      <Field label="Other Must-Have Feature">
        <Input
          value={details.other_feature || ''}
          onChange={e => setDetail('other_feature', e.target.value)}
          placeholder="e.g., Dedicated server closet with cooling"
        />
      </Field>

      {/* Parking */}
      <SectionTitle>Parking</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Max. Parking Spaces"><Num field="max_parking" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* Building Class */}
      <SectionTitle>General Preferences & Search Filters</SectionTitle>
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

      {/* Tags */}
      <Field label="Tags">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

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

  const buildingClasses = details.building_classes || [];
  const toggleClass = (c) => setDetail('building_classes', buildingClasses.includes(c) ? buildingClasses.filter(x => x !== c) : [...buildingClasses, c]);

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
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
          value={details.signage_pref || ''}
          onChange={e => setDetail('signage_pref', e.target.value)}
        >
          <option value="">No preference</option>
          {['Building', 'Pylon / Monument', 'Electronic', 'Window'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />

      {/* Collapsible Required Features */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setFeaturesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span>Required Features {features.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{features.length} selected</span>}</span>
          <span className="text-lg leading-none">{featuresOpen ? '−' : '+'}</span>
        </button>
        {featuresOpen && (
          <div className="px-4 py-3 divide-y divide-gray-50">
            {RETAIL_SPECIAL_FEATURES.map(f => (
              <Toggle key={f.key} label={f.label} value={features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
            ))}
            <Toggle label="Other" value={details.feature_other !== undefined} onChange={v => setDetail('feature_other', v ? '' : undefined)} />
            {details.feature_other !== undefined && (
              <div className="pb-2 pt-1">
                <Input
                  value={details.feature_other || ''}
                  onChange={e => setDetail('feature_other', e.target.value)}
                  placeholder="Describe the required feature…"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADA & Restrooms */}
      <div className="rounded-xl border border-gray-100 px-4 py-2 divide-y divide-gray-50">
        <Toggle label="ADA Compliant Required" value={!!details.ada_required} onChange={v => setDetail('ada_required', v)} />
        <Toggle label="In-Suite Restrooms Required" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && (
          <div className="pb-2 pt-1">
            <Field label="Min. Restroom Pairs">
              <Num field="in_suite_restrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} />
            </Field>
          </div>
        )}
      </div>

      {/* General Preferences */}
      <SectionTitle>General Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Parking Spaces"><Num field="min_parking" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning Preference">
          <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. C-2" />
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

      <Field label="Tags" hint="Press Enter to add each tag">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

function IndustrialDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
      <Field label="# of Dock Doors"><Num field="dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      <Field label="# of Drive-In Doors"><Num field="drive_in_doors" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
      <Field label="Power (Amps)"><Num field="power_amps" placeholder="e.g. 800" details={details} setDetail={setDetail} /></Field>
      <Field label="Office SF Needed"><Num field="office_sf" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="HVAC Required?" value={details.hvac || ''} onChange={v => setDetail('hvac', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'partial', label: 'Partial' }]} />
    <ToggleGroup label="Rail Access?" value={details.rail || ''} onChange={v => setDetail('rail', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

function FlexDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Clear Height (ft)"><Num field="min_clear_height" placeholder="e.g. 18" details={details} setDetail={setDetail} /></Field>
      <Field label="# of Dock Doors"><Num field="dock_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Office Component (%)"><Num field="office_pct" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="HVAC Required?" value={details.hvac || ''} onChange={v => setDetail('hvac', v)}
      options={[{ value: 'full', label: 'Full HVAC' }, { value: 'warehouse_only', label: 'Warehouse Only' }, { value: 'no', label: 'Not Needed' }]} />
  </>;
}

function LandDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Acreage"><Num field="min_acres" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
      <Field label="Max Acreage"><Num field="max_acres" placeholder="e.g. 10" step="0.1" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Zoning Preference" value={details.zoning || ''} onChange={v => setDetail('zoning', v)}
      options={[{ value: 'commercial', label: 'Commercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'mixed', label: 'Mixed Use' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Utilities" value={details.utilities || ''} onChange={v => setDetail('utilities', v)}
      options={[{ value: 'all', label: 'All Utilities' }, { value: 'partial', label: 'Partial' }, { value: 'raw', label: 'Raw Land OK' }]} />
  </>;
}

function MixedUseDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Residential Units"><Num field="min_units" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Commercial SF"><Num field="commercial_sf" placeholder="e.g. 5000" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Ground Floor Retail?" value={details.ground_retail || ''} onChange={v => setDetail('ground_retail', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

export default function ReqStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;
  const typeName = type?.replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Specific needs for a <strong className="capitalize">{typeName}</strong> space.</p>
      {type === 'office'          && <OfficeDetails              details={details} setDetail={setDetail} />}
      {type === 'medical_office' && <MedicalOfficeReqDetails     details={details} setDetail={setDetail} />}
      {type === 'retail' && <RetailDetails details={details} setDetail={setDetail} />}
      {type === 'industrial_flex' && <IndustrialFlexReqDetails details={details} setDetail={setDetail} />}
      {type === 'land' && <LandDetails details={details} setDetail={setDetail} />}
      {type === 'mixed_use' && <MixedUseDetails details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}