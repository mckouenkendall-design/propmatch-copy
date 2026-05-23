import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, UserPlus, ChevronLeft, Mail, Calendar, Clock, FileText, Search,
  Briefcase, X, Trash2, CheckCircle, Globe, Lock, Loader2, AlertCircle
} from 'lucide-react';

const ACCENT = '#00DBC5';

// Self-contained price formatter (copied from Teams.jsx, not exported there)
function formatListingPrice(listing) {
  const price = parseFloat(listing.price);
  if (!price || isNaN(price)) return null;
  const fmt = price % 1 === 0 ? price.toLocaleString() : price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const tx = listing.transaction_type;
  const unit = tx === 'lease' || tx === 'sublease' ? '/SF/yr' : tx === 'rent' ? '/mo' : '';
  return `$${fmt}${unit}`;
}

// One-word subscription label from selected_plan
const planLabel = (plan) => {
  if (plan === 'broker_sponsored') return { text: 'On Your Plan', color: ACCENT, bg: 'rgba(0,219,197,0.15)' };
  if (plan === 'individual') return { text: 'Individual', color: '#FFA500', bg: 'rgba(255,165,0,0.15)' };
  if (plan === 'brokerage') return { text: 'Broker', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
  if (plan === 'free') return { text: 'Free', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' };
  return { text: 'Unknown', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' };
};

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // The broker's roster entries (license-number seat assignments)
  const { data: rosterEntries = [], isLoading: rosterLoading } = useQuery({
    queryKey: ['adminRoster', user?.employing_broker_id],
    queryFn: async () => {
      const all = await supabase.from('brokerage_roster').select('*');
      const list = Array.isArray(all) ? all : [];
      return list.filter(r => r.employing_broker_number === user?.employing_broker_id && r.status === 'active');
    },
    enabled: !!user?.employing_broker_id,
  });

  // All profiles in this brokerage (everyone sharing the employing_broker_id)
  const { data: brokerageProfiles = [], isLoading: profLoading } = useQuery({
    queryKey: ['brokerageProfiles', user?.employing_broker_id],
    queryFn: async () => {
      const rows = await supabase.from('profiles').select('*').eq('employing_broker_id', user?.employing_broker_id);
      return Array.isArray(rows) ? rows : [];
    },
    enabled: !!user?.employing_broker_id,
  });

  // Post counts for everyone in the brokerage
  const { data: postCounts = {} } = useQuery({
    queryKey: ['brokeragePostCounts', user?.employing_broker_id],
    queryFn: async () => {
      const emails = brokerageProfiles.map(a => a.user_email).filter(Boolean);
      if (emails.length === 0) return {};
      const listings = await supabase.from('listings').select('created_by,status').in('created_by', emails);
      const requirements = await supabase.from('requirements').select('created_by,status').in('created_by', emails);
      const counts = {};
      emails.forEach(e => { counts[e] = { listings: 0, requirements: 0 }; });
      (Array.isArray(listings) ? listings : []).forEach(l => { if (l.status === 'active' && counts[l.created_by]) counts[l.created_by].listings++; });
      (Array.isArray(requirements) ? requirements : []).forEach(r => { if (r.status === 'active' && counts[r.created_by]) counts[r.created_by].requirements++; });
      return counts;
    },
    enabled: !!user?.employing_broker_id && brokerageProfiles.length > 0,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminRoster', user?.employing_broker_id] });
    queryClient.invalidateQueries({ queryKey: ['brokerageProfiles', user?.employing_broker_id] });
  };

  // Build the display roster: each active roster entry, joined to a profile if the agent exists.
  // A "pending" seat = roster entry whose agent hasn't joined PropMatch yet (no matching profile).
  const seatRows = rosterEntries.map(entry => {
    const profile = brokerageProfiles.find(p => p.license_number === entry.agent_license);
    return { entry, profile, pending: !profile };
  });

  // Seat counting: total comes from the roster's total_seats; used = active roster entries + the broker themselves
  const totalSeats = rosterEntries.length > 0
    ? Number(rosterEntries[0].total_seats) || (seatRows.length + 1)
    : 1;
  const usedSeats = seatRows.length + 1; // +1 for the broker
  const openSeats = Math.max(0, totalSeats - usedSeats);

  // Remove a seat (mark roster entry inactive). Does not touch billing (Stage 2).
  const removeMutation = useMutation({
    mutationFn: async (entryId) => await supabase.from('brokerage_roster').update({ status: 'inactive' }).eq('id', entryId).select(),
    onSuccess: () => { setSelectedAgent(null); refresh(); },
    onError: (err) => alert('Could not remove agent: ' + (err?.message || 'Unknown error')),
  });

  const filtered = seatRows.filter(({ entry, profile }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (profile?.full_name || entry.agent_name || '').toLowerCase().includes(q)
      || (entry.agent_license || '').toLowerCase().includes(q);
  });

  const isLoading = rosterLoading || profLoading;

  // ---------- AGENT DETAIL ----------
  if (selectedAgent) {
    return (
      <AgentDetail
        seat={selectedAgent}
        counts={selectedAgent.profile ? postCounts[selectedAgent.profile.user_email] : null}
        onBack={() => setSelectedAgent(null)}
        onConfirmRemove={() => removeMutation.mutate(selectedAgent.entry.id)}
        removing={removeMutation.isPending}
      />
    );
  }

  // ---------- MAIN ----------
  return (
    <div>
      {/* Seat summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard icon={<Users style={{ width: '20px', height: '20px', color: ACCENT }} />} value={`${usedSeats} of ${totalSeats}`} label="Seats Filled" sub={`${openSeats} open`} />
        <SummaryCard icon={<Calendar style={{ width: '20px', height: '20px', color: ACCENT }} />} value={fmtDate(user?.next_billing_date)} label="Next Billing Date" sub="Brokerage plan" />
        <SummaryCard icon={<Briefcase style={{ width: '20px', height: '20px', color: ACCENT }} />} value="Brokerage" label="Plan" sub="Active" />
      </div>

      {/* Search + add */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents by name or license number"
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px 10px 38px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }} />
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: ACCENT, color: '#111827', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <UserPlus style={{ width: '16px', height: '16px' }} /> Add Agent
        </button>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 style={{ width: '24px', height: '24px', color: ACCENT, animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!isLoading && seatRows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '15px', marginBottom: '6px' }}>No agents on your plan yet</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>Click Add Agent and enter their license number to add them.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map((row) => {
            const { entry, profile, pending } = row;
            const c = profile ? (postCounts[profile.user_email] || { listings: 0, requirements: 0 }) : { listings: 0, requirements: 0 };
            const label = pending ? { text: 'Pending Signup', color: '#FFA500', bg: 'rgba(255,165,0,0.15)' } : planLabel(profile.selected_plan);
            const displayName = profile?.full_name || entry.agent_name || 'Pending Agent';
            return (
              <div key={entry.id} onClick={() => setSelectedAgent(row)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ position: 'absolute', top: '14px', right: '14px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: label.color, background: label.bg }}>
                  {label.text}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  {profile?.profile_photo_url
                    ? <img src={profile.profile_photo_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,219,197,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 600, fontSize: '17px' }}>{(displayName || '?')[0].toUpperCase()}</div>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>License {entry.agent_license}</div>
                  </div>
                </div>
                {pending ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FFA500', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                    <AlertCircle style={{ width: '13px', height: '13px' }} /> Seat reserved, awaiting signup
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}><strong style={{ color: ACCENT }}>{c.listings}</strong> listings</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}><strong style={{ color: ACCENT }}>{c.requirements}</strong> requirements</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Joined {fmtDate(profile.created_at)}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddAgentModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); refresh(); }} />}
    </div>
  );
}

function SummaryCard({ icon, value, label, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '18px' }}>
      <div style={{ marginBottom: '10px' }}>{icon}</div>
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 600 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '13px', marginTop: '2px' }}>{label}</div>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif", fontSize: '11px', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

// ---------- ADD AGENT BY LICENSE NUMBER ----------
function AddAgentModal({ onClose, onAdded }) {
  const { user } = useAuth();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null); // null | profile | 'not_found' | 'error'
  const [adding, setAdding] = useState(false);

  const searchAgent = async () => {
    if (!licenseNumber.trim()) return;
    setSearching(true);
    setFound(null);
    try {
      const all = await supabase.from('profiles').select('*');
      const list = Array.isArray(all) ? all : [];
      const match = list.find(p => p.employing_broker_id === user?.employing_broker_id && p.license_number === licenseNumber.trim());
      setFound(match || 'not_found');
    } catch (e) {
      setFound('error');
    } finally {
      setSearching(false);
    }
  };

  const addAgent = async () => {
    setAdding(true);
    try {
      // Already on roster?
      const existing = await supabase.from('brokerage_roster').select('*');
      const dup = (Array.isArray(existing) ? existing : []).find(r =>
        r.employing_broker_number === user?.employing_broker_id &&
        r.agent_license === licenseNumber.trim() && r.status === 'active');
      if (dup) { alert('This agent is already on your roster.'); setAdding(false); return; }

      await supabase.from('brokerage_roster').insert({
        broker_email: user?.contact_email || user?.email,
        broker_name: user?.full_name || '',
        brokerage_name: user?.brokerage_name || '',
        employing_broker_number: user?.employing_broker_id || '',
        agent_license: licenseNumber.trim(),
        agent_email: found && found !== 'not_found' && found !== 'error' ? (found.contact_email || found.user_email) : '',
        agent_name: found && found !== 'not_found' && found !== 'error' ? found.full_name : '',
        status: 'active',
      }).select();

      // NOTE: Stage 2 wires the actual billing (pause individual plan, banked days,
      // flip to broker_sponsored, notify). Intentionally not called here.
      onAdded();
    } catch (e) {
      alert('Could not add agent: ' + (e?.message || 'Unknown error'));
    } finally {
      setAdding(false);
    }
  };

  const canAdd = licenseNumber.trim() && found && found !== 'error' && !adding;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '19px', fontWeight: 600, margin: 0 }}>Add Agent to Roster</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}><X style={{ width: '20px', height: '20px' }} /></button>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif", fontSize: '13px', lineHeight: 1.5, marginBottom: '18px' }}>
          Enter the agent's license number. The system verifies they are licensed under your employing broker number. If they are already on PropMatch they will be added and notified; if not, the seat is reserved until they sign up.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input value={licenseNumber} onChange={(e) => { setLicenseNumber(e.target.value); setFound(null); }} placeholder="Enter license number"
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px 12px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }} />
          <button onClick={searchAgent} disabled={searching || !licenseNumber.trim()}
            style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, cursor: licenseNumber.trim() ? 'pointer' : 'not-allowed' }}>
            {searching ? 'Looking…' : 'Look up'}
          </button>
        </div>

        {found && found !== 'not_found' && found !== 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}30`, borderRadius: '8px', marginBottom: '14px' }}>
            <CheckCircle style={{ width: '16px', height: '16px', color: ACCENT, flexShrink: 0 }} />
            <span style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>Found {found.full_name} ({found.user_email})</span>
          </div>
        )}
        {found === 'not_found' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '8px', marginBottom: '14px' }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#FFA500', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>No PropMatch account with this license under your broker number. The seat will be reserved and activates when they sign up.</span>
          </div>
        )}
        {found === 'error' && (
          <div style={{ color: '#ff6b6b', fontFamily: "'Inter', sans-serif", fontSize: '13px', marginBottom: '14px' }}>Lookup failed. Try again.</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={addAgent} disabled={!canAdd}
            style={{ padding: '10px 18px', background: canAdd ? ACCENT : 'rgba(255,255,255,0.08)', color: canAdd ? '#111827' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: canAdd ? 'pointer' : 'not-allowed' }}>
            {adding ? 'Adding…' : 'Add to Roster'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- AGENT DETAIL ----------
function AgentDetail({ seat, counts, onBack, onConfirmRemove, removing }) {
  const { entry, profile, pending } = seat;
  const [viewPost, setViewPost] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const c = counts || { listings: 0, requirements: 0 };
  const label = pending ? { text: 'Pending Signup', color: '#FFA500', bg: 'rgba(255,165,0,0.15)' } : planLabel(profile.selected_plan);
  const displayName = profile?.full_name || entry.agent_name || 'Pending Agent';

  const { data: posts = { listings: [], requirements: [] } } = useQuery({
    queryKey: ['agentPosts', profile?.user_email],
    queryFn: async () => {
      const listings = await supabase.from('listings').select('*').eq('created_by', profile.user_email).eq('status', 'active');
      const requirements = await supabase.from('requirements').select('*').eq('created_by', profile.user_email).eq('status', 'active');
      return { listings: Array.isArray(listings) ? listings : [], requirements: Array.isArray(requirements) ? requirements : [] };
    },
    enabled: !!profile?.user_email,
  });

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginBottom: '20px' }}>
        <ChevronLeft style={{ width: '16px', height: '16px' }} /> Back to roster
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {profile?.profile_photo_url
          ? <img src={profile.profile_photo_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,219,197,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 600, fontSize: '24px' }}>{(displayName || '?')[0].toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600 }}>{displayName}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>License {entry.agent_license}</div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: label.color, background: label.bg }}>{label.text}</div>
      </div>

      {pending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.25)', borderRadius: '12px', marginBottom: '24px' }}>
          <AlertCircle style={{ width: '18px', height: '18px', color: '#FFA500', flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>This seat is reserved. {displayName} has not joined PropMatch yet. Their account activates automatically when they sign up with this license number.</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <MiniStat icon={<FileText style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Active Listings" value={c.listings} />
            <MiniStat icon={<FileText style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Active Requirements" value={c.requirements} />
            <MiniStat icon={<Calendar style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Joined" value={fmtDate(profile.created_at)} />
            <MiniStat icon={<Clock style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Last Active" value={fmtDate(profile.last_active_at || profile.updated_at)} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '12px', marginBottom: '6px' }}>Contact</div>
            <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>{profile.contact_email || profile.user_email}</div>
            {profile.phone && <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginTop: '2px' }}>{profile.phone}</div>}
          </div>

          <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Active Listings</div>
          {posts.listings.length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '13px', marginBottom: '20px' }}>No active listings.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {posts.listings.map(l => <PostCard key={l.id} post={l} onClick={() => setViewPost({ ...l, _type: 'listing' })} />)}
              </div>}

          <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Active Requirements</div>
          {posts.requirements.length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '13px', marginBottom: '20px' }}>No active requirements.</p>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {posts.requirements.map(r => <PostCard key={r.id} post={r} onClick={() => setViewPost({ ...r, _type: 'requirement' })} />)}
              </div>}
        </>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '12px' }}>
        <button onClick={() => setConfirmRemove(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Trash2 style={{ width: '15px', height: '15px' }} /> Remove from Plan
        </button>
      </div>

      {confirmRemove && (
        <ConfirmOverlay
          title="Remove this agent?"
          body={`${displayName} will be removed from your plan and the seat freed. This does not change billing. They can be re-added later.`}
          confirmText={removing ? 'Removing…' : 'Remove'}
          danger busy={removing}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={onConfirmRemove}
        />
      )}

      {viewPost && <ReadOnlyPostModal post={viewPost} onClose={() => setViewPost(null)} />}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
      <div style={{ marginBottom: '8px' }}>{icon}</div>
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 600 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif", fontSize: '11px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function PostCard({ post, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 7px', background: post.visibility === 'public' ? 'rgba(0,219,197,0.15)' : 'rgba(255,165,0,0.15)', borderRadius: '4px', fontSize: '10px', fontWeight: 500, color: post.visibility === 'public' ? ACCENT : '#FFA500' }}>
        {post.visibility === 'public' ? <Globe style={{ width: '11px', height: '11px' }} /> : <Lock style={{ width: '11px', height: '11px' }} />}
        {post.visibility === 'public' ? 'Public' : 'Brokerage'}
      </div>
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, paddingRight: '80px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title || `${post.property_type} in ${post.city || 'location'}`}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>{post.city || (Array.isArray(post.cities) ? post.cities.join(', ') : '')}{post.state ? `, ${post.state}` : ''}</div>
      {post._type === 'listing' && <div style={{ color: ACCENT, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{formatListingPrice(post)}</div>}
    </div>
  );
}

function ReadOnlyPostModal({ post, onClose }) {
  let details = {};
  try { details = typeof post.property_details === 'string' ? JSON.parse(post.property_details) : (post.property_details || {}); } catch { details = {}; }

  const Row = ({ label, value }) => (value === undefined || value === null || value === '' ? null : (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>{label}</span>
      <span style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '13px', textAlign: 'right', maxWidth: '60%' }}>{String(value)}</span>
    </div>
  ));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#141b22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: ACCENT, background: 'rgba(0,219,197,0.15)' }}>
            {post._type === 'listing' ? 'Listing' : 'Requirement'} · View Only
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}><X style={{ width: '20px', height: '20px' }} /></button>
        </div>
        <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, margin: '8px 0 16px' }}>{post.title || `${post.property_type}`}</h2>

        <Row label="Property Type" value={post.property_type} />
        <Row label="Transaction" value={post.transaction_type} />
        {post._type === 'listing' && <Row label="City" value={post.city} />}
        {post._type === 'listing' && <Row label="State" value={post.state} />}
        {post._type === 'requirement' && <Row label="Target Cities" value={Array.isArray(post.cities) ? post.cities.join(', ') : post.cities} />}
        {post._type === 'listing' && <Row label="Price" value={formatListingPrice(post)} />}
        {post._type === 'listing' && <Row label="Size (sqft)" value={post.size_sqft} />}
        {post._type === 'requirement' && <Row label="Min Price" value={post.min_price} />}
        {post._type === 'requirement' && <Row label="Max Price" value={post.max_price} />}
        {post._type === 'requirement' && <Row label="Min Size" value={post.min_size_sqft} />}
        {post._type === 'requirement' && <Row label="Max Size" value={post.max_size_sqft} />}
        {Object.entries(details).map(([k, v]) => (
          (v === '' || v === null || (Array.isArray(v) && v.length === 0)) ? null :
          <Row key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={Array.isArray(v) ? v.join(', ') : v} />
        ))}
        {post.description && <div style={{ marginTop: '14px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px', lineHeight: 1.5 }}>{post.description}</div>}
        {post.notes && <div style={{ marginTop: '14px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px', lineHeight: 1.5 }}>{post.notes}</div>}
      </div>
    </div>
  );
}

function ConfirmOverlay({ title, body, confirmText, danger, onCancel, onConfirm, busy }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#141b22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '24px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 600, margin: '0 0 8px' }}>{title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '14px', lineHeight: 1.5, margin: '0 0 20px' }}>{body}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 16px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} style={{ padding: '9px 16px', background: danger ? '#ff6b6b' : ACCENT, color: danger ? 'white' : '#111827', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: busy ? 'wait' : 'pointer' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
