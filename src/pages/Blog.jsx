import React from 'react';
import { Link } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import LandingFooter from '../components/landing/LandingFooter';

const ACCENT = '#00DBC5';

const POSTS = [
  {
    slug: 'why-agents-lose-deals-without-a-matching-system',
    tag: 'Strategy',
    title: 'Why Agents Lose Deals Without a Matching System',
    date: 'Mar 12, 2026',
    excerpt: 'Most agents rely on memory, spreadsheets, and luck to match clients with properties. We analyzed how much revenue that costs the average agent per year — and the number is staggering.',
  },
  {
    slug: 'commercial-vs-residential-prospecting-2026',
    tag: 'Market Insight',
    title: 'Commercial vs. Residential Prospecting in 2026: What\'s Changed',
    date: 'Mar 7, 2026',
    excerpt: 'The way buyers and tenants search for commercial space has shifted dramatically. Here\'s what agents need to know to stay ahead of the curve in 2026.',
  },
  {
    slug: 'how-to-build-a-referral-network-that-actually-closes',
    tag: 'Networking',
    title: 'How to Build a Referral Network That Actually Closes',
    date: 'Feb 28, 2026',
    excerpt: 'Referral networks sound great in theory. In practice, most agents send referrals into a black hole. Here\'s a framework for building a network where deals actually flow both ways.',
  },
  {
    slug: 'off-market-deals-finding-them-before-everyone-else',
    tag: 'Deal Flow',
    title: 'Off-Market Deals: Finding Them Before Everyone Else',
    date: 'Feb 19, 2026',
    excerpt: 'The best deals rarely hit MLS. We break down the habits, tools, and relationships that top-performing agents use to consistently find off-market inventory.',
  },
  {
    slug: 'what-every-new-agent-gets-wrong-about-requirements',
    tag: 'Agent Tips',
    title: 'What Every New Agent Gets Wrong About Client Requirements',
    date: 'Feb 10, 2026',
    excerpt: 'New agents spend hours showing properties that don\'t match. The problem isn\'t effort — it\'s how requirements are captured. Here\'s what to ask every client from day one.',
  },
  {
    slug: 'the-case-for-digital-deal-management-in-real-estate',
    tag: 'Technology',
    title: 'The Case for Digital Deal Management in Real Estate',
    date: 'Jan 31, 2026',
    excerpt: 'Real estate is one of the last industries still running major transactions on paper notes and phone calls. Here\'s why that\'s a liability — and how forward-thinking agents are changing it.',
  },
  {
    slug: 'broker-playbook-scaling-your-office-in-2026',
    tag: 'Brokerage',
    title: 'The Broker Playbook: Scaling Your Office in 2026',
    date: 'Jan 22, 2026',
    excerpt: 'Growing a brokerage isn\'t just about adding agents. It\'s about giving them the systems to succeed. We outline the five platforms every modern brokerage should have in place.',
  },
  {
    slug: 'understanding-cap-rates-a-plain-english-guide',
    tag: 'Education',
    title: 'Understanding Cap Rates: A Plain-English Guide for Agents',
    date: 'Jan 14, 2026',
    excerpt: 'Cap rates come up in every commercial deal, yet many agents struggle to explain them confidently. This guide gives you the language and the math to walk any client through it.',
  },
];

export default function Blog() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>
      <LandingNav />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '120px 64px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '56px' }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '20px',
          }}>
            PropMatch Blog
          </span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '48px', color: '#111827', margin: '0 0 16px', lineHeight: 1.1 }}>
            Insights for Real Estate Professionals
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: '#6B7280', margin: 0, maxWidth: '520px', lineHeight: 1.7 }}>
            Strategy, market trends, and tools to help agents and brokers close more deals.
          </p>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
          {POSTS.map((post, i) => (
            <article key={i} style={{
              background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px',
              overflow: 'hidden', transition: 'box-shadow 0.2s ease, border-color 0.2s ease', cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,219,197,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
              {/* Color bar */}
              <div style={{ height: '3px', background: `linear-gradient(90deg, ${ACCENT}, rgba(0,219,197,0.3))` }} />
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.08em', color: ACCENT,
                    background: 'rgba(0,219,197,0.07)', border: '1px solid rgba(0,219,197,0.2)',
                    padding: '2px 8px', borderRadius: '4px',
                  }}>{post.tag}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#9CA3AF' }}>{post.date}</span>
                </div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '16px', color: '#111827', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {post.title}
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#6B7280', margin: '0 0 18px', lineHeight: 1.65 }}>
                  {post.excerpt}
                </p>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: ACCENT, fontWeight: 500 }}>
                  Read article →
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}