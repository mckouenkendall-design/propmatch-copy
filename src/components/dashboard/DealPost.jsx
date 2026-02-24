import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, MapPin, DollarSign, Maximize, Mail, Phone, User, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const TIMELINE_LABELS = {
  asap: 'ASAP',
  flexible: 'Flexible',
  '1_3_months': '1–3 Months',
  '3_6_months': '3–6 Months',
  '6_9_months': '6–9 Months',
  '9_plus_months': '9+ Months',
};

const PERIOD_LABELS = {
  total: '',
  per_month: '/mo',
  per_sf_per_year: '/SF/yr',
  annually: '/yr',
};

const LEASE_TYPE_LABELS = {
  nnn: 'NNN',
  modified_gross: 'Modified Gross',
  full_service_gross: 'Full Service Gross',
  gross: 'Gross',
  plus_utilities: '+ Utilities',
};

export default function DealPost({ post }) {
  const isListing = post.postType === 'listing';
  const typeLabel = post.property_type?.replace(/_/g, ' ');
  const categoryLabel = post.property_category;

  const priceDisplay = () => {
    if (isListing) {
      if (!post.price) return null;
      return `$${Number(post.price).toLocaleString()}${PERIOD_LABELS[post.price_period] || ''}`;
    } else {
      const min = post.min_price ? `$${Number(post.min_price).toLocaleString()}` : null;
      const max = post.max_price ? `$${Number(post.max_price).toLocaleString()}` : null;
      if (min && max) return `${min} – ${max}${PERIOD_LABELS[post.price_period] || ''}`;
      if (max) return `Up to ${max}${PERIOD_LABELS[post.price_period] || ''}`;
      return null;
    }
  };

  const sizeDisplay = () => {
    if (isListing && post.size_sqft) return `${Number(post.size_sqft).toLocaleString()} SF`;
    if (!isListing && (post.min_size_sqft || post.max_size_sqft)) {
      const min = post.min_size_sqft ? Number(post.min_size_sqft).toLocaleString() : '0';
      const max = post.max_size_sqft ? Number(post.max_size_sqft).toLocaleString() : '∞';
      return `${min} – ${max} SF`;
    }
    return null;
  };

  const locationDisplay = () => {
    if (isListing) return [post.city, post.state].filter(Boolean).join(', ') || null;
    return post.cities?.length ? post.cities.join(', ') : null;
  };

  const price = priceDisplay();
  const size = sizeDisplay();
  const location = locationDisplay();

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon */}
            <div
              className="p-2.5 rounded-xl flex-shrink-0 mt-0.5"
              style={{ backgroundColor: isListing ? '#e6f7f5' : '#ede9fe' }}
            >
              {isListing
                ? <Building2 className="w-5 h-5" style={{ color: 'var(--tiffany-blue)' }} />
                : <Search className="w-5 h-5 text-indigo-500" />
              }
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <Badge
                  className="text-white text-xs"
                  style={{ backgroundColor: isListing ? 'var(--tiffany-blue)' : '#6366F1' }}
                >
                  {isListing ? 'Listing' : 'Requirement'}
                </Badge>
                {categoryLabel && (
                  <Badge variant="outline" className="text-xs capitalize">{categoryLabel}</Badge>
                )}
                {typeLabel && (
                  <Badge variant="outline" className="text-xs capitalize">{typeLabel}</Badge>
                )}
                {post.transaction_type && (
                  <Badge variant="outline" className="text-xs capitalize">{post.transaction_type}</Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{post.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Posted {format(new Date(post.created_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Price - top right */}
          {price && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold" style={{ color: isListing ? 'var(--tiffany-blue)' : '#6366F1' }}>
                {price}
              </p>
              {post.price_period && post.price_period !== 'total' && (
                <p className="text-xs text-gray-400">{PERIOD_LABELS[post.price_period]}</p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Key Details Row */}
        <div className="flex flex-wrap gap-4 text-sm">
          {location && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span>{location}</span>
            </div>
          )}
          {size && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Maximize className="w-3.5 h-3.5 text-gray-400" />
              <span>{size}</span>
            </div>
          )}
          {!isListing && post.timeline && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{TIMELINE_LABELS[post.timeline] || post.timeline}</span>
            </div>
          )}
        </div>

        {/* Description / Notes */}
        {(post.description || post.notes) && (
          <p className="text-sm text-gray-600 border-t border-gray-100 pt-3 line-clamp-2">
            {post.description || post.notes}
          </p>
        )}

        {/* Amenities */}
        {(post.amenities?.length > 0 || post.required_amenities?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
            {(post.amenities || post.required_amenities || []).slice(0, 5).map(a => (
              <span key={a} className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
                {a}
              </span>
            ))}
            {(post.amenities || post.required_amenities || []).length > 5 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                +{(post.amenities || post.required_amenities || []).length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Contact / Client */}
        {isListing && (post.contact_agent_name || post.contact_agent_email || post.contact_agent_phone) && (
          <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-3">
            {post.contact_agent_name && (
              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                <User className="w-3 h-3" /> {post.contact_agent_name}
              </span>
            )}
            {post.contact_agent_email && (
              <a href={`mailto:${post.contact_agent_email}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:underline">
                <Mail className="w-3 h-3" /> {post.contact_agent_email}
              </a>
            )}
            {post.contact_agent_phone && (
              <a href={`tel:${post.contact_agent_phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:underline">
                <Phone className="w-3 h-3" /> {post.contact_agent_phone}
              </a>
            )}
          </div>
        )}

        {!isListing && post.client_name && (
          <div className="border-t border-gray-100 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <User className="w-3 h-3" /> Client: <span className="font-medium">{post.client_name}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}