import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

export default function Privacy() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '120px 48px 80px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '40px', color: '#111827', margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9CA3AF', margin: '0 0 40px' }}>Last updated: March 2026</p>

        {[
          ['Information We Collect', 'We collect information you provide when you register, post listings or requirements, and use platform features. This includes your name, email address, phone number, and professional information such as brokerage affiliation. We also collect usage data such as pages visited, features used, and actions taken within the platform.'],
          ['How We Use Your Information', 'Your information is used to operate and improve PropMatch, match listings with requirements, send relevant notifications, and communicate with you about your account. We do not sell your personal data to third parties.'],
          ['Data Sharing', 'Listing and requirement data you mark as "Public" is visible to other PropMatch members. Contact information attached to listings is shared only as you configure it. We may share data with service providers who assist in operating the platform, subject to confidentiality agreements.'],
          ['Data Security', 'We use industry-standard security practices to protect your data including encrypted connections (HTTPS), secure authentication, and access controls. No system is completely secure, and we encourage you to use a strong, unique password.'],
          ['Your Rights', 'You may request access to, correction of, or deletion of your personal data at any time by emailing founder.propmatch@gmail.com. We will respond within 30 days.'],
          ['Cookies', 'PropMatch uses cookies to maintain session state and improve your experience. You may disable cookies in your browser settings, though some features may not function correctly.'],
          ['Changes to This Policy', 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or a notice on the platform.'],
          ['Contact', 'Questions about this policy? Email us at founder.propmatch@gmail.com.'],
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