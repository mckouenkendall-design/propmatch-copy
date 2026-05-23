import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatListingPrice } from '@/utils/matchScore';
import {
  Users, UserPlus, ChevronLeft, Mail, Calendar, Clock, FileText, Search,
  Briefcase, X, Trash2, CheckCircle, Globe, Lock, Loader2
} from 'lucide-react';

const ACCENT = '#00DBC5';

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
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmInvite, setConfirmInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  // Roster: everyone sharing this broker's brokerage_id, excluding the broker themselves
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['brokerageRoster', user?.brokerage_id],
    queryFn: async () => {
      const rows = await supabase.from('profiles').select('*').eq('employing_broker_id', user?.brokerage_id);
      const list = Array.isArray(rows) ? rows : [];
      return list.filter(p => p.user_email !== user?.email);
    },
    enabled: !!user?.brokerage_id,
  });

  // Per-agent post counts (all agents' listings + requirements for this brokerage)
  const { data: postCounts = {} } = useQuery({
    queryKey: ['brokeragePostCounts', user?.brokerage_id],
    queryFn: async () => {
      const emails = roster.map(a => a.user_email);
      if (emails.length === 0) return {};
      const listings = await supabase.from('listings').select('created_by,status').in('created_by', emails);
      const requirements = await supabase.from('requirements').select('created_by,status').in('created_by', emails);
      const counts = {};
      emails.forEach(e => { counts[e] = { listings: 0, requirements: 0 }; });
      (Array.isArray(listings) ? listings : []).forEach(l => {
        if (l.status === 'active' && counts[l.created_by]) counts[l.created_by].listings++;
      });
      (Array.isArray(requirements) ? requirements : []).forEach(r => {
        if (r.status === 'active' && counts[r.created_by]) counts[r.created_by].requirements++;
      });
      return counts;
    },
    enabled: !!user?.brokerage_id && roster.length > 0,
  });

  const seatsFilled = roster.filter(a => a.selected_plan === 'broker_sponsored').length;

  const removeMutation = useMutation({
    mutationFn: async (agentEmail) => {
      // Stage 1: remove agent from brokerage by clearing their employing_broker_id.
      // Stage 2 (billing) handles seat/plan changes separately.
      return await supabase.from('profiles').update({ employing_broker_id: '' }).eq('user_email', agentEmail).select();
    },
    onSuccess: () => {
      setConfirmRemove(null);
      setSelectedAgent(null);
      queryClient.invalidateQueries({ queryKey: ['brokerageRoster', user?.brokerage_id] });
    },
    onError: (err) => alert('Could not remove agent: ' + (err?.message || 'Unknown error')),
  });

  const filtered = roster.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (a.full_name || '').toLowerCase().includes(q) || (a.user_email || '').toLowerCase().includes(q);
  });

  // ---------- AGENT DETAIL VIEW ----------
  if (selectedAgent) {
    return (
      <AgentDetail
        agent={selectedAgent}
        counts={postCounts[selectedAgent.user_email]}
        onBack={() => setSelectedAgent(null)}
        onRemove={() => setConfirmRemove(selectedAgent)}
        onInvite={() => setConfirmInvite(selectedAgent)}
        confirmRemove={confirmRemove}
        confirmInvite={confirmInvite}
        onCancelRemove={() => setConfirmRemove(null)}
        onCancelInvite={() => setConfirmInvite(null)}
        onConfirmRemove={() => removeMutation.mutate(selectedAgent.user_email)}
        onConfirmInvite={() => { setConfirmInvite(null); alert('Invite sent (billing wiring comes in Stage 2).'); }}
        removing={removeMutation.isPending}
      />
    );
  }

  // ---------- MAIN ROSTER VIEW ----------
  return (
    <div>
      {/* Seats + billing summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard icon={<Users style={{ width: '20px', height: '20px', color: ACCENT }} />} label="Agents on Your Plan" value={`${seatsFilled}`} sub={`${roster.length} total in brokerage`} />
        <SummaryCard icon={<Calendar style={{ width: '20px', height: '20px', color: ACCENT }} />} label="Next Billing Date" value={fmtDate(user?.next_billing_date)} sub="Brokerage plan" />
        <SummaryCard icon={<Briefcase style={{ width: '20px', height: '20px', color: ACCENT }} />} label="Plan" value="Brokerage" sub="Active" />
      </div>

      {/* Search + invite */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name or email"
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px 10px 38px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }}
          />
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: ACCENT, color: '#111827', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <UserPlus style={{ width: '16px', height: '16px' }} /> Invite Agent
        </button>
      </div>

      {/* Invite by email row */}
      {showInvite && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px' }}>
          <Mail style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="agent@email.com"
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '8px 12px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={() => { if (inviteEmail.trim()) { alert('Invite sent to ' + inviteEmail.trim() + ' (billing wiring comes in Stage 2).'); setInviteEmail(''); setShowInvite(false); } }}
            disabled={!inviteEmail.trim()}
            style={{ padding: '8px 16px', background: inviteEmail.trim() ? ACCENT : 'rgba(255,255,255,0.08)', color: inviteEmail.trim() ? '#111827' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed' }}
          >Send Invite</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 style={{ width: '24px', height: '24px', color: ACCENT, animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty */}
      {!isLoading && roster.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '15px', marginBottom: '6px' }}>No agents in your brokerage yet</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>Invite agents by email to add them to your team.</p>
        </div>
      )}

      {/* Agent cards */}
      {!isLoading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map(agent => {
            const c = postCounts[agent.user_email] || { listings: 0, requirements: 0 };
            const label = planLabel(agent.selected_plan);
            return (
              <div
                key={agent.user_email}
                onClick={() => setSelectedAgent(agent)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Subscription label, top right */}
                <div style={{ position: 'absolute', top: '14px', right: '14px', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: label.color, background: label.bg }}>
                  {label.text}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  {agent.profile_photo_url
                    ? <img src={agent.profile_photo_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,219,197,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 600, fontSize: '17px' }}>{(agent.full_name || agent.user_email || '?')[0].toUpperCase()}</div>}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.full_name || 'Unnamed Agent'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>{agent.user_type === 'principal_broker' ? 'Principal Broker' : 'Agent'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}><strong style={{ color: ACCENT }}>{c.listings}</strong> listings</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}><strong style={{ color: ACCENT }}>{c.requirements}</strong> requirements</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>Joined {fmtDate(agent.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '18px' }}>
      <div style={{ marginBottom: '10px' }}>{icon}</div>
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 600 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '13px', marginTop: '2px' }}>{label}</div>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'Inter', sans-serif", fontSize: '11px', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

// ---------- AGENT DETAIL ----------
function AgentDetail({ agent, counts, onBack, onRemove, confirmRemove, onCancelRemove, onConfirmRemove, removing }) {
  const { user } = useAuth();
  const [viewPost, setViewPost] = useState(null);
  const c = counts || { listings: 0, requirements: 0 };
  const label = planLabel(agent.selected_plan);

  // Agent's active posts
  const { data: posts = { listings: [], requirements: [] } } = useQuery({
    queryKey: ['agentPosts', agent.user_email],
    queryFn: async () => {
      const listings = await supabase.from('listings').select('*').eq('created_by', agent.user_email).eq('status', 'active');
      const requirements = await supabase.from('requirements').select('*').eq('created_by', agent.user_email).eq('status', 'active');
      return {
        listings: Array.isArray(listings) ? listings : [],
        requirements: Array.isArray(requirements) ? requirements : [],
      };
    },
    enabled: !!agent.user_email,
  });

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginBottom: '20px' }}>
        <ChevronLeft style={{ width: '16px', height: '16px' }} /> Back to roster
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {agent.profile_photo_url
          ? <img src={agent.profile_photo_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,219,197,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 600, fontSize: '24px' }}>{(agent.full_name || agent.user_email || '?')[0].toUpperCase()}</div>}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600 }}>{agent.full_name || 'Unnamed Agent'}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>{agent.user_type === 'principal_broker' ? 'Principal Broker' : 'Agent'}</div>
        </div>
        <div style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: label.color, background: label.bg }}>{label.text}</div>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <MiniStat icon={<FileText style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Active Listings" value={c.listings} />
        <MiniStat icon={<FileText style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Active Requirements" value={c.requirements} />
        <MiniStat icon={<Calendar style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Joined" value={fmtDate(agent.created_at)} />
        <MiniStat icon={<Clock style={{ width: '16px', height: '16px', color: ACCENT }} />} label="Last Active" value={fmtDate(agent.last_active_at || agent.updated_at)} />
      </div>

      {/* Contact */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '12px', marginBottom: '6px' }}>Contact</div>
        <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>{agent.user_email}</div>
        {agent.phone && <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", fontSize: '14px', marginTop: '2px' }}>{agent.phone}</div>}
      </div>

      {/* Their posts (read-only) */}
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

      {/* Danger zone */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '12px' }}>
        <button
          onClick={onRemove}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          <Trash2 style={{ width: '15px', height: '15px' }} /> Remove from Brokerage
        </button>
      </div>

      {/* Remove confirm */}
      {confirmRemove && (
        <ConfirmOverlay
          title="Remove this agent?"
          body={`${agent.full_name || agent.user_email} will be removed from your brokerage. This does not change any billing. They can be re-invited later.`}
          confirmText={removing ? 'Removing…' : 'Remove'}
          danger
          onCancel={onCancelRemove}
          onConfirm={onConfirmRemove}
          busy={removing}
        />
      )}

      {/* Read-only post viewer */}
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
    <div
      onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 7px', background: post.visibility === 'public' ? 'rgba(0,219,197,0.15)' : 'rgba(255,165,0,0.15)', borderRadius: '4px', fontSize: '10px', fontWeight: 500, color: post.visibility === 'public' ? ACCENT : '#FFA500' }}>
        {post.visibility === 'public' ? <Globe style={{ width: '11px', height: '11px' }} /> : <Lock style={{ width: '11px', height: '11px' }} />}
        {post.visibility === 'public' ? 'Public' : 'Brokerage'}
      </div>
      <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, paddingRight: '80px', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title || `${post.property_type} in ${post.city}`}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>{post.city}{post.state ? `, ${post.state}` : ''}</div>
      {post._type === 'listing' && <div style={{ color: ACCENT, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>{formatListingPrice(post)}</div>}
    </div>
  );
}

// Read-only detail modal - displays a post's fields, no editing
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#141b22', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div style={{ padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif", color: ACCENT, background: 'rgba(0,219,197,0.15)' }}>
            {post._type === 'listing' ? 'Listing' : 'Requirement'} · View Only
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex' }}><X style={{ width: '20px', height: '20px' }} /></button>
        </div>
        <h2 style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, margin: '8px 0 16px' }}>{post.title || `${post.property_type} in ${post.city}`}</h2>

        <Row label="Property Type" value={post.property_type} />
        <Row label="Transaction" value={post.transaction_type} />
        <Row label="City" value={post.city} />
        <Row label="State" value={post.state} />
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
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: '20px' }}>
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
