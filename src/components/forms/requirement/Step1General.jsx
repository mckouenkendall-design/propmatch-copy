import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import LocationAreaInput from '../wizard/LocationAreaInput';
import ToggleGroup from '../wizard/ToggleGroup';
import { ArrowRight, Building2, ShoppingBag, Package, Map, Home, Building, Users, Hotel, Stethoscope, Star, Truck, TreePine } from 'lucide-react';

const ACCENT = '#00DBC5';

const COMMERCIAL_TYPES = [
  { value: 'office',          label: 'General Office',               icon: Building2 },
  { value: 'medical_office',  label: 'Medical Office',               icon: Stethoscope },
  { value: 'retail',          label: 'Retail',                       icon: ShoppingBag },
  { value: 'industrial_flex', label: 'Industrial / Warehouse / Flex', icon: Package },
  { value: 'land',            label: 'Land',                         icon: Map },
  { value: 'special_use',     label: 'Special Use',                  icon: Star },
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

function Req() {
  return <span style={{ color: ACCENT, marginLeft: '2px' }}>*</span>;
}

export default function ReqStep1({ data, update, onNext }) {
  const types = data.property_category === 'commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;

  // Required: property_type, at least one preferred area, transaction_type
  const hasPrice = !!(data.min_price || data.max_price);

  const canNext = !!(
    data.property_type &&
    data.cities && data.cities.length > 0 &&
    data.transaction_type &&
    hasPrice
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

      {/* Preferred Areas */}
      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Preferred Areas<Req /></Label>
        <LocationAreaInput
          areas={data.cities || []}
          mapAreas={data.mapAreas || []}
          onChange={({ areas, mapAreas }) => update({ cities: areas, mapAreas })}
        />
      </div>

      {/* Size Range */}
      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Size Range (SF)</Label>
        <div className="flex items-center gap-3">
          <Input type="number" placeholder="Min" value={data.min_size_sqft || ''}
            onChange={e => update({ min_size_sqft: e.target.value })} className="flex-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <span className="font-medium flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>–</span>
          <Input type="number" placeholder="Max" value={data.max_size_sqft || ''}
            onChange={e => update({ max_size_sqft: e.target.value })} className="flex-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
      </div>

      {/* Transaction Type */}
      <ToggleGroup
        label={<>Transaction Type<Req /></>}
        value={data.transaction_type}
        onChange={v => {
          const defaultPeriod = v === 'purchase' ? 'purchase' : 'per_month';
          update({ transaction_type: v, price_period: defaultPeriod });
        }}
        options={[
          { value: 'lease',    label: 'Lease' },
          { value: 'purchase', label: 'Purchase' },
          { value: 'rent',     label: 'Rent' },
        ]}
      />

      {/* Price Range */}
      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Price Range<Req /></Label>
        {data.transaction_type === 'purchase' ? (
          <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.5)' }}>Total purchase price range</p>
        ) : (data.transaction_type === 'lease' || data.transaction_type === 'rent') ? (
          <ToggleGroup
            label=""
            value={data.price_period}
            onChange={v => update({ price_period: v })}
            options={[
              { value: 'per_month',       label: 'Per Month' },
              { value: 'per_sf_per_year', label: 'Per Year' },
            ]}
          />
        ) : null}
        <div className="flex items-center gap-3 mt-2">
          <Input type="number" placeholder="Min $" value={data.min_price || ''} onChange={e => update({ min_price: e.target.value })} className="flex-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          <span className="font-medium flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>–</span>
          <Input type="number" placeholder="Max $" value={data.max_price || ''} onChange={e => update({ max_price: e.target.value })} className="flex-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
        </div>
      </div>

      {/* Timeline */}
      <ToggleGroup
        label="Move-In Timeline"
        value={data.timeline}
        onChange={v => update({ timeline: v })}
        options={[
          { value: 'asap',          label: 'ASAP' },
          { value: 'flexible',      label: 'Flexible' },
          { value: '1_3_months',    label: '1–3 Months' },
          { value: '3_6_months',    label: '3–6 Months' },
          { value: '6_9_months',    label: '6–9 Months' },
          { value: '9_plus_months', label: '9+ Months' },
        ]}
      />

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} disabled={!canNext} className="text-white gap-2"
          style={{ backgroundColor: canNext ? ACCENT : 'rgba(255,255,255,0.15)', color: canNext ? '#111827' : 'rgba(255,255,255,0.3)', cursor: canNext ? 'pointer' : 'not-allowed' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

    </div>
  );
}