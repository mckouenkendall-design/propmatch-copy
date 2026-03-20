import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, TrendingUp, MessageSquare, Plus, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

const ACCENT = '#00DBC5';

export default function Dashboard() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: listings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }),
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }),
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings'],
    queryFn: () => base44.entities.Listing.list('-created_date', 20),
  });

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['all-requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 20),
  });

  // Mock match data (will be replaced with real matching engine)
  const newMatchesToday = 3;
  const pendingMessages = 2;

  const StatCard = ({ icon: Icon, label, value, color = ACCENT, onClick }) => (
    <Card 
      onClick={onClick}
      style={{ 
        background: 'rgba(255,255,255,0.04)', 
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <CardContent style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            background: `${color}15`, 
            border: `1px solid ${color}30`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Icon style={{ width: '20px', height: '20px', color }} />
          </div>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '28px', fontWeight: 600, color: 'white', margin: '0 0 4px' }}>
          {value}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {label}
        </p>
      </CardContent>
    </Card>
  );

  const recentActivity = [
    ...allListings.slice(0, 3).map(l => ({ type: 'listing', data: l, time: l.created_date })),
    ...allRequirements.slice(0, 3).map(r => ({ type: 'requirement', data: r, time: r.created_date })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontFamily: "'Plus Jakarta Sans', sans-serif", 
          fontSize: '28px', 
          fontWeight: 400, 
          color: 'white', 
          margin: '0 0 6px' 
        }}>
          Welcome back, {(() => {
            const firstName = user?.full_name?.trim().split(/\s+/)[0];
            return firstName || 'there';
          })()}
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Your command center for active deals and opportunities
        </p>
      </div>

      {/* Hero Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '48px' 
      }}>
        <StatCard icon={Building2} label="Active Listings" value={listings.length} onClick={() => window.location.href = '/Inventory'} />
        <StatCard icon={Search} label="Active Requirements" value={requirements.length} onClick={() => window.location.href = '/Inventory'} />
        <StatCard icon={TrendingUp} label="New Matches Today" value={newMatchesToday} onClick={() => window.location.href = '/Matches'} />
        <StatCard icon={MessageSquare} label="Messages Pending" value={pendingMessages} onClick={() => window.location.href = '/Messages'} />
      </div>

      {/* Quick Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '48px' 
      }}>
        <Card 
          onClick={() => setShowCreateModal(true)}
          style={{ 
            background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}05 100%)`, 
            border: `1px solid ${ACCENT}40`,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 40px ${ACCENT}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <CardContent style={{ padding: '32px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '14px', 
              background: ACCENT, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Plus style={{ width: '28px', height: '28px', color: '#111827' }} />
            </div>
            <h3 style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: '20px', 
              fontWeight: 500, 
              color: 'white', 
              margin: '0 0 8px' 
            }}>
              Post Listing
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              List a property and start matching
            </p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setShowCreateModal(true)}
          style={{ 
            background: `linear-gradient(135deg, ${ACCENT}15 0%, ${ACCENT}05 100%)`, 
            border: `1px solid ${ACCENT}40`,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 12px 40px ${ACCENT}20`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <CardContent style={{ padding: '32px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '14px', 
              background: ACCENT, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Search style={{ width: '28px', height: '28px', color: '#111827' }} />
            </div>
            <h3 style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif", 
              fontSize: '20px', 
              fontWeight: 500, 
              color: 'white', 
              margin: '0 0 8px' 
            }}>
              Post Requirement
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Share what your client needs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: '24px', 
            fontWeight: 500, 
            color: 'white', 
            margin: 0 
          }}>
            Recent Activity
          </h2>
          <button 
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: ACCENT,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            View All <ArrowRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentActivity.map((activity, idx) => (
            <Card 
              key={idx}
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <CardContent style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '10px', 
                  background: activity.type === 'listing' ? `${ACCENT}15` : 'rgba(255,255,255,0.06)',
                  border: activity.type === 'listing' ? `1px solid ${ACCENT}30` : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {activity.type === 'listing' ? 
                    <Building2 style={{ width: '20px', height: '20px', color: ACCENT }} /> :
                    <Search style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.7)' }} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontFamily: "'Inter', sans-serif", 
                    fontSize: '15px', 
                    fontWeight: 500, 
                    color: 'white', 
                    margin: '0 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {activity.data.title}
                  </p>
                  <p style={{ 
                    fontFamily: "'Inter', sans-serif", 
                    fontSize: '13px', 
                    color: 'rgba(255,255,255,0.5)', 
                    margin: 0 
                  }}>
                    {activity.type === 'listing' ? 'New Listing' : 'New Requirement'} • {activity.data.city || 'Location TBD'}
                  </p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  color: 'rgba(255,255,255,0.4)',
                  flexShrink: 0
                }}>
                  <Clock style={{ width: '14px', height: '14px' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px' }}>
                    {new Date(activity.time).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {recentActivity.length === 0 && (
            <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>
                  No recent activity. Start by posting a listing or requirement!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Refresh data
          }}
        />
      )}
    </div>
  );
}