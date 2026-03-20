import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import GroupsFeed from '@/components/groups/GroupsFeed';
import GroupsDiscover from '@/components/groups/GroupsDiscover';
import YourGroupsGrid from '@/components/groups/YourGroupsGrid';
import CreateGroupModal from '@/components/groups/CreateGroupModal';

const ACCENT = '#00DBC5';

export default function Groups() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('feed');

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
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '22px',
            fontWeight: 500,
            color: 'white',
            margin: '0 0 20px'
          }}>
            Groups
          </h2>

          {/* Search Groups */}
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <SearchIcon style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              width: '16px', 
              height: '16px', 
              color: 'rgba(255,255,255,0.4)' 
            }} />
            <Input 
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '38px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px'
              }}
            />
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveView('feed')}
              style={{
                padding: '10px 14px',
                background: activeView === 'feed' ? `${ACCENT}15` : 'transparent',
                border: activeView === 'feed' ? `1px solid ${ACCENT}30` : 'none',
                borderRadius: '6px',
                textAlign: 'left',
                color: activeView === 'feed' ? ACCENT : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Your Feed
            </button>
            <button
              onClick={() => setActiveView('discover')}
              style={{
                padding: '10px 14px',
                background: activeView === 'discover' ? `${ACCENT}15` : 'transparent',
                border: activeView === 'discover' ? `1px solid ${ACCENT}30` : 'none',
                borderRadius: '6px',
                textAlign: 'left',
                color: activeView === 'discover' ? ACCENT : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveView('your-groups')}
              style={{
                padding: '10px 14px',
                background: activeView === 'your-groups' ? `${ACCENT}15` : 'transparent',
                border: activeView === 'your-groups' ? `1px solid ${ACCENT}30` : 'none',
                borderRadius: '6px',
                textAlign: 'left',
                color: activeView === 'your-groups' ? ACCENT : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              Your Groups
            </button>
          </div>

          {/* Create Group Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              width: '100%',
              padding: '12px',
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
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '28px'
            }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Create Group
          </button>

          {/* Groups You've Joined */}
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
              Groups You've Joined
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
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>
          {activeView === 'feed' && <GroupsFeed myGroupIds={myGroupIds} />}
          {activeView === 'discover' && <GroupsDiscover myGroupIds={myGroupIds} />}
          {activeView === 'your-groups' && <YourGroupsGrid groups={myGroups} />}
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