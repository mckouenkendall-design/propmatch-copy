import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Video, Clock, Users, ExternalLink, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import GroupEventModal from './GroupEventModal';

const EVENT_TYPE_LABELS = {
  networking: 'Networking Mixer',
  workshop: 'Workshop',
  open_house: 'Open House',
  webinar: 'Webinar',
  social: 'Social Gathering',
  site_tour: 'Site Tour',
  other: 'Event',
};

const EVENT_TYPE_COLORS = {
  networking: '#4FB3A9',
  workshop: '#6366f1',
  open_house: '#f59e0b',
  webinar: '#3b82f6',
  social: '#ec4899',
  site_tour: '#10b981',
  other: '#9ca3af',
};

export default function GroupEvents({ groupId, currentUser }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['group-events', groupId],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: groupId }, 'start_datetime'),
  });

  const rsvpMutation = useMutation({
    mutationFn: async (event) => {
      const rsvpList = JSON.parse(event.rsvp_list || '[]');
      const userEmail = currentUser?.email;
      const alreadyRsvpd = rsvpList.includes(userEmail);
      const updated = alreadyRsvpd
        ? rsvpList.filter(e => e !== userEmail)
        : [...rsvpList, userEmail];
      return base44.entities.GroupEvent.update(event.id, { rsvp_list: JSON.stringify(updated) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-events', groupId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId) => base44.entities.GroupEvent.delete(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-events', groupId] }),
  });

  const upcoming = events.filter(e => !isPast(new Date(e.start_datetime)) && e.status !== 'cancelled');
  const past = events.filter(e => isPast(new Date(e.start_datetime)) || e.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Create Event Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreate(true)}
          className="text-white gap-2"
          style={{ backgroundColor: 'var(--tiffany-blue)' }}
        >
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No events yet. Create the first one!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h3>
              <div className="space-y-4">
                {upcoming.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    onRsvp={() => rsvpMutation.mutate(event)}
                    onDelete={() => deleteMutation.mutate(event.id)}
                  />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past Events</h3>
              <div className="space-y-4 opacity-75">
                {past.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUser={currentUser}
                    onRsvp={() => rsvpMutation.mutate(event)}
                    onDelete={() => deleteMutation.mutate(event.id)}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <GroupEventModal
          groupId={groupId}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['group-events', groupId] });
          }}
        />
      )}
    </div>
  );
}

function EventCard({ event, currentUser, onRsvp, onDelete, isPast }) {
  const rsvpList = JSON.parse(event.rsvp_list || '[]');
  const isRsvpd = rsvpList.includes(currentUser?.email);
  const isHost = event.host_email === currentUser?.email;
  const color = EVENT_TYPE_COLORS[event.event_type] || '#9ca3af';
  const cohosts = event.cohosts ? event.cohosts.split(',').map(e => e.trim()).filter(Boolean) : [];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {event.cover_image_url && (
        <div className="h-32 w-full overflow-hidden">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className="text-white text-xs" style={{ backgroundColor: color }}>
                {EVENT_TYPE_LABELS[event.event_type] || 'Event'}
              </Badge>
              {event.status === 'cancelled' && (
                <Badge variant="outline" className="text-xs text-red-500 border-red-200">Cancelled</Badge>
              )}
              {event.rsvp_required && (
                <Badge variant="outline" className="text-xs">RSVP Required</Badge>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
            {(isHost || cohosts.includes(currentUser?.email)) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {isHost ? 'You are hosting' : 'You are a co-host'}
              </p>
            )}
          </div>
          {isHost && !isPast && (
            <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>

        {/* Date / Time */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span>{format(new Date(event.start_datetime), 'EEE, MMM d, yyyy · h:mm a')}</span>
          </div>
          {event.end_datetime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Ends {format(new Date(event.end_datetime), 'h:mm a')}</span>
            </div>
          )}
        </div>

        {/* Location */}
        {event.location_type === 'physical' && event.address && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span>{event.address}</span>
          </div>
        )}
        {event.location_type === 'online' && event.online_link && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3">
            <Video className="w-3.5 h-3.5 text-gray-400" />
            <a href={event.online_link} target="_blank" rel="noreferrer"
              className="hover:underline flex items-center gap-1" style={{ color: 'var(--tiffany-blue)' }}>
              Join Online <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>{rsvpList.length} {rsvpList.length === 1 ? 'attendee' : 'attendees'}</span>
            {event.max_attendees && <span className="text-gray-400">/ {event.max_attendees} max</span>}
          </div>
          {!isPast && (event.rsvp_required || true) && (
            <button
              onClick={onRsvp}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: isRsvpd ? '#dcfce7' : 'var(--tiffany-blue)',
                color: isRsvpd ? '#15803d' : 'white',
                border: isRsvpd ? '1px solid #86efac' : 'none',
              }}
            >
              {isRsvpd ? '✓ Going' : 'RSVP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}