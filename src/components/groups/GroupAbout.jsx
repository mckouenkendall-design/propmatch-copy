import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, MapPin, Users, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

const FOCUS_LABELS = {
  commercial: 'Commercial',
  residential: 'Residential',
  mixed: 'Mixed',
  general: 'General',
};

export default function GroupAbout({ group, memberCount }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">About this Group</h3>

        {group.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{group.description}</p>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {group.group_type === 'private' ? (
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span>
              <span className="font-medium capitalize">{group.group_type}</span> group —{' '}
              {group.group_type === 'private' ? 'Members must be approved to join' : 'Anyone can join'}
            </span>
          </div>

          {group.location && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{group.location}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Created {group.created_date ? format(new Date(group.created_date), 'MMMM yyyy') : 'recently'}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Badge variant="outline" className="text-xs">
              {FOCUS_LABELS[group.focus_category] || 'General'} Focus
            </Badge>
          </div>
        </div>
      </div>

      {group.rules && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4" style={{ color: 'var(--tiffany-blue)' }} />
            <h3 className="text-base font-bold text-gray-900">Group Rules</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{group.rules}</p>
        </div>
      )}
    </div>
  );
}