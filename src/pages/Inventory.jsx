import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, Plus, Grid, List as ListIcon, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import CreatePostModal from '@/components/dashboard/CreatePostModal';
import ListingWizard from '@/components/forms/ListingWizard';
import RequirementWizard from '@/components/forms/RequirementWizard';

const ACCENT = '#00DBC5';

export default function Inventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('listings');
  const [viewMode, setViewMode] = useState('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const { data: listings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }),
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }),
  });

  const parseItem = (item) => {
    const parsed = { ...item };
    if (typeof parsed.property_details === 'string') {
      try { parsed.property_details = JSON.parse(parsed.property_details); } catch { parsed.property_details = {}; }
    }
    if (typeof parsed.area_map_data === 'string') {
      try { parsed.mapAreas = JSON.parse(parsed.area_map_data); } catch { parsed.mapAreas = []; }
    }
    return parsed;
  };

  const handleEditSuccess = () => {
    setEditingListing(null);
    setEditingRequirement(null);
    queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
  };

  const PropertyCard = ({ item, type }) => (
    <Card
      onClick={() => type === 'listing'
        ? setEditingListing(parseItem(item))
        : setEditingRequirement(parseItem(item))
      }
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${ACCENT}15`;
        e.currentTarget.style.borderColor = `${ACCENT}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
      }}
    >
      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}30`, borderRadius: '6px', padding: '3px 8px' }}>
        <Pencil style={{ width: '11px', height: '11px', color: ACCENT }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: ACCENT }}>Edit</span>
      </div>

      <CardContent style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: type === 'listing' ? `${ACCENT}15` : 'rgba(255,255,255,0.06)',
            border: type === 'listing' ? `1px solid ${ACCENT}30` : '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {type === 'listing'
              ? <Building2 style={{ width: '20px', height: '20px', color: ACCENT }} />
              : <Search style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.6)' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '60px' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {item.city || (item.cities?.join(', ')) || 'Location TBD'} · {item.property_type?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '12px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: ACCENT, margin: 0 }}>
            {(() => {
              const isListing = type === 'listing';
              const fmt = (n) => { const num = parseFloat(n); if (isNaN(num)||!n) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
              const u = isListing
                ? (item.transaction_type==='lease'||item.transaction_type==='sublease' ? '/SF/yr' : item.transaction_type==='rent' ? '/mo' : '')
                : (item.price_period==='per_month' ? '/mo' : item.price_period==='per_sf_per_year' ? '/SF/yr' : item.price_period==='annually' ? '/yr' : '');
              if (isListing) return `$${fmt(item.price)||'0'}${u}`;
              const lo = fmt(item.min_price), hi = fmt(item.max_price);
              if (lo && hi) return `$${lo}–$${hi}${u}`;
              if (hi) return `Up to $${hi}${u}`;
              if (lo) return `From $${lo}${u}`;
              return '—';
            })()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {item.status || 'Active'}
          </span>
          {item.size_sqft && (
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              {item.size_sqft.toLocaleString()} SF
            </span>
          )}
          {item.transaction_type && (
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>
              {item.transaction_type}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const currentItems = activeTab === 'listings' ? listings : requirements;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
          My Listings & Client Requirements
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Click any card to edit. Changes save instantly when you click Post.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setActiveTab('listings')}
              style={{ padding: '8px 20px', background: activeTab === 'listings' ? `${ACCENT}20` : 'transparent', border: activeTab === 'listings' ? `1px solid ${ACCENT}40` : 'none', borderRadius: '6px', color: activeTab === 'listings' ? ACCENT : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Building2 style={{ width: '16px', height: '16px' }} /> Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              style={{ padding: '8px 20px', background: activeTab === 'requirements' ? `${ACCENT}20` : 'transparent', border: activeTab === 'requirements' ? `1px solid ${ACCENT}40` : 'none', borderRadius: '6px', color: activeTab === 'requirements' ? ACCENT : 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Search style={{ width: '16px', height: '16px' }} /> Requirements ({requirements.length})
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '10px 20px', background: ACCENT, border: 'none', borderRadius: '8px', color: '#111827', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} /> Post
          </button>
        </div>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
          <button onClick={() => setViewMode('grid')} style={{ padding: '6px 12px', background: viewMode === 'grid' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderRadius: '4px', color: viewMode === 'grid' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <Grid style={{ width: '16px', height: '16px' }} />
          </button>
          <button onClick={() => setViewMode('list')} style={{ padding: '6px 12px', background: viewMode === 'list' ? 'rgba(255,255,255,0.08)' : 'transparent', border: 'none', borderRadius: '4px', color: viewMode === 'list' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <ListIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {currentItems.length === 0 ? (
        <Card style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CardContent style={{ padding: '64px', textAlign: 'center' }}>
            {activeTab === 'listings'
              ? <Building2 style={{ width: '64px', height: '64px', color: `${ACCENT}40`, margin: '0 auto 20px' }} />
              : <Search style={{ width: '64px', height: '64px', color: `${ACCENT}40`, margin: '0 auto 20px' }} />
            }
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>No {activeTab} yet</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Click "Post" to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '20px' }}>
          {currentItems.map(item => (
            <PropertyCard key={item.id} item={item} type={activeTab.slice(0, -1)} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            queryClient.invalidateQueries({ queryKey: ['my-requirements'] });
          }}
        />
      )}

      {editingListing && (
        <ListingWizard
          category={editingListing.property_category || 'commercial'}
          initialData={editingListing}
          editMode={true}
          onClose={() => setEditingListing(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {editingRequirement && (
        <RequirementWizard
          category={editingRequirement.property_category || 'commercial'}
          initialData={editingRequirement}
          editMode={true}
          onClose={() => setEditingRequirement(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}