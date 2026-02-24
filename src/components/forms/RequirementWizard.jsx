import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import FormProgress from './wizard/FormProgress';
import ReqStep1 from './requirement/Step1General';
import ReqStep2Commercial from './requirement/Step2CommercialDetails';
import ReqStep2Residential from './requirement/Step2ResidentialDetails';
import ReqStep3 from './requirement/Step3Notes';
import ReqStep4 from './requirement/Step4Review';

const STEPS = ['General', 'Details', 'Notes', 'Review'];

export default function RequirementWizard({ category, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    property_category: category,
    title: '',
    client_name: '',
    property_type: '',
    transaction_type: '',
    price_period: 'total',
    timeline: 'flexible',
    cities: [],
    mapAreas: [],
    min_price: '',
    max_price: '',
    min_size_sqft: '',
    max_size_sqft: '',
    property_details: {},
    required_amenities: [],
    notes: '',
    status: 'active'
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const submitData = {
        ...data,
        property_details: JSON.stringify(data.property_details || {}),
        area_map_data: JSON.stringify(data.mapAreas || []),
      };
      delete submitData.mapAreas;
      if (submitData.min_price) submitData.min_price = parseFloat(submitData.min_price);
      if (submitData.max_price) submitData.max_price = parseFloat(submitData.max_price);
      if (submitData.min_size_sqft) submitData.min_size_sqft = parseFloat(submitData.min_size_sqft);
      if (submitData.max_size_sqft) submitData.max_size_sqft = parseFloat(submitData.max_size_sqft);
      return base44.entities.Requirement.create(submitData);
    },
    onSuccess
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, 4));
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
                  <h2 className="text-xl font-bold text-gray-800 capitalize">{category} Requirement</h2>
                  <p className="text-sm text-gray-500">Step {step} of {STEPS.length}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onClose('close')}><X className="w-5 h-5" /></Button>
            </div>
            <FormProgress currentStep={step} steps={STEPS} />
          </div>
          <div className="px-6 py-6">
            {step === 1 && <ReqStep1 data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'commercial' && <ReqStep2Commercial data={formData} update={update} onNext={next} />}
            {step === 2 && category === 'residential' && <ReqStep2Residential data={formData} update={update} onNext={next} />}
            {step === 3 && <ReqStep3 data={formData} update={update} onNext={next} />}
            {step === 4 && <ReqStep4 data={formData} onSubmit={() => mutation.mutate(formData)} isLoading={mutation.isPending} />}
          </div>
        </div>
      </div>
    </div>
  );
}