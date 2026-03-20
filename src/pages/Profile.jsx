import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Briefcase, MapPin, Phone, Mail, Building, Award, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    phone: user?.phone || '',
    brokerage_name: user?.brokerage_name || '',
    brokerage_address: user?.brokerage_address || '',
    license_number: user?.license_number || '',
    license_state: user?.license_state || '',
    years_experience: user?.years_experience || '',
    specialties: user?.specialties || '',
    certifications: user?.certifications || '',
    languages: user?.languages || '',
    website: user?.website || '',
    linkedin: user?.linkedin || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setEditing(false);
      toast({ title: 'Profile updated successfully' });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E1318', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        
        {/* Header Card */}
        <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <CardContent style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '24px', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: ACCENT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '48px',
                  fontWeight: 300,
                  color: '#111827',
                }}>
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <button style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Camera style={{ width: '18px', height: '18px', color: 'white' }} />
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 8px' }}>
                  {user?.full_name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail style={{ width: '16px', height: '16px', color: ACCENT }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                      {user?.email}
                    </span>
                  </div>
                  {user?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone style={{ width: '16px', height: '16px', color: ACCENT }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        {user.phone}
                      </span>
                    </div>
                  )}
                </div>
                {user?.bio && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Edit Button */}
              <Button
                onClick={() => editing ? setEditing(false) : setEditing(true)}
                style={{
                  background: editing ? 'transparent' : ACCENT,
                  color: editing ? ACCENT : '#111827',
                  border: editing ? `1px solid ${ACCENT}` : 'none',
                }}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Professional Information */}
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase style={{ width: '20px', height: '20px', color: ACCENT }} />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Bio</Label>
                  <Textarea
                    disabled={!editing}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Phone</Label>
                  <Input
                    disabled={!editing}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Years of Experience</Label>
                  <Input
                    disabled={!editing}
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    placeholder="5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Specialties</Label>
                  <Input
                    disabled={!editing}
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Commercial, Residential, Luxury"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Brokerage Information */}
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building style={{ width: '20px', height: '20px', color: ACCENT }} />
                  Brokerage Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Brokerage Name</Label>
                  <Input
                    disabled={!editing}
                    value={formData.brokerage_name}
                    onChange={(e) => setFormData({ ...formData, brokerage_name: e.target.value })}
                    placeholder="ABC Realty Group"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Brokerage Address</Label>
                  <Input
                    disabled={!editing}
                    value={formData.brokerage_address}
                    onChange={(e) => setFormData({ ...formData, brokerage_address: e.target.value })}
                    placeholder="123 Main St, City, State 12345"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>License Number</Label>
                  <Input
                    disabled={!editing}
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="RE123456"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>License State</Label>
                  <Input
                    disabled={!editing}
                    value={formData.license_state}
                    onChange={(e) => setFormData({ ...formData, license_state: e.target.value })}
                    placeholder="MI"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ width: '20px', height: '20px', color: ACCENT }} />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Certifications</Label>
                  <Input
                    disabled={!editing}
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="CRS, GRI, ABR"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Languages</Label>
                  <Input
                    disabled={!editing}
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="English, Spanish"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Website</Label>
                  <Input
                    disabled={!editing}
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>LinkedIn</Label>
                  <Input
                    disabled={!editing}
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {editing && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                type="button"
                onClick={() => setEditing(false)}
                variant="outline"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                style={{ background: ACCENT, color: '#111827' }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}