import React, { useRef, useState, useMemo, useCallback } from 'react';
import { uploadFile } from '@/api/supabaseClient';
import { Upload, X, Star, Loader2, GripVertical } from 'lucide-react';

const ACCENT = '#00DBC5';

// ─── Drag-and-drop Arrange Modal ─────────────────────────────────────────────
function ArrangeModal({ photos, onSave, onClose }) {
  const [items, setItems] = useState([...photos]);
  const dragIdx = useRef(null);
  const dragOverIdx = useRef(null);

  const onDragStart = (e, idx) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, idx) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };

  const onDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    setItems(next);
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  const setHero = (idx) => {
    if (idx === 0) return;
    const next = [...items];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    setItems(next);
  };

  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '700px', background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>
            Arrange Photos
          </h3>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '0 0 20px', lineHeight: 1.4 }}>
          Drag photos to reorder. The first photo is the hero shown on your match card.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto', paddingRight: '4px' }}>
          {items.map((url, idx) => (
            <div key={url} draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '12px', background: idx === 0 ? `${ACCENT}12` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${idx === 0 ? ACCENT + '50' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'grab', userSelect: 'none' }}>
              <GripVertical style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
              <div style={{ width: '72px', height: '54px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0E1318' }}>
                <img src={url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', fontWeight: 600, color: idx === 0 ? ACCENT : 'rgba(255,255,255,0.7)' }}>
                  {idx === 0 ? '★ Hero photo' : `Photo ${idx + 1}`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {idx !== 0 && (
                  <button type="button" onClick={() => setHero(idx)} title="Set as Hero"
                    style={{ background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}40`, borderRadius: '8px',
                      padding: '6px 12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 600, color: ACCENT, whiteSpace: 'nowrap' }}>
                    Set as Hero
                  </button>
                )}
                <button type="button" onClick={() => remove(idx)} title="Remove"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                  <X style={{ width: '13px', height: '13px', color: '#f87171' }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={() => { onSave(items); onClose(); }}
            style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
              background: ACCENT, color: '#0E1318', fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FileUpload ───────────────────────────────────────────────────────────────
export default function FileUpload({ label, accept, field, details, setDetail, onSavePhotos, hint }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showArrange, setShowArrange] = useState(false);
  const [error, setError] = useState('');

  const isPhotos = field === 'photo_url';

  const urls = useMemo(() => {
    if (isPhotos) {
      const arr = details['photo_urls'];
      if (Array.isArray(arr) && arr.length) return arr;
      if (details['photo_url']) return [details['photo_url']];
      return [];
    }
    return details[field] ? [details[field]] : [];
  }, [details, field, isPhotos]);

  // Read current photos fresh at save time to avoid stale closures.
  const getCurrentPhotos = useCallback(() => {
    const arr = details['photo_urls'];
    if (Array.isArray(arr) && arr.length) return arr;
    if (details['photo_url']) return [details['photo_url']];
    return [];
  }, [details]);

  const savePhotos = useCallback((next) => {
    if (onSavePhotos) {
      onSavePhotos(next);
    } else {
      setDetail('photo_urls', next);
      setDetail('photo_url', next[0] || '');
    }
  }, [onSavePhotos, setDetail]);

  const uploadFiles = async (files) => {
    const fileArr = Array.isArray(files) ? files : Array.from(files || []);
    if (fileArr.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        fileArr.map(file => uploadFile(file).then(r => r.file_url))
      );
      const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failures = results.filter(r => r.status === 'rejected');

      if (isPhotos && ok.length) {
        savePhotos([...getCurrentPhotos(), ...ok]);
      } else if (!isPhotos && ok.length) {
        setDetail(field, ok[0]);
      }

      if (failures.length > 0) {
        const msg = failures[0]?.reason?.message || String(failures[0]?.reason) || 'Unknown error';
        setError(`${failures.length} file${failures.length > 1 ? 's' : ''} failed: ${msg}`);
      }
    } catch (err) {
      setError(`Upload failed: ${err?.message || String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx) => {
    if (isPhotos) savePhotos(urls.filter((_, i) => i !== idx));
    else setDetail(field, '');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <>
      <div className="space-y-1.5">
        {label && <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</label>}
        {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>{hint}</p>}

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
          onClick={() => ref.current.click()}
          style={{ border: `2px dashed ${dragOver ? ACCENT : urls.length ? ACCENT + '80' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.15s', background: dragOver ? `${ACCENT}08` : 'rgba(255,255,255,0.03)' }}>
          <input ref={ref} type="file" accept={accept} multiple={isPhotos} className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              if (files.length) uploadFiles(files);
            }} />
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader2 style={{ width: '16px', height: '16px', color: ACCENT }} className="animate-spin" />
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Uploading…</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <Upload style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                {urls.length ? (isPhotos ? 'Add more photos' : 'Replace file') : (isPhotos ? 'Click or drag & drop photos here' : 'Click or drag & drop a file here')}
              </p>
              {isPhotos && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Multiple photos supported</p>}
            </div>
          )}
        </div>

        {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: '#f87171', margin: '2px 0 0' }}>{error}</p>}

        {/* Thumbnails */}
        {isPhotos && urls.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {urls.length} photo{urls.length > 1 ? 's' : ''}
              </span>
              {urls.length > 1 && (
                <button type="button" onClick={() => setShowArrange(true)}
                  style={{ background: 'rgba(0,219,197,0.08)', border: `1px solid ${ACCENT}40`, borderRadius: '8px',
                    padding: '5px 14px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 600, color: ACCENT }}>
                  Arrange Photos
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {urls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden',
                  border: `1px solid ${idx === 0 ? ACCENT : 'rgba(255,255,255,0.15)'}`, flexShrink: 0 }}>
                  <img src={url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={e => { e.stopPropagation(); removeAt(idx); }}
                    style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '10px', height: '10px', color: 'white' }} />
                  </button>
                  {idx === 0 && (
                    <div style={{ position: 'absolute', bottom: '3px', left: '3px', fontFamily: "'Inter',sans-serif",
                      fontSize: '9px', fontWeight: 700, color: '#0E1318', background: ACCENT, borderRadius: '3px', padding: '1px 5px' }}>
                      HERO
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Single-file preview */}
        {!isPhotos && urls.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px',
            borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1 }}>File attached</span>
            <button type="button" onClick={() => removeAt(0)}
              style={{ background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '5px', padding: '4px', cursor: 'pointer', display: 'flex' }}>
              <X style={{ width: '12px', height: '12px', color: '#f87171' }} />
            </button>
          </div>
        )}
      </div>

      {/* Arrange modal — rendered outside the form div so it's not clipped */}
      {showArrange && isPhotos && (
        <ArrangeModal
          photos={urls}
          onSave={savePhotos}
          onClose={() => setShowArrange(false)}
        />
      )}
    </>
  );
}
