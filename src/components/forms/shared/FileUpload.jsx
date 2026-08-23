import React, { useRef, useState, useMemo } from 'react';
import { uploadFile } from '@/api/supabaseClient';
import { Upload, X, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react';

const ACCENT = '#00DBC5';

// Shared upload field used by every listing Step 2 (commercial + residential).
//
// Two modes based on `field`:
//   field="photo_url"  -> multi-photo mode. Stores an ordered array in
//                         details.photo_urls, mirrors the first into
//                         details.photo_url for backwards compatibility.
//   any other field    -> single-file mode (e.g. brochure_url).
//
// Multi-photo mode adds an inline "Arrange Photos" panel: tap to reveal
// per-photo left/right controls plus a "Make main" action. First photo is
// always the hero on the match card.
export default function FileUpload({ label, accept, field, details, setDetail, hint }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [arranging, setArranging] = useState(false);
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

  // Save a new ordered photo array and keep photo_url mirrored to the first.
  const savePhotos = (next) => {
    setDetail('photo_urls', next);
    setDetail('photo_url', next[0] || '');
  };

  const uploadFiles = async (files) => {
    const fileArr = Array.isArray(files) ? files : Array.from(files || []);
    if (fileArr.length === 0) return;
    setUploading(true);
    setError('');
    try {
      // Upload resiliently: one failure shouldn't drop the whole batch.
      const results = await Promise.allSettled(
        fileArr.map(file => uploadFile(file).then(r => r.file_url))
      );
      const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.length - ok.length;

      if (isPhotos) {
        if (ok.length) savePhotos([...urls, ...ok]);
      } else if (ok.length) {
        setDetail(field, ok[0]);
      }
      if (failed > 0) setError(`${failed} file${failed > 1 ? 's' : ''} failed to upload. Please try again.`);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx) => {
    if (isPhotos) {
      savePhotos(urls.filter((_, i) => i !== idx));
    } else {
      setDetail(field, '');
    }
  };

  // Reorder helpers for the arrange panel.
  const move = (idx, dir) => {
    const next = [...urls];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    savePhotos(next);
  };
  const makeMain = (idx) => {
    if (idx === 0) return;
    const next = [...urls];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    savePhotos(next);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(Array.from(e.dataTransfer.files));
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</label>}
      {hint && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>{hint}</p>}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => ref.current.click()}
        style={{
          border: `2px dashed ${dragOver ? ACCENT : urls.length ? ACCENT + '80' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.15s', background: dragOver ? `${ACCENT}08` : 'rgba(255,255,255,0.03)',
        }}>
        <input ref={ref} type="file" accept={accept} multiple={isPhotos} className="hidden"
          onChange={e => {
            // Copy files to a plain array FIRST before clearing the input.
            // Some browsers destroy the FileList when e.target.value is reset,
            // so if we clear first the async uploadFiles gets an empty list.
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
            {isPhotos && (
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                Multiple photos supported
              </p>
            )}
          </div>
        )}
      </div>

      {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: '#f87171', margin: '2px 0 0' }}>{error}</p>}

      {/* Photo thumbnails (multi-photo mode) */}
      {isPhotos && urls.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {urls.length} photo{urls.length > 1 ? 's' : ''}
            </span>
            {urls.length > 1 && (
              <button type="button" onClick={() => setArranging(a => !a)}
                style={{ background: arranging ? `${ACCENT}18` : 'rgba(255,255,255,0.05)', border: `1px solid ${arranging ? ACCENT : 'rgba(255,255,255,0.15)'}`, borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 600, color: arranging ? ACCENT : 'rgba(255,255,255,0.7)' }}>
                {arranging ? 'Done Arranging' : 'Arrange Photos'}
              </button>
            )}
          </div>

          {/* Compact thumbnail grid (default view) */}
          {!arranging && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {urls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${idx === 0 ? ACCENT : 'rgba(255,255,255,0.15)'}`, flexShrink: 0 }}>
                  <img src={url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={e => { e.stopPropagation(); removeAt(idx); }}
                    style={{ position: 'absolute', top: '3px', right: '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '10px', height: '10px', color: 'white' }} />
                  </button>
                  {idx === 0 && (
                    <div style={{ position: 'absolute', bottom: '3px', left: '3px', fontFamily: "'Inter',sans-serif", fontSize: '9px', fontWeight: 700, color: '#0E1318', background: ACCENT, borderRadius: '3px', padding: '1px 5px' }}>MAIN</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inline arrange panel (expanded view) */}
          {arranging && (
            <div style={{ marginTop: '10px', border: `1px solid ${ACCENT}30`, borderRadius: '12px', padding: '12px', background: `${ACCENT}06` }}>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: '0 0 12px', lineHeight: 1.4 }}>
                The first photo is the main one shown on your match card. Use the arrows to reorder, or tap the star to make a photo the main one.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {urls.map((url, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '10px', background: idx === 0 ? `${ACCENT}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${idx === 0 ? ACCENT + '50' : 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ position: 'relative', width: '54px', height: '54px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={url} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', fontWeight: 600, color: idx === 0 ? ACCENT : 'rgba(255,255,255,0.7)' }}>
                        {idx === 0 ? 'Main photo' : `Photo ${idx + 1}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {idx !== 0 && (
                        <button type="button" onClick={() => makeMain(idx)} title="Make main"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex' }}>
                          <Star style={{ width: '13px', height: '13px', color: ACCENT }} />
                        </button>
                      )}
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '5px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, display: 'flex' }}>
                        <ChevronLeft style={{ width: '13px', height: '13px', color: 'white', transform: 'rotate(90deg)' }} />
                      </button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === urls.length - 1} title="Move down"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '5px', cursor: idx === urls.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === urls.length - 1 ? 0.3 : 1, display: 'flex' }}>
                        <ChevronRight style={{ width: '13px', height: '13px', color: 'white', transform: 'rotate(90deg)' }} />
                      </button>
                      <button type="button" onClick={() => removeAt(idx)} title="Remove"
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', padding: '5px', cursor: 'pointer', display: 'flex' }}>
                        <X style={{ width: '13px', height: '13px', color: '#f87171' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Single-file preview (brochure mode) */}
      {!isPhotos && urls.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>File attached</span>
          <button type="button" onClick={() => removeAt(0)} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '5px', padding: '4px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '12px', height: '12px', color: '#f87171' }} />
          </button>
        </div>
      )}
    </div>
  );
}
