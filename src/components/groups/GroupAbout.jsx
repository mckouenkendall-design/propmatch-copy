import React from 'react';
import { Globe, Lock, MapPin, Users, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const ACCENT = '#00DBC5';

const FOCUS_LABELS = {
  commercial: 'Commercial', residential: 'Residential', mixed: 'Mixed', general: 'General',
};

export default function GroupAbout({ group, memberCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>About this Group</h3>

        {group.description && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{group.description}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {group.group_type === 'private'
              ? <Lock style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              : <Globe style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            }
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
              <strong style={{ color: 'white', textTransform: 'capitalize' }}>{group.group_type}</strong> group — {group.group_type === 'private' ? 'Members must be approved to join' : 'Anyone can join'}
            </span>
          </div>

          {group.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{group.location}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Created {group.created_date ? format(new Date(group.created_date), 'MMMM yyyy') : 'recently'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, border: `1px solid ${ACCENT}40`, padding: '2px 10px', borderRadius: '99px' }}>
              {FOCUS_LABELS[group.focus_category] || 'General'} Focus
            </span>
          </div>
        </div>
      </div>

      {group.rules && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BookOpen style={{ width: '16px', height: '16px', color: ACCENT }} />
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>Group Rules</h3>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{group.rules}</p>
        </div>
      )}
    </div>
  );
}