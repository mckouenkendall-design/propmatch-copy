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
        <div style={{ opacity: 0.6 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="180" height="36">
            <g transform="translate(20,20)">
              <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
                fill="none" stroke="#00DBC5" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            </g>
            <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
              <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
            </text>
          </svg>
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