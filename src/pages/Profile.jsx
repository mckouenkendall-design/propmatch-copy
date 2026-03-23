import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Briefcase, MapPin, Phone, Mail, Building, Award, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    contact_email: user?.contact_email || user?.email || '',
    brokerage_name: user?.brokerage_name || '',
    brokerage_address: user?.brokerage_address || '',
    employing_broker_id: user?.employing_broker_id || '',
    license_number: user?.license_number || '',
    license_state: user?.license_state || '',
    state: user?.state || '',
    specialties: user?.specialties || '',
    certifications: user?.certifications || '',
    languages: user?.languages || '',
    website: user?.website || '',
    linkedin: user?.linkedin || '',
    instagram: user?.instagram || '',
    tiktok: user?.tiktok || '',
    facebook: user?.facebook || '',
    years_experience: user?.years_experience || '',
    profile_photo_url: user?.profile_photo_url || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        phone: user.phone || '',
        contact_email: user.contact_email || user.email || '',
        brokerage_name: user.brokerage_name || '',
        brokerage_address: user.brokerage_address || '',
        employing_broker_id: user.employing_broker_id || '',
        license_number: user.license_number || '',
        license_state: user.license_state || '',
        state: user.state || '',
        specialties: user.specialties || '',
        certifications: user.certifications || '',
        languages: user.languages || '',
        website: user.website || '',
        linkedin: user.linkedin || '',
        instagram: user.instagram || '',
        tiktok: user.tiktok || '',
        facebook: user.facebook || '',
        years_experience: user.years_experience || '',
        profile_photo_url: user.profile_photo_url || '',
      });
    }
  }, [user]);



  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, profile_photo_url: file_url });
      await base44.auth.updateMe({ profile_photo_url: file_url });
      queryClient.invalidateQueries(['user']);
      toast({ title: 'Profile photo updated' });
    } catch (error) {
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await base44.auth.updateMe({
        full_name: formData.full_name,
        username: formData.username,
        contact_email: formData.contact_email,
        phone: formData.phone,
        state: formData.state,
        brokerage_name: formData.brokerage_name,
        brokerage_address: formData.brokerage_address,
        bio: formData.bio,
        years_experience: formData.years_experience,
        specialties: formData.specialties,
        certifications: formData.certifications,
        languages: formData.languages,
        linkedin: formData.linkedin,
        website: formData.website,
        instagram: formData.instagram,
        tiktok: formData.tiktok,
        facebook: formData.facebook,
      });
      queryClient.invalidateQueries(['user']);
      setEditing(false);
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
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
                {formData.profile_photo_url ? (
                  <img 
                    src={formData.profile_photo_url} 
                    alt="Profile" 
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
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
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {uploadingPhoto ? (
                    <Loader2 style={{ width: '18px', height: '18px', color: 'white', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Camera style={{ width: '18px', height: '18px', color: 'white' }} />
                  )}
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                {editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Full Name</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="First Last"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Username</Label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="@username"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 4px' }}>
                      {user?.full_name}
                    </h1>
                    {user?.username && (
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT, margin: '0 0 8px' }}>
                        @{user.username}
                      </p>
                    )}
                  </>
                )}
                {editing ? (
                  <div style={{ marginBottom: '12px' }}>
                    <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Contact Email</Label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="your.email@example.com"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail style={{ width: '16px', height: '16px', color: ACCENT }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        {user?.contact_email || user?.email}
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
                )}
                {!editing && user?.bio && (
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
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Employing Broker Number <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span></Label>
                  <Input
                    disabled
                    value={formData.employing_broker_id}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>License Number <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span></Label>
                  <Input
                    disabled
                    value={formData.license_number}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>State</Label>
                  <Input
                    disabled={!editing}
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="MI"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ width: '20px', height: '20px', color: ACCENT }} />
                  Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Instagram</Label>
                  <Input
                    disabled={!editing}
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="https://instagram.com/yourprofile"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>TikTok</Label>
                  <Input
                    disabled={!editing}
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@yourprofile"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Facebook</Label>
                  <Input
                    disabled={!editing}
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    placeholder="https://facebook.com/yourprofile"
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
                style={{ background: ACCENT, color: '#111827' }}
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}