import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { calculateMatchScore, getScoreColor } from '@/utils/matchScore';
import { clientHeadline } from '@/components/matches/MatchGroupCard';
import { X, Check, Building2, Stethoscope, ShoppingBag, Package, Map, Star, Home, Building, Hotel, Users, Truck, TreePine, BookOpen, ChevronDown } from 'lucide-react';
import RequirementWizard from '../forms/RequirementWizard';
import ListingWizard from '../forms/ListingWizard';
import LoadTemplateModal from '../templates/LoadTemplateModal';

// One screen to start a post: pick requirement or listing, pick the property type, go.
// (It used to be two separate pop-ups before the form even opened.)

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';
const HEAD = "'Plus Jakarta Sans',sans-serif";
const BODY = "'Inter',sans-serif";

export const MAIN_TYPES = [
  { value: 'office', label: 'General Office', Icon: Building2, cat: 'commercial' },
  { value: 'retail', label: 'Retail', Icon: ShoppingBag, cat: 'commercial' },
  { value: 'medical_office', label: 'Medical Office', Icon: Stethoscope, cat: 'commercial' },
  { value: 'industrial_flex', label: 'Industrial / Flex', Icon: Package, cat: 'commercial' },
  { value: 'single_family', label: 'Single Family', Icon: Home, cat: 'residential' },
];
const MORE_TYPES = [
  { value: 'land', label: 'Land', Icon: Map, cat: 'commercial' },
  { value: 'special_use', label: 'Special Use', Icon: Star, cat: 'commercial' },
  { value: 'condo', label: 'Condo', Icon: Building, cat: 'residential' },
  { value: 'townhouse', label: 'Townhouse', Icon: Building2, cat: 'residential' },
  { value: 'apartment', label: 'Apartment', Icon: Hotel, cat: 'residential' },
  { value: 'multi_family', label: 'Multi-Family (2 to 4)', Icon: Users, cat: 'residential' },
  { value: 'multi_family_5', label: 'Multi-Family (5+)', Icon: Users, cat: 'residential' },
  { value: 'manufactured', label: 'Manufactured', Icon: Truck, cat: 'residential' },
  { value: 'land_residential', label: 'Residential Land', Icon: TreePine, cat: 'residential' },
];
const ALL_TYPES = [...MAIN_TYPES, ...MORE_TYPES];

function TypeButton({ t, color, onPick, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={() => onPick(t)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: small ? '11px 14px' : '16px', borderRadius: '12px', background: hov ? `${color}14` : 'rgba(255,255,255,0.035)', border: `1px solid ${hov ? color + '66' : 'rgba(255,255,255,0.09)'}`, transition: 'all 0.15s' }}>
      <span style={{ width: small ? '30px' : '38px', height: small ? '30px' : '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hov ? `${color}22` : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <t.Icon style={{ width: small ? '15px' : '18px', height: small ? '15px' : '18px', color: hov ? color : 'rgba(255,255,255,0.7)' }} />
      </span>
      <span style={{ fontFamily: BODY, fontSize: small ? '13.5px' : '15px', fontWeight: 600, color: 'white' }}>{t.label}</span>
    </button>
  );
}

const placeOf = (p) => [p.address, p.city].filter(Boolean).join(', ') || p.title || 'Untitled';

// Shown right after posting: the payoff. How many posts already fit, and the best few.
function Posted({ postType, row, onSeeMatches, onDone }) {
  const [state, setState] = useState({ loading: true, matches: [] });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const isReq = postType === 'requirement';
        const others = await supabase.from(isReq ? 'listings' : 'requirements').select('*').order('created_at', { ascending: false }).limit(300);
        const list = (Array.isArray(others) ? others : []).filter((o) => o.created_by !== row.created_by && (o.visibility || 'public') === 'public');
        const ms = list.map((o) => {
          const r = isReq ? calculateMatchScore(o, row) : calculateMatchScore(row, o);
          return r.isMatch ? { other: o, ...r } : null;
        }).filter(Boolean).sort((a, b) => b.totalScore - a.totalScore);
        if (alive) setState({ loading: false, matches: ms });
      } catch {
        if (alive) setState({ loading: false, matches: [] });
      }
    })();
    return () => { alive = false; };
  }, [postType, row]);

  const isReq = postType === 'requirement';
  const n = state.matches.length;
  const who = isReq ? clientHeadline(row) : placeOf(row);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(5,8,10,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div role="dialog" aria-label="Posted" style={{ width: '100%', maxWidth: '520px', background: '#141a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', padding: 'clamp(22px, 4vw, 30px)', textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${ACCENT}1f`, border: `1.5px solid ${ACCENT}` }}>
          <Check style={{ width: '24px', height: '24px', color: ACCENT }} />
        </div>
        <h2 style={{ margin: '0 0 6px', fontFamily: HEAD, fontWeight: 800, fontSize: '24px', color: 'white' }}>Posted</h2>
        <p style={{ margin: '0 0 20px', fontFamily: BODY, fontSize: '14.5px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          {state.loading ? 'Checking it against everything on PropMatch...'
            : n ? <><b style={{ color: 'white' }}>{n} {isReq ? (n === 1 ? 'listing already fits' : 'listings already fit') : (n === 1 ? 'client is already looking' : 'clients are already looking')}</b> {isReq ? `for ${who}.` : 'for space like this.'}</>
              : isReq ? 'Nothing fits yet. The moment a listing that fits is posted, it shows up in your matches.' : 'No one is looking for this yet. The moment a client fits, you will see them in your matches.'}
        </p>
        {!state.loading && n > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
            {state.matches.slice(0, 3).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: '17px', color: getScoreColor(m.totalScore), width: '34px' }}>{m.totalScore}</span>
                <span style={{ fontFamily: BODY, fontSize: '14px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isReq ? placeOf(m.other) : clientHeadline(m.other)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {n > 0 && <button onClick={onSeeMatches} style={{ padding: '12px 20px', borderRadius: '10px', border: 'none', background: ACCENT, color: '#06201d', fontFamily: BODY, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>See {n === 1 ? 'the match' : `all ${n} matches`}</button>}
          <button onClick={onDone} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontFamily: BODY, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostModal({ onClose, onSuccess, presetType = null, presetPropertyType = null }) {
  const [postType, setPostType] = useState(presetType || 'requirement');
  const [picked, setPicked] = useState(() => (presetPropertyType ? ALL_TYPES.find((t) => t.value === presetPropertyType) || null : null));
  const [showMore, setShowMore] = useState(false);
  const [template, setTemplate] = useState(null);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [posted, setPosted] = useState(null);
  const navigate = useNavigate();

  // The form saved. Show the payoff screen instead of just closing.
  const handleSaved = (result) => {
    const row = Array.isArray(result) ? result[0] : result;
    if (row && row.id) setPosted(row);
    else onSuccess?.();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !picked && !template) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, template, onClose]);

  const back = (reason) => {
    if (reason === 'back') { setPicked(null); setTemplate(null); }
    else onClose();
  };

  if (posted) {
    return <Posted postType={postType} row={posted}
      onDone={() => onSuccess?.()}
      onSeeMatches={() => { onSuccess?.(); navigate('/Matches', { state: { openPostId: posted.id } }); }} />;
  }

  if (showLoadTemplate) {
    return <LoadTemplateModal onClose={() => setShowLoadTemplate(false)}
      onLoad={({ data, templateType, category }) => { setShowLoadTemplate(false); setPostType(templateType); setTemplate({ data, category: category || data.property_category }); }} />;
  }

  if (template) {
    const W = postType === 'listing' ? ListingWizard : RequirementWizard;
    return <W category={template.category} onClose={back} onSuccess={handleSaved} initialData={template.data} />;
  }

  if (picked) {
    const W = postType === 'listing' ? ListingWizard : RequirementWizard;
    return <W category={picked.cat} onClose={back} onSuccess={handleSaved} preset={{ property_type: picked.value, property_category: picked.cat }} />;
  }

  const isReq = postType === 'requirement';
  const color = isReq ? LAVENDER : ACCENT;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(5,8,10,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="New post"
        style={{ width: '100%', maxWidth: '620px', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', background: '#141a1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', padding: 'clamp(20px, 4vw, 28px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontFamily: HEAD, fontWeight: 700, fontSize: '22px', color: 'white' }}>New post</h2>
            <p style={{ margin: 0, fontFamily: BODY, fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {isReq ? "Tell us what your client needs. We check it against every listing on PropMatch and show you what fits." : 'Post your space once. Every agent with a client who fits gets matched to it.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ all: 'unset', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', display: 'flex' }}><X style={{ width: '18px', height: '18px' }} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
          {[{ k: 'requirement', l: 'Client requirement', c: LAVENDER }, { k: 'listing', l: 'Listing', c: ACCENT }].map((o) => (
            <button key={o.k} onClick={() => setPostType(o.k)}
              style={{ all: 'unset', cursor: 'pointer', textAlign: 'center', padding: '10px', borderRadius: '9px', fontFamily: BODY, fontSize: '14px', fontWeight: 600, color: postType === o.k ? o.c : 'rgba(255,255,255,0.55)', background: postType === o.k ? `${o.c}1a` : 'transparent', border: `1px solid ${postType === o.k ? o.c + '55' : 'transparent'}`, transition: 'all 0.15s' }}>
              {o.l}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: BODY, fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>WHAT KIND OF PROPERTY?</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: '10px' }}>
          {MAIN_TYPES.map((t) => <TypeButton key={t.value} t={t} color={color} onPick={setPicked} />)}
        </div>

        <button onClick={() => setShowMore((v) => !v)}
          style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '16px 0 0', fontFamily: BODY, fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
          {showMore ? 'Fewer types' : 'More property types'}
          <ChevronDown style={{ width: '14px', height: '14px', transform: showMore ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        {showMore && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: '8px', marginTop: '10px' }}>
            {MORE_TYPES.map((t) => <TypeButton key={t.value} t={t} color={color} onPick={setPicked} small />)}
          </div>
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '20px', paddingTop: '14px' }}>
          <button onClick={() => setShowLoadTemplate(true)}
            style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: BODY, fontSize: '13px', color: 'rgba(255,255,255,0.55)' }}>
            <BookOpen style={{ width: '14px', height: '14px' }} /> Start from a saved template
          </button>
        </div>
      </div>
    </div>
  );
}
