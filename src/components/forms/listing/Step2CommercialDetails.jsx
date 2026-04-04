import React, { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Upload, FileText, X, TrendingUp, Building } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ACCENT = '#00DBC5';

// ── Shared helpers ────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label style={{ color: 'rgba(255,255,255,0.9)' }}>{label}</Label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{hint}</p>}
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
    <button type="button" onClick={onClick} className="px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all"
      style={{ borderColor: selected ? ACCENT : 'rgba(255,255,255,0.2)', backgroundColor: selected ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)', color: selected ? ACCENT : 'rgba(255,255,255,0.7)' }}>
      {label}
    </button>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
      <button type="button" onClick={() => onChange(!value)} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ backgroundColor: value ? ACCENT : 'rgba(255,255,255,0.2)' }}>
        <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );
}

function CollapsiblePanel({ title, summary, children, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen || false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 transition-colors text-left"
        style={{ background: 'rgba(255,255,255,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{title}</p>
          {!open && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{summary}</p>}
        </div>
        <span className="text-lg leading-none ml-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide pb-2" style={{ color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</h3>
    </div>
  );
}

function FileUpload({ label, accept, field, details, setDetail, hint }) {
  const ref = useRef();
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  // Support both old single photo_url and new photo_urls array
  const urls = React.useMemo(() => {
    if (field === 'photo_url') {
      const arr = details['photo_urls'];
      if (Array.isArray(arr) && arr.length) return arr;
      if (details['photo_url']) return [details['photo_url']];
      return [];
    }
    return details[field] ? [details[field]] : [];
  }, [details, field]);

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(file => base44.integrations.Core.UploadFile({ file }).then(r => r.file_url))
      );
      if (field === 'photo_url') {
        const combined = [...urls, ...uploaded];
        setDetail('photo_urls', combined);
        setDetail('photo_url', combined[0]); // keep first for backwards compat
      } else {
        setDetail(field, uploaded[0]);
      }
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx) => {
    const next = urls.filter((_, i) => i !== idx);
    setDetail('photo_urls', next);
    setDetail('photo_url', next[0] || '');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  return (
    <Field label={label} hint={hint}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${dragOver ? ACCENT : urls.length ? ACCENT + '80' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          background: dragOver ? `${ACCENT}08` : 'rgba(255,255,255,0.03)',
        }}>
        <input ref={ref} type="file" accept={accept} multiple className="hidden"
          onChange={e => uploadFiles(e.target.files)} />
        {uploading ? (
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Uploading…</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <Upload style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.3)' }} />
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              {urls.length ? 'Add more photos' : 'Click or drag & drop photos here'}
            </p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              Drop files directly into this box · Multiple photos supported
            </p>
          </div>
        )}
      </div>

      {/* Photo thumbnails */}
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {urls.map((url, idx) => (
            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
              <img src={url} alt={`Photo ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removePhoto(idx); }}
                style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: '10px', height: '10px', color: 'white' }} />
              </button>
              {idx === 0 && (
                <div style={{ position: 'absolute', bottom: '3px', left: '3px', fontFamily: "'Inter',sans-serif", fontSize: '9px', fontWeight: 700, color: 'white', background: `${ACCENT}cc`, borderRadius: '3px', padding: '1px 4px' }}>MAIN</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Field>
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
          <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ACCENT }}>
            {tag}
            <button type="button" onClick={() => remove(tag)}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="e.g., move-in ready (press Enter to add)" />
    </div>
  );
}

// ── Sale Type Selector ────────────────────────────────────────────────────────
function SaleTypeSelector({ value, onChange }) {
  const opts = [
    { value: 'owner_user', Icon: Building, label: 'Owner / User', desc: 'Buyer will occupy and operate from this property' },
    { value: 'investment', Icon: TrendingUp, label: 'Investment', desc: 'Buyer is purchasing for income and returns' },
  ];
  return (
    <div style={{ marginBottom: '4px' }}>
      <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Sale Type</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        {opts.map(opt => {
          const selected = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              style={{ flex: 1, padding: '16px', borderRadius: '12px', border: `2px solid ${selected ? ACCENT : 'rgba(255,255,255,0.15)'}`, background: selected ? `${ACCENT}12` : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <opt.Icon style={{ width: '20px', height: '20px', color: selected ? ACCENT : 'rgba(255,255,255,0.5)', marginBottom: '8px' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: selected ? ACCENT : 'white', margin: '0 0 4px' }}>{opt.label}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Building Amenities ────────────────────────────────────────────────────────
const BUILDING_AMENITIES = [
  { value: 'on_site_management', label: 'On-Site Management' }, { value: 'security_247', label: '24/7 Security / Controlled Access' },
  { value: 'concierge', label: 'Concierge Services' }, { value: 'janitorial_common', label: 'Janitorial (Common Areas)' },
  { value: 'mail_room', label: 'Mail Room / Package Handling' }, { value: 'shared_loading_dock', label: 'Shared Loading Dock' },
  { value: 'lobby_reception', label: 'Lobby / Reception Area' }, { value: 'shared_conference', label: 'Shared Conference Rooms' },
  { value: 'tenant_lounge', label: 'Tenant Lounge / Break Room' }, { value: 'fitness_center', label: 'Fitness Center / Gym' },
  { value: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' }, { value: 'fiber_optic', label: 'Fiber Optic Connectivity' },
  { value: 'multi_isp', label: 'Multiple Internet Providers' }, { value: 'backup_generator', label: 'Backup Generator' },
  { value: 'ada_building', label: 'ADA Compliant Building' }, { value: 'elevators', label: 'Elevators' },
  { value: 'covered_parking', label: 'Covered / Garage Parking' }, { value: 'ev_charging', label: 'EV Charging Stations' },
  { value: 'bicycle_storage', label: 'Bicycle Storage' }, { value: 'energy_efficient', label: 'Energy Efficient Building' },
  { value: 'leed_certified', label: 'LEED Certified / Green Building' },
];

function BuildingAmenitiesSection({ details, setDetail }) {
  const amenities = details.building_amenities || [];
  const toggle = (val) => setDetail('building_amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const hasOther = amenities.includes('other');
  const selected = amenities.length;
  return (
    <CollapsiblePanel title="Building Amenities" summary={selected > 0 ? `${selected} selected` : 'Shared building-level features & services'}>
      <div className="flex flex-wrap gap-2 pt-1">
        {BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggle(a.value)} />)}
        <Chip label="Other" selected={hasOther} onClick={() => toggle('other')} />
      </div>
      {hasOther && <div className="mt-3"><Input value={details.building_amenities_other || ''} onChange={e => setDetail('building_amenities_other', e.target.value)} placeholder="Describe the amenity…" /></div>}
    </CollapsiblePanel>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SALE — INVESTMENT LISTING COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function OfficeSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', padding: '12px 14px', marginBottom: '4px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>⚡ Use trailing 12-month <strong>actual</strong> income — not pro forma projections. Buyers will verify.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)" hint="Net Operating Income — gross income minus operating expenses"><Num field="sale_noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)" hint="Class A: 4–6% · Class B: 6–8% · Class C: 8–10%"><Num field="sale_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Occupancy (%)" hint="Current occupied %"><Num field="sale_occupancy" placeholder="e.g. 92" details={details} setDetail={setDetail} /></Field>
        <Field label="Net Rentable Area (SF)"><Num field="sale_nra" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
        <Field label="Number of Tenants"><Num field="sale_num_tenants" placeholder="e.g. 6" details={details} setDetail={setDetail} /></Field>
        <Field label="WALT (years)" hint="Weighted Avg Lease Term — target 3+ yrs"><Num field="sale_walt" placeholder="e.g. 3.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2005" details={details} setDetail={setDetail} /></Field>
        <Field label="Recent CapEx ($)" hint="Major improvements in last 3 years"><Num field="sale_recent_capex" placeholder="e.g. 200000" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Property Profile</SectionTitle>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <ToggleGroup label="Lease Type" value={details.sale_lease_type || ''} onChange={v => setDetail('sale_lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'modified_gross', label: 'Modified Gross' }, { value: 'full_service', label: 'Full Service' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Value-Add Opportunity" value={!!details.sale_value_add} onChange={v => setDetail('sale_value_add', v)} />
      </div>
      <Field label="Tenant Quality / Notes" hint="Major tenant names, credit quality, lease expiration schedule">
        <Textarea value={details.sale_tenant_notes || ''} onChange={e => setDetail('sale_tenant_notes', e.target.value)}
          placeholder="e.g. Anchor is a national credit tenant with 5 yrs remaining on NNN lease. 3 small tenants on month-to-month." rows={3} />
      </Field>
      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the investment opportunity, highlights, and why this is a strong acquisition…" rows={4} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Rent Roll / OM (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload offering memorandum or rent roll" />
      </div>
    </>
  );
}

const MEDICAL_SPECIALTIES = ['Primary Care', 'Dental', 'Cardiology', 'Orthopedic', 'Dermatology', 'Oncology', 'Imaging / Radiology', 'Physical Therapy', 'Dialysis', 'Urgent Care', 'Pediatrics', 'Ophthalmology', 'Other'];

function MedicalOfficeSaleInvestment({ details, setDetail }) {
  const specialties = details.sale_tenant_specialties || [];
  const toggleSpecialty = (s) => setDetail('sale_tenant_specialties', specialties.includes(s) ? specialties.filter(x => x !== s) : [...specialties, s]);
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', padding: '12px 14px', marginBottom: '4px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>⚡ MOB cap rates Q1 2026: hospital-system tenants 6–6.5% · Multi-tenant quality 6.5–7.5% · Short leases / lower quality 7.5–8.5%</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)"><Num field="sale_noi" placeholder="e.g. 220000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)" hint="National avg institutional quality: ~6.3%"><Num field="sale_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Occupancy (%)"><Num field="sale_occupancy" placeholder="e.g. 95" details={details} setDetail={setDetail} /></Field>
        <Field label="WALT (years)" hint="Medical tenants avg 7–10 yr leases"><Num field="sale_walt" placeholder="e.g. 7.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Number of Tenants"><Num field="sale_num_tenants" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Annual Rent Escalations (%)" hint="2–3% is standard for MOBs"><Num field="sale_rent_escalation" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2012" details={details} setDetail={setDetail} /></Field>
        <Field label="Total SF"><Num field="sale_total_sf" placeholder="e.g. 18000" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Medical Property Profile</SectionTitle>
      <Field label="Tenant Specialty Mix (select all that apply)">
        <div className="flex flex-wrap gap-2">
          {MEDICAL_SPECIALTIES.map(s => <Chip key={s} label={s} selected={specialties.includes(s)} onClick={() => toggleSpecialty(s)} />)}
        </div>
      </Field>
      <ToggleGroup label="Campus Location" value={details.sale_campus || ''} onChange={v => setDetail('sale_campus', v)}
        options={[{ value: 'on_campus', label: 'On-Campus (Hospital)' }, { value: 'off_campus', label: 'Off-Campus / Ambulatory' }, { value: 'adjacent', label: 'Hospital-Adjacent' }]} />
      <ToggleGroup label="Lease Structure" value={details.sale_lease_type || ''} onChange={v => setDetail('sale_lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'gross', label: 'Gross' }, { value: 'mixed', label: 'Mixed' }]} />
      <ToggleGroup label="Tenancy" value={details.sale_tenancy || ''} onChange={v => setDetail('sale_tenancy', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }]} />
      <Field label="Tenant Credit / Notes">
        <Textarea value={details.sale_tenant_notes || ''} onChange={e => setDetail('sale_tenant_notes', e.target.value)}
          placeholder="e.g. Anchor is a regional hospital system on a 10-yr NNN. Two specialty practices on 5-yr modified gross leases." rows={3} />
      </Field>
      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the investment opportunity and what makes this MOB attractive…" rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Offering Memorandum (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload OM or rent roll" />
      </div>
    </>
  );
}

function RetailSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', padding: '12px 14px', marginBottom: '4px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>⚡ Retail cap rates 2025: prime NNN single-tenant sub-5% · Well-located 5.5–7.5% · Dollar stores / pharmacies 7%+</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)"><Num field="sale_noi" placeholder="e.g. 150000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)" hint="Based on actual in-place income"><Num field="sale_cap_rate" placeholder="e.g. 6.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Occupancy (%)"><Num field="sale_occupancy" placeholder="e.g. 94" details={details} setDetail={setDetail} /></Field>
        <Field label="Gross Leasable Area — GLA (SF)"><Num field="sale_gla" placeholder="e.g. 12000" details={details} setDetail={setDetail} /></Field>
        <Field label="Number of Tenants"><Num field="sale_num_tenants" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Avg Remaining Lease Term (yrs)"><Num field="sale_avg_lease_term" placeholder="e.g. 4.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Traffic Count (vehicles/day)"><Num field="sale_traffic_count" placeholder="e.g. 28000" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1998" details={details} setDetail={setDetail} /></Field>
      </div>

      <SectionTitle>Retail Property Profile</SectionTitle>
      <Field label="Anchor Tenant Name" hint="Leave blank for single-tenant NNN — enter tenant name instead">
        <Input value={details.sale_anchor_tenant || ''} onChange={e => setDetail('sale_anchor_tenant', e.target.value)} placeholder="e.g. Kroger, Walgreens, Dollar General" />
      </Field>
      <ToggleGroup label="Lease Type" value={details.sale_lease_type || ''} onChange={v => setDetail('sale_lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'modified_gross', label: 'Modified Gross' }, { value: 'gross', label: 'Gross' }, { value: 'mixed', label: 'Mixed' }]} />
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Grocery-Anchored" value={!!details.sale_grocery_anchored} onChange={v => setDetail('sale_grocery_anchored', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Co-Tenancy Clauses Present" value={!!details.sale_co_tenancy_clauses} onChange={v => setDetail('sale_co_tenancy_clauses', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Value-Add Opportunity" value={!!details.sale_value_add} onChange={v => setDetail('sale_value_add', v)} />
      </div>
      <Field label="Tenant / Lease Notes">
        <Textarea value={details.sale_tenant_notes || ''} onChange={e => setDetail('sale_tenant_notes', e.target.value)}
          placeholder="e.g. Anchor on 10-yr NNN with 8 yrs remaining. 7 inline tenants on 3–5 yr modified gross leases. No co-tenancy clauses." rows={3} />
      </Field>
      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the investment opportunity and what makes this retail asset compelling…" rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Offering Memorandum (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload OM or rent roll" />
      </div>
    </>
  );
}

function IndustrialFlexSaleInvestment({ details, setDetail }) {
  return (
    <>
      <SectionTitle>Investment Financials</SectionTitle>
      <div style={{ background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', padding: '12px 14px', marginBottom: '4px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>⚡ Industrial cap rates 2025: 5–9.5% depending on size, location, and tenancy. Vacant / owner-occupied: priced on $/SF not cap rate.</p>
      </div>
      <div className="rounded-xl px-4 py-1 mb-4" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Currently Tenanted (income-producing)" value={!!details.sale_tenanted} onChange={v => setDetail('sale_tenanted', v)} />
      </div>

      {details.sale_tenanted && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="NOI / Year ($)"><Num field="sale_noi" placeholder="e.g. 120000" details={details} setDetail={setDetail} /></Field>
          <Field label="Cap Rate (%)"><Num field="sale_cap_rate" placeholder="e.g. 6.5" step="0.1" details={details} setDetail={setDetail} /></Field>
          <Field label="Occupancy (%)"><Num field="sale_occupancy" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
          <Field label="WALT (years)" hint="Industrial leases typically 1–10 yrs"><Num field="sale_walt" placeholder="e.g. 4.0" step="0.1" details={details} setDetail={setDetail} /></Field>
        </div>
      )}

      {!details.sale_tenanted && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Asking Price / SF ($)" hint="Used when vacant or owner-occupied"><Num field="sale_price_per_sf" placeholder="e.g. 95" details={details} setDetail={setDetail} /></Field>
        </div>
      )}

      <SectionTitle>Physical Profile</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total SF"><Num field="sale_total_sf" placeholder="e.g. 40000" details={details} setDetail={setDetail} /></Field>
        <Field label="Clear Height (ft)" hint="14–18 ft = flex/light · 24–32+ ft = distribution"><Num field="sale_clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Dock-High Doors"><Num field="sale_dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Drive-In / Grade-Level Doors"><Num field="sale_drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Office % of Total SF" hint="Flex: ~25–30% · Pure warehouse: 5–10%"><Num field="sale_office_pct" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Total Land / Lot (acres)"><Num field="sale_land_acres" placeholder="e.g. 3.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Year Built"><Num field="year_built" placeholder="e.g. 2008" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Lease Type" value={details.sale_lease_type || ''} onChange={v => setDetail('sale_lease_type', v)}
        options={[{ value: 'nnn', label: 'NNN' }, { value: 'modified_gross', label: 'Modified Gross' }, { value: 'gross', label: 'Gross' }]} />
      <ToggleGroup label="Tenancy" value={details.sale_tenancy || ''} onChange={v => setDetail('sale_tenancy', v)}
        options={[{ value: 'single', label: 'Single Tenant' }, { value: 'multi', label: 'Multi-Tenant' }, { value: 'vacant', label: 'Vacant' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power" value={!!details.three_phase} onChange={v => setDetail('three_phase', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Value-Add Opportunity" value={!!details.sale_value_add} onChange={v => setDetail('sale_value_add', v)} />
      </div>
      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the investment opportunity, building specs, and tenant situation…" rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Offering Memorandum (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload OM or rent roll" />
      </div>
    </>
  );
}

const SPECIAL_USE_TYPES = ['Religious/Church', 'Educational/School', 'Hospitality/Hotel', 'Event Center/Banquet', 'Sports/Recreation', 'Automotive/Specialty', 'Self-Storage', 'Car Wash', 'Gas Station / Convenience', 'Other'];

function SpecialUseSaleInvestment({ details, setDetail }) {
  const useType = details.specific_use || '';
  const isHotel = useType === 'Hospitality/Hotel';
  const isSelfStorage = useType === 'Self-Storage';
  return (
    <>
      <SectionTitle>Special Use Type</SectionTitle>
      <Field label="Property Type">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={useType} onChange={e => setDetail('specific_use', e.target.value)}>
          <option value="" style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>Select type</option>
          {SPECIAL_USE_TYPES.map(t => <option key={t} value={t} style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>{t}</option>)}
        </select>
      </Field>

      <SectionTitle>Investment Financials</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="NOI / Year ($)"><Num field="sale_noi" placeholder="e.g. 180000" details={details} setDetail={setDetail} /></Field>
        <Field label="Cap Rate (%)" hint="Self-storage: 5–10% · Hotels vary widely"><Num field="sale_cap_rate" placeholder="e.g. 7.0" step="0.1" details={details} setDetail={setDetail} /></Field>
      </div>

      {isHotel && (
        <>
          <SectionTitle>Hotel Metrics</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Rooms"><Num field="sale_num_rooms" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
            <Field label="Occupancy (%)"><Num field="sale_occupancy" placeholder="e.g. 72" details={details} setDetail={setDetail} /></Field>
            <Field label="ADR — Avg Daily Rate ($)" hint="Average rate per occupied room"><Num field="sale_adr" placeholder="e.g. 120" details={details} setDetail={setDetail} /></Field>
            <Field label="RevPAR ($)" hint="Revenue Per Available Room — key hotel metric"><Num field="sale_revpar" placeholder="e.g. 86" details={details} setDetail={setDetail} /></Field>
          </div>
          <ToggleGroup label="Brand / Flag" value={details.sale_hotel_brand || ''} onChange={v => setDetail('sale_hotel_brand', v)}
            options={[{ value: 'branded', label: 'Branded / Flagged' }, { value: 'independent', label: 'Independent' }]} />
        </>
      )}

      {isSelfStorage && (
        <>
          <SectionTitle>Self-Storage Metrics</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Total Units"><Num field="sale_total_units" placeholder="e.g. 250" details={details} setDetail={setDetail} /></Field>
            <Field label="Occupied Units"><Num field="sale_occupied_units" placeholder="e.g. 230" details={details} setDetail={setDetail} /></Field>
            <Field label="Avg Monthly Unit Rent ($)"><Num field="sale_avg_unit_rent" placeholder="e.g. 90" details={details} setDetail={setDetail} /></Field>
            <Field label="Climate Controlled Units %"><Num field="sale_climate_pct" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
          </div>
          <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <Toggle label="Value-Add Opportunity (below-market rents, vacant lots)" value={!!details.sale_value_add} onChange={v => setDetail('sale_value_add', v)} />
          </div>
        </>
      )}

      {!isHotel && !isSelfStorage && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Occupancy (%)"><Num field="sale_occupancy" placeholder="e.g. 90" details={details} setDetail={setDetail} /></Field>
          <Field label="Total SF"><Num field="sale_total_sf" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
          <Field label="Seating / Capacity" hint="Rooms, seats, beds as applicable"><Num field="seating_capacity" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
          <Field label="Year Built"><Num field="year_built" placeholder="e.g. 1995" details={details} setDetail={setDetail} /></Field>
        </div>
      )}

      <Field label="Description">
        <Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)}
          placeholder="Describe the investment opportunity, operation, and what makes this special use property attractive…" rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Offering Memorandum (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload OM" />
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXISTING LEASE COMPONENTS (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

const SPACE_AMENITIES = [
  { value: 'reception', label: 'Reception Area' }, { value: 'kitchenette', label: 'Kitchenette' },
  { value: 'server_room', label: 'Server Room' }, { value: 'storage', label: 'File / Storage Room' },
  { value: 'natural_light', label: 'Natural Light / Windows' }, { value: 'access_247', label: '24/7 Access' },
];
const LAYOUT_OPTIONS = [
  { value: 'open_plan', label: 'Open Plan' }, { value: 'partitioned', label: 'Partitioned' },
  { value: 'executive_suite', label: 'Executive Suite' }, { value: 'mixed', label: 'Mixed' }, { value: 'other', label: 'Other' },
];

function OfficeDetails({ details, setDetail }) {
  const amenities = details.amenities || [];
  const toggleAmenity = (val) => setDetail('amenities', amenities.includes(val) ? amenities.filter(a => a !== val) : [...amenities, val]);
  const hasRestrooms = !!details.in_suite_restrooms;
  return (
    <>
      <SectionTitle>Layout & Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 200" /></Field>
        <Field label="Number of Offices"><Num field="offices" placeholder="e.g. 10" details={details} setDetail={setDetail} /></Field>
        <Field label="Conference Rooms"><Num field="conf_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="In-Suite Restrooms" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && <div className="pb-2"><Field label="Restroom Pairs" hint={`${details.in_suite_restrooms || 1} Men's + ${details.in_suite_restrooms || 1} Women's`}><Num field="in_suite_restrooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field></div>}
        {!hasRestrooms && <p className="text-xs pb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Shared floor restrooms (standard)</p>}
      </div>
      <Field label="Layout Type"><div className="flex flex-wrap gap-2">{LAYOUT_OPTIONS.map(opt => <Chip key={opt.value} label={opt.label} selected={details.layout === opt.value} onClick={() => setDetail('layout', opt.value)} />)}</div></Field>
      <SectionTitle>In-Suite / Space Features</SectionTitle>
      <Field label="Select all that apply"><div className="flex flex-wrap gap-2">{SPACE_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={amenities.includes(a.value)} onClick={() => toggleAmenity(a.value)} />)}</div></Field>
      <Field label="In-Suite IT Infrastructure"><Input value={details.it_infrastructure || ''} onChange={e => setDetail('it_infrastructure', e.target.value)} placeholder="e.g., Cat6 wiring, dedicated fiber drop" /></Field>
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tags" hint="Keywords like 'renovated', 'corner location'"><Input value={details.tags || ''} onChange={e => setDetail('tags', e.target.value)} placeholder="e.g. renovated, corner location" /></Field>
        <Field label="Parking Ratio" hint="Spaces per 1,000 SF"><Input value={details.parking_ratio || ''} onChange={e => setDetail('parking_ratio', e.target.value)} placeholder="e.g. 4/1,000 SF" /></Field>
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height"><Input value={details.ceiling_height || ''} onChange={e => setDetail('ceiling_height', e.target.value)} placeholder="e.g. 9 ft" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2" /></Field>
      </div>
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Available" value={!!details.dedicated_parking} onChange={v => setDetail('dedicated_parking', v)} />
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const PRACTICE_TYPES = ['General Practice', 'Dental', 'Cardiology', 'Orthopedic', 'Dermatology', 'Pediatrics', 'Physical Therapy', 'Urgent Care', 'Other Specialty'];
const MEDICAL_FEATURES = [
  { value: 'xray', label: 'X-Ray Room / Shielding' }, { value: 'medical_gas', label: 'Medical Gas Lines' },
  { value: 'sterilization', label: 'Sterilization Area' }, { value: 'ada', label: 'ADA Compliant' }, { value: 'hipaa', label: 'HIPAA Compliant Layout' },
];

function MedicalOfficeDetails({ details, setDetail }) {
  const features = details.medical_features || [];
  const toggleFeature = (val) => setDetail('medical_features', features.includes(val) ? features.filter(f => f !== val) : [...features, val]);
  return (
    <>
      <SectionTitle>Exam & Procedure Capacity</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 300" /></Field>
        <Field label="Exam Rooms"><Num field="exam_rooms" placeholder="e.g. 8" details={details} setDetail={setDetail} /></Field>
        <Field label="Procedure Rooms"><Num field="procedure_rooms" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Lab Space (SF)"><Num field="lab_sf" placeholder="e.g. 400" details={details} setDetail={setDetail} /></Field>
        <Field label="Waiting Room Capacity"><Num field="waiting_capacity" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>In-Suite / Practice-Specific Features</SectionTitle>
      <Field label="Select all that apply"><div className="flex flex-wrap gap-2">{MEDICAL_FEATURES.map(f => <Chip key={f.value} label={f.label} selected={features.includes(f.value)} onClick={() => toggleFeature(f.value)} />)}</div></Field>
      <Field label="Medical Waste Disposal"><Input value={details.waste_disposal || ''} onChange={e => setDetail('waste_disposal', e.target.value)} placeholder="e.g., Sharps containers, biohazard" /></Field>
      <SectionTitle>Building Amenities</SectionTitle>
      <BuildingAmenitiesSection details={details} setDetail={setDetail} />
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking Ratio" hint="Spaces per 1,000 SF"><Input value={details.parking_ratio || ''} onChange={e => setDetail('parking_ratio', e.target.value)} placeholder="e.g. 5/1,000 SF" /></Field>
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height"><Input value={details.ceiling_height || ''} onChange={e => setDetail('ceiling_height', e.target.value)} placeholder="e.g. 9 ft" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. O-1 Medical" /></Field>
      </div>
      <div className="rounded-xl px-4 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Dedicated Parking Available" value={!!details.dedicated_parking} onChange={v => setDetail('dedicated_parking', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Valet Parking Available" value={!!details.valet_parking} onChange={v => setDetail('valet_parking', v)} />
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const RETAIL_SPECIAL_FEATURES = [
  { key: 'drive_thru', label: 'Drive-Thru Window' }, { key: 'grease_trap', label: 'Grease Trap' },
  { key: 'venting_hood', label: 'Venting / Hood' }, { key: 'cold_storage', label: 'Cold Storage / Walk-in Freezer' },
  { key: 'outdoor_seating', label: 'Outdoor Seating / Patio' }, { key: 'capped_utilities', label: 'Capped / Stubbed Utilities' },
  { key: 'showroom', label: 'Dedicated Showroom' }, { key: 'fitting_rooms', label: 'Fitting Rooms' },
  { key: 'high_end_lighting', label: 'High-End Lighting' }, { key: 'rear_loading', label: 'Rear Loading / Alley Access' },
  { key: 'vault', label: 'Secure Vault / Safe Room' }, { key: 'medical_flooring', label: 'Medical Grade Flooring' }, { key: 'auto_bay', label: 'Auto Bay / Garage Doors' },
];

function RetailDetails({ details, setDetail }) {
  const [featuresOpen, setFeaturesOpen] = React.useState(false);
  const features = details.retail_features || [];
  const toggleFeature = (key) => setDetail('retail_features', features.includes(key) ? features.filter(k => k !== key) : [...features, key]);
  const hasRestrooms = !!details.in_suite_restrooms;
  return (
    <>
      <SectionTitle>Primary Retail Specs</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Suite Number" hint="Optional"><Input value={details.suite_number || ''} onChange={e => setDetail('suite_number', e.target.value)} placeholder="e.g. Suite 150" /></Field>
        <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 2500" details={details} setDetail={setDetail} /></Field>
        <Field label="Sales Floor SF"><Num field="sales_floor_sf" placeholder="e.g. 1800" details={details} setDetail={setDetail} /></Field>
        <Field label="Street Frontage (ft)"><Num field="frontage" placeholder="e.g. 40" details={details} setDetail={setDetail} /></Field>
        <Field label="Ceiling Height (ft)"><Num field="ceiling_height" placeholder="e.g. 12" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Signage Rights">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} value={details.signage_rights || ''} onChange={e => setDetail('signage_rights', e.target.value)}>
            <option value="" style={{ background: '#0E1318' }}>Select signage type</option>
            {['Building', 'Pylon / Monument', 'Electronic', 'Window', 'None'].map(s => <option key={s} value={s} style={{ background: '#0E1318' }}>{s}</option>)}
          </select>
        </Field>
        <Field label="Traffic Count (vehicles/day)"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
      </div>
      <ToggleGroup label="Location Type" value={details.location_type || ''} onChange={v => setDetail('location_type', v)}
        options={[{ value: 'strip_mall', label: 'Strip Mall' }, { value: 'standalone', label: 'Standalone' }, { value: 'inline', label: 'Inline' }, { value: 'corner', label: 'Corner' }]} />
      <ToggleGroup label="Foot Traffic" value={details.foot_traffic || ''} onChange={v => setDetail('foot_traffic', v)}
        options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <button type="button" onClick={() => setFeaturesOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
          <span>Special Features {features.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: ACCENT }}>{features.length} selected</span>}</span>
          <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>{featuresOpen ? '−' : '+'}</span>
        </button>
        {featuresOpen && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {RETAIL_SPECIAL_FEATURES.map((f, idx) => (
              <React.Fragment key={f.key}>
                <Toggle label={f.label} value={features.includes(f.key)} onChange={() => toggleFeature(f.key)} />
                {idx < RETAIL_SPECIAL_FEATURES.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl px-4 py-2 space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="ADA Compliant" value={!!details.ada_compliant} onChange={v => setDetail('ada_compliant', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />
        <Toggle label="In-Suite Restrooms" value={hasRestrooms} onChange={v => setDetail('in_suite_restrooms', v ? 1 : 0)} />
        {hasRestrooms && <div className="pb-2 pt-1"><Field label="Restroom Pairs" hint={`${details.in_suite_restrooms || 1} Men's + ${details.in_suite_restrooms || 1} Women's`}><Num field="in_suite_restrooms" placeholder="e.g. 1" details={details} setDetail={setDetail} /></Field></div>}
      </div>
      <SectionTitle>Property Details & Media</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total Parking Spaces"><Num field="total_parking_spaces" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. C-2" /></Field>
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <Field label="Anchor Tenants"><Textarea value={details.anchor_tenants || ''} onChange={e => setDetail('anchor_tenants', e.target.value)} placeholder="e.g. Target, Starbucks" rows={2} /></Field>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, its highlights, and what makes it ideal for tenants…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

const AMPERAGE_OPTIONS = ['200A', '400A', '600A', '800A', '1000A', '1200A', '1600A', '2000A+'];
const SYSTEMS_CHECKLIST = [
  { key: 'sprinkler', label: 'Sprinkler System' }, { key: 'esfr', label: 'ESFR Sprinklers' },
  { key: 'hvac_warehouse', label: 'Warehouse HVAC (Conditioned)' }, { key: 'led_lighting', label: 'LED Warehouse Lighting' }, { key: 'skylights', label: 'Skylights' },
];
const DOCK_EQUIPMENT = [{ key: 'dock_levelers', label: 'Levelers' }, { key: 'dock_seals', label: 'Seals' }, { key: 'dock_restraints', label: 'Restraints' }];

function IndustrialFlexDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const systems = details.systems || [];
  const toggleSystem = (key) => setDetail('systems', systems.includes(key) ? systems.filter(s => s !== key) : [...systems, key]);
  const dockEq = details.dock_equipment || [];
  const toggleDockEq = (key) => setDetail('dock_equipment', dockEq.includes(key) ? dockEq.filter(d => d !== key) : [...dockEq, key]);
  return (
    <>
      <SectionTitle>Primary Loading & Access</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Loading Docks / Dock-Height Doors"><Num field="dock_doors" placeholder="e.g. 4" details={details} setDetail={setDetail} /></Field>
        <Field label="Drive-In / Grade-Level Doors"><Num field="drive_in_doors" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Clear Height (ft)"><Num field="clear_height" placeholder="e.g. 24" details={details} setDetail={setDetail} /></Field>
        <Field label="Truck Court Depth (ft)"><Input value={details.truck_court_depth || ''} onChange={e => setDetail('truck_court_depth', e.target.value)} placeholder="e.g. 130" /></Field>
        <Field label="Column Spacing (ft)"><Input value={details.column_spacing || ''} onChange={e => setDetail('column_spacing', e.target.value)} placeholder="e.g. 50 x 50" /></Field>
        <Field label="Loading Bay Size (ft)"><Input value={details.loading_bay_size || ''} onChange={e => setDetail('loading_bay_size', e.target.value)} placeholder="e.g. 100 x 50" /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Cross-Dock Capable" value={!!details.cross_dock} onChange={() => toggleBool('cross_dock')} />
      </div>
      <SectionTitle>Power & Infrastructure</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amperage">
          <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            value={details.power_amps || ''} onChange={e => setDetail('power_amps', e.target.value)}>
            <option value="" style={{ background: '#0E1318' }}>Select amperage</option>
            {AMPERAGE_OPTIONS.map(a => <option key={a} value={a} style={{ background: '#0E1318' }}>{a}</option>)}
          </select>
        </Field>
        <Field label="Additional Power Specs"><Input value={details.power_specs || ''} onChange={e => setDetail('power_specs', e.target.value)} placeholder="e.g. 480V, 3-Phase" /></Field>
      </div>
      <ToggleGroup label="Power Voltage" value={details.power_voltage || ''} onChange={v => setDetail('power_voltage', v)}
        options={[{ value: '240v', label: '240V' }, { value: '480v', label: '480V' }, { value: 'other', label: 'Other' }]} />
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="3-Phase Power" value={!!details.three_phase} onChange={() => toggleBool('three_phase')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Substation On-Site" value={!!details.substation_on_site} onChange={() => toggleBool('substation_on_site')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Crane System"><Input value={details.crane_system || ''} onChange={e => setDetail('crane_system', e.target.value)} placeholder="e.g. 10-ton bridge crane" /></Field>
        <Field label="Hook Height (ft)"><Num field="hook_height" placeholder="e.g. 22" details={details} setDetail={setDetail} /></Field>
        <Field label="Floor Load (lbs/sqft)"><Num field="floor_load" placeholder="e.g. 600" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Space Composition & Systems</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Office % of Total" hint="Helps distinguish Flex vs. Warehouse"><Num field="office_pct" placeholder="e.g. 20" details={details} setDetail={setDetail} /></Field>
        <Field label="Showroom SF"><Num field="showroom_sf" placeholder="e.g. 1000" details={details} setDetail={setDetail} /></Field>
      </div>
      <Field label="Systems Checklist">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {SYSTEMS_CHECKLIST.map((s, idx) => (
            <React.Fragment key={s.key}>
              <Toggle label={s.label} value={systems.includes(s.key)} onChange={() => toggleSystem(s.key)} />
              {idx < SYSTEMS_CHECKLIST.length - 1 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
            </React.Fragment>
          ))}
        </div>
      </Field>
      <SectionTitle>Exterior & Site Details</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Rail Access" value={!!details.rail_access} onChange={() => toggleBool('rail_access')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Fenced / Secured Yard" value={!!details.fenced_yard} onChange={() => toggleBool('fenced_yard')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Outside Storage Allowed" value={!!details.outside_storage} onChange={() => toggleBool('outside_storage')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Gated Access" value={!!details.gated_access} onChange={() => toggleBool('gated_access')} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Security Cameras" value={!!details.security_cameras} onChange={() => toggleBool('security_cameras')} />
      </div>
      <Field label="Dock Equipment"><div className="flex flex-wrap gap-2">{DOCK_EQUIPMENT.map(d => <Chip key={d.key} label={d.label} selected={dockEq.includes(d.key)} onClick={() => toggleDockEq(d.key)} />)}</div></Field>
      <SectionTitle>Property Specs & Documentation</SectionTitle>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the space, highlights, and ideal use…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking"><Input value={details.parking || ''} onChange={e => setDetail('parking', e.target.value)} placeholder="e.g. 40 spaces, truck parking" /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. M-1, I-2" /></Field>
      </div>
      <ToggleGroup label="Building Class" value={details.building_class || ''} onChange={v => setDetail('building_class', v)}
        options={[{ value: 'A', label: 'Class A' }, { value: 'B', label: 'Class B' }, { value: 'C', label: 'Class C' }]} />
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

function LandDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const utilities = details.utilities_to_site || [];
  const toggleUtility = (key) => setDetail('utilities_to_site', utilities.includes(key) ? utilities.filter(u => u !== key) : [...utilities, key]);
  const topography = details.topography || [];
  const toggleTopo = (key) => setDetail('topography', topography.includes(key) ? topography.filter(t => t !== key) : [...topography, key]);
  const selectCls = "w-full rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2";
  const selectStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
  const optionStyle = { background: '#0E1318', color: 'rgba(255,255,255,0.85)' };
  return (
    <>
      <CollapsiblePanel title="Property Access & Road Quality" summary={[details.road_surface, details.access_type].filter(Boolean).join(' · ') || 'Tap to configure'}>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Field label="Road Surface"><select className={selectCls} style={selectStyle} value={details.road_surface || ''} onChange={e => setDetail('road_surface', e.target.value)}><option value="" style={optionStyle}>Select surface</option>{['Paved/Asphalt', 'Concrete', 'Gravel', 'Dirt/Unimproved'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
          <Field label="Access Type"><select className={selectCls} style={selectStyle} value={details.access_type || ''} onChange={e => setDetail('access_type', e.target.value)}><option value="" style={optionStyle}>Select access type</option>{['Direct Frontage', 'Easement/Deeded', 'Shared Drive', 'Private Road'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
        </div>
        <Toggle label={`Road Maintenance: ${details.road_maintenance === 'private' ? 'Privately Maintained' : 'Publicly Maintained'}`} value={details.road_maintenance === 'private'} onChange={v => setDetail('road_maintenance', v ? 'private' : 'public')} />
      </CollapsiblePanel>
      <CollapsiblePanel title="Location Setting & Environment" summary={[details.location_setting, details.visibility].filter(Boolean).join(' · ') || 'Tap to configure'}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location Setting"><select className={selectCls} style={selectStyle} value={details.location_setting || ''} onChange={e => setDetail('location_setting', e.target.value)}><option value="" style={optionStyle}>Select setting</option>{['Highway Frontage', 'Main Road', 'Industrial Park', 'Suburban/Residential', 'Rural/Country'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
          <Field label="Visibility"><select className={selectCls} style={selectStyle} value={details.visibility || ''} onChange={e => setDetail('visibility', e.target.value)}><option value="" style={optionStyle}>Select visibility</option>{['High Visibility', 'Average', 'Hidden/Private'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
        </div>
      </CollapsiblePanel>
      <SectionTitle>Primary Land Dimensions</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Lot Dimensions (ft × ft)"><Input value={details.lot_dimensions || ''} onChange={e => setDetail('lot_dimensions', e.target.value)} placeholder="e.g. 300 x 725" /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><Toggle label="Divisible" value={!!details.divisible} onChange={v => setDetail('divisible', v)} /></div>
      <SectionTitle>Zoning & Development Status</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. B-2, M-1" /></Field>
        <Field label="Entitlements"><select className={selectCls} style={selectStyle} value={details.entitlements || ''} onChange={e => setDetail('entitlements', e.target.value)}><option value="" style={optionStyle}>Select status</option>{['Raw', 'Shovel Ready', 'Site Plan Approved'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
        <Field label="Curb Cuts"><Num field="curb_cuts" placeholder="e.g. 2" details={details} setDetail={setDetail} /></Field>
        <Field label="Max Build SF"><Num field="max_build_sf" placeholder="e.g. 50000" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Utilities & Infrastructure</SectionTitle>
      <Field label="Utilities to Site">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{ key: 'municipal_water', label: 'Municipal Water' }, { key: 'sanitary_sewer', label: 'Sanitary Sewer' }, { key: 'electric', label: 'Electric' }, { key: 'natural_gas', label: 'Natural Gas' }, { key: 'fiber_internet', label: 'Fiber / Internet' }].map((u, idx) => (
            <React.Fragment key={u.key}><Toggle label={u.label} value={utilities.includes(u.key)} onChange={() => toggleUtility(u.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <Field label="Perc Test Status"><select className={selectCls} style={selectStyle} value={details.perc_test || ''} onChange={e => setDetail('perc_test', e.target.value)}><option value="" style={optionStyle}>Select status</option>{['Completed', 'Needs Testing', 'Not Required'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}</select></Field>
      <SectionTitle>Physical Site Characteristics</SectionTitle>
      <Field label="Topography (select all that apply)">
        <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          {[{ key: 'level', label: 'Level / Flat' }, { key: 'wooded', label: 'Wooded' }, { key: 'cleared', label: 'Cleared' }, { key: 'wetlands', label: 'Wetlands / Marsh' }, { key: 'sloped', label: 'Sloped' }].map((t, idx) => (
            <React.Fragment key={t.key}><Toggle label={t.label} value={topography.includes(t.key)} onChange={() => toggleTopo(t.key)} />{idx < 4 && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}</React.Fragment>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Road Frontage (ft)"><Num field="road_frontage" placeholder="e.g. 300" details={details} setDetail={setDetail} /></Field>
        <Field label="Traffic Count (vehicles/day)"><Num field="traffic_count" placeholder="e.g. 25000" details={details} setDetail={setDetail} /></Field>
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Environmental Phase 1 Completed" value={!!details.phase1_completed} onChange={v => setDetail('phase1_completed', v)} />
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />
        <Toggle label="Survey Available" value={!!details.survey_available} onChange={v => setDetail('survey_available', v)} />
      </div>
      <SectionTitle>Property Details & Media</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Annual Property Tax ($)"><Num field="annual_tax" placeholder="e.g. 8500" details={details} setDetail={setDetail} /></Field>
        <Field label="Parcel Number"><Input value={details.parcel_number || ''} onChange={e => setDetail('parcel_number', e.target.value)} placeholder="e.g. 12-34-567-890" /></Field>
        <Field label="Zoning Overlay"><Input value={details.zoning_overlay || ''} onChange={e => setDetail('zoning_overlay', e.target.value)} placeholder="e.g. Opportunity Zone" /></Field>
      </div>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the site, its highlights, and development potential…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure / Site Plan (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF" />
      </div>
    </>
  );
}

const SPECIAL_INFRA = [
  { key: 'commercial_kitchen', label: 'Commercial Kitchen' }, { key: 'stage_platform', label: 'Stage / Platform' },
  { key: 'gymnasium', label: 'Gymnasium' }, { key: 'assembly_hall', label: 'Large Assembly Hall' },
  { key: 'sound_acoustic', label: 'Sound / Acoustic Treatment' }, { key: 'commercial_laundry', label: 'Commercial Laundry' }, { key: 'elevator_access', label: 'Elevator Access' },
];
const SPECIAL_USE_BUILDING_AMENITIES = [
  { value: 'on_site_management', label: 'On-Site Management' }, { value: 'security_247', label: '24/7 Security / Controlled Access' },
  { value: 'janitorial_common', label: 'Janitorial (Common Areas)' }, { value: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' },
  { value: 'fiber_optic', label: 'Fiber Optic Connectivity' }, { value: 'backup_generator', label: 'Backup Generator' },
  { value: 'ada_building', label: 'ADA Compliant Building' }, { value: 'elevators', label: 'Elevators' },
  { value: 'covered_parking', label: 'Covered / Garage Parking' }, { value: 'ev_charging', label: 'EV Charging Stations' },
  { value: 'energy_efficient', label: 'Energy Efficient Building' }, { value: 'leed_certified', label: 'LEED Certified / Green Building' },
];

function SpecialUseDetails({ details, setDetail }) {
  const toggleBool = (key) => setDetail(key, !details[key]);
  const buildingAmenities = details.building_amenities || [];
  const toggleBuildingAmenity = (val) => setDetail('building_amenities', buildingAmenities.includes(val) ? buildingAmenities.filter(a => a !== val) : [...buildingAmenities, val]);
  return (
    <>
      <SectionTitle>Current Use & Classification</SectionTitle>
      <Field label="Current Specific Use">
        <select className="w-full rounded-md px-3 py-2 text-sm focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
          value={details.specific_use || ''} onChange={e => setDetail('specific_use', e.target.value)}>
          <option value="" style={{ background: '#0E1318' }}>Select current use</option>
          {['Religious/Church', 'Educational/School', 'Hospitality/Hotel', 'Event Center/Banquet', 'Sports/Recreation', 'Automotive/Specialty', 'Other'].map(t => <option key={t} value={t} style={{ background: '#0E1318' }}>{t}</option>)}
        </select>
      </Field>
      {details.specific_use === 'Other' && <Field label="Describe Current Use"><Input value={details.specific_use_other || ''} onChange={e => setDetail('specific_use_other', e.target.value)} placeholder="e.g., Funeral Home, Bowling Alley" /></Field>}
      <SectionTitle>Key Capacity & Size</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Total SF"><Num field="total_sf" placeholder="e.g. 15000" details={details} setDetail={setDetail} /></Field>
        <Field label="Acreage"><Num field="acres" placeholder="e.g. 2.5" step="0.1" details={details} setDetail={setDetail} /></Field>
        <Field label="Seating Capacity" hint="Sanctuaries, theaters, stadiums"><Num field="seating_capacity" placeholder="e.g. 500" details={details} setDetail={setDetail} /></Field>
        <Field label="Bed / Room Count" hint="Hotels or Assisted Living"><Num field="bed_room_count" placeholder="e.g. 80" details={details} setDetail={setDetail} /></Field>
      </div>
      <SectionTitle>Specialty Infrastructure</SectionTitle>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        {SPECIAL_INFRA.map((f, idx) => (
          <React.Fragment key={f.key}>
            <Toggle label={f.label} value={!!details[f.key]} onChange={() => toggleBool(f.key)} />
            {idx < SPECIAL_INFRA.length && <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.25rem' }} />}
          </React.Fragment>
        ))}
        <Toggle label="ADA Compliant" value={!!details.ada_compliant} onChange={() => toggleBool('ada_compliant')} />
      </div>
      <div className="rounded-xl px-4 py-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <Toggle label="Specialty Equipment Included" value={!!details.specialty_equipment} onChange={() => toggleBool('specialty_equipment')} />
      </div>
      {details.specialty_equipment && <Field label="List Specialty Equipment"><Textarea value={details.specialty_equipment_list || ''} onChange={e => setDetail('specialty_equipment_list', e.target.value)} placeholder="e.g., Dental chairs, Commercial ovens, Industrial lifts…" rows={3} /></Field>}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Structural Modifications"><Input value={details.structural_modifications || ''} onChange={e => setDetail('structural_modifications', e.target.value)} placeholder="e.g., Reinforced floors, soundproofing" /></Field>
        <Field label="HVAC / Environmental Systems"><Input value={details.hvac_systems_details || ''} onChange={e => setDetail('hvac_systems_details', e.target.value)} placeholder="e.g., High-capacity HVAC, air filtration" /></Field>
      </div>
      <SectionTitle>Building Amenities</SectionTitle>
      <CollapsiblePanel title="Building Amenities" summary={buildingAmenities.length > 0 ? `${buildingAmenities.length} selected` : 'Shared building-level features & services'}>
        <div className="flex flex-wrap gap-2 pt-1">{SPECIAL_USE_BUILDING_AMENITIES.map(a => <Chip key={a.value} label={a.label} selected={buildingAmenities.includes(a.value)} onClick={() => toggleBuildingAmenity(a.value)} />)}</div>
      </CollapsiblePanel>
      <SectionTitle>Site & Compliance</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Parking Spaces"><Num field="parking" placeholder="e.g. 100" details={details} setDetail={setDetail} /></Field>
        <Field label="Zoning"><Input value={details.zoning || ''} onChange={e => setDetail('zoning', e.target.value)} placeholder="e.g. C-3, P-1" /></Field>
        <Field label="Zoning Overlay"><Input value={details.zoning_overlay || ''} onChange={e => setDetail('zoning_overlay', e.target.value)} placeholder="e.g. Historical District" /></Field>
        <Field label="Licensing Status"><Input value={details.licensing_status || ''} onChange={e => setDetail('licensing_status', e.target.value)} placeholder="e.g., Licensed daycare, State-approved school" /></Field>
      </div>
      <Field label="Description"><Textarea value={details.description || ''} onChange={e => setDetail('description', e.target.value)} placeholder="Describe the property, its unique features, and ideal use…" rows={4} /></Field>
      <Field label="Tags" hint="Press Enter to add each tag"><TagsInput value={details.tags || []} onChange={v => setDetail('tags', v)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <FileUpload label="Photos" accept="image/*" field="photo_url" details={details} setDetail={setDetail} hint="Upload a primary photo" />
        <FileUpload label="Brochure (PDF)" accept=".pdf" field="brochure_url" details={details} setDetail={setDetail} hint="Upload a PDF brochure" />
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ListStep2Commercial({ data, update, onNext }) {
  const details = data.property_details || {};
  const setDetail = (key, val) => update({ property_details: { ...details, [key]: val } });
  const type = data.property_type;

  const isSale = data.transaction_type === 'sale';
  // Land is investment-agnostic — no sale type toggle needed (always same fields)
  const showSaleToggle = isSale && type !== 'land';
  // Default commercial sale to investment
  const saleType = showSaleToggle ? (details.sale_type || 'investment') : '';
  const isInvestment = showSaleToggle && saleType === 'investment';

  return (
    <div className="space-y-6">
      <p className="text-sm -mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Details about your <strong className="capitalize">{type?.replace(/_/g, ' ')}</strong> space.
      </p>

      {showSaleToggle && (
        <SaleTypeSelector
          value={saleType}
          onChange={v => setDetail('sale_type', v)}
        />
      )}

      {type === 'office' && (isInvestment ? <OfficeSaleInvestment details={details} setDetail={setDetail} /> : <OfficeDetails details={details} setDetail={setDetail} />)}
      {type === 'medical_office' && (isInvestment ? <MedicalOfficeSaleInvestment details={details} setDetail={setDetail} /> : <MedicalOfficeDetails details={details} setDetail={setDetail} />)}
      {type === 'retail' && (isInvestment ? <RetailSaleInvestment details={details} setDetail={setDetail} /> : <RetailDetails details={details} setDetail={setDetail} />)}
      {type === 'industrial_flex' && (isInvestment ? <IndustrialFlexSaleInvestment details={details} setDetail={setDetail} /> : <IndustrialFlexDetails details={details} setDetail={setDetail} />)}
      {type === 'land' && <LandDetails details={details} setDetail={setDetail} />}
      {type === 'special_use' && (isInvestment ? <SpecialUseSaleInvestment details={details} setDetail={setDetail} /> : <SpecialUseDetails details={details} setDetail={setDetail} />)}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: ACCENT }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}