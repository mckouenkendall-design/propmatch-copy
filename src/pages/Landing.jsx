import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import ProblemSolution from '../components/landing/ProblemSolution';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import PricingSection from '../components/landing/PricingSection';
import FaqSection from '../components/landing/FaqSection';
import CtaSection from '../components/landing/CtaSection';
import LandingFooter from '../components/landing/LandingFooter';
import SwimmingFish from '../components/landing/SwimmingFish';

export default function Landing() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <SwimmingFish />
      <LandingNav />
      <HeroSection />
      <ProblemSolution />
      <FeaturesSection />
      <HowItWorks />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}