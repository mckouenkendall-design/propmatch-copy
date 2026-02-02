import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import RequirementCard from '../components/requirements/RequirementCard';
import RequirementForm from '../components/requirements/RequirementForm';

export default function Requirements() {
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Requirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setShowForm(false);
      setEditingRequirement(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Requirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setShowForm(false);
      setEditingRequirement(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Requirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    }
  });

  const handleSubmit = (data) => {
    if (editingRequirement) {
      updateMutation.mutate({ id: editingRequirement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (requirement) => {
    setEditingRequirement(requirement);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Requirements</h1>
          <p className="text-gray-600 mt-2">Client needs you're representing</p>
        </div>
        <Button
          onClick={() => {
            setEditingRequirement(null);
            setShowForm(!showForm);
          }}
          className="text-white shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Requirement
        </Button>
      </div>

      {showForm && (
        <RequirementForm
          requirement={editingRequirement}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingRequirement(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements.map((requirement) => (
          <RequirementCard
            key={requirement.id}
            requirement={requirement}
            onEdit={handleEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      {requirements.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No requirements yet. Add your first client need!</p>
        </div>
      )}
    </div>
  );
}