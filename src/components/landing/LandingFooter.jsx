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
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <svg width="32" height="21" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12 C10 4, 26 4, 30 12 C26 20, 10 20, 6 12 Z" fill="none" stroke="#00DBC5" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M6 12 L1 5 M6 12 L1 19" fill="none" stroke="#00DBC5" strokeWidth="1.7" strokeLinecap="round"/>
            <circle cx="25" cy="11" r="1.3" fill="#00DBC5"/>
          </svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', lineHeight: 1 }}>
            <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.01em' }}>Prop</span><span style={{ fontWeight: 600, color: '#00DBC5', letterSpacing: '-0.01em' }}>Match</span>
          </span>
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