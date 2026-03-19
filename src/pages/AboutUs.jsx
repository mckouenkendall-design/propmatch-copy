import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';
import { Link } from 'react-router-dom';

const ACCENT = '#00DBC5';

export default function AboutUs() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />

      {/* Hero */}
      <div style={{ background: '#0E1318', padding: '120px 64px 80px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '24px',
          }}>
            About PropMatch
          </span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '52px', color: '#FFFFFF', margin: '0 0 20px', lineHeight: 1.08 }}>
            Built by an agent.<br />Built for agents.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.75, maxWidth: '580px' }}>
            PropMatch was created out of a firsthand frustration with the way real estate has always been done — and a belief that it doesn't have to be that way.
          </p>
        </div>
      </div>

      {/* Founder Story */}
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '72px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '56px', alignItems: 'start' }}>

          {/* Left — name card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '28px', textAlign: 'center', position: 'sticky', top: '100px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,219,197,0.2), rgba(0,219,197,0.05))',
              border: `2px solid rgba(0,219,197,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '24px', fontWeight: 300, color: ACCENT,
            }}>
              K
            </div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>
              Kendall McKouen
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#9CA3AF', margin: '0 0 16px' }}>
              Founder & CEO, PropMatch
            </p>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="mailto:founder.propmatch@gmail.com" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, textDecoration: 'none' }}>
                founder.propmatch@gmail.com
              </a>
            </div>
          </div>

          {/* Right — bio */}
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '32px', color: '#111827', margin: '0 0 24px', lineHeight: 1.2 }}>
              The story behind PropMatch
            </h2>
            {[
              'Kendall Mckouen discovered real estate at 16 — not as a hobby, but as a calling. Long before he had a license, he was studying deal structures, watching market cycles, and figuring out how agents actually made money. That early obsession never left him.',
              'He graduated from Clarkson High School in 2024 and was in the office working part-time just two days after walking the graduation stage. Six months later, he was operating as a full-time commercial real estate agent — a pace that most people spend years building toward.',
              'It was that front-line experience that revealed the problem PropMatch was built to solve. The industry was still relying on the same fragmented, manual workflows it had used for decades. Agents were drowning in spreadsheets, bouncing between MLS, LoopNet, CoStar, and personal rolodexes — manually cross-referencing listings against client requirements and hoping nothing slipped through.',
              '"I kept thinking — I know this property is out there for this client. I just can\'t find it fast enough." That gap between what agents know exists and what they can actually surface in time is where deals die. PropMatch was built to close that gap.',
              'The platform matches every listing against every active client requirement in real time, scoring compatibility across location, property type, budget, size, and custom criteria. It\'s not a search engine. It\'s a match engine — designed by someone who\'s lived the problem it solves.',
            ].map((para, i) => (
              <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#4B5563', lineHeight: 1.85, margin: '0 0 20px' }}>
                {para}
              </p>
            ))}
            <Link to="/Dashboard" style={{
              display: 'inline-block', marginTop: '8px', background: ACCENT, color: '#111827',
              padding: '13px 28px', borderRadius: '6px', fontFamily: "'Inter', sans-serif",
              fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'background 0.2s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
              onMouseLeave={e => e.currentTarget.style.background = ACCENT}
            >
              Join PropMatch →
            </Link>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}