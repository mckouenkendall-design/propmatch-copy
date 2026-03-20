import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#00DBC5';

export default function CreateAnnouncementModal({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamAnnouncement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamAnnouncements']);
      toast({ title: 'Announcement posted successfully' });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createMutation.mutate({
      brokerage_id: user?.brokerage_id,
      title: title.trim(),
      content: content.trim(),
      author_name: user?.full_name,
      author_email: user?.email,
      pinned,
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
            Post Team Announcement
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., New Marketing Materials Available"
              required
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Message</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your announcement message..."
              required
              rows={6}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="pinned"
              checked={pinned}
              onChange={e => setPinned(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <Label htmlFor="pinned" style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              Pin this announcement to the top
            </Label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="button" onClick={onClose} variant="outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending} style={{ background: ACCENT, color: '#111827' }}>
              {createMutation.isPending ? 'Posting...' : 'Post Announcement'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}