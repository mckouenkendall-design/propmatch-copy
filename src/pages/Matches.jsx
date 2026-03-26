import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Building2, Search, TrendingUp, X, Mail, Phone, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';

const ACCENT = '#00DBC5';

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score, size = 80 }) {
  const color   = getScoreColor(score);
  const r       = (size / 2) - 6;
  const circ    = 2 * Math.PI * r;
  const dash    = (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.28, fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: size * 0.12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', marginTop: 1 }}>MATCH</span>
      </div>
    </div>
  );
}

// ── Range Bar — shows where listing value falls within requirement range ───────
function RangeBar({ value, min, max, unit, label, score }) {
  if (value == null || (min == null && max == null)) return null;
  const color = getScoreColor(score);

  // Build display range with 20% padding around the data
  const lo  = min ?? value * 0.5;
  const hi  = max ?? value * 1.5;
  const pad = (hi - lo) * 0.25;
  const barMin = Math.max(0, lo - pad);
  const barMax = hi + pad;
  const barRange = barMax - barMin;
  if (barRange === 0) return null;

  const valuePct = Math.max(2, Math.min(98, ((value - barMin) / barRange) * 100));
  const minPct   = Math.max(0, Math.min(100, ((lo - barMin)    / barRange) * 100));
  const maxPct   = Math.max(0, Math.min(100, ((hi - barMin)    / barRange) * 100));

  const fmt = (v) => {
    if (unit === '$' || unit === '$/mo' || unit === '$/SF/yr') {
      return v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v.toLocaleString()}`;
    }
    return v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v.toLocaleString()}`;
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color }}>{fmt(value)} {unit !== '$' ? unit : ''}</span>
      </div>
      <div style={{ position: 'relative', height: '36px' }}>
        {/* Track */}
        <div style={{ position: 'absolute', top: '14px', left: 0, right: 0, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
          {/* Requirement range zone */}
          <div style={{
            position: 'absolute',
            left: `${minPct}%`, width: `${maxPct - minPct}%`, height: '100%',
            background: 'rgba(0,219,197,0.18)', borderRadius: '4px',
            border: '1px solid rgba(0,219,197,0.3)',
          }} />
          {/* Value marker */}
          <div style={{
            position: 'absolute',
            left: `${valuePct}%`, top: '-5px',
            transform: 'translateX(-50%)',
            width: '18px', height: '18px', borderRadius: '50%',
            background: color, border: '2.5px solid #0E1318',
            boxShadow: `0 0 8px ${color}60`,
          }} />
        </div>
        {/* Range labels */}
        {min != null && (
          <div style={{ position: 'absolute', top: '28px', left: `${minPct}%`, transform: 'translateX(-50%)', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
            {fmt(lo)}
          </div>
        )}
        {max != null && (
          <div style={{ position: 'absolute', top: '28px', left: `${maxPct}%`, transform: 'translateX(-50%)', fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
            {fmt(hi)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Breakdown bar ──────────────────────────────────────────────────────────────
function BreakdownBar({ item, expanded, onToggle }) {
  const color = getScoreColor(item.score);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', cursor: item.subScores ? 'pointer' : 'default' }}
        onClick={item.subScores ? onToggle : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{item.icon}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item.category}</span>
          {item.details && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>· {item.details}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color, minWidth: '36px', textAlign: 'right' }}>{item.score}%</span>
          {item.subScores && (
            expanded ? <ChevronUp style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                     : <ChevronDown style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
          )}
        </div>
      </div>
      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${item.score}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
      {/* Sub-scores */}
      {item.subScores && expanded && (
        <div style={{ marginTop: '10px', paddingLeft: '16px', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
          {item.subScores.map((sub, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                {sub.icon} {sub.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>· {sub.details}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${sub.score}%`, height: '100%', background: getScoreColor(sub.score), borderRadius: '2px' }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: getScoreColor(sub.score), minWidth: '28px', textAlign: 'right' }}>{sub.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Match Detail Modal ─────────────────────────────────────────────────────────
function MatchDetailModal({ match, posterProfile, onClose }) {
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);

  const { listing, requirement, totalScore, breakdown, rangeData, matchLabel } = match;
  const color = getScoreColor(totalScore);

  const posterName    = listing.contact_agent_name  || posterProfile?.full_name  || listing.created_by || 'Agent';
  const posterEmail   = listing.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone   = listing.contact_agent_phone || posterProfile?.phone;
  const posterCompany = listing.company_name        || posterProfile?.brokerage_name;
  const posterPhoto   = posterProfile?.profile_photo_url;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '900px', overflow: 'hidden', marginBottom: '20px' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ScoreCircle score={totalScore} size={72} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                {matchLabel && (
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: '6px', padding: '2px 10px' }}>
                    {matchLabel}
                  </span>
                )}
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 500, color: 'white', margin: 0 }}>{listing.title}</h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
                Matches your requirement: <span style={{ color: ACCENT }}>{requirement.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
            <X style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>

          {/* Left — Listing details + range bars */}
          <div style={{ padding: '28px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>
              Listing Details
            </h3>

            {/* Key facts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {[
                { label: 'Price', value: listing.price ? `$${parseFloat(listing.price).toLocaleString()}` : '—' },
                { label: 'Size', value: listing.size_sqft ? `${parseFloat(listing.size_sqft).toLocaleString()} SF` : '—' },
                { label: 'Location', value: [listing.city, listing.state].filter(Boolean).join(', ') || '—' },
                { label: 'Property Type', value: (listing.property_type || '—').replace(/_/g, ' ') },
                { label: 'Transaction', value: listing.transaction_type || '—' },
                { label: 'Status', value: listing.status || 'Active' },
              ].map(f => (
                <div key={f.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', margin: '0 0 2px' }}>{f.label}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'white', margin: 0, textTransform: 'capitalize' }}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Range visualizations */}
            {(rangeData.price || rangeData.size) && (
              <>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 16px' }}>
                  How It Fits Your Requirements
                </h3>
                {rangeData.price && (
                  <RangeBar value={rangeData.price.value} min={rangeData.price.min} max={rangeData.price.max}
                    unit={rangeData.price.unit} label={rangeData.price.label} score={rangeData.price.score} />
                )}
                {rangeData.size && (
                  <div style={{ marginTop: rangeData.price ? '20px' : 0 }}>
                    <RangeBar value={rangeData.size.value} min={rangeData.size.min} max={rangeData.size.max}
                      unit="SF" label="Size (SF)" score={rangeData.size.score} />
                  </div>
                )}
              </>
            )}

            {/* Notes */}
            {listing.notes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' }}>Notes</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{listing.notes}</p>
              </div>
            )}
          </div>

          {/* Right — Score breakdown + contact */}
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 20px' }}>
              Score Breakdown
            </h3>

            <div style={{ marginBottom: '28px' }}>
              {breakdown.map((item, i) => (
                <BreakdownBar key={i} item={item}
                  expanded={expandedBreakdown === i}
                  onToggle={() => setExpandedBreakdown(expandedBreakdown === i ? null : i)} />
              ))}
            </div>

            {/* Contact card */}
            <div style={{ background: 'rgba(0,219,197,0.04)', border: `1px solid ${ACCENT}25`, borderRadius: '14px', padding: '18px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>Contact Agent</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: ACCENT, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '18px', fontWeight: 700 }}>
                  {posterPhoto
                    ? <img src={posterPhoto} alt={posterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : posterName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>{posterName}</p>
                  {posterCompany && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{posterCompany}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {posterEmail && (
                  <a href={`mailto:${posterEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, textDecoration: 'none', padding: '8px 12px', background: 'rgba(0,219,197,0.08)', borderRadius: '8px', border: '1px solid rgba(0,219,197,0.15)' }}>
                    <Mail style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {posterEmail}
                  </a>
                )}
                {posterPhone && (
                  <a href={`tel:${posterPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: ACCENT, textDecoration: 'none', padding: '8px 12px', background: 'rgba(0,219,197,0.08)', borderRadius: '8px', border: '1px solid rgba(0,219,197,0.15)' }}>
                    <Phone style={{ width: '14px', height: '14px', flexShrink: 0 }} /> {posterPhone}
                  </a>
                )}
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: ACCENT, border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                  <MessageCircle style={{ width: '14px', height: '14px' }} /> Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match Card ─────────────────────────────────────────────────────────────────
function MatchCard({ match, onClick }) {
  const { listing, requirement, totalScore, matchLabel, breakdown } = match;
  const color = getScoreColor(totalScore);
  const labelColors = { 'Strong Match': '#00DBC5', 'Good Match': '#F59E0B', 'Partial Match': '#9CA3AF' };

  return (
    <div onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${totalScore >= 70 ? `${ACCENT}40` : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <ScoreCircle score={totalScore} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {matchLabel && (
            <span style={{ display: 'inline-block', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: labelColors[matchLabel] || '#9CA3AF', background: `${labelColors[matchLabel] || '#9CA3AF'}12`, border: `1px solid ${labelColors[matchLabel] || '#9CA3AF'}35`, borderRadius: '5px', padding: '2px 8px', marginBottom: '6px' }}>
              {matchLabel}
            </span>
          )}
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 500, color: 'white', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.title}
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
            Matches: <span style={{ color: 'rgba(255,255,255,0.65)' }}>{requirement.title}</span>
          </p>

          {/* Mini breakdown pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {breakdown.slice(0, 4).map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '20px',
                background: `${getScoreColor(b.score)}10`,
                border: `1px solid ${getScoreColor(b.score)}30`,
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getScoreColor(b.score), flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{b.category}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: getScoreColor(b.score) }}>{b.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState('listings');
  const [selectedMatch, setSelectedMatch] = useState(null);

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

  // My listings matched with other people's requirements
  const listingMatches = useMemo(() => {
    return myListings.flatMap(listing =>
      allRequirements
        .filter(r => r.created_by !== user?.email)
        .map(req => {
          const result = calculateMatchScore(listing, req);
          return result.isMatch ? { listing, requirement: req, ...result } : null;
        })
        .filter(Boolean)
    ).sort((a, b) => b.totalScore - a.totalScore);
  }, [myListings, allRequirements, user?.email]);

  // My requirements matched with other people's listings
  const requirementMatches = useMemo(() => {
    return myRequirements.flatMap(req =>
      allListings
        .filter(l => l.created_by !== user?.email)
        .map(listing => {
          const result = calculateMatchScore(listing, req);
          return result.isMatch ? { listing, requirement: req, ...result } : null;
        })
        .filter(Boolean)
    ).sort((a, b) => b.totalScore - a.totalScore);
  }, [myRequirements, allListings, user?.email]);

  const currentMatches = activeTab === 'listings' ? listingMatches : requirementMatches;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 6px' }}>
          My Matches
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Only showing matches scored 30% or higher. Click any card for full details.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
        {[
          { key: 'listings',     label: 'My Listings',     icon: Building2, count: listingMatches.length },
          { key: 'requirements', label: 'My Requirements', icon: Search,    count: requirementMatches.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 20px', background: activeTab === t.key ? `${ACCENT}20` : 'transparent', border: activeTab === t.key ? `1px solid ${ACCENT}40` : 'none', borderRadius: '7px', color: activeTab === t.key ? ACCENT : 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
            <t.icon style={{ width: '15px', height: '15px' }} />
            {t.label}
            <span style={{ padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: activeTab === t.key ? `${ACCENT}25` : 'rgba(255,255,255,0.08)', color: activeTab === t.key ? ACCENT : 'rgba(255,255,255,0.4)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {currentMatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <TrendingUp style={{ width: '56px', height: '56px', color: `${ACCENT}30`, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '22px', fontWeight: 400, color: 'white', margin: '0 0 8px' }}>No matches yet</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {activeTab === 'listings'
              ? "Post more listings or check back as new requirements are added"
              : "Post more requirements or check back as new listings are added"}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentMatches.map((match, i) => (
            <MatchCard key={i} match={match} onClick={() => setSelectedMatch(match)} />
          ))}
        </div>
      )}

      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          posterProfile={profileMap[selectedMatch.listing.created_by]}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}