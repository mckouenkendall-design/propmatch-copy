import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, TrendingUp, MessageCircle, Bell, BookmarkCheck, ChevronRight, FileText, ArrowUpRight } from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '@/utils/matchScore';

const ACCENT='#00DBC5', LAVENDER='#818cf8', AMBER='#F59E0B';
const PT={office:'General Office',medical_office:'Medical Office',retail:'Retail',industrial_flex:'Industrial / Flex',land:'Land',special_use:'Special Use',single_family:'Single Family',condo:'Condo',apartment:'Apartment',multi_family:'Multi-Family',multi_family_5:'Multi-Family (5+)',townhouse:'Townhouse',manufactured:'Manufactured',land_residential:'Residential Land'};

function timeAgo(d){if(!d)return'';const m=Math.floor((Date.now()-new Date(d))/60000);if(m<1)return'just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;const days=Math.floor(h/24);if(days<7)return`${days}d ago`;return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});}
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening';}
function getSavedKeys(e){try{return JSON.parse(localStorage.getItem(`propmatch_saved_${e}`)||'[]');}catch{return[];}}
function fmtPrice(p,isL){const n=v=>{const x=parseFloat(v);return(!v||isNaN(x))?null:x%1===0?x.toLocaleString():x.toLocaleString('en-US',{maximumFractionDigits:2});};if(isL){const f=n(p.price);if(!f)return null;const u=p.transaction_type==='lease'||p.transaction_type==='sublease'?'/SF/yr':p.transaction_type==='rent'?'/mo':'';return`$${f}${u}`;}const u=p.price_period==='per_month'?'/mo':p.price_period==='per_sf_per_year'?'/SF/yr':p.price_period==='annually'?'/yr':(p.transaction_type==='lease'||p.transaction_type==='rent')?'/mo':'';const lo=n(p.min_price),hi=n(p.max_price);if(lo&&hi)return`$${lo}\u2013$${hi}${u}`;if(hi)return`Up to $${hi}${u}`;if(lo)return`From $${lo}${u}`;return null;}

function MiniScore({score,size=44}){const color=getScoreColor(score),r=size*.38,circ=2*Math.PI*r,dash=(score/100)*circ;return(<div style={{position:'relative',width:size,height:size,flexShrink:0}}><svg width={size} height={size} style={{transform:'rotate(-90deg)'}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*.088}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*.088} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 ${size*.07}px ${color}90)`}}/></svg><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:size*.27+'px',fontWeight:700,color,lineHeight:1}}>{score}</span></div></div>);}

function SectionHeader({title,onAction,actionLabel,color=ACCENT}){return(<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',background:color,boxShadow:`0 0 8px ${color}`}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.5)'}}>{title}</span></div>{onAction&&<button onClick={onAction} style={{display:'flex',alignItems:'center',gap:'3px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color,background:'transparent',border:'none',cursor:'pointer'}}>{actionLabel}<ChevronRight style={{width:'12px',height:'12px'}}/></button>}</div>);}

function MatchCard({myPost,match,onNavigate}){const[hov,setHov]=useState(false);const isL=myPost.postType==='listing';const mc=isL?ACCENT:LAVENDER;const mp=(isL?match.requirement:match.listing)||{};const label=getScoreLabel(match.totalScore);const sc=getScoreColor(match.totalScore);return(<div onClick={onNavigate} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 13px',background:hov?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)',border:`1px solid ${hov?mc+'30':'rgba(255,255,255,0.07)'}`,borderRadius:'11px',cursor:'pointer',transition:'all 0.15s'}}><MiniScore score={match.totalScore} size={44}/><div style={{flex:1,minWidth:0}}><div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:mc,textTransform:'uppercase',letterSpacing:'0.05em'}}>Your {isL?'Listing':'Req'}</span>{label&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:sc,background:`${sc}15`,border:`1px solid ${sc}28`,borderRadius:'20px',padding:'1px 7px'}}>{label}</span>}</div><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{myPost.title}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.38)',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>\u21d4 {mp.title}</p></div><ArrowUpRight style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.18)',flexShrink:0}}/></div>);}

function PostCard({post,maxCount,onNavigate}){const[hov,setHov]=useState(false);const isL=post.postType==='listing';const color=isL?ACCENT:LAVENDER;const{total=0,strong=0,good=0,fair=0}=post;const barPct=maxCount>0?(total/maxCount)*100:0;const price=fmtPrice(post,isL);const Dot=({c,dc})=>c===0?null:(<div style={{display:'flex',alignItems:'center',gap:'3px'}}><div style={{width:'7px',height:'7px',borderRadius:'50%',background:dc,boxShadow:dc!=='rgba(255,255,255,0.25)'?`0 0 5px ${dc}80`:'none'}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:600,color:dc}}>{c}</span></div>);return(<div onClick={onNavigate} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{padding:'13px 15px',background:hov?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${hov?color+'22':'rgba(255,255,255,0.06)'}`,borderRadius:'11px',cursor:'pointer',transition:'all 0.15s'}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'8px'}}><div style={{flex:1,minWidth:0,marginRight:'12px'}}><div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'3px'}}><div style={{width:'5px',height:'5px',borderRadius:'50%',background:color}}/><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color}}>{isL?'Listing':'Requirement'}</span></div><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.85)',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{post.title}</p><p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.32)',margin:'2px 0 0'}}>{PT[post.property_type]||post.property_type}{post.city?` \u00b7 ${post.city}`:''}{price?` \u00b7 ${price}`:''}</p></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'22px',fontWeight:700,color:total===0?'rgba(255,255,255,0.2)':total>=3?color:AMBER,lineHeight:1}}>{total}</div><div style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.3)',marginTop:'2px'}}>{total===1?'match':'matches'}</div></div></div>{total>0&&<div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}><Dot c={strong} dc={ACCENT}/><Dot c={good} dc={AMBER}/><Dot c={fair} dc="rgba(255,255,255,0.25)"/></div>}<div style={{height:'3px',background:'rgba(255,255,255,0.05)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',width:`${barPct}%`,background:`linear-gradient(90deg,${color}90,${color})`,borderRadius:'2px',transition:'width 0.8s',boxShadow:barPct>0?`0 0 6px ${color}60`:'none'}}/></div></div>);}

function ActivityRow({Icon,iconColor,title,sub,time}){return(<div style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><div style={{width:'28px',height:'28px',borderRadius:'8px',background:`${iconColor}15`,border:`1px solid ${iconColor}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px'}}><Icon style={{width:'13px',height:'13px',color:iconColor}}/></div><div style={{flex:1,minWidth:0}}><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.8)',margin:0,lineHeight:1.4}}>{title}</p>{sub&&<p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.32)',margin:'2px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</p>}</div><span style={{fontFamily:"'Inter',sans-serif",fontSize:'10px',color:'rgba(255,255,255,0.22)',flexShrink:0,marginTop:'2px'}}>{time}</span></div>);}

export default function Dashboard() {
  const {user}=useAuth();
  const navigate=useNavigate();

  // NOTE: Your supabaseClient.js has a proxy wrapper that auto-unwraps Supabase responses,
  // so queries return the data array directly. Do NOT destructure { data, error } here.
  const asArray = (r) => Array.isArray(r) ? r : [];
  const firstOrNull = (r) => Array.isArray(r) && r.length > 0 ? r[0] : null;

  const {data:myListings=[]}      =useQuery({queryKey:['cc-my-listings'],     queryFn:async()=> asArray(await supabase.from('listings').select('*').eq('created_by', user?.email)), enabled: !!user?.email});
  const {data:myRequirements=[]}  =useQuery({queryKey:['cc-my-reqs'],         queryFn:async()=> asArray(await supabase.from('requirements').select('*').eq('created_by', user?.email)), enabled: !!user?.email});
  const {data:allListings=[]}     =useQuery({queryKey:['cc-all-listings'],    queryFn:async()=> asArray(await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(80))});
  const {data:allRequirements=[]} =useQuery({queryKey:['cc-all-reqs'],        queryFn:async()=> asArray(await supabase.from('requirements').select('*').order('created_at', { ascending: false }).limit(80))});
  const {data:myProfile}          =useQuery({queryKey:['cc-profile'],         queryFn:async()=> firstOrNull(await supabase.from('profiles').select('*').eq('user_email', user?.email)), enabled: !!user?.email});
  const {data:notifications=[]}   =useQuery({queryKey:['cc-notifications'],   queryFn:async()=> asArray(await supabase.from('notifications').select('*').eq('recipient_email', user?.email)), enabled: !!user?.email});

  const firstName=myProfile?.full_name?.split(' ')[0]||user?.email?.split('@')[0]||'there';

  const {topMatches,postMatchCounts,thisWeekCount,strongCount}=useMemo(()=>{
    const otherL=allListings.filter(l=>l.created_by!==user?.email);
    const otherR=allRequirements.filter(r=>r.created_by!==user?.email);
    const all=[],counts={},weekAgo=Date.now()-7*24*60*60*1000;
    let weekCount=0,strongC=0;
    const add=(id,score)=>{if(!counts[id])counts[id]={total:0,strong:0,good:0,fair:0};counts[id].total++;if(score>=70)counts[id].strong++;else if(score>=50)counts[id].good++;else counts[id].fair++;};
    myListings.forEach(listing=>otherR.forEach(req=>{const r=calculateMatchScore(listing,req);if(r.isMatch){all.push({myPost:{...listing,postType:'listing'},listing,requirement:req,...r});add(listing.id,r.totalScore);if(new Date(req.created_date).getTime()>weekAgo)weekCount++;if(r.totalScore>=70)strongC++;}}));
    myRequirements.forEach(req=>otherL.forEach(listing=>{const r=calculateMatchScore(listing,req);if(r.isMatch){all.push({myPost:{...req,postType:'requirement'},listing,requirement:req,...r});add(req.id,r.totalScore);if(r.totalScore>=70)strongC++;}}));
    all.sort((a,b)=>b.totalScore-a.totalScore);
    return{topMatches:all.slice(0,6),postMatchCounts:counts,thisWeekCount:weekCount,strongCount:strongC};
  },[myListings,myRequirements,allListings,allRequirements,user?.email]);

  const postsForAnalytics=useMemo(()=>[
    ...myListings.map(l=>({...l,postType:'listing',...(postMatchCounts[l.id]||{total:0,strong:0,good:0,fair:0})})),
    ...myRequirements.map(r=>({...r,postType:'requirement',...(postMatchCounts[r.id]||{total:0,strong:0,good:0,fair:0})})),
  ].sort((a,b)=>b.total-a.total).slice(0,3),[myListings,myRequirements,postMatchCounts]);
  const maxMatchCount=Math.max(...postsForAnalytics.map(p=>p.total),1);

  const activityFeed=useMemo(()=>{
    const items=[...notifications].sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).slice(0,6).map(n=>({id:n.id,Icon:Bell,color:ACCENT,title:n.message||n.title||'New notification',sub:null,time:timeAgo(n.created_date),ts:new Date(n.created_date).getTime()}));
    if(items.length<5)topMatches.slice(0,5-items.length).forEach((m,i)=>{const sc=getScoreColor(m.totalScore);items.push({id:`m-${i}`,Icon:TrendingUp,color:sc,title:`${m.totalScore}% match \u2014 ${m.myPost.title}`,sub:m.requirement?.title||m.listing?.title||'',time:timeAgo(m.myPost.created_date),ts:new Date(m.myPost.created_date).getTime()||0});});
    return items.sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,7);
  },[notifications,topMatches]);

  const unreadNotifs=notifications.filter(n=>!n.read).length;
  const activePostCount=myListings.length+myRequirements.length;
  const card=(title,children)=><div style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'16px',padding:'22px'}}>{title}{children}</div>;

  // Smart subtitle — highlight the most urgent number
  const subtitle = strongCount>0
    ? `You have ${strongCount} strong match${strongCount>1?'es':''} waiting.`
    : thisWeekCount>0
    ? `${thisWeekCount} new match${thisWeekCount>1?'es':''} this week.`
    : 'No new matches yet — keep your posts active.';

  return (
    <div style={{maxWidth:'1160px',margin:'0 auto',padding:'44px 32px 60px'}}>

      {/* Header */}
      <div style={{marginBottom:'30px'}}>
        <h1 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'30px',fontWeight:300,color:'white',margin:'0 0 5px',lineHeight:1.2}}>{greeting()}, <span style={{fontWeight:700,color:ACCENT}}>{firstName}</span></h1>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.45)',margin:0}}>{subtitle}</p>
      </div>

      {/* Signal Stats Row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'28px'}}>
        {[
          {value:strongCount,    label:'Strong Matches',  sub:'Score 70%+',        color:ACCENT,   Icon:TrendingUp,    onClick:()=>navigate('/Matches',{state:{showSaved:false}})},
          {value:thisWeekCount,  label:'New This Week',   sub:'Last 7 days',       color:AMBER,    Icon:TrendingUp,    onClick:()=>navigate('/Matches')},
          {value:activePostCount,label:'Active Posts',    sub:'Listings & reqs',   color:LAVENDER, Icon:FileText,      onClick:()=>navigate('/Inventory')},
          {value:unreadNotifs||0,label:'Unread',          sub:'Notifications',     color:'rgba(255,255,255,0.4)', Icon:Bell, onClick:()=>navigate('/Messages')},
        ].map(({value,label,sub,color,Icon,onClick})=>(
          <div key={label} onClick={onClick} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${color}20`,borderRadius:'14px',padding:'18px 20px',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=`${color}08`;e.currentTarget.style.borderColor=`${color}40`;}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor=`${color}20`;}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
              <div style={{width:'34px',height:'34px',borderRadius:'9px',background:`${color}15`,border:`1px solid ${color}25`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon style={{width:'16px',height:'16px',color}}/>
              </div>
            </div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'28px',fontWeight:700,color,lineHeight:1,marginBottom:'4px'}}>{value}</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:600,color:'rgba(255,255,255,0.6)',marginBottom:'2px'}}>{label}</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.28)'}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* 2-col grid */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'18px',alignItems:'start'}}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>

          {/* Top Matches */}
          {card(<SectionHeader title="Top Matches" onAction={()=>navigate('/Matches')} actionLabel="View All" color={ACCENT}/>,
            topMatches.length===0
              ? <div style={{textAlign:'center',padding:'32px 16px'}}><TrendingUp style={{width:'32px',height:'32px',color:'rgba(255,255,255,0.1)',margin:'0 auto 10px',display:'block'}}/><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:'0 0 12px'}}>No matches yet</p><button onClick={()=>navigate('/Inventory')} style={{padding:'7px 16px',background:`${ACCENT}15`,border:`1px solid ${ACCENT}35`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:ACCENT,cursor:'pointer'}}>Go to My Posts</button></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>{topMatches.map((m,i)=><MatchCard key={i} myPost={m.myPost} match={m} onNavigate={()=>navigate('/Matches',{state:{openPostId:m.myPost.id}})}/>)}</div>
          )}

          {/* My Active Posts — capped at 3 */}
          {card(<SectionHeader title="My Active Posts" onAction={()=>navigate('/Inventory')} actionLabel="Manage" color={LAVENDER}/>,
            postsForAnalytics.length===0
              ? <div style={{textAlign:'center',padding:'32px 16px'}}><FileText style={{width:'32px',height:'32px',color:'rgba(255,255,255,0.1)',margin:'0 auto 10px',display:'block'}}/><p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.3)',margin:'0 0 12px'}}>No posts yet</p><button onClick={()=>navigate('/Inventory')} style={{padding:'7px 16px',background:`${ACCENT}15`,border:`1px solid ${ACCENT}35`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:ACCENT,cursor:'pointer'}}>Create your first post</button></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>{postsForAnalytics.map((p,i)=><PostCard key={p.id||i} post={p} maxCount={maxMatchCount} onNavigate={()=>navigate('/Inventory',{state:{openPostId:p.id}})}/>)}</div>
          )}

        </div>

        {/* RIGHT */}
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>

          {/* Recent Activity */}
          {card(<SectionHeader title="Recent Activity" onAction={()=>navigate('/Messages')} actionLabel="Inbox" color={ACCENT}/>,
            activityFeed.length===0
              ? <p style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',color:'rgba(255,255,255,0.28)',textAlign:'center',padding:'24px 0 8px'}}>No recent activity</p>
              : <div>{activityFeed.map((item,i)=><ActivityRow key={item.id||i} Icon={item.Icon} iconColor={item.color} title={item.title} sub={item.sub} time={item.time}/>)}</div>
          )}

          {/* Quick Actions */}
          <div style={{background:`linear-gradient(135deg,${ACCENT}0c,${LAVENDER}0c)`,border:`1px solid ${ACCENT}18`,borderRadius:'16px',padding:'20px 22px'}}>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(255,255,255,0.35)',margin:'0 0 14px'}}>QUICK ACCESS</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {[
                {label:'Saved Matches', Icon:BookmarkCheck, color:AMBER,   path:'/Matches',     state:{showSaved:true}},
                {label:'My Templates',  Icon:FileText,      color:LAVENDER, path:'/MyTemplates', state:undefined},
              ].map(({label,Icon,color,path,state})=>(
                <button key={label} onClick={()=>navigate(path,state?{state}:{})}
                  style={{display:'flex',alignItems:'center',gap:'10px',padding:'11px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',cursor:'pointer',textAlign:'left',transition:'all 0.15s',width:'100%'}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${color}10`;e.currentTarget.style.borderColor=`${color}35`;}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'8px',background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Icon style={{width:'14px',height:'14px',color}}/>
                  </div>
                  <span style={{fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:'rgba(255,255,255,0.75)'}}>{label}</span>
                  <ChevronRight style={{width:'13px',height:'13px',color:'rgba(255,255,255,0.2)',marginLeft:'auto'}}/>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}