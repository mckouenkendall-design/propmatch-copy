import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

const ACCENT = '#00DBC5';

const HOW = [
  { n: '01', title: 'Get Your Link', body: 'Sign up or log in to PropMatch and grab your unique affiliate referral link from your profile dashboard.' },
  { n: '02', title: 'Share It', body: 'Post it on social media, in your email signature, or share it with colleagues. The more you spread it, the more you earn.' },
  { n: '03', title: 'Earn 10%', body: 'For every agent who signs up through your link and subscribes, you earn 10% of the value of their plan — recurring, every billing cycle.' },
];

export default function Affiliate() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 64px 80px' }}>

        <div style={{ marginBottom: '56px', textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '20px',
          }}>
            Affiliate Program
          </span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#111827', margin: '0 0 16px', lineHeight: 1.1 }}>
            Earn 10% for every agent<br />you bring to PropMatch.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#6B7280', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Know agents who could benefit from PropMatch? Share your link. Earn a recurring 10% commission for as long as they stay subscribed.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '64px' }}>
          {HOW.map((step, i) => (
            <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '28px 24px' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 300, color: ACCENT, display: 'block', marginBottom: '12px' }}>{step.n}</span>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 500, color: '#111827', margin: '0 0 10px' }}>{step.title}</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.65 }}>{step.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: '#0E1318', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '28px', color: '#FFFFFF', margin: '0 0 12px' }}>
            Ready to start earning?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: '0 0 28px' }}>
            The affiliate program is currently invite-based while we finalize the portal. Email us to get early access.
          </p>
          <a href="mailto:propmatch.founder@gmail.com?subject=Affiliate Program Interest" style={{
            display: 'inline-block', background: ACCENT, color: '#111827', padding: '13px 32px',
            borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
            textDecoration: 'none', transition: 'background 0.2s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            Request Affiliate Access
          </a>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}