import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Briefcase, Phone, Mail, Building, Award, Loader2, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';
const CROP_SIZE = 280;

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ── Circular Crop Modal ──────────────────────────────────────────────────────
function CropModal({ imageSrc, onConfirm, onCancel }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef(null);

  const onImgLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setNaturalSize({ w: naturalWidth, h: naturalHeight });
    // Fit the shorter side to CROP_SIZE
    const minSide = Math.min(naturalWidth, naturalHeight);
    setScale(CROP_SIZE / minSide);
    setOffset({ x: 0, y: 0 });
  };

  const scaledW = naturalSize.w * scale;
  const scaledH = naturalSize.h * scale;

  const clampOffset = useCallback((ox, oy, sc) => {
    const sw = naturalSize.w * sc;
    const sh = naturalSize.h * sc;
    const maxX = Math.max(0, (sw - CROP_SIZE) / 2);
    const maxY = Math.max(0, (sh - CROP_SIZE) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [naturalSize]);

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const rawX = e.clientX - dragStart.x;
    const rawY = e.clientY - dragStart.y;
    setOffset(clampOffset(rawX, rawY, scale));
  };

  const onMouseUp = () => setDragging(false);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const minScale = CROP_SIZE / Math.min(naturalSize.w, naturalSize.h);
    const newScale = Math.max(minScale, Math.min(5, scale + delta));
    setScale(newScale);
    setOffset(prev => clampOffset(prev.x, prev.y, newScale));
  };

  const handleZoom = (dir) => {
    const minScale = CROP_SIZE / Math.min(naturalSize.w, naturalSize.h);
    const newScale = Math.max(minScale, Math.min(5, scale + dir * 0.15));
    setScale(newScale);
    setOffset(prev => clampOffset(prev.x, prev.y, newScale));
  };

  const handleConfirm = () => {
    // Draw crop to canvas and return blob
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    // Source coords in natural image space
    const drawX = (scaledW / 2 - offset.x - CROP_SIZE / 2) / scale;
    const drawY = (scaledH / 2 - offset.y - CROP_SIZE / 2) / scale;
    const drawW = CROP_SIZE / scale;
    const drawH = CROP_SIZE / scale;
    ctx.drawImage(img, drawX, drawY, drawW, drawH, 0, 0, CROP_SIZE, CROP_SIZE);
    canvas.toBlob(blob => {
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '420px', width: '100%' }}>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 6px', textAlign: 'center' }}>
            Position your photo
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>
            Drag to reposition · Scroll or pinch to zoom
          </p>
        </div>

        {/* Crop viewport */}
        <div
          style={{
            width: CROP_SIZE,
            height: CROP_SIZE,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            cursor: dragging ? 'grabbing' : 'grab',
            border: `3px solid ${ACCENT}`,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.6)`,
            flexShrink: 0,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: 'absolute',
              width: scaledW,
              height: scaledH,
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => handleZoom(-1)} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomOut style={{ width: '18px', height: '18px' }} />
          </button>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative', width: '120px', cursor: 'pointer' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const minScale = CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1);
              const newScale = minScale + pct * (5 - minScale);
              setScale(newScale);
              setOffset(prev => clampOffset(prev.x, prev.y, newScale));
            }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: ACCENT, borderRadius: '2px', width: `${Math.max(0, Math.min(100, ((scale - (CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1))) / (5 - (CROP_SIZE / Math.min(naturalSize.w || 1, naturalSize.h || 1)))) * 100))}%` }} />
          </div>
          <button onClick={() => handleZoom(1)} style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZoomIn style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <X style={{ width: '16px', height: '16px' }} /> Cancel
          </button>
          <button onClick={handleConfirm} style={{ flex: 1, padding: '12px', background: ACCENT, border: 'none', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Check style={{ width: '16px', height: '16px' }} /> Use Photo
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ────────────────────────────────────────────────────────
export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState(null); // raw image src for crop modal
  const [formData, setFormData] = useState({
    full_name: '', username: '', contact_email: '', phone: '',
    state: '', brokerage_name: '', brokerage_address: '', bio: '',
    years_experience: '', specialties: '', certifications: '',
    languages: '', linkedin: '', website: '', instagram: '',
    tiktok: '', facebook: '', profile_photo_url: '',
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
        employing_broker_id: user.employing_broker_id || '',
        license_number: user.license_number || '',
        user_type: user.user_type || '',
        verification_status: user.verification_status || '',
        property_categories: user.property_categories || [],
        transaction_types: user.transaction_types || [],
        selected_plan: user.selected_plan || '',
      };
      if (existing && existing.length > 0) {
        await base44.entities.UserProfile.update(existing[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }
      try {
        await base44.auth.updateMe({
          full_name: data.full_name,
          name: data.full_name,
          username: data.username,
          contact_email: data.contact_email,
          phone: data.phone,
        });
      } catch (e) { /* non-blocking */ }
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

  // Step 1: file selected → open crop modal
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be selected again
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Step 2: crop confirmed → upload cropped blob
  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploadingPhoto(true);
    try {
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
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
      console.error(error);
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
  const photoUrl = formData.profile_photo_url || user?.profile_photo_url || '';

  return (
    <div style={{ minHeight: '100vh', background: '#0E1318', paddingTop: '64px' }}>
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px 24px' }}>
        <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
          <CardContent style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '24px', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ACCENT}30` }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 300, color: '#111827' }}>
                    {displayInitial}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: '36px', height: '36px', borderRadius: '50%', background: '#0E1318', border: `2px solid ${ACCENT}`, cursor: uploadingPhoto ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {uploadingPhoto
                    ? <Loader2 style={{ width: '16px', height: '16px', color: ACCENT, animation: 'spin 1s linear infinite' }} />
                    : <Camera style={{ width: '16px', height: '16px', color: ACCENT }} />
                  }
                </button>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                {editing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Full Name</Label>
                      <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="First Last" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                    <div>
                      <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Username</Label>
                      <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="@username" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 4px' }}>{displayName}</h1>
                    {formData.username && <p style={{ fontSize: '14px', color: ACCENT, margin: '0 0 8px' }}>@{formData.username}</p>}
                  </>
                )}
                {editing ? (
                  <div style={{ marginBottom: '12px' }}>
                    <Label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '4px', display: 'block' }}>Contact Email</Label>
                    <Input value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="your.email@example.com" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail style={{ width: '16px', height: '16px', color: ACCENT }} />
                      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{formData.contact_email || user?.email}</span>
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

              <Button onClick={() => setEditing(!editing)} style={{ background: editing ? 'transparent' : ACCENT, color: editing ? ACCENT : '#111827', border: editing ? `1px solid ${ACCENT}` : 'none' }}>
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
                  <Briefcase style={{ width: '20px', height: '20px', color: ACCENT }} /> Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Bio', key: 'bio', type: 'textarea', placeholder: 'Tell us about yourself...' },
                  { label: 'Phone', key: 'phone', placeholder: '(555) 123-4567', phone: true },
                  { label: 'Years of Experience', key: 'years_experience', type: 'number', placeholder: '5' },
                  { label: 'Specialties', key: 'specialties', placeholder: 'Commercial, Residential, Luxury' },
                  { label: 'Certifications', key: 'certifications', placeholder: 'CRS, GRI, ABR' },
                  { label: 'Languages', key: 'languages', placeholder: 'English, Spanish' },
                ].map(f => (
                  <div key={f.key}>
                    <Label style={{ color: 'rgba(255,255,255,0.7)' }}>{f.label}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea disabled={!editing} value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    ) : (
                      <Input disabled={!editing} type={f.type || 'text'} value={formData[f.key]}
                        onChange={e => setFormData({ ...formData, [f.key]: f.phone ? formatPhone(e.target.value) : e.target.value })}
                        placeholder={f.placeholder} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building style={{ width: '20px', height: '20px', color: ACCENT }} /> Brokerage Information
                </CardTitle>
              </CardHeader>
              <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Brokerage Name</Label>
                  <Input disabled={!editing} value={formData.brokerage_name} onChange={e => setFormData({ ...formData, brokerage_name: e.target.value })} placeholder="ABC Realty Group" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Brokerage Address</Label>
                  <Input disabled={!editing} value={formData.brokerage_address} onChange={e => setFormData({ ...formData, brokerage_address: e.target.value })} placeholder="123 Main St, City, State 12345" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Employing Broker ID <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span></Label>
                  <Input disabled value={user?.employing_broker_id || ''} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>License No. <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>(Read-only)</span></Label>
                  <Input disabled value={user?.license_number || ''} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)' }}>State</Label>
                  <Input disabled={!editing} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} placeholder="MI" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ width: '20px', height: '20px', color: ACCENT }} /> Online Presence
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
                    <Input disabled={!editing} value={formData[field.key]} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {editing && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button type="button" onClick={() => setEditing(false)} variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} style={{ background: ACCENT, color: '#111827' }}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}