import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Building2, Search, Filter, Plus, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

const ACCENT = '#00DBC5';

const STAGES = [
  { id: 'prospects', label: 'Prospects', color: '#6B7280' },
  { id: 'qualified', label: 'Qualified', color: '#3B82F6' },
  { id: 'negotiation', label: 'Negotiation', color: '#F59E0B' },
  { id: 'under_contract', label: 'Under Contract', color: ACCENT },
  { id: 'closed', label: 'Closed', color: '#10B981' },
];

export default function Dealboard() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: listings = [] } = useQuery({
    queryKey: ['dealboard-listings', user?.email],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['dealboard-requirements', user?.email],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const allDeals = [
    ...listings.map(l => ({ ...l, dealType: 'listing', stage: l.stage || 'prospects' })),
    ...requirements.map(r => ({ ...r, dealType: 'requirement', stage: r.stage || 'prospects' })),
  ];

  const DealCard = ({ deal }) => {
    const isListing = deal.dealType === 'listing';
    const matchScore = Math.floor(Math.random() * 30) + 70;

    const fmt = (n) => {
      const num = parseFloat(n);
      if (!n || isNaN(num)) return null;
      return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    };

    const displayPrice = (() => {
      const u = isListing
        ? (deal.transaction_type === 'lease' || deal.transaction_type === 'sublease' ? '/SF/yr'
          : deal.transaction_type === 'rent' ? '/mo' : '')
        : (deal.price_period === 'per_month' ? '/mo'
          : deal.price_period === 'per_sf_per_year' ? '/SF/yr'
          : deal.price_period === 'annually' ? '/yr'
          : (deal.transaction_type === 'lease' || deal.transaction_type === 'rent') ? '/mo' : '');
      if (isListing) return `$${fmt(deal.price) || '0'}${u}`;
      const lo = fmt(deal.min_price), hi = fmt(deal.max_price);
      if (lo && hi) return `$${lo}–$${hi}${u}`;
      if (hi) return `Up to $${hi}${u}`;
      if (lo) return `From $${lo}${u}`;
      return '—';
    })();

    return (
      <Card
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: matchScore >= 85 ? `1px solid ${ACCENT}60` : '1px solid rgba(255,255,255,0.08)',
          cursor: 'grab',
          marginBottom: '12px',
          boxShadow: matchScore >= 85 ? `0 0 20px ${ACCENT}20` : 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
      >
        <CardContent style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isListing ? `${ACCENT}15` : 'rgba(255,255,255,0.06)',
                border: isListing ? `1px solid ${ACCENT}30` : '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isListing
                  ? <Building2 style={{ width: '16px', height: '16px', color: ACCENT }} />
                  : <Search style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
                }
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: 0 }}>
                  {deal.title?.substring(0, 30)}...
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {deal.city || 'TBD'}
                </p>
              </div>
            </div>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px' }}>
              <MoreVertical style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '6px',
            background: matchScore >= 85 ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
            border: matchScore >= 85 ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.08)',
            marginBottom: '12px'
          }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: matchScore >= 85 ? ACCENT : 'rgba(255,255,255,0.6)' }}>
              Match: {matchScore}%
            </span>
          </div>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 600, color: ACCENT, margin: '0 0 8px' }}>
            {displayPrice}
          </p>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            2 days in stage
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
            My Matches
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            View matched listings and requirements
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter style={{ width: '16px', height: '16px' }} />
            Filter
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '10px 20px', background: ACCENT, border: 'none', borderRadius: '8px', color: '#111827', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Deal
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto' }}>
        {STAGES.map(stage => {
          const stageDeals = allDeals.filter(d => d.stage === stage.id);
          return (
            <div key={stage.id} style={{ minWidth: '280px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.color }} />
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0, flex: 1 }}>
                    {stage.label}
                  </h3>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {stageDeals.length}
                  </span>
                </div>
              </div>
              <div style={{ minHeight: '400px' }}>
                {stageDeals.map(deal => <DealCard key={deal.id} deal={deal} />)}
              </div>
            </div>
          );
        })}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}