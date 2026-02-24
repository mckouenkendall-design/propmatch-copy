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

function OfficeDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Private Offices"><Num field="offices" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
      <Field label="Conference Rooms"><Num field="conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Parking Spaces"><Num field="parking" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
      options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
    <ToggleGroup label="Layout" value={details.layout || ''} onChange={v => setDetail('layout', v)}
      options={[{ value: 'open', label: 'Open Plan' }, { value: 'private', label: 'Private Offices' }, { value: 'hybrid', label: 'Hybrid' }]} />
  </>;
}

function RetailDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Frontage (ft)"><Num field="frontage" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
      <Field label="Parking Spaces"><Num field="parking" placeholder="e.g. 15" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
      options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />
    <ToggleGroup label="Drive-Through?" value={details.drive_through || ''} onChange={v => setDetail('drive_through', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

function IndustrialDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
      <Field label="Dock Doors"><Num field="dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
      <Field label="Drive-In Doors"><Num field="drive_in_doors" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field>
      <Field label="Power (Amps)"><Num field="power_amps" placeholder="e.g. 800" details={details} setDetail={setDetail} /></Field>
      <Field label="Office SF"><Num field="office_sf" placeholder="e.g. 2000" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Rail Access?" value={details.rail || ''} onChange={v => setDetail('rail', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

function FlexDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 18" details={details} setDetail={setDetail} /></Field>
      <Field label="Dock Doors"><Num field="dock_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Office Component (%)"><Num field="office_pct" placeholder="e.g. 30" details={details} setDetail={setDetail} /></Field>
    </div>
  </>;
}

function LandDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Acreage"><Num field="acres" placeholder="e.g. 5.0" step="0.1" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Zoning" value={details.zoning || ''} onChange={v => setDetail('zoning', v)}
      options={[{ value: 'commercial', label: 'Commercial' }, { value: 'industrial', label: 'Industrial' }, { value: 'mixed', label: 'Mixed Use' }]} />
    <ToggleGroup label="Utilities" value={details.utilities || ''} onChange={v => setDetail('utilities', v)}
      options={[{ value: 'all', label: 'All Utilities' }, { value: 'partial', label: 'Partial' }, { value: 'raw', label: 'Raw Land' }]} />
  </>;
}

function MixedUseDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Residential Units"><Num field="units" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      <Field label="Commercial SF"><Num field="commercial_sf" placeholder="e.g. 5000" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Ground Floor Retail?" value={details.ground_retail || ''} onChange={v => setDetail('ground_retail', v)}
      options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
  </>;
}

export default function ListStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong> space.</p>
      {type === 'office' && <OfficeDetails details={details} setDetail={setDetail} />}
      {type === 'retail' && <RetailDetails details={details} setDetail={setDetail} />}
      {type === 'industrial' && <IndustrialDetails details={details} setDetail={setDetail} />}
      {type === 'flex_warehouse' && <FlexDetails details={details} setDetail={setDetail} />}
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