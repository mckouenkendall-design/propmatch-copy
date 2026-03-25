import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const ACCENT = '#00DBC5';

export default function TopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isBroker = user?.user_type === 'principal_broker';
  const isBrokerageMember = user?.selected_plan === 'brokerage' || user?.selected_plan === 'broker_sponsored' || user?.brokerage_name;

  const mainNavItems = [
    { label: 'Control Center', path: '/Dashboard' },
    { label: 'My Matches', path: '/Matches' },
    { label: 'Listings / Requirements', path: '/Inventory' },
    { label: 'Fish Tanks', path: '/Groups' },
    { label: 'Messages', path: '/Messages' },
  ];

  const handleLogout = async () => {
    await base44.auth.logout('/Landing');
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const displayInitial = displayName[0]?.toUpperCase() || 'U';
  const displayEmail = user?.contact_email || user?.email || '';
  // Profile photo — pulled from UserProfile via AuthContext merge
  const photoUrl = user?.profile_photo_url || '';

  const navLinkStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px',
      background: 'rgba(14, 19, 24, 0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 50,
      display: 'flex', alignItems: 'center', padding: '0 32px',
    }}>
      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

        {/* Logo */}
        <Link to="/Dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="160" height="32">
            <g transform="translate(20,20)">
              <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
                fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            </g>
            <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
              <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill={ACCENT} fontWeight="600">Match</tspan>
            </text>
          </svg>
        </Link>

        {/* Center Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {mainNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={navLinkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = 'rgba(0,219,197,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {item.label}
            </Link>
          ))}
          {isBrokerageMember && (
            <Link
              to={isBroker ? '/BrokerDashboard' : '/Teams'}
              style={navLinkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = 'rgba(0,219,197,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {isBroker ? 'Brokerage Admin' : 'Brokerage'}
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <GlobalSearch />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: photoUrl ? 'transparent' : ACCENT,
                border: `2px solid ${ACCENT}40`,
                cursor: 'pointer', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827',
                padding: 0, flexShrink: 0,
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  displayInitial
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', minWidth: '220px' }}>
              {/* User info header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : displayInitial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayEmail}
                  </p>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => navigate('/Profile')}
                style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User style={{ width: '16px', height: '16px', marginRight: '8px' }} /> My Profile
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/Settings')}
                style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings style={{ width: '16px', height: '16px', marginRight: '8px' }} /> Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.08)' }} />

              <DropdownMenuItem
                onClick={handleLogout}
                style={{ color: '#ef4444', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut style={{ width: '16px', height: '16px', marginRight: '8px' }} /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}