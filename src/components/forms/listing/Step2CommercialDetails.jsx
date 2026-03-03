import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Upload, FileText, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// ── Shared helpers ────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
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

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2">{children}</h3>
    </div>
  );
}

// ── File upload helper ────────────────────────────────────────────────────────
function FileUpload({ label, accept, field, details, setDetail, hint }) {
  const ref = useRef();
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDetail(field, file_url);
    setUploading(false);
  };

  const url = details[field];

  return (
    <Field label={label} hint={hint}>
      <div
        className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-tiffany transition-colors"
        style={{ borderColor: url ? 'var(--tiffany-blue)' : '#d1d5db' }}
        onClick={() => ref.current.click()}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading…</p>
        ) : url ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4 text-tiffany" style={{ color: 'var(--tiffany-blue)' }} />
            <span className="text-sm text-gray-600 truncate max-w-xs">Uploaded ✓</span>
            <button type="button" onClick={e => { e.stopPropagation(); setDetail(field, ''); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="w-5 h-5 text-gray-400" />
            <p className="text-sm text-gray-500">Click to upload</p>
          </div>
        )}
      </div>
    </Field>
  );
}

// ── Office Details ────────────────────────────────────────────────────────────
const AMENITIES = [
  { value: 'reception',     label: 'Reception Area' },
  { value: 'kitchenette',   label: 'Kitchenette' },
  { value: 'server_room',   label: 'Server Room' },
  { value: 'storage',       label: 'File / Storage Room' },
  { value: 'natural_light', label: 'Natural Light / Windows' },
  { value: 'access_247',    label: '24/7 Access' },
];

const LAYOUT_OPTIONS = [
  { value: 'open_plan',       label: 'Open Plan' },
  { value: 'partitioned',     label: 'Partitioned' },
  { value: 'executive_suite', label: 'Executive Suite' },
  { value: 'mixed',           label: 'Mixed' },
  { value: 'other',           label: 'Other' },
];

function OfficeDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (val) => {
    setDetail('amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  };

  const hasRestrooms = !!details.in_suite_restrooms;

  return (
    <>
      {/* Layout & Capacity */}
      <SectionTitle>Layout & Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Number of Offices">
          <Num field="offices" placeholder="e.g. 10" details={details} setDetail={setDetail} />
        </Field>
        <Field label="Conference Rooms">
          <Num field="conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
        </Field>
      </div>

      <div className="rounded-xl border border-gray-100 px-4 py-2 space-y-1">
        <Toggle
          label="In-Suite Restrooms"
          value={hasRestrooms}
          onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)}
        />
        {hasRestrooms && (
          <div className="pb-2">
            <Field
              label="Restroom Pairs"
              hint={`Entering ${details.in_suite_restrooms || 1} implies ${details.in_suite_restrooms || 1} Men's + ${details.in_suite_restrooms || 1} Women's restrooms`}
            >
              <Num field="in_suite_restrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} />
            </Field>
          </div>
        )}
        {!hasRestrooms && (
          <p className="text-xs text-gray-400 pb-2">Shared floor restrooms (standard)</p>
        )}
      </div>

      <Field label="Layout Type">
        <div className="flex flex-wrap gap-2">
          {LAYOUT_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={details.layout === opt.value}
              onClick={() => setDetail('layout', opt.value)}
            />
          ))}
        </div>
      </Field>

      {/* Features & Amenities */}
      <SectionTitle>Features & Amenities</SectionTitle>
      <Field label="Select all that apply">
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => (
            <Chip
              key={a.value}
              label={a.label}
              selected={amenities.includes(a.value)}
              onClick={() => toggleAmenity(a.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="IT Infrastructure">
        <Input
          value={details.it_infrastructure || ''}
          onChange={e => setDetail('it_infrastructure', e.target.value)}
          placeholder="e.g., Cat6 wiring, fiber ready"
        />
      </Field>

      {/* Property Specs */}
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description">
        <Textarea
          value={details.description || ''}
          onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the space, its highlights, and what makes it ideal for tenants…"
          rows={4}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tags" hint="Keywords like 'renovated', 'corner location'">
          <Input
            value={details.tags || ''}
            onChange={e => setDetail('tags', e.target.value)}
            placeholder="e.g. renovated, corner location"
          />
        </Field>
        <Field label="Parking">
          <Input
            value={details.parking || ''}
            onChange={e => setDetail('parking', e.target.value)}
            placeholder="e.g. 20 spaces, surface lot"
          />
        </Field>
        <Field label="Ceiling Height">
          <Input
            value={details.ceiling_height || ''}
            onChange={e => setDetail('ceiling_height', e.target.value)}
            placeholder="e.g. 9 ft"
          />
        </Field>
        <Field label="Zoning">
          <Input
            value={details.zoning || ''}
            onChange={e => setDetail('zoning', e.target.value)}
            placeholder="e.g. B-2"
          />
        </Field>
      </div>

      <ToggleGroup
        label="Building Class"
        value={details.building_class || ''}
        onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]}
      />

      <div className="grid grid-cols-2 gap-4">
        <FileUpload
          label="Photos"
          accept="image/*"
          field="photo_url"
          details={details}
          setDetail={setDetail}
          hint="Upload a primary photo"
        />
        <FileUpload
          label="Brochure (PDF)"
          accept=".pdf"
          field="brochure_url"
          details={details}
          setDetail={setDetail}
          hint="Upload a PDF brochure"
        />
      </div>
    </>
  );
}

// ── Other property type forms (unchanged) ────────────────────────────────────
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function ListStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 -mt-2">Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong> space.</p>
      {type === 'office'         && <OfficeDetails     details={details} setDetail={setDetail} />}
      {type === 'retail'         && <RetailDetails     details={details} setDetail={setDetail} />}
      {type === 'industrial'     && <IndustrialDetails details={details} setDetail={setDetail} />}
      {type === 'flex_warehouse' && <FlexDetails       details={details} setDetail={setDetail} />}
      {type === 'land'           && <LandDetails       details={details} setDetail={setDetail} />}
      {type === 'mixed_use'      && <MixedUseDetails   details={details} setDetail={setDetail} />}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}