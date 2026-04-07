import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  // Use useAuth() so we get the merged UserProfile data — not raw Supabase auth
  const { user: currentUser } = useAuth();
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutRules, setAboutRules] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => supabase.from('groups').select('*').eq('id', groupId).then(r => r[0]),
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
    queryFn: () => supabase.from('group_members').select('*').eq('group_id', groupId).eq('user_email', currentUser?.email)
      .then(r => r[0] || null),
    enabled: !!groupId && !!currentUser?.email,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: () => supabase.from('group_members').select('*').eq('group_id', groupId).eq('status', 'active'),
    enabled: !!groupId,
  });

  const memberEmails = allMembers.map(m => m.user_email);

  const updateGroupMutation = useMutation({
    mutationFn: (data) => supabase.from('groups').update(data).eq('id', groupId).select(),
    onSuccess: () => {
      queryClient.invalidateQueries(['group', groupId]);
      toast({ title: 'Fish tank updated successfully' });
      setEditingAbout(false);
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const isPrivate = group?.group_type === 'private';
      const newMembership = await supabase.from('group_members').insert({
        group_id: groupId,
        user_email: currentUser?.email,
        user_name: currentUser?.full_name || currentUser?.email,
        role: 'member',
        status: isPrivate ? 'pending' : 'active',
      }).select();
      if (!isPrivate) {
        await supabase.from('groups').update({ member_count: (group?.member_count || 0) + 1 }).eq('id', groupId).select();
      } else {
        // Notify admins of join request
        const admins = await supabase.from('group_members').select('*').eq('group_id', groupId).eq('role', 'admin');
        await Promise.all(admins.map(admin =>
          supabase.from('notifications').insert({
            user_email: admin.user_email,
            type: 'announcement',
            title: `${currentUser?.full_name || 'Someone'} wants to join ${group?.name || 'your Fish Tank'}`,
            body: 'Go to Members to approve or decline.',
            link: '/Groups',
            read: false,
          }).select().catch(() => {})
        ));
      }
      return newMembership;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-membership', groupId, currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  // Accept an invite:
  // - Public group: immediately active
  // - Private group: stays pending, needs admin approval (same as clicking Join on private)
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (group?.group_type === 'private') {
        // Already pending — just leave it, notify admins
        // Find admins and notify them
        const allMembers = await supabase.from('group_members').select('*').eq('group_id', groupId).eq('role', 'admin');
        await Promise.all(allMembers.map(admin =>
          supabase.from('notifications').insert({
            user_email: admin.user_email,
            type: 'announcement',
            title: `${currentUser?.full_name || 'Someone'} wants to join ${group?.name || 'your Fish Tank'}`,
            body: 'Go to Members to approve or decline.',
            link: '/Groups',
            read: false,
          }).select().catch(() => {})
        ));
      } else {
        // Public: set active immediately
        await supabase.from('group_members').update({ status: 'active' }).eq('id', membership.id).select();
        await supabase.from('groups').update({ member_count: (group?.member_count || 0) + 1 }).eq('id', groupId).select();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-membership', groupId, currentUser?.email] });
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from('group_members').delete().eq('id', membership.id);
      await supabase.from('groups').update({ member_count: Math.max(0, (group?.member_count || 1) - 1) }).eq('id', groupId).select();
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
      {group.cover_image_url && (
        <div style={{ height: '200px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
          <img src={group.cover_image_url} alt={group.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

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
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                <Button onClick={() => acceptInviteMutation.mutate()} disabled={acceptInviteMutation.isPending}
                  style={{ background: ACCENT, color: '#111827', display:'flex', alignItems:'center', gap:'6px' }}>
                  <UserCheck style={{ width:'14px', height:'14px' }}/> {group?.group_type === 'private' ? 'Request to Join' : 'Accept Invite'}
                </Button>
                <button onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}
                  style={{ padding:'8px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>
                  Decline
                </button>
              </div>
            )}
            {isMember && !isAdmin && (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '14px', color: 'rgba(255,255,255,0.5)',
                  background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s',
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

      {group.group_type === 'private' && !isMember ? (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '80px 40px', textAlign: 'center' }}>
          <Lock style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 500, color: 'white', marginBottom: '8px' }}>This is a Private Fish Tank</h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            {isPending ? (group?.group_type === 'private' ? 'Your request is pending admin approval.' : 'You have a pending invite — accept above to join.') : 'Request to join to view the content.'}
          </p>
        </div>
      ) : (
        <>
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
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '16px 20px', fontSize: '14px', fontWeight: 500,
                      fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      borderBottom: `2px solid ${isActive ? ACCENT : 'transparent'}`,
                      color: isActive ? ACCENT : 'rgba(255,255,255,0.6)',
                      background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: '16px', height: '16px' }} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {activeTab === 'discussion' && (
              <GroupDiscussion groupId={groupId} currentUser={currentUser} />
            )}
            {activeTab === 'listings' && (
              <GroupListingsRequirements groupId={groupId} memberEmails={memberEmails} currentUser={currentUser} />
            )}
            {activeTab === 'events' && (
              <GroupEvents groupId={groupId} currentUser={currentUser} />
            )}
            {activeTab === 'members' && (
              <GroupMembers groupId={groupId} groupName={group?.name} groupType={group?.group_type} currentUserRole={currentUserRole} currentUser={currentUser} />
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
                      {editingAbout ? <><Save style={{ width: '14px', height: '14px' }} /> Save</> : <><Edit2 style={{ width: '14px', height: '14px' }} /> Edit</>}
                    </Button>
                  )}
                  {editingAbout && (
                    <Button
                      onClick={() => { setEditingAbout(false); setAboutDescription(group.description || ''); setAboutRules(group.rules || ''); }}
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
                      <Textarea value={aboutDescription} onChange={e => setAboutDescription(e.target.value)} rows={4} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Rules</label>
                      <Textarea value={aboutRules} onChange={e => setAboutRules(e.target.value)} rows={4} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
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

      {showAddAdminModal && (
        <AddAdminModal groupId={groupId} onClose={() => setShowAddAdminModal(false)} />
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
      const existing = await supabase.from('group_members').select('*').eq('group_id', groupId).eq('user_email', email);
      if (existing.length > 0) {
        await supabase.from('group_members').update({ role: 'admin' }).eq('id', existing[0].id).select();
      } else {
        await supabase.from('group_members').insert({
          group_id: groupId,
          user_email: email,
          user_name: email,
          role: 'admin',
          status: 'active',
        }).select();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['group-members', groupId]);
      toast({ title: 'Admin added successfully' });
      onClose();
    },
  });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', maxWidth: '500px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>Add Admin</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Email Address</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '20px' }} />
          <Button onClick={() => addAdminMutation.mutate()} disabled={!email || addAdminMutation.isPending} style={{ background: ACCENT, color: '#111827', width: '100%' }}>
            {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
          </Button>
        </div>
      </div>
    </div>
  );
}