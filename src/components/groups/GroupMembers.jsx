import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, Shield, UserCheck, UserX } from 'lucide-react';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Crown, color: '#f59e0b' },
  moderator: { label: 'Moderator', icon: Shield, color: '#6366f1' },
  member: { label: 'Member', icon: UserCheck, color: '#4FB3A9' },
};

const ACCENT = '#00DBC5';

function Avatar({ profile, displayName, size = 36 }) {
  const photo = profile?.profile_photo_url;
  const initial = (displayName || '?')[0]?.toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: ACCENT, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#111827', fontSize: Math.round(size * 0.39), fontWeight: 700,
    }}>
      {photo
        ? <img src={photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial}
    </div>
  );
}

export default function GroupMembers({ groupId, currentUserRole }) {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: groupId }),
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));

  const getDisplayName = (member) => {
    const profile = profileMap[member.user_email];
    return profile?.full_name || member.user_name || member.user_email || 'Member';
  };

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupMember.update(id, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-members', groupId] }),
  });

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');
  const isAdmin = currentUserRole === 'admin';

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>Loading members...</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {pendingMembers.length > 0 && isAdmin && (
        <div>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
            Pending Requests ({pendingMembers.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingMembers.map(member => {
              const displayName = getDisplayName(member);
              return (
                <div key={member.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar profile={profileMap[member.user_email]} displayName={displayName} />
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{displayName}</p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{member.user_email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => approveMutation.mutate(member.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#111827', background: ACCENT, border: 'none', cursor: 'pointer' }}>
                      <UserCheck style={{ width: '14px', height: '14px' }} /> Approve
                    </button>
                    <button onClick={() => removeMutation.mutate(member.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer' }}>
                      <UserX style={{ width: '14px', height: '14px' }} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>
          Members ({activeMembers.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activeMembers.map(member => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
            const RoleIcon = roleConfig.icon;
            const displayName = getDisplayName(member);
            return (
              <div key={member.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar profile={profileMap[member.user_email]} displayName={displayName} />
                  <div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{displayName}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{member.user_email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: roleConfig.color }}>
                    <RoleIcon style={{ width: '14px', height: '14px' }} /> {roleConfig.label}
                  </span>
                  {isAdmin && member.role !== 'admin' && (
                    <button onClick={() => removeMutation.mutate(member.id)} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <UserX style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.3)' }} />
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