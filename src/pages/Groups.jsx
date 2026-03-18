import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Lock, Globe, MapPin, Rss, Compass, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import GroupsFeed from '@/components/groups/GroupsFeed';

const FOCUS_LABELS = {
  commercial: 'Commercial',
  residential: 'Residential',
  mixed: 'Mixed',
  general: 'General',
};

const NAV_ITEMS = [
  { key: 'feed', label: 'Your Feed', icon: Rss },
  { key: 'discover', label: 'Discover', icon: Compass },
  { key: 'your-groups', label: 'Your Groups', icon: LayoutGrid },
];

export default function Groups() {
  const [activeView, setActiveView] = useState('feed');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.filter({ status: 'active' }, '-created_date'),
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-memberships'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.GroupMember.filter({ user_email: user.email, status: 'active' });
    },
  });

  const memberGroupIds = new Set(myMemberships.map(m => m.group_id));

  const joinMutation = useMutation({
    mutationFn: async (group) => {
      const user = await base44.auth.me();
      return base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'member',
        status: group.group_type === 'private' ? 'pending' : 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const myGroups = groups.filter(g => memberGroupIds.has(g.id));
  const discoverGroups = groups.filter(g => !memberGroupIds.has(g.id));

  const filteredDiscover = discoverGroups.filter(g =>
    !search ||
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase()) ||
    g.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-4 gap-1 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 px-2 mb-2">Groups</h1>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveView('discover'); }}
            placeholder="Search groups..."
            className="pl-9 bg-gray-100 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Nav Items */}
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveView(key)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
            style={{
              backgroundColor: activeView === key ? '#e6f7f5' : 'transparent',
              color: activeView === key ? 'var(--tiffany-blue)' : '#374151',
            }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </button>
        ))}

        {/* Create Group Button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left mt-1"
          style={{ color: 'var(--tiffany-blue)' }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f7f5' }}>
            <Plus className="w-3.5 h-3.5" style={{ color: 'var(--tiffany-blue)' }} />
          </div>
          Create Group
        </button>

        <div className="border-t border-gray-100 mt-2 pt-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Groups You've Joined</p>
          <div className="flex flex-col gap-0.5">
            {myGroups.length === 0 && (
              <p className="text-xs text-gray-400 px-2">No groups yet</p>
            )}
            {myGroups.map(g => (
              <Link
                key={g.id}
                to={`/GroupDetail?id=${g.id}`}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-100 transition-all"
              >
                {g.cover_image_url ? (
                  <img src={g.cover_image_url} alt={g.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f7f5' }}>
                    <Users className="w-4 h-4" style={{ color: 'var(--tiffany-blue)' }} />
                  </div>
                )}
                <span className="text-sm text-gray-700 font-medium truncate">{g.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-4xl">
        {activeView === 'feed' && (
          <GroupsFeed myGroupIds={[...memberGroupIds]} />
        )}

        {activeView === 'discover' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Discover Groups</h2>
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading groups...</div>
            ) : filteredDiscover.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No groups found. Try a different search or create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredDiscover.map(group => (
                  <GroupCard key={group.id} group={group} isMember={false} onJoin={joinMutation.mutate} joinLoading={joinMutation.isPending} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'your-groups' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Your Groups</h2>
            {myGroups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">You haven't joined any groups yet.</p>
                <button onClick={() => setActiveView('discover')} className="text-sm mt-2 font-medium" style={{ color: 'var(--tiffany-blue)' }}>
                  Discover Groups →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {myGroups.map(group => (
                  <MyGroupCard key={group.id} group={group} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            queryClient.invalidateQueries({ queryKey: ['my-memberships'] });
          }}
        />
      )}
    </div>
  );
}

function MyGroupCard({ group }) {
  return (
    <Link to={`/GroupDetail?id=${group.id}`} className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="h-28 w-full overflow-hidden bg-gray-100">
        {group.cover_image_url ? (
          <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f5' }}>
            <Users className="w-8 h-8" style={{ color: 'var(--tiffany-blue)' }} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm truncate">{group.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Users className="w-3 h-3" /> {group.member_count || 0} members
        </p>
      </div>
    </Link>
  );
}

function GroupCard({ group, isMember, onJoin, joinLoading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
      {group.cover_image_url && (
        <div className="h-24 w-full overflow-hidden">
          <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-bold text-gray-900">{group.name}</h3>
              <Badge variant="outline" className="text-xs capitalize">{FOCUS_LABELS[group.focus_category] || 'General'}</Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                {group.group_type === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {group.group_type === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
            {group.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" /> {group.location}</p>
            )}
            {group.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Users className="w-3 h-3" /> {group.member_count || 0} members</p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-2 items-end">
            <Link to={`/GroupDetail?id=${group.id}`}>
              <Button size="sm" style={{ backgroundColor: 'var(--tiffany-blue)' }} className="text-white">View</Button>
            </Link>
            {!isMember && (
              <Button size="sm" variant="outline" onClick={() => onJoin(group)} disabled={joinLoading}
                style={{ borderColor: 'var(--tiffany-blue)', color: 'var(--tiffany-blue)' }}>
                {group.group_type === 'private' ? 'Request to Join' : 'Join'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}