import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2, Calendar, Users, Video } from 'lucide-react';
import AddressAutocomplete from '@/components/forms/wizard/AddressAutocomplete';

const EVENT_TYPES = [
  { value: 'networking', label: 'Networking Mixer' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'open_house', label: 'Open House' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'social', label: 'Social Gathering' },
  { value: 'site_tour', label: 'Site Tour' },
  { value: 'other', label: 'Other' },
];

export default function GroupEventModal({ groupId, onClose, onSuccess, existingEvent }) {
  const [form, setForm] = useState({
    group_id: groupId,
    title: '',
    description: '',
    event_type: 'networking',
    start_datetime: '',
    end_datetime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location_type: 'physical',
    address: '',
    online_link: '',
    max_attendees: '',
    rsvp_required: false,
    rsvp_deadline: '',
    allow_guests: false,
    contact_email: '',
    cohosts: '',
    status: 'upcoming',
    ...existingEvent,
  });

  const update = patch => setForm(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    async function prefill() {
      const user = await supabase.auth.getUser().then(r => r.data.user);
      if (!user) return;
      if (!form.host_email) update({ host_email: user.email, host_name: user.full_name });
      if (!form.contact_email) update({ contact_email: user.email });
    }
    prefill();
  }, []);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (payload.max_attendees) {
        payload.max_attendees = parseInt(payload.max_attendees);
      } else {
        delete payload.max_attendees;
      }
      // Remove empty optional string fields to avoid validation errors
      ['rsvp_deadline', 'online_link', 'address', 'cohosts', 'contact_email', 'end_datetime'].forEach(k => {
        if (payload[k] === '') delete payload[k];
      });
      return existingEvent
        ? supabase.from('group_events').update(payload).eq('id', existingEvent.id).select()
        : supabase.from('group_events').insert(payload).select();
    },
    onSuccess,
  });

  const canSubmit = form.title.trim() && form.start_datetime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-xl my-8" style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'white' }}>
            {existingEvent ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Basic Details */}
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Event Title <span className="text-red-400">*</span></Label>
            <Input value={form.title} onChange={e => update({ title: e.target.value })} placeholder="e.g. Q2 Networking Mixer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Event Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(opt => (
                <button key={opt.value} type="button" onClick={() => update({ event_type: opt.value })}
                  className="py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all text-center"
                  style={{
                    borderColor: form.event_type === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.12)',
                    backgroundColor: form.event_type === opt.value ? 'rgba(0,219,197,0.12)' : 'rgba(255,255,255,0.04)',
                    color: form.event_type === opt.value ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.6)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Description</Label>
            <textarea value={form.description} onChange={e => update({ description: e.target.value })}
              placeholder="Describe the event, agenda, what to expect..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: 'white', fontSize: '14px', resize: 'none', outline: 'none' }}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Start Date & Time <span className="text-red-400">*</span></Label>
              <Input type="datetime-local" value={form.start_datetime} onChange={e => update({ start_datetime: e.target.value })} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'rgba(255,255,255,0.7)' }}>End Date & Time</Label>
              <Input type="datetime-local" value={form.end_datetime} onChange={e => update({ end_datetime: e.target.value })} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Timezone</Label>
            <Input value={form.timezone} onChange={e => update({ timezone: e.target.value })} placeholder="e.g. America/Detroit" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Address</Label>
            <AddressAutocomplete
              value={form.address}
              onChange={({ address }) => update({ address })}
              placeholder="123 Main St, Detroit, MI"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}><Video className="w-3.5 h-3.5" /> Virtual Link <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></Label>
            <Input
              value={form.online_link}
              onChange={e => update({ online_link: e.target.value })}
              placeholder="Zoom, Google Meet, Teams link..."
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          {/* Attendance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Max Attendees</Label>
              <Input type="number" value={form.max_attendees} onChange={e => update({ max_attendees: e.target.value })} placeholder="Unlimited" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
            <div className="space-y-1.5">
              <Label style={{ color: 'rgba(255,255,255,0.7)' }}>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => update({ contact_email: e.target.value })} placeholder="event@example.com" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-xl divide-y" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <ToggleRow label="RSVP Required" value={form.rsvp_required} onChange={v => update({ rsvp_required: v })} />
            <ToggleRow label="Allow +1 Guests" value={form.allow_guests} onChange={v => update({ allow_guests: v })} />
          </div>

          {form.rsvp_required && (
            <div className="space-y-1.5">
              <Label style={{ color: 'rgba(255,255,255,0.7)' }}>RSVP Deadline</Label>
              <Input type="date" value={form.rsvp_deadline} onChange={e => update({ rsvp_deadline: e.target.value })} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
            </div>
          )}

          {/* Co-hosts */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}><Users className="w-3.5 h-3.5" /> Co-hosts</Label>
            <Input
              value={form.cohosts}
              onChange={e => update({ cohosts: e.target.value })}
              placeholder="Enter co-host emails, comma-separated"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>e.g. jane@realty.com, bob@broker.com</p>
          </div>
        </div>

        <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit || mutation.isPending}
            className="gap-2"
            style={{ backgroundColor: 'var(--tiffany-blue)', color: '#111827' }}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {existingEvent ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        style={{ backgroundColor: value ? 'var(--tiffany-blue)' : '#d1d5db' }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  );
}