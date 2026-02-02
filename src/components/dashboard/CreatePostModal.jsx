import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import ListingForm from '../listings/ListingForm';
import RequirementForm from '../requirements/RequirementForm';

export default function CreatePostModal({ onClose, onSuccess }) {
  const [postType, setPostType] = useState('listing');

  const createListingMutation = useMutation({
    mutationFn: (data) => base44.entities.Listing.create(data),
    onSuccess: onSuccess
  });

  const createRequirementMutation = useMutation({
    mutationFn: (data) => base44.entities.Requirement.create(data),
    onSuccess: onSuccess
  });

  const handleSubmit = (data) => {
    if (postType === 'listing') {
      createListingMutation.mutate(data);
    } else {
      createRequirementMutation.mutate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8">
        <Card className="bg-white border-0 shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Create New Post</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={postType} onValueChange={setPostType}>
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="listing">Listing</TabsTrigger>
                <TabsTrigger value="requirement">Requirement</TabsTrigger>
              </TabsList>

              <TabsContent value="listing">
                <ListingForm
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                />
              </TabsContent>

              <TabsContent value="requirement">
                <RequirementForm
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}