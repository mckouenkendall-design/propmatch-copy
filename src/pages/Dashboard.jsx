import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Search, Plus } from 'lucide-react';
import DealPost from '../components/dashboard/DealPost';
import CreatePostModal from '../components/dashboard/CreatePostModal';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date')
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date')
  });

  // Combine and sort by creation date
  const allPosts = [...listings.map(l => ({ ...l, postType: 'listing' })), 
                     ...requirements.map(r => ({ ...r, postType: 'requirement' }))]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const filteredPosts = filter === 'all' ? allPosts : 
                        filter === 'listings' ? allPosts.filter(p => p.postType === 'listing') :
                        allPosts.filter(p => p.postType === 'requirement');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dealboard</h1>
          <p className="text-gray-600 mt-2">Your real estate marketplace feed</p>
        </div>
      </div>

      {/* Create Post Card */}
      <Card 
        className="bg-white border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setShowCreateModal(true)}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--tiffany-blue)', opacity: 0.15 }}
            >
              <Plus className="w-6 h-6" style={{ color: 'var(--tiffany-blue)' }} />
            </div>
            <p className="text-gray-500 text-lg">Post a listing or requirement...</p>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All Posts
          </TabsTrigger>
          <TabsTrigger value="listings" className="data-[state=active]:bg-white">
            <Building2 className="w-4 h-4 mr-2" />
            Listings
          </TabsTrigger>
          <TabsTrigger value="requirements" className="data-[state=active]:bg-white">
            <Search className="w-4 h-4 mr-2" />
            Requirements
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <DealPost key={`${post.postType}-${post.id}`} post={post} />
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <p className="text-gray-500">No posts yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['listings'] });
            queryClient.invalidateQueries({ queryKey: ['requirements'] });
          }}
        />
      )}
    </div>
  );
}