import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import LocationAreaInput from '../wizard/LocationAreaInput';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Building2, ShoppingBag, Package, Map, Home, Building, Users, Hotel, Stethoscope, Star, Truck, TreePine } from 'lucide-react';

const COMMERCIAL_TYPES = [
  { value: 'office',          label: 'General Office',           icon: Building2 },
  { value: 'medical_office',  label: 'Medical Office',           icon: Stethoscope },
  { value: 'retail',          label: 'Retail',                   icon: ShoppingBag },
  { value: 'industrial_flex', label: 'Industrial / Warehouse / Flex', icon: Package },
  { value: 'land',            label: 'Land',                     icon: Map },
  { value: 'special_use',     label: 'Special Use',              icon: Star },
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

export default function ReqStep1({ data, update, onNext }) {
  const types = data.property_category === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const canNext = data.property_type && data.transaction_type && data.client_name;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Client Name <span className="text-red-500">*</span></Label>
        <Input value={data.client_name} onChange={e => update({ client_name: e.target.value })} placeholder="e.g. Jane Smith" />
      </div>

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

      <div className="space-y-1.5">
        <Label>Preferred Areas</Label>
        <LocationAreaInput
          areas={data.cities || []}
          mapAreas={data.mapAreas || []}
          onChange={({ areas, mapAreas }) => update({ cities: areas, mapAreas })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Size Range (SF)</Label>
        <div className="flex items-center gap-3">
          <Input type="number" placeholder="Min" value={data.min_size_sqft} onChange={e => update({ min_size_sqft: e.target.value })} className="flex-1" />
          <span className="text-gray-400 font-medium flex-shrink-0">–</span>
          <Input type="number" placeholder="Max" value={data.max_size_sqft} onChange={e => update({ max_size_sqft: e.target.value })} className="flex-1" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Price Range ($)</Label>
        <div className="flex items-center gap-3">
          <Input type="number" placeholder="Min" value={data.min_price} onChange={e => update({ min_price: e.target.value })} className="flex-1" />
          <span className="text-gray-400 font-medium flex-shrink-0">–</span>
          <Input type="number" placeholder="Max" value={data.max_price} onChange={e => update({ max_price: e.target.value })} className="flex-1" />
        </div>
      </div>

      <ToggleGroup label="Transaction Type *" value={data.transaction_type} onChange={v => update({ transaction_type: v })}
        options={[{ value: 'lease', label: 'Lease' }, { value: 'purchase', label: 'Purchase' }, { value: 'rent', label: 'Rent' }]} />

      <ToggleGroup label="Price Period" value={data.price_period} onChange={v => update({ price_period: v })}
        options={[{ value: 'total', label: 'Total' }, { value: 'per_month', label: 'Per Month' }, { value: 'annually', label: 'Annually' }]} />

      <ToggleGroup label="Move-In Timeline" value={data.timeline} onChange={v => update({ timeline: v })}
        options={[
          { value: 'asap', label: 'ASAP' },
          { value: 'flexible', label: 'Flexible' },
          { value: '1_3_months', label: '1–3 Months' },
          { value: '3_6_months', label: '3–6 Months' },
          { value: '6_9_months', label: '6–9 Months' },
          { value: '9_plus_months', label: '9+ Months' },
        ]} />

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}