import React, { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 71, suffix: '%', label: 'of agents close zero deals in a year', source: 'Industry Research 2024' },
  { value: 47, suffix: '%', label: 'of agent time is spent on unproductive prospecting', source: 'NAR Productivity Study' },
  { value: 3.2, suffix: 'x', label: 'more closings for agents using smart matching tools', source: 'PropTech Benchmark Report' },
  { value: 18, suffix: 'hrs', label: 'saved per week per agent on average', source: 'PropMatch Internal Data' },
];

function AnimatedNumber({ target, suffix, visible }) {
  const [count, setCount] = useState(0);
  const isDecimal = target % 1 !== 0;

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [visible, target]);

  return (
    <span>
      {isDecimal ? count.toFixed(1) : Math.floor(count)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20" style={{ background: 'linear-gradient(135deg, #2D6B65 0%, #3A8A82 50%, #4FB3A9 100%)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center font-inter text-sm font-semibold uppercase tracking-widest mb-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
          The State of Real Estate Today
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={`text-center fade-in-up stagger-${i + 1} ${visible ? 'visible' : ''}`}
            >
              <div className="font-playfair text-5xl font-bold text-white mb-2">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} visible={visible} />
              </div>
              <p className="font-inter text-sm leading-snug mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {stat.label}
              </p>
              <p className="font-inter text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.source}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}