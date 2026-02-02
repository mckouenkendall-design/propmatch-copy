import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import FilterBar from '@/components/dealboard/FilterBar';
import DealPost from '@/components/dashboard/DealPost';
import CreatePostModal from '@/components/dashboard/CreatePostModal';

export default function Dealboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    city: '',
    state: '',
    sort: 'newest'
  });

  const queryClient = useQueryClient();

  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date', 100),
  });

  const { data: requirements = [], isLoading: loadingRequirements } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 100),
  });

  const handlePostCreated = () => {
    setShowCreateModal(false);
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    queryClient.invalidateQueries({ queryKey: ['requirements'] });
  };

  // Combine and filter posts
  const allPosts = [
    ...listings.map(l => ({ ...l, type: 'listing' })),
    ...requirements.map(r => ({ ...r, type: 'requirement' }))
  ];

  let filteredPosts = allPosts;

  // Apply filters
  if (filters.type !== 'all') {
    filteredPosts = filteredPosts.filter(post => post.type === filters.type);
  }

  if (filters.category !== 'all') {
    filteredPosts = filteredPosts.filter(post => post.property_type === filters.category);
  }

  if (filters.city) {
    filteredPosts = filteredPosts.filter(post => {
      const city = post.city || (post.cities && post.cities[0]) || '';
      return city.toLowerCase().includes(filters.city.toLowerCase());
    });
  }

  if (filters.state) {
    filteredPosts = filteredPosts.filter(post => {
      const state = post.state || '';
      return state.toLowerCase().includes(filters.state.toLowerCase());
    });
  }

  if (searchQuery) {
    filteredPosts = filteredPosts.filter(post => {
      const searchText = `${post.title} ${post.description || ''} ${post.notes || ''}`.toLowerCase();
      return searchText.includes(searchQuery.toLowerCase());
    });
  }

  // Sort posts
  filteredPosts.sort((a, b) => {
    if (filters.sort === 'newest') {
      return new Date(b.created_date) - new Date(a.created_date);
    } else if (filters.sort === 'oldest') {
      return new Date(a.created_date) - new Date(b.created_date);
    } else if (filters.sort === 'price-high') {
      return (b.price || b.max_price || 0) - (a.price || a.max_price || 0);
    } else if (filters.sort === 'price-low') {
      return (a.price || a.max_price || 0) - (b.price || b.max_price || 0);
    }
    return 0;
  });

  return (
    <div>
        <FilterBar
          onCreatePost={() => setShowCreateModal(true)}
          onSearch={setSearchQuery}
          onFilterChange={setFilters}
        />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loadingListings || loadingRequirements ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No posts found. Click the Post button to create one!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <DealPost key={`${post.type}-${post.id}`} post={post} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handlePostCreated}
        />
      )}
    </div>
  );
}