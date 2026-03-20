import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function AddTeamModal({ 
  totalSeats, 
  brokerEmail, 
  brokerName, 
  brokerageName, 
  employingBrokerNumber,
  stripeSubscriptionId,
  onClose, 
  onComplete 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [agents, setAgents] = useState([{ email: '', name: '', license: '' }]);

  const addAgentMutation = useMutation({
    mutationFn: async (agentsList) => {
      // Create roster entries for all agents
      const promises = agentsList.map(agent => 
        base44.entities.BrokerageRoster.create({
          broker_email: brokerEmail,
          broker_name: brokerName,
          brokerage_name: brokerageName,
          employing_broker_number: employingBrokerNumber,
          total_seats: totalSeats,
          agent_email: agent.email.toLowerCase().trim(),
          agent_name: agent.name.trim(),
          agent_license: agent.license.trim() || null,
          status: 'active',
          stripe_subscription_id: stripeSubscriptionId,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['brokerageRoster']);
      toast({ title: 'Team members added successfully!' });
      onComplete();
    },
  });

  const addRow = () => {
    if (agents.length < totalSeats) {
      setAgents([...agents, { email: '', name: '', license: '' }]);
    }
  };

  const removeRow = (index) => {
    setAgents(agents.filter((_, i) => i !== index));
  };

  const updateAgent = (index, field, value) => {
    const updated = [...agents];
    updated[index][field] = value;
    setAgents(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validAgents = agents.filter(a => a.email && a.name);
    if (validAgents.length === 0) {
      toast({ title: 'Add at least one agent', variant: 'destructive' });
      return;
    }
    addAgentMutation.mutate(validAgents);
  };

  const canSkip = agents.length === 1 && !agents[0].email && !agents[0].name;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px',
    }}>
      <Card style={{
        background: '#1a1f25',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <div style={{ padding: '32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `rgba(0,219,197,0.1)`,
              border: `2px solid ${ACCENT}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Users style={{ width: '32px', height: '32px', color: ACCENT }} />
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '28px',
              fontWeight: 300,
              color: 'white',
              margin: '0 0 8px',
            }}>
              Add Your Team
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.6)',
              margin: 0,
            }}>
              You purchased <strong style={{ color: ACCENT }}>{totalSeats} seats</strong>. Add agents now to activate their access.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {agents.map((agent, index) => (
                <div key={index} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '16px',
                  position: 'relative',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Agent Email *</Label>
                      <Input
                        type="email"
                        value={agent.email}
                        onChange={(e) => updateAgent(index, 'email', e.target.value)}
                        placeholder="agent@brokerage.com"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                        }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Agent Name *</Label>
                      <Input
                        value={agent.name}
                        onChange={(e) => updateAgent(index, 'name', e.target.value)}
                        placeholder="John Doe"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white',
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>License Number (Optional)</Label>
                    <Input
                      value={agent.license}
                      onChange={(e) => updateAgent(index, 'license', e.target.value)}
                      placeholder="RE123456"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white',
                      }}
                    />
                  </div>
                  {agents.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '4px',
                        padding: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {agents.length < totalSeats && (
              <Button
                type="button"
                onClick={addRow}
                variant="outline"
                style={{
                  width: '100%',
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  marginBottom: '24px',
                }}
              >
                <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Add Another Agent ({agents.length}/{totalSeats})
              </Button>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {canSkip && (
                <Button
                  type="button"
                  onClick={onComplete}
                  variant="outline"
                  style={{ flex: 1, borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  Skip for Now
                </Button>
              )}
              <Button
                type="submit"
                disabled={addAgentMutation.isPending}
                style={{ flex: 1, background: ACCENT, color: '#111827' }}
              >
                {addAgentMutation.isPending ? 'Adding...' : 'Add Team Members'}
              </Button>
            </div>
          </form>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.4)',
            textAlign: 'center',
            marginTop: '16px',
          }}>
            You can add or edit team members anytime from your Broker Dashboard
          </p>
        </div>
      </Card>
    </div>
  );
}