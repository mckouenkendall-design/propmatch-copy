import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, MapPin, DollarSign, Maximize, Mail, Phone, User } from 'lucide-react';
import { format } from 'date-fns';

export default function DealPost({ post }) {
  const isListing = post.postType === 'listing';

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-xl"
              style={{ 
                backgroundColor: isListing ? 'var(--tiffany-blue)' : '#6366F1',
                opacity: 0.15 
              }}
            >
              {isListing ? (
                <Building2 className="w-5 h-5" style={{ color: 'var(--tiffany-blue)' }} />
              ) : (
                <Search className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <Badge 
                className="mb-2"
                style={{ 
                  backgroundColor: isListing ? 'var(--tiffany-blue)' : '#6366F1',
                  color: 'white'
                }}
              >
                {isListing ? 'Listing' : 'Requirement'}
              </Badge>
              <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Posted {format(new Date(post.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Property Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-start gap-2">
            <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-medium capitalize">{post.property_type}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="text-sm font-medium">
                {isListing ? `${post.city}, ${post.state}` : (post.cities?.join(', ') || 'Flexible')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-sm font-medium">
                {isListing ? `$${post.price?.toLocaleString()}` : `Up to $${post.max_price?.toLocaleString()}`}
              </p>
            </div>
          </div>

          {(post.size_sqft || post.min_size_sqft) && (
            <div className="flex items-start gap-2">
              <Maximize className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-medium">
                  {isListing ? `${post.size_sqft?.toLocaleString()} sqft` : `${post.min_size_sqft?.toLocaleString()}+ sqft`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {(post.description || post.notes) && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-gray-700">{post.description || post.notes}</p>
          </div>
        )}

        {/* Contact Info */}
        {isListing && (post.contact_agent_name || post.contact_agent_email || post.contact_agent_phone) && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Contact Agent</p>
            <div className="space-y-1">
              {post.contact_agent_name && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-3 h-3" />
                  {post.contact_agent_name}
                </div>
              )}
              {post.contact_agent_email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-3 h-3" />
                  {post.contact_agent_email}
                </div>
              )}
              {post.contact_agent_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-3 h-3" />
                  {post.contact_agent_phone}
                </div>
              )}
            </div>
          </div>
        )}

        {!isListing && post.client_name && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Client</p>
            <p className="text-sm font-medium text-gray-700">{post.client_name}</p>
          </div>
        )}

        {/* Transaction Type Badge */}
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">
            {post.transaction_type}
          </Badge>
          {post.status && (
            <Badge variant="outline" className="capitalize">
              {post.status}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}