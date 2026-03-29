import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, X, Mail, Phone, MessageCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, FileText, Loader2, Image, ZoomIn
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';
import FloatingMessageCompose from '@/components/messages/FloatingMessageCompose';
import AgentContactModal from '@/components/shared/AgentContactModal';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN = (n) => {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
const fmtMoney = (v) =>
  v >= 1000000 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${Math.round(v).toLocaleString()}`;

const PT = { office:'General Office', medical_office:'Medical Office', retail:'Retail', industrial_flex:'Industrial / Flex', land:'Land', special_use:'Special Use', single_family:'Single Family', condo:'Condo', apartment:'Apartment', multi_family:'Multi-Family (2–4)', multi_family_5:'Multi-Family (5+)', townhouse:'Townhouse', manufactured:'Manufactured / Mobile', land_residential:'Residential Land' };
const TX = { lease:'Lease', sublease:'Sublease', sale:'Sale', rent:'Rent', purchase:'Purchase' };
const LL = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', percentage_lease:'Percentage Lease', nnn:'NNN (Triple Net)', nn:'NN (Double Net)', n:'N (Single Net)', absolute_net:'Absolute Net' };

function priceStr(post, isListing) {
  const tx = post.transaction_type, pp = post.price_period;
  const u = isListing
    ? (tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':'')
    : (pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
  if (isListing) { const f = fmtN(post.price); return f ? `$${f}${u}` : null; }
  const lo = fmtN(post.min_price), hi = fmtN(post.max_price);
  if (lo && hi) return `$${lo}–$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

// ─── Parse AI highlighted text ────────────────────────────────────────────────
function HighlightedText({ text }) {
  if (!text) return null;
  const parts = [];
  const regex = /\{\{([LR]):([^}]+)\}\}/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type:'text', text:text.slice(last, match.index) });
    parts.push({ type:'highlight', side:match[1], text:match[2] });
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push({ type:'text', text:text.slice(last) });
  return (
    <span>
      {parts.map((p,i) =>
        p.type === 'text' ? <span key={i}>{p.text}</span> :
        <span key={i} style={{ color:p.side==='L'?ACCENT:LAVENDER, fontWeight:600 }}>{p.text}</span>
      )}
    </span>
  );
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photos, onClose }) {
  const [idx, setIdx] = useState(0);
  const list = Array.isArray(photos) ? photos : [photos].filter(Boolean);
  if (!list.length) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
        <img src={list[idx]} alt={`Photo ${idx+1}`} style={{ maxWidth:'90vw', maxHeight:'80vh', objectFit:'contain', borderRadius:'8px' }}/>
        {list.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i-1+list.length)%list.length)}
              style={{ position:'absolute', left:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronLeft style={{ width:'18px', height:'18px', color:'white' }}/>
            </button>
            <button onClick={() => setIdx(i => (i+1)%list.length)}
              style={{ position:'absolute', right:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ChevronRight style={{ width:'18px', height:'18px', color:'white' }}/>
            </button>
          </>
        )}
        <div style={{ position:'absolute', bottom:'-36px', left:'50%', transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>
          {list.length > 1 ? `${idx+1} / ${list.length}` : ''}
        </div>
      </div>
      <button onClick={onClose} style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px', cursor:'pointer' }}>
        <X style={{ width:'18px', height:'18px', color:'white' }}/>
      </button>
    </div>
  );
}

// ─── Big Score Circle ─────────────────────────────────────────────────────────
function BigScoreCircle({ score }) {
  const color = getScoreColor(score), label = getScoreLabel(score);
  const sz=96, r=38, circ=2*Math.PI*r, dash=(score/100)*circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <div style={{ position:'relative', width:sz, height:sz }}>
        <svg width={sz} height={sz} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:700, color, lineHeight:1 }}>{score}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', marginTop:'2px' }}>MATCH</span>
        </div>
      </div>
      {label && (
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color, background:`${color}15`, border:`1px solid ${color}35`, borderRadius:'6px', padding:'4px 14px' }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Range Bar ────────────────────────────────────────────────────────────────
function RangeBar({ value, min, max, label, score }) {
  if (value == null || (min == null && max == null)) return null;
  const lo = min != null ? parseFloat(min) : null;
  const hi = max != null ? parseFloat(max) : null;
  const v  = parseFloat(value);

  const refLo  = lo ?? v * 0.6;
  const refHi  = hi ?? v * 1.4;
  const pad    = (refHi - refLo) * 0.3;
  const barMin = Math.max(0, refLo - pad);
  const barMax = refHi + pad;
  const range  = barMax - barMin;
  if (range === 0) return null;

  const vP  = Math.max(3, Math.min(97, ((v - barMin) / range) * 100));
  const loP = lo != null ? Math.max(0, Math.min(100, ((refLo - barMin) / range) * 100)) : null;
  const hiP = hi != null ? Math.max(0, Math.min(100, ((refHi - barMin) / range) * 100)) : null;
  const scoreColor = getScoreColor(score);

  return (
    <div style={{ marginBottom:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.6)', fontWeight:500 }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:ACCENT }}>{fmtMoney(v)}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, color:scoreColor, background:`${scoreColor}12`, border:`1px solid ${scoreColor}30`, borderRadius:'4px', padding:'2px 6px' }}>{score}%</span>
        </div>
      </div>
      <div style={{ position:'relative', height:'44px' }}>
        <div style={{ position:'absolute', top:'18px', left:0, right:0, height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'4px' }}>
          {loP != null && hiP != null && (
            <div style={{ position:'absolute', left:`${loP}%`, width:`${hiP-loP}%`, height:'100%', background:`${LAVENDER}22`, borderRadius:'4px', border:`1px solid ${LAVENDER}45` }}/>
          )}
          <div style={{ position:'absolute', left:`${vP}%`, top:'-6px', transform:'translateX(-50%)', width:'20px', height:'20px', borderRadius:'50%', background:ACCENT, border:'3px solid #0E1318', boxShadow:`0 0 12px ${ACCENT}70`, zIndex:2 }}/>
        </div>
        {lo != null && loP != null && (
          <span style={{ position:'absolute', top:'32px', left:`${loP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:`${LAVENDER}70`, whiteSpace:'nowrap' }}>
            {fmtMoney(refLo)}
          </span>
        )}
        {hi != null && hiP != null && (
          <span style={{ position:'absolute', top:'32px', left:`${hiP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:`${LAVENDER}70`, whiteSpace:'nowrap' }}>
            {fmtMoney(refHi)}
          </span>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginTop:'6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:ACCENT }}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>Your listing value</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <div style={{ width:'14px', height:'6px', borderRadius:'2px', background:`${LAVENDER}25`, border:`1px solid ${LAVENDER}45` }}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>Their required range</span>
        </div>
      </div>
    </div>
  );
}

// ─── Build range bars ─────────────────────────────────────────────────────────
function buildRangeBars(listing, requirement, breakdown) {
  const ld = parseDetails(listing), rd = parseDetails(requirement);

  // Get score from breakdown by category name — no default, use actual score
  const getScore = (keyword) => {
    const found = breakdown?.find(b => b.category?.toLowerCase().includes(keyword.toLowerCase()));
    if (found) return found.score;
    // Calculate inline: if value is within range return 100, else degrade
    return null;
  };

  const bars = [];
  const add = (label, value, min, max, scoreKeyword) => {
    if (!value || (!min && !max)) return;
    const v  = parseFloat(value);
    const lo = min ? parseFloat(min) : null;
    const hi = max ? parseFloat(max) : null;
    // Calculate score: 100 if in range, degrade if outside
    let score = getScore(scoreKeyword);
    if (score === null) {
      if (lo != null && hi != null) {
        if (v >= lo && v <= hi) score = 100;
        else if (v < lo) score = Math.max(0, Math.round(100 - ((lo - v) / lo) * 100));
        else score = Math.max(0, Math.round(100 - ((v - hi) / hi) * 150));
      } else if (lo != null) {
        score = v >= lo ? 100 : Math.max(0, Math.round(100 - ((lo - v) / lo) * 100));
      } else if (hi != null) {
        score = v <= hi ? 100 : Math.max(0, Math.round(100 - ((v - hi) / hi) * 150));
      } else {
        score = 100;
      }
    }
    bars.push({ label, value: v, min: lo, max: hi, score });
  };

  const price  = parseFloat(listing.price);
  const size   = parseFloat(listing.size_sqft);
  const tx     = listing.transaction_type;
  const isLease = tx === 'lease' || tx === 'sublease';

  // ── Price ──────────────────────────────────────────────────────────────────
  if (price) {
    if (isLease && size) {
      const monthly = (price * size) / 12;
      if (requirement.price_period === 'per_sf_per_year') {
        add('Rate ($/SF/yr)', price, requirement.min_price, requirement.max_price, 'price');
      } else {
        add('Monthly Total', monthly, requirement.min_price, requirement.max_price, 'price');
      }
    } else {
      add('Price', price, requirement.min_price, requirement.max_price, 'price');
    }
  }

  // ── Size ───────────────────────────────────────────────────────────────────
  if (size) add('Size (SF)', size, requirement.min_size_sqft, requirement.max_size_sqft, 'size');

  const pt = listing.property_type;

  // ── Office ─────────────────────────────────────────────────────────────────
  if (pt === 'office') {
    if (ld.offices)              add('Private Offices',    ld.offices,    rd.min_offices,              rd.max_offices,              'details');
    if (ld.conf_rooms)           add('Conference Rooms',   ld.conf_rooms, rd.min_conf_rooms,           rd.max_conf_rooms,           'details');
    if (ld.total_parking_spaces) add('Parking Spaces',     ld.total_parking_spaces, rd.min_total_parking_spaces, rd.max_parking,   'details');
  }
  // ── Medical ────────────────────────────────────────────────────────────────
  if (pt === 'medical_office') {
    if (ld.exam_rooms)       add('Exam Rooms',       ld.exam_rooms,       rd.min_exam_rooms,       null, 'details');
    if (ld.procedure_rooms)  add('Procedure Rooms',  ld.procedure_rooms,  rd.min_procedure_rooms,  null, 'details');
    if (ld.waiting_capacity) add('Waiting Capacity', ld.waiting_capacity, rd.min_waiting_capacity, null, 'details');
    if (ld.lab_sf)           add('Lab Space (SF)',   ld.lab_sf,           rd.min_lab_sf,           null, 'details');
  }
  // ── Retail ─────────────────────────────────────────────────────────────────
  if (pt === 'retail') {
    if (ld.traffic_count) add('Traffic Count (/day)', ld.traffic_count, rd.min_traffic_count, null, 'details');
    if (ld.frontage)      add('Street Frontage (ft)',  ld.frontage,      rd.min_frontage,      null, 'details');
    if (ld.ceiling_height) add('Ceiling Height (ft)',  ld.ceiling_height, rd.min_ceiling_height, null, 'details');
    if (ld.total_parking_spaces) add('Parking Spaces', ld.total_parking_spaces, rd.min_total_parking_spaces, null, 'details');
  }
  // ── Industrial ─────────────────────────────────────────────────────────────
  if (pt === 'industrial_flex') {
    if (ld.dock_doors)   add('Loading Docks',      ld.dock_doors,   rd.min_dock_doors,   null, 'details');
    if (ld.drive_in_doors) add('Drive-In Doors',   ld.drive_in_doors, rd.min_drive_in_doors, null, 'details');
    if (ld.clear_height) add('Clear Height (ft)',  ld.clear_height, rd.min_clear_height, null, 'details');
    if (ld.floor_load)   add('Floor Load (lbs/SF)',ld.floor_load,   rd.min_floor_load,   null, 'details');
    if (ld.truck_court_depth) add('Truck Court (ft)', ld.truck_court_depth, rd.min_truck_court_depth, null, 'details');
  }
  // ── Residential ────────────────────────────────────────────────────────────
  if (['single_family','condo','apartment','townhouse','manufactured'].includes(pt)) {
    if (ld.bedrooms)  add('Bedrooms',   ld.bedrooms,  rd.min_bedrooms,  rd.max_bedrooms,  'details');
    if (ld.bathrooms) add('Bathrooms',  ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms, 'details');
    if (ld.hoa && rd.max_hoa) add('HOA ($/mo)', ld.hoa, 0, rd.max_hoa, 'details');
    if (ld.year_built && rd.min_year_built) add('Year Built', ld.year_built, rd.min_year_built, null, 'details');
  }
  // ── Multi-family ───────────────────────────────────────────────────────────
  if (pt === 'multi_family' || pt === 'multi_family_5') {
    if (ld.cap_rate      && rd.min_cap_rate)  add('Cap Rate (%)',  ld.cap_rate,      rd.min_cap_rate,  null, 'details');
    if (ld.occupancy_pct && rd.min_occupancy) add('Occupancy (%)', ld.occupancy_pct, rd.min_occupancy, null, 'details');
    if (ld.noi           && rd.min_noi)       add('NOI ($)',       ld.noi,           rd.min_noi,       null, 'details');
    if (pt === 'multi_family_5' && ld.grm && rd.max_grm) add('GRM', ld.grm, null, rd.max_grm, 'details');
    if (ld.total_units) add('Total Units', ld.total_units, rd.min_units, rd.max_units, 'details');
  }
  // ── Land ───────────────────────────────────────────────────────────────────
  if (pt === 'land' || pt === 'land_residential') {
    if (ld.acres)         add('Acreage',         ld.acres,         rd.min_acres,         rd.max_acres,         'details');
    if (ld.road_frontage) add('Road Frontage (ft)', ld.road_frontage, rd.min_road_frontage, rd.max_road_frontage, 'details');
    if (ld.traffic_count) add('Traffic Count (/day)', ld.traffic_count, rd.min_traffic_count, null, 'details');
  }

  return bars;
}

// ─── Post Block ───────────────────────────────────────────────────────────────
function PostBlock({ post, isListing, label, color, onViewPhotos }) {
  const pd  = parseDetails(post);
  const price = priceStr(post, isListing);
  const lPrice = parseFloat(post.price);
  const lSize  = parseFloat(post.size_sqft);
  const showCalc = isListing && (post.transaction_type==='lease'||post.transaction_type==='sublease') && lPrice && lSize;
  const monthly = showCalc ? Math.round((lPrice * lSize) / 12) : null;
  const annual  = showCalc ? Math.round(lPrice * lSize) : null;
  const brochureUrl = pd?.brochure_url;
  const photoUrl    = pd?.photo_url;

  const chips = [
    isListing ? [post.city, post.state].filter(Boolean).join(', ') : post.cities?.join(', '),
    isListing ? (lSize ? `${lSize.toLocaleString()} SF` : null) : ((post.min_size_sqft||post.max_size_sqft) ? `${fmtN(post.min_size_sqft)||'0'}–${fmtN(post.max_size_sqft)||'∞'} SF` : null),
    TX[post.transaction_type] || post.transaction_type,
    PT[post.property_type] || post.property_type,
  ].filter(Boolean);

  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:'14px', padding:'20px', flex:1 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:color }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color }}>{label}</span>
      </div>

      <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:500, color:'white', margin:'0 0 6px', lineHeight:1.3 }}>{post.title}</h3>

      {price && <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'20px', fontWeight:700, color, marginBottom:'4px' }}>{price}</div>}
      {showCalc && (
        <div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>${monthly?.toLocaleString()}/mo</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>·</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>${annual?.toLocaleString()}/yr total</span>
        </div>
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
        {chips.map((c,i) => (
          <span key={i} style={{ padding:'2px 8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'5px', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.55)', textTransform:'capitalize' }}>{c}</span>
        ))}
      </div>

      {(post.description || post.notes) && (
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.6, margin:'0 0 10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {post.description || post.notes}
        </p>
      )}

      {/* Photo + Brochure buttons */}
      {isListing && (photoUrl || brochureUrl) && (
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'6px' }}>
          {photoUrl && (
            <button onClick={() => onViewPhotos && onViewPhotos(photoUrl)}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'rgba(255,255,255,0.07)', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.75)', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}>
              <Image style={{ width:'13px', height:'13px' }}/> View Photos
            </button>
          )}
          {brochureUrl && (
            <a href={brochureUrl} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'rgba(255,255,255,0.07)', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.75)', cursor:'pointer', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; }}>
              <FileText style={{ width:'13px', height:'13px' }}/> View Brochure
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Full Specs (same accordion logic as before, abbreviated here) ─────────────
const SectionIcons = { core:'MapPin', lease:'FileText', details:'Layers', amenities:'Star', notes:'Search' };

function buildSpecSections(listing, requirement, myIsListing) {
  const ld = parseDetails(listing), rd = parseDetails(requirement);
  const row = (lLabel, lVal, rLabel, rVal) => ({ lLabel, lVal:lVal||null, rLabel:rLabel||null, rVal:rVal||null });
  const lo  = (label, val) => ({ listingOnly:true, label, val:val||null });
  const sections = [];

  const coreRows = [
    row('Property Type', PT[listing.property_type]||listing.property_type, 'Property Type', PT[requirement.property_type]||requirement.property_type),
    row('Transaction', TX[listing.transaction_type]||listing.transaction_type, 'Transaction', TX[requirement.transaction_type]||requirement.transaction_type),
    row('Price', priceStr(listing,true), 'Budget', priceStr(requirement,false)),
    row('Size', listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:null, 'Size Range', (requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}–${fmtN(requirement.max_size_sqft)||'∞'} SF`:null),
    row('Location', [listing.city,listing.state].filter(Boolean).join(', ')||null, 'Preferred Areas', (() => { let c = requirement.cities; if (typeof c==='string') { try { c=JSON.parse(c); } catch { c=[c]; } } return Array.isArray(c)?c.join(', '):c||null; })()),
    row('Status', listing.status||'Active', 'Status', requirement.status||'Active'),
  ].filter(r=>r.lVal||r.rVal);
  const coreLO = [lo('Address', listing.address), lo('Zip Code', listing.zip_code)].filter(r=>r.val);
  if (coreRows.length||coreLO.length) sections.push({ key:'core', title:'Core Details', rows:coreRows, listingOnlyRows:coreLO });

  // Lease
  if (listing.transaction_type==='lease'||listing.transaction_type==='sublease') {
    const leaseLO = [lo('Lease Type', LL[listing.lease_type]||listing.lease_type)].filter(r=>r.val);
    if (leaseLO.length) sections.push({ key:'lease', title:'Lease Terms', rows:[], listingOnlyRows:leaseLO });
  }

  // Details by property type
  const detailRows=[], detailLO=[];
  const pt = listing.property_type;
  if (pt==='office') {
    detailRows.push(row('Private Offices', ld.offices?String(ld.offices):null, 'Min. Private Offices', rd.min_offices?`Min ${rd.min_offices}`:null));
    detailRows.push(row('Conference Rooms', ld.conf_rooms?String(ld.conf_rooms):null, 'Min. Conference Rooms', rd.min_conf_rooms?`Min ${rd.min_conf_rooms}`:null));
    detailRows.push(row('In-Suite Restrooms', ld.in_suite_restrooms?`${ld.in_suite_restrooms} pair(s)`:'Shared', 'Restrooms Required', rd.insuit_restrooms?`Required (min ${rd.min_restrooms||1})`:null));
    detailRows.push(row('Layout', ld.layout?.replace(/_/g,' ')||null, 'Layout Preference', rd.layout&&rd.layout!=='any'?rd.layout.replace(/_/g,' '):null));
    detailRows.push(row('Ceiling Height', ld.ceiling_height||null, 'Min. Ceiling Height', rd.min_ceiling_height?`Min ${rd.min_ceiling_height} ft`:null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailRows.push(row('Total Parking', ld.total_parking_spaces?String(ld.total_parking_spaces):null, 'Min. Parking', rd.min_total_parking_spaces?`Min ${rd.min_total_parking_spaces}`:null));
    detailRows.push(row('Floor Preference', null, 'Floor Preference', rd.floor_pref&&rd.floor_pref!=='any'?rd.floor_pref.replace(/_/g,' '):null));
    detailLO.push(lo('Suite Number', ld.suite_number)); detailLO.push(lo('IT Infrastructure', ld.it_infrastructure)); detailLO.push(lo('Zoning', ld.zoning)); detailLO.push(lo('Parking Ratio', ld.parking_ratio));
  }
  if (pt==='medical_office') {
    detailRows.push(row('Exam Rooms', ld.exam_rooms?String(ld.exam_rooms):null, 'Min. Exam Rooms', rd.min_exam_rooms?`Min ${rd.min_exam_rooms}`:null));
    detailRows.push(row('Procedure Rooms', ld.procedure_rooms?String(ld.procedure_rooms):null, 'Min. Procedure Rooms', rd.min_procedure_rooms?`Min ${rd.min_procedure_rooms}`:null));
    detailRows.push(row('Lab Space', ld.lab_sf?`${ld.lab_sf} SF`:null, 'Min. Lab Space', rd.min_lab_sf?`Min ${rd.min_lab_sf} SF`:null));
    detailRows.push(row('Waiting Capacity', ld.waiting_capacity?String(ld.waiting_capacity):null, 'Min. Waiting Capacity', rd.min_waiting_capacity?`Min ${rd.min_waiting_capacity}`:null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailLO.push(lo('Suite Number', ld.suite_number)); detailLO.push(lo('Zoning', ld.zoning));
  }
  if (pt==='retail') {
    detailRows.push(row('Sales Floor', ld.sales_floor_sf?`${ld.sales_floor_sf} SF`:null, 'Min. Sales Floor', rd.min_sales_floor_sf?`Min ${rd.min_sales_floor_sf} SF`:null));
    detailRows.push(row('Street Frontage', ld.frontage?`${ld.frontage} ft`:null, 'Min. Frontage', rd.min_frontage?`Min ${rd.min_frontage} ft`:null));
    detailRows.push(row('Traffic Count', ld.traffic_count?`${parseInt(ld.traffic_count).toLocaleString()}/day`:null, 'Min. Traffic', rd.min_traffic_count?`Min ${parseInt(rd.min_traffic_count).toLocaleString()}/day`:null));
    detailRows.push(row('Location Type', ld.location_type?.replace(/_/g,' ')||null, 'Location Type', rd.location_type?.replace(/_/g,' ')||null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailLO.push(lo('Suite Number', ld.suite_number)); detailLO.push(lo('Signage Rights', ld.signage_rights)); detailLO.push(lo('Zoning', ld.zoning));
  }
  if (pt==='industrial_flex') {
    detailRows.push(row('Loading Docks', ld.dock_doors?String(ld.dock_doors):null, 'Min. Loading Docks', rd.min_dock_doors?`Min ${rd.min_dock_doors}`:null));
    detailRows.push(row('Drive-In Doors', ld.drive_in_doors?String(ld.drive_in_doors):null, 'Min. Drive-In Doors', rd.min_drive_in_doors?`Min ${rd.min_drive_in_doors}`:null));
    detailRows.push(row('Clear Height', ld.clear_height?`${ld.clear_height} ft`:null, 'Min. Clear Height', rd.min_clear_height?`Min ${rd.min_clear_height} ft`:null));
    detailRows.push(row('Floor Load', ld.floor_load?`${ld.floor_load} lbs/SF`:null, 'Min. Floor Load', rd.min_floor_load?`Min ${rd.min_floor_load} lbs/SF`:null));
    detailRows.push(row('Power Amperage', ld.power_amps||null, 'Min. Amperage', rd.min_power_amps||null));
    detailRows.push(row('3-Phase Power', ld.three_phase?'Available':null, '3-Phase Required', rd.three_phase_required?'Required':null));
    detailRows.push(row('Rail Access', ld.rail_access?'Yes':null, 'Rail Access', rd.rail_access_required?'Required':null));
    detailLO.push(lo('Crane System', ld.crane_system)); detailLO.push(lo('Hook Height', ld.hook_height?`${ld.hook_height} ft`:null)); detailLO.push(lo('Zoning', ld.zoning));
  }
  if (['single_family','condo','apartment','townhouse'].includes(pt)) {
    detailRows.push(row('Bedrooms', ld.bedrooms?String(ld.bedrooms):null, 'Bedrooms', (rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}`:null));
    detailRows.push(row('Bathrooms', ld.bathrooms?String(ld.bathrooms):null, 'Bathrooms', (rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}`:null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('HOA', ld.hoa?`$${parseFloat(ld.hoa).toLocaleString()}/mo`:null, 'Max HOA', rd.max_hoa?`Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo`:null));
    if (pt==='single_family') {
      detailRows.push(row('Lot Size', ld.lot_sqft?`${parseInt(ld.lot_sqft).toLocaleString()} SF`:null, 'Min. Lot Size', rd.min_lot_sqft?`Min ${parseInt(rd.min_lot_sqft).toLocaleString()} SF`:null));
      detailRows.push(row('Garage', ld.garage?`${ld.garage} car`:null, 'Min. Garage', rd.min_garage?`Min ${rd.min_garage} car`:null));
      detailRows.push(row('Stories', ld.stories?.replace(/_/g,' ')||null, 'Stories', rd.stories&&rd.stories!=='any'?rd.stories.replace(/_/g,' '):null));
      detailLO.push(lo('School District', ld.school_district)); detailLO.push(lo('Heating', ld.heating?.replace(/_/g,' '))); detailLO.push(lo('Cooling', ld.cooling?.replace(/_/g,' ')));
    }
    if (pt==='condo') {
      detailRows.push(row('View', ld.view||null, 'View Preference', rd.view_pref&&rd.view_pref!=='any'?rd.view_pref:null));
      detailRows.push(row('Pet Policy', ld.pet_policy?.replace(/_/g,' ')||null, 'Pet Policy', rd.pet_policy&&rd.pet_policy!=='not_needed'?rd.pet_policy:null));
      detailLO.push(lo('Unit Number', ld.unit_number)); detailLO.push(lo('Floor', ld.floor_num?`Floor ${ld.floor_num}`:null));
    }
    if (pt==='apartment') {
      detailRows.push(row('Laundry', ld.laundry?.replace(/_/g,' ')||null, 'Laundry', rd.laundry&&rd.laundry!=='any'?rd.laundry.replace(/_/g,' '):null));
      detailRows.push(row('Pet Policy', ld.pet_policy?.replace(/_/g,' ')||null, 'Pet Policy', rd.pet_policy&&rd.pet_policy!=='not_needed'?rd.pet_policy:null));
      detailLO.push(lo('Floor', ld.floor_num?`Floor ${ld.floor_num}`:null));
    }
  }
  if (pt==='multi_family'||pt==='multi_family_5') {
    detailRows.push(row('Total Units', ld.total_units?String(ld.total_units):null, 'Unit Count', (rd.min_units||rd.max_units)?`${rd.min_units||1}–${rd.max_units||'any'}`:null));
    detailRows.push(row('Cap Rate', ld.cap_rate?`${ld.cap_rate}%`:null, 'Min. Cap Rate', rd.min_cap_rate?`Min ${rd.min_cap_rate}%`:null));
    detailRows.push(row('Occupancy', ld.occupancy_pct?`${ld.occupancy_pct}%`:null, 'Min. Occupancy', rd.min_occupancy?`Min ${rd.min_occupancy}%`:null));
    if (pt==='multi_family_5') { detailRows.push(row('NOI', ld.noi?`$${parseInt(ld.noi).toLocaleString()}`:null, 'Min. NOI', rd.min_noi?`Min $${parseInt(rd.min_noi).toLocaleString()}`:null)); }
    detailLO.push(lo('Gross Monthly Rent', ld.gross_monthly_rent?`$${parseInt(ld.gross_monthly_rent).toLocaleString()}/mo`:null));
  }
  const fd = detailRows.filter(r=>r.lVal||r.rVal), flo = detailLO.filter(r=>r.val);
  if (fd.length||flo.length) sections.push({ key:'details', title:'Property Details', rows:fd, listingOnlyRows:flo });

  // Amenities
  const lA=[...(ld.building_amenities||[]),...(ld.amenities||[]),...(ld.features||[]),...(ld.medical_features||[]),...(ld.retail_features||[])];
  const rA=[...(rd.building_amenities_required||[]),...(rd.must_haves||[])];
  if (lA.length||rA.length) {
    const all=[...new Set([...lA,...rA])];
    const ar=all.map(a=>row(a.replace(/_/g,' '),lA.includes(a)?'Included':null,a.replace(/_/g,' '),rA.includes(a)?'Required':null)).filter(r=>r.lVal||r.rVal);
    if (ar.length) sections.push({ key:'amenities', title:'Amenities & Features', rows:ar, listingOnlyRows:[] });
  }

  // Notes
  const lD=listing.description||ld.description, rD=requirement.notes||rd.intended_use;
  if (lD||rD) sections.push({ key:'notes', title:'Notes', rows:[...(lD?[row('Listing Description',lD,null,null)]:[]),...(rD?[row(null,null,'Requirement Notes',rD)]:[])].filter(r=>r.lVal||r.rVal), listingOnlyRows:[] });

  return sections;
}

function AccordionSection({ section, myColor, theirColor, myLabel, theirLabel, open, onToggle }) {
  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
      <button type="button" onClick={onToggle}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:open?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.03)', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{section.title}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>{section.rows.length+(section.listingOnlyRows?.length||0)} fields</span>
        </div>
        {open ? <ChevronUp style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.35)'}}/> : <ChevronDown style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.35)'}}/>}
      </button>
      {open && (
        <div style={{ padding:'0 16px 14px' }}>
          {section.rows.length > 0 && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'8px 0 6px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'4px' }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:myColor }}>{myLabel}</span>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:theirColor }}>{theirLabel}</span>
              </div>
              {section.rows.map((row,i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'7px 0', borderBottom:i<section.rows.length-1?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'start' }}>
                  <div>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.lLabel}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.lVal?'white':'rgba(255,255,255,0.18)', margin:0, lineHeight:1.5, wordBreak:'break-word' }}>{row.lVal||'—'}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'5px' }}>
                    {row.lVal&&row.rVal&&<Check style={{width:'11px',height:'11px',color:ACCENT,flexShrink:0,marginTop:'14px'}}/>}
                    <div>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.rLabel||row.lLabel}</p>
                      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.rVal?'white':'rgba(255,255,255,0.18)', margin:0, lineHeight:1.5, wordBreak:'break-word' }}>{row.rVal||'—'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          {section.listingOnlyRows?.length > 0 && (
            <div style={{ marginTop:section.rows.length>0?'10px':'2px', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${myColor}20`, borderRadius:'8px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:myColor, margin:'0 0 8px' }}>Listing Details</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>
                {section.listingOnlyRows.map((r,i) => r.val ? (
                  <div key={i}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.45)', margin:'0 0 1px' }}>{r.label}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.82)', margin:0, wordBreak:'break-word' }}>{r.val}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Breakdown ─────────────────────────────────────────────────────────────
function AIBreakdown({ listing, requirement, matchResult }) {
  const [text, setText]     = useState(null);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);

  const prompt = useMemo(() => {
    const { totalScore, breakdown } = matchResult;
    const lPrice  = priceStr(listing, true);
    const rPrice  = priceStr(requirement, false);
    const lSize   = listing.size_sqft ? `${parseFloat(listing.size_sqft).toLocaleString()} SF` : 'unknown size';
    const rSize   = (requirement.min_size_sqft||requirement.max_size_sqft)
      ? `${fmtN(requirement.min_size_sqft)||'0'}–${fmtN(requirement.max_size_sqft)||'∞'} SF` : 'no size preference';
    let cities = requirement.cities;
    if (typeof cities === 'string') { try { cities = JSON.parse(cities); } catch { cities = [cities]; } }
    const rLoc = Array.isArray(cities) ? cities.join(', ') : 'any location';
    const lLoc = [listing.city, listing.state].filter(Boolean).join(', ') || 'unknown location';
    const bStr = breakdown.map(b => `${b.category}: ${b.score}%`).join(', ');

    return `You are a sharp commercial real estate analyst. Write a 4–6 sentence deal breakdown.

LISTING: ${PT[listing.property_type]||listing.property_type} for ${TX[listing.transaction_type]||listing.transaction_type} in ${lLoc} · Price: ${lPrice} · Size: ${lSize}
REQUIREMENT: Seeking ${PT[requirement.property_type]||requirement.property_type} in ${rLoc} · Budget: ${rPrice} · Size: ${rSize}
MATCH SCORE: ${totalScore}% (${getScoreLabel(totalScore)||'no label'})
SCORE BREAKDOWN: ${bStr}

Rules:
1. Be concise and analytical. Reference actual numbers.
2. Wrap listing-specific values like this: {{L:value}} — they render in teal/tiffany
3. Wrap requirement-specific values like this: {{R:value}} — they render in lavender
4. Highlight the strongest alignment and any gaps.
5. End with what the next step should be.
6. Write in second person to the listing agent.
7. Plain prose only — no markdown, bullets, or headers.`;
  }, [listing, requirement, matchResult]);

  const run = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const response = await base44.functions.invoke('generateAIText', { prompt, maxTokens: 800 });
      const result = response.data;
      setText(result?.text?.trim() || 'No breakdown generated.');
    } catch (e) {
      setError('Unable to generate breakdown. Please try again.');
    } finally {
      setLoad(false);
    }
  }, [prompt]);

  useEffect(() => { run(); }, [run]);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 40px', gap:'16px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <Loader2 style={{ width:'28px', height:'28px', color:ACCENT, animation:'spin 1s linear infinite' }}/>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', margin:0 }}>Analyzing this match…</p>
    </div>
  );

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center' }}>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.45)', margin:'0 0 16px', lineHeight:1.6 }}>{error}</p>
      <button onClick={run} style={{ padding:'8px 20px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'#111827', cursor:'pointer' }}>
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{ padding:'0' }}>
      <div style={{ display:'flex', gap:'16px', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <div style={{ width:'10px', height:'6px', borderRadius:'2px', background:`${ACCENT}30`, border:`1px solid ${ACCENT}60` }}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Listing value</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <div style={{ width:'10px', height:'6px', borderRadius:'2px', background:`${LAVENDER}30`, border:`1px solid ${LAVENDER}60` }}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Requirement value</span>
        </div>
      </div>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', color:'rgba(255,255,255,0.82)', lineHeight:1.85, margin:'0 0 20px' }}>
        <HighlightedText text={text}/>
      </p>
      <button onClick={() => { setText(null); run(); }}
        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', cursor:'pointer' }}>
        <Loader2 style={{ width:'11px', height:'11px' }}/> Regenerate
      </button>
    </div>
  );
}

// ─── Full Match Modal ─────────────────────────────────────────────────────────
function MatchModal({ myPost, matchPost, matchResult, posterProfile, matchIndex, totalMatches, onPrev, onNext, onClose }) {
  const [tab, setTab]           = useState('analysis');
  const [openSections, setOpen] = useState({ core:true });
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [showCompose, setShowCompose]     = useState(false);
  const [viewingAgent, setViewingAgent]   = useState(null);

  const myIsListing = myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const theirColor  = myIsListing ? LAVENDER : ACCENT;
  const listing     = myIsListing ? myPost : matchPost;
  const requirement = myIsListing ? matchPost : myPost;

  const { totalScore, breakdown, rangeData } = matchResult;

  const posterName    = matchPost.contact_agent_name  || posterProfile?.full_name  || matchPost.created_by || 'Agent';
  const posterEmail   = matchPost.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone   = matchPost.contact_agent_phone || posterProfile?.phone;
  const posterCompany = matchPost.company_name        || posterProfile?.brokerage_name;
  const posterPhoto   = posterProfile?.profile_photo_url;

  const rangeBars   = useMemo(() => buildRangeBars(listing, requirement, breakdown), [listing, requirement, breakdown]);
  const specSections = useMemo(() => buildSpecSections(listing, requirement, myIsListing), [listing, requirement, myIsListing]);

  const myLabel    = myIsListing ? 'Your Listing' : 'Your Requirement';
  const theirLabel = myIsListing ? 'Their Requirement' : 'Their Listing';

  const TABS = [
    { key:'analysis',  label:'Match Analysis' },
    { key:'specs',     label:'Full Specs' },
    { key:'breakdown', label:'Breakdown' },
  ];

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
        onClick={onClose}>
        <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'95vw', height:'92vh', maxWidth:'1100px', display:'flex', flexDirection:'column', overflow:'hidden' }}
          onClick={e => e.stopPropagation()}>

          {/* Fixed header — tabs + nav + close */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              {totalMatches > 1 && (
                <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <button onClick={onPrev} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}>
                    <ChevronLeft style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.6)' }}/>
                  </button>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', minWidth:'40px', textAlign:'center' }}>{matchIndex+1} / {totalMatches}</span>
                  <button onClick={onNext} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}>
                    <ChevronRight style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.6)' }}/>
                  </button>
                </div>
              )}
              <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'3px', gap:'2px' }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ padding:'7px 16px', background:tab===t.key?'rgba(255,255,255,0.1)':'transparent', border:'none', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:tab===t.key?'white':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex', flexShrink:0 }}>
              <X style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)' }}/>
            </button>
          </div>

          {/* Scrollable body */}
          <div style={{ flex:1, overflowY:'auto' }}>

            {/* ── MATCH ANALYSIS ── */}
            {tab === 'analysis' && (
              <div style={{ padding:'28px 32px' }}>

                {/* Score centered at top */}
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'32px' }}>
                  <BigScoreCircle score={totalScore}/>
                </div>

                {/* Your post + Their match side by side */}
                <div style={{ display:'flex', gap:'16px', marginBottom:'36px' }}>
                  <PostBlock post={myPost} isListing={myIsListing} label={myLabel} color={myColor}
                    onViewPhotos={setLightboxPhoto}/>
                  <PostBlock post={matchPost} isListing={!myIsListing} label={theirLabel} color={theirColor}
                    onViewPhotos={setLightboxPhoto}/>
                </div>

                {/* Range bars stacked */}
                {rangeBars.length > 0 && (
                  <div style={{ marginBottom:'32px' }}>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', margin:'0 0 20px' }}>
                      How Your Listing Fits Their Requirements
                    </p>
                    {rangeBars.map((bar, i) => (
                      <RangeBar key={i} value={bar.value} min={bar.min} max={bar.max} label={bar.label} score={bar.score}/>
                    ))}
                  </div>
                )}

                {/* Contact */}
                <div style={{ background:`${theirColor}06`, border:`1px solid ${theirColor}20`, borderRadius:'14px', padding:'20px' }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 14px' }}>
                    {myIsListing ? 'Representing Agent' : 'Listing Agent'}
                  </p>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                    <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:theirColor, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'18px', fontWeight:700 }}>
                      {posterPhoto ? <img src={posterPhoto} alt={posterName} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : posterName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p onClick={() => setViewingAgent({ profile: posterProfile, email: posterEmail })}
                    style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:0, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color=ACCENT}
                    onMouseLeave={e => e.currentTarget.style.color='white'}>
                    {posterName}
                  </p>
                      {posterCompany && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{posterCompany}</p>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {posterEmail && <a href={`mailto:${posterEmail}`} style={{ display:'flex',alignItems:'center',gap:'7px',fontFamily:"'Inter',sans-serif",fontSize:'13px',color:theirColor,textDecoration:'none',padding:'8px 12px',background:`${theirColor}08`,borderRadius:'8px',border:`1px solid ${theirColor}15` }}><Mail style={{width:'13px',height:'13px'}}/>{posterEmail}</a>}
                    {posterPhone && <a href={`tel:${posterPhone}`} style={{ display:'flex',alignItems:'center',gap:'7px',fontFamily:"'Inter',sans-serif",fontSize:'13px',color:theirColor,textDecoration:'none',padding:'8px 12px',background:`${theirColor}08`,borderRadius:'8px',border:`1px solid ${theirColor}15` }}><Phone style={{width:'13px',height:'13px'}}/>{posterPhone}</a>}
                    <button onClick={() => setShowCompose(true)} style={{ display:'flex',alignItems:'center',gap:'7px',padding:'8px 16px',background:theirColor,border:'none',borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:600,color:'#111827',cursor:'pointer' }}>
                      <MessageCircle style={{width:'13px',height:'13px'}}/> Send Message
                    </button>
                  </div>
                </div>

                <button onClick={() => setTab('specs')}
                  style={{ width:'100%', marginTop:'16px', padding:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>
                  View complete field-by-field specs →
                </button>
              </div>
            )}

            {/* ── FULL SPECS ── */}
            {tab === 'specs' && (
              <div style={{ padding:'20px 28px' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:'0 0 16px', lineHeight:1.6 }}>
                  Left: <span style={{color:myColor,fontWeight:600}}>{myLabel}</span> · Right: <span style={{color:theirColor,fontWeight:600}}>{theirLabel}</span>
                </p>
                {specSections.map(s => (
                  <AccordionSection key={s.key} section={s} myColor={myColor} theirColor={theirColor} myLabel={myLabel} theirLabel={theirLabel}
                    open={!!openSections[s.key]} onToggle={() => setOpen(p => ({...p,[s.key]:!p[s.key]}))}/>
                ))}
                <div style={{height:'20px'}}/>
              </div>
            )}

            {/* ── AI BREAKDOWN ── */}
            {tab === 'breakdown' && (
              <div style={{ padding:'28px 32px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:ACCENT }}/>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)' }}>AI Match Breakdown</span>
                </div>
                <AIBreakdown listing={listing} requirement={requirement} matchResult={matchResult}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo lightbox */}
      {lightboxPhoto && <PhotoLightbox photos={lightboxPhoto} onClose={() => setLightboxPhoto(null)}/>}

      {/* Floating compose */}
      {showCompose && (
        <FloatingMessageCompose
          
          recipientProfile={posterProfile}
          recipientEmail={posterEmail}
          myPost={myPost}
          matchPost={matchPost}
          matchResult={matchResult}
          onClose={() => setShowCompose(false)}
        />
      )}

      {/* Agent contact modal */}
      {viewingAgent && (
        <AgentContactModal profile={viewingAgent.profile} email={viewingAgent.email} onClose={() => setViewingAgent(null)}/>
      )}
    </>
  );
}

// ─── Match Group Card ─────────────────────────────────────────────────────────
function MatchGroupCard({ myPost, matches, onOpen }) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const myIsListing = myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const best        = matches[previewIdx];
  const scoreColor  = getScoreColor(best.totalScore);
  const label       = getScoreLabel(best.totalScore);
  const matchPost   = myIsListing ? best.requirement : best.listing;
  const sz=44, r=18, circ=2*Math.PI*r, dash=(best.totalScore/100)*circ;

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px', transition:'all 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor=`${myColor}35`;}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'14px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
            <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myColor }}/>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:myColor }}>Your {myIsListing?'Listing':'Requirement'}</span>
          </div>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'15px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{myPost.title}</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0 }}>
            {priceStr(myPost,myIsListing)}{myIsListing&&myPost.size_sqft?` · ${parseFloat(myPost.size_sqft).toLocaleString()} SF`:''}{myPost.city?` · ${myPost.city}`:''}
          </p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'20px',flexShrink:0 }}>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:700,color:myColor }}>{matches.length}</span>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{matches.length===1?'match':'matches'}</span>
        </div>
      </div>

      <div style={{ height:'1px',background:'rgba(255,255,255,0.06)',margin:'0 0 14px' }}/>

      <div style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myIsListing?LAVENDER:ACCENT }}/>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'rgba(255,255,255,0.35)' }}>Their {myIsListing?'Requirement':'Listing'}</span>
          </div>
          {matches.length > 1 && (
            <div style={{ display:'flex',alignItems:'center',gap:'4px' }}>
              <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i-1+matches.length)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronLeft style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
              <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.3)',minWidth:'32px',textAlign:'center' }}>{previewIdx+1}/{matches.length}</span>
              <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i+1)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronRight style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ position:'relative',width:sz,height:sz,flexShrink:0 }}>
            <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={scoreColor} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/></svg>
            <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'11px',fontWeight:700,color:scoreColor }}>{best.totalScore}</span>
            </div>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{matchPost.title}</p>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)' }}>{priceStr(matchPost,!myIsListing)}</span>
              {label&&<span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:scoreColor,background:`${scoreColor}12`,border:`1px solid ${scoreColor}30`,borderRadius:'4px',padding:'1px 6px' }}>{label}</span>}
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => onOpen(myPost, best, previewIdx)}
        style={{ width:'100%',padding:'10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:myColor,cursor:'pointer',transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background=`${myColor}20`;e.currentTarget.style.borderColor=`${myColor}50`;}}
        onMouseLeave={e=>{e.currentTarget.style.background=`${myColor}10`;e.currentTarget.style.borderColor=`${myColor}25`;}}>
        View Full Match Details
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState('listings');
  const [modalState, setModalState] = useState(null);

  const { data: myListings=[] }      = useQuery({ queryKey:['my-listings'],             queryFn:()=>base44.entities.Listing.filter({created_by:user?.email}) });
  const { data: myRequirements=[] }  = useQuery({ queryKey:['my-requirements'],         queryFn:()=>base44.entities.Requirement.filter({created_by:user?.email}) });
  const { data: allListings=[] }     = useQuery({ queryKey:['all-listings-matches'],    queryFn:()=>base44.entities.Listing.list('-created_date',200) });
  const { data: allRequirements=[] } = useQuery({ queryKey:['all-requirements-matches'],queryFn:()=>base44.entities.Requirement.list('-created_date',200) });
  const { data: allProfiles=[] }     = useQuery({ queryKey:['all-user-profiles'],       queryFn:()=>base44.entities.UserProfile.list() });

  const profileMap = Object.fromEntries(allProfiles.map(p=>[p.user_email,p]));

  const listingGroups = useMemo(()=>myListings.map(listing=>{
    const matches=allRequirements.filter(r=>r.created_by!==user?.email).map(req=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...listing,postType:'listing'},matches}:null;
  }).filter(Boolean),[myListings,allRequirements,user?.email]);

  const requirementGroups = useMemo(()=>myRequirements.map(req=>{
    const matches=allListings.filter(l=>l.created_by!==user?.email).map(listing=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...req,postType:'requirement'},matches}:null;
  }).filter(Boolean),[myRequirements,allListings,user?.email]);

  const currentGroups = activeTab==='listings'?listingGroups:requirementGroups;

  const openModal=(myPost,matchResult,matchIndex)=>{
    const groups=myPost.postType==='listing'?listingGroups:requirementGroups;
    const group=groups.find(g=>g.myPost.id===myPost.id);
    setModalState({myPost,matches:group?.matches||[matchResult],matchIndex});
  };
  const navigate=(dir)=>{ if(!modalState)return; const t=modalState.matches.length; setModalState(s=>({...s,matchIndex:(s.matchIndex+dir+t)%t})); };

  return (
    <div style={{ maxWidth:'860px',margin:'0 auto',padding:'48px 32px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'32px',fontWeight:300,color:'white',margin:'0 0 6px' }}>My Matches</h1>
        <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>Matches scoring 30% or higher. Click any card to open the full analysis.</p>
      </div>

      <div style={{ display:'inline-flex',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'4px',marginBottom:'28px' }}>
        {[{key:'listings',label:'My Listings',color:ACCENT,Icon:Building2,count:listingGroups.length},{key:'requirements',label:'My Requirements',color:LAVENDER,Icon:Search,count:requirementGroups.length}].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{ padding:'10px 20px',background:activeTab===t.key?`${t.color}18`:'transparent',border:activeTab===t.key?`1px solid ${t.color}40`:'none',borderRadius:'7px',color:activeTab===t.key?t.color:'rgba(255,255,255,0.5)',cursor:'pointer',fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:500,display:'flex',alignItems:'center',gap:'8px',transition:'all 0.15s' }}>
            <t.Icon style={{width:'15px',height:'15px'}}/>{t.label}
            <span style={{ padding:'1px 7px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:activeTab===t.key?`${t.color}22`:'rgba(255,255,255,0.08)',color:activeTab===t.key?t.color:'rgba(255,255,255,0.4)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {currentGroups.length===0?(
        <div style={{ textAlign:'center',padding:'80px 32px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px' }}>
          <TrendingUp style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No matches yet</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>{activeTab==='listings'?"Your listings haven't matched with any requirements yet":"Your requirements haven't matched with any listings yet"}</p>
        </div>
      ):(
        <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
          {currentGroups.map((g,i)=><MatchGroupCard key={i} myPost={g.myPost} matches={g.matches} onOpen={openModal}/>)}
        </div>
      )}

      {modalState&&(()=>{
        const {myPost,matches,matchIndex}=modalState;
        const current=matches[matchIndex];
        const myIsListing=myPost.postType==='listing';
        const matchPost=myIsListing?current.requirement:current.listing;
        return <MatchModal myPost={myPost} matchPost={matchPost} matchResult={current} posterProfile={profileMap[matchPost.created_by]} matchIndex={matchIndex} totalMatches={matches.length} onPrev={()=>navigate(-1)} onNext={()=>navigate(1)} onClose={()=>setModalState(null)}/>;
      })()}
    </div>
  );
}