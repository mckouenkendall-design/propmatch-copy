import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save } from 'lucide-react';

export default function ListingForm({ listing, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(listing || {
    title: '',
    property_type: 'residential',
    transaction_type: 'sale',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    size_sqft: '',
    bedrooms: '',
    bathrooms: '',
    description: '',
    status: 'active',
    contact_agent_name: '',
    contact_agent_email: '',
    contact_agent_phone: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.price) submitData.price = parseFloat(submitData.price);
    if (submitData.size_sqft) submitData.size_sqft = parseFloat(submitData.size_sqft);
    if (submitData.bedrooms) submitData.bedrooms = parseFloat(submitData.bedrooms);
    if (submitData.bathrooms) submitData.bathrooms = parseFloat(submitData.bathrooms);
    onSubmit(submitData);
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="border-b">
        <CardTitle>{listing ? 'Edit Listing' : 'New Listing'}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Title / Property Name</Label>
              <Input
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Beautiful 3BR Home in Downtown"
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
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              <Input
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
              />
            </div>

            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="500000"
              />
            </div>

            <div className="space-y-2">
              <Label>Size (sqft)</Label>
              <Input
                type="number"
                value={formData.size_sqft}
                onChange={(e) => setFormData({ ...formData, size_sqft: e.target.value })}
                placeholder="2000"
              />
            </div>

            {formData.property_type === 'residential' && (
              <>
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    placeholder="3"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    placeholder="2"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the property..."
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-gray-700 font-semibold">Contact Information</Label>
            </div>

            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                value={formData.contact_agent_name}
                onChange={(e) => setFormData({ ...formData, contact_agent_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label>Agent Email</Label>
              <Input
                type="email"
                value={formData.contact_agent_email}
                onChange={(e) => setFormData({ ...formData, contact_agent_email: e.target.value })}
                placeholder="john@realestate.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Agent Phone</Label>
              <Input
                value={formData.contact_agent_phone}
                onChange={(e) => setFormData({ ...formData, contact_agent_phone: e.target.value })}
                placeholder="(555) 123-4567"
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
              {listing ? 'Update' : 'Create'} Listing
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}