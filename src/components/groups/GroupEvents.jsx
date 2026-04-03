import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MapPin, Video, Clock, Users, ExternalLink, Trash2, Mail, Phone, Building } from 'lucide-react';
import CommentSection from '@/components/groups/CommentSection';
import { format, isPast } from 'date-fns';
import GroupEventModal from './GroupEventModal';

const ACCENT = '#00DBC5';

const EVENT_TYPE_LABELS = {
  networking: 'Networking Mixer', workshop: 'Workshop', open_house: 'Open House',
  webinar: 'Webinar', social: 'Social Gathering', site_tour: 'Site Tour', other: 'Event',
};

const EVENT_TYPE_COLORS = {
  networking: '#4FB3A9', workshop: '#6366f1', open_house: '#f59e0b',
  webinar: '#3b82f6', social: '#ec4899', site_tour: '#10b981', other: '#9ca3af',
};



export default function GroupEvents({ groupId, currentUser }) {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['group-events', groupId],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: groupId }, 'start_datetime'),
  });

  // Fetch profiles so EventCard can show host info
  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));

  const rsvpMutation = useMutation({
    mutationFn: async (event) => {
      const rsvpList = JSON.parse(event.rsvp_list || '[]');
      const userEmail = currentUser?.email;
      const alreadyRsvpd = rsvpList.includes(userEmail);
      const updated = alreadyRsvpd ? rsvpList.filter(e => e !== userEmail) : [...rsvpList, userEmail];
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setShowCreate(true)} style={{ background: ACCENT, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus style={{ width: '16px', height: '16px' }} /> Create Event
        </Button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif" }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <Calendar style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No events yet. Create the first one!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>Upcoming</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} currentUser={currentUser} hostProfile={profileMap[event.host_email]} profileMap={profileMap} groupId={groupId}
                    onRsvp={() => rsvpMutation.mutate(event)} onDelete={() => deleteMutation.mutate(event.id)} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div style={{ opacity: 0.7 }}>
              <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>Past Events</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {past.map(event => (
                  <EventCard key={event.id} event={event} currentUser={currentUser} hostProfile={profileMap[event.host_email]} profileMap={profileMap} groupId={groupId}
                    onRsvp={() => rsvpMutation.mutate(event)} onDelete={() => deleteMutation.mutate(event.id)} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <GroupEventModal groupId={groupId} onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ['group-events', groupId] }); }} />
      )}
    </div>
  );
}

function EventCard({ event, currentUser, hostProfile, profileMap, groupId, onRsvp, onDelete, isPast }) {
  const rsvpList = JSON.parse(event.rsvp_list || '[]');
  const isRsvpd = rsvpList.includes(currentUser?.email);
  const isHost = event.host_email === currentUser?.email;
  const color = EVENT_TYPE_COLORS[event.event_type] || '#9ca3af';
  const cohosts = event.cohosts ? event.cohosts.split(',').map(e => e.trim()).filter(Boolean) : [];
  const isCohost = cohosts.includes(currentUser?.email);

  // Host display info — from profile if available, fallback to event fields
  const hostName = hostProfile?.full_name || event.host_name || event.host_email || 'Unknown';
  const hostPhoto = hostProfile?.profile_photo_url;
  const hostEmail = hostProfile?.contact_email || event.host_email;
  const hostPhone = hostProfile?.phone;
  const hostUsername = hostProfile?.username;
  const hostCompany = hostProfile?.brokerage_name;
  const hostInitial = hostName[0]?.toUpperCase() || '?';

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
      {event.cover_image_url && (
        <div style={{ height: '128px', width: '100%', overflow: 'hidden' }}>
          <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'white', background: color, padding: '2px 8px', borderRadius: '99px' }}>
                {EVENT_TYPE_LABELS[event.event_type] || 'Event'}
              </span>
              {event.status === 'cancelled' && (
                <span style={{ fontSize: '11px', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: '99px' }}>Cancelled</span>
              )}
              {event.rsvp_required && (
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '99px' }}>RSVP Required</span>
              )}
            </div>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>{event.title}</h3>
          </div>
          {isHost && !isPast && (
            <button onClick={onDelete} style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Trash2 style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
            </button>
          )}
        </div>

        {/* Host info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '14px', fontWeight: 700 }}>
            {hostPhoto
              ? <img src={hostPhoto} alt={hostName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : hostInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isHost || isCohost ? (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, fontWeight: 500, margin: 0 }}>
                {isHost ? 'You are hosting' : 'You are a co-host'}
              </p>
            ) : (
              <>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 2px' }}>
                  Hosted by {hostName}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {hostUsername && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>@{hostUsername}</span>
                  )}
                  {hostCompany && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                      <Building style={{ width: '11px', height: '11px' }} />{hostCompany}
                    </span>
                  )}
                  {hostEmail && (
                    <a href={`mailto:${hostEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, textDecoration: 'none' }}>
                      <Mail style={{ width: '11px', height: '11px' }} />{hostEmail}
                    </a>
                  )}
                  {hostPhone && (
                    <a href={`tel:${hostPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, textDecoration: 'none' }}>
                      <Phone style={{ width: '11px', height: '11px' }} />{hostPhone}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Date / Time */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{format(new Date(event.start_datetime), 'EEE, MMM d, yyyy · h:mm a')}</span>
          </div>
          {event.end_datetime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Ends {format(new Date(event.end_datetime), 'h:mm a')}</span>
            </div>
          )}
        </div>

        {event.location_type === 'physical' && event.address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <MapPin style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{event.address}</span>
          </div>
        )}
        {event.location_type === 'online' && event.online_link && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Video style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
            <a href={event.online_link} target="_blank" rel="noreferrer"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              Join Online <ExternalLink style={{ width: '12px', height: '12px' }} />
            </a>
          </div>
        )}

        {event.description && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{event.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {rsvpList.length} {rsvpList.length === 1 ? 'attendee' : 'attendees'}
              {event.max_attendees && ` / ${event.max_attendees} max`}
            </span>
          </div>
          {!isPast && (
            <button onClick={onRsvp}
              style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: isRsvpd ? '1px solid rgba(74,222,128,0.4)' : 'none', background: isRsvpd ? 'rgba(74,222,128,0.1)' : ACCENT, color: isRsvpd ? '#4ade80' : '#111827', transition: 'all 0.2s' }}>
              {isRsvpd ? '✓ Going' : 'RSVP'}
            </button>
          )}
        </div>
        <CommentSection postId={event.id} groupId={groupId} currentUser={currentUser} profileMap={profileMap}/>
      </div>
    </div>
  );
}