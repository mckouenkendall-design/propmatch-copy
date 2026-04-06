import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { X, Search, FileText, Building2, Home, FolderOpen, ChevronRight } from 'lucide-react';

const ACCENT = '#00DBC5';
const LAVENDER = '#818cf8';

const TYPE_COLORS = { listing: ACCENT, requirement: LAVENDER };
const CAT_ICONS   = { commercial: Building2, residential: Home };

export default function LoadTemplateModal({ onClose, onLoad }) {
  const { user } = useAuth();
  const [search, setSearch]           = useState('');
  const [openFolder, setOpenFolder]   = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => supabase.from('templates').select('*').eq('created_by', user?.email).order('created_at', { ascending: false }),
    enabled: !!user?.email,
  });

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.property_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.folder || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by folder
  const grouped = filtered.reduce((acc, t) => {
    const key = t.folder || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  const folderNames = Object.keys(grouped).sort();

  const handleLoad = (template) => {
    const data = JSON.parse(template.data);
    onLoad({ data, templateType: template.template_type, category: template.property_category });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '500px', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 500, color: 'white', margin: 0 }}>Load a Template</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'rgba(255,255,255,0.35)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates or folders…"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '34px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'white', outline: 'none' }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {isLoading && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '32px 0' }}>Loading templates…</p>
          )}

          {!isLoading && filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '10px' }}>
              <FileText style={{ width: '36px', height: '36px', color: 'rgba(255,255,255,0.2)' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>No templates found</p>
            </div>
          )}

          {!isLoading && folderNames.map(folder => {
            const items  = grouped[folder];
            const isOpen = openFolder === folder || search.length > 0;

            return (
              <div key={folder} style={{ marginBottom: '8px' }}>
                {/* Folder row */}
                <button
                  onClick={() => setOpenFolder(isOpen && !search ? null : folder)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <FolderOpen style={{ width: '16px', height: '16px', color: ACCENT, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', flex: 1 }}>{folder}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginRight: '6px' }}>{items.length} template{items.length !== 1 ? 's' : ''}</span>
                  <ChevronRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>

                {/* Templates in folder */}
                {isOpen && (
                  <div style={{ marginTop: '4px', marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {items.map(t => {
                      const CatIcon = CAT_ICONS[t.property_category] || FileText;
                      const color   = TYPE_COLORS[t.template_type] || ACCENT;
                      return (
                        <button key={t.id} onClick={() => handleLoad(t)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '9px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%' }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}25`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CatIcon style={{ width: '16px', height: '16px', color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0, textTransform: 'capitalize' }}>
                              {t.template_type}{t.property_type ? ` · ${t.property_type.replace(/_/g, ' ')}` : ''}
                            </p>
                          </div>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, padding: '3px 10px', background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '5px', color, flexShrink: 0 }}>
                            Load
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}