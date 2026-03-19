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

export default function CtaSection() {
  const [ref, visible] = useScrollReveal(0.12);

  return (
    <section id="cta" ref={ref} style={{ background: '#0E1318', padding: '120px 64px', position: 'relative', overflow: 'hidden' }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '700px', height: '500px',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,219,197,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
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
          marginBottom: '28px',
        }}>
          Early Access Now Open
        </span>

        <h2 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 300,
          fontSize: 'clamp(42px, 5.5vw, 68px)',
          color: '#FFFFFF',
          lineHeight: 1.1,
          margin: '0 0 20px',
        }}>
          Your competitive edge starts here.
        </h2>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}>
          PropMatch is exclusively available to licensed real estate agents. Join today and transform how you match properties with clients.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <Link to="/Onboarding"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#111827',
              background: '#00DBC5',
              padding: '13px 28px',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#3A8C84'}
            onMouseLeave={e => e.currentTarget.style.background = '#00DBC5'}
          >
            Join PropMatch
          </Link>
          <Link to="/Onboarding"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: 400,
              color: 'white',
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.3)',
              padding: '13px 28px',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00DBC5'; e.currentTarget.style.color = '#00DBC5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'white'; }}
          >
            Request a Demo
          </Link>
        </div>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.05em',
          margin: 0,
        }}>
          Broker ID verification required
        </p>
      </div>
    </section>
  );
}