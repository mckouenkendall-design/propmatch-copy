import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { ChevronRight, Plus } from 'lucide-react';
import { calculateMatchScore, getScoreColor } from '@/utils/matchScore';
import { clientHeadline } from '@/components/matches/MatchGroupCard';

// Home. One job: show what is worth a call today, and get you posting.

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';
const HEAD = "'Plus Jakarta Sans',sans-serif";
const BODY = "'Inter',sans-serif";
const STRONG = 85;

const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const asArray = (r) => (Array.isArray(r) ? r : []);
const place = (p) => [p.address, p.city].filter(Boolean).join(', ') || p.title || 'Untitled';
const nameOf = (p) => (p.postType === 'listing' ? place(p) : clientHeadline(p));

function monthly(listing) {
  const price = parseFloat(listing.price), size = parseFloat(listing.size_sqft);
  if (!Number.isFinite(price)) return null;
  if (listing.price_period === 'per_sf_per_year' && Number.isFinite(size)) return `${money((price * size) / 12)}/mo`;
  if (listing.price_period === 'per_month') return `${money(price)}/mo`;
  return money(price);
}

function Ring({ score, size = 46 }) {
  const c = getScoreColor(score), r = size * 0.4, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(score / 100) * circ} ${circ}`} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: '14px', color: c }}>{score}</span>
    </div>
  );
}

function Panel({ title, action, onAction, children }) {
  return (
    <section style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: 'clamp(16px, 2.4vw, 22px)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h2 style={{ margin: 0, fontFamily: HEAD, fontWeight: 700, fontSize: '16px', color: 'white' }}>{title}</h2>
        {action && <button onClick={onAction} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: BODY, fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>{action}<ChevronRight style={{ width: '14px', height: '14px' }} /></button>}
      </div>
      {children}
    </section>
  );
}

function Row({ onClick, children }) {
  return (
    <button onClick={onClick}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', margin: '0 -10px', borderRadius: '10px', transition: 'background 0.15s' }}>
      {children}
      <ChevronRight style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginLeft: 'auto' }} />
    </button>
  );
}

const line1 = { fontFamily: BODY, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const line2 = { fontFamily: BODY, fontSize: '12.5px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' };

function Empty({ text, cta, onClick }) {
  return (
    <div style={{ padding: '28px 8px', textAlign: 'center' }}>
      <p style={{ fontFamily: BODY, fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: '0 0 14px' }}>{text}</p>
      {cta && <button onClick={onClick} style={{ padding: '9px 16px', borderRadius: '9px', border: `1px solid ${ACCENT}55`, background: `${ACCENT}14`, color: ACCENT, fontFamily: BODY, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>{cta}</button>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email;

  const { data: myListings = [] } = useQuery({ queryKey: ['cc-my-listings', email], queryFn: async () => asArray(await supabase.from('listings').select('*').eq('created_by', email)), enabled: !!email });
  const { data: myRequirements = [] } = useQuery({ queryKey: ['cc-my-reqs', email], queryFn: async () => asArray(await supabase.from('requirements').select('*').eq('created_by', email)), enabled: !!email });
  const { data: allListings = [] } = useQuery({ queryKey: ['cc-all-listings'], queryFn: async () => asArray(await supabase.from('listings').select('*').order('created_at', { ascending: false }).limit(200)) });
  const { data: allRequirements = [] } = useQuery({ queryKey: ['cc-all-reqs'], queryFn: async () => asArray(await supabase.from('requirements').select('*').order('created_at', { ascending: false }).limit(200)) });
  const { data: myProfile } = useQuery({ queryKey: ['cc-profile', email], queryFn: async () => asArray(await supabase.from('profiles').select('*').eq('user_email', email))[0] || null, enabled: !!email });

  const firstName = myProfile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'there';

  const { all, perPost } = useMemo(() => {
    const visible = (p) => p.created_by === email || (p.visibility || 'public') === 'public' || (p.visibility === 'brokerage' && p.brokerage_id && p.brokerage_id === user?.brokerage_id);
    const listings = allListings.filter(visible), reqs = allRequirements.filter(visible);
    const out = [], per = {};
    const push = (myPost, listing, requirement) => {
      const r = calculateMatchScore(listing, requirement);
      if (!r.isMatch) return;
      out.push({ myPost, listing, requirement, ...r });
      const c = (per[myPost.id] ||= { total: 0, strong: 0, best: 0 });
      c.total += 1; if (r.totalScore >= STRONG) c.strong += 1; c.best = Math.max(c.best, r.totalScore);
    };
    myListings.forEach((l) => reqs.forEach((q) => push({ ...l, postType: 'listing' }, l, q)));
    myRequirements.forEach((q) => listings.forEach((l) => push({ ...q, postType: 'requirement' }, l, q)));
    out.sort((a, b) => b.totalScore - a.totalScore);
    return { all: out, perPost: per };
  }, [myListings, myRequirements, allListings, allRequirements, email, user?.brokerage_id]);

  const myPosts = [
    ...myRequirements.map((r) => ({ ...r, postType: 'requirement' })),
    ...myListings.map((l) => ({ ...l, postType: 'listing' })),
  ].sort((a, b) => (perPost[b.id]?.best || 0) - (perPost[a.id]?.best || 0));

  const strong = all.filter((m) => m.totalScore >= STRONG).length;
  const clientsWithStrong = myPosts.filter((p) => perPost[p.id]?.strong).length;
  const subtitle = !myPosts.length
    ? 'Post your first client requirement or listing and matches show up here.'
    : strong
      ? `${strong} strong ${strong === 1 ? 'match' : 'matches'} across ${clientsWithStrong === myPosts.length ? (myPosts.length === 1 ? 'your post' : `all ${myPosts.length} of your posts`) : `${clientsWithStrong} of your ${myPosts.length} posts`}. Here is where to start.`
      : all.length
        ? `${all.length} ${all.length === 1 ? 'match' : 'matches'} so far. None strong yet.`
        : 'No matches yet. They show up the moment another agent posts something that fits.';

  const openMatch = (myPostId) => navigate('/Matches', { state: { openPostId: myPostId } });
  const newPost = () => navigate('/Inventory', { state: { openCreate: true } });

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: 'clamp(24px, 5vw, 44px) clamp(16px, 4vw, 32px) 60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: '0 0 6px', fontFamily: HEAD, fontWeight: 700, fontSize: 'clamp(26px, 3.4vw, 32px)', letterSpacing: '-0.01em', color: 'white' }}>{greeting()}, {firstName}</h1>
          <p style={{ margin: 0, fontFamily: BODY, fontSize: '14.5px', color: 'rgba(255,255,255,0.5)' }}>{subtitle}</p>
        </div>
        <button onClick={newPost} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 18px', borderRadius: '10px', border: 'none', background: ACCENT, color: '#06201d', fontFamily: BODY, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
          <Plus style={{ width: '16px', height: '16px' }} /> New post
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '20px', alignItems: 'start' }}>
        <Panel title="Best matches right now" action={all.length ? 'All matches' : null} onAction={() => navigate('/Matches')}>
          {all.length === 0
            ? <Empty text="Nothing yet. Matches appear here as soon as they exist." cta={myPosts.length ? null : 'Post a client requirement'} onClick={newPost} />
            : all.slice(0, 6).map((m, i) => {
              const theirs = m.myPost.postType === 'listing' ? m.requirement : m.listing;
              const title = m.myPost.postType === 'listing' ? clientHeadline(theirs) : place(theirs);
              const price = m.myPost.postType === 'listing' ? null : monthly(theirs);
              return (
                <Row key={i} onClick={() => openMatch(m.myPost.id)}>
                  <Ring score={m.totalScore} />
                  <div style={{ minWidth: 0 }}>
                    <div style={line1}>{title}</div>
                    <div style={line2}>For {nameOf(m.myPost)}{price ? ` · ${price}` : ''}</div>
                  </div>
                </Row>
              );
            })}
        </Panel>

        <Panel title="Your posts" action={myPosts.length ? 'Manage' : null} onAction={() => navigate('/Inventory')}>
          {myPosts.length === 0
            ? <Empty text="You haven't posted anything yet." cta="Post a client requirement" onClick={newPost} />
            : myPosts.slice(0, 6).map((p) => {
              const c = perPost[p.id] || { total: 0, strong: 0 };
              const color = p.postType === 'listing' ? ACCENT : LAVENDER;
              return (
                <Row key={p.id} onClick={() => (c.total ? openMatch(p.id) : navigate('/Inventory', { state: { openPostId: p.id } }))}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={line1}>{nameOf(p)}</div>
                    <div style={line2}>
                      {c.total ? `${c.total} ${c.total === 1 ? 'match' : 'matches'}` : 'No matches yet'}
                      {c.strong ? <span style={{ color: ACCENT }}>{` · ${c.strong} strong`}</span> : null}
                    </div>
                  </div>
                </Row>
              );
            })}
        </Panel>
      </div>
    </div>
  );
}
