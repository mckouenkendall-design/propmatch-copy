import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, MapPin, DollarSign, Maximize, Mail, Phone, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

const TIMELINE_LABELS = {
  asap: 'ASAP', flexible: 'Flexible', '1_3_months': '1–3 Months',
  '3_6_months': '3–6 Months', '6_9_months': '6–9 Months', '9_plus_months': '9+ Months',
};

const LEASE_TYPE_LABELS = {
  nnn: 'NNN', modified_gross: 'Modified Gross', full_service_gross: 'Full Service Gross',
  gross: 'Gross', plus_utilities: '+ Utilities',
};

function formatPrice(post, isListing) {
  const fmt = (n) => {
    const num = parseFloat(n);
    if (isNaN(num) || !n) return null;
    return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  const unit = () => {
    if (isListing) {
      if (post.transaction_type === 'lease' || post.transaction_type === 'sublease') return '/SF/yr';
      if (post.transaction_type === 'rent') return '/mo';
      return '';
    }
    if (post.price_period === 'per_month') return '/mo';
    if (post.price_period === 'per_sf_per_year') return '/SF/yr';
    if (post.price_period === 'annually') return '/yr';
    if (post.transaction_type === 'lease' || post.transaction_type === 'rent') return '/mo';
    return '';
  };
  const u = unit();
  if (isListing) {
    if (!post.price) return null;
    return `$${fmt(post.price)}${u}`;
  } else {
    const lo = fmt(post.min_price), hi = fmt(post.max_price);
    if (lo && hi) return `$${lo}–$${hi}${u}`;
    if (hi) return `Up to $${hi}${u}`;
    if (lo) return `From $${lo}${u}`;
    return null;
  }
}

export default function DealPost({ post, onClick }) {
  const isListing = post.postType === 'listing';
  const typeLabel = post.property_type?.replace(/_/g, ' ');
  const categoryLabel = post.property_category;

  const price = formatPrice(post, isListing);

  const sizeDisplay = () => {
    if (isListing && post.size_sqft) return `${Number(post.size_sqft).toLocaleString()} SF`;
    if (!isListing && (post.min_size_sqft || post.max_size_sqft)) {
      const min = post.min_size_sqft ? Number(post.min_size_sqft).toLocaleString() : '0';
      const max = post.max_size_sqft ? Number(post.max_size_sqft).toLocaleString() : '∞';
      return `${min}–${max} SF`;
    }
    return null;
  };

  const locationDisplay = () => {
    if (isListing) return [post.city, post.state].filter(Boolean).join(', ') || null;
    return post.cities?.length ? post.cities.join(', ') : null;
  };

  const size = sizeDisplay();
  const location = locationDisplay();

  return (
    <Card
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl flex-shrink-0 mt-0.5"
              style={{ backgroundColor: isListing ? 'rgba(0,219,197,0.15)' : 'rgba(99,102,241,0.15)' }}>
              {isListing
                ? <Building2 className="w-5 h-5" style={{ color: 'var(--tiffany-blue)' }} />
                : <Search className="w-5 h-5 text-indigo-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                <Badge className="text-white text-xs"
                  style={{ backgroundColor: isListing ? 'var(--tiffany-blue)' : '#6366F1' }}>
                  {isListing ? 'Listing' : 'Requirement'}
                </Badge>
                {categoryLabel && <Badge variant="outline" className="text-xs capitalize">{categoryLabel}</Badge>}
                {typeLabel && <Badge variant="outline" className="text-xs capitalize">{typeLabel}</Badge>}
                {post.transaction_type && <Badge variant="outline" className="text-xs capitalize">{post.transaction_type}</Badge>}
                {post.lease_type && <Badge variant="outline" className="text-xs">{LEASE_TYPE_LABELS[post.lease_type] || post.lease_type}</Badge>}
              </div>
              <h3 className="text-lg font-bold leading-tight" style={{ color: 'white' }}>{post.title}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Posted {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
          </div>

          {price && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold" style={{ color: isListing ? 'var(--tiffany-blue)' : '#818cf8' }}>
                {price}
              </p>
              {isListing && post.transaction_type === 'lease' && post.size_sqft && post.price && (
                <div className="text-xs mt-0.5 space-y-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <p>${(post.price * post.size_sqft / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}/mo</p>
                  <p>${(post.price * post.size_sqft).toLocaleString('en-US', { maximumFractionDigits: 0 })}/yr</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-4 text-sm">
          {location && (
            <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <MapPin className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span>{location}</span>
            </div>
          )}
          {size && (
            <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Maximize className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span>{size}</span>
            </div>
          )}
          {!isListing && post.timeline && (
            <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <span>{TIMELINE_LABELS[post.timeline] || post.timeline}</span>
            </div>
          )}
        </div>

        {(post.description || post.notes) && (
          <p className="text-sm line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            {post.description || post.notes}
          </p>
        )}

        {(post.amenities?.length > 0 || post.required_amenities?.length > 0) && (
          <div className="flex flex-wrap gap-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            {(post.amenities || post.required_amenities || []).slice(0, 5).map(a => (
              <span key={a} className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(0,219,197,0.1)', color: 'var(--tiffany-blue)' }}>{a}</span>
            ))}
            {(post.amenities || post.required_amenities || []).length > 5 && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                +{(post.amenities || post.required_amenities || []).length - 5} more
              </span>
            )}
          </div>
        )}

        {isListing && (post.contact_agent_name || post.contact_agent_email || post.contact_agent_phone) && (
          <div className="flex flex-wrap gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            {post.contact_agent_name && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <User className="w-3 h-3" /> {post.contact_agent_name}
              </span>
            )}
            {post.contact_agent_email && (
              <a href={`mailto:${post.contact_agent_email}`}
                className="flex items-center gap-1.5 text-xs hover:underline"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onClick={e => e.stopPropagation()}>
                <Mail className="w-3 h-3" /> {post.contact_agent_email}
              </a>
            )}
            {post.contact_agent_phone && (
              <a href={`tel:${post.contact_agent_phone}`}
                className="flex items-center gap-1.5 text-xs hover:underline"
                style={{ color: 'rgba(255,255,255,0.6)' }}
                onClick={e => e.stopPropagation()}>
                <Phone className="w-3 h-3" /> {post.contact_agent_phone}
              </a>
            )}
          </div>
        )}

        {!isListing && post.client_name && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <User className="w-3 h-3" /> Client: <span className="font-medium">{post.client_name}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}