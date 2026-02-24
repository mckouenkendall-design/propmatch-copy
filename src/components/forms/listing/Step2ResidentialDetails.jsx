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
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
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

function SingleFamilyDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Garage Spaces"><Num field="garage" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Lot Size (sqft)"><Num field="lot_sqft" placeholder="e.g. 7500" details={details} setDetail={setDetail} /></Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Stories" value={details.stories || ''} onChange={v => setDetail('stories', v)}
      options={[{ value: 'one', label: '1 Story' }, { value: 'two', label: '2 Story' }, { value: 'split', label: 'Split Level' }]} />
    <ToggleGroup label="Basement?" value={details.basement || ''} onChange={v => setDetail('basement', v)}
      options={[{ value: 'finished', label: 'Finished' }, { value: 'unfinished', label: 'Unfinished' }, { value: 'none', label: 'None' }]} />
    <ToggleGroup label="Pool?" value={details.pool || ''} onChange={v => setDetail('pool', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

function CondoDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="HOA ($/mo)"><Num field="hoa" placeholder="e.g. 350" details={details} setDetail={setDetail} /></Field>
      <Field label="Floor #"><Num field="floor_num" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2015" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Parking Included?" value={details.parking || ''} onChange={v => setDetail('parking', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

function ApartmentDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <ToggleGroup label="Pet Friendly?" value={details.pet_friendly || ''} onChange={v => setDetail('pet_friendly', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
    <ToggleGroup label="Laundry" value={details.laundry || ''} onChange={v => setDetail('laundry', v)}
      options={[{ value: 'in_unit', label: 'In-Unit' }, { value: 'in_building', label: 'In Building' }, { value: 'none', label: 'None' }]} />
    <ToggleGroup label="Parking" value={details.parking || ''} onChange={v => setDetail('parking', v)}
      options={[{ value: 'included', label: 'Included' }, { value: 'available', label: 'Available' }, { value: 'none', label: 'None' }]} />
  </>;
}

function MultiFamilyDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Total Units"><Num field="total_units" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      <Field label="1BR Units"><Num field="units_1br" placeholder="e.g. 6" details={details} setDetail={setDetail} /></Field>
      <Field label="2BR Units"><Num field="units_2br" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      <Field label="3BR+ Units"><Num field="units_3br" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Current Occupancy (%)"><Num field="occupancy_pct" placeholder="e.g. 90" details={details} setDetail={setDetail} /></Field>
      <Field label="Cap Rate (%)"><Num field="cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1990" details={details} setDetail={setDetail} /></Field>
    </div>
  </>;
}

function TownhouseDetails({ details, setDetail }) {
  return <>
    <BedsAndBaths details={details} setDetail={setDetail} />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Garage Spaces"><Num field="garage" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
      <Field label="HOA ($/mo)"><Num field="hoa" placeholder="e.g. 200" details={details} setDetail={setDetail} /></Field>
      <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2010" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Rooftop Deck?" value={details.rooftop || ''} onChange={v => setDetail('rooftop', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

export default function ListStep2Residential({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong>.</p>
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