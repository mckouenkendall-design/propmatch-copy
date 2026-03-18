import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import FormProgress from './wizard/FormProgress';
import ListStep1 from './listing/Step1General';
import ListStep2Commercial from './listing/Step2CommercialDetails';
import ListStep2Residential from './listing/Step2ResidentialDetails';
import ListStep3ContactSubmit from './listing/Step3ContactSubmit';

const STEPS = ['Property', 'Details', 'Post'];

export default function ListingWizard({ category, onClose, onSuccess, initialData }) {
  const [step, setStep] = useState(1);
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
    contact_agent_name: '',
    contact_agent_email: '',
    contact_agent_phone: '',
    company_name: '',
    brokerage_id: '',
    visibility: 'public',
    visibility_groups: '',
    visibility_recipient_email: '',
    allow_direct_contact: true,
    status: 'active'
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const submitData = {
        ...data,
        property_details: JSON.stringify(data.property_details || {}),
        // Auto-generate title
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
    onSuccess
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => step === 1 ? onClose('back') : setStep(s => s - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ background: 'linear-gradient(135deg, #f0fdfc 0%, #ffffff 100%)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={back}><ArrowLeft className="w-5 h-5" /></Button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 capitalize">{category} Listing</h2>
                  <p className="text-sm text-gray-500">Step {step} of {STEPS.length}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onClose('close')}><X className="w-5 h-5" /></Button>
            </div>
            <FormProgress currentStep={step} steps={STEPS} />
          </div>
          <div className="px-6 py-6">
            {step === 1 && <ListStep1 data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'commercial' && <ListStep2Commercial data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'residential' && <ListStep2Residential data={formData} update={update} onNext={next} />}
            {step === 3 && <ListStep3ContactSubmit data={formData} update={update} onSubmit={() => mutation.mutate(formData)} isLoading={mutation.isPending} />}
          </div>
        </div>
      </div>
    </div>
  );
}