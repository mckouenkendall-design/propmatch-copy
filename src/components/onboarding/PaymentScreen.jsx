import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const ACCENT = '#00DBC5';

const FREE_FEATURES = [
  'Post up to 2 listings & 2 requirements',
  'See your match results',
  "View other agents' public posts",
];
const FREE_LIMITS = [
  'Cannot contact matched agents',
  'Cannot join or create groups',
  'No templates or saved searches',
];
const INDIVIDUAL_FEATURES = [
  'Unlimited listings & requirements',
  'Intelligent match scoring',
  'Contact matched agents directly',
  'Full group & networking access',
  'Saved search templates',
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
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="2 7 5.5 10.5 12 3.5" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
    </svg>
  );
}

export default function PaymentScreen({ isBroker, employingBrokerNumber, onComplete, fromSettings }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [agentCount, setAgentCount] = useState(2);
  const [agentInput, setAgentInput] = useState('2');
  const [selected, setSelected] = useState(isBroker ? 'brokerage' : null);
  const [loading, setLoading] = useState(false);
  const [rosterCheck, setRosterCheck] = useState(null);
  const [checkingRoster, setCheckingRoster] = useState(true);

  // ── Roster verification ──────────────────────────────────────────────────
  // Matches on employing_broker_id (from UserProfile) + license_number (from UserProfile)
  // NOT email — the broker adds agents by license number, not email
  useEffect(() => {
    async function checkRoster() {
      if (isBroker || !user?.employing_broker_id || !user?.license_number) {
        setRosterCheck(false);
        setCheckingRoster(false);
        return;
      }

      try {
        const allRoster = await base44.entities.BrokerageRoster.list();
        const match = allRoster.find(r =>
          r.employing_broker_number === user.employing_broker_id &&
          r.agent_license === user.license_number &&
          r.status === 'active'
        );

        if (match) {
          setRosterCheck(match);
          setSelected('broker_sponsored');
        } else {
          setRosterCheck(false);
        }
      } catch (error) {
        console.error('Roster check error:', error);
        setRosterCheck(false);
      } finally {
        setCheckingRoster(false);
      }
    }

    checkRoster();
  }, [user?.employing_broker_id, user?.license_number, isBroker]);

  // ── Proceed handler ──────────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!selected) return;

    if (selected === 'broker_sponsored') {
      onComplete('broker_sponsored', rosterCheck);
      return;
    }

    if (selected === 'free') {
      onComplete('free');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan: selected,
        billing: isAnnual ? 'annual' : 'monthly',
        agentCount: selected === 'brokerage' ? agentCount : 1,
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        onComplete(selected);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  };

  const getContinueLabel = () => {
    if (loading) return 'Processing...';
    if (!selected) return 'Select a plan to continue';
    if (selected === 'broker_sponsored') return 'Activate Broker-Sponsored Access →';
    if (selected === 'free') return 'Continue with Free →';
    if (selected === 'individual') return 'Continue with Individual →';
    if (selected === 'brokerage') return 'Continue with Brokerage →';
    return 'Continue →';
  };

  const cardBase = {
    borderRadius: '10px',
    padding: '32px 24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  };

  const cardStyle = (plan, isFeatured) => {
    const isSelected = selected === plan;
    if (isFeatured) {
      return {
        ...cardBase,
        border: `2px solid ${ACCENT}`,
        background: isSelected ? 'rgba(0,219,197,0.07)' : 'rgba(0,219,197,0.03)',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(0,219,197,0.4), 0 12px 40px rgba(0,219,197,0.12)'
          : '0 0 0 1px #00DBC5, 0 8px 24px rgba(0,219,197,0.08)',
      };
    }
    return {
      ...cardBase,
      border: `1px solid ${isSelected ? ACCENT : 'rgba(255,255,255,0.1)'}`,
      background: isSelected ? 'rgba(0,219,197,0.06)' : 'rgba(255,255,255,0.02)',
      boxShadow: isSelected ? '0 0 0 1px rgba(0,219,197,0.3)' : 'none',
    };
  };

  const selectedCheckmark = (
    <div style={{ position: 'absolute', top: '12px', right: '12px', width: '18px', height: '18px', borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2 7 5.5 10.5 12 3.5" />
      </svg>
    </div>
  );

  if (checkingRoster) {
    return (
      <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: `3px solid ${ACCENT}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            Checking your broker's plan...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={{ padding: '20px 48px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="160" height="32">
          <g transform="translate(20,20)">
            <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
              fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
          </g>
          <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
            <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
          </text>
        </svg>
        {fromSettings && (
          <button
            onClick={() => navigate('/Settings')}
            style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >
            ← Back to Settings
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ── Broker-Sponsored Banner ── */}
          {rosterCheck && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,219,197,0.15) 0%, rgba(0,219,197,0.05) 100%)',
              border: `2px solid ${ACCENT}`,
              borderRadius: '12px',
              padding: '24px 28px',
              marginBottom: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 300, color: 'white', margin: '0 0 8px' }}>
                    ✨ Great news — your broker has you covered
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: '0 0 16px', lineHeight: 1.6 }}>
                    Your license was found on <strong style={{ color: ACCENT }}>{rosterCheck.brokerage_name || 'your brokerage'}</strong>'s authorized roster.
                    Your subscription is included under their plan at no cost to you.
                  </p>
                  {/* ── ACTIVATE BUTTON — calls handleContinue directly ── */}
                  <button
                    onClick={async () => {
                      setSelected('broker_sponsored');
                      await handleContinue();
                    }}
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#111827',
                      background: ACCENT,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '12px 28px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Activate Your Access →
                  </button>
                </div>
                <div style={{ background: 'rgba(0,219,197,0.12)', border: '1px solid rgba(0,219,197,0.3)', borderRadius: '8px', padding: '10px 18px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: ACCENT, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  ✓ Roster Verified
                </div>
              </div>
            </div>
          )}

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            {isBroker && (
              <div style={{ background: 'rgba(0,219,197,0.08)', border: `1px solid ${ACCENT}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: ACCENT, margin: 0, fontWeight: 500 }}>
                  ✓ You selected your role as Principal Broker
                </p>
              </div>
            )}
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)', display: 'inline-block', marginBottom: '20px' }}>
              {rosterCheck ? 'Or Choose Your Own Plan' : 'Choose Your Plan'}
            </span>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(26px, 3.5vw, 42px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 12px' }}>
              Simple, transparent plans.
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Whether you're a solo agent or managing an entire brokerage.
            </p>
          </div>

          {/* ── Billing Toggle ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '36px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: isAnnual ? 'rgba(255,255,255,0.3)' : '#FFFFFF' }}>Monthly</span>
            <button onClick={() => setIsAnnual(!isAnnual)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: isAnnual ? ACCENT : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.2s ease', padding: 0 }}>
              <span style={{ position: 'absolute', top: '3px', left: isAnnual ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </button>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: isAnnual ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }}>
              Annual <span style={{ color: ACCENT, fontSize: '11px' }}>Save up to 25%</span>
            </span>
          </div>

          {/* ── Plan Cards — all always fully clickable ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }} className="payment-grid">

            {/* Free */}
            <div onClick={() => setSelected('free')} style={cardStyle('free', false)}>
              {selected === 'free' && selectedCheckmark}
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: '4px', display: 'inline-block', marginBottom: '20px' }}>Free</span>
              <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#FFFFFF', lineHeight: 1 }}>$0</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>/ month</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Try the platform with limited access. No credit card required.
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.25)', margin: '0 0 10px' }}>Included</p>
                <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {FREE_FEATURES.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}><CheckIcon />{f}</li>
                  ))}
                </ul>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.25)', margin: '0 0 10px' }}>Not included</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {FREE_LIMITS.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}><XIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Individual */}
            <div onClick={() => setSelected('individual')} style={cardStyle('individual', false)}>
              {selected === 'individual' && selectedCheckmark}
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)', display: 'inline-block', marginBottom: '20px' }}>Individual Agent</span>
              <div style={{ marginBottom: '10px' }}>
                {isAnnual ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' }}>$948/yr</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, color: ACCENT, background: 'rgba(0,219,197,0.08)', border: '1px solid rgba(0,219,197,0.3)', borderRadius: '4px', padding: '2px 8px' }}>Save $99</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#FFFFFF', lineHeight: 1 }}>$849</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>/ yr</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>Billed annually · $70.75/mo</p>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#FFFFFF', lineHeight: 1 }}>$79</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>/ month</span>
                  </div>
                )}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Everything you need to match listings and client requirements, for the cost of taking a client to lunch.
              </p>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {INDIVIDUAL_FEATURES.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Brokerage */}
            <div onClick={() => setSelected('brokerage')} style={cardStyle('brokerage', true)}>
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: ACCENT, color: '#111827', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 16px', borderRadius: '0 0 6px 6px' }}>
                Most Popular
              </div>
              {selected === 'brokerage' && selectedCheckmark}
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)', display: 'inline-block', marginBottom: '20px' }}>Brokerage</span>

              <div style={{ marginBottom: '16px' }} onClick={e => e.stopPropagation()}>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                  How many agents will use PropMatch?
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={agentInput}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setAgentInput(raw);
                    const n = parseInt(raw);
                    if (!isNaN(n) && n >= 2) setAgentCount(n);
                  }}
                  onBlur={() => {
                    const n = parseInt(agentInput);
                    const clamped = isNaN(n) || n < 2 ? 2 : n;
                    setAgentCount(clamped);
                    setAgentInput(String(clamped));
                  }}
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '9px 12px', fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#FFFFFF', outline: 'none', background: 'rgba(255,255,255,0.06)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = ACCENT; setSelected('brokerage'); }}
                  onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>Minimum 2 agents · yourself included.</p>
              </div>

              <div style={{ marginBottom: '6px' }}>
                {isAnnual ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '38px', color: '#FFFFFF', lineHeight: 1 }}>${(agentCount * 708).toLocaleString()}</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>/ yr</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>$59 / agent / mo · billed as ${(agentCount * 708).toLocaleString()} / yr</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, color: ACCENT, background: 'rgba(0,219,197,0.08)', border: '1px solid rgba(0,219,197,0.3)', borderRadius: '4px', padding: '2px 8px' }}>Save 25%</span>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '38px', color: '#FFFFFF', lineHeight: 1 }}>${(agentCount * 64).toLocaleString()}</span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>/ mo</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>$64 / agent / month</p>
                    <span style={{ display: 'inline-block', marginTop: '6px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, color: ACCENT, background: 'rgba(0,219,197,0.08)', border: '1px solid rgba(0,219,197,0.3)', borderRadius: '4px', padding: '2px 8px' }}>Save 19%</span>
                  </>
                )}
              </div>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Give your agents a competitive edge that closes more deals — and a reason to choose your brokerage over the next one.
              </p>
              <div style={{ borderTop: '1px solid rgba(0,219,197,0.2)', paddingTop: '20px' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {BROKERAGE_FEATURES.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}><CheckIcon />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleContinue}
              disabled={!selected || loading}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: (selected && !loading) ? '#111827' : 'rgba(255,255,255,0.2)',
                background: (selected && !loading) ? ACCENT : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: '6px', padding: '14px 40px',
                cursor: (selected && !loading) ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
              }}
            >
              {getContinueLabel()}
            </button>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '12px' }}>
              You can upgrade or change your plan at any time.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .payment-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}