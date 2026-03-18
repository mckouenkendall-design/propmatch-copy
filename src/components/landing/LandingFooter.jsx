import React from 'react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = {
  Product: ['Features', 'How It Works', 'Pricing', 'Match Engine'],
  Company: ['About Us', 'Blog', 'Careers', 'Press'],
  Support: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'],
  Network: ['Agent Directory', 'Groups', 'Events', 'Deal Board'],
};

export default function LandingFooter() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{ background: '#0F2421', color: 'rgba(255,255,255,0.8)' }}>
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4FB3A9, #3A8A82)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
              </div>
              <span className="font-playfair text-xl font-bold text-white">PropMatch</span>
            </div>
            <p className="font-inter text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Intelligently pairs property listings with client requirements so real estate agents spend less time searching — and more time closing.
            </p>
            <div className="flex gap-3">
              {['LinkedIn', 'Instagram', 'Twitter'].map(platform => (
                <div
                  key={platform}
                  className="w-9 h-9 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:opacity-80"
                  style={{ background: 'rgba(79,179,169,0.15)', border: '1px solid rgba(79,179,169,0.3)' }}
                  title={platform}
                >
                  <span className="text-xs font-bold font-inter" style={{ color: '#4FB3A9' }}>
                    {platform[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-inter text-xs font-semibold uppercase tracking-widest mb-4 text-white opacity-50">{category}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link}>
                    <Link
                      to="/Dashboard"
                      className="font-inter text-sm transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.55)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#4FB3A9'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-inter text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} PropMatch. All rights reserved. Built for licensed real estate professionals.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-inter text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}