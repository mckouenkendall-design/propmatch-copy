import React, { useEffect, useRef, useState } from 'react';

const TESTIMONIALS = [
  {
    name: 'Sarah Kowalski',
    title: 'Commercial Agent · CBRE Detroit',
    quote: 'I used to spend 3 hours a day manually cross-referencing listings with client needs. PropMatch cut that down to 20 minutes. I closed two co-broker deals in my first month that I never would have found on my own.',
    rating: 5,
    avatar: 'SK',
  },
  {
    name: 'Marcus Thompson',
    title: 'Residential Broker · Signature Sotheby\'s',
    quote: 'The match scoring is scary accurate. I had a buyer looking for a very specific type of property and PropMatch surfaced a listing from an agent I\'d never met. That deal closed at $1.1M. The platform paid for itself in the first week.',
    rating: 5,
    avatar: 'MT',
  },
  {
    name: 'Rachel Nguyen',
    title: 'Independent Agent · RE/MAX Nexus',
    quote: 'As a solo agent without a big brokerage network, PropMatch gives me reach I never had before. The verified network means every connection is with a real professional. It changed how I prospect entirely.',
    rating: 5,
    avatar: 'RN',
  },
  {
    name: 'David Okonkwo',
    title: 'Team Lead · Keller Williams Metro',
    quote: 'We put our whole team on PropMatch and the results were immediate. The group features let us collaborate on deals and share requirements internally. Our pipeline grew 40% in 90 days.',
    rating: 5,
    avatar: 'DO',
  },
  {
    name: 'Jennifer Alvarez',
    title: 'Buyer\'s Agent · Coldwell Banker',
    quote: 'The visibility controls are exactly what I needed. I can share certain requirements only with agents in my group and keep others private. That kind of flexibility is rare and incredibly useful.',
    rating: 5,
    avatar: 'JA',
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: rating }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#4FB3A9">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(i => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="testimonials" ref={ref} className="py-24 px-6" style={{ background: 'linear-gradient(160deg, #F0FAFA 0%, #FAFFFE 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className={`text-center mb-16 fade-in-up ${visible ? 'visible' : ''}`}>
          <p className="font-inter text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#4FB3A9' }}>
            What Agents Are Saying
          </p>
          <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted by agents who <span style={{ color: '#4FB3A9' }}>close</span>
          </h2>
        </div>

        {/* Featured Testimonial */}
        <div className={`mb-10 fade-in-up stagger-2 ${visible ? 'visible' : ''}`}>
          <div
            className="max-w-3xl mx-auto rounded-2xl p-8 md:p-10 border-2 transition-all duration-500"
            style={{
              background: 'white',
              borderColor: '#4FB3A9',
              boxShadow: '0 12px 50px rgba(79,179,169,0.15)',
            }}
          >
            <div className="text-5xl mb-4" style={{ color: '#A8DDD9', fontFamily: 'Georgia, serif' }}>"</div>
            <p className="font-inter text-lg text-gray-700 leading-relaxed mb-6">
              {TESTIMONIALS[activeIndex].quote}
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-inter font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #4FB3A9, #3A8A82)' }}
              >
                {TESTIMONIALS[activeIndex].avatar}
              </div>
              <div>
                <div className="font-inter font-semibold text-gray-900">{TESTIMONIALS[activeIndex].name}</div>
                <div className="font-inter text-sm text-gray-500">{TESTIMONIALS[activeIndex].title}</div>
              </div>
              <div className="ml-auto">
                <StarRating rating={TESTIMONIALS[activeIndex].rating} />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  background: activeIndex === i ? '#4FB3A9' : '#D1E8E6',
                  width: activeIndex === i ? '24px' : '8px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom mini cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <div
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 fade-in-up stagger-${i + 2} ${visible ? 'visible' : ''}`}
              style={{
                borderColor: activeIndex === i ? '#4FB3A9' : '#E0F0EE',
                background: activeIndex === i ? '#F0FAFA' : 'white',
              }}
            >
              <StarRating rating={t.rating} />
              <p className="font-inter text-sm text-gray-600 mt-3 mb-4 line-clamp-3">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white font-inter"
                  style={{ background: 'linear-gradient(135deg, #4FB3A9, #3A8A82)' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="font-inter text-xs font-semibold text-gray-900">{t.name}</div>
                  <div className="font-inter text-xs text-gray-400">{t.title.split(' · ')[1]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}