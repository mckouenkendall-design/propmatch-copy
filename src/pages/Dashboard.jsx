import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Dashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ['listings'],
    queryFn: () => base44.entities.Listing.list()
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list()
  });

  const activeListings = listings.filter(l => l.status === 'active');
  const activeRequirements = requirements.filter(r => r.status === 'active');

  // Calculate match count
  const calculateMatches = () => {
    let matchCount = 0;
    activeRequirements.forEach(req => {
      activeListings.forEach(listing => {
        if (isMatch(listing, req)) {
          matchCount++;
        }
      });
    });
    return matchCount;
  };

  const isMatch = (listing, requirement) => {
    if (listing.property_type !== requirement.property_type) return false;
    if (listing.transaction_type !== requirement.transaction_type) return false;
    if (requirement.cities && requirement.cities.length > 0) {
      if (!requirement.cities.includes(listing.city)) return false;
    }
    if (requirement.max_price && listing.price > requirement.max_price) return false;
    if (requirement.min_price && listing.price < requirement.min_price) return false;
    if (requirement.min_size_sqft && listing.size_sqft < requirement.min_size_sqft) return false;
    if (requirement.max_size_sqft && listing.size_sqft > requirement.max_size_sqft) return false;
    return true;
  };

  const totalMatches = calculateMatches();

  const stats = [
    {
      title: 'Active Listings',
      value: activeListings.length,
      icon: Building2,
      color: 'var(--tiffany-blue)',
      link: 'Listings'
    },
    {
      title: 'Active Requirements',
      value: activeRequirements.length,
      icon: Search,
      color: '#6366F1',
      link: 'Requirements'
    },
    {
      title: 'Total Matches',
      value: totalMatches,
      icon: Sparkles,
      color: '#F59E0B',
      link: 'Matches'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your real estate matchmaking activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={createPageUrl(stat.link)}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" style={{ color: 'var(--tiffany-blue)' }} />
              Recent Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeListings.slice(0, 5).map((listing) => (
                <div key={listing.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{listing.title}</p>
                    <p className="text-sm text-gray-600">{listing.city}, {listing.state}</p>
                  </div>
                  <p className="font-semibold" style={{ color: 'var(--tiffany-blue)' }}>
                    ${listing.price?.toLocaleString()}
                  </p>
                </div>
              ))}
              {activeListings.length === 0 && (
                <p className="text-gray-500 text-center py-4">No active listings yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-600" />
              Recent Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRequirements.slice(0, 5).map((req) => (
                <div key={req.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{req.title}</p>
                    <p className="text-sm text-gray-600">
                      {req.cities?.join(', ') || 'Any location'}
                    </p>
                  </div>
                  <p className="font-semibold text-indigo-600">
                    ${req.max_price?.toLocaleString()}
                  </p>
                </div>
              ))}
              {activeRequirements.length === 0 && (
                <p className="text-gray-500 text-center py-4">No active requirements yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}