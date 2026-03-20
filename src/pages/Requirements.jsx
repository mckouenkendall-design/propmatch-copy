import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Grid3x3, List, Search, MapPin, DollarSign, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

const ACCENT = '#00DBC5';

export default function Requirements() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState('grid');
  const [expandedId, setExpandedId] = useState(null);

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
  });

  const RequirementCard = ({ requirement }) => {
    const isExpanded = expandedId === requirement.id;
    const mockMatches = Math.floor(Math.random() * 12) + 3;

    return (
      <Card
        onClick={() => setExpandedId(isExpanded ? null : requirement.id)}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          position: 'relative'
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
          <div style={{
            width: '100%',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Search style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.3)' }} />
          </div>

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
            {requirement.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <MapPin style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {requirement.cities?.join(', ') || 'Multiple locations'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                display: 'block',
                marginBottom: '4px'
              }}>
                Budget
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign style={{ width: '18px', height: '18px', color: ACCENT }} />
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: ACCENT
                }}>
                  {(requirement.max_price || 0).toLocaleString()}
                </span>
              </div>
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
              {requirement.property_type}
            </span>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            background: requirement.status === 'active' ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
            border: requirement.status === 'active' ? `1px solid ${ACCENT}40` : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            color: requirement.status === 'active' ? ACCENT : 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {requirement.status || 'active'}
          </div>

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
                {requirement.notes || 'No additional notes.'}
              </p>

              <div>
                <h4 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: ACCENT,
                  margin: '0 0 12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Matched Listings ({mockMatches})
                </h4>
                {[...Array(Math.min(mockMatches, 3))].map((_, i) => (
                  <div key={i} style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `${ACCENT}15`,
                        border: `1px solid ${ACCENT}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Building2 style={{ width: '20px', height: '20px', color: ACCENT }} />
                      </div>
                      <div>
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'white',
                          display: 'block'
                        }}>
                          Property Match #{i + 1}
                        </span>
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '12px',
                          color: 'rgba(255,255,255,0.5)'
                        }}>
                          Detroit, MI
                        </span>
                      </div>
                    </div>
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
                      {Math.floor(Math.random() * 20) + 80}% Match
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '42px',
            fontWeight: 300,
            color: 'white',
            margin: '0 0 8px'
          }}>
            Your Requirements
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Client needs you're representing
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
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
            Add Requirement
          </button>
        </div>
      </div>

      {requirements.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CardContent style={{ padding: '64px', textAlign: 'center' }}>
            <Search style={{ width: '64px', height: '64px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 24px' }} />
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px',
              fontWeight: 500,
              color: 'white',
              margin: '0 0 12px'
            }}>
              No requirements yet
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 24px'
            }}>
              Start by adding your first client requirement
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
              Add Your First Requirement
            </button>
          </CardContent>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr',
          gap: '20px'
        }}>
          {requirements.map(req => (
            <RequirementCard key={req.id} requirement={req} />
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