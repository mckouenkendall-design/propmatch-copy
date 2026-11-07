import React, { useMemo, useState } from 'react';
import { Building2, MapPin, Clock, Users } from 'lucide-react';
import { getScoreColor, parseDetails } from '@/utils/matchScore';
import { buildRows } from '@/components/matches/MatchBreakdown';

// One card per post of mine. The header is MY side (my client's requirement, or my
// listing). Below it, the best matches as tiles, best first. Tapping a tile opens the
// full analysis for that exact match.

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';
const HEAD = "'Plus Jakarta Sans',sans-serif";
const BODY = "'Inter',sans-serif";
const MAX_TILES = 3;

const PT = { office: 'Office', medical_office: 'Medical Office', retail: 'Retail', industrial: 'Industrial', single_family: 'Single Family' };
const TIMELINE = { asap: 'ASAP', '1_3_months': '1 to 3 months', '3_6_months': '3 to 6 months', '6_9_months': '6 to 9 months', '9_12_months': '9 to 12 months', '12_plus_months': '12+ months' };

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const sf = (n) => `${Math.round(n).toLocaleString('en-US')} SF`;

export function photosOf(post) {
  const pd = parseDetails(post) || {};
  const toArr = (v) => {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* not JSON */ } }
    return [];
  };
  const arr = toArr(pd.photo_urls);
  if (arr.length) return arr;
  const one = pd.photo_url || post.photo_url;
  return one ? [one] : [];
}

// A listing's asking price, shown the way the client's budget is written.
export function listingPrice(listing, req) {
  const price = num(listing.price), size = num(listing.size_sqft);
  if (price == null) return { main: 'Price on request', sub: null };
  const period = listing.price_period || '';
  const perSfYr = period === 'per_sf_per_year' || period === 'per_sf_yr';
  const perMonth = period === 'per_month';
  if (perSfYr && size) {
    const monthly = (price * size) / 12;
    if (req && req.price_period === 'per_month') return { main: `${money(monthly)}/mo`, sub: `$${price}/SF/yr` };
    return { main: `$${price}/SF/yr`, sub: `${money(monthly)}/mo` };
  }
  if (perMonth) return { main: `${money(price)}/mo`, sub: null };
  if (listing.transaction_type === 'sale' || listing.transaction_type === 'purchase') return { main: money(price), sub: null };
  return { main: `$${price}`, sub: null };
}

function budgetText(req) {
  const max = num(req.max_price);
  if (!max) return null;
  const pd = parseDetails(req) || {};
  if (pd.price_is_tbd) return null;
  if (req.price_period === 'per_month') return `Up to ${money(max)}/mo`;
  if (req.price_period === 'per_sf_per_year') return `Up to $${max}/SF/yr`;
  return `Up to ${money(max)}`;
}

function sizeText(minV, maxV) {
  const a = num(minV), b = num(maxV);
  if (a && b) return `${Math.round(a).toLocaleString('en-US')} to ${sf(b)}`;
  if (b) return `Up to ${sf(b)}`;
  if (a) return `${sf(a)}+`;
  return null;
}

// "Engineering firm, 22 people, growing to about 26..." -> "Engineering firm, 22 people"
export function clientHeadline(req) {
  const notes = String(req.notes || '').trim();
  if (notes) {
    const first = notes.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, '');
    const parts = first.split(',').map((s) => s.trim()).filter(Boolean);
    const short = parts.slice(0, 2).join(', ');
    if (short.length <= 56) return short;
    return short.slice(0, 53).replace(/\s+\S*$/, '') + '...';
  }
  const pt = PT[req.property_type] || 'Space';
  const verb = req.transaction_type === 'lease' ? 'lease' : req.transaction_type === 'purchase' ? 'purchase' : 'search';
  return `${pt} ${verb}`;
}

function citiesText(cities) {
  const list = (Array.isArray(cities) ? cities : String(cities || '').split(',')).map((c) => String(c).replace(/,?\s*[A-Z]{2}$/, '').trim()).filter(Boolean);
  if (!list.length) return null;
  return list.length > 3 ? `${list.slice(0, 3).join(', ')} +${list.length - 3}` : list.join(', ');
}

const FRIENDLY = { 'Fits People': 'Headcount', 'Number of Offices': 'Private offices', 'Other Amenities': 'requested amenities', 'Building Amenities': 'requested amenities', 'Features & Amenities': 'requested features', 'Server Room / IT': 'server room', '24/7 Access': '24/7 access' };
const COUNTED = /offices|rooms|workstations|fits people|parking|spaces|bedrooms|bathrooms|doors|bays/i;

// One short line: the biggest gap, or that it checks every box.
export function quickRead(listing, requirement, m) {
  try {
    const rows = buildRows(listing, requirement, m) || [];
    const gaps = rows.filter((r) => r.status !== 'match' && r.status !== 'bonus' && (r.delta ?? 0) >= 0.5).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
    if (!gaps.length) return { tone: 'good', text: 'Checks every box' };
    const g = gaps[0];
    const raw = String(g.label || '');
    const l = raw.toLowerCase();
    const label = (FRIENDLY[raw] || raw.replace(/^Number of /, '')).toLowerCase();
    if (g.status === 'unknown') return { tone: 'ask', text: `Ask about ${label}` };
    if (l.includes('price') || l.includes('monthly') || l.includes('rent')) return { tone: 'gap', text: 'Over budget' };
    if (l.startsWith('size')) {
      const have = num(listing.size_sqft), max = num(requirement.max_size_sqft);
      return { tone: 'gap', text: have && max && have > max ? 'Bigger than needed' : 'Smaller than needed' };
    }
    if (COUNTED.test(raw)) return { tone: 'gap', text: `Short on ${label}` };
    if (l.includes('amenit') || l.includes('features')) return { tone: 'gap', text: 'Missing a requested amenity' };
    if (l === 'built out as') return { tone: 'gap', text: 'Different build-out' };
    if (l === 'lease term') return { tone: 'gap', text: 'Lease term differs' };
    return { tone: 'gap', text: `No ${label}` };
  } catch {
    return null;
  }
}

export function ScorePill({ score, big }) {
  const c = getScoreColor(score);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px', padding: big ? '6px 12px' : '4px 9px', borderRadius: '999px', background: 'rgba(10,14,18,0.82)', backdropFilter: 'blur(6px)', border: `1.5px solid ${c}`, boxShadow: `0 0 12px ${c}40` }}>
      <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: big ? '20px' : '15px', color: c, lineHeight: 1 }}>{score}</span>
      <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)' }}>MATCH</span>
    </div>
  );
}

function Chip({ Icon, children }) {
  if (!children) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: BODY, fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
      {Icon && <Icon style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.45)' }} />}
      {children}
    </span>
  );
}

// No photo: a calm placeholder that still tells you what the building is.
function NoPhoto({ listing }) {
  const pd = parseDetails(listing) || {};
  const cls = pd.building_class ? `Class ${pd.building_class}` : null;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'radial-gradient(120% 90% at 30% 20%, #1c2a33 0%, #10171c 60%, #0c1115 100%)' }}>
      <Building2 style={{ width: '30px', height: '30px', color: 'rgba(255,255,255,0.22)' }} />
      <span style={{ fontFamily: BODY, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
        {[cls, listing.city].filter(Boolean).join(' · ') || 'No photos yet'}
      </span>
    </div>
  );
}

const TONE = { good: ACCENT, gap: '#f5b453', ask: 'rgba(255,255,255,0.55)' };

function ListingTile({ m, req, onClick }) {
  const [hov, setHov] = useState(false);
  const listing = m.listing;
  const photo = photosOf(listing)[0];
  const price = listingPrice(listing, req);
  const size = num(listing.size_sqft);
  const pd = parseDetails(listing) || {};
  const read = useMemo(() => quickRead(listing, req, m), [listing, req, m]);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: `1px solid ${hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`, transform: hov ? 'translateY(-2px)' : 'none', boxShadow: hov ? '0 10px 28px rgba(0,0,0,0.35)' : 'none', transition: 'all 0.18s', minWidth: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', background: '#0E1318' }}>
        {photo ? <img src={photo} alt={listing.address || listing.title} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.04)' : 'none', transition: 'transform 0.4s' }} /> : <NoPhoto listing={listing} />}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}><ScorePill score={m.totalScore} /></div>
      </div>
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: HEAD, fontWeight: 700, fontSize: '17px', color: 'white' }}>{price.main}</span>
          {price.sub && <span style={{ fontFamily: BODY, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{price.sub}</span>}
        </div>
        <div style={{ fontFamily: BODY, fontSize: '13px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {[size ? sf(size) : null, pd.building_class ? `Class ${pd.building_class}` : null, pd.suite_number || null].filter(Boolean).join(' · ')}
        </div>
        <div style={{ fontFamily: BODY, fontSize: '12px', color: 'rgba(255,255,255,0.42)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {[listing.address, listing.city].filter(Boolean).join(', ')}
        </div>
        {read && (
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: BODY, fontSize: '12px', fontWeight: 600, color: TONE[read.tone] }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TONE[read.tone], flexShrink: 0 }} />
            {read.text}
          </div>
        )}
      </div>
    </button>
  );
}

function RequirementTile({ m, listing, poster, onClick }) {
  const [hov, setHov] = useState(false);
  const req = m.requirement;
  const pd = parseDetails(req) || {};
  const read = useMemo(() => quickRead(listing, req, m), [listing, req, m]);
  const who = poster?.full_name || req.contact_agent_name || 'An agent';
  const firm = poster?.brokerage_name || req.company_name || '';
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', borderRadius: '12px', background: 'rgba(129,140,248,0.05)', border: `1px solid ${hov ? 'rgba(129,140,248,0.45)' : 'rgba(129,140,248,0.16)'}`, transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.18s', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <ScorePill score={m.totalScore} />
        {pd.timeline && TIMELINE[pd.timeline] && <span style={{ fontFamily: BODY, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Moving {TIMELINE[pd.timeline].toLowerCase()}</span>}
      </div>
      <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: '16px', color: 'white', lineHeight: 1.3 }}>{clientHeadline(req)}</div>
      <div style={{ fontFamily: BODY, fontSize: '12.5px', color: 'rgba(255,255,255,0.65)' }}>
        {[sizeText(req.min_size_sqft, req.max_size_sqft), budgetText(req)].filter(Boolean).join(' · ')}
      </div>
      <div style={{ fontFamily: BODY, fontSize: '12px', color: 'rgba(255,255,255,0.42)' }}>{who}{firm ? `, ${firm}` : ''}</div>
      {read && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: BODY, fontSize: '12px', fontWeight: 600, color: TONE[read.tone] }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: TONE[read.tone], flexShrink: 0 }} />
          {read.text}
        </div>
      )}
    </button>
  );
}

function MoreTile({ count, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ all: 'unset', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '12px', border: `1px dashed ${color}55`, background: `${color}08`, minHeight: '120px', padding: '16px' }}>
      <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: '26px', color }}>+{count}</span>
      <span style={{ fontFamily: BODY, fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>more {count === 1 ? 'match' : 'matches'}</span>
    </button>
  );
}

export default function MatchGroupCard({ myPost, matches, onOpen, profileMap = {} }) {
  const myIsListing = myPost.postType === 'listing';
  const color = myIsListing ? ACCENT : LAVENDER;
  const strong = matches.filter((m) => m.totalScore >= 85).length;
  const shown = matches.slice(0, MAX_TILES);
  const rest = matches.length - shown.length;
  const pd = parseDetails(myPost) || {};

  const headline = myIsListing
    ? [myPost.address, myPost.city].filter(Boolean).join(', ') || myPost.title
    : clientHeadline(myPost);

  const chips = myIsListing
    ? [
        num(myPost.size_sqft) ? { Icon: Building2, t: sf(num(myPost.size_sqft)) } : null,
        { t: listingPrice(myPost, null).main },
        pd.building_class ? { t: `Class ${pd.building_class}` } : null,
      ]
    : [
        { Icon: MapPin, t: citiesText(myPost.cities) },
        { Icon: Building2, t: sizeText(myPost.min_size_sqft, myPost.max_size_sqft) },
        { t: budgetText(myPost) },
        pd.headcount && !/\bpeople\b/i.test(headline) ? { Icon: Users, t: `${pd.headcount} people` } : null,
        pd.timeline && TIMELINE[pd.timeline] ? { Icon: Clock, t: TIMELINE[pd.timeline] } : null,
      ];

  return (
    <section style={{ borderRadius: '18px', background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(16px, 2.4vw, 22px)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* My side */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: BODY, fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.12em', color, padding: '3px 8px', borderRadius: '6px', background: `${color}14`, border: `1px solid ${color}33` }}>
            {myIsListing ? 'YOUR LISTING' : 'YOUR CLIENT'}
          </span>
          <span style={{ fontFamily: BODY, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
            <b style={{ fontFamily: HEAD, fontWeight: 800, fontSize: '15px', color: 'white' }}>{matches.length}</b>{' '}
            {myIsListing ? (matches.length === 1 ? 'client looking' : 'clients looking') : (matches.length === 1 ? 'space fits' : 'spaces fit')}
            {strong > 0 && <span style={{ color: ACCENT, fontWeight: 600 }}>{` \u00b7 ${strong} strong`}</span>}
          </span>
        </div>
        <h3 style={{ margin: 0, fontFamily: HEAD, fontWeight: 700, fontSize: 'clamp(18px, 2.2vw, 22px)', color: 'white', lineHeight: 1.25 }}>{headline}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {chips.filter((c) => c && c.t).map((c, i) => <Chip key={i} Icon={c.Icon}>{c.t}</Chip>)}
        </div>
      </header>

      {/* Their side: best matches first */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(230px, 100%), 1fr))', gap: '12px' }}>
        {shown.map((m, i) => myIsListing
          ? <RequirementTile key={m.requirement.id || i} m={m} listing={myPost} poster={profileMap[m.requirement.created_by]} onClick={() => onOpen(myPost, m, i)} />
          : <ListingTile key={m.listing.id || i} m={m} req={myPost} onClick={() => onOpen(myPost, m, i)} />)}
        {rest > 0 && <MoreTile count={rest} color={color} onClick={() => onOpen(myPost, matches[MAX_TILES], MAX_TILES)} />}
      </div>

    </section>
  );
}
