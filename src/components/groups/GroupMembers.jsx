import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, UserCheck, UserX } from 'lucide-react';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Crown, color: '#f59e0b' },
  moderator: { label: 'Moderator', icon: Shield, color: '#6366f1' },
  member: { label: 'Member', icon: UserCheck, color: '#4FB3A9' },
};

export default function GroupMembers({ groupId, currentUserRole }) {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
  });

  const approveMutation = useMutation({
    mutationFn: (memberId) => base44.entities.GroupMember.update(memberId, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => base44.entities.GroupMember.delete(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  const isAdmin = currentUserRole === 'admin';

  if (isLoading) return <div className="text-center py-8 text-gray-400">Loading members...</div>;

  return (
    <div className="space-y-6">
      {pendingMembers.length > 0 && isAdmin && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending Requests ({pendingMembers.length})
          </h3>
          <div className="space-y-2">
            {pendingMembers.map(member => (
              <div key={member.id} className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: '#f59e0b' }}>
                    {member.user_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{member.user_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{member.user_email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(member.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                    style={{ backgroundColor: 'var(--tiffany-blue)' }}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(member.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <UserX className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Members ({activeMembers.length})
        </h3>
        <div className="space-y-2">
          {activeMembers.map(member => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: 'var(--tiffany-blue)' }}>
                    {member.user_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{member.user_name || 'Member'}</p>
                    <p className="text-xs text-gray-500">{member.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: roleConfig.color }}>
                    <RoleIcon className="w-3.5 h-3.5" /> {roleConfig.label}
                  </span>
                  {isAdmin && member.role !== 'admin' && (
                    <button
                      onClick={() => removeMutation.mutate(member.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5 text-gray-300 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}