import React, { useState } from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

const ACCENT = '#00DBC5';

const ROLES = [
  {
    title: 'Growth & Partnerships Manager',
    type: 'Full-Time · Remote',
    desc: 'Own agent acquisition and brokerage partnerships. You\'ll be the face of PropMatch in new markets, building relationships that drive platform growth.',
  },
  {
    title: 'Full-Stack Engineer',
    type: 'Full-Time · Remote',
    desc: 'Help build the matching engine, agent tools, and platform infrastructure. You\'ll work closely with the founder to ship features that agents actually use.',
  },
  {
    title: 'Real Estate Content Writer',
    type: 'Contract · Remote',
    desc: 'Write high-quality educational content for agents and brokers — market insights, platform guides, and long-form articles that build authority in the CRE space.',
  },
  {
    title: 'Customer Success Associate',
    type: 'Part-Time · Remote',
    desc: 'Be the first point of contact for agents onboarding to PropMatch. Help them post, match, and close — and bring their feedback back to the product team.',
  },
];

export default function Careers() {
  const [applied, setApplied] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 64px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '20px',
          }}>
            Careers
          </span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#111827', margin: '0 0 16px' }}>
            Build the future of real estate.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#6B7280', maxWidth: '520px', lineHeight: 1.7, margin: 0 }}>
            PropMatch is early-stage and growing fast. We're looking for hungry, self-directed people who want to be part of something being built from the ground up.
          </p>
        </div>

        {/* Roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '64px' }}>
          {ROLES.map((role, i) => (
            <div key={i} style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px',
              padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
              flexWrap: 'wrap',
            }}>
              <div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 500, color: '#111827', margin: '0 0 6px' }}>
                  {role.title}
                </h3>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: ACCENT, background: 'rgba(0,219,197,0.07)', border: '1px solid rgba(0,219,197,0.2)', padding: '2px 8px', borderRadius: '4px', marginBottom: '10px', display: 'inline-block' }}>
                  {role.type}
                </span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6B7280', margin: '8px 0 0', lineHeight: 1.65, maxWidth: '560px' }}>
                  {role.desc}
                </p>
              </div>
              <button
                onClick={() => setApplied(role.title)}
                style={{
                  background: ACCENT, color: '#111827', border: 'none', borderRadius: '6px',
                  padding: '10px 22px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                Apply
              </button>
            </div>
          ))}
        </div>

        {/* Apply form */}
        {applied && (
          <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,219,197,0.3)', borderRadius: '10px', padding: '32px' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: '#111827', margin: '0 0 6px' }}>
              Applying for: {applied}
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9CA3AF', margin: '0 0 24px' }}>
              Send us a quick note — we'll follow up within 48 hours.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[['Full Name', 'name', 'text'], ['Email Address', 'email', 'email']].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>Why are you a great fit?</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '14px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <a href={`mailto:founder.propmatch@gmail.com?subject=Application: ${applied}&body=Name: ${form.name}%0AEmail: ${form.email}%0A%0A${form.message}`}
                style={{
                  display: 'inline-block', background: ACCENT, color: '#111827', padding: '12px 28px',
                  borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                  textDecoration: 'none', textAlign: 'center', transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                Send Application
              </a>
            </div>
          </div>
        )}

        {/* General */}
        <div style={{ marginTop: '48px', padding: '28px', background: 'rgba(0,219,197,0.04)', border: '1px solid rgba(0,219,197,0.15)', borderRadius: '10px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', margin: '0 0 8px' }}>
            Don't see your role? We're always open to hearing from driven people.
          </p>
          <a href="mailto:founder.propmatch@gmail.com" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, fontWeight: 500, textDecoration: 'none' }}>
            founder.propmatch@gmail.com
          </a>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}