import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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
      const user = await base44.auth.me();
      if (!user) return;
      if (!form.host_email) update({ host_email: user.email, host_name: user.full_name });
      if (!form.contact_email) update({ contact_email: user.email });
    }
    prefill();
  }, []);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (payload.max_attendees) payload.max_attendees = parseInt(payload.max_attendees);
      return existingEvent
        ? base44.entities.GroupEvent.update(existingEvent.id, payload)
        : base44.entities.GroupEvent.create(payload);
    },
    onSuccess,
  });

  const canSubmit = form.title.trim() && form.start_datetime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {existingEvent ? 'Edit Event' : 'Create Event'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Basic Details */}
          <div className="space-y-1.5">
            <Label>Event Title <span className="text-red-500">*</span></Label>
            <Input value={form.title} onChange={e => update({ title: e.target.value })} placeholder="e.g. Q2 Networking Mixer" />
          </div>

          <div className="space-y-1.5">
            <Label>Event Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map(opt => (
                <button key={opt.value} type="button" onClick={() => update({ event_type: opt.value })}
                  className="py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all text-center"
                  style={{
                    borderColor: form.event_type === opt.value ? 'var(--tiffany-blue)' : '#e5e7eb',
                    backgroundColor: form.event_type === opt.value ? '#e6f7f5' : 'white',
                    color: form.event_type === opt.value ? '#3A8A82' : '#6b7280',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea value={form.description} onChange={e => update({ description: e.target.value })}
              placeholder="Describe the event, agenda, what to expect..."
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date & Time <span className="text-red-500">*</span></Label>
              <Input type="datetime-local" value={form.start_datetime} onChange={e => update({ start_datetime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date & Time</Label>
              <Input type="datetime-local" value={form.end_datetime} onChange={e => update({ end_datetime: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={e => update({ timezone: e.target.value })} placeholder="e.g. America/Detroit" />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'physical', label: 'In Person', Icon: MapPin },
                { value: 'online', label: 'Online', Icon: Video },
                { value: 'tba', label: 'TBA', Icon: HelpCircle },
              ].map(({ value, label, Icon }) => (
                <button key={value} type="button" onClick={() => update({ location_type: value })}
                  className="py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{
                    borderColor: form.location_type === value ? 'var(--tiffany-blue)' : '#e5e7eb',
                    backgroundColor: form.location_type === value ? '#e6f7f5' : 'white',
                    color: form.location_type === value ? '#3A8A82' : '#6b7280',
                  }}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {form.location_type === 'physical' && (
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={e => update({ address: e.target.value })} placeholder="123 Main St, Detroit, MI" />
            </div>
          )}
          {form.location_type === 'online' && (
            <div className="space-y-1.5">
              <Label>Meeting Link</Label>
              <Input value={form.online_link} onChange={e => update({ online_link: e.target.value })} placeholder="https://zoom.us/j/..." />
            </div>
          )}

          {/* Attendance */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Attendees</Label>
              <Input type="number" value={form.max_attendees} onChange={e => update({ max_attendees: e.target.value })} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contact_email} onChange={e => update({ contact_email: e.target.value })} placeholder="event@example.com" />
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-xl border divide-y">
            <ToggleRow label="RSVP Required" value={form.rsvp_required} onChange={v => update({ rsvp_required: v })} />
            <ToggleRow label="Allow +1 Guests" value={form.allow_guests} onChange={v => update({ allow_guests: v })} />
          </div>

          {form.rsvp_required && (
            <div className="space-y-1.5">
              <Label>RSVP Deadline</Label>
              <Input type="date" value={form.rsvp_deadline} onChange={e => update({ rsvp_deadline: e.target.value })} />
            </div>
          )}

          {/* Co-hosts */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Co-hosts</Label>
            <Input
              value={form.cohosts}
              onChange={e => update({ cohosts: e.target.value })}
              placeholder="Enter co-host emails, comma-separated"
            />
            <p className="text-xs text-gray-400">e.g. jane@realty.com, bob@broker.com</p>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit || mutation.isPending}
            className="text-white gap-2"
            style={{ backgroundColor: 'var(--tiffany-blue)' }}
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
      <span className="text-sm font-medium text-gray-700">{label}</span>
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