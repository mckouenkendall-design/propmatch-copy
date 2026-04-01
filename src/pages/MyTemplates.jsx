import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, FileText, Building2, Home, Trash2, Pencil, Check, X, FolderOpen, ChevronDown, ChevronRight, Loader2, Play } from 'lucide-react';
import ListingWizard from '@/components/forms/ListingWizard';
import RequirementWizard from '@/components/forms/RequirementWizard';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';
const TYPE_COLORS = { listing: ACCENT, requirement: LAVENDER };
const CAT_ICONS   = { commercial: Building2, residential: Home };

function TemplateCard({ template, onDelete, onRename, onUse, deleting }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(template.name);
  const CatIcon = CAT_ICONS[template.property_category] || FileText;
  const color   = TYPE_COLORS[template.template_type] || ACCENT;

  const save = () => {
    if (name.trim() && name.trim() !== template.name) onRename(template.id, name.trim());
    setEditing(false);
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', transition:'all 0.15s' }}
      onMouseEnter={e => { if (!editing) e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; }}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
      <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${color}12`, border:`1px solid ${color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <CatIcon style={{ width:'16px', height:'16px', color }}/>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <input value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') setEditing(false); }}
              autoFocus
              style={{ flex:1, padding:'5px 8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'white', outline:'none' }}/>
            <button onClick={save} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px' }}>
              <Check style={{ width:'14px', height:'14px', color:ACCENT }}/>
            </button>
            <button onClick={() => setEditing(false)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px' }}>
              <X style={{ width:'14px', height:'14px', color:'rgba(255,255,255,0.4)' }}/>
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', fontWeight:500, color:'white', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{template.name}</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.35)', margin:0, textTransform:'capitalize' }}>
              {template.template_type}{template.property_type ? ` · ${template.property_type.replace(/_/g,' ')}` : ''}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
          {/* Use Template — creates a NEW post, does not edit the original */}
          <button onClick={() => onUse(template)}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 10px', background:`${color}12`, border:`1px solid ${color}28`, borderRadius:'7px', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background=`${color}22`; e.currentTarget.style.borderColor=`${color}50`; }}
            onMouseLeave={e => { e.currentTarget.style.background=`${color}12`; e.currentTarget.style.borderColor=`${color}28`; }}>
            <Play style={{ width:'11px', height:'11px', color }}/>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:600, color }}>Use</span>
          </button>
          <button onClick={() => setEditing(true)}
            style={{ background:'transparent', border:'none', cursor:'pointer', padding:'6px', borderRadius:'6px', display:'flex', color:'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color='white'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
            <Pencil style={{ width:'14px', height:'14px' }}/>
          </button>
          <button onClick={() => onDelete(template.id)} disabled={deleting}
            style={{ background:'transparent', border:'none', cursor:deleting?'not-allowed':'pointer', padding:'6px', borderRadius:'6px', display:'flex', color:'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { if (!deleting) e.currentTarget.style.color='#ef4444'; }}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
            {deleting ? <Loader2 style={{ width:'14px', height:'14px', animation:'spin 1s linear infinite' }}/> : <Trash2 style={{ width:'14px', height:'14px' }}/>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyTemplates() {
  const [search, setSearch]           = useState('');
  const [openFolders, setOpenFolders] = useState({});
  const [deletingId, setDeletingId]   = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(null); // template being used to create new post
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => { setDeletingId(id); await base44.entities.Template.delete(id); },
    onSuccess: () => { setDeletingId(null); queryClient.invalidateQueries({ queryKey:['templates'] }); },
    onError: () => setDeletingId(null),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.Template.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey:['templates'] }),
  });

  const handleUse = (template) => {
    setActiveTemplate(template);
  };

  const handleWizardSuccess = () => {
    setActiveTemplate(null);
    queryClient.invalidateQueries({ queryKey:['listings'] });
    queryClient.invalidateQueries({ queryKey:['requirements'] });
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.folder || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.property_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, t) => {
    const key = t.folder || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const folderNames = Object.keys(grouped).sort((a,b) => a==='General'?1:b==='General'?-1:a.localeCompare(b));
  const toggleFolder = (name) => setOpenFolders(prev => ({ ...prev, [name]:!prev[name] }));
  const isFolderOpen = (name) => search.length > 0 || openFolders[name] !== false;

  // Parse template data for the wizard
  const templateFormData = activeTemplate ? (() => {
    try { return JSON.parse(activeTemplate.data); } catch { return {}; }
  })() : null;

  return (
    <div style={{ maxWidth:'780px', margin:'0 auto', padding:'48px 24px' }}>

      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'28px', fontWeight:400, color:'white', margin:'0 0 6px' }}>My Templates</h1>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'rgba(255,255,255,0.45)', margin:0 }}>
          Saved posting templates grouped by folder. Click <strong style={{ color:ACCENT }}>Use</strong> to create a new post from a template.
        </p>
      </div>

      <div style={{ position:'relative', marginBottom:'24px' }}>
        <Search style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'16px', height:'16px', color:'rgba(255,255,255,0.35)' }}/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search templates or folders…"
          style={{ width:'100%', boxSizing:'border-box', paddingLeft:'38px', paddingRight:'14px', paddingTop:'10px', paddingBottom:'10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontFamily:"'Inter',sans-serif", fontSize:'14px', color:'white', outline:'none' }}/>
      </div>

      {isLoading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
          <Loader2 style={{ width:'28px', height:'28px', color:ACCENT, animation:'spin 1s linear infinite' }}/>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'64px 24px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px' }}>
          <FileText style={{ width:'44px', height:'44px', color:'rgba(255,255,255,0.18)', margin:'0 auto 16px' }}/>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'15px', fontWeight:500, color:'white', margin:'0 0 8px' }}>
            {search ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:'rgba(255,255,255,0.35)', margin:0 }}>
            Save a template from Step 3 when creating a listing or requirement.
          </p>
        </div>
      )}

      {!isLoading && folderNames.map(folder => {
        const items  = grouped[folder];
        const isOpen = isFolderOpen(folder);
        const ChevIcon = isOpen ? ChevronDown : ChevronRight;
        return (
          <div key={folder} style={{ marginBottom:'10px' }}>
            <button onClick={() => toggleFolder(folder)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'13px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:isOpen?'12px 12px 0 0':'12px', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
              <FolderOpen style={{ width:'17px', height:'17px', color:ACCENT, flexShrink:0 }}/>
              <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'15px', fontWeight:400, color:'white', flex:1 }}>{folder}</span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', marginRight:'8px' }}>
                {items.length} template{items.length!==1?'s':''}
              </span>
              <ChevIcon style={{ width:'15px', height:'15px', color:'rgba(255,255,255,0.35)', flexShrink:0 }}/>
            </button>
            {isOpen && (
              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.09)', borderTop:'none', borderRadius:'0 0 12px 12px', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'6px' }}>
                {items.map(t => (
                  <TemplateCard key={t.id} template={t} deleting={deletingId===t.id}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onRename={(id, name) => renameMutation.mutate({ id, name })}
                    onUse={handleUse}/>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Use Template — opens wizard in CREATE mode (new post, template untouched) */}
      {activeTemplate && templateFormData && activeTemplate.template_type === 'listing' && (
        <ListingWizard
          category={templateFormData.property_category || activeTemplate.property_category || 'commercial'}
          initialData={templateFormData}
          editMode={false}
          onClose={() => setActiveTemplate(null)}
          onSuccess={handleWizardSuccess}
        />
      )}
      {activeTemplate && templateFormData && activeTemplate.template_type === 'requirement' && (
        <RequirementWizard
          category={templateFormData.property_category || activeTemplate.property_category || 'commercial'}
          initialData={templateFormData}
          editMode={false}
          onClose={() => setActiveTemplate(null)}
          onSuccess={handleWizardSuccess}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}