import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import GroupsFeed from '@/components/groups/GroupsFeed';
import CreateGroupModal from '@/components/groups/CreateGroupModal';

const ACCENT = '#00DBC5';

export default function Groups() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-memberships', currentUser?.email],
    queryFn: () => base44.entities.GroupMember.filter({ 
      user_email: currentUser.email, 
      status: 'active' 
    }),
    enabled: !!currentUser,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => base44.entities.Group.filter({ status: 'active' }, '-created_date'),
  });

  const myGroupIds = myMemberships.map(m => m.group_id);
  const myGroups = allGroups.filter(g => myGroupIds.includes(g.id));
  const otherGroups = allGroups.filter(g => !myGroupIds.includes(g.id));

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#0E1318' }}>
      {/* Left Sidebar */}
      <div style={{
        width: '320px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.02)',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '22px',
              fontWeight: 500,
              color: 'white',
              margin: 0
            }}>
              Groups
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: ACCENT,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus style={{ width: '18px', height: '18px', color: '#111827' }} />
            </button>
          </div>

          {/* My Groups Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 12px',
              fontWeight: 600
            }}>
              My Groups
            </h3>
            {myGroups.length === 0 ? (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic'
              }}>
                No groups joined yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myGroups.map(group => (
                  <a
                    key={group.id}
                    href={`/GroupDetail?id=${group.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: group.cover_image_url ? `url(${group.cover_image_url})` : `linear-gradient(135deg, ${ACCENT}30 0%, ${ACCENT}10 100%)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'white',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {group.name}
                      </p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.4)',
                        margin: 0
                      }}>
                        {group.member_count || 0} members
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Discover Groups Section */}
          <div>
            <h3 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'rgba(255,255,255,0.4)',
              margin: '0 0 12px',
              fontWeight: 600
            }}>
              Discover
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {otherGroups.slice(0, 8).map(group => (
                <a
                  key={group.id}
                  href={`/GroupDetail?id=${group.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: group.cover_image_url ? `url(${group.cover_image_url})` : 'rgba(255,255,255,0.05)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'white',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.name}
                    </p>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.4)',
                      margin: 0
                    }}>
                      {group.member_count || 0} members
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 32px' }}>
          <GroupsFeed myGroupIds={myGroupIds} />
        </div>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}