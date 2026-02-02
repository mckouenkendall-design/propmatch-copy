import React, { useState } from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FilterBar({ onCreatePost, onSearch, onFilterChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    city: '',
    state: '',
    sort: 'newest'
  });

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-300"
          />
        </div>

        {/* All Types */}
        <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
          <SelectTrigger className="w-[140px] bg-gray-50">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="listing">Listings</SelectItem>
            <SelectItem value="requirement">Requirements</SelectItem>
          </SelectContent>
        </Select>

        {/* All Categories */}
        <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
          <SelectTrigger className="w-[160px] bg-gray-50">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="office">Office</SelectItem>
            <SelectItem value="land">Land</SelectItem>
          </SelectContent>
        </Select>

        {/* City */}
        <Input
          placeholder="City"
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className="w-[120px] bg-gray-50 border-gray-300"
        />

        {/* State */}
        <Input
          placeholder="State"
          value={filters.state}
          onChange={(e) => handleFilterChange('state', e.target.value)}
          className="w-[100px] bg-gray-50 border-gray-300"
        />

        {/* Filters */}
        <Button variant="outline" className="gap-1 bg-gray-50">
          Filters
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Sort */}
        <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
          <SelectTrigger className="w-[120px] bg-gray-50">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
          </SelectContent>
        </Select>

        {/* My Posts */}
        <Button variant="outline" className="bg-gray-50">
          My Posts
        </Button>

        {/* Post Button */}
        <Button
          onClick={onCreatePost}
          className="text-white gap-2"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-5 h-5" />
          Post
        </Button>
      </div>
    </div>
  );
}