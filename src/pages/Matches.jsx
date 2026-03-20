import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ACCENT = '#00DBC5';

// Weighted scoring system
const WEIGHTS = {
  price: 30,
  size: 25,
  location: 20,
  property_type: 15,
  amenities: 10,
};

const calculateMatch = (listing, requirement) => {
  let totalScore = 0;
  let breakdown = [];

  // Price match
  const listingPrice = listing.price || 0;
  const reqMin = requirement.min_price || 0;
  const reqMax = requirement.max_price || Infinity;
  const priceMatch = listingPrice >= reqMin && listingPrice <= reqMax;
  const priceScore = priceMatch ? 100 : Math.max(0, 100 - (Math.abs(listingPrice - reqMax) / reqMax) * 100);
  totalScore += (priceScore / 100) * WEIGHTS.price;
  breakdown.push({ factor: 'Price Range', score: Math.round(priceScore), weight: WEIGHTS.price });

  // Size match
  const listingSize = listing.size_sqft || 0;
  const reqMinSize = requirement.min_size_sqft || 0;
  const reqMaxSize = requirement.max_size_sqft || Infinity;
  const sizeMatch = listingSize >= reqMinSize && listingSize <= reqMaxSize;
  const sizeScore = sizeMatch ? 100 : Math.max(0, 100 - (Math.abs(listingSize - reqMaxSize) / reqMaxSize) * 100);
  totalScore += (sizeScore / 100) * WEIGHTS.size;
  breakdown.push({ factor: 'Square Footage', score: Math.round(sizeScore), weight: WEIGHTS.size });

  // Location match
  const locationMatch = requirement.cities?.includes(listing.city);
  const locationScore = locationMatch ? 100 : 30;
  totalScore += (locationScore / 100) * WEIGHTS.location;
  breakdown.push({ factor: 'Location', score: locationScore, weight: WEIGHTS.location });

  // Property type match
  const typeMatch = listing.property_type === requirement.property_type;
  const typeScore = typeMatch ? 100 : 0;
  totalScore += (typeScore / 100) * WEIGHTS.property_type;
  breakdown.push({ factor: 'Property Type', score: typeScore, weight: WEIGHTS.property_type });

  // Amenities match
  const reqAmenities = requirement.required_amenities || [];
  const listingAmenities = listing.amenities || [];
  const amenitiesMatch = reqAmenities.length === 0 ? 100 : (reqAmenities.filter(a => listingAmenities.includes(a)).length / reqAmenities.length) * 100;
  totalScore += (amenitiesMatch / 100) * WEIGHTS.amenities;
  breakdown.push({ factor: 'Amenities', score: Math.round(amenitiesMatch), weight: WEIGHTS.amenities });

  return { score: Math.round(totalScore), breakdown };
};

export default function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }),
  });

  const { data: myRequirements = [] } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }),
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings-matches'],
    queryFn: () => base44.entities.Listing.list('-created_date', 100),
  });

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['all-requirements-matches'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 100),
  });

  // Calculate matches for MY listings against OTHER people's requirements
  const listingMatches = myListings.flatMap(listing => {
    const otherRequirements = allRequirements.filter(r => r.created_by !== user?.email);
    return otherRequirements.map(req => {
      const match = calculateMatch(listing, req);
      return {
        myPost: listing,
        theirPost: req,
        ...match,
        type: 'listing',
      };
    }).filter(m => m.score >= 50);
  }).sort((a, b) => b.score - a.score);

  // Calculate matches for MY requirements against OTHER people's listings
  const requirementMatches = myRequirements.flatMap(requirement => {
    const otherListings = allListings.filter(l => l.created_by !== user?.email);
    return otherListings.map(listing => {
      const match = calculateMatch(listing, requirement);
      return {
        myPost: requirement,
        theirPost: listing,
        ...match,
        type: 'requirement',
      };
    }).filter(m => m.score >= 50);
  }).sort((a, b) => b.score - a.score);

  const currentMatches = activeTab === 'listings' ? listingMatches : requirementMatches;

  const MatchCard = ({ match }) => {
    const isListing = match.type === 'listing';
    const myPost = match.myPost;
    const theirPost = match.theirPost;

    return (
      <Card style={{
        background: 'rgba(255,255,255,0.04)',
        border: match.score >= 85 ? `1px solid ${ACCENT}60` : '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        if (match.score >= 85) e.currentTarget.style.boxShadow = `0 12px 32px ${ACCENT}25`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      >
        <CardContent style={{ padding: '24px' }}>
          {/* Match Score Ring */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
              <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={match.score >= 85 ? ACCENT : match.score >= 70 ? '#F59E0B' : '#6B7280'}
                  strokeWidth="8"
                  strokeDasharray={`${(match.score / 100) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '28px',
                  fontWeight: 600,
                  color: match.score >= 85 ? ACCENT : 'white',
                  margin: 0
                }}>
                  {match.score}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.4)',
                  margin: 0
                }}>
                  MATCH
                </p>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '18px',
                fontWeight: 500,
                color: 'white',
                margin: '0 0 6px'
              }}>
                {isListing ? 'Your Listing' : 'Your Requirement'}: {myPost.title || myPost.city}
              </h3>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: ACCENT,
                margin: '0 0 12px'
              }}>
                Matched with {isListing ? 'Requirement' : 'Listing'} from {theirPost.created_by}
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                margin: 0
              }}>
                {theirPost.title} • {theirPost.city}
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <h4 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 12px',
              fontWeight: 600
            }}>
              Score Breakdown
            </h4>
            {match.breakdown.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {item.factor} ({item.weight}% weight)
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: item.score >= 80 ? ACCENT : 'rgba(255,255,255,0.5)'
                  }}>
                    {item.score}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.score}%`,
                    height: '100%',
                    background: item.score >= 80 ? ACCENT : item.score >= 60 ? '#F59E0B' : '#6B7280',
                    borderRadius: '3px',
                    transition: 'all 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '28px',
          fontWeight: 400,
          color: 'white',
          margin: '0 0 6px'
        }}>
          My Matches
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          See how your posts match with others on the platform
        </p>
      </div>

      {/* Tab Toggle */}
      <div style={{
        display: 'inline-flex',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '4px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'listings' ? `${ACCENT}20` : 'transparent',
            border: activeTab === 'listings' ? `1px solid ${ACCENT}40` : 'none',
            borderRadius: '6px',
            color: activeTab === 'listings' ? ACCENT : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Building2 style={{ width: '16px', height: '16px' }} />
          My Listings' Matches ({listingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'requirements' ? `${ACCENT}20` : 'transparent',
            border: activeTab === 'requirements' ? `1px solid ${ACCENT}40` : 'none',
            borderRadius: '6px',
            color: activeTab === 'requirements' ? ACCENT : 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Search style={{ width: '16px', height: '16px' }} />
          My Requirements' Matches ({requirementMatches.length})
        </button>
      </div>

      {/* Matches Grid */}
      {currentMatches.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CardContent style={{ padding: '64px', textAlign: 'center' }}>
            <TrendingUp style={{ width: '64px', height: '64px', color: `${ACCENT}40`, margin: '0 auto 20px' }} />
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px',
              fontWeight: 500,
              color: 'white',
              margin: '0 0 8px'
            }}>
              No matches yet
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0
            }}>
              {activeTab === 'listings' 
                ? 'Your listings haven\'t matched with any requirements yet' 
                : 'Your requirements haven\'t matched with any listings yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentMatches.map((match, idx) => (
            <MatchCard key={idx} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}