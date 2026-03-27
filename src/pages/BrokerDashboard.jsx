import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Users, Building2, Activity, Plus, X, ChevronDown, ChevronUp, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import StartConversationModal from '@/components/messages/StartConversationModal';

const ACCENT = '#00DBC5';

// ── Add Agent Modal ──────────────────────────────────────────────────────────
function AddAgentModal({ broker, onClose, onSuccess }) {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchAgent = async () => {
    if (!licenseNumber.trim()) return;
    setSearching(true);
    setFound(null);
    try {
      const allProfiles = await base44.entities.UserProfile.list();
      const match = allProfiles.find(p =>
        p.employing_broker_id === broker.employing_broker_id &&
        p.license_number === licenseNumber.trim()
      );
      setFound(match || 'not_found');
    } catch (e) {
      setFound('error');
    } finally {
      setSearching(false);
    }
  };

  const addAgent = async () => {
    setLoading(true);
    try {
      // Check if already on roster
      const existing = await base44.entities.BrokerageRoster.list();
      const alreadyAdded = existing.find(r =>
        r.employing_broker_number === broker.employing_broker_id &&
        r.agent_license === licenseNumber.trim() &&
        r.status === 'active'
      );
      if (alreadyAdded) {
        toast({ title: 'This agent is already on your roster', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Create roster entry
      await base44.entities.BrokerageRoster.create({
        broker_email: broker.contact_email || broker.email,
        broker_name: broker.full_name || '',
        brokerage_name: broker.brokerage_name || '',
        employing_broker_number: broker.employing_broker_id || '',
        agent_license: licenseNumber.trim(),
        agent_email: found && found !== 'not_found' ? (found.contact_email || found.user_email) : '',
        agent_name: found && found !== 'not_found' ? found.full_name : '',
        status: 'active',
      });

      // If agent already exists on PropMatch — call pauseSubscription
      // This handles Stripe pause + banked days calculation + UserProfile update
      // + notification (via onSubscriptionChanged trigger)
      if (found && found !== 'not_found') {
        await base44.functions.invoke('pauseSubscription', {
          agent_user_email: found.user_email,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['broker-roster'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
      toast({
        title: found && found !== 'not_found'
          ? `${found.full_name} added — they've been notified`
          : 'Seat added — pending agent signup',
      });
      onSuccess();
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to add agent', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const canAdd = licenseNumber.trim() && found && found !== 'error' && !loading;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
      <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>Add Agent to Roster</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Enter the agent's License No. The system will verify they are licensed under your employing broker number. If they're already on PropMatch, their plan will be paused and they'll be notified automatically.
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
            Agent License No.
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              value={licenseNumber}
              onChange={e => { setLicenseNumber(e.target.value); setFound(null); }}
              placeholder="Enter license number"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && searchAgent()}
            />
            <button
              onClick={searchAgent}
              disabled={searching || !licenseNumber.trim()}
              style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', whiteSpace: 'nowrap' }}
            >
              {searching ? 'Searching...' : 'Look Up'}
            </button>
          </div>
        </div>

        {found && found !== 'not_found' && found !== 'error' && (
          <div style={{ background: 'rgba(0,219,197,0.08)', border: `1px solid ${ACCENT}30`, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: '0 0 8px', fontWeight: 600 }}>✓ Agent Found on PropMatch</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'white', margin: '0 0 4px' }}>{found.full_name}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{found.contact_email || found.user_email}</p>
            {found.selected_plan === 'individual' && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#FBB936', margin: '8px 0 0' }}>
                ⚠ This agent has an active individual plan. Adding them will pause it and bank their remaining days.
              </p>
            )}
          </div>
        )}
        {found === 'not_found' && (
          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#FBB936', margin: 0, lineHeight: 1.6 }}>
              No PropMatch account found with this license number. The seat will be added as pending — it activates automatically when they complete onboarding.
            </p>
          </div>
        )}
        {found === 'error' && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#ef4444', margin: 0 }}>Search failed. Please try again.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={addAgent}
            disabled={!canAdd}
            style={{ flex: 1, padding: '12px', background: canAdd ? ACCENT : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: canAdd ? '#111827' : 'rgba(255,255,255,0.3)', cursor: canAdd ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Adding...' : 'Add to Roster'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Row ────────────────────────────────────────────────────────────────
function AgentRow({ profile, rosterEntry, onMessage, onRemove }) {
  const [expanded, setExpanded] = useState(false);

  const { data: agentListings = [] } = useQuery({
    queryKey: ['agent-listings', profile?.user_email],
    queryFn: () => base44.entities.Listing.filter({ created_by: profile.user_email }),
    enabled: !!profile?.user_email && expanded,
  });

  const { data: agentRequirements = [] } = useQuery({
    queryKey: ['agent-requirements', profile?.user_email],
    queryFn: () => base44.entities.Requirement.filter({ created_by: profile.user_email }),
    enabled: !!profile?.user_email && expanded,
  });

  const initial = (profile?.full_name || profile?.user_email || '?')[0]?.toUpperCase();

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600, color: '#111827', flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'white', margin: '0 0 2px' }}>
            {profile?.full_name || 'Unknown'}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {profile?.username && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT }}>@{profile.username}</span>}
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{profile?.contact_email || profile?.user_email}</span>
            {profile?.phone && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{profile.phone}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onMessage(profile); }}
            style={{ padding: '6px 12px', background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}30`, borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <MessageSquare style={{ width: '12px', height: '12px' }} /> Message
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRemove(rosterEntry, profile); }}
            style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
          >
            Remove
          </button>
          {expanded
            ? <ChevronUp style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            : <ChevronDown style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
          }
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
              Active Listings ({agentListings.length})
            </p>
            {agentListings.length === 0
              ? <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No active listings</p>
              : agentListings.slice(0, 5).map(l => (
                <div key={l.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '6px' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>
                    {(() => { const p=parseFloat(l.price); if(!p) return '—'; const f=p%1===0?p.toLocaleString():p.toLocaleString('en-US',{maximumFractionDigits:2}); const u=l.transaction_type==='lease'||l.transaction_type==='sublease'?'/SF/yr':l.transaction_type==='rent'?'/mo':''; return `$${f}${u}`; })()}
                  </p>
                </div>
              ))
            }
          </div>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
              Active Requirements ({agentRequirements.length})
            </p>
            {agentRequirements.length === 0
              ? <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No active requirements</p>
              : agentRequirements.slice(0, 5).map(r => (
                <div key={r.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '6px' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    {(() => { const fmt=(n)=>{const num=parseFloat(n);if(!n||isNaN(num))return null;return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2});}; const u=r.price_period==='per_month'?'/mo':r.price_period==='per_sf_per_year'?'/SF/yr':r.price_period==='annually'?'/yr':(r.transaction_type==='lease'||r.transaction_type==='rent')?'/mo':''; const lo=fmt(r.min_price),hi=fmt(r.max_price); if(lo&&hi)return `$${lo}–$${hi}${u}`; if(hi)return `Up to $${hi}${u}`; if(lo)return `From $${lo}${u}`; return '—'; })()}
                  </p>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main BrokerDashboard ─────────────────────────────────────────────────────
export default function BrokerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [messagingUser, setMessagingUser] = useState(null);

  const { data: rosterEntries = [] } = useQuery({
    queryKey: ['broker-roster'],
    queryFn: async () => {
      const all = await base44.entities.BrokerageRoster.list();
      return all.filter(r => r.employing_broker_number === user?.employing_broker_id);
    },
    enabled: !!user?.employing_broker_id,
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const activeEntries = rosterEntries.filter(r => r.status === 'active');
  const pendingEntries = activeEntries.filter(r => !r.agent_email);

  const agentProfiles = activeEntries
    .filter(r => r.agent_license)
    .map(entry => {
      const profile = allProfiles.find(p =>
        p.employing_broker_id === user?.employing_broker_id &&
        p.license_number === entry.agent_license
      );
      return { entry, profile };
    })
    .filter(({ profile }) => !!profile);

  const brokerProfile = allProfiles.find(p => p.user_email === user?.email);
  const totalSeats = user?.brokerage_seats || 2;
  const usedSeats = agentProfiles.length + 1; // +1 for broker themselves

  const removeMutation = useMutation({
    mutationFn: async ({ entry, profile }) => {
      // Mark roster entry as inactive
      await base44.entities.BrokerageRoster.update(entry.id, { status: 'inactive' });

      if (profile?.user_email) {
        // Call resumeSubscription — handles Stripe resume + banked days + UserProfile update
        // + notification (via onSubscriptionChanged trigger when selected_plan changes)
        await base44.functions.invoke('resumeSubscription', {
          agent_user_email: profile.user_email,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-roster'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
      toast({ title: 'Agent removed — their subscription has been restored' });
    },
    onError: (e) => {
      console.error(e);
      toast({ title: 'Failed to remove agent', variant: 'destructive' });
    },
  });

  const handleRemove = (entry, profile) => {
    if (!confirm('Remove this agent from your plan? Their banked subscription days will be restored automatically.')) return;
    removeMutation.mutate({ entry, profile });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '36px', fontWeight: 300, color: 'white', margin: '0 0 6px' }}>
            Brokerage Admin
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {user?.brokerage_name || 'Your Brokerage'} · {usedSeats} of {totalSeats} seats used
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={usedSeats >= totalSeats}
            style={{ padding: '10px 20px', background: usedSeats >= totalSeats ? 'rgba(255,255,255,0.06)' : ACCENT, border: 'none', borderRadius: '8px', color: usedSeats >= totalSeats ? 'rgba(255,255,255,0.3)' : '#111827', cursor: usedSeats >= totalSeats ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            {usedSeats >= totalSeats ? 'No seats available' : 'Add Agent'}
          </button>
          <button
            onClick={() => window.location.href = '/Settings'}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {[
          { icon: Users, label: 'Total Seats', value: totalSeats, sub: `${totalSeats - usedSeats} available` },
          { icon: Building2, label: 'Active Agents', value: agentProfiles.length, sub: 'Excluding you' },
          { icon: Activity, label: 'Pending Seats', value: pendingEntries.length, sub: 'Awaiting signup' },
        ].map(stat => (
          <Card key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <CardContent style={{ padding: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <stat.icon style={{ width: '20px', height: '20px', color: ACCENT }} />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '32px', fontWeight: 600, color: 'white', margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{stat.label}</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, margin: 0 }}>{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roster */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 500, color: 'white', margin: '0 0 16px' }}>
          Roster
        </h2>

        {/* Broker row — Seat 1, always read-only */}
        {brokerProfile && (
          <div style={{ background: 'rgba(0,219,197,0.04)', border: `1px solid ${ACCENT}20`, borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600, color: '#111827', flexShrink: 0 }}>
              {(brokerProfile.full_name || user?.email || '?')[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'white', margin: 0 }}>
                  {brokerProfile.full_name || user?.email}
                </p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: ACCENT, background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}30`, borderRadius: '4px', padding: '2px 8px' }}>
                  Principal Broker
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {brokerProfile.username && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT }}>@{brokerProfile.username}</span>}
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{brokerProfile.contact_email || brokerProfile.user_email}</span>
                {brokerProfile.phone && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{brokerProfile.phone}</span>}
              </div>
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>Seat 1 (You)</span>
          </div>
        )}

        {agentProfiles.length === 0 && pendingEntries.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
            <Users style={{ width: '48px', height: '48px', color: `${ACCENT}40`, margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>No agents added yet</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>
              Add agents by their license number. They'll be notified automatically.
            </p>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', background: ACCENT, border: 'none', borderRadius: '8px', color: '#111827', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500 }}>
              Add First Agent
            </button>
          </div>
        ) : (
          <>
            {agentProfiles.map(({ entry, profile }) => (
              <AgentRow
                key={entry.id}
                profile={profile}
                rosterEntry={entry}
                onMessage={setMessagingUser}
                onRemove={handleRemove}
              />
            ))}

            {/* Pending seats */}
            {pendingEntries.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
                  Pending — Awaiting Agent Signup ({pendingEntries.length})
                </h3>
                {pendingEntries.map(entry => (
                  <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '8px', marginBottom: '8px' }}>
                    <AlertCircle style={{ width: '18px', height: '18px', color: '#FBB936', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>
                        License: <strong style={{ color: 'white' }}>{entry.agent_license}</strong>
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        Seat activates when agent completes onboarding with this license number.
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(entry, null)}
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddAgentModal
          broker={user}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
      {messagingUser && (
        <StartConversationModal
          onClose={() => setMessagingUser(null)}
          onSelectUser={(u) => { console.log('Starting conversation with:', u); setMessagingUser(null); }}
        />
      )}
    </div>
  );
}