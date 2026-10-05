import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { getScoreColor, getScoreLabel, parseDetails, clientOverrideFor } from '@/utils/matchScore';

// ─────────────────────────────────────────────────────────────────────────────
// MatchBreakdown
// The Match Summary: score ring, a one-line read, the ranked breakdown
// (what they need / what the listing has / result / how much it matters),
// and "close the gap" chips that show what the score would be if a gap closed.
//
// Everything here is derived from matchResult.breakdown, which is the exact list
// of rows the scorer used. Nothing is re-scored, so this view cannot disagree
// with the number.
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT = '#00DBC5';
const AMBER  = '#F5B544';
const CORAL  = '#FF8A7A';
const MUTED  = 'rgba(255,255,255,0.62)';
const SANS   = "'Inter',sans-serif";
const DISPLAY = "'Plus Jakarta Sans',sans-serif";

const fmtMoney = (v) =>
  v >= 1000000 ? `$${(v / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`
  : v >= 10000 ? `$${Math.round(v / 1000)}K`
  : v < 100 ? `$${v.toFixed(2)}`
  : `$${Math.round(v).toLocaleString()}`;
const fmtNum = (n) => (n >= 1000 ? Math.round(n).toLocaleString() : (Math.round(n * 100) / 100).toLocaleString());
const num = (v) => (v == null || v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v));

function rangeStr(min, max, f) {
  if (min != null && max != null) return `${f(min)} to ${f(max)}`;
  if (min != null) return `${f(min)} or more`;
  if (max != null) return `Up to ${f(max)}`;
  return 'Open';
}

// The scorer writes each row's detail as one sentence ("18 vs 20 requested").
// Split it into the listing side and the requirement side so they can sit in
// separate columns.
function splitDetails(d) {
  if (!d) return { have: null, need: 'Requested' };
  const s = String(d).trim();
  let m;
  if (/not specified|not confirmed|none \/ not/i.test(s)) return { have: null, need: 'Required', unknown: true };
  if ((m = s.match(/^Listing:\s*(.+?)\s*\|\s*Requested:\s*(.+)$/i))) return { have: m[1], need: m[2] };
  if ((m = s.match(/^(?:fits\s+|max\s+)?(.+?)\s+vs\s+(?:expected\s+)?(.+?)(?:\s+(?:requested|needed|preferred))?$/i))) {
    const have = m[1].trim();
    if (have === '—' || have === '-' || /^—/.test(have)) return { have: null, need: m[2], unknown: true };
    return { have, need: m[2] };
  }
  if ((m = s.match(/^(.+?)\s*\((?:acceptable|requested):\s*(.+)\)$/i))) return { have: m[1], need: m[2] };
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+)\s+(?:matched|conditions met)$/i))) return { have: `${m[1]} of ${m[2]}`, need: `All ${m[2]}` };
  if (/^(yes|at site|specified|permitted|conditioned|compatible)$/i.test(s)) return { have: s, need: 'Required' };
  return { have: s, need: 'Requested' };
}

function parseCities(c) {
  if (typeof c === 'string') { try { c = JSON.parse(c); } catch { c = c.split(',').map((x) => x.trim()); } }
  if (!Array.isArray(c) || !c.length) return null;
  return c.length > 3 ? `${c.slice(0, 3).join(', ')} +${c.length - 3} more` : c.join(', ');
}

// Some rows only carry the listing side in their detail text. For those, read
// what was asked for straight off the requirement.
const NEED_LOOKUP = {
  'cap rate': ['min_cap_rate', (v) => `${v}% or more`],
  'noi': ['min_noi', (v) => `${fmtMoney(parseFloat(v))} or more`],
  'occupancy': ['min_occupancy', (v) => `${v}% or more`],
  'walt': ['min_walt', (v) => `${v} yrs or more`],
  'net rentable area': ['min_nra_sf', (v) => `${fmtNum(parseFloat(v))} SF or more`],
  'gross leasable area': ['min_gla_sf', (v) => `${fmtNum(parseFloat(v))} SF or more`],
  'avg lease remaining': ['min_avg_lease_remaining', (v) => `${v} yrs or more`],
  'rent escalations': ['min_rent_escalations', (v) => `${v}% or more`],
  'price / sf': ['max_price_per_sf', (v) => `Up to $${v}/SF`],
  'built out as': ['built_out_as_pref', (v) => String(v)],
};
const DISPLAY_LABEL = { 'Fits People': 'Headcount', 'Number of Offices': 'Private Offices' };
const tidy = (v) => (v == null ? v : String(v).replace(/^1 (\w+?)s$/, '1 $1'));

const shortLabel = (label) => {
  const l = label.toLowerCase();
  if (l.includes('price') || l.includes('monthly') || l.includes('rent')) return 'price';
  if (l.startsWith('size')) return 'size';
  if (l === 'fits people') return 'headcount';
  if (l === 'number of offices') return 'private offices';
  return l.replace(/\s*\(.*?\)\s*/g, '').trim();
};

// Build display rows from the scorer's breakdown.
export function buildRows(listing, requirement, matchResult) {
  const { breakdown = [], rangeData = {}, totalScore = 0 } = matchResult || {};
  const rd = parseDetails(requirement) || {};
  const clientWeights = rd && typeof rd.client_weights === 'object' ? rd.client_weights : null;

  const totalW = breakdown.reduce((s, b) => s + (b.weight || 0), 0);
  const sum = breakdown.reduce((s, b) => s + ((b.score || 0) / 100) * (b.weight || 0), 0);
  const rawAvg = totalW > 0 ? (sum / totalW) * 100 : 0;
  // The scorer can scale the final number (investor vs owner-user conflict).
  // Recover that factor so "what if" math lands on the same scale.
  const penalty = rawAvg > 0 ? Math.min(1, totalScore / rawAvg) : 1;
  const maxW = Math.max(1, ...breakdown.map((b) => b.weight || 0));

  let seenPrice = false;
  const rows = breakdown.map((item, i) => {
    const label0 = item.category || '';
    const lc = label0.toLowerCase();
    const w = item.weight || 0;
    const score = Math.round(item.score || 0);
    let label = label0, have = null, need = null, unknown = false, verdict = null;

    if (lc === 'location') {
      have = [listing.city, listing.state].filter(Boolean).join(', ') || 'Matches';
      need = parseCities(requirement.cities) || have;
    } else if (rangeData.price && label0 === rangeData.price.label && !seenPrice) {
      seenPrice = true;
      const p = rangeData.price, v = num(p.value), lo = num(p.min), hi = num(p.max);
      label = p.label || label0;
      const per = p.unit === '$/mo' ? '/mo' : '';
      have = v != null ? `${fmtMoney(v)}${per}` : null;
      need = `${rangeStr(lo, hi, fmtMoney)}${per}`;
      if (v != null && hi != null && v > hi) verdict = `${fmtMoney(v - hi)} over`;
      else if (v != null && lo != null && v < lo) verdict = `${fmtMoney(lo - v)} under`;
      else if (score >= 95) verdict = 'In range';
    } else if (rangeData.size && (lc.startsWith('size') || lc === 'acreage')) {
      const s = rangeData.size, v = num(s.value), lo = num(s.min), hi = num(s.max);
      const unit = s.unit || 'SF';
      label = lc === 'acreage' ? 'Acreage' : 'Size';
      have = v != null ? `${fmtNum(v)} ${unit}` : null;
      need = lo != null || hi != null ? `${rangeStr(lo, hi, fmtNum)} ${unit}` : 'Open';
      if (v != null && hi != null && v > hi) verdict = `${fmtNum(v - hi)} ${unit} over`;
      else if (v != null && lo != null && v < lo) verdict = `${fmtNum(lo - v)} ${unit} short`;
      else if (score >= 95) verdict = 'In range';
    } else {
      const sp = splitDetails(item.details);
      have = tidy(sp.have); need = sp.need; unknown = !!sp.unknown;
      const look = NEED_LOOKUP[lc];
      if (look && /^(requested|required)$/i.test(need || '') && rd[look[0]] != null && rd[look[0]] !== '') need = look[1](rd[look[0]]);
      label = DISPLAY_LABEL[label0] || label0;
    }

    let status = score >= 95 ? 'match' : score >= 50 ? 'partial' : 'miss';
    if (w === 0 && score < 95) status = 'bonus';
    else if (unknown && score < 95) status = 'unknown';
    if (!verdict) verdict = { match: 'Match', partial: 'Close', miss: 'Miss', unknown: 'Not on listing', bonus: 'No bonus' }[status];

    const delta = totalW > 0 ? ((100 - score) / 100) * w / totalW * 100 * penalty : 0;
    return {
      key: `${label0}-${i}`, label, have, need, score, status, verdict,
      weight: w, share: totalW > 0 ? w / totalW : 0, bar: w / maxW, delta,
      override: clientOverrideFor(label0, clientWeights),
      isLocation: lc === 'location', subScores: item.subScores || null,
    };
  });

  rows.sort((a, b) => (a.isLocation !== b.isLocation ? (a.isLocation ? -1 : 1) : b.weight - a.weight));
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

// One or two plain sentences, the way a broker would say it out loud.
// Built only from the rows above, so it can never contradict the score.
export function buildRead(rows, totalScore) {
  const strengths = rows.filter((r) => r.status === 'match' && r.weight > 0).slice(0, 3).map((r) => shortLabel(r.label));
  const gaps = rows.filter((r) => r.status !== 'match' && r.delta >= 0.5).sort((a, b) => b.delta - a.delta);
  const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const parts = [];
  if (strengths.length) parts.push(`Strong on ${list(strengths)}.`);
  if (!gaps.length) {
    parts.push('Nothing that was asked for comes up short.');
  } else {
    const g = gaps[0], name = shortLabel(g.label);
    if (g.status === 'unknown') parts.push(`The open question is ${name}: the listing doesn't say.`);
    else if (g.have && g.need && !/^(required|requested)$/i.test(g.need)) parts.push(`The open question is ${name}: ${g.have} against ${g.need.toLowerCase()}.`);
    else parts.push(`The open question is ${name}.`);
    if (gaps.length > 1) parts.push(`${gaps.length - 1} smaller gap${gaps.length - 1 > 1 ? 's' : ''} below.`);
  }
  parts.push(totalScore >= 85 ? 'Worth a call.' : totalScore >= 65 ? 'Worth a conversation if the gaps can flex.' : 'A stretch, but not out of reach.');
  return parts.join(' ');
}

function whyText(r, total, viewerIsListing) {
  const who = viewerIsListing ? 'Their client' : 'Your client';
  const bits = [];
  if (r.weight > 0) bits.push(`This is ${Math.max(1, Math.round(r.share * 100))}% of the score, ranked ${r.rank} of ${total}.`);
  if (r.override === 'dealbreaker') bits.push(`${who} marked it a must-have. Anything short would have removed this match entirely.`);
  else if (r.override === 'high') bits.push(`${who} marked it high priority, so it counts for more than usual.`);
  else if (r.override === 'low') bits.push(`${who} marked it low priority, so it counts for less than usual.`);
  if (r.status === 'match') bits.push('Fully met.');
  else if (r.status === 'unknown') bits.push("The listing doesn't specify this, so it scored as a miss. Ask the agent before ruling it out.");
  else if (r.status === 'bonus') bits.push('This only adds points when present. Missing it costs nothing.');
  else bits.push(`Scored ${r.score} out of 100.${r.delta >= 0.5 ? ` Closing it would add about ${Math.max(1, Math.round(r.delta))} point${Math.round(r.delta) > 1 ? 's' : ''}.` : ''}`);
  return bits.join(' ');
}

// ── Status mark: shape and color both change, so it never relies on color alone
function Mark({ status, size = 18 }) {
  const c = { match: ACCENT, partial: AMBER, miss: CORAL, unknown: MUTED, bonus: MUTED }[status];
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="8" />
      {status === 'match' && <path d="M5.5 9.3l2.3 2.3 4.7-5" />}
      {status === 'partial' && <path d="M5.5 9h7" />}
      {status === 'miss' && <path d="M6 6l6 6M12 6l-6 6" />}
      {(status === 'unknown' || status === 'bonus') && <path d="M7 7.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1M9 12.6v.1" />}
    </svg>
  );
}
const statusColor = (s) => ({ match: ACCENT, partial: AMBER, miss: CORAL, unknown: MUTED, bonus: MUTED }[s]);

// ── Score ring. Counts up on open, then glides to a new number when a
// "what if" is toggled. The ghost arc shows the points a closed gap would add.
function ScoreRing({ actual, shown, runKey }) {
  const sz = 132, r = 54, circ = 2 * Math.PI * r;
  const [val, setVal] = useState(0);
  const valRef = useRef(0);
  const first = useRef(true);
  useEffect(() => { first.current = true; valRef.current = 0; setVal(0); }, [runKey]);
  useEffect(() => {
    const from = valRef.current, to = shown, dur = first.current ? 1800 : 550;
    first.current = false;
    let raf, t0;
    const tick = (now) => {
      if (t0 === undefined) t0 = now;
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e;
      valRef.current = v; setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [shown, runKey]);

  const whatIf = shown > actual;
  const color = getScoreColor(Math.round(val));
  const solid = (Math.min(val, actual) / 100) * circ;
  const ghost = (Math.max(0, val - actual) / 100) * circ;
  const label = whatIf ? 'If closed' : getScoreLabel(actual);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
      <div style={{ position: 'relative', width: sz, height: sz, filter: `drop-shadow(0 0 14px ${color}55)` }}>
        <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          {ghost > 0 && <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="10"
            strokeDasharray={`${ghost} ${circ}`} strokeDashoffset={-solid} />}
          <circle cx={sz / 2} cy={sz / 2} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${solid} ${circ}`} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: DISPLAY, fontSize: '40px', fontWeight: 300, color: 'white', lineHeight: 1 }}>{Math.round(val)}<span style={{ fontSize: '18px', color: MUTED }}>%</span></span>
          <span style={{ fontFamily: SANS, fontSize: '10px', color: MUTED, letterSpacing: '0.12em', marginTop: '4px' }}>MATCH</span>
        </div>
      </div>
      <span style={{ fontFamily: SANS, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, background: `${color}15`, border: `1px ${whatIf ? 'dashed' : 'solid'} ${color}55`, borderRadius: '30px', padding: '4px 14px', minHeight: '15px' }}>
        {label || ' '}
      </span>
    </div>
  );
}

function Row({ r, total, open, onToggle, index, viewerIsListing, needCap, haveCap }) {
  const c = statusColor(r.status);
  return (
    <div className="pmb-in" style={{ animationDelay: `${500 + index * 70}ms`, borderBottom: '1px solid rgba(255,255,255,0.07)', background: open ? 'rgba(255,255,255,0.03)' : 'transparent', borderRadius: open ? '8px' : 0 }}>
      <button type="button" className="pmb-row pmb-btn" aria-expanded={open} onClick={onToggle}>
        <div className="pmb-label">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: SANS, fontSize: '15px', fontWeight: 600, color: 'white' }}>{r.label}</span>
            {r.override === 'dealbreaker' && <span style={{ fontFamily: SANS, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#0E1318', background: 'white', borderRadius: '4px', padding: '2px 6px' }}>MUST-HAVE</span>}
            {r.override === 'high' && <span style={{ fontFamily: SANS, fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: 'white', border: '1px solid rgba(255,255,255,0.45)', borderRadius: '4px', padding: '1px 6px' }}>HIGH</span>}
          </div>
          <div title={`${Math.round(r.share * 100)}% of the score`} style={{ width: '96px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)', marginTop: '7px', overflow: 'hidden' }}>
            <div className="pmb-bar" style={{ width: `${Math.max(r.weight > 0 ? 6 : 0, r.bar * 100)}%`, height: '100%', background: 'white', borderRadius: '2px', animationDelay: `${650 + index * 70}ms` }} />
          </div>
        </div>
        <div className="pmb-cell"><span className="pmb-cap">{needCap}</span><span style={{ color: 'rgba(255,255,255,0.78)' }}>{r.need || '—'}</span></div>
        <div className="pmb-cell"><span className="pmb-cap">{haveCap}</span><span style={{ color: r.have ? 'white' : MUTED, fontWeight: 500 }}>{r.have || 'Not listed'}</span></div>
        <div className="pmb-verdict" style={{ color: c }}>
          <Mark status={r.status} />
          <span style={{ flex: 1 }}>{r.verdict}</span>
          <ChevronDown aria-hidden="true" style={{ width: '14px', height: '14px', color: MUTED, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>
      </button>
      {open && (
        <div style={{ padding: '0 12px 14px', fontFamily: SANS, fontSize: '13px', lineHeight: 1.55, color: 'rgba(255,255,255,0.8)' }}>
          {whyText(r, total, viewerIsListing)}
          {r.subScores?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
              {r.subScores.map((s, i) => {
                const st = s.score >= 95 ? 'match' : s.score >= 50 ? 'partial' : 'miss';
                return <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 9px', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}><Mark status={st} size={14} />{s.label || s.category}</span>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchBreakdown({ listing, requirement, matchResult, myIsListing, eyebrow, title, subline, runKey, onEditMyPost }) {
  const total = matchResult?.totalScore || 0;
  const rows = useMemo(() => buildRows(listing, requirement, matchResult), [listing, requirement, matchResult]);
  const read = useMemo(() => buildRead(rows, total), [rows, total]);
  const gaps = useMemo(() => rows.filter((r) => r.status !== 'match' && r.delta >= 0.5).sort((a, b) => b.delta - a.delta).slice(0, 4), [rows]);

  const [openKey, setOpenKey] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [whatIf, setWhatIf] = useState([]);
  useEffect(() => { setOpenKey(null); setShowAll(false); setWhatIf([]); }, [runKey]);

  const shown = Math.min(100, Math.round(total + rows.filter((r) => whatIf.includes(r.key)).reduce((s, r) => s + r.delta, 0)));
  const toggleIf = (k) => setWhatIf((w) => (w.includes(k) ? w.filter((x) => x !== k) : [...w, k]));

  // Always show the top five and anything that isn't a clean match.
  // Fold the rest (minor rows that fully matched) behind one line.
  let primary = rows.filter((r, i) => i < 5 || r.status !== 'match');
  let folded = rows.filter((r, i) => !(i < 5 || r.status !== 'match'));
  if (folded.length <= 2) { primary = rows; folded = []; }
  const visible = showAll ? rows : primary;

  const needCap = myIsListing ? 'They need' : 'Your client needs';
  const haveCap = myIsListing ? 'Your listing' : 'This listing';
  const editable = (mine, text) => (mine && onEditMyPost
    ? <button type="button" onClick={onEditMyPost} className="pmb-headbtn">{text}<ExternalLink aria-hidden="true" style={{ width: '10px', height: '10px' }} /></button>
    : <span>{text}</span>);

  return (
    <div key={runKey}>
      <style>{`
        @keyframes pmbIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pmbBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .pmb-in{animation:pmbIn .35s ease both}
        .pmb-bar{transform-origin:left;animation:pmbBar .5s ease both}
        .pmb-row{display:grid;grid-template-columns:minmax(150px,1.25fr) minmax(0,1fr) minmax(0,1fr) 150px;column-gap:16px;align-items:center}
        .pmb-btn{width:100%;min-height:58px;padding:8px 12px;background:transparent;border:none;cursor:pointer;text-align:left;border-radius:8px}
        .pmb-btn:hover{background:rgba(255,255,255,0.04)}
        .pmb-btn:focus-visible,.pmb-chip:focus-visible,.pmb-headbtn:focus-visible,.pmb-more:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px}
        .pmb-cell{font-family:${SANS};font-size:14px;line-height:1.35;word-break:break-word}
        .pmb-cap{display:none}
        .pmb-verdict{display:flex;align-items:center;gap:8px;font-family:${SANS};font-size:13px;font-weight:600}
        .pmb-head{font-family:${SANS};font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};padding:0 12px 10px;border-bottom:1px solid rgba(255,255,255,0.14)}
        .pmb-headbtn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:5px;color:${ACCENT}}
        .pmb-headbtn:hover{text-decoration:underline}
        .pmb-chip{font-family:${SANS};font-size:13px;font-weight:600;min-height:40px;padding:0 14px;border-radius:20px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .15s}
        .pmb-more{width:100%;min-height:48px;padding:0 12px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-family:${SANS};font-size:14px;color:rgba(255,255,255,0.75);border-radius:8px}
        .pmb-more:hover{background:rgba(255,255,255,0.04)}
        @media (max-width:680px){
          .pmb-head{display:none}
          .pmb-row{grid-template-columns:1fr 1fr;row-gap:10px}
          .pmb-label,.pmb-verdict{grid-column:1/-1}
          .pmb-cap{display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};margin-bottom:2px}
        }
        @media (prefers-reduced-motion:reduce){.pmb-in,.pmb-bar{animation:none}}
      `}</style>

      {/* Score + what is being compared */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <ScoreRing actual={total} shown={shown} runKey={runKey} />
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          {eyebrow && <div style={{ fontFamily: SANS, fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: '6px' }}>{eyebrow}</div>}
          <h2 style={{ fontFamily: DISPLAY, fontSize: '26px', fontWeight: 600, color: 'white', lineHeight: 1.2, margin: '0 0 6px', wordBreak: 'break-word' }}>{title}</h2>
          {subline && <div style={{ fontFamily: SANS, fontSize: '14px', color: MUTED, marginBottom: '14px' }}>{subline}</div>}
          <div className="pmb-in" style={{ animationDelay: '250ms', background: 'rgba(0,219,197,0.07)', border: '1px solid rgba(0,219,197,0.28)', borderRadius: '12px', padding: '14px 16px', fontFamily: SANS, fontSize: '15.5px', lineHeight: 1.5, color: 'white' }}>{read}</div>
        </div>
      </div>

      {/* Ranked breakdown */}
      <div style={{ marginBottom: '20px' }}>
        <div className="pmb-row pmb-head">
          <div>What matters most</div>
          <div>{editable(!myIsListing, needCap)}</div>
          <div>{editable(myIsListing, haveCap)}</div>
          <div>Result</div>
        </div>
        {visible.map((r, i) => (
          <Row key={r.key} r={r} index={i} total={rows.length} open={openKey === r.key}
            onToggle={() => setOpenKey(openKey === r.key ? null : r.key)}
            viewerIsListing={myIsListing} needCap={needCap} haveCap={haveCap} />
        ))}
        {folded.length > 0 && (
          <button type="button" className="pmb-more" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            <span>{showAll ? 'Show fewer' : `${folded.length} more criteria, all matched`}</span>
            <ChevronDown aria-hidden="true" style={{ width: '16px', height: '16px', transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* Close the gap */}
      {gaps.length > 0 && (
        <div className="pmb-in" style={{ animationDelay: `${700 + visible.length * 70}ms`, border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '12px', padding: '14px 16px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div style={{ fontFamily: SANS, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: MUTED, marginRight: '10px' }}>CLOSE THE GAP</span>
              Tap one to see the score if it were solved.
            </div>
            {whatIf.length > 0 && <button type="button" className="pmb-headbtn" style={{ fontFamily: SANS, fontSize: '13px' }} onClick={() => setWhatIf([])}>Reset to {total}%</button>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {gaps.map((g) => {
              const on = whatIf.includes(g.key);
              return (
                <button key={g.key} type="button" className="pmb-chip" aria-pressed={on} onClick={() => toggleIf(g.key)}
                  style={{ background: on ? ACCENT : 'rgba(255,255,255,0.05)', border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.22)'}`, color: on ? '#06241F' : 'white' }}>
                  {g.label}
                  <span style={{ fontWeight: 700, color: on ? '#06241F' : ACCENT }}>+{Math.max(1, Math.round(g.delta))}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
