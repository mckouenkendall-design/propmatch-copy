import React, { useEffect, useRef, useState } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Create Your Verified Profile',
    desc: 'Sign up with your name, brokerage, and employing broker license ID. PropMatch verifies your credentials so clients and fellow agents know you\'re the real deal.',
    outcome: 'Your verified badge unlocks full platform access.',
    icon: '🪪',
  },
  {
    number: '02',
    title: 'Post Listings & Requirements',
    desc: 'Enter your active listings and active buyer or tenant requirements in minutes. Our smart forms guide you through every relevant detail — property type, size, price, amenities, and more.',
    outcome: 'Your listings and requirements are live and searchable instantly.',
    icon: '📝',
  },
  {
    number: '03',
    title: 'PropMatch Finds Your Matches',
    desc: 'Our matching engine continuously scans the network, comparing your requirements against active listings — and your listings against active requirements — scoring every potential match.',
    outcome: 'You get ranked matches with compatibility scores, not noise.',
    icon: '⚡',
  },
  {
    number: '04',
    title: 'Connect & Collaborate',
    desc: 'Reach out directly to the listing or requirement holder via in-platform messaging. Join groups, attend events, and build the relationships that turn matches into closed deals.',
    outcome: 'Warm introductions backed by data — not cold calls.',
  },
  {
    number: '05',
    title: 'Close the Deal',
    desc: 'Track your pipeline on the Deal Board. Move opportunities through stages, stay on top of follow-ups, and record your wins. Your performance data informs every future recommendation.',
    outcome: 'More closings, less chaos, every quarter.',
    icon: '🏆',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance active step
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6" style={{ background: '#F8FFFE' }}>
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-16 fade-in-up ${visible ? 'visible' : ''}`}>
          <p className="font-inter text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4FB3A9' }}>
            How It Works
          </p>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            From signup to <span style={{ color: '#4FB3A9' }}>closed deal</span> in five steps
          </h2>
          <p className="font-inter text-lg text-gray-500 max-w-xl mx-auto">
            Straightforward. Powerful. Built around how agents actually work.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Step List */}
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-300 fade-in-left stagger-${i + 1} ${visible ? 'visible' : ''}`}
                style={{
                  borderColor: activeStep === i ? '#4FB3A9' : '#E5E7EB',
                  background: activeStep === i ? 'white' : 'transparent',
                  boxShadow: activeStep === i ? '0 4px 20px rgba(79,179,169,0.12)' : 'none',
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-playfair font-bold text-lg transition-all duration-300"
                    style={{
                      background: activeStep === i ? 'linear-gradient(135deg, #4FB3A9, #3A8A82)' : '#E8F7F6',
                      color: activeStep === i ? 'white' : '#4FB3A9',
                    }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <div className="font-inter font-semibold text-gray-900 text-sm">{step.title}</div>
                    {activeStep !== i && (
                      <div className="font-inter text-xs text-gray-400 mt-0.5 line-clamp-1">{step.desc.slice(0, 60)}...</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Step Detail */}
          <div
            className={`sticky top-24 p-8 rounded-2xl border fade-in-right ${visible ? 'visible' : ''}`}
            style={{ background: 'white', borderColor: '#A8DDD9', boxShadow: '0 8px 40px rgba(79,179,169,0.12)' }}
          >
            <div className="text-5xl mb-6">{STEPS[activeStep].icon || '📌'}</div>
            <div
              className="inline-block font-playfair text-6xl font-bold mb-4"
              style={{ color: '#E8F7F6', WebkitTextStroke: '2px #4FB3A9' }}
            >
              {STEPS[activeStep].number}
            </div>
            <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-4">
              {STEPS[activeStep].title}
            </h3>
            <p className="font-inter text-gray-500 leading-relaxed mb-6">
              {STEPS[activeStep].desc}
            </p>
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: '#F0FAFA', borderLeft: '3px solid #4FB3A9' }}
            >
              <span className="text-lg mt-0.5">✅</span>
              <p className="font-inter text-sm font-medium" style={{ color: '#2D6B65' }}>
                {STEPS[activeStep].outcome}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 mt-6">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: activeStep === i ? '#4FB3A9' : '#D1E8E6',
                    width: activeStep === i ? '20px' : '8px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}