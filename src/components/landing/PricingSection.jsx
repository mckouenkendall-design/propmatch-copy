import React, { useEffect, useRef, useState } from 'react';

const INDIVIDUAL_FEATURES = [
  'Unlimited listings & requirements',
  'Intelligent matching engine',
  'Verified agent profile',
  'In-platform messaging',
  'Deal board & pipeline tracker',
  'Group networking access',
  'Market insights dashboard',
  'Template library',
  'Priority support',
];

export default function PricingSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const price = billing === 'annual' ? 79 : 99;

  return (
    <section id="pricing" ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className={`text-center mb-12 fade-in-up ${visible ? 'visible' : ''}`}>
          <p className="font-inter text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4FB3A9' }}>
            Pricing
          </p>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent <span style={{ color: '#4FB3A9' }}>pricing</span>
          </h2>
          <p className="font-inter text-lg text-gray-500 max-w-xl mx-auto">
            One plan for individual agents. Brokerage plans coming soon — built for teams of any size.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 mt-8 p-1 rounded-lg border" style={{ borderColor: '#E0F0EE', background: '#F8FFFE' }}>
            <button
              onClick={() => setBilling('monthly')}
              className="px-5 py-2 rounded-md text-sm font-semibold font-inter transition-all duration-200"
              style={{
                background: billing === 'monthly' ? 'linear-gradient(135deg, #4FB3A9, #3A8A82)' : 'transparent',
                color: billing === 'monthly' ? 'white' : '#6B7280',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className="px-5 py-2 rounded-md text-sm font-semibold font-inter transition-all duration-200 flex items-center gap-2"
              style={{
                background: billing === 'annual' ? 'linear-gradient(135deg, #4FB3A9, #3A8A82)' : 'transparent',
                color: billing === 'annual' ? 'white' : '#6B7280',
              }}
            >
              Annual
              <span
                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                style={{ background: billing === 'annual' ? 'rgba(255,255,255,0.25)' : '#E8F7F6', color: billing === 'annual' ? 'white' : '#3A8A82' }}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className={`grid md:grid-cols-2 gap-8 fade-in-up stagger-2 ${visible ? 'visible' : ''}`}>
          {/* Individual Plan */}
          <div
            className="relative rounded-2xl p-8 border-2"
            style={{
              borderColor: '#4FB3A9',
              background: 'white',
              boxShadow: '0 8px 40px rgba(79,179,169,0.15)',
            }}
          >
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-1 rounded-full font-inter"
              style={{ background: 'linear-gradient(135deg, #4FB3A9, #3A8A82)', color: 'white' }}
            >
              Most Popular
            </div>

            <div className="mb-6">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-1">Individual Agent</h3>
              <p className="font-inter text-sm text-gray-500">Everything you need to close more deals, solo.</p>
            </div>

            <div className="flex items-end gap-1 mb-8">
              <span className="font-playfair text-6xl font-bold" style={{ color: '#2D6B65' }}>${price}</span>
              <span className="font-inter text-gray-400 mb-2">/month</span>
            </div>
            {billing === 'annual' && (
              <p className="font-inter text-xs text-gray-400 -mt-6 mb-6">Billed annually at ${price * 12}/yr · Save $240</p>
            )}

            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full tiffany-btn py-3.5 text-base font-inter mb-8 rounded-lg"
            >
              Start Free Trial
            </button>

            <ul className="space-y-3">
              {INDIVIDUAL_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 font-inter text-sm text-gray-700">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#E8F7F6' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#4FB3A9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Brokerage Plan */}
          <div
            className="rounded-2xl p-8 border-2 flex flex-col"
            style={{
              borderColor: '#E5E7EB',
              background: '#FAFFFE',
            }}
          >
            <div className="mb-6">
              <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-1">Brokerage</h3>
              <p className="font-inter text-sm text-gray-500">For teams and brokerages who want platform-wide access.</p>
            </div>

            <div className="flex items-end gap-1 mb-8">
              <span className="font-playfair text-4xl font-bold text-gray-400">Coming</span>
              <span className="font-inter text-gray-300 mb-1 text-2xl ml-2">Soon</span>
            </div>

            <div
              className="rounded-xl p-5 mb-8"
              style={{ background: '#F0FAFA', border: '1px solid #A8DDD9' }}
            >
              <p className="font-inter text-sm font-semibold text-gray-700 mb-3">What to expect:</p>
              <ul className="space-y-2">
                {[
                  'Team seat management',
                  'Brokerage-wide visibility controls',
                  'Shared listing & requirement pools',
                  'Admin reporting & analytics',
                  'Dedicated account manager',
                  'Custom onboarding',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 font-inter text-sm text-gray-600">
                    <span style={{ color: '#4FB3A9' }}>→</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-auto tiffany-btn-outline py-3.5 text-base font-inter rounded-lg w-full"
            >
              Get Notified
            </button>

            <p className="font-inter text-xs text-gray-400 text-center mt-3">
              We'll reach out when brokerage plans launch
            </p>
          </div>
        </div>

        <p className="text-center font-inter text-xs text-gray-400 mt-8">
          No contracts. Cancel anytime. 14-day free trial on all plans.
        </p>
      </div>
    </section>
  );
}