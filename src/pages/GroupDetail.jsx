import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Lock, Globe, MessageSquare, Building2, Calendar, UserCheck, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import GroupDiscussion from '../components/groups/GroupDiscussion';
import GroupListingsRequirements from '../components/groups/GroupListingsRequirements';
import GroupEvents from '../components/groups/GroupEvents';
import GroupMembers from '../components/groups/GroupMembers';
import GroupAbout from '../components/groups/GroupAbout';

const TABS = [
  { key: 'discussion', label: 'Discussion', icon: MessageSquare },
  { key: 'listings', label: 'Listings / Requirements', icon: Building2 },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'about', label: 'About', icon: Settings },
];

export default function GroupDetail() {
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('id');
  const [activeTab, setActiveTab] = useState('discussion');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => base44.entities.Group.filter({ id: groupId }).then(r => r[0]),
    enabled: !!groupId,
  });

  const { data: membership } = useQuery({
    queryKey: ['my-membership', groupId, currentUser?.email],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, user_email: currentUser.email })
      .then(r => r[0] || null),
    enabled: !!groupId && !!currentUser,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId, status: 'active' }),
    enabled: !!groupId,
  });

  const memberEmails = allMembers.map(m => m.user_email);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const newMembership = await base44.entities.GroupMember.create({
        group_id: groupId,
        user_email: currentUser.email,
        user_name: currentUser.full_name,
        role: 'member',
        status: group?.group_type === 'private' ? 'pending' : 'active',
      });
      if (group?.group_type !== 'private') {
        await base44.entities.Group.update(groupId, { member_count: (group?.member_count || 0) + 1 });
      }
      return newMembership;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-membership', groupId, currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.GroupMember.delete(membership.id);
      await base44.entities.Group.update(groupId, { member_count: Math.max(0, (group?.member_count || 1) - 1) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-membership', groupId, currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  if (!groupId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No group specified.</p>
        <Link to="/Groups" className="text-sm" style={{ color: 'var(--tiffany-blue)' }}>← Back to Groups</Link>
      </div>
    );
  }

  if (loadingGroup) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found.</p>
        <Link to="/Groups" className="text-sm" style={{ color: 'var(--tiffany-blue)' }}>← Back to Groups</Link>
      </div>
    );
  }

  const isMember = membership?.status === 'active';
  const isPending = membership?.status === 'pending';
  const currentUserRole = membership?.role || 'none';

  return (
    <div className="max-w-4xl mx-auto space-y-0">
      {/* Cover Image */}
      {group.cover_image_url && (
        <div className="h-40 w-full rounded-xl overflow-hidden mb-4">
          <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Group Header */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link to="/Groups" className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--tiffany-blue)' }}>
              <ArrowLeft className="w-3 h-3" /> All Groups
            </Link>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                {group.group_type === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {group.group_type === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {allMembers.length} members</span>
              {group.location && <span>· {group.location}</span>}
            </div>
          </div>

          {/* Join / Leave / Pending */}
          <div className="flex-shrink-0">
            {!membership && (
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="text-white"
                style={{ backgroundColor: 'var(--tiffany-blue)' }}
              >
                {group.group_type === 'private' ? 'Request to Join' : 'Join Group'}
              </Button>
            )}
            {isPending && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                <UserCheck className="w-3 h-3 mr-1" /> Pending Approval
              </Badge>
            )}
            {isMember && currentUserRole !== 'admin' && (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Private group gate */}
      {group.group_type === 'private' && !isMember ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-1">This is a Private Group</h3>
          <p className="text-sm text-gray-400">
            {isPending ? 'Your request to join is pending approval.' : 'Request to join to view the content.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
            <div className="flex overflow-x-auto">
              {TABS.map((tab, i) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex-shrink-0"
                    style={{
                      borderBottomColor: isActive ? 'var(--tiffany-blue)' : 'transparent',
                      color: isActive ? 'var(--tiffany-blue)' : '#9ca3af',
                      backgroundColor: 'white',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'discussion' && (
              <GroupDiscussion groupId={groupId} currentUser={currentUser} />
            )}
            {activeTab === 'listings' && (
              <GroupListingsRequirements
                groupId={groupId}
                memberEmails={memberEmails}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'events' && (
              <GroupEvents groupId={groupId} currentUser={currentUser} />
            )}
            {activeTab === 'members' && (
              <GroupMembers groupId={groupId} currentUserRole={currentUserRole} />
            )}
            {activeTab === 'about' && (
              <GroupAbout group={group} memberCount={allMembers.length} />
            )}
          </div>
        </>
      )}
    </div>
  );
}