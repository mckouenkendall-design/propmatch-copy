import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, uploadFile } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderOpen, FileText, Plus, Upload, MoreVertical, Trash2, Pencil, ChevronRight, Home, ExternalLink, Loader2 } from 'lucide-react';

const ACCENT = '#00DBC5';
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB

export default function ResourceLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Breadcrumb path of folders we've navigated into. Empty = root.
  // Each entry: { id, title }
  const [path, setPath] = useState([]);
  const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;

  const [showNewMenu, setShowNewMenu] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Fetch items in the current folder for this brokerage.
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['resourceLibrary', user?.brokerage_id, currentFolderId],
    queryFn: async () => {
      let query = supabase.from('team_resources').select('*').eq('brokerage_id', user?.brokerage_id);
      // parent_id null = root level; otherwise items inside the current folder
      query = currentFolderId ? query.eq('parent_id', currentFolderId) : query.is('parent_id', null);
      const rows = await query;
      return Array.isArray(rows) ? rows : [];
    },
    enabled: !!user?.brokerage_id,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['resourceLibrary', user?.brokerage_id, currentFolderId] });

  // Create a folder
  const createFolderMutation = useMutation({
    mutationFn: async (name) => {
      return await supabase.from('team_resources').insert({
        brokerage_id: user?.brokerage_id,
        title: name,
        is_folder: true,
        parent_id: currentFolderId,
        uploaded_by_name: user?.full_name || user?.email,
        uploaded_by_email: user?.email,
      }).select();
    },
    onSuccess: () => { setCreatingFolder(false); setNewFolderName(''); refresh(); },
    onError: (err) => alert('Could not create folder: ' + (err?.message || 'Unknown error')),
  });

  // Upload a file
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert('File is too large. Maximum size is 50MB.');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      await supabase.from('team_resources').insert({
        brokerage_id: user?.brokerage_id,
        title: file.name,
        file_name: file.name,
        file_url,
        is_folder: false,
        parent_id: currentFolderId,
        uploaded_by_name: user?.full_name || user?.email,
        uploaded_by_email: user?.email,
      }).select();
      refresh();
    } catch (err) {
      alert('Could not upload file: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Delete (folder cascade is handled by the DB foreign key on delete cascade)
  const deleteMutation = useMutation({
    mutationFn: async (id) => await supabase.from('team_resources').delete().eq('id', id),
    onSuccess: () => { setMenuOpenId(null); refresh(); },
    onError: (err) => alert('Could not delete: ' + (err?.message || 'Unknown error')),
  });

  // Rename
  const renameMutation = useMutation({
    mutationFn: async ({ id, title }) => await supabase.from('team_resources').update({ title }).eq('id', id).select(),
    onSuccess: () => { setRenamingId(null); setRenameValue(''); refresh(); },
    onError: (err) => alert('Could not rename: ' + (err?.message || 'Unknown error')),
  });

  const enterFolder = (item) => setPath([...path, { id: item.id, title: item.title }]);
  const goToCrumb = (index) => setPath(index < 0 ? [] : path.slice(0, index + 1));

  const folders = items.filter(i => i.is_folder).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  const files = items.filter(i => !i.is_folder).sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', position: 'relative',
  };

  return (
    <div onClick={() => { setShowNewMenu(false); setMenuOpenId(null); }}>
      {/* Top bar: breadcrumb + New button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Inter', sans-serif", fontSize: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => goToCrumb(-1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: path.length === 0 ? ACCENT : 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
            <Home style={{ width: '15px', height: '15px' }} /> Library
          </button>
          {path.map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.3)' }} />
              <button onClick={() => goToCrumb(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === path.length - 1 ? ACCENT : 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", fontSize: '14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {crumb.title}
              </button>
            </span>
          ))}
        </div>

        {/* New button + dropdown */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: ACCENT, color: '#111827', border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer' }}
          >
            {uploading ? <Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /> : <Plus style={{ width: '16px', height: '16px' }} />}
            {uploading ? 'Uploading…' : 'New'}
          </button>
          {showNewMenu && !uploading && (
            <div style={{ position: 'absolute', top: '44px', right: 0, background: '#1a2127', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px', minWidth: '180px', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              <button
                onClick={() => { setShowNewMenu(false); setCreatingFolder(true); }}
                style={menuItemStyle}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Folder style={{ width: '16px', height: '16px', color: ACCENT }} /> New Folder
              </button>
              <button
                onClick={() => { setShowNewMenu(false); fileInputRef.current?.click(); }}
                style={menuItemStyle}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Upload style={{ width: '16px', height: '16px', color: ACCENT }} /> Upload File
              </button>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />

      {/* Inline new-folder creator */}
      {creatingFolder && (
        <div style={{ ...rowStyle, marginBottom: '12px' }} onClick={(e) => e.stopPropagation()}>
          <Folder style={{ width: '20px', height: '20px', color: ACCENT, flexShrink: 0 }} />
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim()); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); } }}
            placeholder="Folder name"
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '6px 10px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '14px', outline: 'none' }}
          />
          <button onClick={() => newFolderName.trim() && createFolderMutation.mutate(newFolderName.trim())} disabled={!newFolderName.trim()} style={{ padding: '6px 14px', background: newFolderName.trim() ? ACCENT : 'rgba(255,255,255,0.08)', color: newFolderName.trim() ? '#111827' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: newFolderName.trim() ? 'pointer' : 'not-allowed' }}>Create</button>
          <button onClick={() => { setCreatingFolder(false); setNewFolderName(''); }} style={{ padding: '6px 14px', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 style={{ width: '24px', height: '24px', color: ACCENT, animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && folders.length === 0 && files.length === 0 && !creatingFolder && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <FolderOpen style={{ width: '40px', height: '40px', color: 'rgba(255,255,255,0.2)', margin: '0 auto 14px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '15px', marginBottom: '6px' }}>
            {path.length === 0 ? 'Your resource library is empty' : 'This folder is empty'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
            Click New to create a folder or upload a file.
          </p>
        </div>
      )}

      {/* Items - card grid */}
      {!isLoading && (folders.length > 0 || files.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
          {[...folders, ...files].map(item => (
            <div
              key={item.id}
              onClick={() => {
                if (renamingId === item.id) return;
                if (item.is_folder) enterFolder(item);
                else if (item.file_url) window.open(item.file_url, '_blank');
              }}
              style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px 14px',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                minHeight: '110px',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,219,197,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {/* Three-dot menu, top-right corner */}
              <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(255,255,255,0.45)', display: 'flex', borderRadius: '4px' }}
                >
                  <MoreVertical style={{ width: '16px', height: '16px' }} />
                </button>
                {menuOpenId === item.id && (
                  <div style={{ position: 'absolute', top: '26px', right: 0, background: '#1a2127', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px', minWidth: '150px', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setMenuOpenId(null); setRenamingId(item.id); setRenameValue(item.title || ''); }}
                      style={menuItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Pencil style={{ width: '15px', height: '15px' }} /> Rename
                    </button>
                    <button
                      onClick={() => {
                        const msg = item.is_folder
                          ? 'Delete this folder and everything inside it? This cannot be undone.'
                          : 'Delete this file? This cannot be undone.';
                        if (window.confirm(msg)) deleteMutation.mutate(item.id);
                      }}
                      style={{ ...menuItemStyle, color: '#ff6b6b' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Trash2 style={{ width: '15px', height: '15px' }} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Icon */}
              {item.is_folder
                ? <Folder style={{ width: '34px', height: '34px', color: ACCENT, marginBottom: '10px' }} />
                : <FileText style={{ width: '34px', height: '34px', color: 'rgba(255,255,255,0.55)', marginBottom: '10px' }} />}

              {/* Name (or rename input) */}
              {renamingId === item.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { if (e.key === 'Enter' && renameValue.trim()) renameMutation.mutate({ id: item.id, title: renameValue.trim() }); if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); } }}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '4px 8px', color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '13px', outline: 'none' }}
                />
              ) : (
                <>
                  <div style={{ color: 'white', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, lineHeight: '1.3', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '11px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 10px',
  background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer',
  color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif", fontSize: '13px', textAlign: 'left',
};
