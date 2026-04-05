import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, Plus, Trash2, Loader2, FileText, Eye, Bookmark, Share2 } from 'lucide-react';
import DealPost from '../components/dashboard/DealPost';
import CreatePostModal from '../components/dashboard/CreatePostModal';

const ACCENT = '#00DBC5';

export default function MyPosts() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['my-listings', user?.email],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: requirements = [], isLoading: loadingRequirements } = useQuery({
    queryKey: ['my-requirements', user?.email],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const allPosts = [
    ...listings.map(l => ({ ...l, postType: 'listing' })),
    ...requirements.map(r => ({ ...r, postType: 'requirement' })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const filteredPosts = filter === 'all' ? allPosts
    : filter === 'listings' ? allPosts.filter(p => p.postType === 'listing')
    : allPosts.filter(p => p.postType === 'requirement');

  const handleDelete = async (post) => {
    if (!confirm('Delete this post?')) return;
    setDeletingId(post.id);
    try {
      if (post.postType === 'listing') {
        await base44.entities.Listing.delete(post.id);
        queryClient.invalidateQueries({ queryKey: ['my-listings'] });
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      } else {
        await base44.entities.Requirement.delete(post.id);
        queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
        queryClient.invalidateQueries({ queryKey: ['requirements'] });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const isLoading = loadingListings || loadingRequirements;

  const tabs = [
    { key: 'all',          label: 'All',          count: allPosts.length },
    { key: 'listings',     label: 'Listings',     count: listings.length,     icon: Building2 },
    { key: 'requirements', label: 'Requirements', count: requirements.length, icon: Search },
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
            My Posts
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Manage your active listings and requirements
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: ACCENT, border: 'none', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer', flexShrink: 0 }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          New Post
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(tab => {
          const isActive = filter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px',
                background: isActive ? ACCENT : 'rgba(255,255,255,0.06)',
                border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
                fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                color: isActive ? '#111827' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {Icon && <Icon style={{ width: '14px', height: '14px' }} />}
              {tab.label}
              <span style={{
                padding: '1px 7px', borderRadius: '99px', fontSize: '11px',
                background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
                color: isActive ? '#111827' : 'rgba(255,255,255,0.5)',
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 style={{ width: '32px', height: '32px', color: ACCENT, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileText style={{ width: '28px', height: '28px', color: ACCENT }} />
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 400, color: 'white', margin: '0 0 8px' }}>
            No posts yet
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px' }}>
            Create your first listing or requirement to start getting matched.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '10px 24px', background: ACCENT, border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}
          >
            Create a Post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredPosts.map(post => {
            const isOwner = post.created_by === user?.email;
            const views  = post.view_count  || 0;
            const saves  = post.save_count  || 0;
            const shares = post.share_count || 0;
            return (
              <div key={`${post.postType}-${post.id}`} style={{ position: 'relative' }}
                onMouseEnter={e => { const btn = e.currentTarget.querySelector('[data-delete]'); if (btn) btn.style.opacity = '1'; }}
                onMouseLeave={e => { const btn = e.currentTarget.querySelector('[data-delete]'); if (btn) btn.style.opacity = '0'; }}
              >
                <DealPost post={post} />
                {/* Engagement stats bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '8px 18px 10px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 12px 12px', marginTop: '-4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Eye style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }}/>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: views > 0 ? 600 : 400 }}>{views.toLocaleString()} {views === 1 ? 'view' : 'views'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Bookmark style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }}/>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: saves > 0 ? 600 : 400 }}>{saves.toLocaleString()} {saves === 1 ? 'save' : 'saves'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Share2 style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }}/>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: shares > 0 ? 600 : 400 }}>{shares.toLocaleString()} {shares === 1 ? 'share' : 'shares'}</span>
                  </div>
                </div>
                {/* Delete button — only shown for posts you own */}
                {isOwner && (
                  <button
                    data-delete
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                    style={{
                      position: 'absolute', top: '14px', right: '14px',
                      padding: '7px', background: 'rgba(14,19,24,0.9)', backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                      cursor: deletingId === post.id ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'all 0.15s', color: 'rgba(255,255,255,0.5)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  >
                    {deletingId === post.id
                      ? <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} />
                      : <Trash2 style={{ width: '15px', height: '15px' }} />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            queryClient.invalidateQueries({ queryKey: ['requirements'] });
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}