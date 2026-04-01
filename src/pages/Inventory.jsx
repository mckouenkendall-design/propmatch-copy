import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Search, Plus, Trash2, Loader2, LayoutGrid, List, Eye, Bookmark, Share2, Pencil } from 'lucide-react';
import CreatePostModal from '../components/dashboard/CreatePostModal';
import ListingWizard from '@/components/forms/ListingWizard';
import RequirementWizard from '@/components/forms/RequirementWizard';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

const PT = {
  office:'General Office', medical_office:'Medical Office', retail:'Retail',
  industrial_flex:'Industrial / Flex', land:'Land', special_use:'Special Use',
  single_family:'Single Family', condo:'Condo', apartment:'Apartment',
  multi_family:'Multi-Family', multi_family_5:'Multi-Family (5+)',
  townhouse:'Townhouse', manufactured:'Manufactured', land_residential:'Residential Land',
};

function fmtPrice(post, isListing) {
  const n = v => { const x = parseFloat(v); return (!v || isNaN(x)) ? null : x % 1 === 0 ? x.toLocaleString() : x.toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  if (isListing) {
    const f = n(post.price); if (!f) return null;
    const u = post.transaction_type === 'lease' || post.transaction_type === 'sublease' ? '/SF/yr' : post.transaction_type === 'rent' ? '/mo' : '';
    return `$${f}${u}`;
  }
  const u = post.price_period === 'per_month' ? '/mo' : post.price_period === 'per_sf_per_year' ? '/SF/yr' : post.price_period === 'annually' ? '/yr' : (post.transaction_type === 'lease' || post.transaction_type === 'rent') ? '/mo' : '';
  const lo = n(post.min_price), hi = n(post.max_price);
  if (lo && hi) return `$${lo}\u2013$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

function PostCard({ post, isListing, onEdit, onDelete, deleting, view }) {
  const [hov, setHov] = useState(false);
  const color = isListing ? ACCENT : LAVENDER;
  const Icon  = isListing ? Building2 : Search;
  const price = fmtPrice(post, isListing);
  const views  = post.view_count  || 0;
  const saves  = post.save_count  || 0;
  const shares = post.share_count || 0;
  const chips = [
    post.status ? post.status.toUpperCase() : 'ACTIVE',
    isListing && post.size_sqft ? `${parseFloat(post.size_sqft).toLocaleString()} SF` : null,
    !isListing && (post.min_size_sqft || post.max_size_sqft)
      ? `${post.min_size_sqft ? parseFloat(post.min_size_sqft).toLocaleString() : '0'}\u2013${post.max_size_sqft ? parseFloat(post.max_size_sqft).toLocaleString() : '\u221e'} SF`
      : null,
    post.transaction_type ? post.transaction_type.charAt(0).toUpperCase() + post.transaction_type.slice(1) : null,
  ].filter(Boolean);

  const loc = isListing
    ? [post.city, post.state].filter(Boolean).join(', ')
    : (Array.isArray(post.cities) ? post.cities.join(', ') : post.cities) || '';

  const StatRow = () => (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>
      <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Eye style={{ width:'11px', height:'11px' }}/> {views}</span>
      <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Bookmark style={{ width:'11px', height:'11px' }}/> {saves}</span>
      <span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Share2 style={{ width:'11px', height:'11px' }}/> {shares}</span>
    </div>
  );

  if (view === 'list') return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 20px', background:hov?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)', border:`1px solid ${hov?color+'25':'rgba(255,255,255,0.08)'}`, borderRadius:'12px', transition:'all 0.15s' }}>
      <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:`${color}18`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon style={{ width:'17px', height:'17px', color }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,0.9)', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</p>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.38)', margin:0 }}>{loc}{loc && ' \u00b7 '}{PT[post.property_type] || post.property_type}</p>
      </div>
      {price && <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'16px', fontWeight:700, color, flexShrink:0 }}>{price}</div>}
      <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
        {chips.map((c, i) => <span key={i} style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'4px', padding:'2px 6px', textTransform:'uppercase' }}>{c}</span>)}
      </div>
      <StatRow/>
      <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
        <button onClick={onEdit} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', background:`${color}12`, border:`1px solid ${color}28`, borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color, cursor:'pointer' }}>
          <Pencil style={{ width:'10px', height:'10px' }}/> Edit
        </button>
        <button onClick={onDelete} disabled={deleting}
          style={{ padding:'6px 8px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex' }}
          onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
          {deleting ? <Loader2 style={{ width:'13px', height:'13px', animation:'spin 1s linear infinite' }}/> : <Trash2 style={{ width:'13px', height:'13px' }}/>}
        </button>
      </div>
    </div>
  );

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:hov?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.04)', border:`1px solid ${hov?color+'30':'rgba(255,255,255,0.08)'}`, borderRadius:'14px', overflow:'hidden', transition:'all 0.18s', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 16px 12px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'11px', background:`${color}18`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon style={{ width:'20px', height:'20px', color }}/>
          </div>
          <button onClick={onEdit}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:`${color}12`, border:`1px solid ${color}28`, borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:500, color, cursor:'pointer' }}>
            <Pencil style={{ width:'10px', height:'10px' }}/> Edit
          </button>
        </div>
        <p style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'14px', fontWeight:600, color:'rgba(255,255,255,0.9)', margin:'0 0 3px', lineHeight:1.3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{post.title}</p>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.38)', margin:0 }}>
          {loc}{loc && ' \u00b7 '}{PT[post.property_type] || post.property_type}
        </p>
      </div>

      {price && (
        <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'20px', fontWeight:700, color }}>{price}</div>
        </div>
      )}

      <div style={{ padding:'10px 16px', display:'flex', flexWrap:'wrap', gap:'5px' }}>
        {chips.map((c, i) => (
          <span key={i} style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'5px', padding:'3px 7px', textTransform:'uppercase', letterSpacing:'0.03em' }}>{c}</span>
        ))}
      </div>

      <div style={{ padding:'8px 16px 14px', marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <StatRow/>
        <button onClick={onDelete} disabled={deleting}
          style={{ padding:'5px 7px', background:'transparent', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'7px', cursor:'pointer', color:'rgba(255,255,255,0.25)', display:'flex', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#ef4444'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.25)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
          {deleting ? <Loader2 style={{ width:'13px', height:'13px', animation:'spin 1s linear infinite' }}/> : <Trash2 style={{ width:'13px', height:'13px' }}/>}
        </button>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [tab, setTab]           = useState('listings');
  const [view, setView]         = useState('grid');
  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost]     = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const qc = useQueryClient();
  const location = useLocation();

  const { data: listings     = [], isLoading: loadL } = useQuery({ queryKey:['inv-listings'],     queryFn:() => base44.entities.Listing.list('-created_date') });
  const { data: requirements = [], isLoading: loadR } = useQuery({ queryKey:['inv-requirements'], queryFn:() => base44.entities.Requirement.list('-created_date') });

  useEffect(()=>{
    const id = location.state?.openPostId;
    if(!id) return;
    const found = [...listings.map(l=>({...l,postType:'listing'})),...requirements.map(r=>({...r,postType:'requirement'}))].find(p=>p.id===id);
    if(found){ setTab(found.postType==='listing'?'listings':'requirements'); setEditPost(found); window.history.replaceState({},''); }
  },[location.state?.openPostId, listings, requirements]);

  const posts = tab === 'listings'
    ? listings.map(l => ({ ...l, postType:'listing' }))
    : requirements.map(r => ({ ...r, postType:'requirement' }));

  const handleDelete = async (post) => {
    if (!confirm('Delete this post?')) return;
    setDeletingId(post.id);
    try {
      if (post.postType === 'listing') {
        await base44.entities.Listing.delete(post.id);
        qc.invalidateQueries({ queryKey:['inv-listings'] });
        qc.invalidateQueries({ queryKey:['listings'] });
      } else {
        await base44.entities.Requirement.delete(post.id);
        qc.invalidateQueries({ queryKey:['inv-requirements'] });
        qc.invalidateQueries({ queryKey:['requirements'] });
      }
    } finally { setDeletingId(null); }
  };

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'48px 32px 60px' }}>

      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'32px', fontWeight:300, color:'white', margin:'0 0 6px' }}>
          My Listings &amp; Client Requirements
        </h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:0 }}>
          Click Edit on any card to update it. Changes save instantly when you click Post.
        </p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px', flexWrap:'wrap' }}>
        <div style={{ display:'inline-flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'4px', gap:'4px' }}>
          {[
            { key:'listings',     label:`Listings (${listings.length})`,         Icon:Building2, color:ACCENT   },
            { key:'requirements', label:`Requirements (${requirements.length})`, Icon:Search,    color:LAVENDER },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 18px', background:tab===t.key?`${t.color}18`:'transparent', border:tab===t.key?`1px solid ${t.color}40`:'none', borderRadius:'7px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:tab===t.key?t.color:'rgba(255,255,255,0.5)', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
              <t.Icon style={{ width:'15px', height:'15px' }}/>{t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 20px', background:ACCENT, border:'none', borderRadius:'10px', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'14px', fontWeight:600, color:'#111827', cursor:'pointer', boxShadow:`0 4px 16px ${ACCENT}40` }}>
          <Plus style={{ width:'16px', height:'16px' }}/> Post
        </button>
        <div style={{ marginLeft:'auto', display:'flex', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', overflow:'hidden' }}>
          {[{ v:'grid', Icon:LayoutGrid }, { v:'list', Icon:List }].map(({ v, Icon }) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'8px 10px', background:view===v?'rgba(255,255,255,0.1)':'transparent', border:'none', cursor:'pointer', display:'flex', color:view===v?'white':'rgba(255,255,255,0.35)', transition:'all 0.15s' }}>
              <Icon style={{ width:'15px', height:'15px' }}/>
            </button>
          ))}
        </div>
      </div>

      {loadL || loadR ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <Loader2 style={{ width:'32px', height:'32px', color:ACCENT, animation:'spin 1s linear infinite' }}/>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px' }}>
          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:`${ACCENT}15`, border:`1px solid ${ACCENT}30`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            {tab === 'listings' ? <Building2 style={{ width:'24px', height:'24px', color:ACCENT }}/> : <Search style={{ width:'24px', height:'24px', color:ACCENT }}/>}
          </div>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'18px', fontWeight:400, color:'white', margin:'0 0 8px' }}>No {tab} yet</h3>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.4)', margin:'0 0 24px' }}>
            Create your first {tab === 'listings' ? 'listing' : 'requirement'} to start getting matched.
          </p>
          <button onClick={() => setShowCreate(true)}
            style={{ padding:'10px 24px', background:ACCENT, border:'none', borderRadius:'8px', fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:600, color:'#111827', cursor:'pointer' }}>
            + Post
          </button>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'16px' }}>
          {posts.map(post => (
            <PostCard key={`${post.postType}-${post.id}`} post={post} isListing={post.postType==='listing'} view="grid"
              onEdit={() => setEditPost(post)} onDelete={() => handleDelete(post)} deleting={deletingId===post.id}/>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {posts.map(post => (
            <PostCard key={`${post.postType}-${post.id}`} post={post} isListing={post.postType==='listing'} view="list"
              onEdit={() => setEditPost(post)} onDelete={() => handleDelete(post)} deleting={deletingId===post.id}/>
          ))}
        </div>
      )}

      {/* Create new post */}
      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey:['inv-listings'] });
            qc.invalidateQueries({ queryKey:['inv-requirements'] });
            qc.invalidateQueries({ queryKey:['listings'] });
            qc.invalidateQueries({ queryKey:['requirements'] });
          }}
        />
      )}

      {/* Edit existing listing — opens straight into wizard step 1 */}
      {editPost && editPost.postType === 'listing' && (
        <ListingWizard
          category={editPost.property_category || 'commercial'}
          initialData={editPost}
          editMode={true}
          onClose={() => setEditPost(null)}
          onSuccess={() => {
            setEditPost(null);
            qc.invalidateQueries({ queryKey:['inv-listings'] });
            qc.invalidateQueries({ queryKey:['listings'] });
          }}
        />
      )}

      {/* Edit existing requirement — opens straight into wizard step 1 */}
      {editPost && editPost.postType === 'requirement' && (
        <RequirementWizard
          category={editPost.property_category || 'commercial'}
          initialData={editPost}
          editMode={true}
          onClose={() => setEditPost(null)}
          onSuccess={() => {
            setEditPost(null);
            qc.invalidateQueries({ queryKey:['inv-requirements'] });
            qc.invalidateQueries({ queryKey:['requirements'] });
          }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}