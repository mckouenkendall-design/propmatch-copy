import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN = (n) => {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
const fmtMoney = (v) =>
  v >= 1000000 ? `$${(v/1e6).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${Math.round(v).toLocaleString()}`;

const PT = { office:'General Office', medical_office:'Medical Office', retail:'Retail', industrial_flex:'Industrial / Flex', land:'Land', special_use:'Special Use', single_family:'Single Family', condo:'Condo', apartment:'Apartment', multi_family:'Multi-Family (2\u20134)', multi_family_5:'Multi-Family (5+)', townhouse:'Townhouse', manufactured:'Manufactured / Mobile', land_residential:'Residential Land' };
const TX = { lease:'Lease', sublease:'Sublease', sale:'Sale', rent:'Rent', purchase:'Purchase' };
const LL = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', nnn:'NNN (Triple Net)', nn:'NN (Double Net)', n:'N (Single Net)', absolute_net:'Absolute Net' };

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

// ─── Phase 5: Saved Matches (localStorage) ────────────────────────────────────
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

// ─── Phase 5: Share Match Modal ───────────────────────────────────────────────
function ShareMatchModal({ listing, requirement, matchResult, posterProfile, posterEmail, onMessage, onClose }) {
  const [copied, setCopied] = useState(false);
  const { totalScore } = matchResult;
  const label = getScoreLabel(totalScore);
  const lPrice = priceStr(listing, true);
  const rPrice = priceStr(requirement, false);
  const lLoc = [listing.city, listing.state].filter(Boolean).join(', ');
  const rCities = (() => { let c = requirement.cities; if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = [c]; } } return Array.isArray(c) ? c.join(', ') : c || 'Any'; })();
  const agentName = posterProfile?.full_name || 'the agent';
  const agentCompany = posterProfile?.brokerage_name;
  const agentPhone = posterProfile?.phone;

  const summary = [
    `PropMatch \u2014 ${label || 'Match'} (${totalScore}%)`,
    '',
    `LISTING: ${listing.title}`,
    lPrice ? `Price: ${lPrice}` : null,
    listing.size_sqft ? `Size: ${parseFloat(listing.size_sqft).toLocaleString()} SF` : null,
    lLoc ? `Location: ${lLoc}` : null,
    '',
    `REQUIREMENT: ${requirement.title}`,
    rPrice ? `Budget: ${rPrice}` : null,
    (requirement.min_size_sqft || requirement.max_size_sqft) ? `Size: ${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF` : null,
    rCities ? `Areas: ${rCities}` : null,
    '',
    `Agent: ${agentName}${agentCompany ? ` \u00b7 ${agentCompany}` : ''}`,
    posterEmail ? `Email: ${posterEmail}` : null,
    agentPhone ? `Phone: ${agentPhone}` : null,
    '',
    `Match score calculated by PropMatch (prop-match.ai)`,
  ].filter(l => l !== null).join('\n');

  const emailSubject = encodeURIComponent(`PropMatch: ${label || 'Match'} \u2014 ${listing.title}`);
  const emailBody = encodeURIComponent(summary);
  const copy = () => { navigator.clipboard.writeText(summary).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const scoreColor = getScoreColor(totalScore);

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
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', margin:0 }}>matches with \u00b7 {requirement.title}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', background:copied?`${ACCENT}15`:'rgba(255,255,255,0.05)', border:`1px solid ${copied?ACCENT:'rgba(255,255,255,0.1)'}`, borderRadius:'10px', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
              {copied ? <CheckCheck style={{ width:'16px', height:'16px', color:ACCENT, flexShrink:0 }} /> : <Copy style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)', flexShrink:0 }} />}
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:copied?ACCENT:'white', margin:0 }}>{copied ? 'Copied!' : 'Copy Summary'}</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0 }}>Paste anywhere \u2014 email, text, notes</p>
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

// ─── Phase 5: Export to PDF ───────────────────────────────────────────────────
function exportMatchPDF(listing, requirement, matchResult, posterProfile) {
  const { totalScore, breakdown } = matchResult;
  const label = getScoreLabel(totalScore) || '';
  const sc = totalScore >= 70 ? '#00DBC5' : totalScore >= 50 ? '#F59E0B' : '#F97316';
  const lPrice = priceStr(listing, true) || '\u2014';
  const rPrice = priceStr(requirement, false) || '\u2014';
  const lLoc = [listing.city, listing.state].filter(Boolean).join(', ') || '\u2014';
  const rCities = (() => { let c = requirement.cities; if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = [c]; } } return Array.isArray(c) ? c.join(', ') : c || 'Any'; })();
  const agentName = posterProfile?.full_name || 'Unknown Agent';
  const agentCompany = posterProfile?.brokerage_name || '';
  const agentEmail = posterProfile?.contact_email || posterProfile?.user_email || '';
  const agentPhone = posterProfile?.phone || '';
  const now = new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' });
  const bRows = breakdown.map(b => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${b.category}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;"><span style="font-size:13px;font-weight:700;color:${b.score>=70?'#059669':b.score>=50?'#d97706':'#dc2626'};">${b.score}%</span></td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${b.details||''}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>PropMatch \u2014 ${listing.title}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;background:white}@page{margin:.75in;size:letter}.header{background:#0E1318;padding:32px 40px;display:flex;align-items:center;justify-content:space-between}.logo{font-size:22px;font-weight:700;color:#00DBC5}.hdr-r{text-align:right;color:rgba(255,255,255,.5);font-size:12px}.score-banner{background:#f9fafb;border-bottom:2px solid #e5e7eb;padding:28px 40px;display:flex;align-items:center;gap:24px}.score-circle{width:80px;height:80px;border-radius:50%;border:5px solid ${sc};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}.score-num{font-size:28px;font-weight:800;color:${sc};line-height:1}.score-pct{font-size:10px;color:#6b7280}.score-lbl{font-size:20px;font-weight:700;color:${sc}}.score-sub{font-size:13px;color:#6b7280;margin-top:4px}.body{padding:32px 40px}.section{margin-bottom:28px}.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}.post-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px}.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}.ll{color:#00DBC5}.rl{color:#818cf8}.ptitle{font-size:15px;font-weight:600;color:#111827;margin-bottom:6px;line-height:1.3}.pprice{font-size:18px;font-weight:800;margin-bottom:4px}.lp{color:#00DBC5}.rp{color:#818cf8}.chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}.chip{background:#e5e7eb;border-radius:4px;padding:2px 7px;font-size:11px;color:#6b7280}.desc{font-size:12px;color:#6b7280;line-height:1.5;margin-top:6px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;border-bottom:2px solid #e5e7eb}.agent-row{display:flex;align-items:flex-start;gap:14px}.avatar{width:44px;height:44px;border-radius:50%;background:#818cf8;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:white;flex-shrink:0}.footer{background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;display:flex;align-items:center;justify-content:space-between}.footer p{font-size:11px;color:#9ca3af}.print-btn{position:fixed;bottom:24px;right:24px;background:#00DBC5;color:#111827;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer}@media print{.print-btn{display:none}}</style></head><body>
<div class="header"><div class="logo">prop-match.ai</div><div class="hdr-r"><p>Match Report</p><p style="color:rgba(255,255,255,.7);font-size:13px;margin-top:3px">${now}</p></div></div>
<div class="score-banner"><div class="score-circle"><span class="score-num">${totalScore}</span><span class="score-pct">MATCH</span></div><div><div class="score-lbl">${label}</div><div class="score-sub">${PT[listing.property_type]||listing.property_type} \u00b7 ${TX[listing.transaction_type]||listing.transaction_type}</div></div></div>
<div class="body">
<div class="section"><div class="sec-title">Match Summary</div><div class="two-col">
<div class="post-card"><div class="lbl ll">Your Listing</div><div class="ptitle">${listing.title||'Untitled'}</div><div class="pprice lp">${lPrice}</div><div class="chips">${lLoc?`<span class="chip">${lLoc}</span>`:''} ${listing.size_sqft?`<span class="chip">${parseFloat(listing.size_sqft).toLocaleString()} SF</span>`:''} ${listing.transaction_type?`<span class="chip">${TX[listing.transaction_type]||listing.transaction_type}</span>`:''}</div>${listing.description?`<div class="desc">${listing.description}</div>`:''}</div>
<div class="post-card"><div class="lbl rl">Their Requirement</div><div class="ptitle">${requirement.title||'Untitled'}</div><div class="pprice rp">${rPrice}</div><div class="chips">${rCities?`<span class="chip">${rCities}</span>`:''} ${(requirement.min_size_sqft||requirement.max_size_sqft)?`<span class="chip">${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF</span>`:''} ${requirement.transaction_type?`<span class="chip">${TX[requirement.transaction_type]||requirement.transaction_type}</span>`:''}</div>${requirement.notes?`<div class="desc">${requirement.notes}</div>`:''}</div>
</div></div>
<div class="section"><div class="sec-title">Score Breakdown</div><table><thead><tr><th>Category</th><th style="text-align:center;width:80px">Score</th><th>Details</th></tr></thead><tbody>${bRows}</tbody></table></div>
<div class="section"><div class="sec-title">Agent Contact</div><div class="agent-row"><div class="avatar">${agentName[0]?.toUpperCase()||'A'}</div><div><div style="font-size:16px;font-weight:600;color:#111827">${agentName}</div>${agentCompany?`<div style="font-size:13px;color:#6b7280;margin-top:2px">${agentCompany}</div>`:''}<div style="font-size:13px;color:#6b7280;margin-top:6px">${agentEmail?`\uD83D\uDCE7 ${agentEmail}`:''}${agentEmail&&agentPhone?'&nbsp;&nbsp;':''}${agentPhone?`\uD83D\uDCDE ${agentPhone}`:''}</div></div></div></div>
</div>
<div class="footer"><p>Generated by <a href="https://prop-match.ai" style="color:#00DBC5">prop-match.ai</a></p><p>Match scores are estimates. Verify details before transacting.</p></div>
<button class="print-btn" onclick="window.print()">\uD83D\uDDA8\uFE0F Print / Save PDF</button>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=700');
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
  return <span>{parts.map((p,i) => p.type==='text' ? <span key={i}>{p.text}</span> : <span key={i} style={{ color:p.side==='L'?ACCENT:LAVENDER, fontWeight:600 }}>{p.text}</span>)}</span>;
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photos, onClose }) {
  const [idx, setIdx] = useState(0);
  const list = Array.isArray(photos) ? photos : [photos].filter(Boolean);
  if (!list.length) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:400, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'80vh' }} onClick={e => e.stopPropagation()}>
        <img src={list[idx]} alt={`Photo ${idx+1}`} style={{ maxWidth:'90vw', maxHeight:'80vh', objectFit:'contain', borderRadius:'8px' }}/>
        {list.length > 1 && (<>
          <button onClick={() => setIdx(i => (i-1+list.length)%list.length)} style={{ position:'absolute', left:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft style={{ width:'18px', height:'18px', color:'white' }}/></button>
          <button onClick={() => setIdx(i => (i+1)%list.length)} style={{ position:'absolute', right:'-50px', top:'50%', transform:'translateY(-50%)', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight style={{ width:'18px', height:'18px', color:'white' }}/></button>
        </>)}
        <div style={{ position:'absolute', bottom:'-36px', left:'50%', transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{list.length > 1 ? `${idx+1} / ${list.length}` : ''}</div>
      </div>
      <button onClick={onClose} style={{ position:'absolute', top:'20px', right:'20px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', padding:'8px', cursor:'pointer' }}><X style={{ width:'18px', height:'18px', color:'white' }}/></button>
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
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="9" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:700, color, lineHeight:1 }}>{score}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', marginTop:'2px' }}>MATCH</span>
        </div>
      </div>
      {label && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color, background:`${color}15`, border:`1px solid ${color}35`, borderRadius:'6px', padding:'4px 14px' }}>{label}</span>}
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
  const brochureUrl=pd?.brochure_url, photoUrl=pd?.photo_url;
  const chips=[isListing?[post.city,post.state].filter(Boolean).join(', '):post.cities?.join(', '),isListing?(lSize?`${lSize.toLocaleString()} SF`:null):((post.min_size_sqft||post.max_size_sqft)?`${fmtN(post.min_size_sqft)||'0'}\u2013${fmtN(post.max_size_sqft)||'\u221e'} SF`:null),TX[post.transaction_type]||post.transaction_type,PT[post.property_type]||post.property_type].filter(Boolean);
  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}20`, borderRadius:'14px', padding:'20px', flex:1 }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:color }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color }}>{label}</span>
      </div>
      <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'17px', fontWeight:500, color:'white', margin:'0 0 6px', lineHeight:1.3 }}>{post.title}</h3>
      {price&&<div style={{ fontFamily:"'Inter',sans-serif", fontSize:'20px', fontWeight:700, color, marginBottom:'4px' }}>{price}</div>}
      {showCalc&&<div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>${monthly?.toLocaleString()}/mo</span><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.25)' }}>\u00b7</span><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.45)' }}>${annual?.toLocaleString()}/yr total</span></div>}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px' }}>{chips.map((c,i)=><span key={i} style={{ padding:'2px 8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'5px', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.55)', textTransform:'capitalize' }}>{c}</span>)}</div>
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
  const parseCities=(c)=>{if(typeof c==='string'){try{c=JSON.parse(c);}catch{c=[c];}}return Array.isArray(c)?c.join(', '):c||null;};
  const coreRows=[row('Property Type',PT[listing.property_type]||listing.property_type,'Property Type',PT[requirement.property_type]||requirement.property_type),row('Transaction',TX[listing.transaction_type]||listing.transaction_type,'Transaction',TX[requirement.transaction_type]||requirement.transaction_type),row('Price',priceStr(listing,true),'Budget',priceStr(requirement,false)),row('Size',listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:null,'Size Range',(requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF`:null),row('Location',[listing.city,listing.state].filter(Boolean).join(', ')||null,'Preferred Areas',parseCities(requirement.cities)),row('Status',listing.status||'Active','Status',requirement.status||'Active')].filter(r=>r.lVal||r.rVal);
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
  const [text, setText]=useState(null), [loading, setLoad]=useState(false), [error, setError]=useState(null);
  const prompt=useMemo(()=>{
    const {totalScore,breakdown}=matchResult;
    const lPrice=priceStr(listing,true), rPrice=priceStr(requirement,false);
    const lSize=listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:'unknown size';
    const rSize=(requirement.min_size_sqft||requirement.max_size_sqft)?`${fmtN(requirement.min_size_sqft)||'0'}\u2013${fmtN(requirement.max_size_sqft)||'\u221e'} SF`:'no size preference';
    let cities=requirement.cities;if(typeof cities==='string'){try{cities=JSON.parse(cities);}catch{cities=[cities];}}
    const rLoc=Array.isArray(cities)?cities.join(', '):'any location';
    const lLoc=[listing.city,listing.state].filter(Boolean).join(', ')||'unknown location';
    const bStr=breakdown.map(b=>`${b.category}: ${b.score}%`).join(', ');
    const lp=parseFloat(listing.price),ls=parseFloat(listing.size_sqft),isLease=listing.transaction_type==='lease'||listing.transaction_type==='sublease';
    const mc=isLease&&lp&&ls?`$${Math.round((lp*ls)/12).toLocaleString()}/mo`:null;
    const ac=isLease&&lp&&ls?`$${Math.round(lp*ls).toLocaleString()}/yr`:null;
    return `You are a sharp commercial real estate analyst. Write a 4\u20136 sentence deal breakdown.\n\nLISTING: ${PT[listing.property_type]||listing.property_type} for ${TX[listing.transaction_type]||listing.transaction_type} in ${lLoc} \u00b7 Rate: ${lPrice} \u00b7 Size: ${lSize}${mc?` \u00b7 Monthly total: ${mc}`:''}${ac?` \u00b7 Annual total: ${ac}`:''}\nREQUIREMENT: Seeking ${PT[requirement.property_type]||requirement.property_type} in ${rLoc} \u00b7 Budget: ${rPrice} \u00b7 Size: ${rSize}\nMATCH SCORE: ${totalScore}% (${getScoreLabel(totalScore)||'no label'})\nSCORE BREAKDOWN: ${bStr}\n\nRules:\n1. Be concise and analytical. Reference actual numbers.\n2. Wrap listing-specific values like this: {{L:value}}\n3. Wrap requirement-specific values like this: {{R:value}}\n4. Highlight the strongest alignment and any gaps.\n5. End with a clear call to action for why these agents should connect.\n6. Write in second person to the listing agent.\n7. Plain prose only. No markdown, bullets, headers, or em dashes.\n8. Use ONLY the numbers provided above.`;
  },[listing,requirement,matchResult]);
  const run=useCallback(async()=>{setLoad(true);setError(null);try{const r=await base44.functions.invoke('generateAIText',{prompt,maxTokens:800});const t=r.data;setText((t?.text?.trim()||'No breakdown generated.').replace(/\u2014/g,',').replace(/ - /g,', '));}catch(e){setError('Unable to generate breakdown. Please try again.');}finally{setLoad(false);}},[ prompt]);
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
  const [showShare,setShowShare]=useState(false),[viewingAgent,setViewingAgent]=useState(null);

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
      {icon}
      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:active?ACCENT:'rgba(255,255,255,0.5)' }}>{label}</span>
    </button>
  );

  const TABS=[{key:'analysis',label:'Match Analysis'},{key:'specs',label:'Full Specs'},{key:'breakdown',label:'Breakdown'}];

  return(<>
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }} onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'95vw', height:'92vh', maxWidth:'1100px', display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        {/* Header */}
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
          {/* Phase 5 action buttons */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
            {iconBtn(()=>savedHook.toggle(listing.id,requirement.id), isMatchSaved?'Unsave match':'Save match', isMatchSaved?<BookmarkCheck style={{ width:'14px', height:'14px', color:ACCENT }}/>:<Bookmark style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>, isMatchSaved?'Saved':'Save', isMatchSaved)}
            {iconBtn(()=>setShowShare(true),'Share match',<Share2 style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>,'Share',false)}
            {iconBtn(()=>exportMatchPDF(listing,requirement,matchResult,posterProfile),'Export PDF',<Printer style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.5)' }}/>,'PDF',false)}
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex' }}><X style={{ width:'16px', height:'16px', color:'rgba(255,255,255,0.5)' }}/></button>
          </div>
        </div>

        {/* Body */}
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
              <button onClick={()=>setTab('specs')} style={{ width:'100%', marginTop:'16px', padding:'10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', cursor:'pointer' }}>View complete field-by-field specs \u2192</button>
            </div>
          )}
          {tab==='specs'&&(
            <div style={{ padding:'20px 28px' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.3)', margin:'0 0 16px', lineHeight:1.6 }}>Left: <span style={{color:myColor,fontWeight:600}}>{myLabel}</span> \u00b7 Right: <span style={{color:theirColor,fontWeight:600}}>{theirLabel}</span></p>
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
  const anySaved=matches.some(m=>{const l=myIsListing?myPost:m.listing,r2=myIsListing?m.requirement:myPost;return savedHook.isSaved(l.id,r2.id);});

  return(
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px', transition:'all 0.2s', position:'relative' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor=`${myColor}35`;}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
      {anySaved&&<div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', alignItems:'center', gap:'4px', background:`${ACCENT}15`, border:`1px solid ${ACCENT}35`, borderRadius:'6px', padding:'3px 8px' }}><BookmarkCheck style={{ width:'11px', height:'11px', color:ACCENT }}/><span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, color:ACCENT }}>Saved</span></div>}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'14px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}><div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myColor }}/><span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:myColor }}>Your {myIsListing?'Listing':'Requirement'}</span></div>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'15px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{myPost.title}</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0 }}>{priceStr(myPost,myIsListing)}{myIsListing&&myPost.size_sqft?` \u00b7 ${parseFloat(myPost.size_sqft).toLocaleString()} SF`:''}{myPost.city?` \u00b7 ${myPost.city}`:''}</p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'20px',flexShrink:0,marginRight:anySaved?'70px':'0' }}>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:700,color:myColor }}>{matches.length}</span>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{matches.length===1?'match':'matches'}</span>
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
              {label&&<span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:scoreColor,background:`${scoreColor}12`,border:`1px solid ${scoreColor}30`,borderRadius:'4px',padding:'1px 6px' }}>{label}</span>}
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
  const savedHook=useSavedMatches(user?.email);

  const {data:myListings=[]}      =useQuery({queryKey:['my-listings'],              queryFn:()=>base44.entities.Listing.filter({created_by:user?.email})});
  const {data:myRequirements=[]}  =useQuery({queryKey:['my-requirements'],          queryFn:()=>base44.entities.Requirement.filter({created_by:user?.email})});
  const {data:allListings=[]}     =useQuery({queryKey:['all-listings-matches'],     queryFn:()=>base44.entities.Listing.list('-created_date',200)});
  const {data:allRequirements=[]} =useQuery({queryKey:['all-requirements-matches'], queryFn:()=>base44.entities.Requirement.list('-created_date',200)});
  const {data:allProfiles=[]}     =useQuery({queryKey:['all-user-profiles'],        queryFn:()=>base44.entities.UserProfile.list()});

  const profileMap=Object.fromEntries(allProfiles.map(p=>[p.user_email,p]));

  const listingGroups=useMemo(()=>myListings.map(listing=>{
    const matches=allRequirements.filter(r=>r.created_by!==user?.email).map(req=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...listing,postType:'listing'},matches}:null;
  }).filter(Boolean),[myListings,allRequirements,user?.email]);

  const requirementGroups=useMemo(()=>myRequirements.map(req=>{
    const matches=allListings.filter(l=>l.created_by!==user?.email).map(listing=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...req,postType:'requirement'},matches}:null;
  }).filter(Boolean),[myRequirements,allListings,user?.email]);

  const currentGroups=useMemo(()=>{
    const groups=activeTab==='listings'?listingGroups:requirementGroups;
    if(!filterSaved)return groups;
    return groups.filter(g=>g.matches.some(m=>{const il=g.myPost.postType==='listing',l=il?g.myPost:m.listing,r=il?m.requirement:g.myPost;return savedHook.isSaved(l.id,r.id);}));
  },[activeTab,listingGroups,requirementGroups,filterSaved,savedHook.saved]);

  const savedCount=savedHook.saved.length;
  const openModal=(myPost,matchResult,matchIndex)=>{const groups=myPost.postType==='listing'?listingGroups:requirementGroups;const group=groups.find(g=>g.myPost.id===myPost.id);setModalState({myPost,matches:group?.matches||[matchResult],matchIndex});};
  const navigate=(dir)=>{if(!modalState)return;const t=modalState.matches.length;setModalState(s=>({...s,matchIndex:(s.matchIndex+dir+t)%t}));};

  return(
    <div style={{ maxWidth:'860px', margin:'0 auto', padding:'48px 32px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'32px', fontWeight:300, color:'white', margin:'0 0 6px' }}>My Matches</h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:0 }}>Matches scoring 30% or higher. Click any card to open the full analysis.</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'10px' }}>
        <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'4px' }}>
          {[{key:'listings',label:'My Listings',color:ACCENT,Icon:Building2,count:listingGroups.length},{key:'requirements',label:'My Requirements',color:LAVENDER,Icon:Search,count:requirementGroups.length}].map(t=>(
            <button key={t.key} onClick={()=>{setActiveTab(t.key);setFilterSaved(false);}}
              style={{ padding:'10px 20px', background:activeTab===t.key?`${t.color}18`:'transparent', border:activeTab===t.key?`1px solid ${t.color}40`:'none', borderRadius:'7px', color:activeTab===t.key?t.color:'rgba(255,255,255,0.5)', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, display:'flex', alignItems:'center', gap:'8px', transition:'all 0.15s' }}>
              <t.Icon style={{width:'15px',height:'15px'}}/>{t.label}
              <span style={{ padding:'1px 7px', borderRadius:'12px', fontSize:'11px', fontWeight:700, background:activeTab===t.key?`${t.color}22`:'rgba(255,255,255,0.08)', color:activeTab===t.key?t.color:'rgba(255,255,255,0.4)' }}>{t.count}</span>
            </button>
          ))}
        </div>
        {savedCount>0&&(
          <button onClick={()=>setFilterSaved(f=>!f)} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 14px', background:filterSaved?`${ACCENT}15`:'rgba(255,255,255,0.05)', border:`1px solid ${filterSaved?ACCENT:'rgba(255,255,255,0.1)'}`, borderRadius:'8px', cursor:'pointer', fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:filterSaved?ACCENT:'rgba(255,255,255,0.5)', transition:'all 0.15s' }}>
            <BookmarkCheck style={{ width:'14px', height:'14px' }}/>{filterSaved?'Show All':`Saved (${savedCount})`}
          </button>
        )}
      </div>

      {currentGroups.length===0?(
        <div style={{ textAlign:'center', padding:'80px 32px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'16px' }}>
          {filterSaved
            ?<><BookmarkCheck style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/><h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No saved matches</h3><p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>Open any match and click Save to bookmark it here.</p></>
            :<><TrendingUp style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/><h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No matches yet</h3><p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>{activeTab==='listings'?"Your listings haven't matched with any requirements yet":"Your requirements haven't matched with any listings yet"}</p></>
          }
        </div>
      ):(
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {currentGroups.map((g,i)=><MatchGroupCard key={i} myPost={g.myPost} matches={g.matches} onOpen={openModal} savedHook={savedHook}/>)}
        </div>
      )}

      {modalState&&(()=>{
        const {myPost,matches,matchIndex}=modalState;
        const current=matches[matchIndex], myIsListing=myPost.postType==='listing';
        const matchPost=myIsListing?current.requirement:current.listing;
        return <MatchModal myPost={myPost} matchPost={matchPost} matchResult={current} posterProfile={profileMap[matchPost.created_by]} matchIndex={matchIndex} totalMatches={matches.length} onPrev={()=>navigate(-1)} onNext={()=>navigate(1)} onClose={()=>setModalState(null)} savedHook={savedHook}/>;
      })()}
    </div>
  );
}