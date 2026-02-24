import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building2, Search, Plus, Trash2, Loader2 } from 'lucide-react';
import DealPost from '../components/dashboard/DealPost';
import CreatePostModal from '../components/dashboard/CreatePostModal';

export default function MyPosts() {
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => base44.entities.Listing.list('-created_date')
  });

  const { data: requirements = [], isLoading: loadingRequirements } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date')
  });

  const allPosts = [
    ...listings.map(l => ({ ...l, postType: 'listing' })),
    ...requirements.map(r => ({ ...r, postType: 'requirement' }))
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Posts</h1>
          <p className="text-gray-500 mt-1">Manage your listings and requirements</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="text-white gap-2"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid grid-cols-3 bg-gray-100 w-full">
          <TabsTrigger value="all">All ({allPosts.length})</TabsTrigger>
          <TabsTrigger value="listings">
            <Building2 className="w-4 h-4 mr-1.5" />
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            <Search className="w-4 h-4 mr-1.5" />
            Requirements ({requirements.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f7f5' }}>
            <Plus className="w-8 h-8" style={{ color: 'var(--tiffany-blue)' }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No posts yet</h3>
          <p className="text-gray-400 mb-4 text-sm">Create your first listing or requirement to get started.</p>
          <Button onClick={() => setShowCreateModal(true)} className="text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
            Create a Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={`${post.postType}-${post.id}`} className="relative group">
              <DealPost post={post} />
              <button
                onClick={() => handleDelete(post)}
                disabled={deletingId === post.id}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white shadow border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
              >
                {deletingId === post.id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Trash2 className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
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
    </div>
  );
}