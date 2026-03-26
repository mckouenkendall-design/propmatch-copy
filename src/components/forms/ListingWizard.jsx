import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Trash2 } from 'lucide-react';
import FormProgress from './wizard/FormProgress';
import ListStep1 from './listing/Step1General';
import ListStep2Commercial from './listing/Step2CommercialDetails';
import ListStep2Residential from './listing/Step2ResidentialDetails';
import ListStep3ContactSubmit from './listing/Step3ContactSubmit';

const STEPS = ['Property', 'Details', 'Post'];

const buildTitle = (data) => {
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
};

export default function ListingWizard({ category, onClose, onSuccess, initialData, editMode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    status: 'active',
  });

  const prepareSubmitData = (data) => {
    const submitData = {
      ...data,
      property_details: JSON.stringify(data.property_details || {}),
      title: buildTitle(data),
      created_by: data.created_by || user?.email,
    };
    const isLease = submitData.transaction_type === 'lease' || submitData.transaction_type === 'sublease';
    if (isLease && !submitData.lease_type) {
      submitData.lease_type = 'full_service_gross';
    }
    ['price', 'size_sqft'].forEach(f => {
      if (submitData[f] === '' || submitData[f] == null) delete submitData[f];
      else submitData[f] = parseFloat(submitData[f]);
    });
    return submitData;
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const submitData = prepareSubmitData(data);
      if (editMode && data.id) return base44.entities.Listing.update(data.id, submitData);
      return base44.entities.Listing.create(submitData);
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      onSuccess?.(...args);
    },
    onError: (err) => {
      console.error('Listing save error:', err);
      alert('Could not save listing: ' + (err?.message || 'Unknown error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Listing.delete(formData.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      onSuccess?.();
    },
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => step === 1 ? onClose('back') : setStep(s => s - 1);
  const cat = formData.property_category || category;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }} className="rounded-2xl shadow-2xl overflow-hidden">

          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={back}>
                  <ArrowLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                </Button>
                <div>
                  <h2 className="text-xl font-bold capitalize" style={{ color: 'white' }}>
                    {editMode ? 'Edit Listing' : `${category} Listing`}
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Step {step} of {STEPS.length}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onClose('close')}>
                <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
              </Button>
            </div>
            <FormProgress currentStep={step} steps={STEPS} />
          </div>

          <div className="px-6 py-6">
            {step === 1 && (
              <ListStep1 data={formData} update={update} onNext={next} />
            )}
            {step === 2 && cat === 'commercial' && (
              <ListStep2Commercial data={formData} update={update} onNext={next} />
            )}
            {step === 2 && cat === 'residential' && (
              <ListStep2Residential data={formData} update={update} onNext={next} />
            )}
            {step === 3 && (
              <div>
                <ListStep3ContactSubmit
                  data={formData}
                  update={update}
                  onSubmit={() => saveMutation.mutate(formData)}
                  isLoading={saveMutation.isPending}
                  editMode={editMode}
                />

                {editMode && (
                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {showDeleteConfirm ? (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '16px' }}>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>
                          Are you sure? This listing will be permanently deleted and cannot be recovered.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                            style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer' }}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Listing'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#ef4444', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Trash2 style={{ width: '15px', height: '15px' }} /> Delete Listing
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}