import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import AddressAutocomplete from '../wizard/AddressAutocomplete';
import { ArrowRight, Building2, ShoppingBag, Package, Map, Home, Building, Users, Hotel, ChevronRight, Stethoscope, Star, Truck, TreePine } from 'lucide-react';

const ACCENT = '#00DBC5';

const COMMERCIAL_TYPES = [
  { value: 'office',             label: 'General Office',               icon: Building2 },
  { value: 'medical_office',     label: 'Medical Office',               icon: Stethoscope },
  { value: 'retail',             label: 'Retail',                       icon: ShoppingBag },
  { value: 'industrial_flex',    label: 'Industrial / Warehouse / Flex', icon: Package },
  { value: 'land',               label: 'Land',                         icon: Map },
  { value: 'special_use',        label: 'Special Use',                  icon: Star },
];

const RESIDENTIAL_TYPES = [
  { value: 'single_family',    label: 'Single Family',         icon: Home },
  { value: 'condo',            label: 'Condo',                 icon: Building },
  { value: 'apartment',        label: 'Apartment',             icon: Hotel },
  { value: 'multi_family',     label: 'Multi-Family (2–4)',    icon: Users },
  { value: 'multi_family_5',   label: 'Multi-Family (5+)',     icon: Users },
  { value: 'townhouse',        label: 'Townhouse',             icon: Building2 },
  { value: 'manufactured',     label: 'Manufactured / Mobile', icon: Truck },
  { value: 'land_residential', label: 'Land (Residential)',    icon: TreePine },
];

const COMMERCIAL_TX = [
  { value: 'lease',    label: 'Lease' },
  { value: 'sublease', label: 'Sublease' },
  { value: 'sale',     label: 'Sale' },
];

const RESIDENTIAL_TX = [
  { value: 'rent', label: 'Rent' },
  { value: 'sale', label: 'Sale' },
];

const LEASE_TYPES = [
  { value: 'full_service_gross', label: 'Full Service Gross' },
  {
    value: 'modified_gross', label: 'Modified Gross',
    subOptions: [
      { value: 'electricity', label: 'Electricity' },
      { value: 'water',       label: 'Water' },
      { value: 'janitorial',  label: 'Janitorial' },
      { value: 'trash',       label: 'Trash' },
    ],
  },
  {
    value: 'net_lease', label: 'Net Lease',
    subOptions: [
      { value: 'n',            label: 'N (Single Net)' },
      { value: 'nn',           label: 'NN (Double Net)' },
      { value: 'nnn',          label: 'NNN (Triple Net)' },
      { value: 'absolute_net', label: 'Absolute Net' },
    ],
    singleSelect: true,
  },
  { value: 'ground_lease',     label: 'Ground Lease' },
  { value: 'percentage_lease', label: 'Percentage Lease' },
];

const UTILITIES = [
  { value: 'none',        label: 'None (Tenant Pays All)' },
  { value: 'water',       label: 'Water' },
  { value: 'sewer',       label: 'Sewer' },
  { value: 'trash',       label: 'Trash' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas',         label: 'Gas' },
  { value: 'lawn_snow',   label: 'Lawn / Snow Maintenance' },
];

const isLeaseType = (t) => t === 'lease' || t === 'sublease';

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-2 rounded-lg border-2 text-sm font-medium text-left transition-all"
      style={{
        borderColor: selected ? ACCENT : 'rgba(255,255,255,0.2)',
        backgroundColor: selected ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
        color: selected ? ACCENT : 'rgba(255,255,255,0.7)',
      }}>
      {label}
    </button>
  );
}

function Req() {
  return <span style={{ color: ACCENT, marginLeft: '2px' }}>*</span>;
}

function NumericInput({ value, onChange, placeholder, style, className }) {
  const addCommas = (str) => {
    if (!str) return '';
    const parts = str.replace(/,/g, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const [display, setDisplay] = React.useState(() => addCommas(String(value || '')));

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setDisplay(addCommas(raw));
    onChange(raw);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '6px',
    height: '36px',
    width: '100%',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    ...style,
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      style={inputStyle}
      className={className}
    />
  );
}

export default function ListStep1({ data, update, onNext }) {
  const isCommercial = data.property_category === 'commercial';
  const types = isCommercial ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const txTypes = isCommercial ? COMMERCIAL_TX : RESIDENTIAL_TX;
  const showLease = isCommercial && isLeaseType(data.transaction_type);
  const showSalePrice = data.transaction_type === 'sale';
  const showRent = !isCommercial && data.transaction_type === 'rent';

  const handleTransactionType = (v) => {
    const period = v === 'sale' ? 'total' : v === 'rent' ? 'per_month' : 'per_sf_per_year';
    update({ transaction_type: v, price_period: period, lease_type: undefined, lease_sub: undefined, utilities_included: undefined });
  };

  const toggleMultiSub = (val) => {
    const cur = data.lease_sub || [];
    update({ lease_sub: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] });
  };

  const toggleUtility = (val) => {
    let cur = data.utilities_included || [];
    if (val === 'none') { update({ utilities_included: cur.includes('none') ? [] : ['none'] }); return; }
    cur = cur.filter(x => x !== 'none');
    update({ utilities_included: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] });
  };

  // Required: property_type, size_sqft, transaction_type, city, state, zip_code
  const canNext = !!(
    data.property_type &&
    data.size_sqft &&
    data.transaction_type &&
    data.price &&
    data.city &&
    data.state &&
    data.zip_code
  );

  return (
    <div className="space-y-6">

      {/* Property Type */}
      <div className="space-y-2">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Property Type<Req /></Label>
        <div className="grid grid-cols-3 gap-3">
          {types.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => update({ property_type: value })}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2"
              style={{
                borderColor: data.property_type === value ? ACCENT : 'rgba(255,255,255,0.2)',
                backgroundColor: data.property_type === value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
              }}>
              <Icon className="w-6 h-6" style={{ color: data.property_type === value ? ACCENT : 'rgba(255,255,255,0.5)' }} />
              <span className="text-xs font-medium text-center" style={{ color: data.property_type === value ? ACCENT : 'rgba(255,255,255,0.7)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size (SF) */}
      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Size (SF)<Req /></Label>
        <NumericInput value={data.size_sqft || ''} onChange={v => update({ size_sqft: v })}
          placeholder="5,000"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
      </div>

      {/* Transaction Type */}
      <ToggleGroup
        label={<>Transaction Type<Req /></>}
        value={data.transaction_type}
        onChange={handleTransactionType}
        options={txTypes}
      />

      {/* Commercial Lease: Rate + Lease Type */}
      {showLease && (
        <>
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Asking Rate ($ / SF / yr)<Req /></Label>
            <NumericInput value={data.price || ''} onChange={v => update({ price: v })}
              placeholder="e.g. 24.00" step={0.01}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Price per square foot per year</p>
            {data.price && data.size_sqft && (
              <div className="mt-2 p-3 rounded-lg text-sm space-y-1" style={{ backgroundColor: 'rgba(0,219,197,0.08)', border: '1px solid rgba(0,219,197,0.2)' }}>
                <p className="font-medium" style={{ color: ACCENT }}>Estimated totals:</p>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Monthly: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft) / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</strong></p>
                <p style={{ color: 'rgba(255,255,255,0.7)' }}>Annual: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft)).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr</strong></p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Lease Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEASE_TYPES.map(lt => (
                <Chip key={lt.value}
                  label={lt.subOptions ? <span className="flex items-center gap-1">{lt.label} <ChevronRight className="w-3 h-3" /></span> : lt.label}
                  selected={data.lease_type === lt.value}
                  onClick={() => update({ lease_type: lt.value, lease_sub: undefined })}
                />
              ))}
            </div>
            {data.lease_type === 'modified_gross' && (
              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Tenant Pays (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {LEASE_TYPES.find(l => l.value === 'modified_gross').subOptions.map(opt => (
                    <Chip key={opt.value} label={opt.label} selected={(data.lease_sub || []).includes(opt.value)} onClick={() => toggleMultiSub(opt.value)} />
                  ))}
                </div>
              </div>
            )}
            {data.lease_type === 'net_lease' && (
              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Net Lease Type</p>
                <div className="flex flex-wrap gap-2">
                  {LEASE_TYPES.find(l => l.value === 'net_lease').subOptions.map(opt => (
                    <Chip key={opt.value} label={opt.label} selected={data.lease_sub === opt.value} onClick={() => update({ lease_sub: opt.value })} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Commercial Sale */}
      {isCommercial && showSalePrice && (
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Total Purchase Price ($)<Req /></Label>
          <NumericInput value={data.price || ''} onChange={v => update({ price: v })}
            placeholder="e.g. 1,250,000"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
      )}

      {/* Residential Rent */}
      {showRent && (
        <>
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Monthly Rent ($/mo)<Req /></Label>
            <NumericInput value={data.price || ''} onChange={v => update({ price: v })}
              placeholder="e.g. 2,500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>
          <div className="space-y-2">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Utilities Included in Rent</Label>
            <div className="flex flex-wrap gap-2">
              {UTILITIES.map(u => (
                <Chip key={u.value} label={u.label} selected={(data.utilities_included || []).includes(u.value)} onClick={() => toggleUtility(u.value)} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Residential Sale */}
      {!isCommercial && showSalePrice && (
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Total Purchase Price ($)<Req /></Label>
          <NumericInput value={data.price || ''} onChange={v => update({ price: v })}
            placeholder="e.g. 450,000"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
      )}

      {/* Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Address</Label>
          <AddressAutocomplete value={data.address || ''} onChange={(patch) => update(patch)} placeholder="123 Main Street" />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>City<Req /></Label>
          <Input value={data.city || ''} onChange={e => update({ city: e.target.value })} placeholder="Ferndale"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>State<Req /></Label>
          <Input value={data.state || ''} onChange={e => update({ state: e.target.value })} placeholder="MI" maxLength={2}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Zip Code<Req /></Label>
          <Input value={data.zip_code || ''} onChange={e => update({ zip_code: e.target.value })} placeholder="48220"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2"
          style={{ backgroundColor: canNext ? ACCENT : 'rgba(255,255,255,0.15)', color: canNext ? '#111827' : 'rgba(255,255,255,0.3)', cursor: canNext ? 'pointer' : 'not-allowed' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}