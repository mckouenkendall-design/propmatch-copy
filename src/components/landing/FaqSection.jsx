import React, { useState, useEffect, useRef } from 'react';

const ACCENT = '#00DBC5';

const FAQS = [
  {
    q: 'How does PropMatch find matches for my listings?',
    a: 'PropMatch automatically compares every listing you post against all active client requirements on the platform — scoring them on location, property type, price range, size, and custom criteria. The result is a ranked list of compatible matches delivered to you in real time, no manual searching required.',
  },
  {
    q: 'Can I control who sees my listings and requirements?',
    a: 'Yes. Every post has four visibility settings: Public (visible to all PropMatch members), Brokerage (your firm only), Team (a specific networking group), or Private (invite a specific agent by email). You stay in full control of your deal flow.',
  },
  {
    q: 'Does PropMatch work for both commercial and residential deals?',
    a: 'Absolutely. PropMatch supports the full spectrum — office, retail, industrial/flex, medical, land, single-family, condo, multi-family, townhouse, and more. The matching engine is calibrated separately for each property category so scores are always relevant.',
  },
  {
    q: 'What happens after a match is found — does PropMatch close the deal for me?',
    a: 'PropMatch surfaces the opportunity and connects you with the right agent on the other side. The relationship, negotiation, and closing are yours. We get you in the room — you take it from there.',
  },
  {
    q: 'How do I manage my agents and their activity as a broker?',
    a: 'Brokers get brokerage-level visibility across all agent listings and requirements posted under their firm. You can create private networking groups for your team, monitor deal flow, and ensure listings stay within your brokerage when needed — all from a single dashboard.',
  },
  {
    q: 'Is there a brokerage pricing plan, and can I onboard my whole team?',
    a: 'Yes — our Brokerage Plan is built for firms that want to give every agent on their roster access to PropMatch under one umbrella. Reach out at founder.propmatch@gmail.com to discuss team pricing, onboarding, and custom configurations for your office.',
  },
];

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

export default function FaqSection() {
  const [ref, visible] = useScrollReveal();
  const [open, setOpen] = useState(null);

  return (
    <section ref={ref} style={{ background: '#F9FAFB', padding: '64px 64px 80px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          textAlign: 'center', marginBottom: '56px',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 400,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT,
            border: `1px solid rgba(0,219,197,0.4)`, padding: '4px 12px',
            borderRadius: '4px', background: 'rgba(0,219,197,0.06)', display: 'inline-block', marginBottom: '20px',
          }}>
            FAQ
          </span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '40px', color: '#111827', lineHeight: 1.15, margin: '0 0 16px' }}>
            Questions from agents & brokers
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#6B7280', margin: 0, lineHeight: 1.7 }}>
            Everything you need to know before getting started on PropMatch.
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s, border-color 0.2s ease`,
                  background: '#FFFFFF',
                  border: `1px solid ${isOpen ? 'rgba(0,219,197,0.4)' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: isOpen ? '0 4px 20px rgba(0,219,197,0.08)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: '#111827', lineHeight: 1.4 }}>
                      {faq.q}
                    </span>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={isOpen ? ACCENT : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round"
                    style={{ flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease, stroke 0.2s ease' }}>
                    <line x1="9" y1="3" x2="9" y2="15" /><line x1="3" y1="9" x2="15" y2="9" />
                  </svg>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 24px 20px 24px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#4B5563', lineHeight: 1.75, margin: 0 }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: '48px', textAlign: 'center',
          opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.5s',
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9CA3AF', margin: '0 0 16px' }}>
            Still have questions?
          </p>
          <a href="mailto:founder.propmatch@gmail.com" style={{
            fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
            color: ACCENT, border: `1.5px solid rgba(0,219,197,0.5)`,
            padding: '10px 24px', borderRadius: '6px', textDecoration: 'none',
            transition: 'background 0.2s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,219,197,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Email Us Directly
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          section > div { padding: 0 !important; }
        }
      `}</style>
    </section>
  );
}