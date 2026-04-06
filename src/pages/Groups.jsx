import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import GroupsFeed from '@/components/groups/GroupsFeed';
import GroupsDiscover from '@/components/groups/GroupsDiscover';
import YourGroupsGrid from '@/components/groups/YourGroupsGrid';
import CreateGroupModal from '@/components/groups/CreateGroupModal';

const ACCENT = '#00DBC5';

export default function Groups() {
  // Use useAuth() so we get the merged UserProfile data — not raw Supabase auth
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('feed');
  const queryClient = useQueryClient();

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-memberships', user?.email],
    queryFn: () => supabase.from('group_members').select('*').eq('user_email', user.email).eq('status', 'active'),
    enabled: !!user,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: () => supabase.from('groups').select('*').eq('status', 'active').order('created_at', { ascending: false }),
  });

  const myGroupIds = myMemberships.map(m => m.group_id);
  const myGroups = allGroups.filter(g => myGroupIds.includes(g.id));

  const q = searchQuery.toLowerCase().trim();
  const filteredAllGroups = q
    ? allGroups.filter(g => g.name?.toLowerCase().includes(q) || g.location?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q))
    : allGroups;
  const filteredMyGroups = q ? myGroups.filter(g => g.name?.toLowerCase().includes(q) || g.location?.toLowerCase().includes(q)) : myGroups;

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
            Fish Tanks
          </h2>

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
              placeholder="Search fish tanks..."
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
            {['feed', 'discover', 'your-groups'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                style={{
                  padding: '10px 14px',
                  background: activeView === view ? `${ACCENT}15` : 'transparent',
                  border: activeView === view ? `1px solid ${ACCENT}30` : 'none',
                  borderRadius: '6px',
                  textAlign: 'left',
                  color: activeView === view ? ACCENT : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                {view === 'feed' ? 'Your Feed' : view === 'discover' ? 'Discover' : 'Your Fish Tanks'}
              </button>
            ))}
          </div>

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
            Create Fish Tank
          </button>

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
              Fish Tanks You've Joined
            </h3>
            {filteredMyGroups.length === 0 ? (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic'
              }}>
                No fish tanks joined yet
              </p>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMyGroups.map(group => (
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
          {activeView === 'feed' && !q && <GroupsFeed myGroupIds={myGroupIds} />}
          {(activeView === 'discover' || (q && activeView === 'feed')) && <GroupsDiscover myGroupIds={myGroupIds} groups={filteredAllGroups} />}
          {activeView === 'your-groups' && <YourGroupsGrid groups={filteredMyGroups} isFishTanks={true} />}
        </div>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['all-groups'] });
            queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}