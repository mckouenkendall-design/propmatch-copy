import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Briefcase, Phone, Mail, Building, Award, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    contact_email: '',
    phone: '',
    state: '',
    brokerage_name: '',
    brokerage_address: '',
    bio: '',
    years_experience: '',
    specialties: '',
    certifications: '',
    languages: '',
    linkedin: '',
    website: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    profile_photo_url: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        contact_email: user.contact_email || '',
        phone: user.phone || '',
        state: user.state || '',
        brokerage_name: user.brokerage_name || '',
        brokerage_address: user.brokerage_address || '',
        bio: user.bio || '',
        years_experience: user.years_experience || '',
        specialties: user.specialties || '',
        certifications: user.certifications || '',
        languages: user.languages || '',
        linkedin: user.linkedin || '',
        website: user.website || '',
        instagram: user.instagram || '',
        tiktok: user.tiktok || '',
        facebook: user.facebook || '',
        profile_photo_url: user.profile_photo_url || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const email = user?.email;
      if (!email) throw new Error('No user email');

      // Check if a UserProfile record already exists for this user
      const existing = await base44.entities.UserProfile.filter({ user_email: email });

      const profileData = {
        user_email: email,
        full_name: data.full_name,
        username: data.username,
        contact_email: data.contact_email,
        phone: data.phone,
        state: data.state,
        brokerage_name: data.brokerage_name,
        brokerage_address: data.brokerage_address,
        bio: data.bio,
        years_experience: data.years_experience ? Number(data.years_experience) : null,
        specialties: data.specialties,
        certifications: data.certifications,
        languages: data.languages,
        linkedin: data.linkedin,
        website: data.website,
        instagram: data.instagram,
        tiktok: data.tiktok,
        facebook: data.facebook,
        profile_photo_url: data.profile_photo_url,
        // Preserve read-only fields
        employing_broker_id: user.employing_broker_id || '',
        license_number: user.license_number || '',
        user_type: user.user_type || '',
        verification_status: user.verification_status || '',
        property_categories: user.property_categories || [],
        transaction_types: user.transaction_types || [],
        selected_plan: user.selected_plan || '',
      };

      if (existing && existing.length > 0) {
        // Update existing record
        await base44.entities.UserProfile.update(existing[0].id, profileData);
      } else {
        // Create new record
        await base44.entities.UserProfile.create(profileData);
      }

      // Also try to update the auth object for the fields it supports
      try {
        await base44.auth.updateMe({
          full_name: data.full_name,
          name: data.full_name,
          username: data.username,
          contact_email: data.contact_email,
          phone: data.phone,
        });
      } catch (e) {
        // Non-blocking — entity is the source of truth
      }
    },
    onSuccess: async () => {
      await refreshUser();
      setEditing(false);
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      console.error('Save failed:', error);
      toast({ title: 'Save failed — please try again', variant: 'destructive' });
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Save photo URL to UserProfile entity
      const email = user?.email;
      if (email) {
        const existing = await base44.entities.UserProfile.filter({ user_email: email });
        if (existing && existing.length > 0) {
          await base44.entities.UserProfile.update(existing[0].id, { profile_photo_url: file_url });
        } else {
          await base44.entities.UserProfile.create({ user_email: email, profile_photo_url: file_url });
        }
      }
      setFormData(prev => ({ ...prev, profile_photo_url: file_url }));
      await refreshUser();
      toast({ title: 'Profile photo updated' });
    } catch (error) {
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const displayName = formData.full_name || user?.email?.split('@')[0] || 'User';
  const displayInitial = displayName[0]?.toUpperCase() || 'U';

  return (
    <div style={{ minHeight: '100vh', background: '#0E1318', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>

        <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <CardContent style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '24px', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                {formData.profile_photo_url ? (
                  <img src={formData.profile_photo_url} alt="Profile"
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '120px', height: '120px', borderRadius: '50%', background: ACCENT,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px', fontWeight: 300, color: '#111827',
                  }}>
                    {displayInitial}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                  style={{
                    position: 'absolute', bottom: 0, right: 0, width: '36px', height: '36px',
                    borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {uploadingPhoto
                    ? <Loader2 style={{ width: '18px', height: '18px', color: 'white', animation: 'spin 1s linear infinite' }} />
                    : <Camera style={{ width: '18px', height: '18px', color: 'white' }} />
                  }
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                {editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Full Name</Label>
                      <Input value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="First Last"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Username</Label>
                      <Input value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="@username"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 4px' }}>
                      {displayName}
                    </h1>
                    {formData.username && (
                      <p style={{ fontSize: '14px', color: ACCENT, margin: '0 0 8px' }}>@{formData.username}</p>
                    )}
                  </>
                )}
                {editing ? (
                  <div style={{ marginBottom: '12px' }}>
                    <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Contact Email</Label>
                    <Input value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="your.email@example.com"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail style={{ width: '16px', height: '16px', color: ACCENT }} />
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        {formData.contact_email || user?.email}
                      </span>
                    </div>
                    {formData.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone style={{ width: '16px', height: '16px', color: ACCENT }} />
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{formData.phone}</span>
                      </div>
                    )}
                  </div>
                )}
                {!editing && formData.bio && (
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{formData.bio}</p>
                )}
              </div>

              <Button onClick={() => setEditing(!editing)}
                style={{
                  background: editing ? 'transparent' : ACCENT,
                  color: editing ? ACCENT : '#111827',
                  border: editing ? `1px solid ${ACCENT}` : 'none',
                }}>
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

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
                  <Textarea disabled={!editing} value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Phone</Label>
                  <Input disabled={!editing} value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(555) 123-4567"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Years of Experience</Label>
                  <Input disabled={!editing} type="number" value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    placeholder="5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Specialties</Label>
                  <Input disabled={!editing} value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Commercial, Residential, Luxury"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Certifications</Label>
                  <Input disabled={!editing} value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="CRS, GRI, ABR"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Languages</Label>
                  <Input disabled={!editing} value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                    placeholder="English, Spanish"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
              </CardContent>
            </Card>

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
                  <Input disabled={!editing} value={formData.brokerage_name}
                    onChange={(e) => setFormData({ ...formData, brokerage_name: e.target.value })}
                    placeholder="ABC Realty Group"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Brokerage Address</Label>
                  <Input disabled={!editing} value={formData.brokerage_address}
                    onChange={(e) => setFormData({ ...formData, brokerage_address: e.target.value })}
                    placeholder="123 Main St, City, State 12345"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Employing Broker ID <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span>
                  </Label>
                  <Input disabled value={user?.employing_broker_id || ''}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>
                    License No. <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span>
                  </Label>
                  <Input disabled value={user?.license_number || ''}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>State</Label>
                  <Input disabled={!editing} value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="MI"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ width: '20px', height: '20px', color: ACCENT }} />
                  Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Website', key: 'website', placeholder: 'https://yourwebsite.com' },
                  { label: 'LinkedIn', key: 'linkedin', placeholder: 'https://linkedin.com/in/yourprofile' },
                  { label: 'Instagram', key: 'instagram', placeholder: 'https://instagram.com/yourprofile' },
                  { label: 'TikTok', key: 'tiktok', placeholder: 'https://tiktok.com/@yourprofile' },
                  { label: 'Facebook', key: 'facebook', placeholder: 'https://facebook.com/yourprofile' },
                ].map(field => (
                  <div key={field.key}>
                    <Label style={{ color: 'rgba(255,255,255,0.7)' }}>{field.label}</Label>
                    <Input disabled={!editing} value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {editing && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="button" onClick={() => setEditing(false)} variant="outline"
                style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}
                style={{ background: ACCENT, color: '#111827' }}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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