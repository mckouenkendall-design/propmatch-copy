import React, { useEffect, useRef, useState } from 'react';

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Intelligent Matching Engine',
    desc: 'Our algorithm compares dozens of attributes — property type, size, budget, location, amenities — and returns a compatibility score so you focus on the right opportunities first.',
    highlight: '94% accuracy',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Verified Agent Network',
    desc: 'Every user is verified against their state broker ID. Connect, collaborate, and co-broker with confidence — knowing every agent on the platform is licensed and legitimate.',
    highlight: 'License verified',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    title: 'Deal Board & Pipeline',
    desc: 'Track every deal from introduction to close. A visual Kanban-style board keeps your pipeline organized, your follow-ups timely, and your commissions visible.',
    highlight: 'Full pipeline view',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Agent-to-Agent Messaging',
    desc: 'Communicate directly with agents whose listings or requirements match yours. No email chains, no cold calls — just clean, contextual conversations around a deal.',
    highlight: 'In-platform comms',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
    title: 'Market Insights & Analytics',
    desc: 'Know your market. See trends in demand by area, property type, and price range. Use live data to advise your clients with authority and close deals faster.',
    highlight: 'Live market data',
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Visibility Controls',
    desc: 'Choose who sees each listing or requirement — public, team-only, brokerage-only, or private. Share selectively and protect sensitive client information at all times.',
    highlight: 'Granular privacy',
  },
];

export default function FeaturesSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-16 fade-in-up ${visible ? 'visible' : ''}`}>
          <p className="font-inter text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4FB3A9' }}>
            Platform Features
          </p>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to <span style={{ color: '#4FB3A9' }}>close more deals</span>
          </h2>
          <p className="font-inter text-lg text-gray-500 max-w-2xl mx-auto">
            Built specifically for real estate professionals — no bloat, no fluff. Just the tools that move deals forward.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveCard(i)}
              onMouseLeave={() => setActiveCard(null)}
              className={`p-6 rounded-xl border cursor-default transition-all duration-300 fade-in-up stagger-${Math.min(i + 1, 5)} ${visible ? 'visible' : ''}`}
              style={{
                borderColor: activeCard === i ? '#4FB3A9' : '#E5E7EB',
                background: activeCard === i ? '#F0FAFA' : 'white',
                boxShadow: activeCard === i ? '0 8px 30px rgba(79,179,169,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
                transform: activeCard === i ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300"
                style={{
                  background: activeCard === i ? 'linear-gradient(135deg, #4FB3A9, #3A8A82)' : '#E8F7F6',
                  color: activeCard === i ? 'white' : '#4FB3A9',
                }}
              >
                {feat.icon}
              </div>
              <div
                className="inline-block text-xs font-semibold font-inter px-2 py-0.5 rounded mb-3"
                style={{ background: '#E8F7F6', color: '#3A8A82' }}
              >
                {feat.highlight}
              </div>
              <h3 className="font-inter font-semibold text-gray-900 text-lg mb-2">{feat.title}</h3>
              <p className="font-inter text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}