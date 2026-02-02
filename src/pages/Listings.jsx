import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ListingCard from '../components/listings/ListingCard';
import ListingForm from '../components/listings/ListingForm';

export default function Listings() {
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setShowForm(false);
      setEditingListing(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Listing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setShowForm(false);
      setEditingListing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    }
  });

  const handleSubmit = (data) => {
    if (editingListing) {
      updateMutation.mutate({ id: editingListing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-600 mt-2">Properties you're marketing</p>
        </div>
        <Button
          onClick={() => {
            setEditingListing(null);
            setShowForm(!showForm);
          }}
          className="text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Listing
        </Button>
      </div>

      {showForm && (
        <ListingForm
          listing={editingListing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingListing(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      {listings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No listings yet. Add your first property!</p>
        </div>
      )}
    </div>
  );
}