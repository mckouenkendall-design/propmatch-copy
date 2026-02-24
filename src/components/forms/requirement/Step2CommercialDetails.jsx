import React from 'react';
import { Input } from '@/components/ui/input';
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

function OfficeDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Private Offices"><Num field="min_offices" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Conference Rooms"><Num field="min_conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      <Field label="Min Parking Spaces"><Num field="min_parking" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
      options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Floor Preference" value={details.floor_pref || ''} onChange={v => setDetail('floor_pref', v)}
      options={[{ value: 'ground', label: 'Ground Floor' }, { value: 'upper', label: 'Upper Floor' }, { value: 'any', label: 'Any' }]} />
    <ToggleGroup label="Layout" value={details.layout || ''} onChange={v => setDetail('layout', v)}
      options={[{ value: 'open', label: 'Open Plan' }, { value: 'private', label: 'Private Offices' }, { value: 'hybrid', label: 'Hybrid' }]} />
  </>;
}

function RetailDetails({ details, setDetail }) {
  return <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Min Frontage (ft)"><Num field="min_frontage" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
    </div>
    <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
      options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />
    <ToggleGroup label="Drive-Through" value={details.drive_through || ''} onChange={v => setDetail('drive_through', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
    <ToggleGroup label="Signage" value={details.signage || ''} onChange={v => setDetail('signage', v)}
      options={[{ value: 'required', label: 'Required' }, { value: 'preferred', label: 'Preferred' }, { value: 'not_needed', label: 'Not Needed' }]} />
  </>;
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