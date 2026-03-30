import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, TrendingUp, MessageCircle, Bell, Bookmark, BookmarkCheck, Plus, ChevronRight, FileText, ArrowUpRight, X, BarChart2, Eye, Share2 } from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '@/utils/matchScore';

const ACCENT='#00DBC5', LAVENDER='#818cf8', AMBER='#F59E0B';
const PT={office:'General Office',medical_office:'Medical Office',retail:'Retail',industrial_flex:'Industrial / Flex',land:'Land',special_use:'Special Use',single_family:'Single Family',condo:'Condo',apartment:'Apartment',multi_family:'Multi-Family',multi_family_5:'Multi-Family (5+)',townhouse:'Townhouse',manufactured:'Manufactured',land_residential:'Residential Land'};
const TX={lease:'Lease',sublease:'Sublease',sale:'Sale',rent:'Rent',purchase:'Purchase'};
const TYPE_COLORS=[ACCENT,LAVENDER,AMBER,'#10B981','#F97316','#8B5CF6','#EC4899','rgba(255,255,255,0.3)'];

function timeAgo(d){if(!d)return'';const m=Math.floor((Date.now()-new Date(d))/60000);if(m<1)return'just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;const days=Math.floor(h/24);if(days<7)return`${days}d ago`;return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening';}
function getSavedKeys(e){try{return JSON.parse(localStorage.getItem(`propmatch_saved_${e}`)||'[]');}catch{return[];}}
function fmtPrice(p,isL){const n=v=>{const x=parseFloat(v);return(!v||isNaN(x))?null:x%1===0?x.toLocaleString():x.toLocaleString('en-US',{maximumFractionDigits:2});};if(isL){const f=n(p.price);if(!f)return null;const u=p.transaction_type==='lease'||p.transaction_type==='sublease'?'/SF/yr':p.transaction_type==='rent'?'/mo':'';return`$${f}${u}`;}const u=p.price_period==='per_month'?'/mo':p.price_period==='per_sf_per_year'?'/SF/yr':p.price_period==='annually'?'/yr':(p.transaction_type==='lease'||p.transaction_type==='rent')?'/mo':'';const lo=n(p.min_price),hi=n(p.max_price);if(lo&&hi)return`$${lo}\u2013$${hi}${u}`;if(hi)return`Up to $${hi}${u}`;if(lo)return`From $${lo}${u}`;return null;}

function MiniScore({score,size=44}){const color=getScoreColor(score),r=size*.38,circ=2*Math.PI*r,dash=(score/100)*circ;return(<div style={{position:'relative',width:size,height:size,flexShrink:0}}><svg width={size} height={size} style={{transform:'rotate(-90deg)'}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*.088}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*.088} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 ${size*.07}px ${color}90)`}}/></svg><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:size*.27+'px',fontWeight:700,color,lineHeight:1}}>{score}</span></div></div>);}

function StatCard({value,label,color,Icon,badge}){return(<div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${color}20`,borderRadius:'14px',padding:'18px 20px',flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}><div style={{width:'34px',height:'34px',borderRadius:'9px',background:`${color}15`,border:`1px solid ${color}25`,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon style={{width:'16px',height:'16px',color}}/></div>{badge&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:600,color:AMBER,background:`${AMBER}15`,border:`1px solid ${AMBER}30`,borderRadius:'20px',padding:'2px 8px'}}>{badge}</span>}</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'28px',fontWeight:700,color,lineHeight:1,marginBottom:'5px'}}>{value}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>{label}</div></div>);}

function SectionHeader({title,onAction,actionLabel,color=ACCENT}){return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,boxShadow:`0 0 8px ${color}`}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.5)'}}>{title}</span></div>{onAction&&<button onClick={onAction} style={{display:'flex',alignItems:'center',gap:'3px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color,background:'transparent',border:'none',cursor:'pointer'}}>{actionLabel}<ChevronRight style={{width:'12px',height:'12px'}}/></button>}</div>);}

function MatchCard({myPost,match,onNavigate}){const[hov,setHov]=useState(false);const isL=myPost.postType==='listing';const mc=isL?ACCENT:LAVENDER;const mp=(isL?match.requirement:match.listing)||{};const label=getScoreLabel(match.totalScore);const sc=getScoreColor(match.totalScore);return(<div onClick={onNavigate} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 13px',background:hov?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',border:`1px solid ${hov?mc+'30':'rgba(255,255,255,0.07)'}`,borderRadius:'11px',cursor:'pointer',transition:'all 0.15s'}}><MiniScore score={match.totalScore} size={44}/><div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:mc,textTransform:'uppercase',letterSpacing:'0.05em'}}>Your {isL?'Listing':'Req'}</span>{label&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:sc,background:`${sc}15`,border:`1px solid ${sc}28`,borderRadius:'20px',padding:'1px 7px'}}>{label}</span>}</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{myPost.title}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.38)',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>↔ {mp.title}</p></div><ArrowUpRight style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.18)',flexShrink:0}}/></div>);}

function PostCard({post,maxCount,onNavigate}){const[hov,setHov]=useState(false);const isL=post.postType==='listing';const color=isL?ACCENT:LAVENDER;const{total=0,strong=0,good=0,fair=0}=post;const barPct=maxCount>0?(total/maxCount)*100:0;const price=fmtPrice(post,isL);const Dot=({c,dc})=>c===0?null:(<div style={{display:'flex',alignItems:'center',gap:'3px'}}><div style={{width:'7px',height:'7px',borderRadius:'50%',background:dc,boxShadow:dc!=='rgba(255,255,255,0.25)'?`0 0 5px ${dc}80`:'none'}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:600,color:dc}}>{c}</span></div>);return(<div onClick={onNavigate} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{padding:'13px 15px',background:hov?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${hov?color+'22':'rgba(255,255,255,0.06)'}`,borderRadius:'11px',cursor:'pointer',transition:'all 0.15s'}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'8px'}}><div style={{flex:1,minWidth:0,marginRight:'12px'}}><div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'3px'}}><div style={{width:'5px',height:'5px',borderRadius:'50%',background:color}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color}}>{isL?'Listing':'Requirement'}</span></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.title}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.32)',margin:'2px 0 0'}}>{PT[post.property_type]||post.property_type}{post.city?` · ${post.city}`:''}{price?` · ${price}`:''}</p></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'22px',fontWeight:700,color:total===0?'rgba(255,255,255,0.2)':total>=3?color:AMBER,lineHeight:1}}>{total}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>{total===1?'match':'matches'}</div></div></div>{total>0&&<div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}><Dot c={strong} dc={ACCENT}/><Dot c={good} dc={AMBER}/><Dot c={fair} dc="rgba(255,255,255,0.25)"/></div>}<div style={{height:'3px',background:'rgba(255,255,255,0.05)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',width:`${barPct}%`,background:`linear-gradient(90deg,${color}90,${color})`,borderRadius:'2px',transition:'width 0.8s',boxShadow:barPct>0?`0 0 6px ${color}60`:'none'}}/></div></div>);}

function SavedMatchRow({listing,requirement,onNavigate}){const result=useMemo(()=>calculateMatchScore(listing,requirement),[listing.id,requirement.id]);const[hov,setHov]=useState(false);const sc=getScoreColor(result.totalScore);const label=getScoreLabel(result.totalScore);return(<div onClick={onNavigate} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',background:hov?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',border:`1px solid ${hov?sc+'30':'rgba(255,255,255,0.07)'}`,borderRadius:'10px',cursor:'pointer',transition:'all 0.15s'}}><MiniScore score={result.totalScore} size={38}/><div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'2px'}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.8)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{listing.title}</p>{label&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:'9px',fontWeight:700,color:sc,background:`${sc}15`,borderRadius:'20px',padding:'1px 6px',flexShrink:0}}>{label}</span>}</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.32)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{requirement.title}</p></div><BookmarkCheck style={{width:'13px',height:'13px',color:AMBER,flexShrink:0}}/></div>);}

function ActivityRow({Icon,iconColor,title,sub,time}){return(<div style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><div style={{width:'28px',height:'28px',borderRadius:'8px',background:`${iconColor}15`,border:`1px solid ${iconColor}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px'}}><Icon style={{width:'13px',height:'13px',color:iconColor}}/></div><div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.8)',margin:0,lineHeight:1.4}}>{title}</p>{sub&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.32)',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</p>}</div><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.22)',flexShrink:0,marginTop:'2px'}}>{time}</span></div>);}

function polarToXY(cx,cy,r,deg){const rad=(deg-90)*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)};}
function PropertyTypeDonut({listings,requirements}){const all=[...listings,...requirements];if(all.length===0)return<div style={{textAlign:'center',padding:'24px 0'}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.28)',margin:0}}>No posts yet</p></div>;const raw={};all.forEach(p=>{const k=PT[p.property_type]||p.property_type||'Other';raw[k]=(raw[k]||0)+1;});const sorted=Object.entries(raw).sort((a,b)=>b[1]-a[1]);const top5=sorted.slice(0,5);const rest=sorted.slice(5).reduce((s,[,n])=>s+n,0);const segs=rest>0?[...top5,['Other',rest]]:top5;const total=segs.reduce((s,[,n])=>s+n,0);const cx=80,cy=80,R=58,gap=3;let angle=0;const arcs=segs.map(([label,count],i)=>{const sweep=(count/total)*360;const start=angle+(i===0?0:gap/2);const end=angle+sweep-(i===segs.length-1?0:gap/2);const s=polarToXY(cx,cy,R,start),e=polarToXY(cx,cy,R,end);const large=sweep>180?1:0;const path=`M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;angle+=sweep;return{path,color:TYPE_COLORS[i%TYPE_COLORS.length],label,count};});return(<div style={{display:'flex',alignItems:'center',gap:'20px'}}><div style={{position:'relative',flexShrink:0}}><svg width="160" height="160" viewBox="0 0 160 160"><circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="13"/>{arcs.map((a,i)=><path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth="13" strokeLinecap="round" style={{filter:`drop-shadow(0 0 5px ${a.color}60)`}}/>)}</svg><div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'26px',fontWeight:700,color:'white',lineHeight:1}}>{total}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.35)',marginTop:'3px',textTransform:'uppercase',letterSpacing:'0.08em'}}>posts</span></div></div><div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:'7px'}}>{arcs.map((a,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:a.color,flexShrink:0}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.65)',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.label}</span><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:600,color:a.color}}>{a.count}</span></div>)}</div></div>);}

function EngagementStats({listings,requirements}){const all=[...listings,...requirements];const views=all.reduce((s,p)=>s+(p.view_count||0),0);const saves=all.reduce((s,p)=>s+(p.save_count||0),0);const shares=all.reduce((s,p)=>s+(p.share_count||0),0);return(<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>{[{Icon:Eye,label:'Views',value:views,color:ACCENT},{Icon:Bookmark,label:'Saves',value:saves,color:LAVENDER},{Icon:Share2,label:'Shares',value:shares,color:AMBER}].map(({Icon,label,value,color})=><div key={label} style={{background:`${color}0a`,border:`1px solid ${color}18`,borderRadius:'11px',padding:'14px 12px',textAlign:'center'}}><Icon style={{width:'16px',height:'16px',color,margin:'0 auto 8px',display:'block'}}/><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'22px',fontWeight:700,color,lineHeight:1,marginBottom:'4px'}}>{value.toLocaleString()}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div></div>)}</div>);}

function QuickPostModal({onClose,navigate}){return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={onClose}><div style={{background:'#0E1318',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'20px',width:'100%',maxWidth:'400px',overflow:'hidden'}} onClick={e=>e.stopPropagation()}><div style={{padding:'22px 24px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><h3 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'18px',fontWeight:600,color:'white',margin:'0 0 3px'}}>Create a Post</h3><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.4)',margin:0}}>What are you posting today?</p></div><button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'6px',cursor:'pointer',display:'flex'}}><X style={{width:'15px',height:'15px',color:'rgba(255,255,255,0.5)'}}/></button></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',padding:'10px 24px 24px'}}>{[{type:'listing',Icon:Building2,color:ACCENT,label:'Listing',sub:'A property you represent',path:'/create-listing'},{type:'requirement',Icon:Search,color:LAVENDER,label:'Requirement',sub:"What your client needs",path:'/create-requirement'}].map(o=><button key={o.type} onClick={()=>{navigate(o.path);onClose();}} style={{padding:'22px 16px',background:`${o.color}0e`,border:`1px solid ${o.color}28`,borderRadius:'14px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background=`${o.color}1e`;e.currentTarget.style.borderColor=`${o.color}55`;}} onMouseLeave={e=>{e.currentTarget.style.background=`${o.color}0e`;e.currentTarget.style.borderColor=`${o.color}28`;}}><div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${o.color}18`,border:`1px solid ${o.color}30`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px'}}><o.Icon style={{width:'18px',height:'18px',color:o.color}}/></div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:600,color:o.color,marginBottom:'4px'}}>{o.label}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)',lineHeight:1.4}}>{o.sub}</div></button>)}</div></div></div>);}

export default function Dashboard() {
  const {user}=useAuth();
  const navigate=useNavigate();
  const [showQuickPost,setShowQuickPost]=useState(false);

  const {data:myListings=[]}      =useQuery({queryKey:['cc-my-listings'],     queryFn:()=>base44.entities.Listing.filter({created_by:user?.email})});
  const {data:myRequirements=[]}  =useQuery({queryKey:['cc-my-reqs'],         queryFn:()=>base44.entities.Requirement.filter({created_by:user?.email})});
  const {data:allListings=[]}     =useQuery({queryKey:['cc-all-listings'],    queryFn:()=>base44.entities.Listing.list('-created_date',80)});
  const {data:allRequirements=[]} =useQuery({queryKey:['cc-all-reqs'],        queryFn:()=>base44.entities.Requirement.list('-created_date',80)});
  const {data:myProfile}          =useQuery({queryKey:['cc-profile'],         queryFn:()=>base44.entities.UserProfile.filter({user_email:user?.email}).then(r=>r[0])});
  const {data:notifications=[]}   =useQuery({queryKey:['cc-notifications'],   queryFn:()=>base44.entities.Notification.filter({recipient_email:user?.email})});
  const {data:myTemplates=[]}     =useQuery({queryKey:['cc-templates'],       queryFn:()=>base44.entities.Template.filter({created_by:user?.email})});

  const firstName=myProfile?.full_name?.split(' ')[0]||user?.email?.split('@')[0]||'there';
  const savedKeys=getSavedKeys(user?.email);

  const {topMatches,postMatchCounts,totalMatchCount,thisWeekCount}=useMemo(()=>{
    const otherL=allListings.filter(l=>l.created_by!==user?.email);
    const otherR=allRequirements.filter(r=>r.created_by!==user?.email);
    const all=[],counts={},weekAgo=Date.now()-7*24*60*60*1000;
    let weekCount=0;
    const add=(id,score)=>{if(!counts[id])counts[id]={total:0,strong:0,good:0,fair:0};counts[id].total++;if(score>=70)counts[id].strong++;else if(score>=50)counts[id].good++;else counts[id].fair++;};
    myListings.forEach(listing=>otherR.forEach(req=>{const r=calculateMatchScore(listing,req);if(r.isMatch){all.push({myPost:{...listing,postType:'listing'},listing,requirement:req,...r});add(listing.id,r.totalScore);if(new Date(req.created_date).getTime()>weekAgo)weekCount++;}}));
    myRequirements.forEach(req=>otherL.forEach(listing=>{const r=calculateMatchScore(listing,req);if(r.isMatch){all.push({myPost:{...req,postType:'requirement'},listing,requirement:req,...r});add(req.id,r.totalScore);}}));
    all.sort((a,b)=>b.totalScore-a.totalScore);
    return{topMatches:all.slice(0,6),postMatchCounts:counts,totalMatchCount:all.length,thisWeekCount:weekCount};
  },[myListings,myRequirements,allListings,allRequirements,user?.email]);

  const postsForAnalytics=useMemo(()=>[
    ...myListings.map(l=>({...l,postType:'listing',...(postMatchCounts[l.id]||{total:0,strong:0,good:0,fair:0})})),
    ...myRequirements.map(r=>({...r,postType:'requirement',...(postMatchCounts[r.id]||{total:0,strong:0,good:0,fair:0})})),
  ].sort((a,b)=>b.total-a.total).slice(0,7),[myListings,myRequirements,postMatchCounts]);
  const maxMatchCount=Math.max(...postsForAnalytics.map(p=>p.total),1);

  const savedMatches=useMemo(()=>{
    const allL=[...myListings,...allListings],allR=[...myRequirements,...allRequirements];
    return savedKeys.map(key=>{const[lid,rid]=key.split('|');const l=allL.find(x=>x.id===lid),r=allR.find(x=>x.id===rid);return l&&r?{listing:l,requirement:r}:null;}).filter(Boolean).slice(0,5);
  },[savedKeys.join(','),myListings,myRequirements,allListings,allRequirements]);

  const activityFeed=useMemo(()=>{
    const items=[...notifications].sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).slice(0,6).map(n=>({id:n.id,Icon:Bell,color:ACCENT,title:n.message||n.title||'New notification',sub:null,time:timeAgo(n.created_date),ts:new Date(n.created_date).getTime()}));
    if(items.length<4)topMatches.slice(0,4-items.length).forEach((m,i)=>{const sc=getScoreColor(m.totalScore);items.push({id:`m-${i}`,Icon:TrendingUp,color:sc,title:`${m.totalScore}% match — ${m.myPost.title}`,sub:m.requirement?.title||m.listing?.title||'',time:timeAgo(m.myPost.created_date),ts:new Date(m.myPost.created_date).getTime()||0});});
    return items.sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,7);
  },[notifications,topMatches]);

  const unreadNotifs=notifications.filter(n=>!n.read).length;
  const card=(title,children)=><div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'22px'}}>{title}{children}</div>;

  return (
    <div style={{maxWidth:'1160px',margin:'0 auto',padding:'44px 32px 60px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'30px',flexWrap:'wrap',gap:'16px'}}>
        <div>
          <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'30px',fontWeight:300,color:'white',margin:'0 0 5px',lineHeight:1.2}}>{greeting()}, <span style={{fontWeight:700,color:ACCENT}}>{firstName}</span></h1>
          <p style={{fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.38)',margin:0}}>Here's your PropMatch overview for today.</p>
        </div>
        <button onClick={()=>setShowQuickPost(true)} style={{display:'flex',alignItems:'center',gap:'8px',padding:'11px 22px',background:ACCENT,border:'none',borderRadius:'10px',fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'14px',fontWeight:600,color:'#111827',cursor:'pointer',boxShadow:`0 4px 20px ${ACCENT}45`,transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 28px ${ACCENT}65`;}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=`0 4px 20px ${ACCENT}45`;}}>
          <Plus style={{width:'16px',height:'16px'}}/> New Post
        </button>
      </div>

      {/* Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
        <StatCard value={myListings.length}     label="Active Listings"      color={ACCENT}   Icon={Building2} />
        <StatCard value={myRequirements.length} label="Requirements"         color={LAVENDER} Icon={Search}    />
        <StatCard value={totalMatchCount}       label="Total Matches"        color={AMBER}    Icon={TrendingUp} badge={thisWeekCount>0?`+${thisWeekCount} this week`:undefined}/>
        <StatCard value={unreadNotifs||0}       label="Notifications"        color="rgba(255,255,255,0.45)" Icon={Bell}/>
      </div>

      {/* 2-col grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:'18px',alignItems:'start'}}>

        {/* LEFT COLUMN */}
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>

          {/* Top Matches */}
          {card(<SectionHeader title="Top Matches" onAction={()=>navigate('/Matches')} actionLabel="View All" color={ACCENT}/>,
            topMatches.length===0
              ? <div style={{textAlign:'center',padding:'32px 16px'}}><TrendingUp style={{width:'32px',height:'32px',color:'rgba(255,255,255,0.1)',margin:'0 auto 10px',display:'block'}}/><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:'0 0 12px'}}>No matches yet</p><button onClick={()=>setShowQuickPost(true)} style={{padding:'7px 16px',background:`${ACCENT}15`,border:`1px solid ${ACCENT}35`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:ACCENT,cursor:'pointer'}}>Create a post</button></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>{topMatches.map((m,i)=><MatchCard key={i} myPost={m.myPost} match={m} onNavigate={()=>navigate('/Matches')}/>)}</div>
          )}

          {/* My Active Posts */}
          {card(<SectionHeader title="My Active Posts" onAction={()=>navigate('/MyPosts')} actionLabel="Manage" color={LAVENDER}/>,
            postsForAnalytics.length===0
              ? <div style={{textAlign:'center',padding:'32px 16px'}}><FileText style={{width:'32px',height:'32px',color:'rgba(255,255,255,0.1)',margin:'0 auto 10px',display:'block'}}/><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:'0 0 12px'}}>No posts yet</p><button onClick={()=>setShowQuickPost(true)} style={{padding:'7px 16px',background:`${ACCENT}15`,border:`1px solid ${ACCENT}35`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:ACCENT,cursor:'pointer'}}>Create your first post</button></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>{postsForAnalytics.map((p,i)=><PostCard key={p.id||i} post={p} maxCount={maxMatchCount} onNavigate={()=>navigate('/Matches')}/>)}</div>
          )}

          {/* News Wire */}
          {card(<SectionHeader title="PropMatch News Wire" onAction={()=>navigate('/NewsWire')} actionLabel="View All" color={ACCENT}/>,
            <div>
              <div style={{display:'flex',flexDirection:'column'}}>
                {[{tag:'Market',title:'Real estate AI tools are reshaping how agents close deals in 2026',time:'Trending'},{tag:'Strategy',title:'Why B2B agent-to-agent matching is becoming the new standard',time:'Industry'},{tag:'Market',title:'Michigan commercial real estate: office vacancies fall for third straight quarter',time:'Local'}].map((item,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'12px',padding:'12px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.05)':'none'}}>
                    <div style={{width:'4px',height:'4px',borderRadius:'50%',background:ACCENT,marginTop:'6px',flexShrink:0,boxShadow:`0 0 6px ${ACCENT}`}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                        <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:ACCENT,background:`${ACCENT}12`,border:`1px solid ${ACCENT}25`,borderRadius:'4px',padding:'1px 6px'}}>{item.tag}</span>
                        <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.2)'}}>{item.time}</span>
                      </div>
                      <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.72)',margin:0,lineHeight:1.4}}>{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Blog */}
          {card(<SectionHeader title="Blog & Insights" onAction={()=>navigate('/Blog')} actionLabel="View All" color={LAVENDER}/>,
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {[{tag:'Guide',title:'How to write a listing that attracts the right agent match',read:'4 min'},{tag:'Tips',title:'Setting your requirement filters: the most common mistakes',read:'3 min'}].map((item,i)=>(
                  <div key={i} style={{padding:'14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.borderColor=`${LAVENDER}30`;}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'7px'}}>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:LAVENDER,background:`${LAVENDER}12`,border:`1px solid ${LAVENDER}25`,borderRadius:'4px',padding:'1px 6px'}}>{item.tag}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.25)'}}>{item.read} read</span>
                    </div>
                    <p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.7)',margin:0,lineHeight:1.4}}>{item.title}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>

          {/* Engagement Stats */}
          {card(<SectionHeader title="Post Engagement" color={ACCENT}/>,
            <div>
              <EngagementStats listings={myListings} requirements={myRequirements}/>
              <p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.2)',margin:'12px 0 0',lineHeight:1.5}}>Add <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>view_count</code>, <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>save_count</code>, <code style={{background:'rgba(255,255,255,0.07)',padding:'1px 4px',borderRadius:'3px'}}>share_count</code> fields in Base44 to activate.</p>
            </div>
          )}

          {/* Portfolio Donut */}
          {card(<SectionHeader title="Portfolio Breakdown" color={LAVENDER}/>,
            <PropertyTypeDonut listings={myListings} requirements={myRequirements}/>
          )}

          {/* Activity */}
          {card(<SectionHeader title="Recent Activity" onAction={()=>navigate('/Messages')} actionLabel="Inbox" color={ACCENT}/>,
            activityFeed.length===0
              ? <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.28)',textAlign:'center',padding:'24px 0 8px'}}>No recent activity</p>
              : <div>{activityFeed.map((item,i)=><ActivityRow key={item.id||i} Icon={item.Icon} iconColor={item.color} title={item.title} sub={item.sub} time={item.time}/>)}</div>
          )}

          {/* Saved Matches */}
          {savedMatches.length>0 && card(<SectionHeader title="Saved Matches" onAction={()=>navigate('/Matches')} actionLabel="View All" color={AMBER}/>,
            <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>{savedMatches.map((m,i)=><SavedMatchRow key={i} listing={m.listing} requirement={m.requirement} onNavigate={()=>navigate('/Matches')}/>)}</div>
          )}

          {/* Templates */}
          {card(<SectionHeader title="My Templates" onAction={()=>navigate('/MyTemplates')} actionLabel="View All" color="rgba(255,255,255,0.4)"/>,
            myTemplates.length===0
              ? <div style={{padding:'4px 0'}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.28)',margin:'0 0 5px'}}>No templates saved yet.</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.18)',margin:0}}>Save a listing or requirement as a template to reuse it fast.</p></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {myTemplates.slice(0,5).map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 11px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'6px',background:'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><FileText style={{width:'13px',height:'13px',color:'rgba(255,255,255,0.4)'}}/></div>
                      <div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:500,color:'rgba(255,255,255,0.72)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name||t.title||'Untitled Template'}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.28)',margin:'1px 0 0'}}>{PT[t.property_type]||t.property_type||'Template'} · {t.folder||'General'}</p></div>
                    </div>
                  ))}
                  {myTemplates.length>5&&<button onClick={()=>navigate('/MyTemplates')} style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.35)',background:'none',border:'none',cursor:'pointer',padding:'4px 0',textAlign:'left'}}>+{myTemplates.length-5} more →</button>}
                </div>
          )}

          {/* Quick Actions */}
          <div style={{background:`linear-gradient(135deg,${ACCENT}0c,${LAVENDER}0c)`,border:`1px solid ${ACCENT}18`,borderRadius:'16px',padding:'20px 22px'}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',margin:'0 0 14px'}}>QUICK ACTIONS</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {[{label:'View My Matches',Icon:TrendingUp,color:ACCENT,path:'/matches'},{label:'Open Inbox',Icon:MessageCircle,color:LAVENDER,path:'/inbox'},{label:'Saved Matches',Icon:BookmarkCheck,color:AMBER,path:'/matches'},{label:'My Posts',Icon:BarChart2,color:ACCENT,path:'/my-posts'}].map(({label,Icon,color,path})=>(
                <button key={path+label} onClick={()=>navigate(path)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 12px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'9px',cursor:'pointer',textAlign:'left',transition:'all 0.15s',width:'100%'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.borderColor=`${color}35`;}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';}}>
                  <div style={{width:'26px',height:'26px',borderRadius:'7px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Icon style={{width:'13px',height:'13px',color}}/></div>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.75)'}}>{label}</span>
                  <ChevronRight style={{width:'13px',height:'13px',color:'rgba(255,255,255,0.2)',marginLeft:'auto'}}/>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {showQuickPost&&<QuickPostModal onClose={()=>setShowQuickPost(false)} navigate={navigate}/>}
    </div>
  );
}