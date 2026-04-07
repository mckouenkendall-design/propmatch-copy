import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, X, Mail, Phone, MessageCircle,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, FileText, Loader2, Image,
  Bookmark, BookmarkCheck, Share2, Printer, Copy, CheckCheck
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';
import FloatingMessageCompose from '@/components/messages/FloatingMessageCompose';
import AgentContactModal from '@/components/shared/AgentContactModal';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

const fmtN = (n) => {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
const fmtMoney = (v) =>
  v >= 1000000 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${Math.round(v).toLocaleString()}`;

const PT = {
  office:'General Office', medical_office:'Medical Office', retail:'Retail',
  industrial_flex:'Industrial / Flex', land:'Land', special_use:'Special Use',
  single_family:'Single Family', condo:'Condo', apartment:'Apartment',
  multi_family:'Multi-Family (2\u20134)', multi_family_5:'Multi-Family (5+)',
  townhouse:'Townhouse', manufactured:'Manufactured / Mobile', land_residential:'Residential Land'
};
const TX = { lease:'Lease', sublease:'Sublease', sale:'Sale', rent:'Rent', purchase:'Purchase' };
const LL = {
  full_service_gross:'Full Service Gross', modified_gross:'Modified Gross',
  net_lease:'Net Lease', ground_lease:'Ground Lease', nnn:'NNN (Triple Net)',
  nn:'NN (Double Net)', n:'N (Single Net)', absolute_net:'Absolute Net'
};

function priceStr(post, isListing) {
  const tx = post.transaction_type, pp = post.price_period;
  const u = isListing
    ? (tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':'')
    : (pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
  if (isListing) { const f = fmtN(post.price); return f ? `$${f}${u}` : null; }
  const lo = fmtN(post.min_price), hi = fmtN(post.max_price);
  if (lo && hi) return `$${lo}\u2013$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

// ─── Saved Matches ────────────────────────────────────────────────────────────
function useSavedMatches(userEmail) {
  const key = `propmatch_saved_${userEmail}`;
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const matchKey = (lid, rid) => `${lid}|${rid}`;
  const isSaved = (lid, rid) => saved.includes(matchKey(lid, rid));
  const toggle = (lid, rid) => {
    const k = matchKey(lid, rid);
    setSaved(prev => {
      const next = prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };
  return { saved, isSaved, toggle };
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareMatchModal({ listing, requirement, matchResult, posterProfile, posterEmail, onMessage, onClose }) {
  const [copied, setCopied] = useState(false);
  const { totalScore } = matchResult;
  const label = getScoreLabel(totalScore);
  const lPrice = priceStr(listing, true);
  const rPrice = priceStr(requirement, false);
  const lLoc = [listing.city, listing.state].filter(Boolean).join(', ');
  const rCities = (() => {
    let c = requirement.cities;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = c.split(',').map(x=>x.trim()); } }
    return Array.isArray(c) ? c.join(', ') : c || 'Any';
  })();
  const agentName = posterProfile?.full_name || 'the agent';
  const agentCompany = posterProfile?.brokerage_name;
  const agentPhone = posterProfile?.phone;
  const scoreColor = getScoreColor(totalScore);

  const lines = [
    `PropMatch \u2014 ${label || 'Match'} (${totalScore}%)`,
    '',
    `LISTING: ${listing.title}`,
    lPrice ? `Price: ${lPrice}` : null,
    listing.size_sqft ? `Size: ${parseFloat(listing.size_sqft).toLocaleString()} SF` : null,
    lLoc ? `Location: ${lLoc}` : null,
    '',
    `REQUIREMENT: ${requirement.title}`,
    rPrice ? `Budget: ${rPrice}` : null,
    (requirement.min_size_sqft || requirement.max_size_sqft)
      ? `Size: ${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF` : null,
    rCities ? `Areas: ${rCities}` : null,
    '',
    `Agent: ${agentName}${agentCompany ? ` \u00b7 ${agentCompany}` : ''}`,
    posterEmail ? `Email: ${posterEmail}` : null,
    agentPhone ? `Phone: ${agentPhone}` : null,
    '',
    `Match score from PropMatch (prop-match.ai)`,
  ].filter(l => l !== null);
  const summary = lines.join('\n');

  const emailSubject = encodeURIComponent(`PropMatch: ${label || 'Match'} \u2014 ${listing.title}`);
  const emailBody = encodeURIComponent(summary);
  const copy = () => {
    navigator.clipboard.writeText(summary).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', zIndex:350, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'18px', width:'100%', maxWidth:'480px', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Share2 style={{ width:'16px', height:'16px', color:ACCENT }} />
            <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:600, color:'white' }}>Share This Match</span>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex' }}>
            <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
        <div style={{ padding:'20px' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'14px', marginBottom:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'22px', fontWeight:700, color:scoreColor }}>{totalScore}%</span>
              {label && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, color:scoreColor, background:`${scoreColor}15`, border:`1px solid ${scoreColor}35`, borderRadius:'5px', padding:'2px 8px' }}>{label}</span>}
            </div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.7)', margin:'0 0 4px', fontWeight:500 }}>{listing.title}</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>matches with &middot; {requirement.title}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:copied?`${ACCENT}15`:'rgba(255,255,255,0.05)', border:`1px solid ${copied?ACCENT:'rgba(255,255,255,0.1)'}`, borderRadius:'10px', cursor:'pointer', textAlign:'left' }}>
              {copied ? <CheckCheck style={{ width:'16px', height:'16px', color:ACCENT, flexShrink:0 }} /> : <Copy style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)', flexShrink:0 }} />}
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:copied?ACCENT:'white', margin:0 }}>{copied ? 'Copied!' : 'Copy Summary'}</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>Paste anywhere &mdash; email, text, notes</p>
              </div>
            </button>
            {posterEmail && (
              <a href={`mailto:${posterEmail}?subject=${emailSubject}&body=${emailBody}`}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', textDecoration:'none' }}>
                <Mail style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)', flexShrink:0 }} />
                <div>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'white', margin:0 }}>Send via Email</p>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>Opens your email client with pre-filled summary</p>
                </div>
              </a>
            )}
            <button onClick={() => { onMessage(); onClose(); }} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:`${ACCENT}12`, border:`1px solid ${ACCENT}30`, borderRadius:'10px', cursor:'pointer', textAlign:'left' }}>
              <MessageCircle style={{ width:'16px', height:'16px', color:ACCENT, flexShrink:0 }} />
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:ACCENT, margin:0 }}>Send In-App Message</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>Message the agent directly through PropMatch</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Theme Picker ─────────────────────────────────────────────────────────
function PDFOptionsModal({ onPick, onClose }) {
  const [includeAgent, setIncludeAgent] = useState(true);
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'18px', width:'100%', maxWidth:'380px', overflow:'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 20px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <Printer style={{ width:'15px', height:'15px', color:ACCENT }} />
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:600, color:'white' }}>Export as PDF</span>
            </div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>Choose a theme for your report</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'5px', cursor:'pointer', display:'flex', flexShrink:0 }}>
            <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', padding:'16px 20px 14px' }}>
          {[
            { dark:true,  emoji:'\uD83C\uDF19', label:'Dark',  sub:'Matches PropMatch style' },
            { dark:false, emoji:'\u2600\uFE0F', label:'Light', sub:'Clean, print-friendly'   },
          ].map(opt => (
            <button key={String(opt.dark)} onClick={() => { onPick(opt.dark, includeAgent); onClose(); }}
              style={{ padding:'18px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'12px', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor=`${ACCENT}55`; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)'; }}>
              <div style={{ fontSize:'22px', marginBottom:'8px' }}>{opt.emoji}</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'white', marginBottom:'3px' }}>{opt.label}</div>
              <div style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{opt.sub}</div>
            </button>
          ))}
        </div>
        {/* Agent contact toggle */}
        <div style={{ margin:'0 20px 20px', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => setIncludeAgent(v => !v)}>
          <div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:0 }}>Include Agent Contact</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>Show name, email, and phone in the report</p>
          </div>
          <div style={{ width:'36px', height:'20px', borderRadius:'10px', background:includeAgent?ACCENT:'rgba(255,255,255,0.15)', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
            <div style={{ position:'absolute', top:'3px', left:includeAgent?'19px':'3px', width:'14px', height:'14px', borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export PDF ─────────────────────────────────────────────────
function exportMatchPDF(listing, requirement, matchResult, posterProfile, darkMode = false, includeAgent = true) {
  const { totalScore, breakdown } = matchResult;
  const label = getScoreLabel(totalScore) || '';
  const sc = totalScore >= 70 ? '#00DBC5' : totalScore >= 50 ? '#F59E0B' : '#F97316';
  const lPrice = priceStr(listing, true) || '—';
  const rPrice = priceStr(requirement, false) || '—';
  const lLoc = [listing.city, listing.state].filter(Boolean).join(', ') || '—';
  const rCities = (() => {
    let c = requirement.cities;
    if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = c.split(',').map(x=>x.trim()); } }
    return Array.isArray(c) ? c.join(', ') : c || 'Any';
  })();
  const agentName    = posterProfile?.full_name || 'Unknown Agent';
  const agentCompany = posterProfile?.brokerage_name || '';
  const agentEmail   = posterProfile?.contact_email || posterProfile?.user_email || '';
  const agentPhone   = posterProfile?.phone || '';
  const now = new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });

  const listingPhotos = (() => {
    try {
      const pd = typeof listing.property_details === 'string' ? JSON.parse(listing.property_details) : (listing.property_details || {});
      const arr = pd.photo_urls;
      if (Array.isArray(arr) && arr.length) return arr;
      if (pd.photo_url) return [pd.photo_url];
    } catch {}
    return [];
  })();

  const D = darkMode;
  const bg      = D ? '#0e1318' : '#ffffff';
  const surface = D ? '#161d25' : '#f9fafb';
  const srf2    = D ? '#1b2534' : '#f3f4f6';
  const border  = D ? 'rgba(255,255,255,0.09)' : '#e5e7eb';
  const textPri = D ? 'rgba(255,255,255,0.9)'  : '#111827';
  const textSub = D ? 'rgba(255,255,255,0.5)'  : '#6b7280';
  const textMut = D ? 'rgba(255,255,255,0.28)' : '#9ca3af';
  const track   = D ? 'rgba(255,255,255,0.07)' : '#e5e7eb';
  const cardBg  = D ? '#161d25' : '#f9fafb';
  const acc = '#00DBC5', lav = '#818cf8';

  const propColor = D ? 'rgba(255,255,255,0.9)' : '#111827';
  const agentLogoUrl = posterProfile?.logo_url || '';
  const logoHTML = agentLogoUrl
    ? `<div style="flex-shrink:0;height:44px;display:flex;align-items:center;">
        <img src="${agentLogoUrl}" style="max-height:44px;max-width:200px;width:auto;height:auto;object-fit:contain;display:block;" />
      </div>`
    : `<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="2 13 41 14" width="53" height="18">
          <g transform="translate(20,20)">
            <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
              fill="none" stroke="#00DBC5" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
          </g>
        </svg>
        <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:300;color:${propColor}">Prop<span style="font-weight:700;color:#00DBC5">Match</span></span>
      </div>`;

  const photosHTML = listingPhotos.length === 0 ? '' : `
    <div class="sec">
      <div class="sec-h"><div class="sec-dot" style="background:${acc}"></div><span class="sec-t">Property Photos</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${listingPhotos.map((url, i) => `<div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:16/10;background:${srf2};">
          <img src="${url}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          ${i === 0 ? `<div style="position:absolute;top:8px;left:8px;background:${acc};color:#111827;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;padding:2px 7px;border-radius:3px;">MAIN PHOTO</div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;

  const R = 40, circ = 2 * Math.PI * R, dash = (totalScore / 100) * circ;
  const scoreSVG = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
<div style="position:relative;width:100px;height:100px">
<svg width="100" height="100" viewBox="0 0 100 100" style="transform:rotate(-90deg)">
  <circle cx="50" cy="50" r="${R}" fill="none" stroke="${track}" stroke-width="10"/>
  <circle cx="50" cy="50" r="${R}" fill="none" stroke="${sc}" stroke-width="10"
    stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" stroke-linecap="round"/>
</svg>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:700;color:${sc};line-height:1">${totalScore}</span>
  <span style="font-family:'Inter',sans-serif;font-size:9px;color:${textMut};letter-spacing:0.1em;margin-top:2px">MATCH</span>
</div>
</div>
${label ? `<span style="font-family:'Inter',sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${sc};background:${sc}18;border:1px solid ${sc}35;border-radius:20px;padding:4px 16px">${label}</span>` : ''}
</div>`;

  const whyFits = breakdown.map(b => {
    const icon = b.score >= 70 ? '&#10003;' : b.score >= 50 ? '&#126;' : '&#8226;';
    const color = b.score >= 70 ? acc : b.score >= 50 ? '#F59E0B' : '#F97316';
    const bc = b.score >= 70 ? '#00DBC5' : b.score >= 50 ? '#F59E0B' : '#F97316';
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid ${border};break-inside:avoid">
  <span style="font-size:14px;color:${color};flex-shrink:0;margin-top:1px">${icon}</span>
  <div style="flex:1">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:13px;font-weight:600;color:${textPri};font-family:'Inter',sans-serif">${b.category}</span>
      <span style="font-size:13px;font-weight:700;color:${bc};font-family:'Inter',sans-serif">${b.score}%</span>
    </div>
    <div style="height:5px;background:${track};border-radius:3px;overflow:hidden">
      <div style="height:100%;width:${b.score}%;background:${bc};border-radius:3px"></div>
    </div>
    ${b.details ? `<div style="font-size:11px;color:${textMut};margin-top:3px;font-family:'Inter',sans-serif">${b.details}</div>` : ''}
  </div>
</div>`;
  }).join('');

  const compFields = [];
  if (listing.price || requirement.min_price || requirement.max_price)
    compFields.push({ label:'Price / Budget', lv:lPrice, rv:rPrice });
  if (listing.size_sqft || requirement.min_size_sqft || requirement.max_size_sqft)
    compFields.push({ label:'Size', lv:listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:'—', rv:(requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}–${fmtN(requirement.max_size_sqft)||'∞'} SF`:'—' });
  compFields.push({ label:'Location', lv:lLoc, rv:rCities });
  compFields.push({ label:'Property Type', lv:PT[listing.property_type]||listing.property_type, rv:PT[requirement.property_type]||requirement.property_type });
  compFields.push({ label:'Transaction', lv:TX[listing.transaction_type]||listing.transaction_type, rv:TX[requirement.transaction_type]||requirement.transaction_type });
  const compRows = compFields.map((f,i) => `<tr style="background:${i%2===0?srf2:surface}">
  <td style="padding:9px 14px;font-size:12px;font-weight:600;color:${textMut};font-family:'Inter',sans-serif;white-space:nowrap">${f.label}</td>
  <td style="padding:9px 14px;font-size:13px;color:${acc};font-family:'Inter',sans-serif;font-weight:500">${f.lv}</td>
  <td style="padding:9px 14px;font-size:13px;color:${lav};font-family:'Inter',sans-serif;font-weight:500">${f.rv}</td>
</tr>`).join('');

  const lp = parseFloat(listing.price), ls = parseFloat(listing.size_sqft);
  const isLease = listing.transaction_type === 'lease' || listing.transaction_type === 'sublease';
  const monthlyTotal = isLease && lp && ls ? Math.round((lp * ls) / 12) : null;
  const annualTotal  = isLease && lp && ls ? Math.round(lp * ls) : null;
  const financialHTML = monthlyTotal ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
      <div style="background:${acc}12;border:1px solid ${acc}25;border-radius:8px;padding:12px;text-align:center">
        <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${textMut};margin-bottom:4px">Monthly Total</div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:700;color:${acc}">$${monthlyTotal.toLocaleString()}/mo</div>
      </div>
      <div style="background:${srf2};border:1px solid ${border};border-radius:8px;padding:12px;text-align:center">
        <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${textMut};margin-bottom:4px">Annual Total</div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:20px;font-weight:700;color:${textPri}">$${annualTotal.toLocaleString()}/yr</div>
      </div>
    </div>` : '';

  const agentSection = (!includeAgent) ? '' : `
    <div class="sec" style="break-inside:avoid">
      <div class="sec-h"><div class="sec-dot" style="background:${lav}"></div><span class="sec-t">Your Agent</span></div>
      <div style="background:${cardBg};border:1px solid ${border};border-radius:12px;padding:20px;display:flex;align-items:center;gap:16px">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,${lav},${acc});display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:white;flex-shrink:0;font-family:'Plus Jakarta Sans',sans-serif">${agentName[0]?.toUpperCase()||'A'}</div>
        <div style="flex:1">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:600;color:${textPri};margin-bottom:2px">${agentName}</div>
          ${agentCompany?`<div style="font-family:'Inter',sans-serif;font-size:13px;color:${textSub};margin-bottom:6px">${agentCompany}</div>`:''}
          <div style="display:flex;gap:20px;flex-wrap:wrap">
            ${agentEmail?`<span style="font-family:'Inter',sans-serif;font-size:13px;color:${acc}">&#9993; ${agentEmail}</span>`:''}
            ${agentPhone?`<span style="font-family:'Inter',sans-serif;font-size:13px;color:${textSub}">&#9990; ${agentPhone}</span>`:''}
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${textMut};margin-bottom:6px">Next Step</div>
          <div style="font-family:'Inter',sans-serif;font-size:12px;color:${textSub};max-width:160px;line-height:1.5">Reply to this email or call to schedule a showing</div>
        </div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>PropMatch — Property Match Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${bg}!important;color:${textPri};font-family:'Inter',sans-serif}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
  html,body{background:${bg}!important;background-color:${bg}!important}
  .hdr{background:${D?'#111820':surface}!important;background-color:${D?'#111820':surface}!important}
  .np{display:none!important}
}
@page{margin:.45in;size:letter}
body{padding:0}
.page{max-width:100%;margin:0 auto}
.hdr{padding:16px 28px;background:${D?'#111820':surface};border-bottom:1px solid ${border};display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:72px}
.body{padding:22px 28px}
.sec{margin-bottom:24px}
.sec-h{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:7px;border-bottom:1px solid ${border}}
.sec-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sec-t{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:${textMut};font-family:'Inter',sans-serif}
table{width:100%;border-collapse:collapse;border:1px solid ${border};border-radius:10px;overflow:hidden}
th{padding:9px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;background:${srf2};text-align:left;font-family:'Inter',sans-serif;color:${textMut}}
.ftr{padding:14px 28px;border-top:1px solid ${border};display:flex;justify-content:space-between;background:${surface};margin-top:8px}
.ftr p{font-size:11px;color:${textMut};font-family:'Inter',sans-serif}
.pb{position:fixed;bottom:20px;right:20px;background:${acc};color:#111827;border:none;border-radius:10px;padding:12px 22px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px ${acc}40;font-family:'Plus Jakarta Sans',sans-serif}
</style>
</head>
<body>
<div class="page">

  <div class="hdr">
    <div>${logoHTML}</div>
    <div style="text-align:center">
      <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:15px;font-weight:600;color:${textPri}">Property Match Report</div>
      <div style="font-family:'Inter',sans-serif;font-size:12px;color:${textSub};margin-top:2px">Prepared for your review &middot; ${now}</div>
    </div>
    <div style="display:inline-flex;align-items:center;gap:6px;background:${sc}15;border:1px solid ${sc}30;border-radius:20px;padding:6px 14px">
      <span style="font-family:'Plus Jakarta Sans',sans-serif;font-size:18px;font-weight:700;color:${sc}">${totalScore}%</span>
      ${label?`<span style="font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:${sc}">${label}</span>`:''}
    </div>
  </div>

  <div style="padding:24px 28px;background:${surface};border-bottom:1px solid ${border}">
    <div style="display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start">
      <div>
        <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${acc};margin-bottom:6px">Property Available</div>
        <h1 style="font-family:'Plus Jakarta Sans',sans-serif;font-size:22px;font-weight:600;color:${textPri};margin-bottom:8px;line-height:1.2">${listing.title||'Property Listing'}</h1>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px">
          ${lLoc!=='—'?`<span style="font-family:'Inter',sans-serif;font-size:13px;color:${textSub}">&#128205; ${lLoc}</span>`:''}
          ${listing.size_sqft?`<span style="font-family:'Inter',sans-serif;font-size:13px;color:${textSub}">&middot; ${parseFloat(listing.size_sqft).toLocaleString()} SF</span>`:''}
          ${listing.transaction_type?`<span style="font-family:'Inter',sans-serif;font-size:13px;color:${textSub}">&middot; ${TX[listing.transaction_type]||listing.transaction_type}</span>`:''}
        </div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:700;color:${acc}">${lPrice}</div>
        ${financialHTML}
      </div>
      <div>${scoreSVG}</div>
    </div>
    ${listing.description?`<div style="margin-top:14px;padding:12px 16px;background:${D?'rgba(255,255,255,0.04)':srf2};border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;color:${textSub};line-height:1.6">${listing.description}</div>`:''}
  </div>

  <div class="body">
    ${photosHTML}

    <div class="sec">
      <div class="sec-h"><div class="sec-dot" style="background:${sc}"></div><span class="sec-t">How This Property Fits Your Needs</span></div>
      <div style="background:${cardBg};border:1px solid ${border};border-radius:10px;padding:4px 16px">
        ${whyFits}
      </div>
    </div>

    <div class="sec" style="break-inside:avoid;page-break-inside:avoid">
      <div class="sec-h"><div class="sec-dot" style="background:${lav}"></div><span class="sec-t">Requirements vs. This Property</span></div>
      <table>
        <thead><tr>
          <th style="width:130px">Category</th>
          <th style="color:${acc}">This Property Offers</th>
          <th style="color:${lav}">Your Client Needs</th>
        </tr></thead>
        <tbody>${compRows}</tbody>
      </table>
    </div>

    ${agentSection}
  </div>

  <div class="ftr">
    <p>Generated by <strong>prop-match.ai</strong></p>
    <p>Match scores are analytical estimates. Verify all details before transacting.</p>
  </div>
</div>
<button class="pb np" onclick="document.fonts.ready.then(()=>window.print())">&#128424; Print / Save PDF</button>
${D ? `<div style="position:fixed;bottom:70px;right:20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;font-family:'Inter',sans-serif;font-size:11px;color:rgba(255,255,255,0.5);max-width:220px;text-align:center" class="np">Tip: Enable "Background graphics" in print dialog for dark mode</div>` : ''}
</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=780');
  if (!win) { alert('Please allow popups to export the PDF.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
}


// ─── Highlighted Text ─────────────────────────────────────────────────────────
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
      {parts.map((p,i) => p.type === 'text'
        ? <span key={i}>{p.text}</span>
        : <span key={i} style={{ color:p.side==='L'?ACCENT:LAVENDER, fontWeight:600 }}>{p.text}</span>
      )}
    </span>
  );
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photos, onClose }) {
  const [idx, setIdx] = useState(0);
  const list = Array.isArray(photos) ? photos : (photos ? [photos] : []);
  if (!list.length) return null;
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i-1+list.length)%list.length); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i+1)%list.length); };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      {list.length > 1 && (
        <button onClick={prev} style={{ position:'absolute', left:'20px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'50%', width:'48px', height:'48px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
          <ChevronLeft style={{ width:'22px', height:'22px', color:'white' }}/>
        </button>
      )}
      <div onClick={e=>e.stopPropagation()} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', maxWidth:'calc(100vw - 140px)', maxHeight:'90vh' }}>
        <img src={list[idx]} alt={`Photo ${idx+1}`} style={{ maxWidth:'100%', maxHeight:'80vh', objectFit:'contain', borderRadius:'10px', boxShadow:'0 8px 40px rgba(0,0,0,0.6)' }}/>
        {list.length > 1 && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {list.map((_,i)=>(
              <button key={i} onClick={e=>{e.stopPropagation();setIdx(i);}}
                style={{ width:i===idx?'24px':'8px', height:'8px', borderRadius:'4px', background:i===idx?ACCENT:'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', transition:'all 0.2s', padding:0 }}/>
            ))}
          </div>
        )}
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{list.length > 1 ? `${idx+1} of ${list.length}` : ''}</p>
      </div>
      {list.length > 1 && (
        <button onClick={next} style={{ position:'absolute', right:'20px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'50%', width:'48px', height:'48px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.22)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
          <ChevronRight style={{ width:'22px', height:'22px', color:'white' }}/>
        </button>
      )}
      <button onClick={onClose} style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px', cursor:'pointer', display:'flex' }}>
        <X style={{ width:'18px', height:'18px', color:'white' }}/>
      </button>
    </div>
  );
}

// ─── Big Score Circle ─────────────────────────────────────────────────────────
function BigScoreCircle({ score }) {
  const color = getScoreColor(score), label = getScoreLabel(score);
  const sz=120, r=48, circ=2*Math.PI*r, dash=(score/100)*circ;
  const uid = `sg${score}`;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
      <style>{`
        @keyframes ${uid}{
          0%,100%{filter:drop-shadow(0 0 6px ${color}70) drop-shadow(0 0 18px ${color}40)}
          50%{filter:drop-shadow(0 0 13px ${color}a0) drop-shadow(0 0 32px ${color}65)}
        }
        .${uid}{animation:${uid} 3s ease-in-out infinite}
      `}</style>
      <div style={{ position:'relative', width:sz, height:sz }}>
        <svg width={sz} height={sz} className={uid} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11"/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="11"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'32px', fontWeight:700, color, lineHeight:1 }}>{score}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', letterSpacing:'0.09em', marginTop:'3px' }}>MATCH</span>
        </div>
      </div>
      {label && (
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color, background:`${color}15`, border:`1px solid ${color}35`, borderRadius:'30px', padding:'5px 18px', boxShadow:`0 0 18px ${color}35` }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Range Bar ────────────────────────────────────────────────────────────────
function RangeBar({ value, min, max, label, score }) {
  if (value == null || (min == null && max == null)) return null;
  const lo=min!=null?parseFloat(min):null, hi=max!=null?parseFloat(max):null, v=parseFloat(value);
  const refLo=lo??v*0.6, refHi=hi??v*1.4, pad=(refHi-refLo)*0.3;
  const barMin=Math.max(0,refLo-pad), barMax=refHi+pad, range=barMax-barMin;
  if (range===0) return null;
  const vP=Math.max(3,Math.min(97,((v-barMin)/range)*100));
  const loP=lo!=null?Math.max(0,Math.min(100,((refLo-barMin)/range)*100)):null;
  const hiP=hi!=null?Math.max(0,Math.min(100,((refHi-barMin)/range)*100)):null;
  const sc=getScoreColor(score);
  return (
    <div style={{ marginBottom:'24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.6)', fontWeight:500 }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:700, color:ACCENT }}>{fmtMoney(v)}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, color:sc, background:`${sc}12`, border:`1px solid ${sc}30`, borderRadius:'4px', padding:'2px 6px' }}>{score}%</span>
        </div>
      </div>
      <div style={{ position:'relative', height:'44px' }}>
        <div style={{ position:'absolute', top:'18px', left:0, right:0, height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'4px' }}>
          {loP!=null&&hiP!=null&&<div style={{ position:'absolute', left:`${loP}%`, width:`${hiP-loP}%`, height:'100%', background:`${LAVENDER}22`, borderRadius:'4px', border:`1px solid ${LAVENDER}45` }}/>}
          <div style={{ position:'absolute', left:`${vP}%`, top:'-6px', transform:'translateX(-50%)', width:'20px', height:'20px', borderRadius:'50%', background:ACCENT, border:'3px solid #0E1318', boxShadow:`0 0 12px ${ACCENT}70`, zIndex:2 }}/>
        </div>
        {lo!=null&&loP!=null&&<span style={{ position:'absolute', top:'32px', left:`${loP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:`${LAVENDER}70`, whiteSpace:'nowrap' }}>{fmtMoney(refLo)}</span>}
        {hi!=null&&hiP!=null&&<span style={{ position:'absolute', top:'32px', left:`${hiP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:`${LAVENDER}70`, whiteSpace:'nowrap' }}>{fmtMoney(refHi)}</span>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginTop:'6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:ACCENT }}/><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>Your listing value</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><div style={{ width:'14px', height:'6px', borderRadius:'2px', background:`${LAVENDER}25`, border:`1px solid ${LAVENDER}45` }}/><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>Their required range</span></div>
      </div>
    </div>
  );
}

function buildRangeBars(listing, requirement, breakdown) {
  const ld=parseDetails(listing), rd=parseDetails(requirement);
  const getScore=(kw)=>{ const f=breakdown?.find(b=>b.category?.toLowerCase().includes(kw.toLowerCase())); return f?f.score:null; };
  const bars=[];
  const add=(label,value,min,max,skw)=>{
    if(!value||(!min&&!max))return;
    const v=parseFloat(value),lo=min?parseFloat(min):null,hi=max?parseFloat(max):null;
    let score=getScore(skw);
    if(score===null){if(lo!=null&&hi!=null){if(v>=lo&&v<=hi)score=100;else if(v<lo)score=Math.max(0,Math.round(100-((lo-v)/lo)*100));else score=Math.max(0,Math.round(100-((v-hi)/hi)*150));}else if(lo!=null){score=v>=lo?100:Math.max(0,Math.round(100-((lo-v)/lo)*100));}else if(hi!=null){score=v<=hi?100:Math.max(0,Math.round(100-((v-hi)/hi)*150));}else{score=100;}}
    bars.push({label,value:v,min:lo,max:hi,score});
  };
  const price=parseFloat(listing.price),size=parseFloat(listing.size_sqft),tx=listing.transaction_type,isLease=tx==='lease'||tx==='sublease';
  if(price){if(isLease&&size){const monthly=(price*size)/12;if(requirement.price_period==='per_sf_per_year')add('Rate ($/SF/yr)',price,requirement.min_price,requirement.max_price,'price');else add('Monthly Total',monthly,requirement.min_price,requirement.max_price,'price');}else add('Price',price,requirement.min_price,requirement.max_price,'price');}
  if(size)add('Size (SF)',size,requirement.min_size_sqft,requirement.max_size_sqft,'size');
  const pt=listing.property_type;
  if(pt==='office'){if(ld.offices)add('Private Offices',ld.offices,rd.min_offices,rd.max_offices,'details');if(ld.conf_rooms)add('Conference Rooms',ld.conf_rooms,rd.min_conf_rooms,rd.max_conf_rooms,'details');if(ld.total_parking_spaces)add('Parking Spaces',ld.total_parking_spaces,rd.min_total_parking_spaces,rd.max_parking,'details');}
  if(pt==='medical_office'){if(ld.exam_rooms)add('Exam Rooms',ld.exam_rooms,rd.min_exam_rooms,null,'details');if(ld.procedure_rooms)add('Procedure Rooms',ld.procedure_rooms,rd.min_procedure_rooms,null,'details');if(ld.waiting_capacity)add('Waiting Capacity',ld.waiting_capacity,rd.min_waiting_capacity,null,'details');if(ld.lab_sf)add('Lab Space (SF)',ld.lab_sf,rd.min_lab_sf,null,'details');}
  if(pt==='retail'){if(ld.traffic_count)add('Traffic Count (/day)',ld.traffic_count,rd.min_traffic_count,null,'details');if(ld.frontage)add('Street Frontage (ft)',ld.frontage,rd.min_frontage,null,'details');if(ld.ceiling_height)add('Ceiling Height (ft)',ld.ceiling_height,rd.min_ceiling_height,null,'details');if(ld.total_parking_spaces)add('Parking Spaces',ld.total_parking_spaces,rd.min_total_parking_spaces,null,'details');}
  if(pt==='industrial_flex'){if(ld.dock_doors)add('Loading Docks',ld.dock_doors,rd.min_dock_doors,null,'details');if(ld.drive_in_doors)add('Drive-In Doors',ld.drive_in_doors,rd.min_drive_in_doors,null,'details');if(ld.clear_height)add('Clear Height (ft)',ld.clear_height,rd.min_clear_height,null,'details');if(ld.floor_load)add('Floor Load (lbs/SF)',ld.floor_load,rd.min_floor_load,null,'details');if(ld.truck_court_depth)add('Truck Court (ft)',ld.truck_court_depth,rd.min_truck_court_depth,null,'details');}
  if(['single_family','condo','apartment','townhouse','manufactured'].includes(pt)){if(ld.bedrooms)add('Bedrooms',ld.bedrooms,rd.min_bedrooms,rd.max_bedrooms,'details');if(ld.bathrooms)add('Bathrooms',ld.bathrooms,rd.min_bathrooms,rd.max_bathrooms,'details');if(ld.hoa&&rd.max_hoa)add('HOA ($/mo)',ld.hoa,0,rd.max_hoa,'details');if(ld.year_built&&rd.min_year_built)add('Year Built',ld.year_built,rd.min_year_built,null,'details');}
  if(pt==='multi_family'||pt==='multi_family_5'){if(ld.cap_rate&&rd.min_cap_rate)add('Cap Rate (%)',ld.cap_rate,rd.min_cap_rate,null,'details');if(ld.occupancy_pct&&rd.min_occupancy)add('Occupancy (%)',ld.occupancy_pct,rd.min_occupancy,null,'details');if(ld.noi&&rd.min_noi)add('NOI ($)',ld.noi,rd.min_noi,null,'details');if(ld.total_units)add('Total Units',ld.total_units,rd.min_units,rd.max_units,'details');}
  if(pt==='land'||pt==='land_residential'){if(ld.acres)add('Acreage',ld.acres,rd.min_acres,rd.max_acres,'details');if(ld.road_frontage)add('Road Frontage (ft)',ld.road_frontage,rd.min_road_frontage,rd.max_road_frontage,'details');if(ld.traffic_count)add('Traffic Count (/day)',ld.traffic_count,rd.min_traffic_count,null,'details');}
  return bars;
}

// ─── Post Block ───────────────────────────────────────────────────────────────
function PostBlock({ post, isListing, label, color, onViewPhotos }) {
  const pd=parseDetails(post), price=priceStr(post,isListing), lPrice=parseFloat(post.price), lSize=parseFloat(post.size_sqft);
  const showCalc=isListing&&(post.transaction_type==='lease'||post.transaction_type==='sublease')&&lPrice&&lSize;
  const monthly=showCalc?Math.round((lPrice*lSize)/12):null, annual=showCalc?Math.round(lPrice*lSize):null;
  const brochureUrl=pd?.brochure_url;
  const photoUrl = (() => {
    const toArr = (v) => {
      if (Array.isArray(v) && v.length) return v;
      if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p) && p.length) return p; } catch {} }
      return null;
    };
    const fromPd = toArr(pd?.photo_urls);
    if (fromPd) return fromPd;
    try {
      const raw = typeof post.property_details === 'string' ? JSON.parse(post.property_details) : (post.property_details || {});
      const fromRaw = toArr(raw.photo_urls);
      if (fromRaw) return fromRaw;
      if (raw.photo_url) return [raw.photo_url];
    } catch {}
    const single = pd?.photo_url || post.photo_url;
    if (single) return [single];
    return null;
  })();
  const chips=[
    isListing?[post.city,post.state].filter(Boolean).join(', '):post.cities?.join(', '),
    isListing?(lSize?`${lSize.toLocaleString()} SF`:null):((post.min_size_sqft||post.max_size_sqft)?`${fmtN(post.min_size_sqft)||'0'}\u2013${fmtN(post.max_size_sqft)||'\u221e'} SF`:null),
    TX[post.transaction_type]||post.transaction_type,
    PT[post.property_type]||post.property_type
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
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>&middot;</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>${annual?.toLocaleString()}/yr total</span>
        </div>
      )}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>
        {chips.map((c,i)=><span key={i} style={{ padding:'2px 8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'5px', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.55)', textTransform:'capitalize' }}>{c}</span>)}
      </div>
      {(post.description||post.notes)&&<p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.6, margin:'0 0 10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{post.description||post.notes}</p>}
      {isListing&&(photoUrl||brochureUrl)&&(
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'6px' }}>
          {photoUrl&&<button onClick={()=>onViewPhotos&&onViewPhotos(photoUrl)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'rgba(255,255,255,0.07)', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.75)', cursor:'pointer' }}><Image style={{ width:'13px', height:'13px' }}/> View Photos</button>}
          {brochureUrl&&<a href={brochureUrl} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', background:'rgba(255,255,255,0.07)', border:'2px solid rgba(255,255,255,0.2)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:'rgba(255,255,255,0.75)', textDecoration:'none' }}><FileText style={{ width:'13px', height:'13px' }}/> View Brochure</a>}
        </div>
      )}
    </div>
  );
}

// ─── Full Specs ───────────────────────────────────────────────────────────────
function buildSpecSections(listing, requirement, myIsListing) {
  const ld=parseDetails(listing), rd=parseDetails(requirement);
  const row=(lLabel,lVal,rLabel,rVal)=>({lLabel,lVal:lVal||null,rLabel:rLabel||null,rVal:rVal||null});
  const lo=(label,val)=>({listingOnly:true,label,val:val||null});
  const sections=[];
  const parseCities=(c)=>{
    if(typeof c==='string'){try{c=JSON.parse(c);}catch{c=c.split(',').map(x=>x.trim());}}
    return Array.isArray(c)?c.join(', '):c||null;
  };
  const coreRows=[
    row('Property Type',PT[listing.property_type]||listing.property_type,'Property Type',PT[requirement.property_type]||requirement.property_type),
    row('Transaction',TX[listing.transaction_type]||listing.transaction_type,'Transaction',TX[requirement.transaction_type]||requirement.transaction_type),
    row('Price',priceStr(listing,true),'Budget',priceStr(requirement,false)),
    row('Size',listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:null,'Size Range',(requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF`:null),
    row('Location',[listing.city,listing.state].filter(Boolean).join(', ')||null,'Preferred Areas',parseCities(requirement.cities)),
    row('Status',listing.status||'Active','Status',requirement.status||'Active'),
  ].filter(r=>r.lVal||r.rVal);
  const coreLO=[lo('Address',listing.address),lo('Zip Code',listing.zip_code)].filter(r=>r.val);
  if(coreRows.length||coreLO.length)sections.push({key:'core',title:'Core Details',rows:coreRows,listingOnlyRows:coreLO});
  if(listing.transaction_type==='lease'||listing.transaction_type==='sublease'){const leaseLO=[lo('Lease Type',LL[listing.lease_type]||listing.lease_type)].filter(r=>r.val);if(leaseLO.length)sections.push({key:'lease',title:'Lease Terms',rows:[],listingOnlyRows:leaseLO});}
  const detailRows=[],detailLO=[],pt=listing.property_type;
  if(pt==='office'){detailRows.push(row('Private Offices',ld.offices?String(ld.offices):null,'Min. Private Offices',rd.min_offices?`Min ${rd.min_offices}`:null));detailRows.push(row('Conference Rooms',ld.conf_rooms?String(ld.conf_rooms):null,'Min. Conference Rooms',rd.min_conf_rooms?`Min ${rd.min_conf_rooms}`:null));detailRows.push(row('Building Class',ld.building_class?`Class ${ld.building_class}`:null,'Acceptable Classes',rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));detailRows.push(row('Total Parking',ld.total_parking_spaces?String(ld.total_parking_spaces):null,'Min. Parking',rd.min_total_parking_spaces?`Min ${rd.min_total_parking_spaces}`:null));detailLO.push(lo('Suite Number',ld.suite_number));detailLO.push(lo('Zoning',ld.zoning));}
  if(pt==='medical_office'){detailRows.push(row('Exam Rooms',ld.exam_rooms?String(ld.exam_rooms):null,'Min. Exam Rooms',rd.min_exam_rooms?`Min ${rd.min_exam_rooms}`:null));detailRows.push(row('Procedure Rooms',ld.procedure_rooms?String(ld.procedure_rooms):null,'Min. Procedure Rooms',rd.min_procedure_rooms?`Min ${rd.min_procedure_rooms}`:null));detailRows.push(row('Lab Space',ld.lab_sf?`${ld.lab_sf} SF`:null,'Min. Lab Space',rd.min_lab_sf?`Min ${rd.min_lab_sf} SF`:null));detailLO.push(lo('Suite Number',ld.suite_number));detailLO.push(lo('Zoning',ld.zoning));}
  if(pt==='retail'){detailRows.push(row('Sales Floor',ld.sales_floor_sf?`${ld.sales_floor_sf} SF`:null,'Min. Sales Floor',rd.min_sales_floor_sf?`Min ${rd.min_sales_floor_sf} SF`:null));detailRows.push(row('Street Frontage',ld.frontage?`${ld.frontage} ft`:null,'Min. Frontage',rd.min_frontage?`Min ${rd.min_frontage} ft`:null));detailRows.push(row('Traffic Count',ld.traffic_count?`${parseInt(ld.traffic_count).toLocaleString()}/day`:null,'Min. Traffic',rd.min_traffic_count?`Min ${parseInt(rd.min_traffic_count).toLocaleString()}/day`:null));detailLO.push(lo('Suite Number',ld.suite_number));detailLO.push(lo('Zoning',ld.zoning));}
  if(pt==='industrial_flex'){detailRows.push(row('Loading Docks',ld.dock_doors?String(ld.dock_doors):null,'Min. Loading Docks',rd.min_dock_doors?`Min ${rd.min_dock_doors}`:null));detailRows.push(row('Drive-In Doors',ld.drive_in_doors?String(ld.drive_in_doors):null,'Min. Drive-In Doors',rd.min_drive_in_doors?`Min ${rd.min_drive_in_doors}`:null));detailRows.push(row('Clear Height',ld.clear_height?`${ld.clear_height} ft`:null,'Min. Clear Height',rd.min_clear_height?`Min ${rd.min_clear_height} ft`:null));detailRows.push(row('3-Phase Power',ld.three_phase?'Available':null,'3-Phase Required',rd.three_phase_required?'Required':null));detailLO.push(lo('Crane System',ld.crane_system));detailLO.push(lo('Zoning',ld.zoning));}
  if(['single_family','condo','apartment','townhouse'].includes(pt)){detailRows.push(row('Bedrooms',ld.bedrooms?String(ld.bedrooms):null,'Bedrooms',(rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||1}\u2013${rd.max_bedrooms||'any'}`:null));detailRows.push(row('Bathrooms',ld.bathrooms?String(ld.bathrooms):null,'Bathrooms',(rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}\u2013${rd.max_bathrooms||'any'}`:null));detailRows.push(row('Year Built',ld.year_built?String(ld.year_built):null,'Min. Year Built',rd.min_year_built?`After ${rd.min_year_built}`:null));detailRows.push(row('HOA',ld.hoa?`$${parseFloat(ld.hoa).toLocaleString()}/mo`:null,'Max HOA',rd.max_hoa?`Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo`:null));}
  if(pt==='multi_family'||pt==='multi_family_5'){detailRows.push(row('Total Units',ld.total_units?String(ld.total_units):null,'Unit Count',(rd.min_units||rd.max_units)?`${rd.min_units||1}\u2013${rd.max_units||'any'}`:null));detailRows.push(row('Cap Rate',ld.cap_rate?`${ld.cap_rate}%`:null,'Min. Cap Rate',rd.min_cap_rate?`Min ${rd.min_cap_rate}%`:null));detailRows.push(row('Occupancy',ld.occupancy_pct?`${ld.occupancy_pct}%`:null,'Min. Occupancy',rd.min_occupancy?`Min ${rd.min_occupancy}%`:null));}
  const fd=detailRows.filter(r=>r.lVal||r.rVal),flo=detailLO.filter(r=>r.val);
  if(fd.length||flo.length)sections.push({key:'details',title:'Property Details',rows:fd,listingOnlyRows:flo});
  const lA=[...(ld.building_amenities||[]),...(ld.amenities||[]),...(ld.features||[]),...(ld.medical_features||[]),...(ld.retail_features||[])];
  const rA=[...(rd.building_amenities_required||[]),...(rd.must_haves||[])];
  if(lA.length||rA.length){const all=[...new Set([...lA,...rA])];const ar=all.map(a=>row(a.replace(/_/g,' '),lA.includes(a)?'Included':null,a.replace(/_/g,' '),rA.includes(a)?'Required':null)).filter(r=>r.lVal||r.rVal);if(ar.length)sections.push({key:'amenities',title:'Amenities & Features',rows:ar,listingOnlyRows:[]});}
  const lD=listing.description||ld.description,rD=requirement.notes||rd.intended_use;
  if(lD||rD)sections.push({key:'notes',title:'Notes',rows:[...(lD?[row('Listing Description',lD,null,null)]:[]),...(rD?[row(null,null,'Requirement Notes',rD)]:[])].filter(r=>r.lVal||r.rVal),listingOnlyRows:[]});
  return sections;
}

function AccordionSection({ section, myColor, theirColor, myLabel, theirLabel, open, onToggle }) {
  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
      <button type="button" onClick={onToggle} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:open?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.03)', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{section.title}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>{section.rows.length+(section.listingOnlyRows?.length||0)} fields</span>
        </div>
        {open?<ChevronUp style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.35)'}}/>:<ChevronDown style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.35)'}}/>}
      </button>
      {open&&(
        <div style={{ padding:'0 16px 14px' }}>
          {section.rows.length>0&&(<>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'8px 0 6px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'4px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:myColor }}>{myLabel}</span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:theirColor }}>{theirLabel}</span>
            </div>
            {section.rows.map((row,i)=>(
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'7px 0', borderBottom:i<section.rows.length-1?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'start' }}>
                <div><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.lLabel}</p><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.lVal?'white':'rgba(255,255,255,0.18)', margin:0, lineHeight:1.5, wordBreak:'break-word' }}>{row.lVal||'\u2014'}</p></div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'5px' }}>
                  {row.lVal&&row.rVal&&<Check style={{width:'11px',height:'11px',color:ACCENT,flexShrink:0,marginTop:'14px'}}/>}
                  <div><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.28)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.rLabel||row.lLabel}</p><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.rVal?'white':'rgba(255,255,255,0.18)', margin:0, lineHeight:1.5, wordBreak:'break-word' }}>{row.rVal||'\u2014'}</p></div>
                </div>
              </div>
            ))}
          </>)}
          {section.listingOnlyRows?.length>0&&(
            <div style={{ marginTop:section.rows.length>0?'10px':'2px', padding:'10px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${myColor}20`, borderRadius:'8px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:myColor, margin:'0 0 8px' }}>Listing Details</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 16px' }}>{section.listingOnlyRows.map((r,i)=>r.val?<div key={i}><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.45)', margin:'0 0 1px' }}>{r.label}</p><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.82)', margin:0, wordBreak:'break-word' }}>{r.val}</p></div>:null)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Breakdown ─────────────────────────────────────────────────────────────
function AIBreakdown({ listing, requirement, matchResult, onStartConversation }) {
  const [text,setText]=useState(null),[loading,setLoad]=useState(false),[error,setError]=useState(null);
  const prompt=useMemo(()=>{
    const {totalScore,breakdown}=matchResult;
    const lPrice=priceStr(listing,true),rPrice=priceStr(requirement,false);
    const lSize=listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:'unknown size';
    const rSize=(requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF`:'no size preference';
    let cities=requirement.cities;if(typeof cities==='string'){try{cities=JSON.parse(cities);}catch{cities=cities.split(',').map(x=>x.trim());}}
    const rLoc=Array.isArray(cities)?cities.join(', '):'any location';
    const lLoc=[listing.city,listing.state].filter(Boolean).join(', ')||'unknown location';
    const bStr=breakdown.map(b=>`${b.category}: ${b.score}%`).join(', ');
    const lp=parseFloat(listing.price),ls=parseFloat(listing.size_sqft),isLease=listing.transaction_type==='lease'||listing.transaction_type==='sublease';
    const mc=isLease&&lp&&ls?`$${Math.round((lp*ls)/12).toLocaleString()}/mo`:null;
    const ac=isLease&&lp&&ls?`$${Math.round(lp*ls).toLocaleString()}/yr`:null;
    return `You are a sharp commercial real estate analyst. Write a 4\u20136 sentence deal breakdown.\n\nLISTING: ${PT[listing.property_type]||listing.property_type} for ${TX[listing.transaction_type]||listing.transaction_type} in ${lLoc} \u00b7 Rate: ${lPrice} \u00b7 Size: ${lSize}${mc?` \u00b7 Monthly total: ${mc}`:''}${ac?` \u00b7 Annual total: ${ac}`:''}
REQUIREMENT: Seeking ${PT[requirement.property_type]||requirement.property_type} in ${rLoc} \u00b7 Budget: ${rPrice} \u00b7 Size: ${rSize}
MATCH SCORE: ${totalScore}% (${getScoreLabel(totalScore)||'no label'})
SCORE BREAKDOWN: ${bStr}\n\nRules:\n1. Be concise and analytical. Reference actual numbers.\n2. Wrap listing-specific values like this: {{L:value}}\n3. Wrap requirement-specific values like this: {{R:value}}\n4. Highlight the strongest alignment and any gaps.\n5. End with a clear call to action for why these agents should connect.\n6. Write in second person to the listing agent.\n7. Plain prose only. No markdown, bullets, headers, or em dashes.\n8. Use ONLY the numbers provided above.`;
  },[listing,requirement,matchResult]);
  const run=useCallback(async()=>{setLoad(true);setError(null);try{const r=await supabase.functions.invoke('generateAIText', { body: {prompt,maxTokens:800} });const t=r.data;setText((t?.text?.trim()||'No breakdown generated.').replace(/\u2014/g,',').replace(/ - /g,', '));}catch(e){setError('Unable to generate breakdown. Please try again.');}finally{setLoad(false);}},[ prompt]);
  useEffect(()=>{run();},[run]);
  if(loading)return(<div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 40px', gap:'16px' }}><style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style><Loader2 style={{ width:'28px', height:'28px', color:ACCENT, animation:'spin 1s linear infinite' }}/><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.4)', margin:0 }}>Analyzing this match\u2026</p></div>);
  if(error)return(<div style={{ padding:'40px', textAlign:'center' }}><p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.45)', margin:'0 0 16px', lineHeight:1.6 }}>{error}</p><button onClick={run} style={{ padding:'8px 20px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'#111827', cursor:'pointer' }}>Try Again</button></div>);
  return(
    <div>
      <div style={{ display:'flex', gap:'16px', marginBottom:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'10px', height:'6px', borderRadius:'2px', background:`${ACCENT}30`, border:`1px solid ${ACCENT}60` }}/><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Listing value</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'10px', height:'6px', borderRadius:'2px', background:`${LAVENDER}30`, border:`1px solid ${LAVENDER}60` }}/><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>Requirement value</span></div>
      </div>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', color:'rgba(255,255,255,0.82)', lineHeight:1.85, margin:'0 0 20px' }}><HighlightedText text={text}/></p>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        {onStartConversation&&<button onClick={onStartConversation} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:ACCENT, border:'none', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:600, color:'#111827', cursor:'pointer' }}>Start Conversation</button>}
        <button onClick={()=>{setText(null);run();}} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', cursor:'pointer' }}><Loader2 style={{ width:'11px', height:'11px' }}/> Regenerate</button>
      </div>
    </div>
  );
}

// ─── Match Modal ──────────────────────────────────────────────────────────────
function MatchModal({ myPost, matchPost, matchResult, posterProfile, matchIndex, totalMatches, onPrev, onNext, onClose, savedHook }) {
  const [tab,setTab]=useState('analysis'),[openSections,setOpen]=useState({core:true});
  const [lightboxPhoto,setLightboxPhoto]=useState(null),[showCompose,setShowCompose]=useState(false);
  const [showShare,setShowShare]=useState(false),[showPDFOptions,setShowPDFOptions]=useState(false),[viewingAgent,setViewingAgent]=useState(null);

  const myIsListing=myPost.postType==='listing',myColor=myIsListing?ACCENT:LAVENDER,theirColor=myIsListing?LAVENDER:ACCENT;
  const listing=myIsListing?myPost:matchPost, requirement=myIsListing?matchPost:myPost;
  const {totalScore,breakdown}=matchResult;
  const posterName=matchPost.contact_agent_name||posterProfile?.full_name||matchPost.created_by||'Agent';
  const posterEmail=matchPost.contact_agent_email||posterProfile?.contact_email||posterProfile?.user_email;
  const posterPhone=matchPost.contact_agent_phone||posterProfile?.phone;
  const posterCompany=matchPost.company_name||posterProfile?.brokerage_name;
  const posterPhoto=posterProfile?.profile_photo_url;
  const rangeBars=useMemo(()=>buildRangeBars(listing,requirement,breakdown),[listing,requirement,breakdown]);
  const specSections=useMemo(()=>buildSpecSections(listing,requirement,myIsListing),[listing,requirement,myIsListing]);
  const myLabel=myIsListing?'Your Listing':'Your Requirement', theirLabel=myIsListing?'Their Requirement':'Their Listing';
  const isMatchSaved=savedHook.isSaved(listing.id,requirement.id);

  const iconBtn=(onClick,title,icon,label,active)=>(
    <button onClick={onClick} title={title} style={{ background:active?`${ACCENT}18`:'rgba(255,255,255,0.06)', border:`1px solid ${active?ACCENT:'rgba(255,255,255,0.1)'}`, borderRadius:'7px', padding:'6px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', flexShrink:0, transition:'all 0.15s' }}
      onMouseEnter={e=>{e.currentTarget.style.background=active?`${ACCENT}28`:'rgba(255,255,255,0.12)';}}
      onMouseLeave={e=>{e.currentTarget.style.background=active?`${ACCENT}18`:'rgba(255,255,255,0.06)';}}>
      {icon}<span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:active?ACCENT:'rgba(255,255,255,0.5)' }}>{label}</span>
    </button>
  );

  const TABS=[{key:'analysis',label:'Match Analysis'},{key:'specs',label:'Full Specs'},{key:'breakdown',label:'Breakdown'}];

  return(<>
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'95vw', height:'92vh', maxWidth:'1100px', display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
            {totalMatches>1&&(<div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
              <button onClick={onPrev} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}><ChevronLeft style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.6)' }}/></button>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', minWidth:'40px', textAlign:'center' }}>{matchIndex+1} / {totalMatches}</span>
              <button onClick={onNext} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}><ChevronRight style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.6)' }}/></button>
            </div>)}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'3px', gap:'2px' }}>
              {TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'7px 14px', background:tab===t.key?'rgba(255,255,255,0.1)':'transparent', border:'none', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:tab===t.key?'white':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>{t.label}</button>)}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            {iconBtn(()=>savedHook.toggle(listing.id,requirement.id),isMatchSaved?'Unsave':'Save match',isMatchSaved?<BookmarkCheck style={{ width:'14px', height:'14px', color:ACCENT }}/>:<Bookmark style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>,isMatchSaved?'Saved':'Save',isMatchSaved)}
            {iconBtn(()=>setShowShare(true),'Share match',<Share2 style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>,'Share',false)}
            {iconBtn(()=>setShowPDFOptions(true),'Export PDF',<Printer style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>,'PDF',false)}
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex' }}><X style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)' }}/></button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {tab==='analysis'&&(
            <div style={{ padding:'28px 32px' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'32px' }}><BigScoreCircle score={totalScore}/></div>
              <div style={{ display:'flex', gap:'16px', marginBottom:'36px' }}>
                <PostBlock post={myPost} isListing={myIsListing} label={myLabel} color={myColor} onViewPhotos={setLightboxPhoto}/>
                <PostBlock post={matchPost} isListing={!myIsListing} label={theirLabel} color={theirColor} onViewPhotos={setLightboxPhoto}/>
              </div>
              {rangeBars.length>0&&(
                <div style={{ marginBottom:'32px' }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', margin:'0 0 20px' }}>How Your Listing Fits Their Requirements</p>
                  {rangeBars.map((bar,i)=><RangeBar key={i} value={bar.value} min={bar.min} max={bar.max} label={bar.label} score={bar.score}/>)}
                </div>
              )}
              <div style={{ background:`${theirColor}06`, border:`1px solid ${theirColor}20`, borderRadius:'14px', padding:'20px' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 14px' }}>{myIsListing?'Representing Agent':'Listing Agent'}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:theirColor, flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', color:'#111827', fontSize:'18px', fontWeight:700 }}>
                    {posterPhoto?<img src={posterPhoto} alt={posterName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:posterName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p onClick={()=>setViewingAgent({profile:posterProfile,email:posterEmail})} style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', fontWeight:600, color:'white', margin:0, cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.color=ACCENT} onMouseLeave={e=>e.currentTarget.style.color='white'}>{posterName}</p>
                    {posterCompany&&<p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>{posterCompany}</p>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {posterEmail&&<a href={`mailto:${posterEmail}`} style={{ display:'flex',alignItems:'center',gap:'7px',fontFamily:"'Inter',sans-serif",fontSize:'13px',color:theirColor,textDecoration:'none',padding:'8px 12px',background:`${theirColor}08`,borderRadius:'8px',border:`1px solid ${theirColor}15` }}><Mail style={{width:'13px',height:'13px'}}/>{posterEmail}</a>}
                  {posterPhone&&<a href={`tel:${posterPhone}`} style={{ display:'flex',alignItems:'center',gap:'7px',fontFamily:"'Inter',sans-serif",fontSize:'13px',color:theirColor,textDecoration:'none',padding:'8px 12px',background:`${theirColor}08`,borderRadius:'8px',border:`1px solid ${theirColor}15` }}><Phone style={{width:'13px',height:'13px'}}/>{posterPhone}</a>}
                  <button onClick={()=>setShowCompose(true)} style={{ display:'flex',alignItems:'center',gap:'7px',padding:'8px 16px',background:theirColor,border:'none',borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:600,color:'#111827',cursor:'pointer' }}><MessageCircle style={{width:'13px',height:'13px'}}/> Send Message</button>
                </div>
              </div>
              <button onClick={()=>setTab('specs')} style={{ width:'100%', marginTop:'16px', padding:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>View complete field-by-field specs &rarr;</button>
            </div>
          )}
          {tab==='specs'&&(
            <div style={{ padding:'20px 28px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:'0 0 16px', lineHeight:1.6 }}>Left: <span style={{color:myColor,fontWeight:600}}>{myLabel}</span> &middot; Right: <span style={{color:theirColor,fontWeight:600}}>{theirLabel}</span></p>
              {specSections.map(s=><AccordionSection key={s.key} section={s} myColor={myColor} theirColor={theirColor} myLabel={myLabel} theirLabel={theirLabel} open={!!openSections[s.key]} onToggle={()=>setOpen(p=>({...p,[s.key]:!p[s.key]}))}/>)}
              <div style={{height:'20px'}}/>
            </div>
          )}
          <div style={{ display:tab==='breakdown'?'block':'none', padding:'28px 32px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:ACCENT }}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.4)' }}>AI Match Breakdown</span>
            </div>
            <AIBreakdown listing={listing} requirement={requirement} matchResult={matchResult} onStartConversation={()=>setShowCompose(true)}/>
          </div>
        </div>
      </div>
    </div>
    {lightboxPhoto&&<PhotoLightbox photos={lightboxPhoto} onClose={()=>setLightboxPhoto(null)}/>}
    {showCompose&&<FloatingMessageCompose recipientProfile={posterProfile} recipientEmail={posterEmail} myPost={myPost} matchPost={matchPost} matchResult={matchResult} onClose={()=>setShowCompose(false)}/>}
    {showShare&&<ShareMatchModal listing={listing} requirement={requirement} matchResult={matchResult} posterProfile={posterProfile} posterEmail={posterEmail} onMessage={()=>setShowCompose(true)} onClose={()=>setShowShare(false)}/>}
    {showPDFOptions&&<PDFOptionsModal onPick={(dark,incAgent)=>exportMatchPDF(listing,requirement,matchResult,posterProfile,dark,incAgent)} onClose={()=>setShowPDFOptions(false)}/>}
    {viewingAgent&&<AgentContactModal profile={viewingAgent.profile} email={viewingAgent.email} onClose={()=>setViewingAgent(null)}/>}
  </>);
}

// ─── Match Group Card ─────────────────────────────────────────────────────────
function MatchGroupCard({ myPost, matches, onOpen, savedHook }) {
  const [previewIdx,setPreviewIdx]=useState(0);
  const myIsListing=myPost.postType==='listing', myColor=myIsListing?ACCENT:LAVENDER;
  const best=matches[previewIdx], scoreColor=getScoreColor(best.totalScore), label=getScoreLabel(best.totalScore);
  const matchPost=myIsListing?best.requirement:best.listing;
  const sz=44,r=18,circ=2*Math.PI*r,dash=(best.totalScore/100)*circ;
  const strong=matches.filter(m=>m.totalScore>=70).length;
  const good=matches.filter(m=>m.totalScore>=50&&m.totalScore<70).length;
  const fair=matches.filter(m=>m.totalScore<50).length;

  return(
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px', transition:'all 0.2s', position:'relative' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor=`${myColor}35`;}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'14px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}><div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myColor }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:myColor }}>Your {myIsListing?'Listing':'Requirement'}</span></div>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'15px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{myPost.title}</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0 }}>{priceStr(myPost,myIsListing)}{myIsListing&&myPost.size_sqft?` · ${parseFloat(myPost.size_sqft).toLocaleString()} SF`:''}{myPost.city?` · ${myPost.city}`:''}</p>
        </div>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'5px',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'20px' }}>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:700,color:myColor }}>{matches.length}</span>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{matches.length===1?'match':'matches'}</span>
          </div>
          {matches.length > 1 && (
            <div style={{ display:'flex',alignItems:'center',gap:'7px' }}>
              {strong>0&&<div style={{ display:'flex',alignItems:'center',gap:'3px' }}><div style={{ width:'7px',height:'7px',borderRadius:'50%',background:ACCENT,boxShadow:`0 0 5px ${ACCENT}80` }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:600,color:ACCENT }}>{strong}</span></div>}
              {good>0&&<div style={{ display:'flex',alignItems:'center',gap:'3px' }}><div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'#F59E0B' }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:600,color:'#F59E0B' }}>{good}</span></div>}
              {fair>0&&<div style={{ display:'flex',alignItems:'center',gap:'3px' }}><div style={{ width:'7px',height:'7px',borderRadius:'50%',background:'rgba(255,255,255,0.25)' }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:600,color:'rgba(255,255,255,0.4)' }}>{fair}</span></div>}
            </div>
          )}
        </div>
      </div>
      <div style={{ height:'1px',background:'rgba(255,255,255,0.06)',margin:'0 0 14px' }}/>
      <div style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}><div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myIsListing?LAVENDER:ACCENT }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'rgba(255,255,255,0.35)' }}>Their {myIsListing?'Requirement':'Listing'}</span></div>
          {matches.length>1&&(<div style={{ display:'flex',alignItems:'center',gap:'4px' }}>
            <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i-1+matches.length)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronLeft style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.3)',minWidth:'32px',textAlign:'center' }}>{previewIdx+1}/{matches.length}</span>
            <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i+1)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronRight style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
          </div>)}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ position:'relative',width:sz,height:sz,flexShrink:0 }}>
            <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={scoreColor} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/></svg>
            <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'11px',fontWeight:700,color:scoreColor }}>{best.totalScore}</span></div>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{matchPost.title}</p>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)' }}>{priceStr(matchPost,!myIsListing)}</span>
              {label&&<span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:scoreColor,background:`${scoreColor}12`,border:`1px solid ${scoreColor}30`,borderRadius:'20px',padding:'2px 8px' }}>{label}</span>}
            </div>
          </div>
        </div>
      </div>
      <button onClick={()=>onOpen(myPost,best,previewIdx)} style={{ width:'100%',padding:'10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:myColor,cursor:'pointer',transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background=`${myColor}20`;e.currentTarget.style.borderColor=`${myColor}50`;}}
        onMouseLeave={e=>{e.currentTarget.style.background=`${myColor}10`;e.currentTarget.style.borderColor=`${myColor}25`;}}>
        View Full Match Details
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const {user}=useAuth();
  const [activeTab,setActiveTab]=useState('listings'),[filterSaved,setFilterSaved]=useState(false),[modalState,setModalState]=useState(null);
  const location = useLocation();
  const openPostId = location.state?.openPostId;
  const showSaved = location.state?.showSaved;
  useEffect(()=>{if(showSaved)setFilterSaved(true);},[showSaved]);
  const savedHook=useSavedMatches(user?.email);
  const {data:myListings=[]}      =useQuery({queryKey:['my-listings',user?.email],              queryFn:async()=> { const { data } = await supabase.from('listings').select('*').eq('created_by', user?.email); return data; },enabled:!!user?.email});
  const {data:myRequirements=[]}  =useQuery({queryKey:['my-requirements',user?.email],          queryFn:async()=> { const { data } = await supabase.from('requirements').select('*').eq('created_by', user?.email); return data; },enabled:!!user?.email});
  const {data:allListings=[]}     =useQuery({queryKey:['all-listings-matches',user?.email],     queryFn:async()=> { const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(200); return data; },enabled:!!user?.email});
  const {data:allRequirements=[]} =useQuery({queryKey:['all-requirements-matches',user?.email], queryFn:async()=> { const { data } = await supabase.from('requirements').select('*').order('created_at', { ascending: false }).limit(200); return data; },enabled:!!user?.email});
  const {data:allProfiles=[]}     =useQuery({queryKey:['all-user-profiles',user?.email],        queryFn:async()=> { const { data } = await supabase.from('user_profiles').select('*'); return data; },enabled:!!user?.email});
  const {data:myMemberships=[]}   =useQuery({queryKey:['my-memberships',user?.email], queryFn:async()=> { const { data } = await supabase.from('group_members').select('*').eq('user_email', user?.email); return data; }, enabled:!!user?.email});
  const profileMap=Object.fromEntries(allProfiles.map(p=>[p.user_email,p]));
  const myProfile=profileMap[user?.email];
  const myBrokerageId=myProfile?.brokerage_id||user?.employing_broker_id||'';
  const myGroupIds=new Set(myMemberships.map(m=>m.group_id));

  // Filter posts by visibility rules before matching
  const isVisibleToMe = React.useCallback((post) => {
    const v = post.visibility || 'public';
    if (v === 'public') return true;
    if (v === 'brokerage') return myBrokerageId && post.brokerage_id === myBrokerageId;
    if (v === 'team') {
      const groups = (post.visibility_groups || '').split(',').map(s=>s.trim()).filter(Boolean);
      return groups.some(gId => myGroupIds.has(gId));
    }
    if (v === 'private') return (post.visibility_recipient_email || '').split(',').map(s=>s.trim()).includes(user?.email);
    return false;
  }, [myBrokerageId, myGroupIds, user?.email]);

  const visibleListings     = React.useMemo(() => allListings.filter(l => l.created_by === user?.email || isVisibleToMe(l)),     [allListings,     isVisibleToMe, user?.email]);
  const visibleRequirements = React.useMemo(() => allRequirements.filter(r => r.created_by === user?.email || isVisibleToMe(r)), [allRequirements, isVisibleToMe, user?.email]);
  const listingGroups=useMemo(()=>myListings.map(listing=>{
    const myEmails=[user?.email,user?.contact_email].filter(Boolean);
    const otherReqs=visibleRequirements.filter(r=>r.created_by!==user?.email);
    const matches=otherReqs.map(req=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...listing,postType:'listing'},matches}:null;
  }).filter(Boolean),[myListings,visibleRequirements,user?.email]);
  const requirementGroups=useMemo(()=>myRequirements.map(req=>{
    const myEmails=[user?.email,user?.contact_email].filter(Boolean);
    const otherListings=visibleListings.filter(l=>!myEmails.includes(l.contact_agent_email)&&!myEmails.includes(l.created_by));
    const matches=otherListings.map(listing=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...req,postType:'requirement'},matches}:null;
  }).filter(Boolean),[myRequirements,visibleListings,user?.email]);
  const currentGroups=useMemo(()=>{
    const groups=activeTab==='listings'?listingGroups:requirementGroups;
    if(!filterSaved)return groups;
    return groups.filter(g=>g.matches.some(m=>{const il=g.myPost.postType==='listing',l=il?g.myPost:m.listing,r=il?m.requirement:g.myPost;return savedHook.isSaved(l.id,r.id);}));
  },[activeTab,listingGroups,requirementGroups,filterSaved,savedHook.saved]);
  const savedCount=savedHook.saved.length;
  const openModal=(myPost,matchResult,matchIndex)=>{const groups=myPost.postType==='listing'?listingGroups:requirementGroups;const group=groups.find(g=>g.myPost.id===myPost.id);setModalState({myPost,matches:group?.matches||[matchResult],matchIndex});};

  useEffect(()=>{
    if(!openPostId)return;
    const allGroups=[...listingGroups,...requirementGroups];
    const group=allGroups.find(g=>g.myPost.id===openPostId);
    if(group&&group.matches.length>0){
      setActiveTab(group.myPost.postType==='listing'?'listings':'requirements');
      setModalState({myPost:group.myPost,matches:group.matches,matchIndex:0});
      window.history.replaceState({},'');
    }
  },[openPostId,listingGroups,requirementGroups]);

  const navigate=(dir)=>{if(!modalState)return;const t=modalState.matches.length;setModalState(s=>({...s,matchIndex:(s.matchIndex+dir+t)%t}));};
  return(
    <div style={{ maxWidth:'860px', margin:'0 auto', padding:'48px 32px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'32px', fontWeight:300, color:'white', margin:'0 0 6px' }}>{filterSaved?'Saved Matches':'My Matches'}</h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:0 }}>{filterSaved?'Your bookmarked matches. Toggle between listings and requirements below.':'Matches scoring 30% or higher. Click any card to open the full analysis.'}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'10px' }}>
        <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'4px' }}>
          {[{key:'listings',label:'My Listings',color:ACCENT,Icon:Building2,count:listingGroups.length},{key:'requirements',label:'My Requirements',color:LAVENDER,Icon:Search,count:requirementGroups.length}].map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              style={{ padding:'10px 20px', background:activeTab===t.key?`${t.color}18`:'transparent', border:activeTab===t.key?`1px solid ${t.color}40`:'none', borderRadius:'7px', color:activeTab===t.key?t.color:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
              <t.Icon style={{width:'15px',height:'15px'}}/>{t.label}
              <span style={{ padding:'1px 7px', borderRadius:'12px', fontSize:'11px', fontWeight:700, background:activeTab===t.key?`${t.color}22`:'rgba(255,255,255,0.08)', color:activeTab===t.key?t.color:'rgba(255,255,255,0.4)' }}>{t.count}</span>
            </button>
          ))}
        </div>
        <button onClick={()=>{setFilterSaved(f=>!f);if(filterSaved)setActiveTab('listings');}}
          disabled={savedCount===0&&!filterSaved}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 14px', background:filterSaved?`${ACCENT}15`:'rgba(255,255,255,0.05)', border:`1px solid ${filterSaved?ACCENT:'rgba(255,255,255,0.1)'}`, borderRadius:'8px', cursor:savedCount===0&&!filterSaved?'default':'pointer', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:filterSaved?ACCENT:savedCount===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.5)', transition:'all 0.15s', opacity:savedCount===0&&!filterSaved?0.5:1 }}>
          {filterSaved
            ? <><span style={{fontSize:'13px'}}>←</span> All Matches</>
            : <><BookmarkCheck style={{ width:'14px', height:'14px' }}/>{savedCount>0?`Saved (${savedCount})`:'Saved Matches'}</>
          }
        </button>
      </div>
      {currentGroups.length===0?(
        <div style={{ textAlign:'center', padding:'80px 32px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px' }}>
          {filterSaved?(<><BookmarkCheck style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/><h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No saved matches</h3><p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>Open any match and click Save to bookmark it here.</p></>):(<><TrendingUp style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/><h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No matches yet</h3><p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>{activeTab==='listings'?"Your listings haven't matched with any requirements yet":"Your requirements haven't matched with any listings yet"}</p></>)}
        </div>
      ):(
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {currentGroups.map((g,i)=><MatchGroupCard key={i} myPost={g.myPost} matches={g.matches} onOpen={openModal} savedHook={savedHook}/>)}
        </div>
      )}
      {modalState&&(()=>{
        const {myPost,matches,matchIndex}=modalState;
        const current=matches[matchIndex],myIsListing=myPost.postType==='listing';
        const matchPost=myIsListing?current.requirement:current.listing;
        return <MatchModal myPost={myPost} matchPost={matchPost} matchResult={current} posterProfile={profileMap[matchPost.created_by]} matchIndex={matchIndex} totalMatches={matches.length} onPrev={()=>navigate(-1)} onNext={()=>navigate(1)} onClose={()=>setModalState(null)} savedHook={savedHook}/>;
      })()}
    </div>
  );
}