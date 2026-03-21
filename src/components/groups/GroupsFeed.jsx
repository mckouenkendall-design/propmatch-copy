import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Rss, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GroupsFeed({ myGroupIds = [] }) {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['groups-feed', myGroupIds.join(',')],
    queryFn: async () => {
      if (myGroupIds.length === 0) return [];
      // Fetch posts from all joined groups
      const allPosts = await Promise.all(
        myGroupIds.map(gid =>
          base44.entities.GroupPost.filter({ group_id: gid }, '-created_date', 20)
        )
      );
      return allPosts.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: myGroupIds.length > 0,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: () => base44.entities.Group.filter({ status: 'active' }, '-created_date'),
  });

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g]));

  if (myGroupIds.length === 0) {
    return (
      <div className="text-center py-20">
        <Rss className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-1">Your feed is empty</h3>
        <p className="text-sm text-gray-400">Join some groups to see their posts here.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-4 border-gray-200 border-t-teal-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <Rss className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-1">Nothing posted yet</h3>
        <p className="text-sm text-gray-400">Be the first to post in one of your fish tanks!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Your Feed</h2>
      {posts.map(post => {
        const group = groupMap[post.group_id];
        return (
          <div key={post.id} className="bg-white rounded-xl shadow-sm p-5">
            {/* Group label */}
            {group && (
              <Link
                to={`/GroupDetail?id=${post.group_id}`}
                className="flex items-center gap-2 mb-3 text-xs font-semibold hover:underline"
                style={{ color: 'var(--tiffany-blue)' }}
              >
                {group.cover_image_url ? (
                  <img src={group.cover_image_url} alt={group.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e6f7f5' }}>
                    <Users className="w-3 h-3" style={{ color: 'var(--tiffany-blue)' }} />
                  </div>
                )}
                {group.name}
              </Link>
            )}

            {/* Author & date */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--tiffany-blue)' }}>
                {(post.author_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{post.author_name || 'Unknown'}</p>
                <p className="text-xs text-gray-400">{new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 whitespace-pre-line">{post.content}</p>

            {/* Poll */}
            {post.post_type === 'poll' && post.poll_question && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">{post.poll_question}</p>
                {(() => {
                  const options = (() => { try { return JSON.parse(post.poll_options || '[]'); } catch { return []; } })();
                  return options.map((opt, i) => (
                    <div key={i} className="py-1.5 px-3 bg-white border border-gray-200 rounded-md text-sm text-gray-600 mb-1">{opt}</div>
                  ));
                })()}
              </div>
            )}

            {/* Media */}
            {post.media_urls?.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_urls.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full rounded-lg object-cover max-h-48" />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}