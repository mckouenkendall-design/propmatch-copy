import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

const PROPERTY_TYPES = ['Office Space', 'Retail', 'Industrial', 'Single Family', 'Multi-Family', 'Condo'];
const CITIES = ['Detroit, MI', 'Ann Arbor, MI', 'Troy, MI', 'Bloomfield Hills, MI', 'Rochester Hills, MI'];
const BUDGETS = ['$250,000', '$500,000', '$750,000', '$1,200,000', '$2,500,000'];

const MOCK_RESULTS = [
  { address: '4820 Woodward Ave, Detroit', price: '$485,000', match: 94 },
  { address: '211 W Fort St, Detroit', price: '$512,000', match: 88 },
  { address: '1901 St Antoine St, Detroit', price: '$467,500', match: 81 },
];

export default function HeroSection() {
  const [propType, setPropType] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const [state, setState] = useState('idle'); // idle | searching | results
  const [visibleResults, setVisibleResults] = useState([]);

  // Load animation phases
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [0, 120, 240, 360, 480].map((delay, i) =>
      setTimeout(() => setPhase(p => Math.max(p, i + 1)), delay + 100)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleFind = () => {
    if (!propType && !city && !budget) return;
    setState('searching');
    setVisibleResults([]);
    setTimeout(() => {
      setState('results');
      MOCK_RESULTS.forEach((_, i) => {
        setTimeout(() => setVisibleResults(r => [...r, i]), i * 120);
      });
    }, 1600);
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '10px 12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    outline: 'none',
    fontWeight: 300,
  };

  const labelStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.3)',
    display: 'block',
    marginBottom: '6px',
  };

  return (
    <section style={{
      background: '#0E1318',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      padding: '0 64px',
      position: 'relative',
    }}>
      {/* Radial glow behind right column */}
      <div style={{
        position: 'absolute',
        right: '5%',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(ellipse at center, rgba(41,242,222,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', paddingTop: '68px' }}>

        {/* Left Column */}
        <div>
          {/* Tag label */}
          <div style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            marginBottom: '28px',
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#29F2DE',
              border: '1px solid rgba(41,242,222,0.4)',
              padding: '4px 12px',
              borderRadius: '4px',
              background: 'rgba(41,242,222,0.06)',
            }}>
              For Licensed Real Estate Professionals
            </span>
          </div>

          {/* H1 */}
          <div style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            marginBottom: '24px',
          }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 300,
              fontSize: 'clamp(48px, 5.5vw, 72px)',
              color: '#FFFFFF',
              lineHeight: 1.08,
              margin: 0,
            }}>
              Built for Connections.<br />
              Designed for Closings.
            </h1>
          </div>

          {/* Subheadline */}
          <div style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            marginBottom: '36px',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '17px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.7,
              maxWidth: '440px',
              margin: 0,
            }}>
              PropMatch intelligently pairs property listings with client requirements — so you spend less time searching and more time closing.
            </p>
          </div>

          {/* Buttons */}
          <div style={{
            opacity: phase >= 4 ? 1 : 0,
            transform: phase >= 4 ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/Dashboard"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#111827',
                background: '#29F2DE',
                padding: '13px 28px',
                borderRadius: '6px',
                textDecoration: 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#3A8C84'}
              onMouseLeave={e => e.currentTarget.style.background = '#29F2DE'}
            >
              Join PropMatch
            </Link>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 400,
                color: 'white',
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.3)',
                padding: '13px 28px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, color 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#29F2DE'; e.currentTarget.style.color = '#29F2DE'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'white'; }}
            >
              See It In Action
            </button>
          </div>
        </div>

        {/* Right Column — Demo Widget */}
        <div style={{
          opacity: phase >= 5 ? 1 : 0,
          transform: phase >= 5 ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {/* Widget top bar */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#29F2DE',
                boxShadow: '0 0 6px #29F2DE',
                animation: 'pulse-dot 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                Live Match Engine Demo
              </span>
            </div>

            {/* Widget inputs */}
            <div style={{ padding: '24px 24px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>Property Type</label>
                  <select value={propType} onChange={e => setPropType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Any</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <select value={city} onChange={e => setCity(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Any</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Max Budget</label>
                  <select value={budget} onChange={e => setBudget(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Any</option>
                    {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={handleFind}
                style={{
                  width: '100%',
                  background: '#29F2DE',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '11px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#3A8C84'}
                onMouseLeave={e => e.currentTarget.style.background = '#29F2DE'}
              >
                Find Matches →
              </button>
            </div>

            {/* Results area */}
            <div style={{ minHeight: '200px', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px 24px' }}>
              {state === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', gap: '10px' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="14" cy="14" r="9" />
                    <line x1="21" y1="21" x2="27" y2="27" />
                  </svg>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    Enter criteria above to see<br />intelligent property matches
                  </p>
                </div>
              )}

              {state === 'searching' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: '#29F2DE',
                        animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    Analyzing compatibility vectors…
                  </p>
                </div>
              )}

              {state === 'results' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <ScoreRing score={94} />
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 4px' }}>
                        {MOCK_RESULTS.length} matches found
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                        {city || 'Detroit area'} · up to {budget || '$500,000'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOCK_RESULTS.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: i === 0 ? '1px solid rgba(41,242,222,0.25)' : '1px solid rgba(255,255,255,0.07)',
                          background: i === 0 ? 'rgba(41,242,222,0.08)' : 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: visibleResults.includes(i) ? 1 : 0,
                          transform: visibleResults.includes(i) ? 'translateY(0)' : 'translateY(10px)',
                          transition: 'opacity 0.4s ease, transform 0.4s ease',
                        }}
                      >
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>{r.address}</p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{r.price}</p>
                        </div>
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#29F2DE',
                          background: 'rgba(41,242,222,0.1)',
                          border: '1px solid rgba(41,242,222,0.25)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}>
                          {r.match}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @media (max-width: 768px) {
          section[data-section="hero"] { padding: 80px 24px !important; }
        }
      `}</style>
    </section>
  );
}

function ScoreRing({ score }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ * (1 - score / 100)), 200);
    return () => clearTimeout(t);
  }, [score, circ]);

  return (
    <div style={{ position: 'relative', width: '58px', height: '58px', flexShrink: 0 }}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="29" cy="29" r={r} fill="none" stroke="#29F2DE" strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#29F2DE',
      }}>
        {score}%
      </span>
    </div>
  );
}