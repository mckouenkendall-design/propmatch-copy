import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, Sparkles, X, Phone, Mail, User, MapPin, DollarSign } from 'lucide-react';

const ACCENT = '#00DBC5';

// ── Price formatter ───────────────────────────────────────────────────────────
function fmtPostPrice(post) {
  const isL = !!post.size_sqft;
  const fmt = (n) => { const num = parseFloat(n); if (!n||isNaN(num)) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
  const u = isL ? (post.transaction_type==='lease'||post.transaction_type==='sublease'?'/SF/yr':post.transaction_type==='rent'?'/mo':'') : (post.price_period==='per_month'?'/mo':post.price_period==='per_sf_per_year'?'/SF/yr':post.price_period==='annually'?'/yr':'');
  if (isL) return `$${fmt(post.price)||'0'}${u}`;
  const lo=fmt(post.min_price),hi=fmt(post.max_price);
  if(lo&&hi) return `$${lo}–$${hi}${u}`;
  if(hi) return `Up to $${hi}${u}`;
  if(lo) return `From $${lo}${u}`;
  return null;
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginRight: '16px' }}>{label}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'white', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ── Full detail modal ─────────────────────────────────────────────────────────
function PostDetailModal({ post, posterProfile, onClose }) {
  const isListing = post.postType === 'listing';
  const name    = post.contact_agent_name  || posterProfile?.full_name  || 'Agent';
  const email   = post.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const phone   = post.contact_agent_phone || posterProfile?.phone;
  const company = post.company_name        || posterProfile?.brokerage_name;
  const photo   = posterProfile?.profile_photo_url;

  const details = (() => {
    if (!post.property_details) return {};
    if (typeof post.property_details === 'string') { try { return JSON.parse(post.property_details); } catch { return {}; } }
    return post.property_details;
  })();

  const priceStr = fmtPostPrice(post);

  const LEASE_LABELS = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', percentage_lease:'Percentage Lease', nnn:'NNN', nn:'NN', n:'N (Single Net)', absolute_net:'Absolute Net' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '680px', overflow: 'hidden', marginBottom: '20px' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isListing ? ACCENT : '#6366f1', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>
              {isListing ? 'Listing' : 'Requirement'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Title + price */}
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>{post.title}</h2>
          {priceStr && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: '8px', marginBottom: '20px' }}>
              <DollarSign style={{ width: '14px', height: '14px', color: ACCENT }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 700, color: ACCENT }}>{priceStr}</span>
            </div>
          )}

          {/* Core chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {(post.city || post.state) && <span style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}><MapPin style={{width:'11px',height:'11px'}} />{[post.city, post.state].filter(Boolean).join(', ')}</span>}
            {post.cities?.length > 0 && <span style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}><MapPin style={{width:'11px',height:'11px'}} />{post.cities.join(', ')}</span>}
            {post.zip_code && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>{post.zip_code}</span>}
            {post.property_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)', textTransform:'capitalize' }}>{post.property_type.replace(/_/g,' ')}</span>}
            {post.transaction_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)', textTransform:'capitalize' }}>{post.transaction_type}</span>}
            {post.status && <span style={{ padding:'4px 10px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:600, color:ACCENT, textTransform:'uppercase', letterSpacing:'0.04em' }}>{post.status}</span>}
          </div>

          {/* Key numbers */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 12px' }}>Property Details</p>
            {isListing ? (
              <>
                <DetailRow label="Size" value={post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : null} />
                <DetailRow label="Address" value={post.address} />
                <DetailRow label="Lease Type" value={post.lease_type ? (LEASE_LABELS[post.lease_type] || post.lease_type) : null} />
                <DetailRow label="Building Class" value={details.building_class ? `Class ${details.building_class}` : null} />
                <DetailRow label="Parking" value={details.parking_ratio || details.total_parking_spaces ? `${details.parking_ratio || ''} ${details.total_parking_spaces ? `· ${details.total_parking_spaces} spaces` : ''}`.trim() : null} />
                <DetailRow label="Ceiling Height" value={details.ceiling_height} />
                <DetailRow label="Zoning" value={details.zoning} />
                <DetailRow label="Loading Docks" value={details.dock_doors} />
                <DetailRow label="Drive-In Doors" value={details.drive_in_doors} />
                <DetailRow label="Clear Height" value={details.clear_height ? `${details.clear_height} ft` : null} />
                <DetailRow label="Bedrooms" value={details.bedrooms} />
                <DetailRow label="Bathrooms" value={details.bathrooms} />
                <DetailRow label="Year Built" value={details.year_built} />
                <DetailRow label="HOA" value={details.hoa ? `$${parseFloat(details.hoa).toLocaleString()}/mo` : null} />
                <DetailRow label="Lot Size" value={details.lot_sqft ? `${parseFloat(details.lot_sqft).toLocaleString()} SF` : null} />
                <DetailRow label="Acreage" value={details.acres ? `${details.acres} acres` : null} />
                <DetailRow label="Exam Rooms" value={details.exam_rooms} />
                <DetailRow label="Traffic Count" value={details.traffic_count ? `${parseFloat(details.traffic_count).toLocaleString()}/day` : null} />
              </>
            ) : (
              <>
                <DetailRow label="Size Range" value={(post.min_size_sqft || post.max_size_sqft) ? `${post.min_size_sqft ? parseFloat(post.min_size_sqft).toLocaleString() : '0'}–${post.max_size_sqft ? parseFloat(post.max_size_sqft).toLocaleString() : '∞'} SF` : null} />
                <DetailRow label="Timeline" value={post.timeline?.replace(/_/g,' ')} />
                <DetailRow label="Min Offices" value={details.min_offices} />
                <DetailRow label="Min Conf Rooms" value={details.min_conf_rooms} />
                <DetailRow label="Min Bedrooms" value={details.min_bedrooms} />
                <DetailRow label="Min Bathrooms" value={details.min_bathrooms} />
                <DetailRow label="Min Parking" value={details.min_total_parking_spaces} />
                <DetailRow label="Building Class" value={details.building_classes?.length ? `Class ${details.building_classes.join(', ')}` : null} />
                <DetailRow label="Min Exam Rooms" value={details.min_exam_rooms} />
                <DetailRow label="Min Clear Height" value={details.min_clear_height ? `${details.min_clear_height} ft` : null} />
                <DetailRow label="Min Docks" value={details.min_dock_doors} />
                <DetailRow label="Min Acreage" value={details.min_acres ? `${details.min_acres} acres` : null} />
              </>
            )}
          </div>

          {/* Amenities */}
          {((post.amenities?.length > 0) || (details.building_amenities?.length > 0) || (details.building_amenities_required?.length > 0)) && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 10px' }}>Amenities</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {[...(post.amenities||[]), ...(details.building_amenities||[]), ...(details.building_amenities_required||[])].map((a,i) => (
                  <span key={i} style={{ padding:'3px 10px', background:`${ACCENT}10`, border:`1px solid ${ACCENT}25`, borderRadius:'20px', fontFamily:"'Inter', sans-serif", fontSize:'11px', color:ACCENT }}>
                    {a.replace(/_/g,' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description / Notes */}
          {(post.description || post.notes || details.description || details.intended_use) && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 8px' }}>
                {isListing ? 'Description' : 'Notes / Intended Use'}
              </p>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:0 }}>
                {post.description || post.notes || details.description || details.intended_use}
              </p>
            </div>
          )}

          {/* Contact */}
          <div style={{ background:`${ACCENT}05`, border:`1px solid ${ACCENT}20`, borderRadius:'12px', padding:'16px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(255,255,255,0.3)', margin:'0 0 12px' }}>
              {isListing ? 'Listing Agent' : 'Representing Agent'}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'18px', fontWeight:700 }}>
                {photo ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : name[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:0 }}>{name}</p>
                {company && <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{company}</p>}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {email && <a href={`mailto:${email}`} style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'8px 12px', background:`${ACCENT}08`, borderRadius:'8px', border:`1px solid ${ACCENT}15` }}><Mail style={{width:'14px',height:'14px'}} />{email}</a>}
              {phone && <a href={`tel:${phone}`} style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'8px 12px', background:`${ACCENT}08`, borderRadius:'8px', border:`1px solid ${ACCENT}15` }}><Phone style={{width:'14px',height:'14px'}} />{phone}</a>}
            </div>
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
                        {(() => {
                          const isL = !!post.size_sqft;
                          const fmt = (n) => { const num = parseFloat(n); if (!n||isNaN(num)) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
                          const u = isL ? (post.transaction_type==='lease'||post.transaction_type==='sublease'?'/SF/yr':post.transaction_type==='rent'?'/mo':'') : (post.price_period==='per_month'?'/mo':post.price_period==='per_sf_per_year'?'/SF/yr':post.price_period==='annually'?'/yr':'');
                          if (isL) return `$${fmt(post.price)||'0'}${u}`;
                          const lo=fmt(post.min_price),hi=fmt(post.max_price);
                          if(lo&&hi) return `$${lo}–$${hi}${u}`;
                          if(hi) return `Up to $${hi}${u}`;
                          if(lo) return `From $${lo}${u}`;
                          return '—';
                        })()}
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