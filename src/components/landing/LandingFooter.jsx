import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ACCENT = '#00DBC5';

const SOCIAL = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon fill="#080C10" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </svg>
    ),
  },
];

const BLOG_PREVIEWS = [
  { title: 'Why Agents Lose Deals Without a Matching System', date: 'Mar 12, 2026' },
  { title: 'Off-Market Deals: Finding Them Before Everyone Else', date: 'Feb 19, 2026' },
  { title: 'The Broker Playbook: Scaling Your Office in 2026', date: 'Jan 22, 2026' },
];

export default function LandingFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer style={{ background: '#080C10', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

      {/* Main footer body */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '72px 64px 48px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.4fr', gap: '48px' }} className="footer-grid">

        {/* Col 1 — Brand + about + contact */}
        <div>
          {/* Logo */}
          <div style={{ marginBottom: '20px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="200" height="40">
              <g transform="translate(20,20)">
                <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
                  fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
              </g>
              <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
                <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
              </text>
            </svg>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, margin: '0 0 24px', maxWidth: '280px' }}>
            The intelligent matching platform for licensed real estate professionals. Surface the right deals, faster.
          </p>

          {/* Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            <a href="mailto:founder.propmatch@gmail.com" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
              founder.propmatch@gmail.com
            </a>
            <a href="tel:2483102114" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.58 2.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.02-.93a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              (248) 310-2114
            </a>
          </div>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {SOCIAL.map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
                title={s.name}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                  transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,219,197,0.1)'; e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = 'rgba(0,219,197,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Col 2 — Platform links */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>Platform</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Dashboard', to: '/Onboarding' },
              { label: 'My Listings', to: '/Onboarding' },
              { label: 'Requirements', to: '/Onboarding' },
              { label: 'Matches', to: '/Onboarding' },
              { label: 'Deal Board', to: '/Onboarding' },
              { label: 'Groups', to: '/Onboarding' },
            ].map(link => (
              <Link key={link.label} to={link.to} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Col 3 — Company links */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>Company</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'About Us', to: '/AboutUs' },
              { label: 'Blog', to: '/Blog' },
              { label: 'Careers', to: '/Careers' },
              { label: 'Affiliate Program', to: '/Affiliate' },
              { label: 'Privacy Policy', to: '/Privacy' },
              { label: 'Terms of Service', to: '/Terms' },
            ].map(link => (
              <Link key={link.label} to={link.to} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{link.label}</Link>
            ))}
          </div>
        </div>

        {/* Col 4 — Newsletter + Blog previews */}
        <div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', margin: '0 0 20px' }}>Stay in the loop</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px', lineHeight: 1.6 }}>
            Get market insights and PropMatch updates delivered to your inbox.
          </p>
          {!subscribed ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px', padding: '9px 12px',
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)',
                  outline: 'none', width: '100%', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => email && setSubscribed(true)}
                style={{
                  background: ACCENT, color: '#111827', border: 'none', borderRadius: '6px',
                  padding: '9px 16px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                Subscribe
              </button>
            </div>
          ) : (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, margin: '0 0 28px' }}>✓ You're subscribed!</p>
          )}

          {/* Recent blog */}
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', margin: '0 0 14px' }}>Recent Articles</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {BLOG_PREVIEWS.map((post, i) => (
              <Link key={i} to="/Blog" style={{ textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.querySelector('.bpt').style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.querySelector('.bpt').style.color = 'rgba(255,255,255,0.5)'}
              >
                <p className="bpt" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 2px', lineHeight: 1.5, transition: 'color 0.2s ease' }}>{post.title}</p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{post.date}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 64px' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
            © 2026 PropMatch, LLC. All rights reserved. For licensed real estate professionals only.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[{ label: 'Privacy Policy', to: '/Privacy' }, { label: 'Terms of Service', to: '/Terms' }].map(l => (
              <Link key={l.label} to={l.to} style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >{l.label}</Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .footer-grid { grid-template-columns: 1fr !important; }
          footer > div { padding-left: 24px !important; padding-right: 24px !important; }
        }
      `}</style>
    </footer>
  );
}