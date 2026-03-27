import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Megaphone, Video, FolderOpen, Building2, Plus, Globe, Lock, Calendar, ExternalLink, Pin, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateAnnouncementModal from '@/components/teams/CreateAnnouncementModal';
import CreateCallModal from '@/components/teams/CreateCallModal';
import ShareResourceModal from '@/components/teams/ShareResourceModal';
import { format } from 'date-fns';

const ACCENT = '#00DBC5';

function fmtPrice(post, isListing) {
  const fmt = (n) => { const num = parseFloat(n); if (!n||isNaN(num)) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
  const u = isListing
    ? (post.transaction_type==='lease'||post.transaction_type==='sublease'?'/SF/yr':post.transaction_type==='rent'?'/mo':'')
    : (post.price_period==='per_month'?'/mo':post.price_period==='per_sf_per_year'?'/SF/yr':post.price_period==='annually'?'/yr':(post.transaction_type==='lease'||post.transaction_type==='rent')?'/mo':'');
  if (isListing) return `$${fmt(post.price)||'0'}${u}`;
  const lo=fmt(post.min_price),hi=fmt(post.max_price);
  if(lo&&hi) return `$${lo}–$${hi}${u}`;
  if(hi) return `Up to $${hi}${u}`;
  if(lo) return `From $${lo}${u}`;
  return null;
}

function PipelineDetailModal({ post, onClose }) {
  if (!post) return null;
  const isListing = post._type === 'listing';
  const details = (() => { if (!post.property_details) return {}; if (typeof post.property_details === 'string') { try { return JSON.parse(post.property_details); } catch { return {}; } } return post.property_details; })();
  const priceStr = fmtPrice(post, isListing);
  const LEASE_LABELS = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', nnn:'NNN', nn:'NN', n:'N (Single Net)' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'640px', overflow:'hidden', marginBottom:'20px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isListing ? ACCENT : '#6366f1' }} />
            <span style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(255,255,255,0.4)' }}>{isListing ? 'Listing' : 'Requirement'}</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'6px', cursor:'pointer' }}>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'16px', lineHeight:1 }}>✕</span>
          </button>
        </div>
        <div style={{ padding:'24px' }}>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans', sans-serif", fontSize:'22px', fontWeight:500, color:'white', margin:'0 0 8px' }}>{post.title}</h2>
          {priceStr && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 14px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, borderRadius:'8px', marginBottom:'18px' }}>
              <span style={{ fontFamily:"'Inter', sans-serif", fontSize:'18px', fontWeight:700, color:ACCENT }}>{priceStr}</span>
            </div>
          )}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'20px' }}>
            {[post.city && `${post.city}${post.state?', '+post.state:''}`, ...(post.cities||[])].filter(Boolean).map((v,i) => <span key={i} style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>{v}</span>)}
            {post.property_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.6)', textTransform:'capitalize' }}>{post.property_type.replace(/_/g,' ')}</span>}
            {post.transaction_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.6)', textTransform:'capitalize' }}>{post.transaction_type}</span>}
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'14px', marginBottom:'16px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 10px' }}>Details</p>
            {[
              ['Size', isListing ? (post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : null) : ((post.min_size_sqft||post.max_size_sqft) ? `${post.min_size_sqft?parseFloat(post.min_size_sqft).toLocaleString():'0'}–${post.max_size_sqft?parseFloat(post.max_size_sqft).toLocaleString():'∞'} SF` : null)],
              ['Lease Type', post.lease_type ? (LEASE_LABELS[post.lease_type]||post.lease_type) : null],
              ['Building Class', details.building_class ? `Class ${details.building_class}` : null],
              ['Bedrooms', details.bedrooms],
              ['Bathrooms', details.bathrooms],
              ['Year Built', details.year_built],
              ['Parking', details.total_parking_spaces ? `${details.total_parking_spaces} spaces` : null],
              ['Clear Height', details.clear_height ? `${details.clear_height} ft` : null],
              ['Loading Docks', details.dock_doors],
              ['Acreage', details.acres ? `${details.acres} acres` : null],
              ['Timeline', post.timeline?.replace(/_/g,' ')],
              ['Status', post.status],
            ].filter(([,v]) => v!=null&&v!=='').map(([label, value]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)' }}>{label}</span>
                <span style={{ fontFamily:"'Inter', sans-serif", fontSize:'13px', color:'white' }}>{String(value)}</span>
              </div>
            ))}
          </div>
          {(post.description||post.notes||details.description||details.intended_use) && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'14px', marginBottom:'16px' }}>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 8px' }}>Description</p>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:0 }}>{post.description||post.notes||details.description||details.intended_use}</p>
            </div>
          )}
          <div style={{ background:`${ACCENT}05`, border:`1px solid ${ACCENT}20`, borderRadius:'12px', padding:'14px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(255,255,255,0.3)', margin:'0 0 10px' }}>Agent</p>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:'0 0 2px' }}>{post.contact_agent_name || post.created_by}</p>
            {post.company_name && <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:'0 0 10px' }}>{post.company_name}</p>}
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {post.contact_agent_email && <a href={`mailto:${post.contact_agent_email}`} style={{ fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'7px 12px', background:`${ACCENT}08`, borderRadius:'7px', border:`1px solid ${ACCENT}15` }}>✉ {post.contact_agent_email}</a>}
              {post.contact_agent_phone && <a href={`tel:${post.contact_agent_phone}`} style={{ fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'7px 12px', background:`${ACCENT}08`, borderRadius:'7px', border:`1px solid ${ACCENT}15` }}>📞 {post.contact_agent_phone}</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatListingPrice(listing) {
  const price = parseFloat(listing.price);
  if (!price || isNaN(price)) return null;
  const fmt = price % 1 === 0 ? price.toLocaleString() : price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  const tx = listing.transaction_type;
  const unit = tx === 'lease' || tx === 'sublease' ? '/SF/yr' : tx === 'rent' ? '/mo' : '';
  return `$${fmt}${unit}`;
}

function formatRequirementPrice(req) {
  const fmt = (n) => {
    const num = parseFloat(n);
    if (!n || isNaN(num)) return null;
    return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  const tx = req.transaction_type;
  const period = req.price_period;
  const unit = period === 'per_month' ? '/mo'
    : period === 'per_sf_per_year' ? '/SF/yr'
    : period === 'annually' ? '/yr'
    : (tx === 'lease' || tx === 'rent') ? '/mo'
    : '';
  const lo = fmt(req.min_price), hi = fmt(req.max_price);
  if (lo && hi) return `$${lo}–$${hi}${unit}`;
  if (hi) return `Up to $${hi}${unit}`;
  if (lo) return `From $${lo}${unit}`;
  return null;
}

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pipelineView, setPipelineView] = useState('listings');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const isManagingBroker = user?.role === 'admin' && user?.selected_plan === 'brokerage';

  const { data: allListings = [] } = useQuery({
    queryKey: ['allListings'],
    queryFn: () => base44.entities.Listing.list(),
    enabled: !!user?.brokerage_id,
  });

  const teamListings = allListings.filter(listing =>
    (listing.visibility === 'public' || listing.visibility === 'brokerage') &&
    listing.brokerage_id === user?.brokerage_id
  );

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['allRequirements'],
    queryFn: () => base44.entities.Requirement.list(),
    enabled: !!user?.brokerage_id,
  });

  const teamRequirements = allRequirements.filter(req =>
    (req.visibility === 'public' || req.visibility === 'brokerage') &&
    req.brokerage_id === user?.brokerage_id
  );

  const { data: announcements = [] } = useQuery({
    queryKey: ['teamAnnouncements', user?.brokerage_id],
    queryFn: () => base44.entities.TeamAnnouncement.filter({ brokerage_id: user?.brokerage_id }),
    enabled: !!user?.brokerage_id,
  });

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['teamCalls', user?.brokerage_id],
    queryFn: () => base44.entities.TeamCall.filter({ brokerage_id: user?.brokerage_id }),
    enabled: !!user?.brokerage_id,
  });

  const upcomingCalls = calls
    .filter(call => call.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  const { data: resources = [] } = useQuery({
    queryKey: ['teamResources', user?.brokerage_id],
    queryFn: () => base44.entities.TeamResource.filter({ brokerage_id: user?.brokerage_id }),
    enabled: !!user?.brokerage_id,
  });

  const groupedResources = resources.reduce((acc, resource) => {
    const cat = resource.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(resource);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
          Brokerage
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Collaborate with your brokerage
        </p>
      </div>

      <Tabs defaultValue="pipeline" style={{ width: '100%' }}>
        <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <TabsTrigger value="pipeline" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Users style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Brokerage Pipeline
          </TabsTrigger>
          <TabsTrigger value="announcements" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Megaphone style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Brokerage Announcements
          </TabsTrigger>
          <TabsTrigger value="calls" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Video style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Brokerage Calls
          </TabsTrigger>
          <TabsTrigger value="resources" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <FolderOpen style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Resource Library
          </TabsTrigger>
          {isManagingBroker && (
            <TabsTrigger value="admin" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
              <Building2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Admin Dashboard
            </TabsTrigger>
          )}
        </TabsList>

        {/* Brokerage Pipeline */}
        <TabsContent value="pipeline">
          <div style={{ marginBottom: '24px' }}>
            <Tabs value={pipelineView} onValueChange={setPipelineView}>
              <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <TabsTrigger value="listings" style={{ color: 'rgba(255,255,255,0.6)' }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
                  Brokerage Listings ({teamListings.length})
                </TabsTrigger>
                <TabsTrigger value="requirements" style={{ color: 'rgba(255,255,255,0.6)' }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
                  Brokerage Requirements ({teamRequirements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" style={{ marginTop: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {teamListings.length === 0 ? (
                    <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1' }}>
                      <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No brokerage listings yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamListings.map(listing => (
                      <Card key={listing.id}
                        onClick={() => setSelectedPost({ ...listing, _type: 'listing' })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: listing.visibility === 'public' ? 'rgba(0,219,197,0.15)' : 'rgba(255,165,0,0.15)', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: listing.visibility === 'public' ? ACCENT : '#FFA500' }}>
                          {listing.visibility === 'public' ? <Globe style={{ width: '12px', height: '12px' }} /> : <Lock style={{ width: '12px', height: '12px' }} />}
                          {listing.visibility === 'public' ? 'Public' : 'Brokerage Only'}
                        </div>
                        <CardHeader style={{ paddingRight: '120px' }}>
                          <CardTitle style={{ color: 'white', fontSize: '16px' }}>{listing.title || `${listing.property_type} in ${listing.city}`}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>{listing.city}, {listing.state}</p>
                          <p style={{ color: ACCENT, fontSize: '16px', fontWeight: 500 }}>{formatListingPrice(listing)}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px' }}>Posted by: {listing.contact_agent_name}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="requirements" style={{ marginTop: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {teamRequirements.length === 0 ? (
                    <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1' }}>
                      <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No brokerage requirements yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamRequirements.map(req => (
                      <Card key={req.id}
                        onClick={() => setSelectedPost({ ...req, _type: 'requirement' })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: req.visibility === 'public' ? 'rgba(0,219,197,0.15)' : 'rgba(255,165,0,0.15)', borderRadius: '4px', fontSize: '11px', fontWeight: 500, color: req.visibility === 'public' ? ACCENT : '#FFA500' }}>
                          {req.visibility === 'public' ? <Globe style={{ width: '12px', height: '12px' }} /> : <Lock style={{ width: '12px', height: '12px' }} />}
                          {req.visibility === 'public' ? 'Public' : 'Brokerage Only'}
                        </div>
                        <CardHeader style={{ paddingRight: '120px' }}>
                          <CardTitle style={{ color: 'white', fontSize: '16px' }}>{req.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>{req.cities?.join(', ')}</p>
                          <p style={{ color: ACCENT, fontSize: '16px', fontWeight: 500 }}>{formatRequirementPrice(req)}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '8px' }}>Posted by: {req.created_by}</p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Button onClick={() => setShowAnnouncementModal(true)} style={{ background: ACCENT, color: '#111827', gap: '8px' }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Post Announcement
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedAnnouncements.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No announcements yet</p>
                </CardContent>
              </Card>
            ) : (
              sortedAnnouncements.map(announcement => (
                <Card key={announcement.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${announcement.pinned ? ACCENT : 'rgba(255,255,255,0.1)'}` }}>
                  <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {announcement.pinned && <Pin style={{ width: '14px', height: '14px', color: ACCENT }} />}
                          <CardTitle style={{ color: 'white', fontSize: '18px' }}>{announcement.title}</CardTitle>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>
                          Posted by {announcement.author_name} • {format(new Date(announcement.created_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap' }}>{announcement.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Calls */}
        <TabsContent value="calls">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Button onClick={() => setShowCallModal(true)} style={{ background: ACCENT, color: '#111827', gap: '8px' }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Schedule Call
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {upcomingCalls.length === 0 ? (
              <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1' }}>
                <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>No upcoming calls scheduled</p>
                </CardContent>
              </Card>
            ) : (
              upcomingCalls.map(call => (
                <Card key={call.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardHeader>
                    <CardTitle style={{ color: 'white', fontSize: '16px' }}>{call.title}</CardTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: ACCENT }} />
                      <span style={{ color: ACCENT, fontSize: '14px', fontWeight: 500 }}>
                        {format(new Date(call.scheduled_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {call.description && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '12px' }}>{call.description}</p>}
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '12px' }}>Organized by: {call.organizer_name}</p>
                    <Button onClick={() => window.open(call.meeting_link, '_blank')} variant="outline" style={{ borderColor: ACCENT, color: ACCENT, width: '100%', gap: '8px' }}>
                      <ExternalLink style={{ width: '14px', height: '14px' }} />
                      Join Meeting
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Button onClick={() => setShowResourceModal(true)} style={{ background: ACCENT, color: '#111827', gap: '8px' }}>
              <Plus style={{ width: '16px', height: '16px' }} />
              Share Resource
            </Button>
          </div>
          {Object.keys(groupedResources).length === 0 ? (
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No resources shared yet</p>
              </CardContent>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(groupedResources).map(([category, items]) => (
                <div key={category}>
                  <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 500, color: 'white', marginBottom: '12px', textTransform: 'capitalize' }}>
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                    {items.map(resource => (
                      <Card key={resource.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CardHeader>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <FileText style={{ width: '20px', height: '20px', color: ACCENT, flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <CardTitle style={{ color: 'white', fontSize: '14px', marginBottom: '4px' }}>{resource.title}</CardTitle>
                              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{resource.resource_type}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {resource.description && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>{resource.description}</p>}
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '12px' }}>Shared by {resource.uploaded_by_name}</p>
                          <Button onClick={() => window.open(resource.file_url, '_blank')} variant="outline" size="sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', width: '100%', gap: '6px' }}>
                            <Download style={{ width: '14px', height: '14px' }} />
                            Download
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {isManagingBroker && (
          <TabsContent value="admin">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader><CardTitle style={{ color: 'white' }}>Admin Dashboard</CardTitle></CardHeader>
              <CardContent>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>Access your broker admin tools</p>
                <Button onClick={() => navigate('/BrokerDashboard')} style={{ background: ACCENT, color: '#111827' }}>
                  Go to Broker Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {selectedPost && <PipelineDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      {showAnnouncementModal && <CreateAnnouncementModal onClose={() => setShowAnnouncementModal(false)} />}
      {showCallModal && <CreateCallModal onClose={() => setShowCallModal(false)} />}
      {showResourceModal && <ShareResourceModal onClose={() => setShowResourceModal(false)} />}
    </div>
  );
}