import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Lock, Globe, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreateGroupModal from '../components/groups/CreateGroupModal';

const FOCUS_LABELS = {
  commercial: 'Commercial',
  residential: 'Residential',
  mixed: 'Mixed',
  general: 'General',
};

export default function Groups() {
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

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase()) ||
    g.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">Connect with real estate professionals in your market</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="text-white gap-2"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-4 h-4" /> Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search groups by name, description, or location..."
          className="pl-10"
        />
      </div>

      {/* My Groups */}
      {myMemberships.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Groups</h2>
          <div className="grid grid-cols-1 gap-3">
            {filtered.filter(g => memberGroupIds.has(g.id)).map(group => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={true}
                memberGroupIds={memberGroupIds}
                onJoin={joinMutation.mutate}
                joinLoading={joinMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discover Groups */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {myMemberships.length > 0 ? 'Discover Groups' : 'All Groups'}
        </h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading groups...</div>
        ) : filtered.filter(g => !memberGroupIds.has(g.id)).length === 0 && filtered.filter(g => memberGroupIds.has(g.id)).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No groups found. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.filter(g => !memberGroupIds.has(g.id)).map(group => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={false}
                memberGroupIds={memberGroupIds}
                onJoin={joinMutation.mutate}
                joinLoading={joinMutation.isPending}
              />
            ))}
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

function GroupCard({ group, isMember, onJoin, joinLoading }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
      {group.cover_image_url && (
        <div className="h-24 w-full overflow-hidden">
          <img src={group.cover_image_url} alt={group.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
              <Badge variant="outline" className="text-xs capitalize">
                {FOCUS_LABELS[group.focus_category] || 'General'}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                {group.group_type === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {group.group_type === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
            {group.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> {group.location}
              </p>
            )}
            {group.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Users className="w-3 h-3" /> {group.member_count || 0} members
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-2 items-end">
            <Link to={`/GroupDetail?id=${group.id}`}>
              <Button size="sm" style={{ backgroundColor: 'var(--tiffany-blue)' }} className="text-white">
                View
              </Button>
            </Link>
            {!isMember && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onJoin(group)}
                disabled={joinLoading}
                style={{ borderColor: 'var(--tiffany-blue)', color: 'var(--tiffany-blue)' }}
              >
                {group.group_type === 'private' ? 'Request to Join' : 'Join'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}