import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Building2, ShoppingBag, Package, Map, LayoutGrid, Home, Building, Users, Hotel, Layers } from 'lucide-react';

const COMMERCIAL_TYPES = [
  { value: 'office', label: 'Office', icon: Building2 },
  { value: 'retail', label: 'Retail', icon: ShoppingBag },
  { value: 'industrial', label: 'Industrial', icon: Package },
  { value: 'flex_warehouse', label: 'Flex / Warehouse', icon: Layers },
  { value: 'land', label: 'Land', icon: Map },
  { value: 'mixed_use', label: 'Mixed Use', icon: LayoutGrid },
];

const RESIDENTIAL_TYPES = [
  { value: 'single_family', label: 'Single Family', icon: Home },
  { value: 'condo', label: 'Condo', icon: Building },
  { value: 'apartment', label: 'Apartment', icon: Hotel },
  { value: 'multi_family', label: 'Multi-Family', icon: Users },
  { value: 'townhouse', label: 'Townhouse', icon: Building2 },
];

const COMMERCIAL_TRANSACTION_TYPES = [
  { value: 'lease', label: 'Lease' },
  { value: 'sale', label: 'Sale' },
  { value: 'sublease', label: 'Sublease' },
];

const RESIDENTIAL_TRANSACTION_TYPES = [
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' },
];

const LEASE_TYPES = [
  { value: 'nnn', label: 'NNN (Triple Net)' },
  { value: 'modified_gross', label: 'Modified Gross' },
  { value: 'full_service_gross', label: 'Full Service Gross' },
  { value: 'gross', label: 'Gross' },
  { value: 'plus_utilities', label: '+ Utilities' },
];

// Derive price label and placeholder from transaction type
function getPriceConfig(transactionType, category) {
  if (transactionType === 'sale') {
    return {
      label: 'Asking Price ($)',
      placeholder: 'e.g. 1,250,000',
      helpText: 'Total sale price',
      period: 'total',
    };
  }
  if (transactionType === 'rent') {
    return {
      label: 'Monthly Rent ($/mo)',
      placeholder: 'e.g. 2,500',
      helpText: 'Per month',
      period: 'per_month',
    };
  }
  // lease or sublease (commercial)
  return {
    label: 'Asking Rate ($ / SF / yr)',
    placeholder: 'e.g. 24.00',
    helpText: 'Price per square foot per year — monthly and annual totals will be calculated from SF',
    period: 'per_sf_per_year',
  };
}

const isLeaseType = (t) => t === 'lease' || t === 'sublease';

export default function ListStep1({ data, update, onNext }) {
  const isCommercial = data.property_category === 'commercial';
  const types = isCommercial ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const txTypes = isCommercial ? COMMERCIAL_TRANSACTION_TYPES : RESIDENTIAL_TRANSACTION_TYPES;

  const priceConfig = data.transaction_type ? getPriceConfig(data.transaction_type, data.property_category) : null;

  // Auto-set price_period when transaction type changes
  const handleTransactionType = (v) => {
    const config = getPriceConfig(v, data.property_category);
    update({ transaction_type: v, price_period: config.period, lease_type: isLeaseType(v) ? data.lease_type : undefined });
  };

  const canNext = data.property_type && data.transaction_type && data.city;

  return (
    <div className="space-y-6">
      {/* Property Type */}
      <div className="space-y-2">
        <Label>Property Type <span className="text-red-500">*</span></Label>
        <div className="grid grid-cols-3 gap-3">
          {types.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => update({ property_type: value })}
              className="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2"
              style={{
                borderColor: data.property_type === value ? 'var(--tiffany-blue)' : '#e5e7eb',
                backgroundColor: data.property_type === value ? '#e6f7f5' : 'white',
              }}>
              <Icon className="w-6 h-6" style={{ color: data.property_type === value ? 'var(--tiffany-blue)' : '#9ca3af' }} />
              <span className="text-xs font-medium text-center" style={{ color: data.property_type === value ? '#3A8A82' : '#6b7280' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Type */}
      <ToggleGroup
        label="Transaction Type *"
        value={data.transaction_type}
        onChange={handleTransactionType}
        options={txTypes}
      />

      {/* Lease Type — only for lease/sublease on commercial */}
      {isCommercial && isLeaseType(data.transaction_type) && (
        <div className="space-y-2">
          <Label>Lease Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {LEASE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ lease_type: value })}
                className="px-3 py-2.5 rounded-lg border-2 text-sm font-medium text-left transition-all"
                style={{
                  borderColor: data.lease_type === value ? 'var(--tiffany-blue)' : '#e5e7eb',
                  backgroundColor: data.lease_type === value ? '#e6f7f5' : 'white',
                  color: data.lease_type === value ? '#3A8A82' : '#6b7280',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Address */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input value={data.address || ''} onChange={e => update({ address: e.target.value })} placeholder="123 Main Street" />
        </div>
        <div className="space-y-1.5">
          <Label>City <span className="text-red-500">*</span></Label>
          <Input value={data.city || ''} onChange={e => update({ city: e.target.value })} placeholder="Ferndale" />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Input value={data.state || ''} onChange={e => update({ state: e.target.value })} placeholder="MI" maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Zip Code</Label>
          <Input value={data.zip_code || ''} onChange={e => update({ zip_code: e.target.value })} placeholder="48220" />
        </div>
        <div className="space-y-1.5">
          <Label>Size (SF)</Label>
          <Input type="number" value={data.size_sqft || ''} onChange={e => update({ size_sqft: e.target.value })} placeholder="5,000" />
        </div>
      </div>

      {/* Price — conditional on transaction type */}
      {priceConfig && (
        <div className="space-y-1.5">
          <Label>{priceConfig.label} <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={data.price || ''}
            onChange={e => update({ price: e.target.value })}
            placeholder={priceConfig.placeholder}
          />
          <p className="text-xs text-gray-400">{priceConfig.helpText}</p>
          {/* Show calculated monthly/annual for leases */}
          {isLeaseType(data.transaction_type) && data.price && data.size_sqft && (
            <div className="mt-2 p-3 rounded-lg text-sm space-y-1" style={{ backgroundColor: '#e6f7f5' }}>
              <p className="font-medium" style={{ color: '#3A8A82' }}>Estimated totals:</p>
              <p className="text-gray-700">Monthly: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft) / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</strong></p>
              <p className="text-gray-700">Annual: <strong>${(parseFloat(data.price) * parseFloat(data.size_sqft)).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr</strong></p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}