import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import ProblemSolution from '../components/landing/ProblemSolution';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import PricingSection from '../components/landing/PricingSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

        :root {
          --tiffany: #4FB3A9;
          --tiffany-dark: #3A8A82;
          --tiffany-light: #A8DDD9;
          --tiffany-pale: #E8F7F6;
          --tiffany-deep: #2D6B65;
        }

        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        .tiffany-gradient {
          background: linear-gradient(135deg, #4FB3A9 0%, #3A8A82 100%);
        }

        .tiffany-text {
          color: #4FB3A9;
        }

        .tiffany-btn {
          background: linear-gradient(135deg, #4FB3A9 0%, #3A8A82 100%);
          color: white;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 12px rgba(79, 179, 169, 0.3);
        }

        .tiffany-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(79, 179, 169, 0.45);
        }

        .tiffany-btn-outline {
          background: transparent;
          color: #4FB3A9;
          border: 1.5px solid #4FB3A9;
          border-radius: 6px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .tiffany-btn-outline:hover {
          background: #4FB3A9;
          color: white;
        }

        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fade-in-left {
          opacity: 0;
          transform: translateX(-40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .fade-in-left.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .fade-in-right {
          opacity: 0;
          transform: translateX(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .fade-in-right.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        .stagger-5 { transition-delay: 0.5s; }
      `}</style>

      <LandingNav />
      <HeroSection />
      <StatsSection />
      <ProblemSolution />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}