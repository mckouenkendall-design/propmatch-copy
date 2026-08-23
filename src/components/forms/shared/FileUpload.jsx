import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { uploadFile } from '@/api/supabaseClient';
import { Upload, X, Star, Loader2 } from 'lucide-react';

const ACCENT = '#00DBC5';

// ─── Drag-and-drop Arrange Modal (pointer-based, 3-col grid) ─────────────────
// Photos render in a responsive grid (3 per row). Dragging uses pointer events
// so we can render a floating clone that follows the cursor (the "pick up" feel)
// and show a teal insertion line at the gap where the photo will drop.
function ArrangeModal({ photos, onSave, onClose }) {
  const [items, setItems] = useState([...photos]);
  const [drag, setDrag] = useState(null);   // { idx, url, x, y, offsetX, offsetY, w, h }
  const [insertAt, setInsertAt] = useState(null);  // index where the dragged item would land
  const cellRefs = useRef([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const insertAtRef = useRef(insertAt);
  insertAtRef.current = insertAt;

  // Begin dragging a photo: capture where in the tile the user grabbed.
  const startDrag = (e, idx) => {
    e.preventDefault();
    const tile = cellRefs.current[idx];
    const rect = tile.getBoundingClientRect();
    setDrag({
      idx,
      url: items[idx],
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    });
    setInsertAt(idx);
  };

  // While dragging: move the clone and compute the insertion index by finding
  // the tile whose center is nearest-after the cursor.
  useEffect(() => {
    if (!drag) return;

    const onMove = (e) => {
      const x = e.clientX, y = e.clientY;
      setDrag(d => d ? { ...d, x, y } : d);

      const cells = cellRefs.current.filter(Boolean);
      let target = cells.length;   // default: drop at end
      for (let i = 0; i < cells.length; i++) {
        const r = cells[i].getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // Cursor is before tile i's center if it's on an earlier row,
        // or same row but left of center.
        const beforeRow = y < r.top;
        const sameRowBeforeCenter = y <= r.bottom && y >= r.top && x < cx;
        if (beforeRow || sameRowBeforeCenter) { target = i; break; }
      }
      setInsertAt(target);
    };

    const onUp = () => {
      const from = drag.idx;
      let to = insertAtRef.current;
      if (to === null) { setDrag(null); setInsertAt(null); return; }
      const next = [...itemsRef.current];
      const [moved] = next.splice(from, 1);
      if (to > from) to -= 1;   // account for the removed item shifting indices
      next.splice(to, 0, moved);
      setItems(next);
      setDrag(null);
      setInsertAt(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag]);

  const setHero = (idx) => {
    if (idx === 0) return;
    const next = [...items];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    setItems(next);
  };

  const remove = (idx) => setItems(items.filter((_, i) => i !== idx));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={() => { if (!drag) onClose(); }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '1040px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          background: '#1a1f25', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '22px', padding: '30px', boxShadow: '0 24px 70px rgba(0,0,0,0.6)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: '20px', fontWeight: 700, color: 'white', margin: 0 }}>
            Arrange Photos
          </h3>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '7px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '17px', height: '17px', color: 'rgba(255,255,255,0.6)' }} />
          </button>
        </div>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '0 0 22px', lineHeight: 1.4 }}>
          Drag photos to reorder. The first photo is the hero shown on your match card.
        </p>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', overflowY: 'auto', paddingRight: '4px', position: 'relative' }}>
          {items.map((url, idx) => {
            const isDragging = drag && drag.idx === idx;
            const showLineBefore = drag && insertAt === idx;
            return (
              <div key={url} style={{ position: 'relative' }}>
                {/* Insertion line before this tile */}
                {showLineBefore && (
                  <div style={{ position: 'absolute', left: '-9px', top: '4px', bottom: '4px', width: '3px', borderRadius: '2px',
                    background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, zIndex: 5 }} />
                )}
                <div
                  ref={el => cellRefs.current[idx] = el}
                  onPointerDown={e => startDrag(e, idx)}
                  style={{
                    position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden',
                    border: `2px solid ${idx === 0 ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'grab', touchAction: 'none', userSelect: 'none',
                    opacity: isDragging ? 0.3 : 1,
                    transition: isDragging ? 'none' : 'opacity 0.15s',
                    background: '#0E1318',
                  }}>
                  <img src={url} alt={`Photo ${idx + 1}`} draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />

                  {/* Hero badge / Set as Hero button overlaid on the image */}
                  {idx === 0 ? (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: 700, color: '#0E1318',
                      background: ACCENT, borderRadius: '6px', padding: '3px 9px', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                      <Star style={{ width: '11px', height: '11px', fill: '#0E1318' }} /> HERO
                    </div>
                  ) : (
                    <button type="button"
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setHero(idx); }}
                      style={{ position: 'absolute', bottom: '8px', left: '8px',
                        background: 'rgba(14,19,24,0.82)', backdropFilter: 'blur(4px)', border: `1px solid ${ACCENT}70`,
                        borderRadius: '7px', padding: '5px 11px', cursor: 'pointer',
                        fontFamily: "'Inter',sans-serif", fontSize: '11px', fontWeight: 600, color: ACCENT }}>
                      Set as Hero
                    </button>
                  )}

                  {/* Remove */}
                  <button type="button"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); remove(idx); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%',
                      background: 'rgba(0,0,0,0.65)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '13px', height: '13px', color: 'white' }} />
                  </button>
                </div>
                {/* Trailing insertion line (drop at very end) */}
                {drag && insertAt === items.length && idx === items.length - 1 && (
                  <div style={{ position: 'absolute', right: '-9px', top: '4px', bottom: '4px', width: '3px', borderRadius: '2px',
                    background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`, zIndex: 5 }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="button" onClick={onClose}
            style={{ flex: 1, padding: '13px', borderRadius: '11px', border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="button" onClick={() => { onSave(items); onClose(); }}
            style={{ flex: 2, padding: '13px', borderRadius: '11px', border: 'none',
              background: ACCENT, color: '#0E1318', fontFamily: "'Inter',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </div>

      {/* Floating clone that follows the cursor */}
      {drag && (
        <div style={{ position: 'fixed', left: drag.x - drag.offsetX, top: drag.y - drag.offsetY, width: drag.w, height: drag.h,
          borderRadius: '12px', overflow: 'hidden', pointerEvents: 'none', zIndex: 90,
          boxShadow: '0 18px 50px rgba(0,0,0,0.7)', transform: 'scale(1.05) rotate(-2deg)', border: `2px solid ${ACCENT}` }}>
          <img src={drag.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
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

  const getCurrentPhotos = useCallback(() => {
    const arr = details['photo_urls'];
    if (Array.isArray(arr) && arr.length) return arr;
    if (details['photo_url']) return [details['photo_url']];
    return [];
  }, [details]);

  const savePhotos = useCallback((next) => {
    if (onSavePhotos) onSavePhotos(next);
    else { setDetail('photo_urls', next); setDetail('photo_url', next[0] || ''); }
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
      if (isPhotos && ok.length) savePhotos([...getCurrentPhotos(), ...ok]);
      else if (!isPhotos && ok.length) setDetail(field, ok[0]);
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

      {showArrange && isPhotos && (
        <ArrangeModal photos={urls} onSave={savePhotos} onClose={() => setShowArrange(false)} />
      )}
    </>
  );
}
