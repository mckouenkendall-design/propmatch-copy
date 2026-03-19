import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ACCENT = '#00DBC5';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    badge: null,
    description: 'Get started with the basics. No credit card required.',
    features: [
      'Up to 3 active listings',
      'Up to 3 active requirements',
      'Basic match notifications',
      'Access to public groups',
    ],
    limitations: [
      'No deal board access',
      'No brokerage tools',
      'No priority support',
    ],
    cta: 'Start for free',
    highlight: false,
  },
  {
    id: 'individual',
    name: 'Individual',
    price: '$29',
    period: 'per month',
    badge: 'Most Popular',
    description: 'The full platform for solo agents who want every edge.',
    features: [
      'Unlimited listings & requirements',
      'Priority match notifications',
      'Full deal board access',
      'All groups & events',
      'Saved search templates',
      'Email & phone support',
    ],
    limitations: [],
    cta: 'Start Individual',
    highlight: true,
  },
  {
    id: 'brokerage',
    name: 'Brokerage',
    price: '$79',
    period: 'per month',
    badge: 'For Teams',
    description: 'Admin controls, team visibility, and brokerage-level analytics.',
    features: [
      'Everything in Individual',
      'Broker admin dashboard',
      'Team listing & requirement sharing',
      'Brokerage-only visibility controls',
      'Agent seat management',
      'Priority onboarding support',
    ],
    limitations: [],
    cta: 'Start Brokerage',
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function PaymentScreen({ isBroker, onComplete }) {
  const [selected, setSelected] = useState(isBroker ? 'brokerage' : 'individual');
  const [billing, setBilling] = useState('monthly'); // monthly | annual

  const discount = 0.17; // ~2 months free annually

  const getPrice = (plan) => {
    if (plan.id === 'free') return '$0';
    const base = plan.id === 'individual' ? 29 : 79;
    if (billing === 'annual') return `$${Math.round(base * (1 - discount))}`;
    return `$${base}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '20px 48px', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="160" height="32">
          <g transform="translate(20,20)">
            <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
              fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
          </g>
          <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
            <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
          </text>
        </svg>
        <button
          onClick={() => onComplete('free')}
          style={{
            marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '13px',
            color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
            cursor: 'pointer', transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          Skip for now
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 72px', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '20px',
          }}>Choose Your Plan</span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(26px, 3.5vw, 40px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 12px' }}>
            Start your PropMatch journey
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 32px', maxWidth: '480px' }}>
            All plans include a 14-day free trial. No credit card required to start.
          </p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
            {['monthly', 'annual'].map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500,
                  padding: '7px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: billing === b ? ACCENT : 'transparent',
                  color: billing === b ? '#111827' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span style={{
                    fontSize: '10px', background: billing === 'annual' ? 'rgba(0,0,0,0.15)' : 'rgba(0,219,197,0.15)',
                    color: billing === 'annual' ? '#111827' : ACCENT,
                    padding: '1px 6px', borderRadius: '4px',
                  }}>Save 17%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%', maxWidth: '920px' }} className="payment-grid">
          {PLANS.map(plan => {
            const isSelected = selected === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                style={{
                  border: `1.5px solid ${isSelected ? ACCENT : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '12px', padding: '28px 24px', cursor: 'pointer',
                  background: isSelected ? 'rgba(0,219,197,0.04)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected ? `0 0 0 1px ${ACCENT}22` : 'none',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
                    fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    background: plan.highlight ? ACCENT : 'rgba(255,255,255,0.12)',
                    color: plan.highlight ? '#111827' : 'rgba(255,255,255,0.7)',
                    padding: '3px 12px', borderRadius: '4px', whiteSpace: 'nowrap',
                  }}>{plan.badge}</div>
                )}

                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 400, color: isSelected ? ACCENT : 'rgba(255,255,255,0.8)', margin: '0 0 8px' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: '#FFFFFF' }}>{getPrice(plan)}</span>
                  {plan.id !== 'free' && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                      /{billing === 'annual' ? 'mo, billed annually' : 'month'}
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: '0 0 20px', lineHeight: 1.5 }}>{plan.description}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <CheckIcon />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                  {plan.limitations.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <XIcon />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{
                  width: '100%', padding: '11px', borderRadius: '6px', textAlign: 'center',
                  background: isSelected ? ACCENT : 'rgba(255,255,255,0.06)',
                  color: isSelected ? '#111827' : 'rgba(255,255,255,0.4)',
                  fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'all 0.2s ease',
                }}>
                  {isSelected ? '✓ Selected' : plan.cta}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <button
            onClick={() => onComplete(selected)}
            style={{
              fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: '#111827', background: ACCENT,
              border: 'none', borderRadius: '8px',
              padding: '14px 48px', cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            Continue with {PLANS.find(p => p.id === selected)?.name} →
          </button>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '14px' }}>
            14-day free trial on paid plans · Cancel anytime · No credit card required to start
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .payment-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}