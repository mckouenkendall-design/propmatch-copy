import React, { useEffect, useRef, useState } from 'react';

const PROBLEMS = [
  {
    icon: '⏳',
    title: 'Hours Lost Searching',
    desc: 'Agents manually scroll through dozens of platforms, calling contacts, and chasing cold leads — only to find properties that don\'t fit the brief.',
  },
  {
    icon: '📋',
    title: 'Mismatched Clients',
    desc: 'Without intelligent filtering, agents send clients listings that miss the mark on budget, location, or property type, eroding trust over time.',
  },
  {
    icon: '🤝',
    title: 'Deals That Slip Away',
    desc: 'The right listing and the right buyer exist in the same market — but no one connects them fast enough. Deals die on the vine.',
  },
];

const SOLUTIONS = [
  {
    icon: '⚡',
    title: 'Instant Intelligent Matching',
    desc: 'PropMatch\'s engine analyzes listing attributes against client requirements in real-time, scoring compatibility so you always know what\'s worth pursuing.',
  },
  {
    icon: '🎯',
    title: 'Precision-First Results',
    desc: 'Filter by property type, location, budget, size, amenities, and more. Your clients see only listings that genuinely fit their criteria.',
  },
  {
    icon: '🔗',
    title: 'Agent-to-Agent Network',
    desc: 'Connect with other verified agents across your market. Share listings, form groups, and co-broker deals with confidence — all in one platform.',
  },
];

function useScrollVisible(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

export default function ProblemSolution() {
  const [ref, visible] = useScrollVisible(0.15);

  return (
    <section ref={ref} className="py-24 px-6" style={{ background: '#FAFFFE' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`text-center mb-16 fade-in-up ${visible ? 'visible' : ''}`}>
          <p className="font-inter text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4FB3A9' }}>
            The Problem & The Fix
          </p>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Real estate is broken.<br />
            <span style={{ color: '#4FB3A9' }}>PropMatch fixes it.</span>
          </h2>
          <p className="font-inter text-lg text-gray-500 max-w-2xl mx-auto">
            The industry hasn't changed how agents find matches in decades. We built the tool that should have existed years ago.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Problems */}
          <div>
            <div className={`flex items-center gap-3 mb-6 fade-in-left ${visible ? 'visible' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-sm">✕</div>
              <h3 className="font-playfair text-2xl font-semibold text-gray-800">Without PropMatch</h3>
            </div>
            <div className="space-y-5">
              {PROBLEMS.map((p, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-xl border border-red-100 bg-red-50 fade-in-left stagger-${i + 1} ${visible ? 'visible' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-0.5">{p.icon}</div>
                    <div>
                      <h4 className="font-inter font-semibold text-gray-800 mb-1">{p.title}</h4>
                      <p className="font-inter text-sm text-gray-500 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div>
            <div className={`flex items-center gap-3 mb-6 fade-in-right ${visible ? 'visible' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm tiffany-gradient">✓</div>
              <h3 className="font-playfair text-2xl font-semibold text-gray-800">With PropMatch</h3>
            </div>
            <div className="space-y-5">
              {SOLUTIONS.map((s, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-xl border fade-in-right stagger-${i + 1} ${visible ? 'visible' : ''}`}
                  style={{ background: '#F0FAFA', borderColor: '#A8DDD9' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl mt-0.5">{s.icon}</div>
                    <div>
                      <h4 className="font-inter font-semibold text-gray-800 mb-1">{s.title}</h4>
                      <p className="font-inter text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}