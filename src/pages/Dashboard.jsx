import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, MessageCircle, Bell,
  Bookmark, BookmarkCheck, Plus, ChevronRight, FileText,
  Zap, ArrowUpRight, X, Users, BarChart2, Clock
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel } from '@/utils/matchScore';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';
const AMBER    = '#F59E0B';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getSavedKeys(email) {
  try { return JSON.parse(localStorage.getItem(`propmatch_saved_${email}`) || '[]'); }
  catch { return []; }
}

const PT = {
  office: 'General Office', medical_office: 'Medical Office', retail: 'Retail',
  industrial_flex: 'Industrial / Flex', land: 'Land', special_use: 'Special Use',
  single_family: 'Single Family', condo: 'Condo', apartment: 'Apartment',
  multi_family: 'Multi-Family', multi_family_5: 'Multi-Family (5+)',
  townhouse: 'Townhouse', manufactured: 'Manufactured', land_residential: 'Residential Land',
};
const TX = { lease: 'Lease', sublease: 'Sublease', sale: 'Sale', rent: 'Rent', purchase: 'Purchase' };

function fmtPrice(post, isListing) {
  const fmtN = (n) => { const v = parseFloat(n); if (!n || isNaN(v)) return null; return v % 1 === 0 ? v.toLocaleString() : v.toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  if (isListing) {
    const f = fmtN(post.price); if (!f) return null;
    const u = post.transaction_type === 'lease' || post.transaction_type === 'sublease' ? '/SF/yr' : post.transaction_type === 'rent' ? '/mo' : '';
    return `$${f}${u}`;
  }
  const u = post.price_period === 'per_month' ? '/mo' : post.price_period === 'per_sf_per_year' ? '/SF/yr' : post.price_period === 'annually' ? '/yr' : (post.transaction_type === 'lease' || post.transaction_type === 'rent') ? '/mo' : '';
  const lo = fmtN(post.min_price), hi = fmtN(post.max_price);
  if (lo && hi) return `$${lo}–$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

// ─── Mini Score Circle ────────────────────────────────────────────────────────
function MiniScore({ score, size = 44 }) {
  const color = getScoreColor(score);
  const r = size * 0.38, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size * 0.088}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.088}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${size*0.07}px ${color}90)` }}/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: size * 0.27 + 'px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color, Icon, badge }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}20`, borderRadius: '14px', padding: '18px 20px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: '16px', height: '16px', color }} />
        </div>
        {badge && (
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: 600, color: AMBER, background: `${AMBER}15`, border: `1px solid ${AMBER}30`, borderRadius: '20px', padding: '2px 8px' }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '28px', fontWeight: 700, color, lineHeight: 1, marginBottom: '5px' }}>{value}</div>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, onAction, actionLabel, color = ACCENT }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}/>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)' }}>
          {title}
        </span>
      </div>
      {onAction && (
        <button onClick={onAction}
          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Inter',sans-serif", fontSize: '12px', color, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0', opacity: 0.85 }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}>
          {actionLabel} <ChevronRight style={{ width: '12px', height: '12px' }}/>
        </button>
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ myPost, match, onNavigate }) {
  const [hov, setHov] = useState(false);
  const isListing = myPost.postType === 'listing';
  const myColor = isListing ? ACCENT : LAVENDER;
  const matchPost = isListing ? match.requirement : match.listing;
  const label = getScoreLabel(match.totalScore);
  const sc = getScoreColor(match.totalScore);

  return (
    <div onClick={onNavigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 13px', background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hov ? myColor + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: '11px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <MiniScore score={match.totalScore} size={44}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: 700, color: myColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your {isListing ? 'Listing' : 'Req'}
          </span>
          {label && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: 700, color: sc, background: `${sc}15`, border: `1px solid ${sc}28`, borderRadius: '20px', padding: '1px 7px' }}>
              {label}
            </span>
          )}
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {myPost.title}
        </p>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ↔ {matchPost.title}
        </p>
      </div>
      <ArrowUpRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.18)', flexShrink: 0 }}/>
    </div>
  );
}

// ─── Post Analytics Card ──────────────────────────────────────────────────────
function PostCard({ post, matchCount, maxCount, onNavigate }) {
  const [hov, setHov] = useState(false);
  const isListing = post.postType === 'listing';
  const color = isListing ? ACCENT : LAVENDER;
  const barPct = maxCount > 0 ? (matchCount / maxCount) * 100 : 0;
  const price = fmtPrice(post, isListing);
  const scoreColor = matchCount === 0 ? 'rgba(255,255,255,0.2)' : matchCount >= 3 ? ACCENT : AMBER;

  return (
    <div onClick={onNavigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding: '13px 15px', background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hov ? color + '22' : 'rgba(255,255,255,0.06)'}`, borderRadius: '11px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '9px' }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }}/>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>
              {isListing ? 'Listing' : 'Requirement'}
            </span>
          </div>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.title}
          </p>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.32)', margin: '2px 0 0' }}>
            {PT[post.property_type] || post.property_type}
            {post.city ? ` · ${post.city}` : ''}
            {price ? ` · ${price}` : ''}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '22px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{matchCount}</div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{matchCount === 1 ? 'match' : 'matches'}</div>
        </div>
      </div>
      {/* Match bar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${barPct}%`, background: `linear-gradient(90deg, ${color}90, ${color})`, borderRadius: '2px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)', boxShadow: barPct > 0 ? `0 0 6px ${color}60` : 'none' }}/>
      </div>
    </div>
  );
}

// ─── Saved Match Row ──────────────────────────────────────────────────────────
function SavedMatchRow({ listing, requirement, onNavigate }) {
  const result = useMemo(() => calculateMatchScore(listing, requirement), [listing.id, requirement.id]);
  const [hov, setHov] = useState(false);
  const sc = getScoreColor(result.totalScore);
  const label = getScoreLabel(result.totalScore);

  return (
    <div onClick={onNavigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hov ? sc + '30' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <MiniScore score={result.totalScore} size={38}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.title}
          </p>
          {label && <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '9px', fontWeight: 700, color: sc, background: `${sc}15`, borderRadius: '20px', padding: '1px 6px', flexShrink: 0 }}>{label}</span>}
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.32)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {requirement.title}
        </p>
      </div>
      <BookmarkCheck style={{ width: '13px', height: '13px', color: AMBER, flexShrink: 0 }}/>
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────
function ActivityRow({ Icon, iconColor, title, sub, time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${iconColor}15`, border: `1px solid ${iconColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <Icon style={{ width: '13px', height: '13px', color: iconColor }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.4 }}>{title}</p>
        {sub && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.32)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.22)', flexShrink: 0, marginTop: '2px' }}>{time}</span>
    </div>
  );
}

// ─── Quick Post Modal ─────────────────────────────────────────────────────────
function QuickPostModal({ onClose, navigate }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', width: '100%', maxWidth: '400px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '18px', fontWeight: 600, color: 'white', margin: '0 0 3px' }}>Create a Post</h3>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>What are you posting today?</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '10px 24px 24px' }}>
          <button onClick={() => { navigate('/create-listing'); onClose(); }}
            style={{ padding: '22px 16px', background: `${ACCENT}0e`, border: `1px solid ${ACCENT}28`, borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}1e`; e.currentTarget.style.borderColor = `${ACCENT}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}0e`; e.currentTarget.style.borderColor = `${ACCENT}28`; }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Building2 style={{ width: '18px', height: '18px', color: ACCENT }}/>
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 600, color: ACCENT, marginBottom: '4px' }}>Listing</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>A property you're representing</div>
          </button>
          <button onClick={() => { navigate('/create-requirement'); onClose(); }}
            style={{ padding: '22px 16px', background: `${LAVENDER}0e`, border: `1px solid ${LAVENDER}28`, borderRadius: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${LAVENDER}1e`; e.currentTarget.style.borderColor = `${LAVENDER}55`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${LAVENDER}0e`; e.currentTarget.style.borderColor = `${LAVENDER}28`; }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${LAVENDER}18`, border: `1px solid ${LAVENDER}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Search style={{ width: '18px', height: '18px', color: LAVENDER }}/>
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 600, color: LAVENDER, marginBottom: '4px' }}>Requirement</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>What your client is looking for</div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ Icon, text, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
      <Icon style={{ width: '32px', height: '32px', color: 'rgba(255,255,255,0.1)', margin: '0 auto 10px', display: 'block' }}/>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 (cta?12:0)px' }}>{text}</p>
      {cta && onCta && (
        <button onClick={onCta} style={{ marginTop: '12px', padding: '7px 16px', background: `${ACCENT}15`, border: `1px solid ${ACCENT}35`, borderRadius: '8px', fontFamily: "'Inter',sans-serif", fontSize: '12px', color: ACCENT, cursor: 'pointer' }}>
          {cta}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQuickPost, setShowQuickPost] = useState(false);

  // Data fetches
  const { data: myListings = []      } = useQuery({ queryKey: ['cc-my-listings'],      queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }) });
  const { data: myRequirements = []  } = useQuery({ queryKey: ['cc-my-reqs'],          queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }) });
  const { data: allListings = []     } = useQuery({ queryKey: ['cc-all-listings'],     queryFn: () => base44.entities.Listing.list('-created_date', 80) });
  const { data: allRequirements = [] } = useQuery({ queryKey: ['cc-all-reqs'],         queryFn: () => base44.entities.Requirement.list('-created_date', 80) });
  const { data: myProfile            } = useQuery({ queryKey: ['cc-profile'],          queryFn: () => base44.entities.UserProfile.filter({ user_email: user?.email }).then(r => r[0]) });
  const { data: notifications = []   } = useQuery({ queryKey: ['cc-notifications'],    queryFn: () => base44.entities.Notification.filter({ recipient_email: user?.email }) });
  const { data: myTemplates = []     } = useQuery({ queryKey: ['cc-templates'],        queryFn: () => base44.entities.Template.filter({ created_by: user?.email }) });

  const firstName = myProfile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const savedKeys = getSavedKeys(user?.email);

  // ── Compute all matches ────────────────────────────────────────────────────
  const { topMatches, postMatchCounts, totalMatchCount, thisWeekCount } = useMemo(() => {
    const otherListings = allListings.filter(l => l.created_by !== user?.email);
    const otherReqs     = allRequirements.filter(r => r.created_by !== user?.email);
    const all = [];
    const counts = {};
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let weekCount = 0;

    myListings.forEach(listing => {
      let c = 0;
      otherReqs.forEach(req => {
        const r = calculateMatchScore(listing, req);
        if (r.isMatch) {
          all.push({ myPost: { ...listing, postType: 'listing' }, ...r });
          c++;
          const reqTs = new Date(req.created_date).getTime();
          if (reqTs > weekAgo) weekCount++;
        }
      });
      counts[listing.id] = c;
    });

    myRequirements.forEach(req => {
      let c = 0;
      otherListings.forEach(listing => {
        const r = calculateMatchScore(listing, req);
        if (r.isMatch) {
          all.push({ myPost: { ...req, postType: 'requirement' }, ...r });
          c++;
        }
      });
      counts[req.id] = c;
    });

    all.sort((a, b) => b.totalScore - a.totalScore);
    return { topMatches: all.slice(0, 6), postMatchCounts: counts, totalMatchCount: all.length, thisWeekCount: weekCount };
  }, [myListings, myRequirements, allListings, allRequirements, user?.email]);

  // ── Posts for analytics panel ──────────────────────────────────────────────
  const postsForAnalytics = useMemo(() => {
    return [
      ...myListings.map(l  => ({ ...l,  postType: 'listing',      matchCount: postMatchCounts[l.id]  || 0 })),
      ...myRequirements.map(r => ({ ...r, postType: 'requirement', matchCount: postMatchCounts[r.id] || 0 })),
    ].sort((a, b) => b.matchCount - a.matchCount).slice(0, 7);
  }, [myListings, myRequirements, postMatchCounts]);
  const maxMatchCount = Math.max(...postsForAnalytics.map(p => p.matchCount), 1);

  // ── Saved matches resolved ─────────────────────────────────────────────────
  const savedMatches = useMemo(() => {
    const allL = [...myListings, ...allListings];
    const allR = [...myRequirements, ...allRequirements];
    return savedKeys.map(key => {
      const [lid, rid] = key.split('|');
      const listing     = allL.find(l => l.id === lid);
      const requirement = allR.find(r => r.id === rid);
      return listing && requirement ? { listing, requirement } : null;
    }).filter(Boolean).slice(0, 5);
  }, [savedKeys.join(','), myListings, myRequirements, allListings, allRequirements]);

  // ── Activity feed ──────────────────────────────────────────────────────────
  const activityFeed = useMemo(() => {
    const items = [];
    const recent = [...notifications].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);
    recent.forEach(n => {
      items.push({ id: n.id, Icon: Bell, color: ACCENT, title: n.message || n.title || 'New notification', sub: null, time: timeAgo(n.created_date), ts: new Date(n.created_date).getTime() });
    });
    // Augment with top match events when notifications are sparse
    if (items.length < 4) {
      topMatches.slice(0, 4 - items.length).forEach((m, i) => {
        const sc = getScoreColor(m.totalScore);
        items.push({
          id: `m-${i}`,
          Icon: TrendingUp,
          color: sc,
          title: `${m.totalScore}% match — ${m.myPost.title}`,
          sub: `vs. ${(m.listing || m.requirement)?.title || ''}`,
          time: timeAgo(m.myPost.created_date),
          ts: new Date(m.myPost.created_date).getTime() || 0,
        });
      });
    }
    return items.sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 7);
  }, [notifications, topMatches]);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '44px 32px 60px' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '30px', fontWeight: 300, color: 'white', margin: '0 0 5px', lineHeight: 1.2 }}>
            {greeting()}, <span style={{ fontWeight: 700, color: ACCENT }}>{firstName}</span>
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            Here's your PropMatch overview for today.
          </p>
        </div>
        <button
          onClick={() => setShowQuickPost(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', background: ACCENT, border: 'none', borderRadius: '10px', fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '14px', fontWeight: 600, color: '#111827', cursor: 'pointer', boxShadow: `0 4px 20px ${ACCENT}45`, transition: 'all 0.15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 28px ${ACCENT}65`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${ACCENT}45`; }}>
          <Plus style={{ width: '16px', height: '16px' }}/> New Post
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px' }}>
        <StatCard value={myListings.length}     label="Active Listings"     color={ACCENT}   Icon={Building2}  />
        <StatCard value={myRequirements.length} label="Requirements"        color={LAVENDER} Icon={Search}     />
        <StatCard value={totalMatchCount}       label="Total Matches"       color={AMBER}    Icon={TrendingUp}
          badge={thisWeekCount > 0 ? `+${thisWeekCount} this week` : undefined}/>
        <StatCard value={unreadNotifs || 0}     label="Unread Notifications" color="rgba(255,255,255,0.45)" Icon={Bell}/>
      </div>

      {/* ── Main 2-col grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '18px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Top Matches */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px' }}>
            <SectionHeader title="Top Matches" onAction={() => navigate('/matches')} actionLabel="View All" color={ACCENT}/>
            {topMatches.length === 0 ? (
              <EmptyState Icon={TrendingUp} text="No matches yet — post a listing or requirement to get started." cta="Create a post" onCta={() => setShowQuickPost(true)}/>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {topMatches.map((m, i) => (
                  <MatchCard key={i} myPost={m.myPost} match={m} onNavigate={() => navigate('/matches')}/>
                ))}
              </div>
            )}
          </div>

          {/* My Active Posts — Analytics */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px' }}>
            <SectionHeader title="My Active Posts" onAction={() => navigate('/my-posts')} actionLabel="Manage" color={LAVENDER}/>
            {postsForAnalytics.length === 0 ? (
              <EmptyState Icon={FileText} text="You haven't posted anything yet." cta="Create your first post" onCta={() => setShowQuickPost(true)}/>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    {postsForAnalytics.length} post{postsForAnalytics.length !== 1 ? 's' : ''} — sorted by match count
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ACCENT }}/><span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Listing</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: LAVENDER }}/><span style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Requirement</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {postsForAnalytics.map((post, i) => (
                    <PostCard key={post.id || i} post={post} matchCount={post.matchCount} maxCount={maxMatchCount} onNavigate={() => navigate('/matches')}/>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Activity Feed */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px' }}>
            <SectionHeader title="Recent Activity" onAction={() => navigate('/inbox')} actionLabel="Inbox" color={ACCENT}/>
            {activityFeed.length === 0 ? (
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '24px 0 8px' }}>No recent activity</p>
            ) : (
              <div>
                {activityFeed.map((item, i) => (
                  <ActivityRow key={item.id || i} Icon={item.Icon} iconColor={item.color} title={item.title} sub={item.sub} time={item.time}/>
                ))}
              </div>
            )}
          </div>

          {/* Saved Matches */}
          {savedMatches.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px' }}>
              <SectionHeader title="Saved Matches" onAction={() => navigate('/matches')} actionLabel="View All" color={AMBER}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {savedMatches.map((m, i) => (
                  <SavedMatchRow key={i} listing={m.listing} requirement={m.requirement} onNavigate={() => navigate('/matches')}/>
                ))}
              </div>
            </div>
          )}

          {/* My Templates */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px' }}>
            <SectionHeader title="My Templates" onAction={() => navigate('/my-templates')} actionLabel="View All" color="rgba(255,255,255,0.4)"/>
            {myTemplates.length === 0 ? (
              <div style={{ padding: '8px 0 4px' }}>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.28)', margin: '0 0 5px' }}>No templates saved yet.</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.18)', margin: 0, lineHeight: 1.5 }}>
                  Save a listing or requirement as a template to reuse it fast.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {myTemplates.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.4)' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.72)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.name || t.title || 'Untitled Template'}
                      </p>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.28)', margin: '1px 0 0' }}>
                        {PT[t.property_type] || t.property_type || 'Template'} · {t.folder || 'General'}
                      </p>
                    </div>
                  </div>
                ))}
                {myTemplates.length > 5 && (
                  <button onClick={() => navigate('/my-templates')} style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'left' }}>
                    +{myTemplates.length - 5} more templates →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick stats / shortcuts */}
          <div style={{ background: `linear-gradient(135deg, ${ACCENT}0c, ${LAVENDER}0c)`, border: `1px solid ${ACCENT}18`, borderRadius: '16px', padding: '20px 22px' }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)', margin: '0 0 14px' }}>QUICK ACTIONS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'View My Matches', icon: TrendingUp,    color: ACCENT,   path: '/matches'     },
                { label: 'Open Inbox',      icon: MessageCircle, color: LAVENDER, path: '/inbox'       },
                { label: 'Fish Tanks',      icon: Users,         color: AMBER,    path: '/groups'      },
                { label: 'My Posts',        icon: BarChart2,     color: ACCENT,   path: '/my-posts'    },
              ].map(({ label, icon: Icon, color, path }) => (
                <button key={path} onClick={() => navigate(path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = `${color}35`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '13px', height: '13px', color }}/>
                  </div>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
                  <ChevronRight style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showQuickPost && <QuickPostModal onClose={() => setShowQuickPost(false)} navigate={navigate}/>}
    </div>
  );
}