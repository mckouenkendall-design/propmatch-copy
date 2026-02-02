import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';

export default function RequirementForm({ requirement, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(requirement || {
    title: '',
    property_type: 'residential',
    transaction_type: 'sale',
    cities: [],
    max_price: '',
    min_price: '',
    min_size_sqft: '',
    max_size_sqft: '',
    min_bedrooms: '',
    min_bathrooms: '',
    notes: '',
    client_name: '',
    status: 'active'
  });

  const [citiesInput, setCitiesInput] = useState(
    requirement?.cities?.join(', ') || ''
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    submitData.cities = citiesInput.split(',').map(c => c.trim()).filter(Boolean);
    if (submitData.max_price) submitData.max_price = parseFloat(submitData.max_price);
    if (submitData.min_price) submitData.min_price = parseFloat(submitData.min_price);
    if (submitData.min_size_sqft) submitData.min_size_sqft = parseFloat(submitData.min_size_sqft);
    if (submitData.max_size_sqft) submitData.max_size_sqft = parseFloat(submitData.max_size_sqft);
    if (submitData.min_bedrooms) submitData.min_bedrooms = parseFloat(submitData.min_bedrooms);
    if (submitData.min_bathrooms) submitData.min_bathrooms = parseFloat(submitData.min_bathrooms);
    onSubmit(submitData);
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>{requirement ? 'Edit Requirement' : 'New Requirement'}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Title / Client Description</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Tech Startup Looking for Office Space"
              />
            </div>

            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={formData.property_type}
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Preferred Cities (comma-separated)</Label>
              <Input
                value={citiesInput}
                onChange={(e) => setCitiesInput(e.target.value)}
                placeholder="San Francisco, Oakland, Berkeley"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Budget ($)</Label>
              <Input
                required
                type="number"
                value={formData.max_price}
                onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                placeholder="750000"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Budget ($)</Label>
              <Input
                type="number"
                value={formData.min_price}
                onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                placeholder="400000"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Size (sqft)</Label>
              <Input
                type="number"
                value={formData.min_size_sqft}
                onChange={(e) => setFormData({ ...formData, min_size_sqft: e.target.value })}
                placeholder="1500"
              />
            </div>

            <div className="space-y-2">
              <Label>Maximum Size (sqft)</Label>
              <Input
                type="number"
                value={formData.max_size_sqft}
                onChange={(e) => setFormData({ ...formData, max_size_sqft: e.target.value })}
                placeholder="3000"
              />
            </div>

            {formData.property_type === 'residential' && (
              <>
                <div className="space-y-2">
                  <Label>Minimum Bedrooms</Label>
                  <Input
                    type="number"
                    value={formData.min_bedrooms}
                    onChange={(e) => setFormData({ ...formData, min_bedrooms: e.target.value })}
                    placeholder="3"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Minimum Bathrooms</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.min_bathrooms}
                    onChange={(e) => setFormData({ ...formData, min_bathrooms: e.target.value })}
                    placeholder="2"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Client Name</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements or preferences..."
                rows={4}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button variant="outline" onClick={onCancel} type="button">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-white"
              style={{ backgroundColor: 'var(--tiffany-blue)' }}
            >
              <Save className="w-4 h-4 mr-2" />
              {requirement ? 'Update' : 'Create'} Requirement
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}