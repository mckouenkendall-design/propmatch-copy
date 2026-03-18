import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features', href: 'features' },
  { label: 'How It Works', href: 'how-it-works' },
  { label: 'Pricing', href: 'pricing' },
];

const ACCENT = '#00DBC5';

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Always frosted glass — no transparent state
  const navStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 64px',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid #E5E7EB',
  };

  return (
    <>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <Link to="/Landing" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
            {/* Fish icon */}
            <svg width="36" height="24" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body arc */}
              <path d="M6 12 C10 4, 26 4, 30 12 C26 20, 10 20, 6 12 Z" fill="none" stroke={ACCENT} strokeWidth="1.7" strokeLinejoin="round"/>
              {/* Tail */}
              <path d="M6 12 L1 5 M6 12 L1 19" fill="none" stroke={ACCENT} strokeWidth="1.7" strokeLinecap="round"/>
              {/* Eye */}
              <circle cx="25" cy="11" r="1.3" fill={ACCENT}/>
            </svg>
            {/* Wordmark */}
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', lineHeight: 1 }}>
              <span style={{ fontWeight: 300, color: '#111827', letterSpacing: '-0.01em' }}>Prop</span><span style={{ fontWeight: 600, color: ACCENT, letterSpacing: '-0.01em' }}>Match</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginLeft: 'auto' }} className="landing-desktop-nav">
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 400,
                  color: '#6B7280', transition: 'color 0.2s ease', padding: '4px 0',
                }}
                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/Dashboard"
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: '#111827', background: ACCENT,
                padding: '9px 22px', borderRadius: '6px', textDecoration: 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
              onMouseLeave={e => e.currentTarget.style.background = ACCENT}
            >
              Join PropMatch
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="landing-mobile-nav"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'none' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#111827" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <><line x1="4" y1="4" x2="18" y2="18" /><line x1="18" y1="4" x2="4" y2="18" /></>
              ) : (
                <><line x1="3" y1="7" x2="19" y2="7" /><line x1="3" y1="12" x2="19" y2="12" /><line x1="3" y1="17" x2="19" y2="17" /></>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 99,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #E5E7EB', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '20px',
        }}>
          {NAV_LINKS.map(link => (
            <button key={link.href} onClick={() => scrollTo(link.href)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#374151', textAlign: 'left' }}>
              {link.label}
            </button>
          ))}
          <Link to="/Dashboard"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#111827', background: ACCENT, padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}>
            Join PropMatch
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}