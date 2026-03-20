import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Building2,
  Users,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ACCENT = '#00DBC5';

export default function TopNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const isManagingBroker = user?.role === 'admin' && user?.selected_plan === 'brokerage';

  const mainNavItems = [
    { label: 'Control Center', path: '/Dashboard' },
    { label: 'My Matches', path: '/Matches' },
    { label: 'Listings / Requirements', path: '/Inventory' },
    { label: 'Groups', path: '/Groups' },
    { label: 'Messages', path: '/Messages' },
  ];

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'rgba(14, 19, 24, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      padding: '0 32px',
    }}>
      <div style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Logo */}
        <Link to="/Dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="180" height="36">
            <g transform="translate(20,20)">
              <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
                fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            </g>
            <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
              <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill={ACCENT} fontWeight="600">Match</tspan>
            </text>
          </svg>
        </Link>

        {/* Center Nav - Always Visible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
          {mainNavItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = ACCENT;
                e.currentTarget.style.background = 'rgba(0,219,197,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Team Tools Dropdown (for brokerage users) */}
          {isManagingBroker && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = ACCENT;
                  e.currentTarget.style.background = 'rgba(0,219,197,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.background = 'transparent';
                }}>
                  Team Tools <ChevronDown style={{ width: '14px', height: '14px' }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }}>
                <DropdownMenuItem 
                  onClick={() => navigate('/BrokerDashboard')} 
                  style={{ 
                    color: 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Building2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Admin Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  style={{ 
                    color: 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Users style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Team Dealboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = ACCENT;
              e.currentTarget.style.color = ACCENT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            <Search style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Notifications */}
          <button style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            padding: '8px',
          }}>
            <Bell style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.7)' }} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              background: ACCENT,
              borderRadius: '50%',
              border: '2px solid #0E1318',
            }} />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: ACCENT,
                border: '2px solid rgba(0,219,197,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
              }}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)', minWidth: '200px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: 0 }}>
                  {user?.full_name || 'User'}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                  {user?.email}
                </p>
              </div>
              <DropdownMenuItem 
                onClick={() => navigate('/Profile')} 
                style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <User style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/Settings')} 
                style={{ color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.08)' }} />
              <DropdownMenuItem 
                onClick={handleLogout} 
                style={{ color: '#ef4444', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <style>{`
        /* Navigation always visible */
      `}</style>
    </nav>
  );
}