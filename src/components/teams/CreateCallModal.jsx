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

export default function CreateCallModal({ onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamCalls'] });
      toast({ title: 'Team call scheduled successfully' });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !meetingLink.trim() || !scheduledDate || !scheduledTime) return;

    const scheduled_date = `${scheduledDate}T${scheduledTime}:00`;

    createMutation.mutate({
      brokerage_id: user?.brokerage_id,
      title: title.trim(),
      description: description.trim(),
      meeting_link: meetingLink.trim(),
      scheduled_date,
      organizer_name: user?.full_name,
      organizer_email: user?.email,
      status: 'upcoming',
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
            Schedule Brokerage Call
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Call Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Sync"
              required
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Meeting Link</Label>
            <Input
              value={meetingLink}
              onChange={e => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/... or https://teams.microsoft.com/..."
              required
              type="url"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            <div>
              <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
          </div>

          <div>
            <Label style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px', display: 'block' }}>Description / Agenda (optional)</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add agenda items or call details..."
              rows={4}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button type="submit" disabled={createMutation.isPending} style={{ background: ACCENT, color: '#111827' }}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule Call'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}