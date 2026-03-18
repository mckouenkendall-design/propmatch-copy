import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PROPERTY_TYPES = ['Office Space', 'Retail Storefront', 'Industrial Flex', 'Single Family Home', 'Multi-Family Unit'];
const LOCATIONS = ['Detroit, MI', 'Ann Arbor, MI', 'Troy, MI', 'Birmingham, MI', 'Bloomfield Hills, MI'];

export default function HeroSection() {
  const [typeIndex, setTypeIndex] = useState(0);
  const [locIndex, setLocIndex] = useState(0);
  const [matchPulse, setMatchPulse] = useState(false);
  const [matched, setMatched] = useState(false);
  const [score, setScore] = useState(0);
  const [searching, setSearching] = useState(false);

  // Cycle through property types for the animated demo
  useEffect(() => {
    const t = setInterval(() => {
      setTypeIndex(i => (i + 1) % PROPERTY_TYPES.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setLocIndex(i => (i + 1) % LOCATIONS.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const runMatch = () => {
    setSearching(true);
    setMatched(false);
    setScore(0);
    setTimeout(() => {
      setSearching(false);
      setMatched(true);
      let s = 0;
      const interval = setInterval(() => {
        s += 3;
        setScore(s);
        if (s >= 94) clearInterval(interval);
      }, 20);
      setMatchPulse(true);
      setTimeout(() => setMatchPulse(false), 800);
    }, 1800);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0fafa 0%, #ffffff 50%, #e8f7f6 100%)' }}>
      {/* Decorative blobs */}
      <div className="absolute top-20 right-[-100px] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #4FB3A9, transparent 70%)' }} />
      <div className="absolute bottom-10 left-[-80px] w-[350px] h-[350px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #3A8A82, transparent 70%)' }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16 w-full grid lg:grid-cols-2 gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 font-inter"
            style={{ background: '#E8F7F6', color: '#3A8A82', border: '1px solid #A8DDD9' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tiffany animate-pulse" style={{ background: '#4FB3A9' }} />
            Now matching agents across Michigan
          </div>

          <h1 className="font-playfair text-5xl lg:text-6xl font-700 text-gray-900 leading-tight mb-6">
            <span style={{ color: '#4FB3A9' }}>PropMatch</span> intelligently pairs property listings with client requirements
          </h1>

          <p className="font-inter text-lg text-gray-500 leading-relaxed mb-8 max-w-xl">
            So you spend less time searching — and more time closing.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="tiffany-btn px-7 py-3 text-base font-inter"
            >
              Join PropMatch
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="tiffany-btn-outline px-7 py-3 text-base font-inter"
            >
              See How It Works
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex items-center gap-6 flex-wrap">
            {[
              { value: '2,400+', label: 'Active Agents' },
              { value: '$1.2B+', label: 'Deals Matched' },
              { value: '94%', label: 'Match Accuracy' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-playfair text-2xl font-bold" style={{ color: '#3A8A82' }}>{stat.value}</div>
                <div className="font-inter text-xs text-gray-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Demo Card */}
        <div className="relative">
          <div
            className="rounded-2xl p-6 shadow-2xl border"
            style={{ background: 'white', borderColor: '#E0F0EE' }}
          >
            <div className="text-xs font-semibold uppercase tracking-widest mb-4 font-inter" style={{ color: '#4FB3A9' }}>
              Live Match Simulator
            </div>

            <div className="space-y-4 mb-5">
              {/* Property Type */}
              <div>
                <label className="block text-xs text-gray-400 font-inter mb-1">Property Type</label>
                <div
                  className="rounded-md px-3 py-2.5 text-sm font-inter font-medium border transition-all"
                  style={{ borderColor: '#A8DDD9', background: '#F0FAFA', color: '#2D6B65', minHeight: '38px' }}
                >
                  <span key={typeIndex} className="inline-block animate-pulse">{PROPERTY_TYPES[typeIndex]}</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs text-gray-400 font-inter mb-1">Location</label>
                <div
                  className="rounded-md px-3 py-2.5 text-sm font-inter font-medium border"
                  style={{ borderColor: '#A8DDD9', background: '#F0FAFA', color: '#2D6B65' }}
                >
                  <span key={locIndex}>{LOCATIONS[locIndex]}</span>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs text-gray-400 font-inter mb-1">Max Budget</label>
                <div
                  className="rounded-md px-3 py-2.5 text-sm font-inter font-medium border"
                  style={{ borderColor: '#A8DDD9', background: '#F0FAFA', color: '#2D6B65' }}
                >
                  $750,000
                </div>
              </div>
            </div>

            <button
              onClick={runMatch}
              disabled={searching}
              className="w-full tiffany-btn py-3 text-sm font-inter rounded-md flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Scanning listings...
                </>
              ) : '⚡ Find My Matches'}
            </button>

            {/* Match Result */}
            {matched && (
              <div
                className="mt-4 rounded-xl p-4 border"
                style={{
                  background: 'linear-gradient(135deg, #E8F7F6, #F0FAFA)',
                  borderColor: '#4FB3A9',
                  animation: matchPulse ? 'none' : undefined
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold font-inter text-gray-700">🎯 Top Match Found</span>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded font-inter"
                    style={{ background: '#4FB3A9', color: 'white' }}
                  >
                    {score}% Match
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Property', value: '3,200 SF Office · Troy, MI' },
                    { label: 'Price', value: '$28/SF/yr · Gross Lease' },
                    { label: 'Agent', value: 'Sarah K. · Signature Sotheby\'s' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-xs font-inter">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-700 font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-1.5 rounded-full" style={{ background: '#E0F0EE' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${score}%`, background: 'linear-gradient(90deg, #4FB3A9, #3A8A82)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Floating badges */}
          <div
            className="absolute -top-4 -right-4 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg font-inter hidden lg:block"
            style={{ background: 'white', color: '#3A8A82', border: '1px solid #A8DDD9' }}
          >
            ✓ Verified Agents Only
          </div>
          <div
            className="absolute -bottom-4 -left-4 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg font-inter hidden lg:block"
            style={{ background: 'white', color: '#3A8A82', border: '1px solid #A8DDD9' }}
          >
            🔒 License Verified
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs font-inter text-gray-500">Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-300 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </section>
  );
}