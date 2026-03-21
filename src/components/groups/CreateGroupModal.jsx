import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Upload } from 'lucide-react';

const FOCUS_OPTIONS = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'residential', label: 'Residential' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'general', label: 'General' },
];

export default function CreateGroupModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    focus_category: 'general',
    group_type: 'public',
    rules: '',
    cover_image_url: '',
  });
  const [uploading, setUploading] = useState(false);

  const update = patch => setForm(prev => ({ ...prev, ...patch }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update({ cover_image_url: file_url });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const group = await base44.entities.Group.create({ ...data, member_count: 1, status: 'active' });
      // Auto-join creator as admin
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'admin',
        status: 'active',
      });
      return group;
    },
    onSuccess,
  });

  const canSubmit = form.name.trim().length > 0 && form.cover_image_url.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg" style={{ background: '#0E1318' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Create a Fish Tank</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Cover Photo <span style={{ color: '#ef4444' }}>*</span></Label>
            <div className="relative">
              {form.cover_image_url ? (
                <div className="relative">
                  <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => update({ cover_image_url: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                  style={{ 
                    borderColor: 'rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <Upload className="w-8 h-8 mb-2" style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{uploading ? 'Uploading...' : 'Click to upload cover photo'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Fish Tank Name <span style={{ color: '#ef4444' }}>*</span></Label>
            <Input value={form.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Detroit Commercial RE Fish Tank" />
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Description</Label>
            <textarea
              value={form.description}
              onChange={e => update({ description: e.target.value })}
              placeholder="What is this Fish Tank about? Who is it for?"
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1"
              style={{ 
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Location Focus</Label>
            <Input value={form.location} onChange={e => update({ location: e.target.value })} placeholder="e.g. Metro Detroit, Southeast Michigan" />
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Property Focus</Label>
            <div className="grid grid-cols-4 gap-2">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ focus_category: opt.value })}
                  className="py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: form.focus_category === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: form.focus_category === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
                    color: form.focus_category === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can join' },
                { value: 'private', label: 'Private', desc: 'Requires approval' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ group_type: opt.value })}
                  className="p-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: form.group_type === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)',
                    backgroundColor: form.group_type === opt.value ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: form.group_type === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.9)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Fish Tank Rules <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>(optional)</span></Label>
            <textarea
              value={form.rules}
              onChange={e => update({ rules: e.target.value })}
              placeholder="Any guidelines or rules for the Fish Tank..."
              rows={2}
              className="w-full rounded-md px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1"
              style={{ 
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
            />
          </div>
        </div>

        <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)' }}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit || mutation.isPending}
            className="text-white gap-2"
            style={{ backgroundColor: 'var(--tiffany-blue)' }}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Fish Tank
          </Button>
        </div>
      </div>
    </div>
  );
}