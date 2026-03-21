import React, { useState, useRef } from 'react';
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
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
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
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder={placeholder || 'Press Enter to add'} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
    </div>
  );
}

function BedsAndBaths({ details, setDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Bedrooms"><Num field="bedrooms" placeholder="e.g. 3" details={details} setDetail={setDetail} /></Field>
      <Field label="Bathrooms"><Num field="bathrooms" placeholder="e.g. 2" step="0.5" details={details} setDetail={setDetail} /></Field>
    </div>
  );
}

// ── Single Family ─────────────────────────────────────────────────────────────
const ARCH_STYLES = ['Colonial', 'Ranch', 'Cape Cod', 'Craftsman', 'Modern', 'Tudor', 'Split Level', 'Contemporary', 'Victorian', 'Mediterranean'];
const SF_FEATURES = [
  { key: 'pool',        label: 'Pool' },
  { key: 'hot_tub',     label: 'Hot Tub / Spa' },
  { key: 'deck',        label: 'Deck / Patio' },
  { key: 'fence',       label: 'Fenced Yard' },
  { key: 'fireplace',   label: 'Fireplace' },
  { key: 'ac',          label: 'Central A/C' },
  { key: 'generator',   label: 'Generator' },
  { key: 'solar',       label: 'Solar Panels' },
  { key: 'sprinklers',  label: 'Irrigation / Sprinklers' },
  { key: 'mudroom',     label: 'Mudroom' },
  { key: 'bonus_room',  label: 'Bonus Room / Loft' },
  { key: 'home_office', label: 'Dedicated Home Office' },
];

function SingleFamilyDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const features = details.features || [];
  const toggleFeature = (key) => setDetail('features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  return (
    <>
      <SectionTitle>Basic Specs</SectionTitle>
      <BedsAndBaths details={details} setDetail={setDetail} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} /></Field>
        <Field label="Lot Size (sqft)"><Num field="lot_sqft" placeholder="e.g. 7500" details={details} setDetail={setDetail} /></Field>
        <Field label="Garage Spaces"><Num field="garage" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Roof Age (years)"><Num field="roof_age" placeholder="e.g. 5" details={details} setDetail={setDetail} /></Field>
        <Field label="HOA ($/mo)" hint="Leave blank if no HOA"><Num field="hoa" placeholder="e.g. 150" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Style & Layout</SectionTitle>
      <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
        options={[{ value: 'one', label: '1 Story' }, { value: 'two', label: '2 Story' }, { value: 'split', label: 'Split Level' }, { value: 'three_plus', label: '3+' }]} />
      <ToggleGroup label="Basement" value={details.basement || ''} onChange={v => setDetail('basement', v)}
        options={[{ value: 'finished', label: 'Finished' }, { value: 'unfinished', label: 'Unfinished' }, { value: 'walkout', label: 'Walk-Out' }, { value: 'none', label: 'None' }]} />
      <Field label="Architectural Style">
        <div className="flex flex-wrap gap-2">
          {ARCH_STYLES.map(s => (
            <button key={s} type="button" onClick={() => setDetail('arch_style', s)}
              className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all"
              style={{
                borderColor: details.arch_style === s ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: details.arch_style === s ? '#e6f7f5' : 'white',
                color: details.arch_style === s ? '#3A8A82' : '#6b7280',
              }}>{s}</button>
          ))}
        </div>
      </Field>

      <SectionTitle>Systems</SectionTitle>
      <ToggleGroup label="Heating" value={details.heating || ''} onChange={v => setDetail('heating', v)}
        options={[{ value: 'forced_air', label: 'Forced Air' }, { value: 'radiant', label: 'Radiant' }, { value: 'heat_pump', label: 'Heat Pump' }, { value: 'baseboard', label: 'Baseboard' }]} />
      <ToggleGroup label="Cooling" value={details.cooling || ''} onChange={v => setDetail('cooling', v)}
        options={[{ value: 'central', label: 'Central A/C' }, { value: 'mini_split', label: 'Mini-Split' }, { value: 'window', label: 'Window Units' }, { value: 'none', label: 'None' }]} />
      <ToggleGroup label="Flooring" value={details.flooring || ''} onChange={v => setDetail('flooring', v)}
        options={[{ value: 'hardwood', label: 'Hardwood' }, { value: 'carpet', label: 'Carpet' }, { value: 'tile', label: 'Tile' }, { value: 'mixed', label: 'Mixed' }]} />

      <SectionTitle>Features & Amenities</SectionTitle>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setFeaturesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
          <span>Property Features {features.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{features.length} selected</span>}</span>
          <span className="text-lg leading-none">{featuresOpen ? '−' : '+'}</span>
        </button>
        {featuresOpen && (
          <div className="px-4 py-3 divide-y divide-gray-50">
            {SF_FEATURES.map(f => (
              <Toggle key={f.key} label={f.label} value={features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
            ))}
          </div>
        )}
      </div>

      <SectionTitle>Additional Info</SectionTitle>
      <Field label="Appliances Included">
        <TagsInput value={details.appliances || []} onChange={v => setDetail('appliances', v)} placeholder="e.g. Refrigerator, Washer/Dryer (press Enter)" />
      </Field>
      <Field label="School District">
        <Input value={details.school_district || ''} onChange={e => setDetail('school_district', e.target.value)} placeholder="e.g. Royal Oak School District" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </Field>
    </>
  );
}

// ── Condo ────────────────────────────────────────────────────────────────────
const CONDO_AMENITIES = [
  { key: 'gym',          label: 'Fitness Center' },
  { key: 'pool',         label: 'Pool' },
  { key: 'rooftop',      label: 'Rooftop Deck' },
  { key: 'doorman',      label: 'Doorman / Concierge' },
  { key: 'lounge',       label: 'Resident Lounge' },
  { key: 'business_ctr', label: 'Business Center' },
  { key: 'bike_storage', label: 'Bike Storage' },
  { key: 'ev_charging',  label: 'EV Charging' },
  { key: 'dog_wash',     label: 'Dog Wash Station' },
  { key: 'package_room', label: 'Package Room' },
];

function CondoDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (key) => setDetail('amenities', amenities.includes(key) ? amenities.filter(k => k !== key) : [...amenities, key]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  return (
    <>
      <SectionTitle>Unit Details</SectionTitle>
      <BedsAndBaths details={details} setDetail={setDetail} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit Number" hint="Optional">
          <Input
            value={details.unit_number || ''}
            onChange={e => setDetail('unit_number', e.target.value)}
            placeholder="e.g. Unit 804"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </Field>
        <Field label="Floor #"><Num field="floor_num" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Total Floors in Building"><Num field="total_floors" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2015" details={details} setDetail={setDetail} /></Field>
        <Field label="HOA ($/mo)"><Num field="hoa" placeholder="e.g. 450" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Parking & Storage</SectionTitle>
      <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
        options={[{ value: 'assigned', label: 'Assigned' }, { value: 'covered', label: 'Covered' }, { value: 'garage', label: 'Garage' }, { value: 'none', label: 'None' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Storage Unit Included" value={!!details.storage_unit} onChange={() => setDetail('storage_unit', !details.storage_unit)} />
        <Toggle label="Balcony / Terrace" value={!!details.balcony} onChange={() => setDetail('balcony', !details.balcony)} />
        <Toggle label="In-Unit Laundry" value={!!details.in_unit_laundry} onChange={() => setDetail('in_unit_laundry', !details.in_unit_laundry)} />
      </div>

      <SectionTitle>Building & Policies</SectionTitle>
      <ToggleGroup label="View" value={details.view || ''} onChange={v => setDetail('view', v)}
        options={[{ value: 'city', label: 'City' }, { value: 'water', label: 'Water' }, { value: 'park', label: 'Park/Green' }, { value: 'courtyard', label: 'Courtyard' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy || ''} onChange={v => setDetail('pet_policy', v)}
        options={[{ value: 'allowed', label: 'Allowed' }, { value: 'restricted', label: 'Restricted' }, { value: 'none', label: 'No Pets' }]} />
      <ToggleGroup label="Furnished" value={details.furnished || ''} onChange={v => setDetail('furnished', v)}
        options={[{ value: 'furnished', label: 'Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }, { value: 'negotiable', label: 'Negotiable' }]} />

      <SectionTitle>Building Amenities</SectionTitle>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setAmenitiesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
          <span>Amenities {amenities.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{amenities.length} selected</span>}</span>
          <span className="text-lg leading-none">{amenitiesOpen ? '−' : '+'}</span>
        </button>
        {amenitiesOpen && (
          <div className="px-4 py-3 divide-y divide-gray-50">
            {CONDO_AMENITIES.map(a => (
              <Toggle key={a.key} label={a.label} value={amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} />
            ))}
          </div>
        )}
      </div>

      <SectionTitle>HOA Details</SectionTitle>
      <Field label="HOA Includes">
        <TagsInput value={details.hoa_includes || []} onChange={v => setDetail('hoa_includes', v)} placeholder="e.g. Water, Trash, Building Insurance (press Enter)" />
      </Field>
    </>
  );
}

// ── Apartment ─────────────────────────────────────────────────────────────────
const APT_AMENITIES = [
  { key: 'gym',           label: 'Fitness Center' },
  { key: 'pool',          label: 'Pool' },
  { key: 'rooftop',       label: 'Rooftop Deck' },
  { key: 'doorman',       label: 'Doorman / Concierge' },
  { key: 'package_room',  label: 'Package Room' },
  { key: 'bike_storage',  label: 'Bike Storage' },
  { key: 'ev_charging',   label: 'EV Charging' },
  { key: 'coworking',     label: 'Co-Working Space' },
  { key: 'dog_park',      label: 'Dog Park / Pet Area' },
  { key: 'game_room',     label: 'Game Room / Lounge' },
];

function ApartmentDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (key) => setDetail('amenities', amenities.includes(key) ? amenities.filter(k => k !== key) : [...amenities, key]);
  const utilities = details.utilities_included || [];
  const toggleUtility = (key) => setDetail('utilities_included', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const UTILITIES = ['Water', 'Sewer', 'Trash', 'Gas', 'Electric', 'Internet'];

  return (
    <>
      <SectionTitle>Unit Details</SectionTitle>
      <BedsAndBaths details={details} setDetail={setDetail} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Unit Number" hint="Optional">
          <Input
            value={details.unit_number || ''}
            onChange={e => setDetail('unit_number', e.target.value)}
            placeholder="e.g. Apt 3B"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </Field>
        <Field label="Floor #"><Num field="floor_num" placeholder="e.g. 3" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2018" details={details} setDetail={setDetail} /></Field>
        <Field label="Lease Term (months)"><Num field="lease_term" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Utilities & Systems</SectionTitle>
      <Field label="Utilities Included in Rent">
        <div className="flex flex-wrap gap-2">
          {UTILITIES.map(u => (
            <button key={u} type="button" onClick={() => toggleUtility(u)}
              className="px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all"
              style={{
                borderColor: utilities.includes(u) ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: utilities.includes(u) ? '#e6f7f5' : 'white',
                color: utilities.includes(u) ? '#3A8A82' : '#6b7280',
              }}>{u}</button>
          ))}
        </div>
      </Field>
      <ToggleGroup label="Heating" value={details.heating || ''} onChange={v => setDetail('heating', v)}
        options={[{ value: 'forced_air', label: 'Forced Air' }, { value: 'radiant', label: 'Radiant' }, { value: 'baseboard', label: 'Baseboard' }]} />
      <ToggleGroup label="Cooling" value={details.cooling || ''} onChange={v => setDetail('cooling', v)}
        options={[{ value: 'central', label: 'Central A/C' }, { value: 'mini_split', label: 'Mini-Split' }, { value: 'window', label: 'Window Units' }, { value: 'none', label: 'None' }]} />

      <SectionTitle>Laundry, Parking & Policies</SectionTitle>
      <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
        options={[{ value: 'in_unit', label: 'In-Unit' }, { value: 'in_building', label: 'In Building' }, { value: 'none', label: 'None' }]} />
      <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
        options={[{ value: 'included', label: 'Included' }, { value: 'available', label: 'Available ($)' }, { value: 'none', label: 'None' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy || ''} onChange={v => setDetail('pet_policy', v)}
        options={[{ value: 'allowed', label: 'Allowed' }, { value: 'restricted', label: 'Restricted' }, { value: 'none', label: 'No Pets' }]} />
      <ToggleGroup label="Furnished" value={details.furnished || ''} onChange={v => setDetail('furnished', v)}
        options={[{ value: 'furnished', label: 'Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }]} />

      <SectionTitle>Building Amenities</SectionTitle>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setAmenitiesOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
          <span>Amenities {amenities.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>{amenities.length} selected</span>}</span>
          <span className="text-lg leading-none">{amenitiesOpen ? '−' : '+'}</span>
        </button>
        {amenitiesOpen && (
          <div className="px-4 py-3 divide-y divide-gray-50">
            {APT_AMENITIES.map(a => (
              <Toggle key={a.key} label={a.label} value={amenities.includes(a.key)} onChange={() => toggleAmenity(a.key)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Multi-Family (2–4 Units) ──────────────────────────────────────────────────
function MultiFamily24Details({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  return (
    <>
      <SectionTitle>Unit Mix</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Units"><Num field="total_units" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1985" details={details} setDetail={setDetail} /></Field>
        <Field label="Studio Units"><Num field="units_studio" placeholder="e.g. 0" details={details} setDetail={setDetail} /></Field>
        <Field label="1BR Units"><Num field="units_1br" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="2BR Units"><Num field="units_2br" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="3BR+ Units"><Num field="units_3br" placeholder="e.g. 0" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Financial Details</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gross Monthly Rent ($)"><Num field="gross_monthly_rent" placeholder="e.g. 4800" details={details} setDetail={setDetail} /></Field>
        <Field label="Annual Operating Expenses ($)"><Num field="annual_expenses" placeholder="e.g. 12000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Current Occupancy (%)"><Num field="occupancy_pct" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Property Details</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lot Size (sqft)"><Num field="lot_sqft" placeholder="e.g. 8000" details={details} setDetail={setDetail} /></Field>
        <Field label="Garage / Parking Spaces"><Num field="parking_spaces" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
        options={[{ value: 'in_unit_all', label: 'In-Unit (All)' }, { value: 'in_unit_some', label: 'In-Unit (Some)' }, { value: 'shared', label: 'Shared' }, { value: 'none', label: 'None' }]} />
      <ToggleGroup label="Utility Metering" value={details.utility_metering || ''} onChange={v => setDetail('utility_metering', v)}
        options={[{ value: 'individual', label: 'Individual' }, { value: 'master', label: 'Master Metered' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Owner Occupant (lives in one unit)" value={!!details.owner_occupied} onChange={() => toggleBool('owner_occupied')} />
      </div>
    </>
  );
}

// ── Multi-Family (5+ Units) ───────────────────────────────────────────────────
function MultiFamily5PlusDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  return (
    <>
      <SectionTitle>Building Profile</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Units"><Num field="total_units" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Number of Buildings"><Num field="num_buildings" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1972" details={details} setDetail={setDetail} /></Field>
        <Field label="Total Building SF"><Num field="total_building_sf" placeholder="e.g. 24000" details={details} setDetail={setDetail} /></Field>
        <Field label="Studio Units"><Num field="units_studio" placeholder="e.g. 0" details={details} setDetail={setDetail} /></Field>
        <Field label="1BR Units"><Num field="units_1br" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
        <Field label="2BR Units"><Num field="units_2br" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="3BR+ Units"><Num field="units_3br" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Financial Details</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gross Monthly Rent ($)"><Num field="gross_monthly_rent" placeholder="e.g. 32000" details={details} setDetail={setDetail} /></Field>
        <Field label="NOI (Annual $)"><Num field="noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 5.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="GRM"><Num field="grm" placeholder="e.g. 10.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Annual Operating Expenses ($)"><Num field="annual_expenses" placeholder="e.g. 85000" details={details} setDetail={setDetail} /></Field>
        <Field label="Current Occupancy (%)"><Num field="occupancy_pct" placeholder="e.g. 92" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Operations</SectionTitle>
      <ToggleGroup label="Utility Metering" value={details.utility_metering || ''} onChange={v => setDetail('utility_metering', v)}
        options={[{ value: 'individual', label: 'Individual' }, { value: 'master', label: 'Master Metered' }, { value: 'mixed', label: 'Mixed' }]} />
      <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
        options={[{ value: 'in_unit_all', label: 'In-Unit (All)' }, { value: 'in_unit_some', label: 'In-Unit (Some)' }, { value: 'shared', label: 'Shared' }, { value: 'none', label: 'None' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Professional Management in Place" value={!!details.managed} onChange={() => toggleBool('managed')} />
        <Toggle label="Assumable Financing Available" value={!!details.assumable_financing} onChange={() => toggleBool('assumable_financing')} />
        <Toggle label="Value-Add Opportunity" value={!!details.value_add} onChange={() => toggleBool('value_add')} />
      </div>
      <Field label="Parking Spaces"><Num field="parking_spaces" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
    </>
  );
}

// ── Townhouse ─────────────────────────────────────────────────────────────────
function TownhouseDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const features = details.features || [];
  const toggleFeature = (key) => setDetail('features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);

  return (
    <>
      <SectionTitle>Basic Specs</SectionTitle>
      <BedsAndBaths details={details} setDetail={setDetail} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2010" details={details} setDetail={setDetail} /></Field>
        <Field label="Garage Spaces"><Num field="garage" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
        <Field label="HOA ($/mo)"><Num field="hoa" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Layout & Features</SectionTitle>
      <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
        options={[{ value: 'two', label: '2 Story' }, { value: 'three', label: '3 Story' }, { value: 'other', label: 'Other' }]} />
      <ToggleGroup label="Position in Building" value={details.position || ''} onChange={v => setDetail('position', v)}
        options={[{ value: 'end', label: 'End Unit' }, { value: 'middle', label: 'Middle Unit' }, { value: 'corner', label: 'Corner' }]} />
      <ToggleGroup label="Basement" value={details.basement || ''} onChange={v => setDetail('basement', v)}
        options={[{ value: 'finished', label: 'Finished' }, { value: 'unfinished', label: 'Unfinished' }, { value: 'none', label: 'None' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Rooftop Deck" value={!!details.rooftop} onChange={() => toggleBool('rooftop')} />
        <Toggle label="Private Patio / Yard" value={!!details.patio} onChange={() => toggleBool('patio')} />
        <Toggle label="Fireplace" value={!!details.fireplace} onChange={() => toggleBool('fireplace')} />
        <Toggle label="In-Unit Laundry" value={!!details.in_unit_laundry} onChange={() => toggleBool('in_unit_laundry')} />
      </div>

      <SectionTitle>HOA Details</SectionTitle>
      <Field label="HOA Includes">
        <TagsInput value={details.hoa_includes || []} onChange={v => setDetail('hoa_includes', v)} placeholder="e.g. Exterior Maintenance, Snow Removal (press Enter)" />
      </Field>
    </>
  );
}

// ── Manufactured / Mobile Home ────────────────────────────────────────────────
function ManufacturedDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  return (
    <>
      <SectionTitle>Basic Specs</SectionTitle>
      <BedsAndBaths details={details} setDetail={setDetail} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Space Number / Lot Number" hint="If applicable">
          <Input
            value={details.space_number || ''}
            onChange={e => setDetail('space_number', e.target.value)}
            placeholder="e.g. Space 42"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} /></Field>
        <Field label="Size (sqft)"><Num field="size_sqft" placeholder="e.g. 1200" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Land & Lot</SectionTitle>
      <ToggleGroup label="Land Ownership" value={details.land_ownership || ''} onChange={v => setDetail('land_ownership', v)}
        options={[{ value: 'owned', label: 'Land Owned' }, { value: 'leased', label: 'Leased Lot' }]} />
      {details.land_ownership === 'leased' && (
        <Field label="Lot Rent ($/mo)"><Num field="lot_rent" placeholder="e.g. 500" details={details} setDetail={setDetail} /></Field>
      )}
      <Field label="Community / Park Name">
        <Input value={details.community_name || ''} onChange={e => setDetail('community_name', e.target.value)} placeholder="e.g. Sunrise Mobile Estates" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </Field>
      <ToggleGroup label="Age Restriction" value={details.age_restriction || ''} onChange={v => setDetail('age_restriction', v)}
        options={[{ value: '55_plus', label: '55+ Community' }, { value: 'all_ages', label: 'All Ages' }]} />

      <SectionTitle>Structure & Utilities</SectionTitle>
      <ToggleGroup label="Foundation Type" value={details.foundation || ''} onChange={v => setDetail('foundation', v)}
        options={[{ value: 'permanent', label: 'Permanent' }, { value: 'pier', label: 'Pier & Beam' }, { value: 'slab', label: 'Slab' }]} />
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="HUD Tag / Title Present" value={!!details.hud_tag} onChange={() => toggleBool('hud_tag')} />
        <Toggle label="Additions / Expansions Present" value={!!details.has_additions} onChange={() => toggleBool('has_additions')} />
        <Toggle label="Shed / Storage" value={!!details.shed} onChange={() => toggleBool('shed')} />
        <Toggle label="Covered Porch / Deck" value={!!details.porch} onChange={() => toggleBool('porch')} />
        <Toggle label="Central A/C" value={!!details.ac} onChange={() => toggleBool('ac')} />
        <Toggle label="Carport / Garage" value={!!details.carport} onChange={() => toggleBool('carport')} />
      </div>
      <ToggleGroup label="Utilities Setup" value={details.utilities_setup || ''} onChange={v => setDetail('utilities_setup', v)}
        options={[{ value: 'municipal', label: 'Municipal' }, { value: 'well_septic', label: 'Well / Septic' }, { value: 'mixed', label: 'Mixed' }]} />
    </>
  );
}

// ── Land (Residential) ────────────────────────────────────────────────────────
function ResidentialLandDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const utilities = details.utilities_at_site || [];
  const toggleUtility = (key) => setDetail('utilities_at_site', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography_tags || [];
  const toggleTopo = (key) => setDetail('topography_tags', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);

  const selectCls = "w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2";

  return (
    <>
      {/* Property Access & Road Quality — collapsible */}
      <CollapsiblePanel
        title="Property Access & Road Quality"
        summary={[details.road_surface, details.access_type].filter(Boolean).join(' · ') || 'Tap to configure'}
      >
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Field label="Road Surface">
            <select className={selectCls} value={details.road_surface || ''} onChange={e => setDetail('road_surface', e.target.value)}>
              <option value="">Select surface</option>
              {['Paved/Asphalt', 'Concrete', 'Gravel', 'Dirt/Unimproved'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Access Type">
            <select className={selectCls} value={details.access_type || ''} onChange={e => setDetail('access_type', e.target.value)}>
              <option value="">Select access type</option>
              {['Direct Frontage', 'Easement/Deeded', 'Shared Drive', 'Private Road'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div className="divide-y divide-gray-50">
          <Toggle
            label={`Road Maintenance: ${details.road_maintenance === 'private' ? 'Privately Maintained' : 'Publicly Maintained'}`}
            value={details.road_maintenance === 'private'}
            onChange={v => setDetail('road_maintenance', v ? 'private' : 'public')}
          />
        </div>
      </CollapsiblePanel>

      {/* Location Setting & Environment — collapsible */}
      <CollapsiblePanel
        title="Location Setting & Environment"
        summary={[details.location_setting, details.neighborhood_type].filter(Boolean).join(' · ') || 'Tap to configure'}
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location Setting">
            <select className={selectCls} value={details.location_setting || ''} onChange={e => setDetail('location_setting', e.target.value)}>
              <option value="">Select setting</option>
              {['Platted Subdivision', 'Cul-de-Sac', 'Corner Lot', 'Lakefront / Waterfront', 'Rural / Country', 'Wooded / Private'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Neighborhood Type">
            <select className={selectCls} value={details.neighborhood_type || ''} onChange={e => setDetail('neighborhood_type', e.target.value)}>
              <option value="">Select type</option>
              {['Established Neighborhood', 'New Development', 'Rural/Acreage', 'Waterfront Community', 'Gated Community'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        </div>
      </CollapsiblePanel>

      {/* Primary Land Dimensions */}
      <SectionTitle>Primary Land Dimensions</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Acreage"><Num field="acres" placeholder="e.g. 0.5" step="0.01" details={details} setDetail={setDetail} /></Field>
        <Field label="Lot Dimensions (ft × ft)">
          <Input value={details.lot_dimensions || ''} onChange={e => setDetail('lot_dimensions', e.target.value)} placeholder="e.g. 80 x 120" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Gross Square Feet"><Num field="gross_sqft" placeholder="e.g. 9600" details={details} setDetail={setDetail} /></Field>
        <Field label="Road Frontage (ft)"><Num field="road_frontage" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl border border-gray-100 px-4 py-1">
        <Toggle label="Subdividable" value={!!details.subdividable} onChange={v => setDetail('subdividable', v)} />
      </div>

      {/* Zoning & Development Status */}
      <SectionTitle>Zoning & Development Status</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Zoning">
          <Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. R-1, R-2" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="Entitlements">
          <select className={selectCls} value={details.entitlements || ''} onChange={e => setDetail('entitlements', e.target.value)}>
            <option value="">Select status</option>
            {['Raw Land', 'Perc Tested', 'Site Plan Approved', 'Shovel Ready'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Buildable Area (sqft)"><Num field="buildable_area" placeholder="e.g. 7500" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Permitted Uses">
        <TagsInput value={details.permitted_uses || []} onChange={v => setDetail('permitted_uses', v)} placeholder="e.g. Single Family, ADU, Barn (press Enter)" />
      </Field>

      {/* Utilities & Infrastructure */}
      <SectionTitle>Utilities & Infrastructure</SectionTitle>
      <Field label="Utilities at Lot Line">
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
        </div>
      </Field>
      <Field label="Perc Test Status">
        <select className={selectCls} value={details.perc_test || ''} onChange={e => setDetail('perc_test', e.target.value)}>
          <option value="">Select status</option>
          {['Completed', 'Needs Testing', 'Not Required (Municipal Sewer)'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>

      {/* Physical Site Characteristics */}
      <SectionTitle>Physical Site Characteristics</SectionTitle>
      <Field label="Topography (select all that apply)">
        <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
          {[
            { key: 'level',    label: 'Level / Flat' },
            { key: 'wooded',   label: 'Wooded' },
            { key: 'cleared',  label: 'Cleared' },
            { key: 'wetlands', label: 'Wetlands / Marsh' },
            { key: 'sloped',   label: 'Sloped' },
            { key: 'rolling',  label: 'Rolling' },
          ].map(t => (
            <Toggle key={t.key} label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />
          ))}
        </div>
      </Field>
      <div className="rounded-xl border border-gray-100 px-4 py-1 divide-y divide-gray-50">
        <Toggle label="Survey Available" value={!!details.survey_available} onChange={v => setDetail('survey_available', v)} />
        <Toggle label="Wetlands Delineation Completed" value={!!details.wetlands_delineated} onChange={v => setDetail('wetlands_delineated', v)} />
        <Toggle label="Subdivision Potential" value={!!details.subdivision_potential} onChange={v => setDetail('subdivision_potential', v)} />
      </div>

      {/* Property Details & Media */}
      <SectionTitle>Property Details & Media</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Annual Property Tax ($)"><Num field="annual_tax" placeholder="e.g. 2400" details={details} setDetail={setDetail} /></Field>
        <Field label="Parcel Number">
          <Input value={details.parcel_number || ''} onChange={e => setDetail('parcel_number', e.target.value)} placeholder="e.g. 12-34-567-890" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
        <Field label="HOA ($/yr)" hint="If in a subdivision"><Num field="hoa_annual" placeholder="e.g. 800" details={details} setDetail={setDetail} /></Field>
        <Field label="School District">
          <Input value={details.school_district || ''} onChange={e => setDetail('school_district', e.target.value)} placeholder="e.g. Royal Oak School District" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </Field>
      </div>
      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the lot, its highlights, and development potential…" rows={4} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </Field>
      <Field label="Tags" hint="Press Enter to add each tag">
        <TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} />
      </Field>
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ListStep2Residential({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>.</p>
      {type === 'single_family'    && <SingleFamilyDetails     details={details} setDetail={setDetail} />}
      {type === 'condo'            && <CondoDetails            details={details} setDetail={setDetail} />}
      {type === 'apartment'        && <ApartmentDetails        details={details} setDetail={setDetail} />}
      {type === 'multi_family'     && <MultiFamily24Details    details={details} setDetail={setDetail} />}
      {type === 'multi_family_5'   && <MultiFamily5PlusDetails details={details} setDetail={setDetail} />}
      {type === 'townhouse'        && <TownhouseDetails        details={details} setDetail={setDetail} />}
      {type === 'manufactured'     && <ManufacturedDetails     details={details} setDetail={setDetail} />}
      {type === 'land_residential' && <ResidentialLandDetails  details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}