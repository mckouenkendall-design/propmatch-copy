import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';

export default function RequirementCard({ requirement, onEdit, onDelete }) {
  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    matched: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold text-gray-900">{requirement.title}</CardTitle>
          <Badge className={statusColors[requirement.status]}>
            {requirement.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Search className="w-4 h-4" />
          <span className="text-sm capitalize">{requirement.property_type} • {requirement.transaction_type}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {requirement.cities?.join(', ') || 'Any location'}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-xl font-bold text-indigo-600">
                ${requirement.max_price?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {requirement.min_size_sqft && (
          <p className="text-sm text-gray-600">Min {requirement.min_size_sqft?.toLocaleString()} sqft</p>
        )}

        {requirement.client_name && (
          <p className="text-sm text-gray-600">Client: {requirement.client_name}</p>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(requirement)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(requirement.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}