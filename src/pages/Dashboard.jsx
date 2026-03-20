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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '36px', fontWeight: 300, color: 'white', margin: '0 0 8px' }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Your command center for all active deals
        </p>
      </div>

      {/* Create Post Card */}
      <Card 
        style={{ 
          background: 'rgba(255,255,255,0.04)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onClick={() => setShowCreateModal(true)}
      >
        <CardContent style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: 'rgba(0,219,197,0.1)', 
              border: '1px solid rgba(0,219,197,0.3)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Plus style={{ width: '24px', height: '24px', color: '#00DBC5' }} />
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>
              Post a listing or requirement...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} style={{ width: '100%' }}>
        <TabsList style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <TabsTrigger value="all" style={{ color: 'rgba(255,255,255,0.6)' }}>
            All Posts
          </TabsTrigger>
          <TabsTrigger value="listings" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Building2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Listings
          </TabsTrigger>
          <TabsTrigger value="requirements" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Search style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Requirements
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredPosts.map((post) => (
          <DealPost key={`${post.postType}-${post.id}`} post={post} />
        ))}

        {filteredPosts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '64px 24px', 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px' 
          }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>
              No posts yet. Create your first one!
            </p>
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