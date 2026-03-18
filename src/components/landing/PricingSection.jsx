import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const INDIVIDUAL_FEATURES = [
  'Unlimited listings & requirements',
  'Intelligent match scoring',
  'Saved search templates',
  'Professional network access',
  'Email support',
];

const BROKERAGE_FEATURES = [
  'Everything in Individual',
  'All agents under one subscription',
  'Brokerage-level admin dashboard',
  'Team collaboration tools',
  'A powerful recruiting advantage — agents join brokerages that invest in their tools',
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#00DBC5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="2 7 5.5 10.5 12 3.5" />
    </svg>
  );
}

export default function PricingSection() {
  const [ref, visible] = useScrollReveal(0.12);
  const [hovered1, setHovered1] = useState(false);

  return (
    <section id="pricing" ref={ref} style={{ background: '#FFFFFF', padding: '120px 64px', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '56px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#00DBC5',
            border: '1px solid rgba(41,242,222,0.4)',
            padding: '4px 12px',
            borderRadius: '4px',
            background: 'rgba(41,242,222,0.06)',
            display: 'inline-block',
            marginBottom: '20px',
          }}>
            Pricing
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '46px', color: '#111827', lineHeight: 1.15, margin: '0 0 14px' }}>
            Simple, transparent plans.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#6B7280', margin: 0 }}>
            Whether you're a solo agent or managing an entire brokerage.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '860px', margin: '0 auto 28px' }}>

          {/* Individual Card */}
          <div
            onMouseEnter={() => setHovered1(true)}
            onMouseLeave={() => setHovered1(false)}
            style={{
              border: `1px solid ${hovered1 ? 'rgba(41,242,222,0.5)' : '#E5E7EB'}`,
              borderRadius: '10px',
              padding: '40px 36px',
              boxShadow: hovered1 ? '0 8px 32px rgba(41,242,222,0.12)' : 'none',
              transform: hovered1 ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
              opacity: visible ? 1 : 0,
              transitionDelay: visible ? '0.07s' : '0s',
            }}
          >
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#00DBC5', border: '1px solid rgba(41,242,222,0.4)',
              padding: '4px 12px', borderRadius: '4px', background: 'rgba(41,242,222,0.06)',
              display: 'inline-block', marginBottom: '20px',
            }}>Individual Agent</span>

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '52px', color: '#111827', lineHeight: 1 }}>$99</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9CA3AF' }}>/ month</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              Everything you need to match listings and requirements — built for the solo agent.
            </p>

            <Link to="/Dashboard"
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 400,
                color: '#00DBC5', background: 'transparent',
                border: '1.5px solid #00DBC5', borderRadius: '6px',
                padding: '12px', textDecoration: 'none',
                transition: 'background 0.2s ease, color 0.2s ease', boxSizing: 'border-box',
                marginBottom: '24px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#00DBC5'; e.currentTarget.style.color = '#111827'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00DBC5'; }}
            >
              Get Started
            </Link>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {INDIVIDUAL_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#374151' }}>
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Brokerage Card — Featured */}
          <div style={{
            border: '2px solid #00DBC5',
            borderRadius: '10px',
            padding: '40px 36px',
            position: 'relative',
            boxShadow: '0 0 0 1px #00DBC5, 0 12px 40px rgba(41,242,222,0.12)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1) 0.14s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.14s',
          }}>
            {/* Most Popular label */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              background: '#00DBC5', color: 'white',
              fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 400,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '4px 16px', borderRadius: '0 0 6px 6px',
            }}>
              Most Popular
            </div>

            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#00DBC5', border: '1px solid rgba(41,242,222,0.4)',
              padding: '4px 12px', borderRadius: '4px', background: 'rgba(41,242,222,0.06)',
              display: 'inline-block', marginBottom: '20px',
            }}>Brokerage</span>

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '52px', color: '#111827', lineHeight: 1 }}>Custom</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9CA3AF' }}>pricing</span>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your entire team on one platform. Centralized billing, dedicated onboarding, and admin controls.
            </p>

            <Link to="/Dashboard"
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500,
                color: '#111827', background: '#00DBC5',
                border: 'none', borderRadius: '6px',
                padding: '12px', textDecoration: 'none',
                transition: 'background 0.2s ease', boxSizing: 'border-box',
                marginBottom: '24px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3A8C84'}
              onMouseLeave={e => e.currentTarget.style.background = '#00DBC5'}
            >
              Request a Demo
            </Link>

            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {BROKERAGE_FEATURES.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#374151' }}>
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Solo agent info bar */}
        <div style={{
          maxWidth: '860px', margin: '0 auto',
          background: '#F9FAFB', border: '1px solid #E5E7EB',
          borderRadius: '8px', padding: '20px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px',
          flexWrap: 'wrap',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1) 0.21s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.21s',
        }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>
              Solo agent at a brokerage that hasn't subscribed?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6B7280', margin: 0 }}>
              No problem — individual plans give you full access regardless of your brokerage.
            </p>
          </div>
          <button
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400,
              color: '#374151', background: 'transparent',
              border: '1px solid #E5E7EB', borderRadius: '6px',
              padding: '9px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00DBC5'; e.currentTarget.style.color = '#00DBC5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
          >
            Learn More
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #pricing { padding: 80px 24px !important; }
          #pricing > div > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}