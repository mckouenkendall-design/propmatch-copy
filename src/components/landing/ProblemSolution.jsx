import React, { useEffect, useRef, useState } from 'react';

const SOURCE_TAGS = ['MLS', 'Zillow', 'LoopNet', 'CoStar', 'Craigslist', 'Personal CRM', 'Spreadsheets', 'Rolodex / Connections'];

const STAT_BARS = [
  { label: 'Time lost on manual matching', pct: 62 },
  { label: 'Listings without qualified inquiries', pct: 48 },
  { label: 'Deals lost to competing agents', pct: 34 },
];

// Residential mock data (6 months)
const RES_DATA = [38, 52, 47, 68, 74, 89];
const COM_DATA = [22, 31, 28, 41, 38, 55];
const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const W = 340, H = 150, PAD = { l: 46, r: 20, t: 16, b: 28 };

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

function StatBar({ label, pct, visible, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setWidth(pct), delay);
      return () => clearTimeout(t);
    } else {
      setWidth(0);
    }
  }, [visible, pct, delay]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#00DBC5' }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: '#00DBC5',
          borderRadius: '3px',
          transition: `width 1.1s cubic-bezier(0.22,1,0.36,1)`,
        }} />
      </div>
    </div>
  );
}

function LineChart({ visible }) {
  const totalLen = 600;
  const [dashOffset, setDashOffset] = useState(totalLen);
  const [dashOffset2, setDashOffset2] = useState(totalLen);

  useEffect(() => {
    if (visible) {
      const t1 = setTimeout(() => setDashOffset(0), 100);
      const t2 = setTimeout(() => setDashOffset2(0), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setDashOffset(totalLen);
      setDashOffset2(totalLen);
    }
  }, [visible]);

  const minV = 0, maxV = 100;
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const xs = RES_DATA.map((_, i) => PAD.l + (i / (RES_DATA.length - 1)) * chartW);
  const ys = (arr) => arr.map(v => PAD.t + chartH - ((v - minV) / (maxV - minV)) * chartH);

  const polyline = (arr) => xs.map((x, i) => `${x},${ys(arr)[i]}`).join(' ');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '20px 24px',
      marginTop: '28px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>
          Matches Surfaced Per Month — Sample Data
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
          Number of listing ↔ requirement matches automatically found by PropMatch
        </p>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Y-axis gridlines + labels */}
        {[0, 25, 50, 75, 100].map((v, i) => {
          const y = PAD.t + chartH - ((v - minV) / (maxV - minV)) * chartH;
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PAD.l - 6} y={y + 3.5} textAnchor="end"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', fill: 'rgba(255,255,255,0.22)' }}>
                {v}
              </text>
            </g>
          );
        })}
        {/* Residential line */}
        <polyline points={polyline(RES_DATA)} fill="none" stroke="#00DBC5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={totalLen} strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
        {/* Dots + value labels on residential */}
        {xs.map((x, i) => (
          <g key={i} style={{ opacity: dashOffset === 0 ? 1 : 0, transition: `opacity 0.3s ease ${0.8 + i * 0.08}s` }}>
            <circle cx={x} cy={ys(RES_DATA)[i]} r="3.5" fill="#00DBC5" />
            <text x={x} y={ys(RES_DATA)[i] - 8} textAnchor="middle"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', fill: 'rgba(0,219,197,0.7)' }}>
              {RES_DATA[i]}
            </text>
          </g>
        ))}
        {/* Commercial line (dashed) */}
        <polyline points={polyline(COM_DATA)} fill="none" stroke="rgba(0,219,197,0.35)" strokeWidth="1.5"
          strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots on commercial */}
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys(COM_DATA)[i]} r="2.5" fill="rgba(0,219,197,0.4)"
            style={{ opacity: dashOffset2 === 0 ? 1 : 0, transition: `opacity 0.3s ease ${1 + i * 0.08}s` }}
          />
        ))}
        {/* X-axis labels */}
        {MONTHS.map((m, i) => (
          <text key={m} x={xs[i]} y={H - 2} textAnchor="middle"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fill: 'rgba(255,255,255,0.25)' }}>
            {m}
          </text>
        ))}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '2px', background: '#00DBC5', borderRadius: '2px' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Residential</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '1.5px', background: 'rgba(0,219,197,0.35)', borderRadius: '2px', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,219,197,0.35) 0px, rgba(0,219,197,0.35) 5px, transparent 5px, transparent 9px)' }} />
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Commercial</span>
        </div>
      </div>
    </div>
  );
}

export default function ProblemSolution() {
  const [ref, visible] = useScrollReveal(0.12);

  const tagStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    fontWeight: 400,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#00DBC5',
    border: '1px solid rgba(0,219,197,0.4)',
    padding: '4px 12px',
    borderRadius: '4px',
    background: 'rgba(0,219,197,0.06)',
    display: 'inline-block',
    marginBottom: '24px',
  };

  return (
    <section ref={ref} style={{ background: '#0E1318', padding: '120px 64px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>

        {/* Left — Problem */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <span style={tagStyle}>The Problem</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '42px', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 20px' }}>
            Agents are drowning in disconnected sources.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: '0 0 28px' }}>
            When a client hands you a requirement, finding the right match means manually searching across every platform you have — and hoping nothing falls through the cracks.
          </p>
          {/* Source tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '36px' }}>
            {SOURCE_TAGS.map(tag => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                padding: '7px 14px',
              }}>
                {tag}
              </span>
            ))}
          </div>
          {/* Stat bars */}
          {STAT_BARS.map((bar, i) => (
            <StatBar key={bar.label} label={bar.label} pct={bar.pct} visible={visible} delay={i * 150} />
          ))}
        </div>

        {/* Right — Solution */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s',
        }}>
          <span style={tagStyle}>The Solution</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '42px', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 20px' }}>
            One intelligent platform. Every match, ranked.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>
            PropMatch is a professional-grade platform that automatically calculates compatibility between every listing and every client requirement in your portfolio — surfacing ranked, actionable matches in real time.
          </p>
          <LineChart visible={visible} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          section[data-ps] > div { grid-template-columns: 1fr !important; gap: 60px !important; }
        }
      `}</style>
    </section>
  );
}