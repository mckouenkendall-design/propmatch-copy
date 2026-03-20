import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function ShareResourceModal({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState('document');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamResources']);
      toast({ title: 'Resource shared successfully' });
      onClose();
    },
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);

    createMutation.mutate({
      brokerage_id: user?.brokerage_id,
      title: title.trim(),
      description: description.trim(),
      resource_type: resourceType,
      category,
      file_url,
      file_name: file.name,
      uploaded_by_name: user?.full_name,
      uploaded_by_email: user?.email,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1a1f25',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>
            Share Resource
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Upload File</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${file ? ACCENT : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FileText style={{ width: '20px', height: '20px', color: ACCENT }} />
                  <span style={{ color: ACCENT }}>{file.name}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Upload style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.4)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Click to upload file</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Resource title"
              required
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectItem value="document" style={{ color: 'rgba(255,255,255,0.85)' }}>Document</SelectItem>
                  <SelectItem value="template" style={{ color: 'rgba(255,255,255,0.85)' }}>Template</SelectItem>
                  <SelectItem value="guide" style={{ color: 'rgba(255,255,255,0.85)' }}>Guide</SelectItem>
                  <SelectItem value="form" style={{ color: 'rgba(255,255,255,0.85)' }}>Form</SelectItem>
                  <SelectItem value="presentation" style={{ color: 'rgba(255,255,255,0.85)' }}>Presentation</SelectItem>
                  <SelectItem value="other" style={{ color: 'rgba(255,255,255,0.85)' }}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <SelectItem value="marketing" style={{ color: 'rgba(255,255,255,0.85)' }}>Marketing</SelectItem>
                  <SelectItem value="legal" style={{ color: 'rgba(255,255,255,0.85)' }}>Legal</SelectItem>
                  <SelectItem value="training" style={{ color: 'rgba(255,255,255,0.85)' }}>Training</SelectItem>
                  <SelectItem value="operations" style={{ color: 'rgba(255,255,255,0.85)' }}>Operations</SelectItem>
                  <SelectItem value="sales" style={{ color: 'rgba(255,255,255,0.85)' }}>Sales</SelectItem>
                  <SelectItem value="general" style={{ color: 'rgba(255,255,255,0.85)' }}>General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description or notes about this resource..."
              rows={3}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="button" onClick={onClose} variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || uploading || !file} style={{ background: ACCENT, color: '#111827' }}>
              {uploading ? 'Uploading...' : createMutation.isPending ? 'Sharing...' : 'Share Resource'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}