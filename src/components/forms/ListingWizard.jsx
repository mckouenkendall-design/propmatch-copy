import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import FormProgress from './wizard/FormProgress';
import ListStep1 from './listing/Step1General';
import ListStep2Commercial from './listing/Step2CommercialDetails';
import ListStep2Residential from './listing/Step2ResidentialDetails';
import ListStep3ContactSubmit from './listing/Step3ContactSubmit';

const STEPS = ['Property', 'Details', 'Post'];

const validateListing = (data) => {
  const errors = [];
  if (!data.property_type) errors.push('Property type is required (Step 1)');
  if (!data.transaction_type) errors.push('Transaction type is required (Step 1)');
  if (!data.city) errors.push('City is required (Step 1)');
  if (!data.price) errors.push('Price is required (Step 1)');
  return errors;
};

export default function ListingWizard({ category, onClose, onSuccess, initialData }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState(initialData || {
    property_category: category,
    title: '',
    property_type: '',
    transaction_type: '',
    price_period: 'total',
    lease_type: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    size_sqft: '',
    property_details: {},
    amenities: [],
    description: '',
    contact_agent_name: user?.full_name || '',
    contact_agent_email: user?.contact_email || user?.email || '',
    contact_agent_phone: user?.phone || '',
    company_name: user?.brokerage_name || '',
    brokerage_id: user?.employing_broker_id || '',
    visibility: 'public',
    visibility_groups: '',
    visibility_recipient_email: '',
    allow_direct_contact: true,
    status: 'active'
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const errors = validateListing(data);
      if (errors.length > 0) throw new Error(errors.join('\n'));
      const submitData = {
        ...data,
        property_details: JSON.stringify(data.property_details || {}),
        title: (() => {
          const typeMap = {
            office: 'Office Space', medical_office: 'Medical Office Space', retail: 'Retail Space',
            industrial_flex: 'Industrial/Flex Space', land: 'Land', special_use: 'Special Use Property',
            single_family: 'Single Family Home', condo: 'Condo', apartment: 'Apartment',
            multi_family: 'Multi-Family Property', multi_family_5: 'Multi-Family (5+) Property',
            townhouse: 'Townhouse', manufactured: 'Manufactured Home', land_residential: 'Residential Land',
          };
          const txMap = { lease: 'for Lease', sublease: 'for Sublease', sale: 'for Sale', rent: 'for Rent' };
          const type = typeMap[data.property_type] || data.property_type?.replace(/_/g, ' ');
          const tx = txMap[data.transaction_type] || data.transaction_type;
          const loc = [data.city, data.state].filter(Boolean).join(', ');
          return `${type} ${tx}${loc ? ` in ${loc}` : ''}`;
        })(),
      };
      if (submitData.price) submitData.price = parseFloat(submitData.price);
      if (submitData.size_sqft) submitData.size_sqft = parseFloat(submitData.size_sqft);
      return base44.entities.Listing.create(submitData);
    },
    onSuccess: (...args) => { setSubmitError(null); onSuccess?.(...args); },
    onError: (err) => setSubmitError(err.message || 'Something went wrong. Please try again.'),
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => step === 1 ? onClose('back') : setStep(s => s - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }} className="rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={back}><ArrowLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} /></Button>
                <div>
                  <h2 className="text-xl font-bold capitalize" style={{ color: 'white' }}>{category} Listing</h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Step {step} of {STEPS.length}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onClose('close')}><X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} /></Button>
            </div>
            <FormProgress currentStep={step} steps={STEPS} />
          </div>
          <div className="px-6 py-6">
            {step === 1 && <ListStep1 data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'commercial' && <ListStep2Commercial data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'residential' && <ListStep2Residential data={formData} update={update} onNext={next} />}
            {step === 3 && (
              <>
                <ListStep3ContactSubmit data={formData} update={update} onSubmit={() => mutation.mutate(formData)} isLoading={mutation.isPending} />
                {submitError && (
                  <div className="mt-4 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Please fix the following before submitting:</p>
                    {submitError.split('\n').map((e, i) => (
                      <p key={i} className="text-sm" style={{ color: '#fca5a5' }}>• {e}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}