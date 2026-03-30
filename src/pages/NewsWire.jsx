import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radio, ExternalLink, Search } from 'lucide-react';

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';
const AMBER = '#F59E0B';

const CATEGORY_COLORS = {
  Market:   ACCENT,
  Strategy: LAVENDER,
  Industry: AMBER,
  Local:    '#10B981',
  Tech:     '#8B5CF6',
  Finance:  '#F97316',
};

// Placeholder articles — replaced by real data once NewsArticle entity is populated
const PLACEHOLDER_ARTICLES = [
  { id:'p1', title:'Real estate AI tools are reshaping how agents close deals in 2026',         category:'Tech',     source:'PropMatch',   published_date: new Date(Date.now()-1*60*60*1000).toISOString(),    summary:'AI-powered matching and deal analysis are becoming standard practice for top-performing agents across the country.' },
  { id:'p2', title:'Why B2B agent-to-agent matching is becoming the new standard',              category:'Industry', source:'PropMatch',   published_date: new Date(Date.now()-3*60*60*1000).toISOString(),    summary:'Off-market collaboration between agents is driving faster closings and higher client satisfaction scores industry-wide.' },
  { id:'p3', title:'Michigan commercial real estate: office vacancies fall for third straight quarter', category:'Market', source:'PropMatch', published_date: new Date(Date.now()-6*60*60*1000).toISOString(), summary:'Southeast Michigan office occupancy is recovering faster than national averages, with Auburn Hills and Troy leading the rebound.' },
  { id:'p4', title:'Cap rates stabilize as investors return to multifamily assets',              category:'Finance',  source:'PropMatch',   published_date: new Date(Date.now()-12*60*60*1000).toISOString(),   summary:'After two years of compression, cap rates on multifamily properties are finding equilibrium as the rate environment settles.' },
  { id:'p5', title:'How top agents are using requirement posts to win off-market deals',         category:'Strategy', source:'PropMatch',   published_date: new Date(Date.now()-24*60*60*1000).toISOString(),   summary:'Agents who post buyer requirements are closing 40% more off-market transactions than those relying solely on MLS activity.' },
  { id:'p6', title:'Industrial and flex space demand surges across metro Detroit',               category:'Market',   source:'PropMatch',   published_date: new Date(Date.now()-36*60*60*1000).toISOString(),   summary:'E-commerce logistics and light manufacturing are driving record demand for flex space in Oakland and Macomb counties.' },
  { id:'p7', title:'Proptech funding rebounds: $2.1B raised in Q1 2026',                       category:'Industry', source:'PropMatch',   published_date: new Date(Date.now()-48*60*60*1000).toISOString(),   summary:'Venture capital is flowing back into real estate technology after a cautious 2025, with AI-first platforms attracting the largest rounds.' },
  { id:'p8', title:'Interest rate outlook: what agents need to tell their clients right now',    category:'Finance',  source:'PropMatch',   published_date: new Date(Date.now()-72*60*60*1000).toISOString(),   summary:'With the Fed signaling two potential cuts in 2026, here is what the timeline means for buyers, sellers, and lease renewals.' },
];

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

export default function NewsWire() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  // When NewsArticle entity is created in Base44, swap this for a real query:
  // const { data: articles = [] } = useQuery({ queryKey:['news-articles'], queryFn:()=>base44.entities.NewsArticle.list('-published_date', 50) });
  const articles = PLACEHOLDER_ARTICLES;

  const categories = ['All', ...Object.keys(CATEGORY_COLORS)];
  const filtered = articles.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catColor = CATEGORY_COLORS[activeCategory] || ACCENT;

  return (
    <div style={{ maxWidth:'860px', margin:'0 auto', padding:'48px 32px 60px' }}>

      {/* Header */}
      <div style={{ marginBottom:'32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radio style={{ width:'18px', height:'18px', color:ACCENT }}/>
          </div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:300, color:'white', margin:0 }}>
            PropMatch <span style={{ fontWeight:700, color:ACCENT }}>News Wire</span>
          </h1>
        </div>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:0 }}>
          Real estate news, market insights, and industry updates — curated for agents.
        </p>
      </div>

      {/* Search + Filter */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <Search style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'14px', height:'14px', color:'rgba(255,255,255,0.3)' }}/>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Search news..."
            style={{ width:'100%', padding:'9px 12px 9px 34px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none', boxSizing:'border-box' }}
          />
        </div>
        <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
          {categories.map(cat => {
            const active = activeCategory === cat;
            const color = CATEGORY_COLORS[cat] || ACCENT;
            return (
              <button key={cat} onClick={()=>setActiveCategory(cat)}
                style={{ padding:'7px 14px', background:active?`${color}18`:'rgba(255,255,255,0.05)', border:`1px solid ${active?color+'40':'rgba(255,255,255,0.1)'}`, borderRadius:'20px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:active?600:400, color:active?color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.15s' }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:`${ACCENT}0a`, border:`1px solid ${ACCENT}20`, borderRadius:'10px', marginBottom:'24px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:ACCENT, boxShadow:`0 0 8px ${ACCENT}`, flexShrink:0, animation:'pulse 2s ease-in-out infinite' }}/>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:`${ACCENT}cc`, margin:0 }}>
          Live news wire coming soon — PropMatch AI will automatically surface and update real estate news in real time.
        </p>
        <style>{`@keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
      </div>

      {/* Articles */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,0.3)', fontFamily:"'Inter',sans-serif", fontSize:'14px' }}>
          No articles match your filter.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:'rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden' }}>
          {filtered.map((article, i) => {
            const color = CATEGORY_COLORS[article.category] || ACCENT;
            return (
              <div key={article.id}
                style={{ display:'flex', alignItems:'flex-start', gap:'16px', padding:'18px 20px', background:'#0e1318', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='#0e1318'}>
                <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:color, marginTop:'8px', flexShrink:0, boxShadow:`0 0 6px ${color}` }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}25`, borderRadius:'4px', padding:'2px 7px' }}>{article.category}</span>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>{article.source}</span>
                    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>{timeAgo(article.published_date)}</span>
                  </div>
                  <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:500, color:'rgba(255,255,255,0.88)', margin:'0 0 5px', lineHeight:1.4 }}>{article.title}</p>
                  {article.summary && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.42)', margin:0, lineHeight:1.5 }}>{article.summary}</p>}
                </div>
                {article.source_url && (
                  <ExternalLink style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.2)', flexShrink:0, marginTop:'4px' }}/>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}