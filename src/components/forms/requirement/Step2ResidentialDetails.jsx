import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight } from 'lucide-react';

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

function BedsAndBaths({ details, setDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Bedrooms"><Num field="min_bedrooms" placeholder="e.g. 3" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Bathrooms"><Num field="min_bathrooms" placeholder="e.g. 2" step="0.5" details={details} setDetail={setDetail} /></Field>
    </div>
  );
}

function SingleFamilyDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Garage Spaces"><Num field="min_garage" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Lot Size (sqft)"><Num field="min_lot_sqft" placeholder="e.g. 6000" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
      options={[{ value: 'one', label: '1 Story' }, { value: 'two', label: '2 Story' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Basement?" value={details.basement || ''} onChange={v => setDetail('basement', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
    <ToggleGroup label="Pool?" value={details.pool || ''} onChange={v => setDetail('pool', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

function CondoDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 500" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Floor Preference" value={details.floor_pref || ''} onChange={v => setDetail('floor_pref', v)}
      options={[{ value: 'low', label: 'Low' }, { value: 'mid', label: 'Mid' }, { value: 'high', label: 'High Rise' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

function ApartmentDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <ToggleGroup label="Pet Friendly?" value={details.pet_friendly || ''} onChange={v => setDetail('pet_friendly', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
    <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
      options={[{ value: 'in_unit', label: 'In-Unit' }, { value: 'in_building', label: 'In Building' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

function MultiFamilyDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min # of Units"><Num field="min_units" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
      <Field label="Max # of Units"><Num field="max_units" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
      <Field label="Min # of 1BR Units"><Num field="units_1br" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      <Field label="Min # of 2BR Units"><Num field="units_2br" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Cap Rate (%)"><Num field="min_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Occupancy (%)"><Num field="min_occupancy" placeholder="e.g. 85" details={details} setDetail={setDetail} /></Field>
    </div>
  </>;
}

function TownhouseDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Garage Spaces"><Num field="min_garage" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
      <Field label="Max HOA ($/mo)"><Num field="max_hoa" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Rooftop Deck?" value={details.rooftop || ''} onChange={v => setDetail('rooftop', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
}

export default function ReqStep2Residential({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">What does your client need in a <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>?</p>
      {type === 'single_family' && <SingleFamilyDetails details={details} setDetail={setDetail} />}
      {type === 'condo' && <CondoDetails details={details} setDetail={setDetail} />}
      {type === 'apartment' && <ApartmentDetails details={details} setDetail={setDetail} />}
      {type === 'multi_family' && <MultiFamilyDetails details={details} setDetail={setDetail} />}
      {type === 'townhouse' && <TownhouseDetails details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}