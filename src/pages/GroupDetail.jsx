import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, Lock, Globe, MessageSquare, Building2, Calendar, UserCheck, Settings, LogOut, UserPlus, Edit2, Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import GroupDiscussion from '../components/groups/GroupDiscussion';
import GroupListingsRequirements from '../components/groups/GroupListingsRequirements';
import GroupEvents from '../components/groups/GroupEvents';
import GroupMembers from '../components/groups/GroupMembers';
import GroupAbout from '../components/groups/GroupAbout';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

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
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutRules, setAboutRules] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => base44.entities.Group.filter({ id: groupId }).then(r => r[0]),
    enabled: !!groupId,
  });

  useEffect(() => {
    if (group) {
      setAboutDescription(group.description || '');
      setAboutRules(group.rules || '');
    }
  }, [group]);

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

  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.Group.update(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', groupId]);
      toast({ title: 'Fish tank updated successfully' });
      setEditingAbout(false);
    },
  });

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

  const handleSaveAbout = () => {
    updateGroupMutation.mutate({
      description: aboutDescription,
      rules: aboutRules,
    });
  };

  if (!groupId) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.5)' }}>
        <p>No fish tank specified.</p>
        <Link to="/Groups" style={{ color: ACCENT, fontSize: '14px' }}>← Back to Fish Tanks</Link>
      </div>
    );
  }

  if (loadingGroup) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px' }}>
        <div style={{ width: '32px', height: '32px', border: '4px solid rgba(255,255,255,0.1)', borderTop: `4px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.5)' }}>
        <p>Fish tank not found.</p>
        <Link to="/Groups" style={{ color: ACCENT, fontSize: '14px' }}>← Back to Fish Tanks</Link>
      </div>
    );
  }

  const isMember = membership?.status === 'active';
  const isPending = membership?.status === 'pending';
  const currentUserRole = membership?.role || 'none';
  const isAdmin = currentUserRole === 'admin';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', minHeight: 'calc(100vh - 64px)' }}>
      {/* Cover Image */}
      {group.cover_image_url && (
        <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <img src={group.cover_image_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Group Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link to="/Groups" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: ACCENT, marginBottom: '12px', textDecoration: 'none' }}>
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> All Fish Tanks
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 500, color: 'white', margin: 0 }}>{group.name}</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {group.group_type === 'private' ? <Lock style={{ width: '14px', height: '14px' }} /> : <Globe style={{ width: '14px', height: '14px' }} />}
                {group.group_type === 'private' ? 'Private' : 'Public'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users style={{ width: '16px', height: '16px' }} /> {allMembers.length} members</span>
              {group.location && <span>· {group.location}</span>}
            </div>
          </div>

          {/* Join / Leave / Admin Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {isAdmin && (
              <Button
                onClick={() => setShowAddAdminModal(true)}
                variant="outline"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', gap: '6px' }}
              >
                <UserPlus style={{ width: '14px', height: '14px' }} />
                Add Admin
              </Button>
            )}
            {!membership && (
              <Button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                style={{ background: ACCENT, color: '#111827' }}
              >
                {group.group_type === 'private' ? 'Request to Join' : 'Join Fish Tank'}
              </Button>
            )}
            {isPending && (
              <Badge style={{ background: 'rgba(251,191,36,0.15)', color: '#FBB936', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <UserCheck style={{ width: '14px', height: '14px' }} /> Pending Approval
              </Badge>
            )}
            {isMember && !isAdmin && (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.5)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <LogOut style={{ width: '14px', height: '14px' }} /> Leave
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Private group gate */}
      {group.group_type === 'private' && !isMember ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '80px 40px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 500, color: 'white', marginBottom: '8px' }}>This is a Private Fish Tank</h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            {isPending ? 'Your request to join is pending approval.' : 'Request to join to view the content.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '24px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', overflowX: 'auto' }}>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '16px 20px',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      borderBottom: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                      color: isActive ? ACCENT : 'rgba(255,255,255,0.6)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                    <span>{tab.label}</span>
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
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>About</h2>
                  {isAdmin && (
                    <Button
                      onClick={() => editingAbout ? handleSaveAbout() : setEditingAbout(true)}
                      disabled={updateGroupMutation.isPending}
                      style={{ background: editingAbout ? ACCENT : 'transparent', color: editingAbout ? '#111827' : 'rgba(255,255,255,0.7)', border: editingAbout ? 'none' : '1px solid rgba(255,255,255,0.2)', gap: '6px' }}
                    >
                      {editingAbout ? (
                        <><Save style={{ width: '14px', height: '14px' }} /> Save</>
                      ) : (
                        <><Edit2 style={{ width: '14px', height: '14px' }} /> Edit</>
                      )}
                    </Button>
                  )}
                  {editingAbout && (
                    <Button
                      onClick={() => {
                        setEditingAbout(false);
                        setAboutDescription(group.description || '');
                        setAboutRules(group.rules || '');
                      }}
                      variant="ghost"
                      style={{ color: 'rgba(255,255,255,0.5)', marginLeft: '8px' }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </Button>
                  )}
                </div>

                {editingAbout ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Description</label>
                      <Textarea
                        value={aboutDescription}
                        onChange={e => setAboutDescription(e.target.value)}
                        rows={4}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Rules</label>
                      <Textarea
                        value={aboutRules}
                        onChange={e => setAboutRules(e.target.value)}
                        rows={4}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                  </div>
                ) : (
                  <GroupAbout group={group} memberCount={allMembers.length} />
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <AddAdminModal
          groupId={groupId}
          onClose={() => setShowAddAdminModal(false)}
        />
      )}
    </div>
  );
}

function AddAdminModal({ groupId, onClose }) {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addAdminMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.GroupMember.filter({ group_id: groupId, user_email: email });
      if (existing.length > 0) {
        await base44.entities.GroupMember.update(existing[0].id, { role: 'admin' });
      } else {
        await base44.entities.GroupMember.create({
          group_id: groupId,
          user_email: email,
          user_name: email,
          role: 'admin',
          status: 'active',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['group-members', groupId]);
      toast({ title: 'Admin added successfully' });
      onClose();
    },
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1f25',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>
            Add Admin
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@example.com"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '20px' }}
          />
          <Button
            onClick={() => addAdminMutation.mutate()}
            disabled={!email || addAdminMutation.isPending}
            style={{ background: ACCENT, color: '#111827', width: '100%' }}
          >
            {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
          </Button>
        </div>
      </div>
    </div>
  );
}