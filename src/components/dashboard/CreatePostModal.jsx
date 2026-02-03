import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tantml:react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import ListingForm from '../listings/ListingForm';
import RequirementForm from '../requirements/RequirementForm';
import PostTypeModal from './PostTypeModal';
import PropertyCategoryModal from './PropertyCategoryModal';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('type'); // 'type', 'category', 'form'
  const [postType, setPostType] = useState(null);
  const [propertyCategory, setPropertyCategory] = useState(null);

  const createListingMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.create(data),
    onSuccess: onSuccess
  });

  const createRequirementMutation = useMutation({
    mutationFn: (data) => base44.entities.Requirement.create(data),
    onSuccess: onSuccess
  });

  const handleSelectType = (type) => {
    setPostType(type);
    setStep('category');
  };

  const handleSelectCategory = (category) => {
    setPropertyCategory(category);
    setStep('form');
  };

  const handleSubmit = (data) => {
    const dataWithCategory = {
      ...data,
      property_type: propertyCategory
    };
    
    if (postType === 'listing') {
      createListingMutation.mutate(dataWithCategory);
    } else {
      createRequirementMutation.mutate(dataWithCategory);
    }
  };

  const handleBack = () => {
    if (step === 'form') {
      setStep('category');
    } else if (step === 'category') {
      setStep('type');
      setPostType(null);
    }
  };

  if (step === 'type') {
    return <PostTypeModal onClose={onClose} onSelectType={handleSelectType} />;
  }

  if (step === 'category') {
    return <PropertyCategoryModal onClose={onClose} onSelectCategory={handleSelectCategory} postType={postType} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <Card className="bg-white border-0 shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Create {postType === 'listing' ? 'Listing' : 'Requirement'} - {propertyCategory}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {postType === 'listing' ? (
              <ListingForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                initialData={{ property_type: propertyCategory }}
              />
            ) : (
              <RequirementForm
                onSubmit={handleSubmit}
                onCancel={onClose}
                initialData={{ property_type: propertyCategory }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}