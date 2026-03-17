import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, X } from 'lucide-react';

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-gray-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
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

function TagsInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState('');
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
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={placeholder || 'Press Enter to add'} />
    </div>
  );
}

function MinMaxBeds({ details, setDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Bedrooms"><Num field="min_bedrooms" placeholder="e.g. 3" details={details} setDetail={setDetail} /></Field>
      <Field label="Max Bedrooms"><Num field="max_bedrooms" placeholder="e.g. 5" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Bathrooms"><Num field="min_bathrooms" placeholder="e.g. 2" step="0.5" details={details} setDetail={setDetail} /></Field>
      <Field label="Max Bathrooms"><Num field="max_bathrooms" placeholder="e.g. 4" step="0.5" details={details} setDetail={setDetail} /></Field>
    </div>
  );
}

// ── Single Family ─────────────────────────────────────────────────────────────
const ARCH_STYLES = ['Colonial', 'Ranch', 'Cape Cod', 'Craftsman', 'Modern', 'Tudor', 'Split Level', 'Contemporary', 'Victorian', 'Mediterranean'];
const SF_MUST_HAVES = [
  { key: 'pool',        label: 'Pool' },
  { key: 'garage',      label: 'Garage' },
  { key: 'fence',       label: 'Fenced Yard' },
  { key: 'fireplace',   label: 'Fireplace' },
  { key: 'ac',          label: 'Central A/C' },
  { key: 'deck',        label: 'Deck / Patio' },
  { key: 'basement',    label: 'Basement' },
  { key: 'home_office', label: 'Home Office' },
  { key: 'solar',       label: 'Solar Panels' },
  { key: 'generator',   label: 'Generator' },
];

function SingleFamilyReq({ details, setDetail }) {
  const mustHaves = details.must_haves || [];
  const toggleMustHave = (key) => setDetail('must_haves', mustHaves.includes(key) ? mustHaves.filter(k => k !== key) : [...mustHaves, key]);
  const prefStyles = details.preferred_styles || [];
  const toggleStyle = (s) => setDetail('preferred_styles', prefStyles.includes(s) ? prefStyles.filter(x => x !== s) : [...prefStyles, s]);
  const [mustHavesOpen, setMustHavesOpen] = useState(false);

  return (
    <>
      <SectionTitle>Bedrooms & Bathrooms</SectionTitle>
      <MinMaxBeds details={details} setDetail={setDetail} />

      <SectionTitle>Size & Property</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Garage Spaces"><Num field="min_garage" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Lot Size (sqft)"><Num field="min_lot_sqft" placeholder="e.g. 6000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 1990" details={details} setDetail={setDetail} /></Field>
        <Field label="Max HOA ($/mo)" hint="Leave blank if no HOA preferred"><Num field="max_hoa" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Layout Preferences</SectionTitle>
      <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
        options={[{ value: 'one', label: '1 Story' }, { value: 'two', label: '2 Story' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Basement" value={details.basement || ''} onChange={v => setDetail('basement', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />

      <SectionTitle>Preferred Architectural Styles</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {ARCH_STYLES.map(s => (
          <button key={s} type="button" onClick={() => toggleStyle(s)}
            className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all"
            style={{
              borderColor: prefStyles.includes(s) ? 'var(--tiffany-blue)' : '#e5e7eb',
              backgroundColor: prefStyles.includes(s) ? '#e6f7f5' : 'white',
              color: prefStyles.includes(s) ? '#3A8A82' : '#6b7280',
            }}>{s}</button>
        ))}
      </div>

      <SectionTitle>Must-Have Features</SectionTitle>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setMustHavesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
          <span>Must-Have Features {mustHaves.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{mustHaves.length} selected</span>}</span>
          <span className="text-lg leading-none">{mustHavesOpen ? '−' : '+'}</span>
        </button>
        {mustHavesOpen && (
          <div className="px-4 py-3 divide-y divide-gray-50">
            {SF_MUST_HAVES.map(f => (
              <Toggle key={f.key} label={f.label} value={mustHaves.includes(f.key)} onChange={() => toggleMustHave(f.key)} />
            ))}
          </div>
        )}
      </div>

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="School District Preference">
        <Input value={details.school_district || ''} onChange={e => setDetail('school_district', e.target.value)} placeholder="e.g. Royal Oak School District" />
      </Field>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. corner lot, quiet street (press Enter)" />
      </Field>
    </>
  );
}

// ── Condo ────────────────────────────────────────────────────────────────────
const CONDO_MUST_HAVES = [
  { key: 'gym',          label: 'Fitness Center' },
  { key: 'pool',         label: 'Pool' },
  { key: 'rooftop',      label: 'Rooftop Deck' },
  { key: 'doorman',      label: 'Doorman / Concierge' },
  { key: 'storage',      label: 'Storage Unit' },
  { key: 'balcony',      label: 'Balcony / Terrace' },
  { key: 'ev_charging',  label: 'EV Charging' },
  { key: 'in_unit_laundry', label: 'In-Unit Laundry' },
];

function CondoReq({ details, setDetail }) {
  const mustHaves = details.must_haves || [];
  const toggleMustHave = (key) => setDetail('must_haves', mustHaves.includes(key) ? mustHaves.filter(k => k !== key) : [...mustHaves, key]);

  return (
    <>
      <SectionTitle>Bedrooms & Bathrooms</SectionTitle>
      <MinMaxBeds details={details} setDetail={setDetail} />

      <SectionTitle>Unit Preferences</SectionTitle>
      <ToggleGroup label="Floor Preference" value={details.floor_pref || ''} onChange={v => setDetail('floor_pref', v)}
        options={[{ value: 'low', label: 'Low (1–4)' }, { value: 'mid', label: 'Mid (5–15)' }, { value: 'high', label: 'High (16+)' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="View Preference" value={details.view_pref || ''} onChange={v => setDetail('view_pref', v)}
        options={[{ value: 'city', label: 'City' }, { value: 'water', label: 'Water' }, { value: 'park', label: 'Park' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy || ''} onChange={v => setDetail('pet_policy', v)}
        options={[{ value: 'required', label: 'Must Allow Pets' }, { value: 'not_needed', label: 'No Preference' }]} />
      <ToggleGroup label="Furnished" value={details.furnished || ''} onChange={v => setDetail('furnished', v)}
        options={[{ value: 'furnished', label: 'Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }, { value: 'any', label: 'Either' }]} />

      <SectionTitle>Financial</SectionTitle>
      <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>

      <SectionTitle>Must-Have Amenities</SectionTitle>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        {CONDO_MUST_HAVES.map(f => (
          <Toggle key={f.key} label={f.label} value={mustHaves.includes(f.key)} onChange={() => toggleMustHave(f.key)} />
        ))}
      </div>

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. no stairs, south-facing (press Enter)" />
      </Field>
    </>
  );
}

// ── Apartment ─────────────────────────────────────────────────────────────────
const APT_MUST_HAVES = [
  { key: 'gym',          label: 'Fitness Center' },
  { key: 'pool',         label: 'Pool' },
  { key: 'in_unit_laundry', label: 'In-Unit Laundry' },
  { key: 'dishwasher',   label: 'Dishwasher' },
  { key: 'balcony',      label: 'Balcony' },
  { key: 'storage',      label: 'Storage' },
  { key: 'ev_charging',  label: 'EV Charging' },
  { key: 'doorman',      label: 'Doorman / Concierge' },
];

function ApartmentReq({ details, setDetail }) {
  const mustHaves = details.must_haves || [];
  const toggleMustHave = (key) => setDetail('must_haves', mustHaves.includes(key) ? mustHaves.filter(k => k !== key) : [...mustHaves, key]);

  return (
    <>
      <SectionTitle>Bedrooms & Bathrooms</SectionTitle>
      <MinMaxBeds details={details} setDetail={setDetail} />

      <SectionTitle>Preferences</SectionTitle>
      <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
        options={[{ value: 'in_unit', label: 'In-Unit Required' }, { value: 'in_building', label: 'In Building OK' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy || ''} onChange={v => setDetail('pet_policy', v)}
        options={[{ value: 'required', label: 'Must Allow Pets' }, { value: 'not_needed', label: 'No Preference' }]} />
      <ToggleGroup label="Utilities" value={details.utilities_pref || ''} onChange={v => setDetail('utilities_pref', v)}
        options={[{ value: 'all_included', label: 'All Included' }, { value: 'some_included', label: 'Some Included' }, { value: 'any', label: 'No Preference' }]} />
      <ToggleGroup label="Furnished" value={details.furnished || ''} onChange={v => setDetail('furnished', v)}
        options={[{ value: 'furnished', label: 'Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }, { value: 'any', label: 'Either' }]} />

      <SectionTitle>Financial & Lease</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Max Lease Term (months)"><Num field="max_lease_term" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 2010" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Must-Have Amenities</SectionTitle>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        {APT_MUST_HAVES.map(f => (
          <Toggle key={f.key} label={f.label} value={mustHaves.includes(f.key)} onChange={() => toggleMustHave(f.key)} />
        ))}
      </div>

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. ground floor, near transit (press Enter)" />
      </Field>
    </>
  );
}

// ── Multi-Family (2–4) ────────────────────────────────────────────────────────
function MultiFamily24Req({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Unit Count</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min # of Units"><Num field="min_units" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Max # of Units"><Num field="max_units" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Desired Unit Mix</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Studio Units"><Num field="min_studio" placeholder="e.g. 0" details={details} setDetail={setDetail} /></Field>
        <Field label="Min 1BR Units"><Num field="min_1br" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min 2BR Units"><Num field="min_2br" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min 3BR+ Units"><Num field="min_3br" placeholder="e.g. 0" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Investment Criteria</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Cap Rate (%)"><Num field="min_cap_rate" placeholder="e.g. 6.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Occupancy (%)"><Num field="min_occupancy" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 1970" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Investment Strategy" value={details.strategy || ''} onChange={v => setDetail('strategy', v)}
        options={[{ value: 'turnkey', label: 'Turnkey' }, { value: 'value_add', label: 'Value-Add' }, { value: 'either', label: 'Either' }]} />
      <ToggleGroup label="Owner Occupant?" value={details.owner_occupied || ''} onChange={v => setDetail('owner_occupied', v)}
        options={[{ value: 'yes', label: 'Yes (Live In One)' }, { value: 'no', label: 'No (Pure Investment)' }, { value: 'either', label: 'Either' }]} />

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. separate utilities, updated kitchens (press Enter)" />
      </Field>
    </>
  );
}

// ── Multi-Family (5+) ─────────────────────────────────────────────────────────
function MultiFamily5PlusReq({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Unit Count</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min # of Units"><Num field="min_units" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Max # of Units"><Num field="max_units" placeholder="e.g. 50" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Investment Criteria</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Cap Rate (%)"><Num field="min_cap_rate" placeholder="e.g. 5.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Max GRM"><Num field="max_grm" placeholder="e.g. 12" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Min NOI ($)"><Num field="min_noi" placeholder="e.g. 100000" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Occupancy (%)"><Num field="min_occupancy" placeholder="e.g. 85" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 1980" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Investment Strategy" value={details.strategy || ''} onChange={v => setDetail('strategy', v)}
        options={[{ value: 'turnkey', label: 'Turnkey / Stabilized' }, { value: 'value_add', label: 'Value-Add' }, { value: 'either', label: 'Either' }]} />
      <ToggleGroup label="Utility Metering Preference" value={details.utility_metering || ''} onChange={v => setDetail('utility_metering', v)}
        options={[{ value: 'individual', label: 'Individual' }, { value: 'master', label: 'Master' }, { value: 'any', label: 'Any' }]} />

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. assumable financing, professional management in place (press Enter)" />
      </Field>
    </>
  );
}

// ── Townhouse ─────────────────────────────────────────────────────────────────
function TownhouseReq({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Bedrooms & Bathrooms</SectionTitle>
      <MinMaxBeds details={details} setDetail={setDetail} />

      <SectionTitle>Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Garage Spaces"><Num field="min_garage" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
        options={[{ value: 'two', label: '2 Story' }, { value: 'three', label: '3 Story' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Unit Position" value={details.position || ''} onChange={v => setDetail('position', v)}
        options={[{ value: 'end', label: 'End Unit' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Basement" value={details.basement || ''} onChange={v => setDetail('basement', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
      <ToggleGroup label="Rooftop Deck" value={details.rooftop || ''} onChange={v => setDetail('rooftop', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
      <ToggleGroup label="Private Patio / Yard" value={details.patio || ''} onChange={v => setDetail('patio', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. near schools, attached garage (press Enter)" />
      </Field>
    </>
  );
}

// ── Manufactured / Mobile Home ────────────────────────────────────────────────
function ManufacturedReq({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Bedrooms & Bathrooms</SectionTitle>
      <MinMaxBeds details={details} setDetail={setDetail} />

      <SectionTitle>Land & Lot Preferences</SectionTitle>
      <ToggleGroup label="Land Ownership Preference" value={details.land_ownership || ''} onChange={v => setDetail('land_ownership', v)}
        options={[{ value: 'owned', label: 'Must Own Land' }, { value: 'leased', label: 'Leased Lot OK' }, { value: 'either', label: 'Either' }]} />
      {(details.land_ownership === 'leased' || details.land_ownership === 'either') && (
        <Field label="Max Lot Rent ($/mo)"><Num field="max_lot_rent" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      )}
      <ToggleGroup label="Community Type" value={details.community_type || ''} onChange={v => setDetail('community_type', v)}
        options={[{ value: '55_plus', label: '55+ Community' }, { value: 'all_ages', label: 'All Ages' }, { value: 'any', label: 'No Preference' }]} />

      <SectionTitle>Structure Preferences</SectionTitle>
      <ToggleGroup label="Foundation" value={details.foundation || ''} onChange={v => setDetail('foundation', v)}
        options={[{ value: 'permanent', label: 'Permanent Required' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="HUD Tag Required" value={!!details.hud_required} onChange={() => setDetail('hud_required', !details.hud_required)} />
        <Toggle label="Central A/C Required" value={!!details.ac_required} onChange={() => setDetail('ac_required', !details.ac_required)} />
        <Toggle label="Covered Porch / Deck Required" value={!!details.porch_required} onChange={() => setDetail('porch_required', !details.porch_required)} />
      </div>

      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="Min Year Built"><Num field="min_year_built" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. shed included, no steps (press Enter)" />
      </Field>
    </>
  );
}

// ── Land (Residential) ────────────────────────────────────────────────────────
function ResidentialLandReq({ details, setDetail }) {
  const utilities = details.utilities_required || [];
  const toggleUtility = (key) => setDetail('utilities_required', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography_tags || [];
  const toggleTopo = (key) => setDetail('topography_tags', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);

  const selectCls = "w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2";

  return (
    <>
      {/* Property Access & Road Quality — collapsible */}
      <CollapsiblePanel
        title="Property Access & Road Quality"
        summary={details.road_surface_pref || 'Tap to configure'}
      >
        <Field label="Road Surface Preference">
          <select className={selectCls} value={details.road_surface_pref || ''} onChange={e => setDetail('road_surface_pref', e.target.value)}>
            <option value="">No Preference</option>
            {['Paved/Asphalt Required', 'Gravel OK', 'Private Road OK', 'Any'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <div className="divide-y divide-gray-50 mt-3">
          <Toggle label="Direct Frontage Required (no easement)" value={!!details.direct_frontage_required} onChange={v => setDetail('direct_frontage_required', v)} />
        </div>
      </CollapsiblePanel>

      {/* Location Setting & Environment — collapsible */}
      <CollapsiblePanel
        title="Location Setting & Environment"
        summary={details.location_setting_pref || 'Tap to configure'}
      >
        <Field label="Preferred Location Setting">
          <select className={selectCls} value={details.location_setting_pref || ''} onChange={e => setDetail('location_setting_pref', e.target.value)}>
            <option value="">No Preference</option>
            {['Platted Subdivision', 'Cul-de-Sac', 'Corner Lot', 'Lakefront / Waterfront', 'Rural / Country', 'Wooded / Private', 'Any'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Neighborhood Type Preference" hint="Optional">
          <select className={selectCls} value={details.neighborhood_type_pref || ''} onChange={e => setDetail('neighborhood_type_pref', e.target.value)}>
            <option value="">No Preference</option>
            {['Established Neighborhood', 'New Development', 'Rural/Acreage', 'Waterfront Community', 'Gated Community'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
      </CollapsiblePanel>

      {/* Size Requirements */}
      <SectionTitle>Size Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Acreage"><Num field="min_acres" placeholder="e.g. 0.25" step="0.01" details={details} setDetail={setDetail} /></Field>
        <Field label="Max Acreage"><Num field="max_acres" placeholder="e.g. 5" step="0.01" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Road Frontage (ft)"><Num field="min_road_frontage" placeholder="e.g. 60" details={details} setDetail={setDetail} /></Field>
        <Field label="Min Buildable Area (sqft)"><Num field="min_buildable_area" placeholder="e.g. 10000" details={details} setDetail={setDetail} /></Field>
      </div>

      {/* Zoning & Development Goals */}
      <SectionTitle>Zoning & Development Goals</SectionTitle>
      <Field label="Intended Use">
        <Textarea value={details.intended_use || ''} onChange={e => setDetail('intended_use', e.target.value)}
          placeholder="e.g., Build a custom single family home with a large backyard" rows={2} />
      </Field>
      <Field label="Desired Zoning">
        <Input value={details.zoning_pref || ''} onChange={e => setDetail('zoning_pref', e.target.value)} placeholder="e.g. R-1, must allow ADU" />
      </Field>
      <Field label="Entitlements Preferred">
        <select className={selectCls} value={details.entitlements_pref || ''} onChange={e => setDetail('entitlements_pref', e.target.value)}>
          <option value="">No Preference</option>
          {['Raw Land OK', 'Perc Tested Required', 'Site Plan Approved', 'Shovel Ready', 'Any'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>

      {/* Utilities & Infrastructure */}
      <SectionTitle>Utilities & Infrastructure</SectionTitle>
      <Field label="Required Utilities at Lot Line">
        <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
          {[
            { key: 'municipal_water', label: 'Municipal Water' },
            { key: 'sanitary_sewer',  label: 'Sanitary Sewer' },
            { key: 'electric',        label: 'Electric' },
            { key: 'natural_gas',     label: 'Natural Gas' },
            { key: 'fiber_internet',  label: 'Fiber / Internet' },
          ].map(u => (
            <Toggle key={u.key} label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />
          ))}
          <Toggle label="Perc Test Required" value={!!details.perc_test_required} onChange={() => setDetail('perc_test_required', !details.perc_test_required)} />
        </div>
      </Field>

      {/* Physical Site Characteristics */}
      <SectionTitle>Physical Site Characteristics</SectionTitle>
      <Field label="Topography Preference (select all acceptable)">
        <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
          {[
            { key: 'level',   label: 'Level / Flat' },
            { key: 'wooded',  label: 'Wooded' },
            { key: 'cleared', label: 'Cleared' },
            { key: 'sloped',  label: 'Sloped OK' },
            { key: 'rolling', label: 'Rolling OK' },
          ].map(t => (
            <Toggle key={t.key} label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />
          ))}
        </div>
      </Field>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="No Wetlands" value={!!details.no_wetlands_required} onChange={v => setDetail('no_wetlands_required', v)} />
        <Toggle label="Survey Available Required" value={!!details.survey_required} onChange={v => setDetail('survey_required', v)} />
      </div>

      {/* Additional Preferences */}
      <SectionTitle>Additional Preferences</SectionTitle>
      <Field label="School District Preference">
        <Input value={details.school_district || ''} onChange={e => setDetail('school_district', e.target.value)} placeholder="e.g. Royal Oak School District" />
      </Field>
      <Field label="Other Requirements">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} placeholder="e.g. HOA allowed, subdivision lot (press Enter)" />
      </Field>
    </>
  );
}

function CollapsiblePanel({ title, summary, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div>
          <p className="text-sm font-semibold text-gray-700">{title}</p>
          {!open && <p className="text-xs text-gray-400 mt-0.5">{summary}</p>}
        </div>
        <span className="text-lg leading-none text-gray-400 ml-2">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ReqStep2Residential({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">What does your client need in a <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>?</p>
      {type === 'single_family'    && <SingleFamilyReq      details={details} setDetail={setDetail} />}
      {type === 'condo'            && <CondoReq             details={details} setDetail={setDetail} />}
      {type === 'apartment'        && <ApartmentReq         details={details} setDetail={setDetail} />}
      {type === 'multi_family'     && <MultiFamily24Req     details={details} setDetail={setDetail} />}
      {type === 'multi_family_5'   && <MultiFamily5PlusReq  details={details} setDetail={setDetail} />}
      {type === 'townhouse'        && <TownhouseReq         details={details} setDetail={setDetail} />}
      {type === 'manufactured'     && <ManufacturedReq      details={details} setDetail={setDetail} />}
      {type === 'land_residential' && <ResidentialLandReq   details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}