import React, { useState, useEffect, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Briefcase, Phone, Mail, Building, Award, Loader2, Check, X, Upload, ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ── Circular Crop Modal using react-easy-crop ─────────────────────────────────
function CropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, cappx) => {
    setCroppedAreaPixels(cappx);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const image = new Image();
      image.src = imageSrc;
      await new Promise((res) => { image.onload = res; });
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0, 0, 400, 400
      );
      canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
    } catch (e) {
      console.error('Crop error:', e);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '420px', width: '100%' }}>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>
            Position your photo
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Drag to reposition · Use the slider to zoom
          </p>
        </div>

        <div style={{ position: 'relative', width: '360px', height: '360px', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            cropSize={{ width: 260, height: 260 }}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: '8px' },
              cropAreaStyle: { border: '2.5px solid #00DBC5', color: 'rgba(0,0,0,0.55)' },
            }}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              flex: 1, height: '4px', appearance: 'none',
              borderRadius: '2px', outline: 'none', cursor: 'pointer',
              background: `linear-gradient(to right, #00DBC5 0%, #00DBC5 ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.15) ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.15) 100%)`,
            }}
          />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0, minWidth: '30px', textAlign: 'right' }}>
            {zoom.toFixed(1)}x
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <X style={{ width: '15px', height: '15px' }} /> Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{ flex: 1, padding: '11px', background: '#00DBC5', border: 'none', borderRadius: '10px', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Check style={{ width: '15px', height: '15px' }} /> Use Photo
          </button>
        </div>

        <style>{`
          input[type=range]::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #00DBC5;
            cursor: pointer;
            border: 2px solid #1a1f25;
            box-shadow: 0 0 0 1px #00DBC5;
          }
          input[type=range]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #00DBC5;
            cursor: pointer;
            border: 2px solid #1a1f25;
          }
        `}</style>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────

// ─── Logo Uploader with background removal ────────────────────────────────────
function removeBackground(imgElement, tolerance = 30) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width, h = canvas.height;

    // Sample background color from corners
    const corners = [
      [0, 0], [w-1, 0], [0, h-1], [w-1, h-1],
      [Math.floor(w/2), 0], [0, Math.floor(h/2)],
    ];
    let rSum=0, gSum=0, bSum=0;
    corners.forEach(([x, y]) => {
      const i = (y * w + x) * 4;
      rSum += data[i]; gSum += data[i+1]; bSum += data[i+2];
    });
    const bgR = Math.round(rSum/corners.length);
    const bgG = Math.round(gSum/corners.length);
    const bgB = Math.round(bSum/corners.length);

    // Replace pixels matching background color
    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - bgR);
      const dg = Math.abs(data[i+1] - bgG);
      const db = Math.abs(data[i+2] - bgB);
      if (dr + dg + db < tolerance * 3) {
        data[i+3] = 0; // make transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
}

function LogoUploader({ currentUrl, onSave, onRemove, editing = true, onAutoSave }) {
  const [processing, setProcessing] = React.useState(false);
  const [preview, setPreview] = React.useState(null); // pending preview before save
  const ACCENT = '#00DBC5';

  const handleFile = async (file) => {
    if (!file) return;
    setProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSave(file_url);
      if (onAutoSave) await onAutoSave(file_url);
      setPreview(null);
    } catch { console.error('Upload failed'); }
    finally { setProcessing(false); }
  };

  const handleRemoveBg = async () => {
    if (!currentUrl) return;
    setProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const dataUrl = await removeBackground(img);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'logo-transparent.png', { type: 'image/png' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onSave(file_url);
        if (onAutoSave) await onAutoSave(file_url);
        setProcessing(false);
      };
      img.onerror = () => { setProcessing(false); };
      img.src = currentUrl;
    } catch { setProcessing(false); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        {/* Preview box */}
        <div style={{ width:'140px', height:'56px', background:'rgba(255,255,255,0.04)', border:`1px dashed ${currentUrl?ACCENT+'60':'rgba(255,255,255,0.15)'}`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          {currentUrl
            ? <img src={currentUrl} alt="Logo" style={{ maxHeight:'44px', maxWidth:'128px', objectFit:'contain' }} />
            : <ImageIcon style={{ width:'22px', height:'22px', color:'rgba(255,255,255,0.2)' }} />
          }
        </div>

        {/* Action buttons — only in edit mode */}
        {editing && (
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <label htmlFor="logo-upload" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 13px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.75)', whiteSpace:'nowrap' }}>
              <Upload style={{ width:'12px', height:'12px' }} />
              {currentUrl ? 'Replace' : 'Upload Logo'}
            </label>
            <input id="logo-upload" type="file" accept="image/*" style={{ display:'none' }}
              onChange={e => handleFile(e.target.files?.[0])} />
            {currentUrl && (
              <button type="button" onClick={handleRemoveBg} disabled={processing}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 13px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, borderRadius:'7px', cursor:processing?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:ACCENT, whiteSpace:'nowrap', opacity:processing?0.6:1 }}>
                {processing
                  ? <><Loader2 style={{ width:'12px', height:'12px', animation:'spin 1s linear infinite' }} /> Removing…</>
                  : <>✨ Remove Background</>
                }
              </button>
            )}
            {currentUrl && (
              <button type="button" onClick={onRemove}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 13px', background:'transparent', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'7px', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>
                <X style={{ width:'11px', height:'11px' }} /> Remove
              </button>
            )}
          </div>
        )}
      </div>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)', margin:0 }}>
        Upload your logo · Click "Remove Background" to auto-strip white/solid backgrounds · PNG with transparent background looks best on PDFs
      </p>
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '', username: '', contact_email: '', phone: '',
    state: '', brokerage_name: '', brokerage_address: '', bio: '', logo_url: '',
    years_experience: '', specialties: '', certifications: '',
    languages: '', linkedin: '', website: '', instagram: '',
    tiktok: '', facebook: '', profile_photo_url: '',
  });

  // Load UserProfile entity to get logo_url and other stored fields
  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        const profile = profiles?.[0] || {};
        setFormData({
          full_name: user.full_name || '',
          username: user.username || '',
          contact_email: user.contact_email || '',
          phone: user.phone || '',
          state: user.state || '',
          brokerage_name: user.brokerage_name || '',
          brokerage_address: user.brokerage_address || '',
          logo_url: profile.logo_url || user.logo_url || '',
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
          profile_photo_url: profile.profile_photo_url || user.profile_photo_url || '',
        });
      } catch {
        // fallback to user object only
        setFormData({
          full_name: user.full_name || '',
          username: user.username || '',
          contact_email: user.contact_email || '',
          phone: user.phone || '',
          state: user.state || '',
          brokerage_name: user.brokerage_name || '',
          brokerage_address: user.brokerage_address || '',
          logo_url: user.logo_url || '',
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
    };
    load();
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const email = user?.email;
      if (!email) throw new Error('No user email');

      // Username uniqueness check
      if (data.username) {
        const allProfiles = await base44.entities.UserProfile.list();
        const conflict = allProfiles.find(
          p => p.username && p.username.toLowerCase() === data.username.toLowerCase() && p.user_email !== email
        );
        if (conflict) throw new Error('USERNAME_TAKEN');
      }

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
        logo_url: data.logo_url,
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
      if (error.message === 'USERNAME_TAKEN') {
        toast({ title: 'Username already taken', description: 'Please choose a different username.', variant: 'destructive' });
      } else {
        toast({ title: 'Save failed — please try again', variant: 'destructive' });
      }
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

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
                {/* Logo / Branding */}
                <div>
                  <Label style={{ color: 'rgba(255,255,255,0.7)', display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                    <ImageIcon style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>
                    Your Logo <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>(shown on exported PDFs)</span>
                  </Label>
                  <LogoUploader
                    currentUrl={formData.logo_url}
                    onSave={url => setFormData(p => ({ ...p, logo_url: url }))}
                    onRemove={() => setFormData(p => ({ ...p, logo_url: '' }))}
                    editing={editing}
                    onAutoSave={async (url) => {
                      const email = user?.email;
                      if (!email) return;
                      const existing = await base44.entities.UserProfile.filter({ user_email: email });
                      if (existing?.length > 0) {
                        await base44.entities.UserProfile.update(existing[0].id, { logo_url: url });
                      } else {
                        await base44.entities.UserProfile.create({ user_email: email, logo_url: url });
                      }
                    }}
                  />
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