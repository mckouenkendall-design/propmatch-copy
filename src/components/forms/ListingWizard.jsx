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

  const parseInitialData = (data) => {
    if (!data) return null;
    return {
      ...data,
      property_details: typeof data.property_details === 'string'
        ? (() => { try { return JSON.parse(data.property_details); } catch { return {}; } })()
        : (data.property_details || {}),
    };
  };

  const [formData, setFormData] = useState(parseInitialData(initialData) || {
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
    price_is_tbd: false,
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

    // Auto-default lease_type so Base44 never sees a blank required field
    const isLease = submitData.transaction_type === 'lease' || submitData.transaction_type === 'sublease';
    if (isLease && !submitData.lease_type) {
      submitData.lease_type = 'full_service_gross';
    }

    // Strip any field that is null, undefined, or empty string
    // Base44 rejects null/undefined on string fields like lease_sub
    const optionalStringFields = ['lease_sub', 'lease_type', 'address', 'description', 'visibility_groups', 'visibility_recipient_email'];
    optionalStringFields.forEach(f => {
      if (submitData[f] === null || submitData[f] === undefined || submitData[f] === '') {
        delete submitData[f];
      }
    });

    // Preserve price_is_tbd boolean explicitly
    if (formData.price_is_tbd) submitData.price_is_tbd = true;
    else submitData.price_is_tbd = false;

    // If lease_sub is an array (modified_gross tenant expenses), stringify it
    if (Array.isArray(submitData.lease_sub)) {
      if (submitData.lease_sub.length === 0) delete submitData.lease_sub;
      else submitData.lease_sub = JSON.stringify(submitData.lease_sub);
    }

    // Strip empty arrays
    if (Array.isArray(submitData.utilities_included) && submitData.utilities_included.length === 0) {
      delete submitData.utilities_included;
    }
    if (Array.isArray(submitData.amenities) && submitData.amenities.length === 0) {
      delete submitData.amenities;
    }

    // Parse numeric fields
    ['price', 'size_sqft'].forEach(f => {
      if (submitData[f] === '' || submitData[f] == null) delete submitData[f];
      else submitData[f] = parseFloat(submitData[f]);
    });

    return submitData;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ data, sendMode, groupId }) => {
      const submitData = prepareSubmitData(data);
      let listing;
      if (editMode && data.id) {
        listing = await base44.entities.Listing.update(data.id, submitData);
      } else {
        listing = await base44.entities.Listing.create(submitData);
      }
      const postId   = listing?.id || data.id;
      const postType = 'listing';
      const myEmail  = user?.email || data.contact_agent_email || '';
      const myName   = data.contact_agent_name  || user?.full_name || user?.email || 'Agent';
      const recipients = (data.visibility_recipient_email || '')
        .split(',').map(s => s.trim()).filter(Boolean);

      if (sendMode === 'separately' && recipients.length > 0) {
        // Create a DM Conversation + Message for each recipient
        for (const email of recipients) {
          try {
            // Find or create conversation
            const existing = await base44.entities.Conversation.filter({ participant_1: myEmail, participant_2: email });
            const existing2 = existing.length ? existing : await base44.entities.Conversation.filter({ participant_1: email, participant_2: myEmail });
            let convoId;
            if (existing2.length) {
              convoId = existing2[0].id;
            } else {
              const convo = await base44.entities.Conversation.create({ participant_1: myEmail, participant_2: email, last_message: 'Shared a listing', last_message_time: new Date().toISOString(), unread_by_1: 0, unread_by_2: 1 });
              convoId = convo.id;
            }
            await base44.entities.Message.create({ conversation_id: convoId, sender_email: myEmail, content: 'Shared a listing', post_id: postId, post_type: postType, sent_at: new Date().toISOString() });
          } catch (e) { console.error('Send separately error:', e); }
        }
      } else if (sendMode === 'create_group' && recipients.length > 0) {
        // Create a new GroupConversation + GroupMessage
        const participantEmails = [myEmail, ...recipients];
        const gc = await base44.entities.GroupConversation.create({
          name: recipients.map(e => e.split('@')[0]).join(', '),
          participant_emails: JSON.stringify(participantEmails),
          created_by: myEmail,
          last_message: 'Shared a listing',
          last_message_time: new Date().toISOString(),
          last_message_sender: myName,
        });
        await base44.entities.GroupMessage.create({ group_conversation_id: gc.id, sender_email: myEmail, sender_name: myName, content: 'Shared a listing', post_id: postId, post_type: postType });
      } else if (sendMode === 'existing_group' && groupId) {
        // Send to existing GroupConversation
        await base44.entities.GroupMessage.create({ group_conversation_id: groupId, sender_email: myEmail, sender_name: myName, content: 'Shared a listing', post_id: postId, post_type: postType });
        await base44.entities.GroupConversation.update(groupId, { last_message: 'Shared a listing', last_message_time: new Date().toISOString(), last_message_sender: myName });
      }
      return listing;
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
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} title="Delete listing">
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
                  onSubmit={(opts) => saveMutation.mutate({ data: formData, sendMode: opts?.sendMode, groupId: opts?.groupId })}
                  isLoading={saveMutation.isPending}
                  editMode={editMode}
                />


              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}