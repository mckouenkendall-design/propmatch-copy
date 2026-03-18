import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import ProblemSolution from '../components/landing/ProblemSolution';

import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import PricingSection from '../components/landing/PricingSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';

export default function Landing() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden', background: '#FFFFFF' }}>
      <LandingNav />
      <HeroSection />
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