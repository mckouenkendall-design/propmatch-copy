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

const TESTIMONIALS = [
  {
    quote: "I listed a commercial property and it sat quiet for almost a month. Posted it on PropMatch and within two days I had a ranked buyer requirement come through that matched almost perfectly. Ended up being exactly the kind of lead I needed. That one match more than paid for the subscription.",
    name: 'Kendall M.',
    role: 'Commercial Agent, Metro Detroit',
  },
  {
    quote: "My buyer had pretty specific criteria, a certain neighborhood, tight price range, and I honestly wasn't finding much on the traditional platforms. PropMatch surfaced a listing I hadn't seen anywhere else and the match score was high across the board. We closed in under 30 days. Genuinely wish I had found this sooner.",
    name: 'Spencer W.',
    role: 'Residential Agent, Metro Detroit',
  },
  {
    quote: "As a managing broker, what sold me was the recruiting angle. Offering PropMatch as part of our agent toolkit has become one of our strongest talking points when bringing on new agents. It pays for itself.",
    name: 'Diana R.',
    role: 'Managing Broker, Southeast Michigan',
  },
];

export default function TestimonialsSection() {
  const [ref, visible] = useScrollReveal(0.12);
  const [hovered, setHovered] = useState(null);

  return (
    <section id="testimonials" ref={ref} style={{ background: '#F9FAFB', padding: '120px 64px', borderTop: '1px solid #E5E7EB' }}>
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
            border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px',
            borderRadius: '4px',
            background: 'rgba(0,219,197,0.06)',
            display: 'inline-block',
            marginBottom: '20px',
          }}>
            Testimonials
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '46px', color: '#111827', lineHeight: 1.15, margin: 0 }}>
            What agents are saying.
          </h2>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${hovered === i ? 'rgba(0,219,197,0.5)' : '#E5E7EB'}`,
                borderRadius: '8px',
                padding: '32px',
                boxShadow: hovered === i ? '0 8px 32px rgba(0,219,197,0.12)' : 'none',
                transform: hovered === i ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                opacity: visible ? 1 : 0,
                transitionDelay: visible ? `${i * 0.07}s` : '0s',
              }}
            >
              {/* Open quote mark */}
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '48px',
                color: '#00DBC5',
                lineHeight: 1,
                marginBottom: '14px',
                fontWeight: 300,
              }}>
                "
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#4B5563',
                lineHeight: 1.75,
                margin: '0 0 24px',
                flex: 1,
              }}>
                {t.quote}
              </p>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: '#111827', margin: '0 0 4px' }}>
                  {t.name}
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #testimonials { padding: 80px 24px !important; }
          #testimonials > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}