import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Grid3x3, List, Building2, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

const ACCENT = '#00DBC5';

export default function Listings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState('grid'); // 'grid' or 'list'
  const [expandedId, setExpandedId] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date'),
  });

  const ListingCard = ({ listing }) => {
    const isExpanded = expandedId === listing.id;
    const mockMatches = Math.floor(Math.random() * 8) + 2; // Mock match count

    return (
      <Card 
        onClick={() => setExpandedId(isExpanded ? null : listing.id)}
        style={{ 
          background: 'rgba(255,255,255,0.04)', 
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Match Badge */}
        {mockMatches > 0 && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: ACCENT,
            color: '#111827',
            padding: '6px 12px',
            borderRadius: '20px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 2
          }}>
            {mockMatches} Matches
          </div>
        )}

        <CardContent style={{ padding: '24px' }}>
          {/* Thumbnail placeholder */}
          <div style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(0,219,197,0.1) 0%, rgba(0,219,197,0.03) 100%)',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0,219,197,0.2)'
          }}>
            <Building2 style={{ width: '48px', height: '48px', color: `${ACCENT}60` }} />
          </div>

          {/* Title & Location */}
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px',
            fontWeight: 500,
            color: 'white',
            margin: '0 0 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {listing.title || listing.address}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <MapPin style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {listing.city}, {listing.state}
            </span>
          </div>

          {/* Price & Type */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign style={{ width: '18px', height: '18px', color: ACCENT }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '24px',
                fontWeight: 600,
                color: ACCENT
              }}>
                {(listing.price || 0).toLocaleString()}
              </span>
            </div>
            <span style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.7)'
            }}>
              {listing.property_type}
            </span>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: listing.status === 'active' ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
            border: listing.status === 'active' ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            color: listing.status === 'active' ? ACCENT : 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {listing.status || 'active'}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
                marginBottom: '20px'
              }}>
                {listing.description || 'No description available.'}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: ACCENT,
                  margin: '0 0 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Matched Requirements ({mockMatches})
                </h4>
                {/* Mock matched requirements */}
                {[...Array(Math.min(mockMatches, 3))].map((_, i) => (
                  <div key={i} style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        Client Requirement #{i + 1}
                      </span>
                      <div style={{
                        padding: '4px 8px',
                        background: `${ACCENT}20`,
                        border: `1px solid ${ACCENT}40`,
                        borderRadius: '4px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: ACCENT
                      }}>
                        {Math.floor(Math.random() * 15) + 85}% Match
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '42px',
            fontWeight: 300,
            color: 'white',
            margin: '0 0 8px'
          }}>
            Your Listings
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Properties you're marketing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setView('grid')}
              style={{
                padding: '8px 12px',
                background: view === 'grid' ? ACCENT : 'transparent',
                color: view === 'grid' ? '#111827' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <Grid3x3 style={{ width: '16px', height: '16px' }} />
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              style={{
                padding: '8px 12px',
                background: view === 'list' ? ACCENT : 'transparent',
                color: view === 'list' ? '#111827' : 'rgba(255,255,255,0.6)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <List style={{ width: '16px', height: '16px' }} />
              List
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: ACCENT,
              border: 'none',
              borderRadius: '8px',
              color: '#111827',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Listing
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CardContent style={{ padding: '64px', textAlign: 'center' }}>
            <Building2 style={{ width: '64px', height: '64px', color: `${ACCENT}40`, margin: '0 auto 24px' }} />
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px',
              fontWeight: 500,
              color: 'white',
              margin: '0 0 12px'
            }}>
              No listings yet
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 24px'
            }}>
              Start by adding your first property listing
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 24px',
                background: ACCENT,
                border: 'none',
                borderRadius: '8px',
                color: '#111827',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Add Your First Listing
            </button>
          </CardContent>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
          gap: '20px'
        }}>
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}