import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { X, BookmarkCheck, FolderOpen, FolderPlus, Check, Loader2 } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function SaveTemplateModal({ formData, templateType, onClose }) {
  const { user } = useAuth();
  const [name, setName]             = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Load existing templates to derive folder list
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const folders = [...new Set(
    templates.map(t => t.folder).filter(Boolean)
  )].sort();

  const handleSave = async () => {
    if (!name.trim()) return;
    const folder = creatingFolder
      ? (newFolderName.trim() || 'General')
      : (selectedFolder || 'General');
    setSaving(true);
    try {
      await base44.entities.Template.create({
        name: name.trim(),
        folder,
        template_type: templateType,
        property_category: formData.property_category || null,
        property_type: formData.property_type || null,
        data: JSON.stringify(formData),
      });
      setSaved(true);
      setTimeout(() => onClose(), 1200);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '17px', fontWeight: 500, color: 'white', margin: 0 }}>Save as Template</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '5px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '15px', height: '15px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {saved ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookmarkCheck style={{ width: '26px', height: '26px', color: ACCENT }} />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: 0 }}>Template saved!</p>
            </div>
          ) : (
            <>
              {/* Template Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
                  Template Name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. 691 N Squirrel — Unit A"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'white', outline: 'none' }}
                />
              </div>

              {/* Folder Picker */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
                  Save to Folder
                </label>

                {/* Existing folders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                  {folders.length === 0 && !creatingFolder && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: '0 0 6px' }}>No folders yet — create one below.</p>
                  )}
                  {folders.map(folder => {
                    const isSelected = !creatingFolder && selectedFolder === folder;
                    return (
                      <button key={folder} onClick={() => { setSelectedFolder(folder); setCreatingFolder(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: isSelected ? `${ACCENT}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? ACCENT : 'rgba(255,255,255,0.08)'}`, borderRadius: '9px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                        <FolderOpen style={{ width: '15px', height: '15px', color: isSelected ? ACCENT : 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: isSelected ? ACCENT : 'rgba(255,255,255,0.75)', flex: 1 }}>{folder}</span>
                        {isSelected && <Check style={{ width: '14px', height: '14px', color: ACCENT, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                {/* Create new folder */}
                {creatingFolder ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      placeholder="New folder name…"
                      autoFocus
                      style={{ flex: 1, padding: '9px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${ACCENT}`, borderRadius: '9px', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'white', outline: 'none' }}
                    />
                    <button onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}
                      style={{ padding: '9px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setCreatingFolder(true); setSelectedFolder(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '9px', cursor: 'pointer', width: '100%', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                    <FolderPlus style={{ width: '14px', height: '14px' }} />
                    Create new folder
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={onClose}
                  style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!name.trim() || saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', background: name.trim() ? ACCENT : 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: name.trim() ? '#111827' : 'rgba(255,255,255,0.3)', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
                  {saving && <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />}
                  {saving ? 'Saving…' : 'Save Template'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}