import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DealPost from '../dashboard/DealPost';
import { Building2, Search, Sparkles } from 'lucide-react';

export default function GroupListingsRequirements({ groupId, memberEmails, currentUser }) {
  const [tab, setTab] = useState('all');

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

  // Visibility filter logic:
  // A listing/requirement shows in this group if:
  // - It's public → show (since the poster is a group member)
  // - It's team visibility AND visibility_groups includes this group → show
  // - brokerage only → NEVER show in group
  // - private → NEVER show in group
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

  const groupListings = listings
    .filter(l => memberEmailSet.has(l.created_by))
    .filter(isVisibleInGroup)
    .map(l => ({ ...l, postType: 'listing' }));

  const groupRequirements = requirements
    .filter(r => memberEmailSet.has(r.created_by))
    .filter(isVisibleInGroup)
    .map(r => ({ ...r, postType: 'requirement' }));

  const allPosts = [...groupListings, ...groupRequirements]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // "Matches" tab: show listings/requirements from the group that match the current user's own posts
  const myListings = groupListings.filter(l => l.created_by === currentUser?.email);
  const myRequirements = groupRequirements.filter(r => r.created_by === currentUser?.email);
  const myPosts = [...myListings, ...myRequirements].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const matchedPosts = useMemo(() => {
    if (!currentUser) return [];
    const matched = new Set();
    const result = [];

    // Match my requirements against group listings
    myRequirements.forEach(req => {
      groupListings
        .filter(l => l.created_by !== currentUser.email)
        .forEach(listing => {
          const typeMatch = listing.property_type === req.property_type;
          const txMatch = listing.transaction_type === req.transaction_type ||
            (req.transaction_type === 'purchase' && listing.transaction_type === 'sale') ||
            (req.transaction_type === 'lease' && listing.transaction_type === 'sublease');
          if (typeMatch && txMatch && !matched.has(listing.id)) {
            matched.add(listing.id);
            result.push(listing);
          }
        });
    });

    // Match my listings against group requirements
    myListings.forEach(listing => {
      groupRequirements
        .filter(r => r.created_by !== currentUser.email)
        .forEach(req => {
          const typeMatch = listing.property_type === req.property_type;
          const txMatch = listing.transaction_type === req.transaction_type ||
            (req.transaction_type === 'purchase' && listing.transaction_type === 'sale') ||
            (req.transaction_type === 'lease' && listing.transaction_type === 'sublease');
          if (typeMatch && txMatch && !matched.has(req.id)) {
            matched.add(req.id);
            result.push(req);
          }
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
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? 'var(--tiffany-blue)' : '#f3f4f6',
              color: tab === t.key ? 'white' : '#6b7280',
            }}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: tab === t.key ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: tab === t.key ? 'white' : '#6b7280',
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Posts */}
      {displayPosts.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl shadow-md">
          {tab === 'matches' ? (
            <>
              <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No matches found yet.</p>
              <p className="text-xs text-gray-400 mt-1">Post your own listings or requirements to see what aligns with group members.</p>
            </>
          ) : tab === 'my' ? (
            <>
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">You haven't posted any listings or requirements yet.</p>
            </>
          ) : (
            <>
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No listings or requirements from group members yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayPosts.map(post => (
            <DealPost key={`${post.postType}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}