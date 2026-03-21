import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ACCENT = '#00DBC5';

export default function StartConversationModal({ onClose, onSelectUser }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredUsers = searchQuery
    ? allUsers.filter(u => 
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ background: '#0E1318' }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>Start Conversation</h2>
          <button onClick={onClose} className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#9ca3af'
            }} />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          {searchQuery && (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.5)' }}>No users found with that username</p>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onSelectUser(user);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                    style={{ 
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: ACCENT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#111827',
                      flexShrink: 0
                    }}>
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>{user.full_name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}