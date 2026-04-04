import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X, Trash2 } from 'lucide-react';
import FormProgress from './wizard/FormProgress';
import ReqStep1 from './requirement/Step1General';
import ReqStep2Commercial from './requirement/Step2CommercialDetails';
import ReqStep2Residential from './requirement/Step2ResidentialDetails';
import ReqStep3 from './requirement/Step3Notes';

const STEPS = ['General', 'Details', 'Post'];

const generateTitle = (data) => {
  const txMap = { lease: 'Lease', purchase: 'Purchase', rent: 'Rent' };
  const typeMap = {
    office: 'Office Space', medical_office: 'Medical Office Space', retail: 'Retail Space',
    industrial_flex: 'Industrial/Flex Space', land: 'Land', special_use: 'Special Use Property',
    single_family: 'Single Family Home', condo: 'Condo', apartment: 'Apartment',
    multi_family: 'Multi-Family Property', multi_family_5: 'Multi-Family (5+) Property',
    townhouse: 'Townhouse', manufactured: 'Manufactured Home', land_residential: 'Residential Land',
  };
  const tx = txMap[data.transaction_type] || data.transaction_type;
  const type = typeMap[data.property_type] || data.property_type;
  const cityStr = (data.cities || []).slice(0, 2).join(', ');
  return `Client looking to ${tx} ${type}${cityStr ? ` in ${cityStr}` : ''}`;
};

const validate = (data) => {
  const errors = [];
  if (!data.property_type) errors.push('Property type is required (Step 1)');
  if (!data.transaction_type) errors.push('Transaction type is required (Step 1)');
  if (!data.max_price) errors.push('Max price / budget is required (Step 1)');
  return errors;
};

export default function RequirementWizard({ category, onClose, onSuccess, initialData, editMode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const parseInitialData = (data) => {
    if (!data) return null;
    return {
      ...data,
      property_details: typeof data.property_details === 'string'
        ? (() => { try { return JSON.parse(data.property_details); } catch { return {}; } })()
        : (data.property_details || {}),
      mapAreas: data.mapAreas || (() => { try { return JSON.parse(data.area_map_data || '[]'); } catch { return []; } })(),
    };
  };

  const [formData, setFormData] = useState(parseInitialData(initialData) || {
    property_category: category,
    title: '',
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
    status: 'active',
    visibility: 'public',
    visibility_groups: '',
    visibility_recipient_email: '',
    contact_agent_name: user?.full_name || '',
    contact_agent_email: user?.contact_email || user?.email || '',
    contact_agent_phone: user?.phone || '',
    company_name: user?.brokerage_name || '',
    brokerage_id: user?.employing_broker_id || '',
  });

  const prepareSubmitData = (data) => {
    const submitData = { ...data };
    submitData.title = generateTitle(data);
    submitData.property_details = JSON.stringify(data.property_details || {});
    submitData.area_map_data = JSON.stringify(data.mapAreas || []);
    submitData.created_by = data.created_by || user?.email;
    delete submitData.mapAreas;
    ['min_price', 'max_price', 'min_size_sqft', 'max_size_sqft', 'min_bedrooms', 'min_bathrooms'].forEach(f => {
      if (submitData[f] === '' || submitData[f] == null) delete submitData[f];
      else submitData[f] = parseFloat(submitData[f]);
    });
    return submitData;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ data, sendMode, groupId }) => {
      const errors = validate(data);
      if (errors.length > 0) throw new Error(errors.join('\n'));
      const submitData = prepareSubmitData(data);
      let requirement;
      if (editMode && data.id) {
        requirement = await base44.entities.Requirement.update(data.id, submitData);
      } else {
        requirement = await base44.entities.Requirement.create(submitData);
      }
      const postId   = requirement?.id || data.id;
      const postType = 'requirement';
      const myEmail  = user?.email || '';
      const myName   = user?.full_name || user?.email || 'Agent';
      const recipients = (data.visibility_recipient_email || '')
        .split(',').map(s => s.trim()).filter(Boolean);

      if (sendMode === 'separately' && recipients.length > 0) {
        for (const email of recipients) {
          try {
            const existing = await base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: email });
            const existing2 = existing.length ? existing : await base44.entities.Conversation.filter({ participant_1: email, participant_2: myEmail });
            let convoId;
            if (existing2.length) {
              convoId = existing2[0].id;
            } else {
              const convo = await base44.entities.Conversation.create({ participant_1: myEmail, participant_2: email, last_message: 'Shared a requirement', last_message_time: new Date().toISOString(), unread_by_1: 0, unread_by_2: 1 });
              convoId = convo.id;
            }
            await base44.entities.Message.create({ conversation_id: convoId, sender_email: myEmail, content: 'Shared a requirement', post_id: postId, post_type: postType, sent_at: new Date().toISOString() });
          } catch (e) { console.error('Send separately error:', e); }
        }
      } else if (sendMode === 'create_group' && recipients.length > 0) {
        const participantEmails = [myEmail, ...recipients];
        const gc = await base44.entities.GroupConversation.create({
          name: recipients.map(e => e.split('@')[0]).join(', '),
          participant_emails: JSON.stringify(participantEmails),
          created_by: myEmail,
          last_message: 'Shared a requirement',
          last_message_time: new Date().toISOString(),
          last_message_sender: myName,
        });
        await base44.entities.GroupMessage.create({ group_conversation_id: gc.id, sender_email: myEmail, sender_name: myName, content: 'Shared a requirement', post_id: postId, post_type: postType });
      } else if (sendMode === 'existing_group' && groupId) {
        await base44.entities.GroupMessage.create({ group_conversation_id: groupId, sender_email: myEmail, sender_name: myName, content: 'Shared a requirement', post_id: postId, post_type: postType });
        await base44.entities.GroupConversation.update(groupId, { last_message: 'Shared a requirement', last_message_time: new Date().toISOString(), last_message_sender: myName });
      }
      return requirement;
    },
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
      onSuccess?.(...args);
    },
    onError: (err) => {
      alert('Could not save requirement: ' + (err?.message || 'Unknown error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Requirement.delete(formData.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
      onSuccess?.();
    },
  });

  const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => step === 1 ? onClose('back') : setStep(s => s - 1);

  const COMMERCIAL_TYPES = ['office','medical_office','retail','industrial_flex','land','special_use'];
  const RESIDENTIAL_TYPES = ['single_family','condo','apartment','multi_family','multi_family_5','townhouse','manufactured','land_residential'];

  // Always derive from property_type first — it's the most reliable source
  const cat = formData.property_type
    ? (COMMERCIAL_TYPES.includes(formData.property_type) ? 'commercial'
      : RESIDENTIAL_TYPES.includes(formData.property_type) ? 'residential'
      : 'commercial')
    : (formData.property_category || category || 'commercial');

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
                    {editMode ? 'Edit Requirement' : `${cat} Requirement`}
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Step {step} of 3</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editMode && (
                  showDeleteConfirm ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Delete?</span>
                      <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                        style={{ padding: '5px 10px', background: '#ef4444', border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>
                        {deleteMutation.isPending ? '...' : 'Yes'}
                      </button>
                      <button onClick={() => setShowDeleteConfirm(false)}
                        style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        No
                      </button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} title="Delete requirement">
                      <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
                    </Button>
                  )
                )}
                <Button variant="ghost" size="icon" onClick={() => onClose('close')}>
                  <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                </Button>
              </div>
            </div>
            <FormProgress currentStep={step} steps={STEPS} />
          </div>

          <div className="px-6 py-6">
            {step === 1 && <ReqStep1 data={formData} update={update} onNext={next} />}
            {step === 2 && cat === 'commercial' && <ReqStep2Commercial data={formData} update={update} onNext={next} />}
            {step === 2 && cat === 'residential' && <ReqStep2Residential data={formData} update={update} onNext={next} />}
            {step === 3 && (
              <>
                <ReqStep3
                  data={formData}
                  update={update}
                  onSubmit={(opts) => saveMutation.mutate({ data: formData, sendMode: opts?.sendMode, groupId: opts?.groupId })}
                  isLoading={saveMutation.isPending}
                  editMode={editMode}
                />

                {submitError && (
                  <div className="mt-4 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#f87171' }}>Please fix the following before submitting:</p>
                    {submitError.split('\n').map((e, i) => <p key={i} className="text-sm" style={{ color: '#fca5a5' }}>• {e}</p>)}
                  </div>
                )}
              </>
            )}
          </div>

          {step === 2 && (
            <div className="px-6 pb-4">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Fields left blank will be treated as "No Preference" and will not impact the Match Score.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}