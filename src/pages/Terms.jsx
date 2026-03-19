import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

export default function Terms() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '120px 48px 80px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '40px', color: '#111827', margin: '0 0 8px' }}>Terms of Service</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9CA3AF', margin: '0 0 40px' }}>Last updated: March 2026</p>

        {[
          ['Acceptance of Terms', 'By accessing or using PropMatch, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform. Use of PropMatch is restricted to licensed real estate professionals.'],
          ['Platform Use', 'PropMatch is a professional tool for real estate agents and brokers to post listings, requirements, and discover matches. You agree to use the platform lawfully and professionally. You may not post false, misleading, or fraudulent listings or requirements.'],
          ['Account Responsibility', 'You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. Notify us immediately at propmatch.founder@gmail.com if you suspect unauthorized access.'],
          ['Content Ownership', 'You retain ownership of all content you post to PropMatch. By posting, you grant PropMatch a limited license to display and distribute that content to other users on the platform in accordance with your visibility settings.'],
          ['Matching & Results', 'PropMatch provides compatibility scores as informational guidance only. We do not guarantee the accuracy or completeness of match results, and we are not responsible for the outcome of any transaction that occurs as a result of a match on the platform.'],
          ['Subscription & Billing', 'Paid subscription plans are billed on a recurring basis. You may cancel at any time from your account settings. Refunds are handled on a case-by-case basis — contact propmatch.founder@gmail.com for billing inquiries.'],
          ['Termination', 'We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or misuse the platform. You may also delete your account at any time.'],
          ['Limitation of Liability', 'PropMatch is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including lost business or missed opportunities.'],
          ['Contact', 'For any questions about these Terms, email us at propmatch.founder@gmail.com.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '18px', fontWeight: 500, color: '#111827', margin: '0 0 10px' }}>{title}</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#4B5563', lineHeight: 1.8, margin: 0 }}>{body}</p>
          </div>
        ))}
      </div>
      <LandingFooter />
    </div>
  );
}