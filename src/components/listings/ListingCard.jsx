import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Maximize, Edit, Trash2 } from 'lucide-react';

export default function ListingCard({ listing, onEdit, onDelete }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold text-gray-900">{listing.title}</CardTitle>
          <Badge className={statusColors[listing.status]}>
            {listing.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{listing.city}, {listing.state}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4" />
          <span className="text-sm capitalize">{listing.property_type} • {listing.transaction_type}</span>
        </div>

        {listing.size_sqft && (
          <div className="flex items-center gap-2 text-gray-600">
            <Maximize className="w-4 h-4" />
            <span className="text-sm">{listing.size_sqft?.toLocaleString()} sqft</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <p className="text-2xl font-bold" style={{ color: 'var(--tiffany-blue)' }}>
            ${listing.price?.toLocaleString()}
          </p>
        </div>

        {listing.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(listing)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(listing.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}