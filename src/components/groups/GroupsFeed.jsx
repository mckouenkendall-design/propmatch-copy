import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Rss, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GroupsFeed({ myGroupIds = [] }) {
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['groups-feed', myGroupIds.join(',')],
    queryFn: async () => {
      if (myGroupIds.length === 0) return [];
      const allPosts = await Promise.all(
        myGroupIds.map(gid =>
          base44.entities.GroupPost.filter({ group_id: gid }, '-created_date', 20)
        )
      );
      return allPosts.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: myGroupIds.length > 0,
  });

  // Real-time updates
  useEffect(() => {
    const unsub = base44.entities.GroupPost.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['groups-feed'] });
    });
    return unsub;
  }, [queryClient]);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.filter({ status: 'active' }, '-created_date'),
  });

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));

  if (myGroupIds.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Rss style={{ width: '56px', height: '56px', color: 'rgba(255,255,255,0.15)', margin: '0 auto 16px', display: 'block' }} />
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>Your feed is empty</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Join some groups to see their posts here.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--tiffany-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Rss style={{ width: '56px', height: '56px', color: 'rgba(255,255,255,0.15)', margin: '0 auto 16px', display: 'block' }} />
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>Nothing posted yet</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>Be the first to post in one of your fish tanks!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>Your Feed</h2>
      {posts.map(post => {
        const group = groupMap[post.group_id];
        return (
          <div key={post.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            {/* Group label */}
            {group && (
              <Link
                to={`/GroupDetail?id=${post.group_id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textDecoration: 'none', color: 'var(--tiffany-blue)', fontSize: '12px', fontWeight: 600 }}
              >
                {group.cover_image_url ? (
                  <img src={group.cover_image_url} alt={group.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,219,197,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users style={{ width: '12px', height: '12px', color: 'var(--tiffany-blue)' }} />
                  </div>
                )}
                {group.name}
              </Link>
            )}

            {/* Author & date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--tiffany-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                {(post.author_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{post.author_name || 'Unknown'}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Content */}
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{post.content}</p>

            {/* Poll */}
            {post.post_type === 'poll' && post.poll_question && (
              <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>{post.poll_question}</p>
                {(() => {
                  const options = (() => { try { return JSON.parse(post.poll_options || '[]'); } catch { return []; } })();
                  return options.map((opt, i) => (
                    <div key={i} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>{opt}</div>
                  ));
                })()}
              </div>
            )}

            {/* Media */}
            {post.media_urls?.length > 0 && (
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {post.media_urls.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '192px' }} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}