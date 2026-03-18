import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features', href: 'features' },
  { label: 'How It Works', href: 'how-it-works' },
  { label: 'Pricing', href: 'pricing' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

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
    transition: 'all 0.3s ease',
    background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
    backdropFilter: scrolled ? 'blur(16px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
    borderBottom: scrolled ? '1px solid #E5E7EB' : '1px solid transparent',
  };

  const linkColor = scrolled ? '#6B7280' : 'rgba(255,255,255,0.65)';
  const logoTextColor = scrolled ? '#111827' : '#FFFFFF';

  return (
    <>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          {/* Logo */}
          <Link to="/Landing" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="9" cy="13" r="9" fill="none" stroke="#29F2DE" strokeWidth="1.8" />
              <circle cx="17" cy="13" r="9" fill="none" stroke="#29F2DE" strokeWidth="1.8" opacity="0.6" />
              <circle cx="13" cy="13" r="2.5" fill="#29F2DE" />
            </svg>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '20px', color: logoTextColor, transition: 'color 0.3s ease' }}>
              Prop<span style={{ color: '#29F2DE' }}>Match</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginLeft: 'auto' }} className="landing-desktop-nav">
            {NAV_LINKS.map(link => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: linkColor,
                  transition: 'color 0.2s ease',
                  padding: '4px 0',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#29F2DE'}
                onMouseLeave={e => e.currentTarget.style.color = linkColor}
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/Dashboard"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#111827',
                background: '#29F2DE',
                padding: '9px 22px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3A8C84'}
              onMouseLeave={e => e.currentTarget.style.background = '#29F2DE'}
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
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={scrolled ? '#111827' : 'white'} strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="18" y2="18" />
                  <line x1="18" y1="4" x2="4" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="19" y2="7" />
                  <line x1="3" y1="12" x2="19" y2="12" />
                  <line x1="3" y1="17" x2="19" y2="17" />
                </>
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
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#374151', textAlign: 'left' }}
            >
              {link.label}
            </button>
          ))}
          <Link
            to="/Dashboard"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#111827', background: '#29F2DE', padding: '12px 22px', borderRadius: '6px', textDecoration: 'none', textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}
          >
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