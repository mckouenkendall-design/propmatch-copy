import React, { useEffect, useRef, useState } from 'react';

const ACCENT = '#00DBC5';

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

const STEPS = [
  {
    num: '01',
    title: 'List Your Inventory',
    body: 'Add active listings and client requirements. More detail means smarter matches.',
  },
  {
    num: '02',
    title: 'Receive Ranked Matches',
    body: 'Compatibility scores are calculated instantly across your entire portfolio.',
  },
  {
    num: '03',
    title: 'Close With Confidence',
    body: 'Approach every showing backed by data. Less prospecting, more closings.',
  },
];

export default function HowItWorks() {
  const [ref, visible] = useScrollReveal(0.12);

  return (
    <section id="how-it-works" ref={ref} style={{ background: '#F9FAFB', padding: '120px 64px', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '56px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: `1px solid rgba(0,219,197,0.4)`,
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '20px',
          }}>
            How It Works
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '46px', color: '#111827', lineHeight: 1.15, margin: 0 }}>
            From listing to closing, faster.
          </h2>
        </div>

        {/* Video placeholder */}
        <div style={{
          background: '#0E1318', borderRadius: '8px', aspectRatio: '16/9',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '16px', marginBottom: '56px', border: '1px solid #E5E7EB',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1) 0.07s, transform 0.55s cubic-bezier(0.22,1,0.36,1) 0.07s',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            border: `1.5px solid rgba(0,219,197,0.4)`, background: 'rgba(0,219,197,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            Demo coming soon
          </p>
        </div>

        {/* Step grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #E5E7EB' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              padding: '36px 32px',
              borderRight: i < STEPS.length - 1 ? '1px solid #E5E7EB' : 'none',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `opacity 0.55s cubic-bezier(0.22,1,0.36,1) ${0.14 + i * 0.07}s, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${0.14 + i * 0.07}s`,
            }}>
              {/* Step number — visible, not ghost */}
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 300,
                fontSize: '64px',
                color: 'rgba(0,219,197,0.35)',
                lineHeight: 1,
                marginBottom: '16px',
                letterSpacing: '-2px',
              }}>
                {step.num}
              </div>
              {/* Tiffany circle accent */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: `1px solid ${ACCENT}`, background: 'rgba(0,219,197,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
              </div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '18px', color: '#111827', margin: '0 0 10px' }}>
                {step.title}
              </h4>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #how-it-works { padding: 80px 24px !important; }
          #how-it-works > div > div:last-child { grid-template-columns: 1fr !important; }
          #how-it-works > div > div:last-child > div { border-right: none !important; border-bottom: 1px solid #E5E7EB; }
        }
      `}</style>
    </section>
  );
}