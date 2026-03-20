import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Megaphone, Video, FolderOpen, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#00DBC5';

export default function Teams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('listings');
  const isManagingBroker = user?.role === 'admin' && user?.selected_plan === 'brokerage';

  // Fetch team listings and requirements
  const { data: teamListings = [] } = useQuery({
    queryKey: ['teamListings', user?.brokerage_id],
    queryFn: () => base44.entities.Listing.filter({ brokerage_id: user?.brokerage_id }),
    enabled: !!user?.brokerage_id,
  });

  const { data: teamRequirements = [] } = useQuery({
    queryKey: ['teamRequirements', user?.brokerage_id],
    queryFn: () => base44.entities.Requirement.filter({ brokerage_id: user?.brokerage_id }),
    enabled: !!user?.brokerage_id,
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 400, color: 'white', margin: '0 0 6px' }}>
          Teams
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Collaborate with your brokerage team
        </p>
      </div>

      <Tabs defaultValue="pipeline" style={{ width: '100%' }}>
        <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <TabsTrigger value="pipeline" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Users style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Team Pipeline
          </TabsTrigger>
          <TabsTrigger value="announcements" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Megaphone style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Team Announcements
          </TabsTrigger>
          <TabsTrigger value="calls" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif" }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
            <Video style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            Team Calls
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

        {/* Team Pipeline */}
        <TabsContent value="pipeline">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>Team Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>View and manage your team's active deals</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Announcements */}
        <TabsContent value="announcements">
          <div style={{ marginBottom: '24px' }}>
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <TabsTrigger value="listings" style={{ color: 'rgba(255,255,255,0.6)' }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
                  Team Listings ({teamListings.length})
                </TabsTrigger>
                <TabsTrigger value="requirements" style={{ color: 'rgba(255,255,255,0.6)' }} className="data-[state=active]:bg-[rgba(0,219,197,0.15)] data-[state=active]:text-[#00DBC5]">
                  Team Requirements ({teamRequirements.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" style={{ marginTop: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {teamListings.length === 0 ? (
                    <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', gridColumn: '1 / -1' }}>
                      <CardContent style={{ padding: '48px', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No team listings yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamListings.map(listing => (
                      <Card key={listing.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                        <CardHeader>
                          <CardTitle style={{ color: 'white', fontSize: '16px' }}>{listing.title || `${listing.property_type} in ${listing.city}`}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>{listing.city}, {listing.state}</p>
                          <p style={{ color: ACCENT, fontSize: '16px', fontWeight: 500 }}>${listing.price?.toLocaleString()}</p>
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
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No team requirements yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    teamRequirements.map(req => (
                      <Card key={req.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                        <CardHeader>
                          <CardTitle style={{ color: 'white', fontSize: '16px' }}>{req.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '8px' }}>{req.cities?.join(', ')}</p>
                          <p style={{ color: ACCENT, fontSize: '16px', fontWeight: 500 }}>Up to ${req.max_price?.toLocaleString()}</p>
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

        {/* Team Calls */}
        <TabsContent value="calls">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>Team Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Schedule and join team video calls</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Library */}
        <TabsContent value="resources">
          <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'white' }}>Resource Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Access shared documents, templates, and resources</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Dashboard Tab */}
        {isManagingBroker && (
          <TabsContent value="admin">
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white' }}>Admin Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>Access your broker admin tools</p>
                <button
                  onClick={() => navigate('/BrokerDashboard')}
                  style={{
                    background: ACCENT,
                    color: '#111827',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  Go to Broker Dashboard
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}