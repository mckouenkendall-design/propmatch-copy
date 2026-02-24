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

export default function ListStep1({ data, update, onNext }) {
  const types = data.property_category === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const canNext = data.property_type && data.transaction_type && data.city;

  return (
    <div className="space-y-6">
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

      <ToggleGroup label="Transaction Type *" value={data.transaction_type} onChange={v => update({ transaction_type: v })}
        options={[{ value: 'lease', label: 'Lease' }, { value: 'sale', label: 'Sale' }, { value: 'rent', label: 'Rent' }, { value: 'sublease', label: 'Sublease' }]} />

      <ToggleGroup label="Price Period" value={data.price_period} onChange={v => update({ price_period: v })}
        options={[{ value: 'total', label: 'Total' }, { value: 'per_month', label: 'Per Month' }, { value: 'annually', label: 'Annually' }]} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input value={data.address} onChange={e => update({ address: e.target.value })} placeholder="123 Main Street" />
        </div>
        <div className="space-y-1.5">
          <Label>City <span className="text-red-500">*</span></Label>
          <Input value={data.city} onChange={e => update({ city: e.target.value })} placeholder="Ferndale" />
        </div>
        <div className="space-y-1.5">
          <Label>State</Label>
          <Input value={data.state} onChange={e => update({ state: e.target.value })} placeholder="MI" maxLength={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Zip Code</Label>
          <Input value={data.zip_code} onChange={e => update({ zip_code: e.target.value })} placeholder="48220" />
        </div>
        <div className="space-y-1.5">
          <Label>Size (SF)</Label>
          <Input type="number" value={data.size_sqft} onChange={e => update({ size_sqft: e.target.value })} placeholder="5000" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Asking Price ($) <span className="text-red-500">*</span></Label>
        <Input type="number" value={data.price} onChange={e => update({ price: e.target.value })} placeholder="e.g. 450000" />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}