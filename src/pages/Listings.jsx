import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Grid3x3, List, Building2, MapPin, DollarSign, X, Mail, Phone, MessageCircle, Pencil } from 'lucide-react';
import CreatePostModal from '@/components/dashboard/CreatePostModal';
import ListingWizard from '@/components/forms/ListingWizard';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '@/utils/matchScore';

const ACCENT = '#00DBC5';

function ScorePill({ score }) {
  if (!score || score < 30) return null;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: `${color}12`, border: `1px solid ${color}35`, borderRadius: '20px' }}>
      <svg width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="4" fill="none" stroke={`${color}30`} strokeWidth="1.5" />
        <circle cx="5" cy="5" r="4" fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray={`${(score / 100) * 25.1} 25.1`} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '5px 5px' }} />
      </svg>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color }}>{score}%</span>
      {label && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>}
    </div>
  );
}

function ContactModal({ listing, posterProfile, bestMatch, onClose }) {
  const name    = listing.contact_agent_name  || posterProfile?.full_name  || listing.created_by || 'Agent';
  const email   = listing.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const phone   = listing.contact_agent_phone || posterProfile?.phone;
  const company = listing.company_name        || posterProfile?.brokerage_name;
  const photo   = posterProfile?.profile_photo_url;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '520px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ACCENT }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>Listing</span>
            {bestMatch && <ScorePill score={bestMatch.totalScore} />}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 6px' }}>{listing.title}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {listing.city && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}><MapPin style={{ width: '11px', height: '11px' }} />{listing.city}{listing.state ? `, ${listing.state}` : ''}</span>}
            {listing.price && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', background: `${ACCENT}10`, border: `1px solid ${ACCENT}25`, borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, color: ACCENT }}><DollarSign style={{ width: '11px', height: '11px' }} />${parseFloat(listing.price).toLocaleString()}</span>}
            {listing.size_sqft && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{parseFloat(listing.size_sqft).toLocaleString()} SF</span>}
            {listing.transaction_type && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{listing.transaction_type}</span>}
          </div>

          {listing.description && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 20px' }}>{listing.description}</p>
          )}

          <div style={{ background: 'rgba(0,219,197,0.04)', border: `1px solid ${ACCENT}20`, borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>Contact Agent</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 700, fontSize: '16px' }}>
                {photo ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: 'white', margin: 0 }}>{name}</p>
                {company && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{company}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {email && <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, textDecoration: 'none', padding: '8px 12px', background: 'rgba(0,219,197,0.08)', borderRadius: '8px', border: '1px solid rgba(0,219,197,0.15)' }}><Mail style={{ width: '14px', height: '14px' }} /> {email}</a>}
              {phone && <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, textDecoration: 'none', padding: '8px 12px', background: 'rgba(0,219,197,0.08)', borderRadius: '8px', border: '1px solid rgba(0,219,197,0.15)' }}><Phone style={{ width: '14px', height: '14px' }} /> {phone}</a>}
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: ACCENT, border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                <MessageCircle style={{ width: '14px', height: '14px' }} /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Listings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState('grid');
  const [editingListing, setEditingListing] = useState(null);
  const [viewingListing, setViewingListing] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ['all-listings'],
    queryFn: () => base44.entities.Listing.list('-created_date'),
  });
  const { data: myRequirements = [] } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }),
  });
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.user_email, p]));

  // Pre-compute best match score for each listing against current user's requirements
  const listingScores = useMemo(() => {
    const map = {};
    listings.forEach(l => {
      const scores = myRequirements.map(req => calculateMatchScore(l, req)).filter(r => r.isMatch);
      map[l.id] = scores.length ? scores.reduce((best, s) => s.totalScore > best.totalScore ? s : best) : null;
    });
    return map;
  }, [listings, myRequirements]);

  const handleCardClick = (listing) => {
    if (listing.created_by === user?.email) {
      const parsed = { ...listing };
      if (typeof parsed.property_details === 'string') { try { parsed.property_details = JSON.parse(parsed.property_details); } catch { parsed.property_details = {}; } }
      setEditingListing(parsed);
    } else {
      setViewingListing(listing);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 6px' }}>Listings</h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Click any card to view details. Your own listings show an edit option.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
            {[{ v: 'grid', Icon: Grid3x3 }, { v: 'list', Icon: List }].map(({ v, Icon }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', background: view === v ? ACCENT : 'transparent', color: view === v ? '#111827' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                <Icon style={{ width: '16px', height: '16px' }} />
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 20px', background: ACCENT, border: 'none', borderRadius: '8px', color: '#111827', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus style={{ width: '16px', height: '16px' }} /> Post Listing
          </button>
        </div>
      </div>

      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <Building2 style={{ width: '56px', height: '56px', color: `${ACCENT}30`, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 400, color: 'white', margin: '0 0 8px' }}>No listings yet</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Be the first to post a listing</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr', gap: '16px' }}>
          {listings.map(listing => {
            const isOwn  = listing.created_by === user?.email;
            const match  = listingScores[listing.id];
            const color  = match ? getScoreColor(match.totalScore) : null;

            return (
              <div key={listing.id} onClick={() => handleCardClick(listing)}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${match && match.totalScore >= 70 ? `${ACCENT}40` : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '18px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                {/* Own post badge */}
                {isOwn && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: '6px' }}>
                    <Pencil style={{ width: '10px', height: '10px', color: ACCENT }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: ACCENT }}>Edit</span>
                  </div>
                )}

                {/* Match score for other people's listings */}
                {!isOwn && match && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <ScorePill score={match.totalScore} />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', paddingRight: '70px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 style={{ width: '18px', height: '18px', color: ACCENT }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      {[listing.city, listing.state].filter(Boolean).join(', ')} · {(listing.property_type || '').replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 700, color: ACCENT }}>
                    ${(parseFloat(listing.price) || 0).toLocaleString()}
                    {(listing.transaction_type === 'lease' || listing.transaction_type === 'sublease') && <span style={{ fontSize: '13px', fontWeight: 400 }}>/SF/yr</span>}
                    {listing.transaction_type === 'rent' && <span style={{ fontSize: '13px', fontWeight: 400 }}>/mo</span>}
                  </span>
                  {listing.size_sqft && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>· {parseFloat(listing.size_sqft).toLocaleString()} SF</span>}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {listing.transaction_type && <span style={{ padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>{listing.transaction_type}</span>}
                  <span style={{ padding: '3px 8px', background: listing.status === 'active' ? `${ACCENT}12` : 'rgba(255,255,255,0.05)', border: `1px solid ${listing.status === 'active' ? `${ACCENT}30` : 'rgba(255,255,255,0.08)'}`, borderRadius: '5px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: listing.status === 'active' ? ACCENT : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{listing.status || 'Active'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); queryClient.invalidateQueries({ queryKey: ['all-listings'] }); }} />
      )}

      {editingListing && (
        <ListingWizard category={editingListing.property_category || 'commercial'} initialData={editingListing} editMode={true}
          onClose={() => setEditingListing(null)}
          onSuccess={() => { setEditingListing(null); queryClient.invalidateQueries({ queryKey: ['all-listings'] }); }} />
      )}

      {viewingListing && (
        <ContactModal listing={viewingListing} posterProfile={profileMap[viewingListing.created_by]}
          bestMatch={listingScores[viewingListing.id]}
          onClose={() => setViewingListing(null)} />
      )}
    </div>
  );
}