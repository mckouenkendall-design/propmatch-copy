import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer style={{
      background: '#080C10',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '36px 64px',
    }}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="https://media.base44.com/images/public/6980c9695693a9fd14759060/731eb765f_propmatchlogo.png"
            alt="PropMatch"
            style={{ height: '30px', width: 'auto', display: 'block', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* Center */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          color: 'rgba(255,255,255,0.2)',
          margin: 0,
          textAlign: 'center',
        }}>
          © 2026 PropMatch · For Licensed Real Estate Professionals
        </p>

        {/* Right links */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Contact'].map(label => (
            <Link
              key={label}
              to="/Dashboard"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#00DBC5'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          footer > div { flex-direction: column; text-align: center; }
        }
      `}</style>
    </footer>
  );
}