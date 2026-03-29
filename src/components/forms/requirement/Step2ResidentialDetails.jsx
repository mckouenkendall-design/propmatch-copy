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
// Minimum-only field helper for investment requirements
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

// ── SALE TYPE SELECTOR (Residential) ─────────────────────────────────────────
function ResidentialSaleTypeSelector({ value, onChange }) {
  const opts = [
    { val: 'personal_residence', icon: '🏠', label: 'Personal Residence', desc: 'Will live in this property' },
    { val: 'investment', icon: '📈', label: 'Investment / Rental', desc: 'Purchasing as a rental or income property' },
  ];
  return (
    <div className="space-y-3">
      <SectionTitle>Purchase Intent</SectionTitle>
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

// ── SALE INVESTMENT REQUIREMENT COMPONENTS ────────────────────────────────────

// Shared rental income criteria section (condo, apartment, townhouse)
function RentalCriteriaSection({ details, setDetail, typeLabel }) {
  return (
    <>
      <SectionTitle>Rental Income Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Monthly Rent ($)" field="min_monthly_rent" placeholder="e.g. 1400"
          hint="In-place rent or market rent if vacant" details={details} setDetail={setDetail} />
        <MinField label="Min Annual Gross Rent ($)" field="min_annual_rent" placeholder="e.g. 16800" details={details} setDetail={setDetail} />
        <MinField label="Max HOA ($/mo)" field="max_hoa" placeholder="e.g. 500"
          hint="Upper limit you'll accept" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Rental Status Preference" value={details.rental_status_pref || ''} onChange={v => setDetail('rental_status_pref', v)}
        options={[{ value: 'occupied', label: 'Occupied (tenant in place)' }, { value: 'vacant', label: 'Vacant (ready to lease)' }, { value: 'any', label: 'Either' }]} />
      <ToggleGroup label="Condition Acceptable" value={details.condition_pref || ''} onChange={v => setDetail('condition_pref', v)}
        options={[{ value: 'turnkey', label: 'Turnkey Only' }, { value: 'light_value_add', label: 'Light Value-Add OK' }, { value: 'any', label: 'Any Condition' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="HOA Must Allow Rentals" value={!!details.hoa_rentals_req} onChange={v => setDetail('hoa_rentals_req', v)} />
      </div>
    </>
  );
}

function CondoRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <RentalCriteriaSection details={details} setDetail={setDetail} />
      <SectionTitle>Unit Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Floor #" field="min_floor" placeholder="e.g. 3" hint="Optional — leave blank if any floor OK" details={details} setDetail={setDetail} />
        <Field label="Max HOA Already Captured Above" hint="See rental criteria section" />
      </div>
      <ToggleGroup label="Parking" value={details.parking_pref || ''} onChange={v => setDetail('parking_pref', v)}
        options={[{ value: 'assigned', label: 'Assigned' }, { value: 'garage', label: 'Garage' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="In-Unit Laundry Required" value={!!details.in_unit_laundry_req} onChange={v => setDetail('in_unit_laundry_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Balcony / Outdoor Space Required" value={!!details.balcony_req} onChange={v => setDetail('balcony_req', v)} />
      </div>
      <Field label="Notes / Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting cash-flowing condos, long-term hold, prefer buildings that allow STR…" rows={2} />
      </Field>
    </>
  );
}

function TownhouseRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <RentalCriteriaSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1.5" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Garage Spaces" field="min_garage" placeholder="e.g. 1" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Position Preference" value={details.position_pref || ''} onChange={v => setDetail('position_pref', v)}
        options={[{ value: 'end', label: 'End Unit' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Private Patio / Yard Required" value={!!details.patio_req} onChange={v => setDetail('patio_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Unit Laundry Required" value={!!details.in_unit_laundry_req} onChange={v => setDetail('in_unit_laundry_req', v)} />
      </div>
      <Field label="Notes / Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Looking for cash-flowing townhouses, 2BR+ preferred for tenant demand…" rows={2} />
      </Field>
    </>
  );
}

function ManufacturedRequirementSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Rental Income Criteria (Minimums)</SectionTitle>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Leave blank if not a hard requirement — more flexibility = more matches.</p>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Monthly Rent ($)" field="min_monthly_rent" placeholder="e.g. 750" details={details} setDetail={setDetail} />
        <MinField label="Min Annual Gross Rent ($)" field="min_annual_rent" placeholder="e.g. 9000" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Rental Status Preference" value={details.rental_status_pref || ''} onChange={v => setDetail('rental_status_pref', v)}
        options={[{ value: 'occupied', label: 'Occupied' }, { value: 'vacant', label: 'Vacant' }, { value: 'any', label: 'Either' }]} />
      <ToggleGroup label="Condition Acceptable" value={details.condition_pref || ''} onChange={v => setDetail('condition_pref', v)}
        options={[{ value: 'turnkey', label: 'Turnkey Only' }, { value: 'light_value_add', label: 'Light Value-Add OK' }, { value: 'any', label: 'Any Condition' }]} />

      <SectionTitle>Property Preferences</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1" step="0.5" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Land Ownership Preference" value={details.land_ownership_pref || ''} onChange={v => setDetail('land_ownership_pref', v)}
        options={[{ value: 'owned', label: 'Land Owned Only' }, { value: 'leased', label: 'Lot Lease OK' }, { value: 'any', label: 'Either' }]} />
      {details.land_ownership_pref !== 'owned' && (
        <Field label="Max Monthly Lot Rent ($)" hint="Only applies if lot-leased OK">
          <Num field="max_lot_rent" placeholder="e.g. 500" details={details} setDetail={setDetail} />
        </Field>
      )}
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="HUD Tag / Title Required" value={!!details.hud_tag_req} onChange={v => setDetail('hud_tag_req', v)} />
      </div>
      <Field label="Notes / Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Looking for land-owned manufactured homes for stable long-term rental income…" rows={2} />
      </Field>
    </>
  );
}

// ── EXISTING LEASE / PERSONAL RESIDENCE REQUIREMENT COMPONENTS (unchanged) ────

function SingleFamilyRequirement({ details, setDetail }) {
  const features = details.desired_features || [];
  const toggleFeature = (key) => setDetail('desired_features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);
  const FEATURES = [
    { key: 'pool', label: 'Pool' }, { key: 'garage', label: 'Garage' }, { key: 'basement', label: 'Basement' },
    { key: 'fireplace', label: 'Fireplace' }, { key: 'home_office', label: 'Home Office' }, { key: 'fenced_yard', label: 'Fenced Yard' },
    { key: 'large_yard', label: 'Large Yard' }, { key: 'solar', label: 'Solar Panels' }, { key: 'ac', label: 'Central A/C' },
  ];
  return (
    <>
      <SectionTitle>Size & Layout Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 3" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 2" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Sqft" field="min_sqft" placeholder="e.g. 1500" details={details} setDetail={setDetail} />
        <MinField label="Min Garage Spaces" field="min_garage" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <MinField label="Min Lot Size (sqft)" field="min_lot_sqft" placeholder="e.g. 6000" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Stories Preferred" value={details.stories_pref || ''} onChange={v => setDetail('stories_pref', v)}
        options={[{ value: 'one', label: '1 Story' }, { value: 'two', label: '2 Story' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Basement" value={details.basement_pref || ''} onChange={v => setDetail('basement_pref', v)}
        options={[{ value: 'finished', label: 'Finished' }, { value: 'any', label: 'Any/None OK' }]} />
      <SectionTitle>Desired Features</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FEATURES.map(f => <Chip key={f.key} label={f.label} selected={features.includes(f.key)} onClick={() => toggleFeature(f.key)} />)}
      </div>
      <SectionTitle>Priorities & Budget</SectionTitle>
      <Field label="School District Preference">
        <Input value={details.school_district_pref || ''} onChange={e => setDetail('school_district_pref', e.target.value)} placeholder="e.g. Royal Oak School District" />
      </Field>
      <Field label="Max HOA ($/mo)" hint="Leave blank if no HOA required">
        <Num field="max_hoa" placeholder="e.g. 200" details={details} setDetail={setDetail} />
      </Field>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="Any must-haves or deal-breakers for your home search…" rows={2} />
      </Field>
    </>
  );
}

function CondoRequirement({ details, setDetail }) {
  const amenities = details.desired_amenities || [];
  const toggleAmenity = (key) => setDetail('desired_amenities', amenities.includes(key) ? amenities.filter(k => k !== key) : [...amenities, key]);
  const AMENITIES = [
    { key: 'gym', label: 'Fitness Center' }, { key: 'pool', label: 'Pool' }, { key: 'rooftop', label: 'Rooftop Deck' },
    { key: 'doorman', label: 'Doorman' }, { key: 'package_room', label: 'Package Room' }, { key: 'ev_charging', label: 'EV Charging' },
  ];
  return (
    <>
      <SectionTitle>Unit Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1" step="0.5" details={details} setDetail={setDetail} />
        <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
        <MinField label="Min Floor #" field="min_floor" placeholder="e.g. 3" hint="Optional" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="View Preference" value={details.view_pref || ''} onChange={v => setDetail('view_pref', v)}
        options={[{ value: 'city', label: 'City' }, { value: 'water', label: 'Water' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy_req || ''} onChange={v => setDetail('pet_policy_req', v)}
        options={[{ value: 'allowed', label: 'Pets Allowed' }, { value: 'any', label: 'No Requirement' }]} />
      <SectionTitle>Desired Building Amenities</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {AMENITIES.map(a => <Chip key={a.key} label={a.label} selected={amenities.includes(a.key)} onClick={() => toggleAmenity(a.key)} />)}
      </div>
      <div className="rounded-xl px-4 py-1 mt-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Parking Required" value={!!details.parking_req} onChange={v => setDetail('parking_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Unit Laundry Required" value={!!details.in_unit_laundry_req} onChange={v => setDetail('in_unit_laundry_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Balcony Required" value={!!details.balcony_req} onChange={v => setDetail('balcony_req', v)} />
      </div>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)} placeholder="Any must-haves…" rows={2} />
      </Field>
    </>
  );
}

function ApartmentRequirement({ details, setDetail }) {
  const utilities = details.utilities_req || [];
  const toggleUtility = (key) => setDetail('utilities_req', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const UTILITIES = ['Water','Sewer','Trash','Gas','Electric','Internet'];
  return (
    <>
      <SectionTitle>Unit Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Floor #" field="min_floor" placeholder="e.g. 2" hint="Optional" details={details} setDetail={setDetail} />
      </div>
      <SectionTitle>Utilities Needed in Rent</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {UTILITIES.map(u => (
          <Chip key={u} label={u} selected={utilities.includes(u)} onClick={() => toggleUtility(u)} />
        ))}
      </div>
      <SectionTitle>Policies & Features</SectionTitle>
      <ToggleGroup label="Laundry" value={details.laundry_req || ''} onChange={v => setDetail('laundry_req', v)}
        options={[{ value: 'in_unit', label: 'In-Unit' }, { value: 'in_building', label: 'In Building OK' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Parking" value={details.parking_req || ''} onChange={v => setDetail('parking_req', v)}
        options={[{ value: 'required', label: 'Required' }, { value: 'any', label: 'Not Required' }]} />
      <ToggleGroup label="Pet Policy" value={details.pet_policy_req || ''} onChange={v => setDetail('pet_policy_req', v)}
        options={[{ value: 'allowed', label: 'Pets Allowed' }, { value: 'any', label: 'No Requirement' }]} />
      <ToggleGroup label="Furnished" value={details.furnished_pref || ''} onChange={v => setDetail('furnished_pref', v)}
        options={[{ value: 'furnished', label: 'Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }, { value: 'any', label: 'Any' }]} />
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)} placeholder="Any must-haves…" rows={2} />
      </Field>
    </>
  );
}

function MultiFamily24Requirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Building Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Total Units" field="min_units" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <Field label="Max Total Units"><Num field="max_units" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <MinField label="Min Gross Monthly Rent ($)" field="min_gross_monthly_rent" placeholder="e.g. 3000" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 5.0" step="0.1" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 75" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Utility Metering Preference" value={details.utility_metering_pref || ''} onChange={v => setDetail('utility_metering_pref', v)}
        options={[{ value: 'individual', label: 'Individual Metered' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Open to Owner-Occupied (house-hack)" value={!!details.owner_occupied_ok} onChange={v => setDetail('owner_occupied_ok', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. House-hack friendly, targeting 5%+ cap rate, prefer occupied with long-term tenants…" rows={2} />
      </Field>
    </>
  );
}

function MultiFamily5PlusRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Building Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Total Units" field="min_units" placeholder="e.g. 10" details={details} setDetail={setDetail} />
        <Field label="Max Total Units"><Num field="max_units" placeholder="e.g. 50" details={details} setDetail={setDetail} /></Field>
        <MinField label="Min NOI / Year ($)" field="min_noi" placeholder="e.g. 100000" details={details} setDetail={setDetail} />
        <MinField label="Min Cap Rate (%)" field="min_cap_rate" placeholder="e.g. 5.0" step="0.1" details={details} setDetail={setDetail} />
        <MinField label="Min GRM" field="min_grm" placeholder="e.g. 8" step="0.1" hint="Gross Rent Multiplier" details={details} setDetail={setDetail} />
        <MinField label="Min Occupancy (%)" field="min_occupancy" placeholder="e.g. 80" details={details} setDetail={setDetail} />
        <MinField label="Min Total SF" field="min_sf" placeholder="e.g. 8000" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Utility Metering Preference" value={details.utility_metering_pref || ''} onChange={v => setDetail('utility_metering_pref', v)}
        options={[{ value: 'individual', label: 'Individual Metered' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Professional Management in Place Preferred" value={!!details.managed_pref} onChange={v => setDetail('managed_pref', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Assumable Financing OK" value={!!details.assumable_ok} onChange={v => setDetail('assumable_ok', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Open to Value-Add Opportunities" value={!!details.value_add_ok} onChange={v => setDetail('value_add_ok', v)} />
      </div>
      <Field label="Notes / Investment Strategy">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Targeting 5%+ cap, stable occupancy 85%+, open to light value-add, prefer individual metering…" rows={2} />
      </Field>
    </>
  );
}

function TownhouseRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Property Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1.5" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Garage Spaces" field="min_garage" placeholder="e.g. 1" details={details} setDetail={setDetail} />
        <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Stories Preferred" value={details.stories_pref || ''} onChange={v => setDetail('stories_pref', v)}
        options={[{ value: 'two', label: '2 Story' }, { value: 'three', label: '3 Story' }, { value: 'any', label: 'Any' }]} />
      <ToggleGroup label="Position Preference" value={details.position_pref || ''} onChange={v => setDetail('position_pref', v)}
        options={[{ value: 'end', label: 'End Unit' }, { value: 'any', label: 'Any' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Private Patio / Yard Required" value={!!details.patio_req} onChange={v => setDetail('patio_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="In-Unit Laundry Required" value={!!details.in_unit_laundry_req} onChange={v => setDetail('in_unit_laundry_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Basement Preferred" value={!!details.basement_pref} onChange={v => setDetail('basement_pref', v)} />
      </div>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)} placeholder="Any must-haves…" rows={2} />
      </Field>
    </>
  );
}

function ManufacturedRequirement({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Property Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Bedrooms" field="min_bedrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        <MinField label="Min Bathrooms" field="min_bathrooms" placeholder="e.g. 1" step="0.5" details={details} setDetail={setDetail} />
        <MinField label="Min Size (sqft)" field="min_sqft" placeholder="e.g. 900" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Land Ownership Required" value={details.land_ownership_req || ''} onChange={v => setDetail('land_ownership_req', v)}
        options={[{ value: 'owned', label: 'Land Owned' }, { value: 'leased', label: 'Lot Lease OK' }, { value: 'any', label: 'Either' }]} />
      {details.land_ownership_req !== 'owned' && (
        <Field label="Max Monthly Lot Rent ($)">
          <Num field="max_lot_rent" placeholder="e.g. 550" details={details} setDetail={setDetail} />
        </Field>
      )}
      <ToggleGroup label="Age Restriction Preference" value={details.age_restriction_pref || ''} onChange={v => setDetail('age_restriction_pref', v)}
        options={[{ value: '55_plus', label: '55+ Community' }, { value: 'all_ages', label: 'All Ages' }, { value: 'any', label: 'Either' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="HUD Tag / Title Required" value={!!details.hud_tag_req} onChange={v => setDetail('hud_tag_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Permanent Foundation Required" value={!!details.permanent_foundation_req} onChange={v => setDetail('permanent_foundation_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Central A/C Required" value={!!details.ac_req} onChange={v => setDetail('ac_req', v)} />
      </div>
      <Field label="Additional Requirements">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)} placeholder="Any must-haves or community preferences…" rows={2} />
      </Field>
    </>
  );
}

function ResidentialLandRequirement({ details, setDetail }) {
  const utilities = details.utilities_req || [];
  const toggleUtility = (key) => setDetail('utilities_req', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography_pref || [];
  const toggleTopo = (key) => setDetail('topography_pref', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);
  return (
    <>
      <SectionTitle>Size Requirements</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <MinField label="Min Acreage" field="min_acres" placeholder="e.g. 0.25" step="0.01" details={details} setDetail={setDetail} />
        <Field label="Max Acreage"><Num field="max_acres" placeholder="e.g. 2.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <MinField label="Min Road Frontage (ft)" field="min_frontage" placeholder="e.g. 60" details={details} setDetail={setDetail} />
      </div>
      <ToggleGroup label="Entitlements Needed" value={details.entitlements_needed || ''} onChange={v => setDetail('entitlements_needed', v)}
        options={[{ value: 'raw', label: 'Raw OK' }, { value: 'perc_tested', label: 'Perc Tested' }, { value: 'approved', label: 'Site Plan Approved' }]} />
      <SectionTitle>Utilities Required at Lot Line</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {[{key:'municipal_water',label:'Municipal Water'},{key:'sanitary_sewer',label:'Sanitary Sewer'},{key:'electric',label:'Electric'},{key:'natural_gas',label:'Natural Gas'},{key:'fiber_internet',label:'Fiber / Internet'}].map((u, idx) => (
          <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
        ))}
      </div>
      <SectionTitle>Site Preferences</SectionTitle>
      <Field label="Topography Preferred">
        <div className="flex flex-wrap gap-2">
          {[{key:'level',label:'Level / Flat'},{key:'wooded',label:'Wooded'},{key:'cleared',label:'Cleared'},{key:'waterfront',label:'Waterfront'}].map(t => (
            <Chip key={t.key} label={t.label} selected={topography.includes(t.key)} onClick={() => toggleTopo(t.key)} />
          ))}
        </div>
      </Field>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="No Wetlands / No Flood Zone Required" value={!!details.no_wetlands_req} onChange={v => setDetail('no_wetlands_req', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Subdivision Potential Desired" value={!!details.subdivision_pref} onChange={v => setDetail('subdivision_pref', v)} />
      </div>
      <Field label="Zoning Acceptable">
        <TagsInput value={details.zoning_acceptable || []} onChange={v => setDetail('zoning_acceptable', v)} placeholder="e.g. R-1, R-2, AG (press Enter)" />
      </Field>
      <Field label="School District Preference">
        <Input value={details.school_district_pref || ''} onChange={e => setDetail('school_district_pref', e.target.value)} placeholder="e.g. Rochester Community Schools" />
      </Field>
      <Field label="Intended Build Plan">
        <Textarea value={details.notes || ''} onChange={e => setDetail('notes', e.target.value)}
          placeholder="e.g. Custom home build, need perc tested and utility access, prefer wooded private setting…" rows={2} />
      </Field>
    </>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function ReqStep2Residential({ data, update, onNext }) {
  const details   = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type      = data.property_type;
  const isSale    = data.transaction_type === 'sale';

  // Which types need the sale type selector
  const needsSelector = isSale && ['condo', 'apartment', 'townhouse', 'manufactured'].includes(type);

  // Multi-family always investment when sale
  const alwaysInvestment = isSale && ['multi_family', 'multi_family_5'].includes(type);

  // SFR and land never show investment fields
  const alwaysResidence = ['single_family', 'land_residential'].includes(type);

  const saleType = details.sale_type || null;
  const showResidence = !isSale || alwaysResidence || saleType === 'personal_residence';
  const showInvestment = isSale && (alwaysInvestment || saleType === 'investment');

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Tell us what you need in a <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>.
      </p>

      {/* Sale type selector — only for ambiguous residential types */}
      {needsSelector && (
        <ResidentialSaleTypeSelector value={saleType} onChange={v => setDetail('sale_type', v)} />
      )}

      {/* Personal residence / lease requirement content */}
      {showResidence && (
        <>
          {type === 'single_family'    && <SingleFamilyRequirement    details={details} setDetail={setDetail} />}
          {type === 'condo'            && <CondoRequirement           details={details} setDetail={setDetail} />}
          {type === 'apartment'        && <ApartmentRequirement       details={details} setDetail={setDetail} />}
          {type === 'multi_family'     && <MultiFamily24Requirement   details={details} setDetail={setDetail} />}
          {type === 'multi_family_5'   && <MultiFamily5PlusRequirement details={details} setDetail={setDetail} />}
          {type === 'townhouse'        && <TownhouseRequirement       details={details} setDetail={setDetail} />}
          {type === 'manufactured'     && <ManufacturedRequirement    details={details} setDetail={setDetail} />}
          {type === 'land_residential' && <ResidentialLandRequirement details={details} setDetail={setDetail} />}
        </>
      )}

      {/* Investment sale requirement content */}
      {showInvestment && (
        <>
          {type === 'condo'          && <CondoRequirementSaleInvestment        details={details} setDetail={setDetail} />}
          {type === 'apartment'      && <CondoRequirementSaleInvestment        details={details} setDetail={setDetail} />}
          {type === 'townhouse'      && <TownhouseRequirementSaleInvestment    details={details} setDetail={setDetail} />}
          {type === 'manufactured'   && <ManufacturedRequirementSaleInvestment details={details} setDetail={setDetail} />}
          {/* Multi-family always investment — existing components already have investment fields */}
          {type === 'multi_family'   && <MultiFamily24Requirement    details={details} setDetail={setDetail} />}
          {type === 'multi_family_5' && <MultiFamily5PlusRequirement details={details} setDetail={setDetail} />}
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