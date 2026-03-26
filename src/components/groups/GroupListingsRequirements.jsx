import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, Sparkles, X, Phone, Mail, User, MapPin, DollarSign } from 'lucide-react';

const ACCENT = '#00DBC5';

// ── Read-only contact modal shown when clicking someone else's post ───────────
function PostDetailModal({ post, posterProfile, onClose }) {
  const isListing = post.postType === 'listing';
  const name = post.contact_agent_name || posterProfile?.full_name || 'Agent';
  const email = post.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const phone = post.contact_agent_phone || posterProfile?.phone;
  const company = post.company_name || posterProfile?.brokerage_name;
  const photo = posterProfile?.profile_photo_url;
  const initial = name[0]?.toUpperCase() || '?';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}>
      <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '28px', maxWidth: '480px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isListing ? ACCENT : '#6366f1' }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
              {isListing ? 'Listing' : 'Requirement'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Title */}
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 6px' }}>{post.title}</h2>

        {/* Key details */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {(post.city || post.cities?.length > 0) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              <MapPin style={{ width: '11px', height: '11px' }} />
              {post.city || post.cities?.join(', ')}
            </span>
          )}
          {post.property_type && (
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {post.property_type.replace(/_/g, ' ')}
            </span>
          )}
          {post.transaction_type && (
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {post.transaction_type}
            </span>
          )}
        </div>

        {/* Price */}
        {(post.price || post.max_price) && (
          <div style={{ padding: '14px 16px', background: 'rgba(0,219,197,0.06)', border: `1px solid ${ACCENT}25`, borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign style={{ width: '16px', height: '16px', color: ACCENT }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 500, color: ACCENT }}>
              ${(post.price || post.max_price || 0).toLocaleString()}
            </span>
            {post.price_period && post.price_period !== 'total' && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                {post.price_period === 'per_month' ? '/mo' : post.price_period === 'per_sf_per_year' ? '/SF/yr' : ''}
              </span>
            )}
          </div>
        )}

        {/* Description / notes */}
        {(post.description || post.notes) && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 20px' }}>
            {post.description || post.notes}
          </p>
        )}

        {/* Contact card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', margin: '0 0 12px' }}>Contact</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '18px', fontWeight: 700 }}>
              {photo
                ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initial}
            </div>
            <div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'white', margin: 0 }}>{name}</p>
              {company && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{company}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {email && (
              <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT, textDecoration: 'none' }}>
                <Mail style={{ width: '15px', height: '15px', flexShrink: 0 }} /> {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT, textDecoration: 'none' }}>
                <Phone style={{ width: '15px', height: '15px', flexShrink: 0 }} /> {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupListingsRequirements({ groupId, memberEmails, currentUser }) {
  const [tab, setTab] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubListing = base44.entities.Listing.subscribe(() => queryClient.invalidateQueries({ queryKey: ['group-listings'] }));
    const unsubReq = base44.entities.Requirement.subscribe(() => queryClient.invalidateQueries({ queryKey: ['group-requirements'] }));
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

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));

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
      <div style={{ display: 'flex', gap: '8px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: tab === t.key ? ACCENT : 'rgba(255,255,255,0.06)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.6)' }}>
            <t.icon style={{ width: '14px', height: '14px' }} />
            {t.label}
            <span style={{ marginLeft: '2px', padding: '1px 6px', borderRadius: '99px', fontSize: '11px', background: tab === t.key ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.5)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {displayPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          {tab === 'matches' ? (
            <>
              <Sparkles style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>No matches found yet.</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Post your own listings or requirements to see what aligns.</p>
            </>
          ) : (
            <>
              <Building2 style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {tab === 'my' ? "You haven't posted any listings or requirements yet." : "No listings or requirements from group members yet."}
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayPosts.map(post => {
            const isListing = post.postType === 'listing';
            const posterProfile = profileMap[post.created_by];
            const posterName = post.contact_agent_name || posterProfile?.full_name || post.created_by || 'Agent';
            const posterPhoto = posterProfile?.profile_photo_url;
            const posterInitial = posterName[0]?.toUpperCase() || '?';

            return (
              <div
                key={`${post.postType}-${post.id}`}
                onClick={() => setSelectedPost(post)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = `${ACCENT}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isListing ? `${ACCENT}15` : 'rgba(255,255,255,0.06)', border: isListing ? `1px solid ${ACCENT}30` : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isListing
                      ? <Building2 style={{ width: '18px', height: '18px', color: ACCENT }} />
                      : <Search style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.6)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: isListing ? ACCENT : '#a78bfa' }}>
                        {isListing ? 'Listing' : 'Requirement'}
                      </span>
                    </div>
                    <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: ACCENT }}>
                        ${(post.price || post.max_price || 0).toLocaleString()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: ACCENT, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '10px', fontWeight: 700 }}>
                          {posterPhoto
                            ? <img src={posterPhoto} alt={posterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : posterInitial}
                        </div>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{posterName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          posterProfile={profileMap[selectedPost.created_by]}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}