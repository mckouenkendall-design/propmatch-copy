import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Eye, Bookmark, Share2, Radio, BookOpen, ChevronRight } from 'lucide-react';

const ACCENT='#00DBC5', LAVENDER='#818cf8', AMBER='#F59E0B';
const PT={office:'General Office',medical_office:'Medical Office',retail:'Retail',industrial_flex:'Industrial / Flex',land:'Land',special_use:'Special Use',single_family:'Single Family',condo:'Condo',apartment:'Apartment',multi_family:'Multi-Family',multi_family_5:'Multi-Family (5+)',townhouse:'Townhouse',manufactured:'Manufactured',land_residential:'Residential Land'};
const TYPE_COLORS=[ACCENT,LAVENDER,AMBER,'#10B981','#F97316','#8B5CF6','#EC4899','rgba(255,255,255,0.3)'];
const CATEGORY_COLORS={Market:ACCENT,Strategy:LAVENDER,Industry:AMBER,Local:'#10B981',Tech:'#8B5CF6',Finance:'#F97316'};

const NEWS_ARTICLES=[
  {id:'n1',tag:'Market',   title:'Real estate AI tools are reshaping how agents close deals in 2026',         time:'Trending', slug:'n1'},
  {id:'n2',tag:'Strategy', title:'Why B2B agent-to-agent matching is becoming the new standard',               time:'Industry', slug:'n2'},
  {id:'n3',tag:'Market',   title:'Michigan commercial real estate: office vacancies fall for third straight quarter', time:'Local', slug:'n3'},
  {id:'n4',tag:'Finance',  title:'Cap rates stabilize as investors return to multifamily assets',              time:'2d ago',   slug:'n4'},
  {id:'n5',tag:'Strategy', title:'How top agents are using requirement posts to win off-market deals',         time:'3d ago',   slug:'n5'},
];

const BLOG_POSTS=[
  {slug:'why-agents-lose-deals-without-a-matching-system',     tag:'Strategy',      read:'4 min', title:'Why Agents Lose Deals Without a Matching System'},
  {slug:'commercial-vs-residential-prospecting-2026',          tag:'Market Insight',read:'5 min', title:"Commercial vs. Residential Prospecting in 2026: What's Changed"},
  {slug:'how-to-build-a-referral-network-that-actually-closes',tag:'Networking',    read:'4 min', title:'How to Build a Referral Network That Actually Closes'},
  {slug:'off-market-deals-finding-them-before-everyone-else',  tag:'Deal Flow',     read:'4 min', title:'Off-Market Deals: Finding Them Before Everyone Else'},
];

const BLOG_COLORS={'Strategy':'#10B981','Market Insight':AMBER,'Networking':LAVENDER,'Deal Flow':ACCENT,'Agent Tips':ACCENT,'Technology':'#8B5CF6','Brokerage':'#F97316','Education':'#EC4899'};

function SectionHeader({title,sub,onAction,actionLabel,color=ACCENT}){return(<div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'18px'}}><div><div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,boxShadow:`0 0 8px ${color}`}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.5)'}}>{title}</span></div>{sub&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.35)',margin:0}}>{sub}</p>}</div>{onAction&&<button onClick={onAction} style={{display:'flex',alignItems:'center',gap:'3px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color,background:'transparent',border:'none',cursor:'pointer',flexShrink:0}}>{actionLabel}<ChevronRight style={{width:'12px',height:'12px'}}/></button>}</div>);}

function polarToXY(cx,cy,r,deg){const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};}

function PropertyTypeDonut({listings,requirements}){
  const all=[...listings,...requirements];
  if(all.length===0)return<div style={{textAlign:'center',padding:'32px 0'}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.28)',margin:0}}>No posts yet</p></div>;
  const raw={};all.forEach(p=>{const k=PT[p.property_type]||p.property_type||'Other';raw[k]=(raw[k]||0)+1;});
  const sorted=Object.entries(raw).sort((a,b)=>b[1]-a[1]);
  const top5=sorted.slice(0,5);const rest=sorted.slice(5).reduce((s,[,n])=>s+n,0);
  const segs=rest>0?[...top5,['Other',rest]]:top5;const total=segs.reduce((s,[,n])=>s+n,0);
  const cx=80,cy=80,R=58,gap=3;let angle=0;
  const arcs=segs.map(([label,count],i)=>{const sweep=(count/total)*360;const start=angle+(i===0?0:gap/2);const end=angle+sweep-(i===segs.length-1?0:gap/2);const s=polarToXY(cx,cy,R,start),e=polarToXY(cx,cy,R,end);const large=sweep>180?1:0;const path=`M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;angle+=sweep;return{path,color:TYPE_COLORS[i%TYPE_COLORS.length],label,count};});
  return(<div style={{display:'flex',alignItems:'center',gap:'32px'}}><div style={{position:'relative',flexShrink:0}}><svg width="160" height="160" viewBox="0 0 160 160"><circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13"/>{arcs.map((a,i)=><path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="13" strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${a.color}60)`}}/>)}</svg><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'26px',fontWeight:700,color:'white',lineHeight:1}}>{total}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>posts</span></div></div><div style={{flex:1,display:'flex',flexDirection:'column',gap:'8px'}}>{arcs.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:a.color,flexShrink:0}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.65)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.label}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:600,color:a.color}}>{a.count}</span></div>)}</div></div>);
}

export default function Insights() {
  const {user}=useAuth();
  const navigate=useNavigate();

  const {data:myListings=[]}     =useQuery({queryKey:['ins-listings'],  queryFn:async()=> { const { data } = await supabase.from('listings').select('*').eq('created_by', user?.email); return data; }});
  const {data:myRequirements=[]} =useQuery({queryKey:['ins-reqs'],      queryFn:async()=> { const { data } = await supabase.from('requirements').select('*').eq('created_by', user?.email); return data; }});

  const allPosts=[...myListings,...myRequirements];
  const views  =allPosts.reduce((s,p)=>s+(p.view_count ||0),0);
  const saves  =allPosts.reduce((s,p)=>s+(p.save_count ||0),0);
  const shares =allPosts.reduce((s,p)=>s+(p.share_count||0),0);

  return(
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'48px 32px 60px'}}>

      <div style={{marginBottom:'36px'}}>
        <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'30px',fontWeight:300,color:'white',margin:'0 0 6px'}}>
          Insights &amp; <span style={{fontWeight:700,color:ACCENT}}>Analytics</span>
        </h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0}}>
          Your portfolio performance, market news, and industry resources — all in one place.
        </p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px',marginBottom:'18px'}}>

        {/* Portfolio Breakdown */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <SectionHeader title="Portfolio Breakdown" sub="Your active listings & requirements by type" color={LAVENDER}/>
          <PropertyTypeDonut listings={myListings} requirements={myRequirements}/>
        </div>

        {/* Post Engagement */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <SectionHeader title="Post Engagement" sub="How agents are interacting with your posts" color={ACCENT}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
            {[{Icon:Eye,label:'Total Views',value:views,color:ACCENT},{Icon:Bookmark,label:'Total Saves',value:saves,color:LAVENDER},{Icon:Share2,label:'Total Shares',value:shares,color:AMBER}].map(({Icon,label,value,color})=>(
              <div key={label} style={{background:`${color}0a`,border:`1px solid ${color}18`,borderRadius:'12px',padding:'16px',textAlign:'center'}}>
                <Icon style={{width:'18px',height:'18px',color,margin:'0 auto 10px',display:'block'}}/>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'26px',fontWeight:700,color,lineHeight:1,marginBottom:'5px'}}>{value.toLocaleString()}</div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.2)',margin:0,lineHeight:1.5}}>
            Add <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>view_count</code>, <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>save_count</code>, <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>share_count</code> fields to your entities to activate live tracking.
          </p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'18px'}}>

        {/* News Wire */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <SectionHeader title="PropMatch News Wire" sub="Real estate news curated for agents" onAction={()=>navigate('/NewsWire')} actionLabel="View All" color={ACCENT}/>
          <div style={{display:'flex',flexDirection:'column'}}>
            {NEWS_ARTICLES.map((item,i)=>(
              <div key={item.id} onClick={()=>navigate('/NewsWire',{state:{openIndex:i}})}
                style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px 0',borderBottom:i<NEWS_ARTICLES.length-1?'1px solid rgba(255,255,255,0.05)':'none',cursor:'pointer',transition:'opacity 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.75'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                <div style={{width:'4px',height:'4px',borderRadius:'50%',background:CATEGORY_COLORS[item.tag]||ACCENT,marginTop:'6px',flexShrink:0,boxShadow:`0 0 6px ${CATEGORY_COLORS[item.tag]||ACCENT}`}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:CATEGORY_COLORS[item.tag]||ACCENT,background:`${CATEGORY_COLORS[item.tag]||ACCENT}12`,border:`1px solid ${CATEGORY_COLORS[item.tag]||ACCENT}25`,borderRadius:'4px',padding:'1px 6px'}}>{item.tag}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>{item.time}</span>
                  </div>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.72)',margin:0,lineHeight:1.4}}>{item.title}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'14px',padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.08)',borderRadius:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
            <Radio style={{width:'12px',height:'12px',color:ACCENT,flexShrink:0}}/>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.25)',margin:0}}>Live AI news wire coming soon — real estate news in real time.</p>
          </div>
        </div>

        {/* Blog & Insights */}
        <div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'24px'}}>
          <SectionHeader title="Blog & Insights" sub="Guides and strategy for top producers" onAction={()=>navigate('/BlogFeed')} actionLabel="View All" color={LAVENDER}/>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {BLOG_POSTS.map((post,i)=>{const color=BLOG_COLORS[post.tag]||LAVENDER;return(
              <div key={post.slug} onClick={()=>navigate('/BlogFeed',{state:{openSlug:post.slug}})}
                style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'10px',cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor=`${color}25`;}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px'}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color,background:`${color}15`,border:`1px solid ${color}25`,borderRadius:'4px',padding:'1px 6px'}}>{post.tag}</span>
                    <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>{post.read} read</span>
                  </div>
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.78)',margin:0,lineHeight:1.4}}>{post.title}</p>
                </div>
              </div>
            );})}
          </div>
          <div style={{marginTop:'14px',padding:'10px 14px',background:'rgba(255,255,255,0.03)',border:'1px dashed rgba(255,255,255,0.08)',borderRadius:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
            <BookOpen style={{width:'12px',height:'12px',color:LAVENDER,flexShrink:0}}/>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.25)',margin:0}}>Full blog launching soon — deep dives for agents who want to work smarter.</p>
          </div>
        </div>

      </div>
    </div>
  );
}