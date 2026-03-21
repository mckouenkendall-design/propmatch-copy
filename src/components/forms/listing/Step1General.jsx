import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import AddressAutocomplete from '../wizard/AddressAutocomplete';
import { ArrowRight, Building2, ShoppingBag, Package, Map, Home, Building, Users, Hotel, ChevronRight, Stethoscope, Star, Truck, TreePine } from 'lucide-react';

// ── Property type options ────────────────────────────────────────────────────
const COMMERCIAL_TYPES = [
  { value: 'office',             label: 'General Office',           icon: Building2 },
  { value: 'medical_office',     label: 'Medical Office',           icon: Stethoscope },
  { value: 'retail',             label: 'Retail',                   icon: ShoppingBag },
  { value: 'industrial_flex',    label: 'Industrial / Warehouse / Flex', icon: Package },
  { value: 'land',               label: 'Land',                     icon: Map },
  { value: 'special_use',        label: 'Special Use',              icon: Star },
];

const RESIDENTIAL_TYPES = [
  { value: 'single_family',   label: 'Single Family',        icon: Home },
  { value: 'condo',           label: 'Condo',                icon: Building },
  { value: 'apartment',       label: 'Apartment',            icon: Hotel },
  { value: 'multi_family',    label: 'Multi-Family (2–4)',   icon: Users },
  { value: 'multi_family_5',  label: 'Multi-Family (5+)',    icon: Users },
  { value: 'townhouse',       label: 'Townhouse',            icon: Building2 },
  { value: 'manufactured',    label: 'Manufactured / Mobile', icon: Truck },
  { value: 'land_residential', label: 'Land (Residential)',  icon: TreePine },
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

// ── Lease type tree ──────────────────────────────────────────────────────────
const LEASE_TYPES = [
  { value: 'full_service_gross', label: 'Full Service Gross' },
  {
    value: 'modified_gross', label: 'Modified Gross',
    subLabel: 'Select tenant expenses',
    subOptions: [
      { value: 'electricity', label: 'Electricity' },
      { value: 'water',       label: 'Water' },
      { value: 'janitorial',  label: 'Janitorial' },
      { value: 'trash',       label: 'Trash' },
    ],
  },
  {
    value: 'net_lease', label: 'Net Lease',
    subLabel: 'Select net lease type',
    subOptions: [
      { value: 'n',            label: 'N (Single Net)' },
      { value: 'nn',           label: 'NN (Double Net)' },
      { value: 'nnn',          label: 'NNN (Triple Net)' },
      { value: 'absolute_net', label: 'Absolute Net' },
    ],
    singleSelect: true, // radio-style
  },
  { value: 'ground_lease',     label: 'Ground Lease' },
  { value: 'percentage_lease', label: 'Percentage Lease' },
];

// ── Utilities for residential rent ──────────────────────────────────────────
const UTILITIES = [
  { value: 'none',         label: 'None (Tenant Pays All)' },
  { value: 'water',        label: 'Water' },
  { value: 'sewer',        label: 'Sewer' },
  { value: 'trash',        label: 'Trash' },
  { value: 'electricity',  label: 'Electricity' },
  { value: 'gas',          label: 'Gas' },
  { value: 'lawn_snow',    label: 'Lawn / Snow Maintenance' },
];

const isLeaseType = (t) => t === 'lease' || t === 'sublease';

// ── Chip / toggle button ─────────────────────────────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg border-2 text-sm font-medium text-left transition-all"
      style={{
        borderColor: selected ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
        backgroundColor: selected ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
        color: selected ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)',
      }}
    >
      {label}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ListStep1({ data, update, onNext }) {
  const isCommercial = data.property_category === 'commercial';
  const types  = isCommercial ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const txTypes = isCommercial ? COMMERCIAL_TX : RESIDENTIAL_TX;
  const showLease = isCommercial && isLeaseType(data.transaction_type);
  const showSalePrice = data.transaction_type === 'sale';
  const showRent = !isCommercial && data.transaction_type === 'rent';

  // Selected lease type object (with sub-options)
  const selectedLeaseType = LEASE_TYPES.find(l => l.value === data.lease_type);

  const handleTransactionType = (v) => {
    const period = v === 'sale' ? 'total' : v === 'rent' ? 'per_month' : 'per_sf_per_year';
    update({ transaction_type: v, price_period: period, lease_type: undefined, lease_sub: undefined, utilities_included: undefined });
  };

  // Toggle a multi-select sub-option (Modified Gross expenses)
  const toggleMultiSub = (val) => {
    const cur = data.lease_sub || [];
    update({ lease_sub: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] });
  };

  // Toggle utilities
  const toggleUtility = (val) => {
    let cur = data.utilities_included || [];
    if (val === 'none') {
      update({ utilities_included: cur.includes('none') ? [] : ['none'] });
      return;
    }
    cur = cur.filter(x => x !== 'none');
    update({ utilities_included: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] });
  };

  const canNext = data.property_type && data.transaction_type && data.city;

  return (
    <div className="space-y-6">
      {/* ── Property Type ── */}
      <div className="space-y-2">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Property Type <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-3 gap-3">
          {types.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => update({ property_type: value })}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2"
              style={{
                borderColor: data.property_type === value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
                backgroundColor: data.property_type === value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
              }}>
              <Icon className="w-6 h-6" style={{ color: data.property_type === value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.5)' }} />
              <span className="text-xs font-medium text-center" style={{ color: data.property_type === value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Size (SF) ── */}
      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Size (SF)</Label>
        <Input type="number" value={data.size_sqft || ''} onChange={e => update({ size_sqft: e.target.value })} placeholder="5,000" />
      </div>

      {/* ── Transaction Type ── */}
      <ToggleGroup
        label="Transaction Type *"
        value={data.transaction_type}
        onChange={handleTransactionType}
        options={txTypes}
      />

      {/* ── COMMERCIAL LEASE: Rate + Lease Type ── */}
      {showLease && (
        <>
          {/* Rate input */}
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Asking Rate ($ / SF / yr) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={data.price || ''}
              onChange={e => update({ price: e.target.value })}
              placeholder="e.g. 24.00"
            />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Price per square foot per year</p>
            {data.price && data.size_sqft && (
              <div className="mt-2 p-3 rounded-lg text-sm space-y-1" style={{ backgroundColor: '#e6f7f5' }}>
                <p className="font-medium" style={{ color: '#3A8A82' }}>Estimated totals:</p>
                <p className="text-gray-700">Monthly: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft) / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</strong></p>
                <p className="text-gray-700">Annual: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft)).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr</strong></p>
              </div>
            )}
          </div>

          {/* Lease Type */}
          <div className="space-y-2">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Lease Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEASE_TYPES.map(lt => (
                <Chip
                  key={lt.value}
                  label={lt.subOptions ? <span className="flex items-center gap-1">{lt.label} <ChevronRight className="w-3 h-3" /></span> : lt.label}
                  selected={data.lease_type === lt.value}
                  onClick={() => update({ lease_type: lt.value, lease_sub: undefined })}
                />
              ))}
            </div>

            {/* Sub-options for Modified Gross (multi) */}
            {data.lease_type === 'modified_gross' && (
              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Tenant Pays (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {LEASE_TYPES.find(l => l.value === 'modified_gross').subOptions.map(opt => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={(data.lease_sub || []).includes(opt.value)}
                      onClick={() => toggleMultiSub(opt.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sub-options for Net Lease (single select) */}
            {data.lease_type === 'net_lease' && (
              <div className="mt-3 p-3 rounded-xl space-y-2" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Net Lease Type</p>
                <div className="flex flex-wrap gap-2">
                  {LEASE_TYPES.find(l => l.value === 'net_lease').subOptions.map(opt => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={data.lease_sub === opt.value}
                      onClick={() => update({ lease_sub: opt.value })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── COMMERCIAL SALE: Total Price ── */}
      {isCommercial && showSalePrice && (
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Total Purchase Price ($) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={data.price || ''}
            onChange={e => update({ price: e.target.value })}
            placeholder="e.g. 1,250,000"
          />
        </div>
      )}

      {/* ── RESIDENTIAL RENT: Monthly Rent + Utilities ── */}
      {showRent && (
        <>
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Monthly Rent ($/mo) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              value={data.price || ''}
              onChange={e => update({ price: e.target.value })}
              placeholder="e.g. 2,500"
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Utilities Included in Rent</Label>
            <div className="flex flex-wrap gap-2">
              {UTILITIES.map(u => (
                <Chip
                  key={u.value}
                  label={u.label}
                  selected={(data.utilities_included || []).includes(u.value)}
                  onClick={() => toggleUtility(u.value)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── RESIDENTIAL SALE: Total Price ── */}
      {!isCommercial && showSalePrice && (
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Total Purchase Price ($) <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={data.price || ''}
            onChange={e => update({ price: e.target.value })}
            placeholder="e.g. 450,000"
          />
        </div>
      )}

      {/* ── Address / Location ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Address</Label>
          <AddressAutocomplete
            value={data.address || ''}
            onChange={(patch) => update(patch)}
            placeholder="123 Main Street"
          />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>City <span className="text-red-500">*</span></Label>
          <Input value={data.city || ''} onChange={e => update({ city: e.target.value })} placeholder="Ferndale" />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>State</Label>
          <Input value={data.state || ''} onChange={e => update({ state: e.target.value })} placeholder="MI" maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Zip Code</Label>
          <Input value={data.zip_code || ''} onChange={e => update({ zip_code: e.target.value })} placeholder="48220" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}