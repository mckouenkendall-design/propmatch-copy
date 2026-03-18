import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

const ACCENT = '#00DBC5';

const COMMERCIAL_TYPES = ['Office Space', 'Retail', 'Industrial / Flex', 'Medical Office', 'Land'];
const RESIDENTIAL_TYPES = ['Single Family', 'Condo', 'Multi-Family', 'Townhouse'];

const CITIES = [
  'Chicago, IL', 'Austin, TX', 'Miami, FL', 'Nashville, TN', 'Denver, CO',
  'Seattle, WA', 'Atlanta, GA', 'Phoenix, AZ', 'Dallas, TX', 'Boston, MA',
];

const COMMERCIAL_BUDGETS = ['$800,000', '$1,200,000', '$1,750,000', '$2,400,000', '$3,500,000'];
const RESIDENTIAL_BUDGETS = ['$320,000', '$490,000', '$625,000', '$875,000', '$1,100,000'];

const COMMERCIAL_MATCH_DATA = {
  'Office Space':       { addresses: ['1200 Wacker Dr', '233 S Wacker Dr', '120 LaSalle St'],        priceRange: [680000, 1600000] },
  'Retail':             { addresses: ['875 N Michigan Ave', '30 W Monroe St', '203 N LaSalle St'],    priceRange: [550000, 1400000] },
  'Industrial / Flex':  { addresses: ['4200 W Diversey Ave', '2145 W 21st St', '910 S Canal St'],     priceRange: [720000, 1900000] },
  'Medical Office':     { addresses: ['680 N Lake Shore Dr', '1725 W Harrison St', '836 W Wellington'], priceRange: [480000, 1300000] },
  'Land':               { addresses: ['5500 S Cicero Ave', '7300 N Harlem Ave', '3900 W Devon Ave'], priceRange: [300000, 900000] },
};

const RESIDENTIAL_MATCH_DATA = {
  'Single Family':   { addresses: ['4820 N Hermitage Ave', '2341 W Roscoe St', '1612 N Bell Ave'],  priceRange: [280000, 950000] },
  'Condo':           { addresses: ['1 E Erie St #42C', '600 N Dearborn St #18B', '360 W Illinois St #4F'], priceRange: [220000, 800000] },
  'Multi-Family':    { addresses: ['2418 W North Ave', '3311 N Milwaukee Ave', '1720 W Belmont Ave'], priceRange: [500000, 1500000] },
  'Townhouse':       { addresses: ['2140 N Halsted St', '1845 W Webster Ave', '2728 N Magnolia Ave'], priceRange: [390000, 850000] },
};

// Special feature label per property type (4th scoring factor)
const SPECIAL_FEATURES = {
  'Office Space':      'Open floor plan preferred',
  'Retail':            'High foot traffic corridor',
  'Industrial / Flex': 'Loading dock access',
  'Medical Office':    'ADA compliant layout',
  'Land':              'Utility access confirmed',
  'Single Family':     'Garage included',
  'Condo':             'End unit preferred',
  'Multi-Family':      'All units occupied',
  'Townhouse':         'Rooftop deck available',
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmtPrice(n) { return '$' + n.toLocaleString(); }

function generateScenario() {
  const postType = pick(['Listing', 'Requirement']);
  const category = pick(['Commercial', 'Residential']);
  const types = category === 'Commercial' ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;
  const propType = pick(types);
  const city = pick(CITIES);
  const budgets = category === 'Commercial' ? COMMERCIAL_BUDGETS : RESIDENTIAL_BUDGETS;
  const budget = pick(budgets);
  return { postType, category, propType, city, budget };
}

function generateMatches(scenario) {
  const data = scenario.category === 'Commercial'
    ? COMMERCIAL_MATCH_DATA[scenario.propType]
    : RESIDENTIAL_MATCH_DATA[scenario.propType];
  if (!data) return [];
  const [minP, maxP] = data.priceRange;
  const scores = [randInt(94, 98), randInt(81, 93), randInt(62, 80)];
  return data.addresses.map((addr, i) => ({
    address: addr + ', ' + scenario.city.split(',')[0],
    price: fmtPrice(randInt(minP, maxP)),
    match: scores[i],
    reasons: MATCH_REASONS[scenario.propType] || [],
  }));
}

function ScoreRing({ score, animate }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setOffset(circ * (1 - score / 100)), 200);
      return () => clearTimeout(t);
    } else {
      setOffset(circ);
    }
  }, [animate, score, circ]);

  return (
    <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={ACCENT} strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 26 26)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: ACCENT,
      }}>{score}%</span>
    </div>
  );
}

function MatchBreakdown({ match, propType, onClose }) {
  const reasons = match.reasons.slice(0, 4);
  const weights = [32, 28, 22, 18];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(14,19,24,0.97)', borderRadius: '8px',
      padding: '20px 22px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white' }}>
          Match Breakdown
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '18px', lineHeight: 1, padding: '2px 6px' }}>×</button>
      </div>
      <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'rgba(0,219,197,0.08)', border: `1px solid rgba(0,219,197,0.2)`, borderRadius: '6px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>{match.address}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 300, color: ACCENT }}>{match.match}%</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>compatibility score</span>
        </div>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>
        Scoring factors
      </p>
      {reasons.map((r, i) => (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>{r}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: ACCENT }}>{weights[i]}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
            <div style={{ height: '100%', width: `${weights[i] * 2.8}%`, background: ACCENT, borderRadius: '3px', transition: 'width 0.8s ease' }} />
          </div>
        </div>
      ))}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '14px' }}>
        Score based on {propType} attribute compatibility across location, price, size, and usage requirements.
      </p>
    </div>
  );
}

export default function HeroSection() {
  const [scenario, setScenario] = useState(() => generateScenario());
  const [demoState, setDemoState] = useState('idle'); // idle | searching | results
  const [matches, setMatches] = useState([]);
  const [visibleMatches, setVisibleMatches] = useState([]);
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [phase, setPhase] = useState(0);

  // Load animation
  useEffect(() => {
    const timers = [0, 120, 240, 360, 480].map((delay, i) =>
      setTimeout(() => setPhase(p => Math.max(p, i + 1)), delay + 100)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleFind = () => {
    setDemoState('searching');
    setVisibleMatches([]);
    setExpandedMatch(null);
    const generated = generateMatches(scenario);
    setMatches(generated);
    setTimeout(() => {
      setDemoState('results');
      generated.forEach((_, i) => {
        setTimeout(() => setVisibleMatches(r => [...r, i]), i * 150);
      });
    }, 1500);
  };

  const tagStyle = (color = ACCENT, bg = 'rgba(0,219,197,0.06)', border = 'rgba(0,219,197,0.35)') => ({
    display: 'inline-block',
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color,
    background: bg,
    border: `1px solid ${border}`,
    padding: '3px 8px',
    borderRadius: '4px',
  });

  const labelStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.3)',
    display: 'block',
    marginBottom: '5px',
  };

  const fieldVal = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.85)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '9px 12px',
    width: '100%',
    boxSizing: 'border-box',
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
      {/* Radial glow */}
      <div style={{
        position: 'absolute', right: '5%', top: '50%', transform: 'translateY(-50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(ellipse at center, rgba(0,219,197,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', paddingTop: '68px' }}>

        {/* Left Column */}
        <div>
          <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)', marginBottom: '28px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)' }}>
              For Licensed Real Estate Professionals
            </span>
          </div>

          <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)', marginBottom: '24px' }}>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(48px, 5.5vw, 72px)', color: '#FFFFFF', lineHeight: 1.08, margin: 0 }}>
              Built for Connections.<br />Designed for Closings.
            </h1>
          </div>

          <div style={{ opacity: phase >= 3 ? 1 : 0, transform: phase >= 3 ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)', marginBottom: '36px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: '440px', margin: 0 }}>
              PropMatch intelligently pairs property listings with client requirements — so you spend less time searching and more time closing.
            </p>
          </div>

          <div style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link to="/Dashboard" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', background: ACCENT, padding: '13px 28px', borderRadius: '6px', textDecoration: 'none', transition: 'background 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
              onMouseLeave={e => e.currentTarget.style.background = ACCENT}>
              Join PropMatch
            </Link>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'white', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.3)', padding: '13px 28px', borderRadius: '6px', cursor: 'pointer', transition: 'border-color 0.2s ease, color 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'white'; }}>
              See It In Action
            </button>
          </div>
        </div>

        {/* Right Column — Demo Widget */}
        <div style={{ opacity: phase >= 5 ? 1 : 0, transform: phase >= 5 ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>

            {/* Top bar */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ACCENT, boxShadow: `0 0 6px ${ACCENT}`, animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>
                Live Match Engine Demo
              </span>
              <button
                onClick={() => { setScenario(generateScenario()); setDemoState('idle'); setVisibleMatches([]); setExpandedMatch(null); }}
                style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', padding: '4px 10px', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'background 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                title="Generate new scenario"
              >
                Shuffle
              </button>
            </div>

            {/* Scenario display — read only fields */}
            <div style={{ padding: '20px 22px 16px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', margin: '0 0 12px' }}>
                Randomly generated scenario — hit Find Matches to run it
              </p>

              {/* Row 1: Post type + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Post Type</label>
                  <div style={fieldVal}>
                    <span style={tagStyle(scenario.postType === 'Listing' ? '#00DBC5' : 'rgba(255,255,255,0.6)', scenario.postType === 'Listing' ? 'rgba(0,219,197,0.1)' : 'rgba(255,255,255,0.06)', scenario.postType === 'Listing' ? 'rgba(0,219,197,0.3)' : 'rgba(255,255,255,0.15)')}>
                      {scenario.postType}
                    </span>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <div style={fieldVal}>{scenario.category}</div>
                </div>
              </div>

              {/* Row 2: Prop type + City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>Property Type</label>
                  <div style={fieldVal}>{scenario.propType}</div>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <div style={fieldVal}>{scenario.city}</div>
                </div>
              </div>

              {/* Row 3: Budget */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Max Budget</label>
                <div style={fieldVal}>{scenario.budget}</div>
              </div>

              <button
                onClick={handleFind}
                style={{
                  width: '100%', background: ACCENT, color: '#111827', border: 'none',
                  borderRadius: '6px', padding: '11px',
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#00b8a7'}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                Find Matches →
              </button>
            </div>

            {/* Results area */}
            <div style={{ minHeight: '180px', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '18px 22px 22px', position: 'relative' }}>

              {expandedMatch !== null && (
                <MatchBreakdown
                  match={matches[expandedMatch]}
                  propType={scenario.propType}
                  onClose={() => setExpandedMatch(null)}
                />
              )}

              {demoState === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px', gap: '10px' }}>
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="14" cy="14" r="9" /><line x1="21" y1="21" x2="27" y2="27" />
                  </svg>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.22)', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    Click Find Matches to run<br />the compatibility engine
                  </p>
                </div>
              )}

              {demoState === 'searching' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT, animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    Analyzing compatibility vectors…
                  </p>
                </div>
              )}

              {demoState === 'results' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <ScoreRing score={matches[0]?.match || 96} animate={demoState === 'results'} />
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 500, color: 'white', margin: '0 0 3px' }}>
                        {matches.length} matches found
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        {scenario.propType} · {scenario.city} · up to {scenario.budget}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {matches.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => setExpandedMatch(i)}
                        style={{
                          padding: '10px 13px',
                          borderRadius: '6px',
                          border: i === 0 ? `1px solid rgba(0,219,197,0.25)` : '1px solid rgba(255,255,255,0.07)',
                          background: i === 0 ? 'rgba(0,219,197,0.07)' : 'rgba(255,255,255,0.03)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          cursor: 'pointer',
                          opacity: visibleMatches.includes(i) ? 1 : 0,
                          transform: visibleMatches.includes(i) ? 'translateY(0)' : 'translateY(10px)',
                          transition: 'opacity 0.4s ease, transform 0.4s ease, border-color 0.2s ease, background 0.2s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(0,219,197,0.4)`; e.currentTarget.style.background = 'rgba(0,219,197,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = i === 0 ? `rgba(0,219,197,0.25)` : 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = i === 0 ? 'rgba(0,219,197,0.07)' : 'rgba(255,255,255,0.03)'; }}
                      >
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>{r.address}</p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{r.price} · <span style={{ color: ACCENT, fontSize: '10px' }}>View breakdown →</span></p>
                        </div>
                        <span style={{
                          fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, color: ACCENT,
                          background: 'rgba(0,219,197,0.1)', border: `1px solid rgba(0,219,197,0.25)`,
                          padding: '3px 8px', borderRadius: '4px', flexShrink: 0,
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
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce-dot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @media (max-width: 768px) {
          section { padding: 80px 24px !important; }
          section > div { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}