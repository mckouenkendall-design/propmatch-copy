import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Plus, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#00DBC5';

export default function Groups() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.list('-created_date'),
  });

  const GroupCard = ({ group }) => {
    const mockMembers = Math.floor(Math.random() * 150) + 20;

    return (
      <Card
        onClick={() => navigate(`/GroupDetail?id=${group.id}`)}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
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
        {/* Cover Photo */}
        <div style={{
          width: '100%',
          height: '140px',
          background: group.cover_image_url 
            ? `url(${group.cover_image_url})` 
            : 'linear-gradient(135deg, rgba(0,219,197,0.2) 0%, rgba(0,219,197,0.05) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {!group.cover_image_url && (
            <Users style={{ width: '48px', height: '48px', color: `${ACCENT}60` }} />
          )}
          
          {/* Group Type Badge */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            color: ACCENT,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {group.group_type || 'public'}
          </div>
        </div>

        <CardContent style={{ padding: '20px' }}>
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
            {group.name}
          </h3>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            margin: '0 0 16px',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {group.description || 'A professional networking group for real estate agents'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.6)'
              }}>
                {mockMembers} members
              </span>
            </div>
            
            {group.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  {group.location}
                </span>
              </div>
            )}
          </div>

          <div style={{
            display: 'inline-block',
            padding: '6px 12px',
            background: `${ACCENT}15`,
            border: `1px solid ${ACCENT}30`,
            borderRadius: '6px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: ACCENT
          }}>
            {group.focus_category || 'General'}
          </div>
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
            Professional Groups
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Connect, share deals, and network with agents
          </p>
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
          Create Group
        </button>
      </div>

      {/* Featured/Your Groups */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '24px',
          fontWeight: 500,
          color: 'white',
          margin: '0 0 20px'
        }}>
          Your Groups
        </h2>
        
        {groups.length === 0 ? (
          <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <CardContent style={{ padding: '48px', textAlign: 'center' }}>
              <Users style={{ width: '56px', height: '56px', color: `${ACCENT}40`, margin: '0 auto 20px' }} />
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                color: 'rgba(255,255,255,0.5)'
              }}>
                You haven't joined any groups yet. Browse below to find groups in your market.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {groups.slice(0, 3).map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* All Groups */}
      <div>
        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '24px',
          fontWeight: 500,
          color: 'white',
          margin: '0 0 20px'
        }}>
          Discover Groups
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}