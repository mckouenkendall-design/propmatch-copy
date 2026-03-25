import React from 'react';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

const ACCENT = '#00DBC5';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing, registering for, or using PropMatch ("the Platform"), you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations. If you do not agree to these Terms, you may not access or use the Platform. These Terms constitute a legally binding agreement between you and PropMatch. Your continued use of the Platform following any updates to these Terms constitutes your acceptance of the revised Terms.`,
  },
  {
    title: '2. Eligibility',
    body: `PropMatch is intended solely for use by licensed real estate professionals, including licensed real estate agents, brokers, and principal brokers. By registering, you represent and warrant that (a) you are at least 18 years of age, (b) you hold a valid real estate license in the jurisdiction in which you operate, (c) you have the legal authority to enter into this agreement, and (d) all information you provide during registration is accurate and current. PropMatch reserves the right to verify licensure and terminate accounts that do not meet these requirements.`,
  },
  {
    title: '3. Account Registration & Security',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify PropMatch immediately at founder.propmatch@gmail.com upon discovering any unauthorized use of your account. PropMatch is not liable for any loss or damage arising from your failure to safeguard your credentials. You may not share, transfer, or sell your account to any third party.`,
  },
  {
    title: '4. Subscription Plans & Billing',
    body: `PropMatch offers free and paid subscription plans. By selecting a paid plan, you authorize PropMatch to charge your payment method on a recurring basis at the interval selected (monthly or annually) until you cancel. All charges are in U.S. dollars. Prices are subject to change with at least 30 days notice prior to your next renewal date.\n\nYou may cancel your subscription at any time through your account Settings. Cancellation takes effect at the end of your current billing period — you will retain access through that date and will not be charged again thereafter. PropMatch does not provide refunds for partial billing periods except where required by applicable law. For billing disputes or questions, contact founder.propmatch@gmail.com within 60 days of the charge in question.\n\nBrokerage plan subscribers who add agents to their roster acknowledge that the per-seat charge applies regardless of whether each seat is actively used. Agents removed from a brokerage roster will lose brokerage-sponsored access immediately and may be subject to their own individual subscription terms.`,
  },
  {
    title: '5. Free Trial & Promotional Offers',
    body: `PropMatch may offer free trials or promotional pricing at its discretion. Unless you cancel before the end of any trial period, your subscription will automatically convert to a paid plan at the then-current rate. PropMatch reserves the right to modify or terminate promotional offers at any time.`,
  },
  {
    title: '6. Acceptable Use',
    body: `You agree to use PropMatch solely for lawful professional purposes. You may not: (a) post false, misleading, or fraudulent listings or buyer/seller requirements; (b) impersonate any person or entity or misrepresent your licensure status; (c) use the Platform to harass, defame, or discriminate against any person on the basis of race, color, national origin, religion, sex, familial status, disability, or any other protected class under the Fair Housing Act or applicable law; (d) attempt to gain unauthorized access to any part of the Platform or its infrastructure; (e) scrape, crawl, or extract data from the Platform by automated means without express written permission; (f) use the Platform to send unsolicited commercial communications; (g) reverse engineer, decompile, or otherwise attempt to derive source code from the Platform; or (h) use the Platform in any manner that could damage, disable, or impair its operation.`,
  },
  {
    title: '7. Content Ownership & License',
    body: `You retain all ownership rights in the listings, requirements, profile information, and other content you submit to PropMatch ("User Content"). By submitting User Content, you grant PropMatch a non-exclusive, worldwide, royalty-free license to store, display, and distribute that content to other users of the Platform for the purpose of operating the matching and networking features. This license terminates when you delete the content or close your account, except to the extent content has been shared with other users or incorporated into platform analytics. You represent and warrant that you have all rights necessary to grant this license and that your User Content does not violate any third-party rights.`,
  },
  {
    title: '8. Matching & Platform Results',
    body: `PropMatch provides compatibility match scores and results as informational tools to assist real estate professionals in identifying potential business opportunities. Match results are generated algorithmically and do not constitute professional advice. PropMatch does not guarantee the accuracy, completeness, or fitness of any match result for any particular purpose. PropMatch is not a party to any transaction, negotiation, or agreement that may arise between users as a result of a match, and is not responsible for the outcome of any such transaction.`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content, features, and functionality of the PropMatch Platform — including but not limited to software, design, logos, trademarks, text, and graphics — are the exclusive property of PropMatch and are protected by applicable intellectual property laws. The PropMatch name, logo, and fish mark are proprietary. You may not use any PropMatch trademarks or branding without prior written consent. Nothing in these Terms grants you any right, title, or interest in the Platform or its intellectual property except the limited right to use the Platform as described herein.`,
  },
  {
    title: '10. Privacy & Data',
    body: `Your use of PropMatch is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you consent to the collection and use of your information as described in the Privacy Policy. PropMatch collects professional information including your name, license number, employing broker ID, and contact information for the purpose of verifying licensure, enabling matching, and facilitating professional networking. PropMatch does not sell your personal information to third parties.`,
  },
  {
    title: '11. Indemnification',
    body: `You agree to indemnify, defend, and hold harmless PropMatch, its founders, officers, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with: (a) your access to or use of the Platform; (b) your User Content; (c) your violation of these Terms; (d) your violation of any applicable law or regulation; or (e) any claim that your User Content infringes or misappropriates any third-party right.`,
  },
  {
    title: '12. Disclaimer of Warranties',
    body: `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OR ERROR-FREE OPERATION. PROPMATCH DOES NOT WARRANT THAT THE PLATFORM WILL MEET YOUR REQUIREMENTS OR THAT RESULTS OBTAINED THROUGH THE PLATFORM WILL BE ACCURATE OR RELIABLE. YOUR USE OF THE PLATFORM IS AT YOUR SOLE RISK.`,
  },
  {
    title: '13. Limitation of Liability',
    body: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, PROPMATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST BUSINESS OPPORTUNITIES, LOSS OF DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE PLATFORM, EVEN IF PROPMATCH HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL PROPMATCH'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO PROPMATCH IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).`,
  },
  {
    title: '14. Dispute Resolution & Arbitration',
    body: `Any dispute, claim, or controversy arising out of or relating to these Terms or the use of the Platform shall be resolved by binding individual arbitration administered under the rules of the American Arbitration Association (AAA), rather than in court. You and PropMatch each waive the right to a trial by jury and the right to participate in a class action or class-wide arbitration. This agreement to arbitrate does not apply to claims for injunctive or other equitable relief to protect intellectual property rights. Before initiating arbitration, you agree to first contact PropMatch at founder.propmatch@gmail.com and attempt to resolve the dispute informally for at least 30 days.`,
  },
  {
    title: '15. Governing Law & Jurisdiction',
    body: `These Terms are governed by and construed in accordance with the laws of the State of Michigan, without regard to its conflict of law principles. To the extent any dispute is not subject to arbitration, you consent to exclusive jurisdiction and venue in the state and federal courts located in Michigan.`,
  },
  {
    title: '16. Termination',
    body: `PropMatch reserves the right to suspend or permanently terminate your account and access to the Platform at its sole discretion, with or without notice, for conduct that PropMatch believes violates these Terms, is harmful to other users, PropMatch, or third parties, or for any other reason. Upon termination, your right to use the Platform ceases immediately. You may delete your account at any time by contacting founder.propmatch@gmail.com. Sections 7, 10, 11, 12, 13, 14, and 15 survive termination.`,
  },
  {
    title: '17. Modifications to Terms',
    body: `PropMatch reserves the right to update these Terms at any time. When we make material changes, we will notify you by updating the "Last updated" date at the top of this page and, where appropriate, by in-app notification. Your continued use of the Platform after any update constitutes acceptance of the revised Terms. We encourage you to review these Terms periodically.`,
  },
  {
    title: '18. Miscellaneous',
    body: `These Terms, together with the Privacy Policy, constitute the entire agreement between you and PropMatch with respect to the Platform and supersede all prior agreements. If any provision of these Terms is found unenforceable, the remaining provisions remain in full force and effect. PropMatch's failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision. You may not assign your rights under these Terms without PropMatch's prior written consent. PropMatch may assign its rights without restriction.`,
  },
  {
    title: '19. Contact',
    body: `For questions about these Terms of Service, billing inquiries, or to report a violation, contact us at:\n\nPropMatch\nfound.propmatch@gmail.com\nInstagram: @propmatch.ai`,
  },
];

export default function Terms() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '120px 48px 80px' }}>

        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '40px', color: '#111827', margin: '0 0 8px' }}>
          Terms of Service
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9CA3AF', margin: '0 0 8px' }}>
          Last updated: March 2026
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#6B7280', lineHeight: 1.8, margin: '0 0 48px', padding: '16px 20px', background: '#F3F4F6', borderRadius: '8px', borderLeft: `4px solid ${ACCENT}` }}>
          Please read these Terms carefully before using PropMatch. By creating an account or using the Platform, you agree to be bound by these Terms.
        </p>

        {SECTIONS.map(({ title, body }) => (
          <div key={title} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 600, color: '#111827', margin: '0 0 10px' }}>
              {title}
            </h2>
            {body.split('\n\n').map((para, i) => (
              <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#4B5563', lineHeight: 1.85, margin: '0 0 12px' }}>
                {para}
              </p>
            ))}
          </div>
        ))}

        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
            © 2026 PropMatch. All rights reserved. These Terms of Service were last reviewed in March 2026 and are subject to change. For the most current version, visit propmatch.ai/Terms.
          </p>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}