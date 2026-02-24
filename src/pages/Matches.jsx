import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, Mail, Phone, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Matches() {
  const [sortBy, setSortBy] = useState('compatibility');

  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list()
  });

  const calculateCompatibility = (listing, requirement) => {
    let score = 0;
    let maxScore = 0;

    // Property type match (required)
    maxScore += 30;
    if (listing.property_type === requirement.property_type) score += 30;

    // Transaction type match (required)
    maxScore += 30;
    if (listing.transaction_type === requirement.transaction_type) score += 30;

    // City match
    maxScore += 20;
    if (requirement.cities && requirement.cities.includes(listing.city)) score += 20;

    // Price match
    maxScore += 10;
    if (listing.price <= (requirement.max_price || Infinity) && 
        listing.price >= (requirement.min_price || 0)) {
      score += 10;
    }

    // Size match
    maxScore += 10;
    if (listing.size_sqft >= (requirement.min_size_sqft || 0) &&
        listing.size_sqft <= (requirement.max_size_sqft || Infinity)) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  };

  const matches = useMemo(() => {
    const allMatches = [];
    const activeListings = listings.filter(l => l.status === 'active');
    const activeRequirements = requirements.filter(r => r.status === 'active');

    activeRequirements.forEach(req => {
      activeListings.forEach(listing => {
        const compatibility = calculateCompatibility(listing, req);
        if (compatibility >= 60) {
          allMatches.push({
            id: `${listing.id}-${req.id}`,
            listing,
            requirement: req,
            compatibility
          });
        }
      });
    });

    // Sort matches
    if (sortBy === 'compatibility') {
      return allMatches.sort((a, b) => b.compatibility - a.compatibility);
    } else if (sortBy === 'price') {
      return allMatches.sort((a, b) => b.listing.price - a.listing.price);
    }
    return allMatches;
  }, [listings, requirements, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600 mt-2">Smart matches between listings and requirements</p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compatibility">Sort by Compatibility</SelectItem>
            <SelectItem value="price">Sort by Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.id} className="bg-white border-0 shadow-md hover:shadow-xl transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--tiffany-blue)', opacity: 0.1 }}>
                    <Sparkles className="w-6 h-6" style={{ color: 'var(--tiffany-blue)' }} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Match Found</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {match.listing.property_type} • {match.listing.transaction_type}
                    </p>
                  </div>
                </div>
                <Badge
                  className="text-white text-lg px-4 py-2"
                  style={{ backgroundColor: 'var(--tiffany-blue)' }}
                >
                  {match.compatibility}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Listing Side */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Building2 className="w-4 h-4" style={{ color: 'var(--tiffany-blue)' }} />
                    Listing
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="font-bold text-lg text-gray-900">{match.listing.title}</p>
                    <p className="text-gray-600">{match.listing.city}, {match.listing.state}</p>
                    <p className="font-semibold text-xl" style={{ color: 'var(--tiffany-blue)' }}>
                      ${match.listing.price?.toLocaleString()}
                    </p>
                    {match.listing.size_sqft && (
                      <p className="text-sm text-gray-600">{match.listing.size_sqft?.toLocaleString()} sqft</p>
                    )}
                    {match.listing.contact_agent_name && (
                      <div className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                        <p className="text-sm font-medium text-gray-700">{match.listing.contact_agent_name}</p>
                        {match.listing.contact_agent_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {match.listing.contact_agent_email}
                          </div>
                        )}
                        {match.listing.contact_agent_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            {match.listing.contact_agent_phone}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirement Side */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Search className="w-4 h-4 text-indigo-600" />
                    Requirement
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="font-bold text-lg text-gray-900">{match.requirement.title}</p>
                    <p className="text-gray-600">
                      {match.requirement.cities?.join(', ') || 'Any location'}
                    </p>
                    <p className="font-semibold text-xl text-indigo-600">
                      Up to ${match.requirement.max_price?.toLocaleString()}
                    </p>
                    {match.requirement.min_size_sqft && (
                      <p className="text-sm text-gray-600">
                        Min {match.requirement.min_size_sqft?.toLocaleString()} sqft
                      </p>
                    )}
                    {match.requirement.client_name && (
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700">
                          Client: {match.requirement.client_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {matches.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No matches found yet. Add more listings and requirements!</p>
          </div>
        )}
      </div>
    </div>
  );
}