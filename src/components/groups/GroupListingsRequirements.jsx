import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, Sparkles, X, Phone, Mail, User, MapPin, DollarSign, MessageCircle } from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '@/utils/matchScore';
import FloatingMessageCompose from '@/components/messages/FloatingMessageCompose';
import AgentContactModal from '@/components/shared/AgentContactModal';

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';

// ── Price formatter ───────────────────────────────────────────────────────────
function fmtPostPrice(post) {
  const isL = !!post.size_sqft;
  const fmt = (n) => { const num = parseFloat(n); if (!n||isNaN(num)) return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
  const u = isL ? (post.transaction_type==='lease'||post.transaction_type==='sublease'?'/SF/yr':post.transaction_type==='rent'?'/mo':'') : (post.price_period==='per_month'?'/mo':post.price_period==='per_sf_per_year'?'/SF/yr':post.price_period==='annually'?'/yr':'');
  if (isL) return `$${fmt(post.price)||'0'}${u}`;
  const lo=fmt(post.min_price),hi=fmt(post.max_price);
  if(lo&&hi) return `$${lo}–$${hi}${u}`;
  if(hi) return `Up to $${hi}${u}`;
  if(lo) return `From $${lo}${u}`;
  return null;
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginRight: '16px' }}>{label}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'white', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ── Full detail modal ─────────────────────────────────────────────────────────
function PostDetailModal({ post, posterProfile, onClose, onMessage, onViewAgent }) {
  const isListing = post.postType === 'listing';
  const name    = post.contact_agent_name  || posterProfile?.full_name  || 'Agent';
  const email   = post.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const phone   = post.contact_agent_phone || posterProfile?.phone;
  const company = post.company_name        || posterProfile?.brokerage_name;
  const photo   = posterProfile?.profile_photo_url;

  const details = (() => {
    if (!post.property_details) return {};
    if (typeof post.property_details === 'string') { try { return JSON.parse(post.property_details); } catch { return {}; } }
    return post.property_details;
  })();

  const priceStr = fmtPostPrice(post);

  const LEASE_LABELS = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', percentage_lease:'Percentage Lease', nnn:'NNN', nn:'NN', n:'N (Single Net)', absolute_net:'Absolute Net' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '680px', overflow: 'hidden', marginBottom: '20px' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isListing ? ACCENT : '#6366f1', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)' }}>
              {isListing ? 'Listing' : 'Requirement'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
            <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Title + price */}
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 500, color: 'white', margin: '0 0 8px' }}>{post.title}</h2>
          {priceStr && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: '8px', marginBottom: '20px' }}>
              <DollarSign style={{ width: '14px', height: '14px', color: ACCENT }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 700, color: ACCENT }}>{priceStr}</span>
            </div>
          )}

          {/* Core chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {(post.city || post.state) && <span style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}><MapPin style={{width:'11px',height:'11px'}} />{[post.city, post.state].filter(Boolean).join(', ')}</span>}
            {post.cities?.length > 0 && <span style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}><MapPin style={{width:'11px',height:'11px'}} />{post.cities.join(', ')}</span>}
            {post.zip_code && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)' }}>{post.zip_code}</span>}
            {post.property_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)', textTransform:'capitalize' }}>{post.property_type.replace(/_/g,' ')}</span>}
            {post.transaction_type && <span style={{ padding:'4px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.65)', textTransform:'capitalize' }}>{post.transaction_type}</span>}
            {post.status && <span style={{ padding:'4px 10px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, borderRadius:'6px', fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:600, color:ACCENT, textTransform:'uppercase', letterSpacing:'0.04em' }}>{post.status}</span>}
          </div>

          {/* Key numbers */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 12px' }}>Property Details</p>
            {isListing ? (
              <>
                <DetailRow label="Size" value={post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : null} />
                <DetailRow label="Address" value={post.address} />
                <DetailRow label="Lease Type" value={post.lease_type ? (LEASE_LABELS[post.lease_type] || post.lease_type) : null} />
                <DetailRow label="Building Class" value={details.building_class ? `Class ${details.building_class}` : null} />
                <DetailRow label="Parking" value={details.parking_ratio || details.total_parking_spaces ? `${details.parking_ratio || ''} ${details.total_parking_spaces ? `· ${details.total_parking_spaces} spaces` : ''}`.trim() : null} />
                <DetailRow label="Ceiling Height" value={details.ceiling_height} />
                <DetailRow label="Zoning" value={details.zoning} />
                <DetailRow label="Loading Docks" value={details.dock_doors} />
                <DetailRow label="Drive-In Doors" value={details.drive_in_doors} />
                <DetailRow label="Clear Height" value={details.clear_height ? `${details.clear_height} ft` : null} />
                <DetailRow label="Bedrooms" value={details.bedrooms} />
                <DetailRow label="Bathrooms" value={details.bathrooms} />
                <DetailRow label="Year Built" value={details.year_built} />
                <DetailRow label="HOA" value={details.hoa ? `$${parseFloat(details.hoa).toLocaleString()}/mo` : null} />
                <DetailRow label="Lot Size" value={details.lot_sqft ? `${parseFloat(details.lot_sqft).toLocaleString()} SF` : null} />
                <DetailRow label="Acreage" value={details.acres ? `${details.acres} acres` : null} />
                <DetailRow label="Exam Rooms" value={details.exam_rooms} />
                <DetailRow label="Traffic Count" value={details.traffic_count ? `${parseFloat(details.traffic_count).toLocaleString()}/day` : null} />
              </>
            ) : (
              <>
                <DetailRow label="Size Range" value={(post.min_size_sqft || post.max_size_sqft) ? `${post.min_size_sqft ? parseFloat(post.min_size_sqft).toLocaleString() : '0'}–${post.max_size_sqft ? parseFloat(post.max_size_sqft).toLocaleString() : '∞'} SF` : null} />
                <DetailRow label="Timeline" value={post.timeline?.replace(/_/g,' ')} />
                <DetailRow label="Min Offices" value={details.min_offices} />
                <DetailRow label="Min Conf Rooms" value={details.min_conf_rooms} />
                <DetailRow label="Min Bedrooms" value={details.min_bedrooms} />
                <DetailRow label="Min Bathrooms" value={details.min_bathrooms} />
                <DetailRow label="Min Parking" value={details.min_total_parking_spaces} />
                <DetailRow label="Building Class" value={details.building_classes?.length ? `Class ${details.building_classes.join(', ')}` : null} />
                <DetailRow label="Min Exam Rooms" value={details.min_exam_rooms} />
                <DetailRow label="Min Clear Height" value={details.min_clear_height ? `${details.min_clear_height} ft` : null} />
                <DetailRow label="Min Docks" value={details.min_dock_doors} />
                <DetailRow label="Min Acreage" value={details.min_acres ? `${details.min_acres} acres` : null} />
              </>
            )}
          </div>

          {/* Amenities */}
          {((post.amenities?.length > 0) || (details.building_amenities?.length > 0) || (details.building_amenities_required?.length > 0)) && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 10px' }}>Amenities</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {[...(post.amenities||[]), ...(details.building_amenities||[]), ...(details.building_amenities_required||[])].map((a,i) => (
                  <span key={i} style={{ padding:'3px 10px', background:`${ACCENT}10`, border:`1px solid ${ACCENT}25`, borderRadius:'20px', fontFamily:"'Inter', sans-serif", fontSize:'11px', color:ACCENT }}>
                    {a.replace(/_/g,' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description / Notes */}
          {(post.description || post.notes || details.description || details.intended_use) && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.35)', margin:'0 0 8px' }}>
                {isListing ? 'Description' : 'Notes / Intended Use'}
              </p>
              <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.65)', lineHeight:1.7, margin:0 }}>
                {post.description || post.notes || details.description || details.intended_use}
              </p>
            </div>
          )}

          {/* Contact */}
          <div style={{ background:`${ACCENT}05`, border:`1px solid ${ACCENT}20`, borderRadius:'12px', padding:'16px' }}>
            <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(255,255,255,0.3)', margin:'0 0 12px' }}>
              {isListing ? 'Listing Agent' : 'Representing Agent'}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:ACCENT, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'18px', fontWeight:700 }}>
                {photo ? <img src={photo} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : name[0]?.toUpperCase()}
              </div>
              <div>
                <p onClick={() => onViewAgent && onViewAgent(posterProfile, email)}
                  style={{ fontFamily:"'Inter', sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:0, cursor:onViewAgent?'pointer':'default' }}
                  onMouseEnter={e => { if(onViewAgent) e.currentTarget.style.color=ACCENT; }}
                  onMouseLeave={e => { e.currentTarget.style.color='white'; }}>
                  {name}
                </p>
                {company && <p style={{ fontFamily:"'Inter', sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{company}</p>}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {email && <a href={`mailto:${email}`} style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'8px 12px', background:`${ACCENT}08`, borderRadius:'8px', border:`1px solid ${ACCENT}15` }}><Mail style={{width:'14px',height:'14px'}} />{email}</a>}
              {phone && <a href={`tel:${phone}`} style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:"'Inter', sans-serif", fontSize:'13px', color:ACCENT, textDecoration:'none', padding:'8px 12px', background:`${ACCENT}08`, borderRadius:'8px', border:`1px solid ${ACCENT}15` }}><Phone style={{width:'14px',height:'14px'}} />{phone}</a>}
              {onMessage && email && (
                <button onClick={() => onMessage(posterProfile, email)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', padding:'8px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter', sans-serif", fontSize:'13px', fontWeight:600, color:'#111827', cursor:'pointer' }}>
                  <MessageCircle style={{width:'13px',height:'13px'}}/> Send Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Lightweight match modal for Fish Tank context ────────────────────────────
function GroupMatchModal({ myPost, matchPost, matchResult, posterProfile, onClose, onMessage }) {
  const navigate = useNavigate();
  const isListing = myPost.postType === 'listing';
  const myColor   = isListing ? ACCENT : LAVENDER;
  const theirColor = isListing ? LAVENDER : ACCENT;
  const { totalScore } = matchResult;
  const scoreColor = getScoreColor(totalScore);
  const scoreLabel = getScoreLabel(totalScore);
  const sz=80, r=32, circ=2*Math.PI*r, dash=(totalScore/100)*circ;

  const posterName  = matchPost.contact_agent_name || posterProfile?.full_name || matchPost.created_by || 'Agent';
  const posterEmail = matchPost.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone = matchPost.contact_agent_phone || posterProfile?.phone;
  const posterCompany = matchPost.company_name || posterProfile?.brokerage_name;
  const posterPhoto = posterProfile?.profile_photo_url;

  const fmtPrice = (post, isL) => {
    const fmt = (n) => { const num=parseFloat(n); if(!n||isNaN(num))return null; return num%1===0?num.toLocaleString():num.toLocaleString('en-US',{maximumFractionDigits:2}); };
    const tx=post.transaction_type, pp=post.price_period;
    const u=isL?(tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':''):(pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
    if(isL){const f=fmt(post.price);return f?`$${f}${u}`:null;}
    const lo=fmt(post.min_price),hi=fmt(post.max_price);
    if(lo&&hi)return`$${lo}–$${hi}${u}`;if(hi)return`Up to $${hi}${u}`;if(lo)return`From $${lo}${u}`;return null;
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'20px', overflowY:'auto' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'580px', overflow:'hidden', marginBottom:'20px' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.4)' }}>Match Analysis</span>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>
        <div style={{ padding:'24px' }}>
          {/* Score */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'24px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
              <div style={{ position:'relative', width:sz, height:sz }}>
                <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={scoreColor} strokeWidth="7" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/></svg>
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'24px', fontWeight:700, color:scoreColor, lineHeight:1 }}>{totalScore}</span>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'9px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', marginTop:'2px' }}>MATCH</span>
                </div>
              </div>
              {scoreLabel && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', color:scoreColor, background:`${scoreColor}15`, border:`1px solid ${scoreColor}35`, borderRadius:'5px', padding:'2px 10px' }}>{scoreLabel}</span>}
            </div>
          </div>
          {/* Posts side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
            {[{post:myPost,isL:isListing,color:myColor,label:`Your ${isListing?'Listing':'Requirement'}`},{post:matchPost,isL:!isListing,color:theirColor,label:`Their ${isListing?'Requirement':'Listing'}`}].map(({post,isL,color,label},i) => (
              <div key={i} style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:'10px', padding:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'6px' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:color }}/>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color }}>{label}</span>
                </div>
                <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:'0 0 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</p>
                {fmtPrice(post,isL) && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color, margin:0 }}>{fmtPrice(post,isL)}</p>}
              </div>
            ))}
          </div>
          {/* Contact */}
          <div style={{ background:`${theirColor}06`, border:`1px solid ${theirColor}20`, borderRadius:'12px', padding:'16px' }}>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 12px' }}>Agent</p>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:theirColor, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'15px', fontWeight:700 }}>
                {posterPhoto?<img src={posterPhoto} alt={posterName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:posterName[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'white', margin:0 }}>{posterName}</p>
                {posterCompany && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{posterCompany}</p>}
              </div>
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {posterEmail && <a href={`mailto:${posterEmail}`} style={{ display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:theirColor,textDecoration:'none',padding:'7px 10px',background:`${theirColor}08`,borderRadius:'7px',border:`1px solid ${theirColor}15` }}><Mail style={{width:'12px',height:'12px'}}/>{posterEmail}</a>}
              {posterPhone && <a href={`tel:${posterPhone}`} style={{ display:'flex',alignItems:'center',gap:'6px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:theirColor,textDecoration:'none',padding:'7px 10px',background:`${theirColor}08`,borderRadius:'7px',border:`1px solid ${theirColor}15` }}><Phone style={{width:'12px',height:'12px'}}/>{posterPhone}</a>}
              <button onClick={() => onMessage(posterProfile, posterEmail)} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'7px 14px',background:theirColor,border:'none',borderRadius:'7px',fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:600,color:'#111827',cursor:'pointer' }}>
                <MessageCircle style={{width:'12px',height:'12px'}}/> Send Message
              </button>
            </div>
          </div>
          {/* Navigate to full match in My Matches */}
          <button
            onClick={() => { onClose(); navigate('/Matches', { state: { openPostId: myPost.id } }); }}
            style={{ width:'100%', marginTop:'14px', padding:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='white'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}>
            View Full Match Details in My Matches →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupListingsRequirements({ groupId, memberEmails, currentUser }) {
  const [tab, setTab] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [compose, setCompose]           = useState(null); // { recipientProfile, recipientEmail, myPost, matchPost, matchResult }
  const [viewingAgent, setViewingAgent] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubListing = base44.entities.Listing.subscribe(() => queryClient.invalidateQueries({ queryKey: ['group-listings'] }));
    const unsubReq = base44.entities.Requirement.subscribe(() => queryClient.invalidateQueries({ queryKey: ['group-requirements'] }));
    return () => { unsubListing(); unsubReq(); };
  }, [queryClient]);

  const { data: listings = [] } = useQuery({
    queryKey: ['group-listings', groupId, memberEmails],
    queryFn: () => base44.entities.Listing.list('-created_date'),
    enabled: memberEmails.length > 0,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['group-requirements', groupId, memberEmails],
    queryFn: () => base44.entities.Requirement.list('-created_date'),
    enabled: memberEmails.length > 0,
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profileMap = Object.fromEntries(userProfiles.map(p => [p.user_email, p]));

  const isVisibleInGroup = (post) => {
    const visibility = post.visibility || 'public';
    if (visibility === 'brokerage' || visibility === 'private') return false;
    if (visibility === 'public') return true;
    if (visibility === 'team') {
      const groups = (post.visibility_groups || '').split(',').map(s => s.trim());
      return groups.includes(groupId);
    }
    return false;
  };

  const memberEmailSet = new Set(memberEmails);
  const groupListings = listings.filter(l => memberEmailSet.has(l.created_by)).filter(isVisibleInGroup).map(l => ({ ...l, postType: 'listing' }));
  const groupRequirements = requirements.filter(r => memberEmailSet.has(r.created_by)).filter(isVisibleInGroup).map(r => ({ ...r, postType: 'requirement' }));
  const allPosts = [...groupListings, ...groupRequirements].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const myListings = groupListings.filter(l => l.created_by === currentUser?.email);
  const myRequirements = groupRequirements.filter(r => r.created_by === currentUser?.email);
  const myPosts = [...myListings, ...myRequirements].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // Build a map: postId -> best match result against the current user's posts
  const matchScoreMap = useMemo(() => {
    if (!currentUser) return {};
    const map = {};
    // Check other people's listings against my requirements
    groupListings.filter(l => l.created_by !== currentUser.email).forEach(listing => {
      let best = null;
      myRequirements.forEach(req => {
        const r = calculateMatchScore(listing, req);
        if (r.isMatch && (!best || r.totalScore > best.totalScore)) best = { ...r, myPost: req, matchPost: listing };
      });
      if (best) map[listing.id] = best;
    });
    // Check other people's requirements against my listings
    groupRequirements.filter(r => r.created_by !== currentUser.email).forEach(req => {
      let best = null;
      myListings.forEach(listing => {
        const r = calculateMatchScore(listing, req);
        if (r.isMatch && (!best || r.totalScore > best.totalScore)) best = { ...r, myPost: listing, matchPost: req };
      });
      if (best) map[req.id] = best;
    });
    return map;
  }, [myListings, myRequirements, groupListings, groupRequirements, currentUser]);

  const matchedPosts = useMemo(() =>
    allPosts.filter(p => p.created_by !== currentUser?.email && matchScoreMap[p.id]),
    [allPosts, matchScoreMap, currentUser]);

  const displayPosts = tab === 'all' ? allPosts : tab === 'my' ? myPosts : matchedPosts;

  const tabs = [
    { key: 'all', label: 'All', icon: Building2, count: allPosts.length },
    { key: 'matches', label: 'Matches', icon: Sparkles, count: matchedPosts.length },
    { key: 'my', label: 'My Posts', icon: Search, count: myPosts.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s', background: tab === t.key ? ACCENT : 'rgba(255,255,255,0.06)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.6)' }}>
            <t.icon style={{ width: '14px', height: '14px' }} />
            {t.label}
            <span style={{ marginLeft: '2px', padding: '1px 6px', borderRadius: '99px', fontSize: '11px', background: tab === t.key ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)', color: tab === t.key ? '#111827' : 'rgba(255,255,255,0.5)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {displayPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          {tab === 'matches' ? (
            <>
              <Sparkles style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>No matches found yet.</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Post your own listings or requirements to see what aligns.</p>
            </>
          ) : (
            <>
              <Building2 style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {tab === 'my' ? "You haven't posted any listings or requirements yet." : "No listings or requirements from group members yet."}
              </p>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayPosts.map(post => {
            const isListing = post.postType === 'listing';
            const posterProfile = profileMap[post.created_by];
            const posterName = post.contact_agent_name || posterProfile?.full_name || post.created_by || 'Agent';
            const posterPhoto = posterProfile?.profile_photo_url;
            const posterInitial = posterName[0]?.toUpperCase() || '?';

            const matchInfo = matchScoreMap[post.id];
            const scoreColor = matchInfo ? getScoreColor(matchInfo.totalScore) : null;
            const scoreLabel = matchInfo ? getScoreLabel(matchInfo.totalScore) : null;
            const isMatch = !!matchInfo;

            return (
              <div
                key={`${post.postType}-${post.id}`}
                onClick={() => setSelectedPost(post)}
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isMatch ? `${scoreColor}35` : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = `${ACCENT}50`; e.currentTarget.style.boxShadow = `0 0 16px ${ACCENT}12`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = isMatch ? `${scoreColor}35` : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isListing ? `${ACCENT}15` : 'rgba(255,255,255,0.06)', border: isListing ? `1px solid ${ACCENT}30` : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isListing
                      ? <Building2 style={{ width: '18px', height: '18px', color: ACCENT }} />
                      : <Search style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.6)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: isListing ? ACCENT : LAVENDER }}>
                        {isListing ? 'Listing' : 'Requirement'}
                      </span>
                      {isMatch && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {/* Small circle */}
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: scoreColor, flexShrink: 0 }}/>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: scoreColor }}>{matchInfo.totalScore}%</span>
                          {scoreLabel && (
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, color: scoreColor, background: `${scoreColor}15`, border: `1px solid ${scoreColor}30`, borderRadius: '4px', padding: '1px 6px' }}>
                              {scoreLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {post.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: ACCENT }}>
                        {fmtPostPrice(post)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {post.created_by !== currentUser?.email && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setCompose({
                                recipientProfile: posterProfile,
                                recipientEmail: post.contact_agent_email || posterProfile?.contact_email || post.created_by,
                                myPost: matchInfo?.myPost,
                                matchPost: matchInfo?.matchPost,
                                matchResult: matchInfo,
                              });
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}25`, borderRadius: '6px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: ACCENT }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}22`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}12`; }}
                          >
                            <MessageCircle style={{ width: '11px', height: '11px' }}/> Message
                          </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: ACCENT, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '10px', fontWeight: 700 }}>
                            {posterPhoto ? <img src={posterPhoto} alt={posterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : posterInitial}
                          </div>
                          <span
                            onClick={e => { e.stopPropagation(); setViewingAgent({ profile: posterProfile, email: post.created_by }); }}
                            style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.color = ACCENT}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                          >
                            {posterName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPost && (() => {
        const matchInfo = matchScoreMap[selectedPost.id];
        if (matchInfo && selectedPost.created_by !== currentUser?.email) {
          // Dynamic import-style approach — use the MatchModal from Matches page logic
          // We'll pass to a wrapper that shows the same match analysis
          return (
            <GroupMatchModal
              myPost={{ ...matchInfo.myPost, postType: matchInfo.myPost.size_sqft ? 'listing' : 'requirement' }}
              matchPost={{ ...matchInfo.matchPost, postType: matchInfo.matchPost.size_sqft ? 'listing' : 'requirement' }}
              matchResult={matchInfo}
              posterProfile={profileMap[selectedPost.created_by]}
              onClose={() => setSelectedPost(null)}
              onMessage={(recipientProfile, recipientEmail) => {
                setSelectedPost(null);
                setCompose({ recipientProfile, recipientEmail, myPost: matchInfo.myPost, matchPost: matchInfo.matchPost, matchResult: matchInfo });
              }}
            />
          );
        }
        return (
          <PostDetailModal
            post={selectedPost}
            posterProfile={profileMap[selectedPost.created_by]}
            onClose={() => setSelectedPost(null)}
            onMessage={(recipientProfile, recipientEmail) => {
              setSelectedPost(null);
              setCompose({ recipientProfile, recipientEmail, myPost: null, matchPost: null, matchResult: null });
            }}
            onViewAgent={(profile, email) => setViewingAgent({ profile, email })}
          />
        );
      })()}

      {compose && (
        <FloatingMessageCompose
          recipientProfile={compose.recipientProfile}
          recipientEmail={compose.recipientEmail}
          myPost={compose.myPost}
          matchPost={compose.matchPost}
          matchResult={compose.matchResult}
          onClose={() => setCompose(null)}
        />
      )}

      {viewingAgent && (
        <AgentContactModal profile={viewingAgent.profile} email={viewingAgent.email} onClose={() => setViewingAgent(null)}/>
      )}
    </div>
  );
}