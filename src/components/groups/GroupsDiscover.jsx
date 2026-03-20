import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ACCENT = '#00DBC5';

export default function GroupsDiscover({ myGroupIds = [] }) {
  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.Group.filter({ status: 'active' }, '-created_date'),
  });

  const suggestedGroups = allGroups.filter(g => !myGroupIds.includes(g.id));

  if (suggestedGroups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Users style={{ width: '56px', height: '56px', color: `${ACCENT}40`, margin: '0 auto 16px' }} />
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          color: 'rgba(255,255,255,0.4)'
        }}>
          No groups to discover right now
        </p>
      </div>
    );
  }

  return (
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
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px'
      }}>
        {suggestedGroups.map(group => (
          <Card
            key={group.id}
            onClick={() => window.location.href = `/GroupDetail?id=${group.id}`}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            <div style={{
              width: '100%',
              height: '120px',
              background: group.cover_image_url 
                ? `url(${group.cover_image_url})` 
                : `linear-gradient(135deg, ${ACCENT}20 0%, ${ACCENT}05 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <CardContent style={{ padding: '16px' }}>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '16px',
                fontWeight: 500,
                color: 'white',
                margin: '0 0 8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {group.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    {group.member_count || 0}
                  </span>
                </div>
                {group.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.5)' }} />
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.location}
                    </span>
                  </div>
                )}
              </div>
              <div style={{
                padding: '4px 10px',
                background: `${ACCENT}15`,
                border: `1px solid ${ACCENT}30`,
                borderRadius: '6px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                color: ACCENT,
                display: 'inline-block'
              }}>
                {group.focus_category || 'General'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}