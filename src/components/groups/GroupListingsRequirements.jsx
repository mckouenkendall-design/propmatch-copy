import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DealPost from '../dashboard/DealPost';
import { Building2, Search, Sparkles } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function GroupListingsRequirements({ groupId, memberEmails, currentUser }) {
  const [tab, setTab] = useState('all');
  const queryClient = useQueryClient();

  // Real-time updates when listings or requirements are created
  useEffect(() => {
    const unsubListing = base44.entities.Listing.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['group-listings'] });
    });
    const unsubReq = base44.entities.Requirement.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['group-requirements'] });
    });
    return () => { unsubListing(); unsubReq(); };
  }, [queryClient]);

  const { data: listings = [] } = useQuery({
    queryKey: ['group-listings', groupId, memberEmails],
    queryFn: () => base44.entities.Listing.list('-created_date'),
    enabled: memberEmails.length > 0,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['group-requirements', groupId, memberEmails],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: memberEmails.length > 0,
  });

  const isVisibleInGroup = (post) => {
    const visibility = post.visibility || 'public';
    if (visibility === 'brokerage' || visibility === 'private') return false;
    if (visibility === 'public') return true;
    if (visibility === 'team') {
      const groups = (post.visibility_groups || '').split(',').map(s => s.trim());
      return groups.includes(groupId);
    }
    return false;
  };

  const memberEmailSet = new Set(memberEmails);
  const groupListings = listings.filter(l => memberEmailSet.has(l.created_by)).filter(isVisibleInGroup).map(l => ({ ...l, postType: 'listing' }));
  const groupRequirements = requirements.filter(r => memberEmailSet.has(r.created_by)).filter(isVisibleInGroup).map(r => ({ ...r, postType: 'requirement' }));
  const allPosts = [...groupListings, ...groupRequirements].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const myListings = groupListings.filter(l => l.created_by === currentUser?.email);
  const myRequirements = groupRequirements.filter(r => r.created_by === currentUser?.email);
  const myPosts = [...myListings, ...myRequirements].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const matchedPosts = useMemo(() => {
    if (!currentUser) return [];
    const matched = new Set();
    const result = [];
    myRequirements.forEach(req => {
      groupListings.filter(l => l.created_by !== currentUser.email).forEach(listing => {
        const typeMatch = listing.property_type === req.property_type;
        const txMatch = listing.transaction_type === req.transaction_type || (req.transaction_type === 'purchase' && listing.transaction_type === 'sale') || (req.transaction_type === 'lease' && listing.transaction_type === 'sublease');
        if (typeMatch && txMatch && !matched.has(listing.id)) { matched.add(listing.id); result.push(listing); }
      });
    });
    myListings.forEach(listing => {
      groupRequirements.filter(r => r.created_by !== currentUser.email).forEach(req => {
        const typeMatch = listing.property_type === req.property_type;
        const txMatch = listing.transaction_type === req.transaction_type || (req.transaction_type === 'purchase' && listing.transaction_type === 'sale') || (req.transaction_type === 'lease' && listing.transaction_type === 'sublease');
        if (typeMatch && txMatch && !matched.has(req.id)) { matched.add(req.id); result.push(req); }
      });
    });
    return result;
  }, [myListings, myRequirements, groupListings, groupRequirements, currentUser]);

  const displayPosts = tab === 'all' ? allPosts : tab === 'my' ? myPosts : matchedPosts;

  const tabs = [
    { key: 'all', label: 'All', icon: Building2, count: allPosts.length },
    { key: 'matches', label: 'Matches', icon: Sparkles, count: matchedPosts.length },
    { key: 'my', label: 'My Posts', icon: Search, count: myPosts.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: tab === t.key ? ACCENT : 'rgba(255,255,255,0.06)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.6)' }}>
            <t.icon style={{ width: '14px', height: '14px' }} />
            {t.label}
            <span style={{ marginLeft: '2px', padding: '1px 6px', borderRadius: '99px', fontSize: '11px', background: tab === t.key ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.5)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts */}
      {displayPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          {tab === 'matches' ? (
            <>
              <Sparkles style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>No matches found yet.</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Post your own listings or requirements to see what aligns.</p>
            </>
          ) : tab === 'my' ? (
            <>
              <Building2 style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>You haven't posted any listings or requirements yet.</p>
            </>
          ) : (
            <>
              <Building2 style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No listings or requirements from group members yet.</p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayPosts.map(post => (
            <DealPost key={`${post.postType}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}