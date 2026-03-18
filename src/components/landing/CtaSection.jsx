import React, { useEffect, useRef, useState } from 'react';

export default function CtaSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section id="cta" ref={ref} className="py-24 px-6" style={{ background: 'white' }}>
      <div className="max-w-4xl mx-auto text-center">
        <div
          className={`rounded-3xl p-12 md:p-16 fade-in-up ${visible ? 'visible' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #2D6B65 0%, #3A8A82 40%, #4FB3A9 100%)',
            boxShadow: '0 20px 60px rgba(45, 107, 101, 0.35)',
          }}
        >
          <div className="text-5xl mb-6">🏢</div>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Ready to close more deals?
          </h2>
          <p className="font-inter text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Join thousands of verified agents already using PropMatch to find better leads, make smarter connections, and close faster.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 rounded-md font-inter text-sm text-gray-800 outline-none focus:ring-2 border-0"
                style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '6px' }}
              />
              <button
                type="submit"
                className="px-7 py-3.5 font-inter font-semibold text-sm rounded-md transition-all duration-200 whitespace-nowrap"
                style={{
                  background: '#2D6B65',
                  color: 'white',
                  borderRadius: '6px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1f4f4b'}
                onMouseLeave={e => e.currentTarget.style.background = '#2D6B65'}
              >
                Get Early Access
              </button>
            </form>
          ) : (
            <div
              className="inline-flex items-center gap-3 px-6 py-4 rounded-xl font-inter text-base font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              <span className="text-xl">✅</span>
              You're on the list! We'll be in touch soon.
            </div>
          )}

          <p className="font-inter text-xs mt-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No credit card required · 14-day free trial · Cancel anytime
          </p>

          {/* Trust stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            {[
              { val: '2,400+', label: 'Active Agents' },
              { val: '14 Days', label: 'Free Trial' },
              { val: '$99/mo', label: 'Individual Plan' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-playfair text-2xl font-bold text-white">{s.val}</div>
                <div className="font-inter text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}