import React, { useState } from 'react';
import { BookOpen, Clock, ChevronRight } from 'lucide-react';

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';
const AMBER = '#F59E0B';

const CATEGORY_COLORS = {
  Strategy:'#10B981','Market Insight':AMBER,Networking:LAVENDER,'Deal Flow':ACCENT,
  'Agent Tips':ACCENT,Technology:'#8B5CF6',Brokerage:'#F97316',Education:'#EC4899',
  Guide:ACCENT,Tips:LAVENDER,'Deep Dive':AMBER,Market:'#F97316',Industry:'#8B5CF6',
};

const POSTS = [
  {slug:'why-agents-lose-deals-without-a-matching-system',tag:'Strategy',title:"Why Agents Lose Deals Without a Matching System",date:'Mar 12, 2026',excerpt:"Most agents rely on memory, spreadsheets, and luck to match clients with properties. We analyzed how much revenue that costs the average agent per year — and the number is staggering."},
  {slug:'commercial-vs-residential-prospecting-2026',tag:'Market Insight',title:"Commercial vs. Residential Prospecting in 2026: What\'s Changed",date:'Mar 7, 2026',excerpt:"The way buyers and tenants search for commercial space has shifted dramatically. Here\'s what agents need to know to stay ahead of the curve in 2026."},
  {slug:'how-to-build-a-referral-network-that-actually-closes',tag:'Networking',title:'How to Build a Referral Network That Actually Closes',date:'Feb 28, 2026',excerpt:'Referral networks sound great in theory. In practice, most agents send referrals into a black hole.'},
  {slug:'off-market-deals-finding-them-before-everyone-else',tag:'Deal Flow',title:'Off-Market Deals: Finding Them Before Everyone Else',date:'Feb 19, 2026',excerpt:"The best deals rarely hit MLS. We break down the habits, tools, and relationships that top-performing agents use to consistently find off-market inventory."},
  {slug:'what-every-new-agent-gets-wrong-about-requirements',tag:'Agent Tips',title:'What Every New Agent Gets Wrong About Client Requirements',date:'Feb 10, 2026',excerpt:"New agents spend hours showing properties that don\'t match. The problem isn\'t effort — it\'s how requirements are captured."},
  {slug:'the-case-for-digital-deal-management-in-real-estate',tag:'Technology',title:'The Case for Digital Deal Management in Real Estate',date:'Jan 31, 2026',excerpt:"Real estate is one of the last industries still running major transactions on paper notes and phone calls."},
  {slug:'broker-playbook-scaling-your-office-in-2026',tag:'Brokerage',title:'The Broker Playbook: Scaling Your Office in 2026',date:'Jan 22, 2026',excerpt:"Growing a brokerage isn\'t just about adding agents. It\'s about giving them the systems to succeed."},
  {slug:'understanding-cap-rates-a-plain-english-guide',tag:'Education',title:'Understanding Cap Rates: A Plain-English Guide for Agents',date:'Jan 14, 2026',excerpt:"Cap rates come up in every commercial deal, yet many agents struggle to explain them confidently."},
];

const CATEGORIES = ['All', ...new Set(POSTS.map(p => p.tag))];

export default function BlogFeed() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openPost, setOpenPost] = useState(null);

  const filtered = POSTS.filter(p => activeCategory === 'All' || p.tag === activeCategory);

  if (openPost) return (
    <div style={{ maxWidth:'720px', margin:'0 auto', padding:'48px 32px 60px' }}>
      <button onClick={()=>setOpenPost(null)} style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'rgba(255,255,255,0.45)', fontFamily:"'Inter',sans-serif", fontSize:'13px', cursor:'pointer', marginBottom:'32px', padding:0 }}>
        ← Back to Blog
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, color:CATEGORY_COLORS[openPost.tag]||ACCENT, background:`${CATEGORY_COLORS[openPost.tag]||ACCENT}15`, border:`1px solid ${CATEGORY_COLORS[openPost.tag]||ACCENT}30`, borderRadius:'4px', padding:'2px 8px' }}>{openPost.tag}</span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>{openPost.date}</span>
      </div>
      <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:600, color:'white', margin:'0 0 20px', lineHeight:1.3 }}>{openPost.title}</h1>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', color:'rgba(255,255,255,0.55)', lineHeight:1.8, margin:'0 0 32px' }}>{openPost.excerpt}</p>
      <div style={{ padding:'24px', background:'rgba(255,255,255,0.03)', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'12px' }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.28)', margin:0 }}>Full article coming soon — PropMatch blog content is being written and will appear here.</p>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:'960px', margin:'0 auto', padding:'48px 32px 60px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${LAVENDER}15`, border:`1px solid ${LAVENDER}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BookOpen style={{ width:'18px', height:'18px', color:LAVENDER }}/>
        </div>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:300, color:'white', margin:0 }}>
          Blog &amp; <span style={{ fontWeight:700, color:LAVENDER }}>Insights</span>
        </h1>
      </div>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:'0 0 28px' }}>
        Strategy, market trends, and tools to help you close more deals.
      </p>

      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'28px' }}>
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat;
          const color = CATEGORY_COLORS[cat] || LAVENDER;
          return (
            <button key={cat} onClick={()=>setActiveCategory(cat)}
              style={{ padding:'7px 14px', background:active?`${color}18`:'rgba(255,255,255,0.05)', border:`1px solid ${active?color+'40':'rgba(255,255,255,0.1)'}`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:active?600:400, color:active?color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.15s' }}>
              {cat}
            </button>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
        {filtered.map((post,i) => {
          const color = CATEGORY_COLORS[post.tag] || LAVENDER;
          return (
            <div key={i} onClick={()=>setOpenPost(post)}
              style={{ padding:'22px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', gap:'10px' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor=`${color}30`; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
              <div style={{ height:'2px', background:`linear-gradient(90deg,${color},${color}30)`, borderRadius:'2px' }}/>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}25`, borderRadius:'4px', padding:'2px 7px' }}>{post.tag}</span>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>{post.date}</span>
              </div>
              <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:500, color:'rgba(255,255,255,0.88)', margin:0, lineHeight:1.4 }}>{post.title}</h3>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0, lineHeight:1.5, flex:1 }}>{post.excerpt}</p>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color, fontWeight:500 }}>Read article →</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}