import React, { useEffect, useRef, useState } from 'react';

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

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#29F2DE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
        <circle cx="12" cy="12" r="1.5" fill="#29F2DE" stroke="none" />
      </svg>
    ),
    title: 'Intelligent Matching',
    body: 'Proprietary compatibility scoring analyzes 40+ property attributes against client requirements to surface deals you\'d otherwise miss.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#29F2DE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
        <polyline points="17 16 19 18 23 14" />
      </svg>
    ),
    title: 'Streamlined Workflow',
    body: 'Templates, saved searches, and automated requirement tracking eliminate the manual overhead of managing active buyer and seller pipelines.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#29F2DE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <line x1="8.5" y1="11" x2="15.5" y2="7" />
        <line x1="8.5" y1="13" x2="15.5" y2="17" />
      </svg>
    ),
    title: 'Professional Network',
    body: 'Connect with agents across brokerages, share off-market opportunities, and build co-op relationships through verified professional groups.',
  },
];

export default function FeaturesSection() {
  const [ref, visible] = useScrollReveal(0.12);
  const [hovered, setHovered] = useState(null);

  return (
    <section id="features" ref={ref} style={{ background: '#FFFFFF', padding: '120px 64px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '64px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
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
            display: 'inline-block',
            marginBottom: '20px',
          }}>
            Platform Features
          </span>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 300,
            fontSize: '46px',
            color: '#111827',
            lineHeight: 1.15,
            maxWidth: '520px',
            margin: 0,
          }}>
            Built for the modern real estate professional.
          </h2>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {FEATURES.map((feat, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${hovered === i ? 'rgba(41,242,222,0.5)' : '#E5E7EB'}`,
                borderRadius: '8px',
                padding: '36px 32px',
                cursor: 'default',
                boxShadow: hovered === i ? '0 8px 32px rgba(41,242,222,0.12)' : 'none',
                transform: hovered === i ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                opacity: visible ? 1 : 0,
                transitionDelay: visible ? `${i * 0.07}s` : '0s',
              }}
            >
              <div style={{ marginBottom: '20px' }}>{feat.icon}</div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                fontSize: '22px',
                color: '#111827',
                margin: '0 0 12px',
              }}>
                {feat.title}
              </h3>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: 1.75,
                margin: 0,
              }}>
                {feat.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #features > div > div:last-child { grid-template-columns: 1fr !important; }
          #features { padding: 80px 24px !important; }
        }
      `}</style>
    </section>
  );
}