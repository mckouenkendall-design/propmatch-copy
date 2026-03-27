import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, X, Mail, Phone,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MessageCircle, MapPin, Ruler, DollarSign
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';

const ACCENT   = '#00DBC5';   // tiffany — listings
const LAVENDER = '#818cf8';   // lavender — requirements

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtNum(n, decimals = 2) {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function priceUnit(post, isListing) {
  if (isListing) {
    const tx = post.transaction_type;
    return tx === 'lease' || tx === 'sublease' ? '/SF/yr' : tx === 'rent' ? '/mo' : '';
  }
  const p = post.price_period;
  const tx = post.transaction_type;
  return p === 'per_month' ? '/mo' : p === 'per_sf_per_year' ? '/SF/yr' : p === 'annually' ? '/yr'
    : (tx === 'lease' || tx === 'rent') ? '/mo' : '';
}

function fmtPrice(post, isListing) {
  const u = priceUnit(post, isListing);
  if (isListing) {
    const f = fmtNum(post.price);
    return f ? `$${f}${u}` : null;
  }
  const lo = fmtNum(post.min_price), hi = fmtNum(post.max_price);
  if (lo && hi) return `$${lo}–$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score, size = 72 }) {
  const color = getScoreColor(score);
  const r     = (size / 2) - 5;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.3, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: size * 0.13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em', marginTop: 1 }}>MATCH</span>
      </div>
    </div>
  );
}

// ── Range Bar ─────────────────────────────────────────────────────────────────
function RangeBar({ value, min, max, unit, label, score }) {
  if (value == null || (min == null && max == null)) return null;
  const color = getScoreColor(score);
  const lo = min ?? value * 0.6;
  const hi = max ?? value * 1.4;
  const pad = (hi - lo) * 0.3;
  const barMin = Math.max(0, lo - pad);
  const barMax = hi + pad;
  const range  = barMax - barMin;
  if (range === 0) return null;
  const valuePct = Math.max(3, Math.min(97, ((value - barMin) / range) * 100));
  const minPct   = Math.max(0, Math.min(100, ((lo - barMin) / range) * 100));
  const maxPct   = Math.max(0, Math.min(100, ((hi - barMin) / range) * 100));
  const fmt = (v) => {
    if (unit?.startsWith('$')) {
      return v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v/1000)}K` : `$${Math.round(v)}`;
    }
    return v >= 1000 ? `${Math.round(v/1000)}K` : `${Math.round(v)}`;
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color }}>{fmt(value)}{unit?.startsWith('$') ? '' : ` ${unit || ''}`}</span>
      </div>
      <div style={{ position: 'relative', height: '40px' }}>
        <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
          {/* Requirement range zone */}
          <div style={{ position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`, height: '100%', background: `${color}25`, borderRadius: '4px', border: `1px solid ${color}40` }} />
          {/* Listing value dot */}
          <div style={{ position: 'absolute', left: `${valuePct}%`, top: '-5px', transform: 'translateX(-50%)', width: '18px', height: '18px', borderRadius: '50%', background: color, border: '2.5px solid #0E1318', boxShadow: `0 0 8px ${color}60` }} />
        </div>
        {min != null && <div style={{ position: 'absolute', top: '30px', left: `${minPct}%`, transform: 'translateX(-50%)', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{fmt(lo)}</div>}
        {max != null && <div style={{ position: 'absolute', top: '30px', left: `${maxPct}%`, transform: 'translateX(-50%)', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{fmt(hi)}</div>}
      </div>
    </div>
  );
}

// ── Breakdown Bar ─────────────────────────────────────────────────────────────
function BreakdownBar({ item, expanded, onToggle }) {
  const color = getScoreColor(item.score);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', cursor: item.subScores ? 'pointer' : 'default' }}
        onClick={item.subScores ? onToggle : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>{item.icon}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{item.category}</span>
          {item.details && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>· {item.details}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, color }}>{item.score}%</span>
          {item.subScores && (expanded
            ? <ChevronUp style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }} />
            : <ChevronDown style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }} />)}
        </div>
      </div>
      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${item.score}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
      {item.subScores && expanded && (
        <div style={{ marginTop: '8px', paddingLeft: '14px', borderLeft: '2px solid rgba(255,255,255,0.07)' }}>
          {item.subScores.map((sub, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {sub.icon} {sub.label} <span style={{ color: 'rgba(255,255,255,0.25)' }}>· {sub.details}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '40px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${sub.score}%`, height: '100%', background: getScoreColor(sub.score) }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, color: getScoreColor(sub.score), minWidth: '26px', textAlign: 'right' }}>{sub.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Post Block — YOUR POST or THEIR MATCH ─────────────────────────────────────
function PostBlock({ post, isListing, label, accentColor }) {
  const details = parseDetails(post);
  const price   = fmtPrice(post, isListing);

  const chips = [
    isListing ? [post.city, post.state].filter(Boolean).join(', ') : post.cities?.join(', '),
    isListing ? post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : null
              : (post.min_size_sqft || post.max_size_sqft) ? `${fmtNum(post.min_size_sqft)||'0'}–${fmtNum(post.max_size_sqft)||'∞'} SF` : null,
    (post.transaction_type || '').replace(/_/g, ' '),
    post.lease_type ? post.lease_type.replace(/_/g, ' ') : null,
  ].filter(Boolean);

  return (
    <div style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: '12px', padding: '16px' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>{label}</span>
      </div>
      {/* Title */}
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 8px', lineHeight: 1.3 }}>{post.title}</h3>
      {/* Price */}
      {price && <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 700, color: accentColor, marginBottom: '10px' }}>{price}</div>}
      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {chips.map((c, i) => (
          <span key={i} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '5px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>{c}</span>
        ))}
      </div>
      {/* Description snippet */}
      {(post.description || post.notes) && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '10px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.description || post.notes}
        </p>
      )}
    </div>
  );
}

// ── Full Match Modal ──────────────────────────────────────────────────────────
function MatchModal({ myPost, matchPost, matchResult, posterProfile, matchIndex, totalMatches, onPrev, onNext, onClose }) {
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);

  const myIsListing  = !!myPost.size_sqft || myPost.postType === 'listing';
  const theirIsListing = !myIsListing; // they are the opposite type

  const myColor    = myIsListing ? ACCENT : LAVENDER;
  const theirColor = myIsListing ? LAVENDER : ACCENT;

  const { totalScore, breakdown, rangeData, matchLabel } = matchResult;
  const scoreColor = getScoreColor(totalScore);

  const posterName    = matchPost.contact_agent_name  || posterProfile?.full_name  || matchPost.created_by || 'Agent';
  const posterEmail   = matchPost.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone   = matchPost.contact_agent_phone || posterProfile?.phone;
  const posterCompany = matchPost.company_name        || posterProfile?.brokerage_name;
  const posterPhoto   = posterProfile?.profile_photo_url;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '600px', marginBottom: '20px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ── */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ScoreCircle score={totalScore} size={52} />
            <div>
              {matchLabel && (
                <span style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: scoreColor, background: `${scoreColor}15`, border: `1px solid ${scoreColor}35`, borderRadius: '5px', padding: '2px 8px', marginBottom: '3px' }}>
                  {matchLabel}
                </span>
              )}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Match {matchIndex + 1} of {totalMatches}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {totalMatches > 1 && (
              <>
                <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronLeft style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
                </button>
                <button onClick={onNext} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.5)' }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── YOUR POST ── */}
          <PostBlock post={myPost} isListing={myIsListing} label="Your Post" accentColor={myColor} />

          {/* ── Score bridge ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.25)' }}>Match Score</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{totalScore}%</span>
              {matchLabel && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: scoreColor }}>{matchLabel}</span>}
            </div>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* ── THEIR MATCH ── */}
          <PostBlock post={matchPost} isListing={theirIsListing} label="Their Match" accentColor={theirColor} />

          {/* ── Range bars ── */}
          {(rangeData.price || rangeData.size) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 16px 4px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>
                How Your Listing Fits Their Range
              </p>
              {rangeData.price && (
                <RangeBar value={rangeData.price.value} min={rangeData.price.min} max={rangeData.price.max}
                  unit={rangeData.price.unit} label={rangeData.price.label} score={rangeData.price.score} />
              )}
              {rangeData.size && (
                <RangeBar value={rangeData.size.value} min={rangeData.size.min} max={rangeData.size.max}
                  unit="SF" label="Size" score={rangeData.size.score} />
              )}
            </div>
          )}

          {/* ── Score Breakdown ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 14px' }}>
              Score Breakdown
            </p>
            {breakdown.map((item, i) => (
              <BreakdownBar key={i} item={item}
                expanded={expandedBreakdown === i}
                onToggle={() => setExpandedBreakdown(expandedBreakdown === i ? null : i)} />
            ))}
          </div>

          {/* ── Contact ── */}
          <div style={{ background: `${theirColor}06`, border: `1px solid ${theirColor}20`, borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>
              {theirIsListing ? 'Listing Agent' : 'Representing Agent'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: theirColor, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '16px', fontWeight: 700 }}>
                {posterPhoto
                  ? <img src={posterPhoto} alt={posterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : posterName[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{posterName}</p>
                {posterCompany && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{posterCompany}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {posterEmail && (
                <a href={`mailto:${posterEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theirColor, textDecoration: 'none', padding: '8px 12px', background: `${theirColor}08`, borderRadius: '8px', border: `1px solid ${theirColor}15` }}>
                  <Mail style={{ width: '13px', height: '13px', flexShrink: 0 }} /> {posterEmail}
                </a>
              )}
              {posterPhone && (
                <a href={`tel:${posterPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theirColor, textDecoration: 'none', padding: '8px 12px', background: `${theirColor}08`, borderRadius: '8px', border: `1px solid ${theirColor}15` }}>
                  <Phone style={{ width: '13px', height: '13px', flexShrink: 0 }} /> {posterPhone}
                </a>
              )}
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', background: theirColor, border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                <MessageCircle style={{ width: '13px', height: '13px' }} /> Send Message
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Match Card — one card per YOUR post, shows all matches ────────────────────
function MatchGroupCard({ myPost, matches, profiles, onOpenModal }) {
  const [previewIndex, setPreviewIndex] = useState(0);
  const myIsListing = !!myPost.size_sqft || myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const myLabel     = myIsListing ? 'Your Listing' : 'Your Requirement';

  const best = matches[previewIndex];
  const scoreColor = getScoreColor(best.totalScore);
  const matchLabel = getScoreLabel(best.totalScore);
  const matchPost  = myIsListing ? best.requirement : best.listing;

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '14px', padding: '20px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${myColor}40`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>

      {/* ── YOUR POST header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: myColor, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: myColor }}>{myLabel}</span>
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myPost.title}
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {fmtPrice(myPost, myIsListing)}
            {myIsListing && myPost.size_sqft ? ` · ${parseFloat(myPost.size_sqft).toLocaleString()} SF` : ''}
          </p>
        </div>
        {/* Match count badge */}
        <div style={{ flexShrink: 0, marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${myColor}12`, border: `1px solid ${myColor}30`, borderRadius: '20px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, color: myColor }}>{matches.length}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{matches.length === 1 ? 'match' : 'matches'}</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 14px' }} />

      {/* ── THEIR MATCH preview ── */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: myIsListing ? LAVENDER : ACCENT, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)' }}>Their Match</span>
          </div>
          {/* Arrow navigation */}
          {matches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={e => { e.stopPropagation(); setPreviewIndex(i => (i - 1 + matches.length) % matches.length); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer', display: 'flex' }}>
                <ChevronLeft style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.5)' }} />
              </button>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', minWidth: '30px', textAlign: 'center' }}>{previewIndex + 1}/{matches.length}</span>
              <button onClick={e => { e.stopPropagation(); setPreviewIndex(i => (i + 1) % matches.length); }}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer', display: 'flex' }}>
                <ChevronRight style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {matchPost.title}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {fmtPrice(matchPost, !myIsListing)}
              {!myIsListing && matchPost.size_sqft ? ` · ${parseFloat(matchPost.size_sqft).toLocaleString()} SF` : ''}
            </p>
          </div>
          {/* Mini score pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {matchLabel && (
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, color: scoreColor, background: `${scoreColor}12`, border: `1px solid ${scoreColor}30`, borderRadius: '4px', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                {matchLabel}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', background: `${scoreColor}12`, border: `1px solid ${scoreColor}30`, borderRadius: '20px' }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <circle cx="5" cy="5" r="4" fill="none" stroke={`${scoreColor}30`} strokeWidth="1.5" />
                <circle cx="5" cy="5" r="4" fill="none" stroke={scoreColor} strokeWidth="1.5"
                  strokeDasharray={`${(best.totalScore / 100) * 25.1} 25.1`} strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '5px 5px' }} />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: scoreColor }}>{best.totalScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── View full details button ── */}
      <button
        onClick={() => onOpenModal(myPost, best, previewIndex)}
        style={{ width: '100%', padding: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = `${myColor}12`; e.currentTarget.style.borderColor = `${myColor}35`; e.currentTarget.style.color = myColor; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
      >
        View Full Match Details
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState('listings');
  const [modalState, setModalState]   = useState(null); // { myPost, matches, matchIndex }

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }),
  });
  const { data: myRequirements = [] } = useQuery({
    queryKey: ['my-requirements'],
    queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }),
  });
  const { data: allListings = [] } = useQuery({
    queryKey: ['all-listings-matches'],
    queryFn: () => base44.entities.Listing.list('-created_date', 200),
  });
  const { data: allRequirements = [] } = useQuery({
    queryKey: ['all-requirements-matches'],
    queryFn: () => base44.entities.Requirement.list('-created_date', 200),
  });
  const { data: allProfiles = [] } = useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.user_email, p]));

  // MY LISTINGS matched against OTHER PEOPLE'S requirements
  const listingGroups = useMemo(() => {
    return myListings.map(listing => {
      const matches = allRequirements
        .filter(r => r.created_by !== user?.email)
        .map(req => {
          const result = calculateMatchScore(listing, req);
          return result.isMatch ? { listing, requirement: req, ...result } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.totalScore - a.totalScore);
      return matches.length ? { myPost: { ...listing, postType: 'listing' }, matches } : null;
    }).filter(Boolean);
  }, [myListings, allRequirements, user?.email]);

  // MY REQUIREMENTS matched against OTHER PEOPLE'S listings
  const requirementGroups = useMemo(() => {
    return myRequirements.map(req => {
      const matches = allListings
        .filter(l => l.created_by !== user?.email)
        .map(listing => {
          const result = calculateMatchScore(listing, req);
          return result.isMatch ? { listing, requirement: req, ...result } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.totalScore - a.totalScore);
      return matches.length ? { myPost: { ...req, postType: 'requirement' }, matches } : null;
    }).filter(Boolean);
  }, [myRequirements, allListings, user?.email]);

  const currentGroups = activeTab === 'listings' ? listingGroups : requirementGroups;

  const openModal = (myPost, matchResult, matchIndex) => {
    const myIsListing = myPost.postType === 'listing';
    const group = (myIsListing ? listingGroups : requirementGroups).find(g => g.myPost.id === myPost.id);
    setModalState({ myPost, matches: group?.matches || [matchResult], matchIndex });
  };

  const closeModal = () => setModalState(null);

  const navigateModal = (dir) => {
    if (!modalState) return;
    const total = modalState.matches.length;
    const next  = (modalState.matchIndex + dir + total) % total;
    setModalState({ ...modalState, matchIndex: next });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 6px' }}>
          My Matches
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Only matches scoring 30% or higher are shown. Click any card to dive into the details.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
        {[
          { key: 'listings',     label: 'My Listings',     color: ACCENT,   Icon: Building2, count: listingGroups.length },
          { key: 'requirements', label: 'My Requirements', color: LAVENDER, Icon: Search,    count: requirementGroups.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 20px', background: activeTab === t.key ? `${t.color}18` : 'transparent', border: activeTab === t.key ? `1px solid ${t.color}40` : 'none', borderRadius: '7px', color: activeTab === t.key ? t.color : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
            <t.Icon style={{ width: '15px', height: '15px' }} />
            {t.label}
            <span style={{ padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: activeTab === t.key ? `${t.color}22` : 'rgba(255,255,255,0.08)', color: activeTab === t.key ? t.color : 'rgba(255,255,255,0.4)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {currentGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <TrendingUp style={{ width: '48px', height: '48px', color: `${ACCENT}30`, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 400, color: 'white', margin: '0 0 8px' }}>No matches yet</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {activeTab === 'listings' ? 'Your listings haven\'t matched with any requirements yet' : 'Your requirements haven\'t matched with any listings yet'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentGroups.map((group, i) => (
            <MatchGroupCard
              key={i}
              myPost={group.myPost}
              matches={group.matches}
              profiles={profileMap}
              onOpenModal={openModal}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalState && (() => {
        const { myPost, matches, matchIndex } = modalState;
        const current = matches[matchIndex];
        const myIsListing = myPost.postType === 'listing';
        const matchPost   = myIsListing ? current.requirement : current.listing;
        return (
          <MatchModal
            myPost={myPost}
            matchPost={matchPost}
            matchResult={current}
            posterProfile={profileMap[matchPost.created_by]}
            matchIndex={matchIndex}
            totalMatches={matches.length}
            onPrev={() => navigateModal(-1)}
            onNext={() => navigateModal(1)}
            onClose={closeModal}
          />
        );
      })()}
    </div>
  );
}