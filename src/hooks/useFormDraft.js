import { useEffect, useRef, useState, useCallback } from 'react';

const PREFIX = 'propmatch:draft:';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // drafts older than a day are discarded

/**
 * Keeps an in-progress wizard alive across reloads, tab closes, and remounts.
 *
 * An agent filling out a listing is often cross-referencing an email thread or
 * another site in a second tab. Anything that remounts the wizard would
 * otherwise wipe everything they've typed. This writes the form to
 * localStorage as they go and restores it when the wizard opens again.
 *
 * @param {string}   key         Stable id for this draft, e.g. "listing:new:commercial"
 * @param {object}   formData    The wizard's current form state
 * @param {function} setFormData The wizard's state setter
 * @param {object}   [options]
 * @param {boolean}  [options.enabled=true]
 *
 * @returns {{ restored: boolean, clearDraft: function, dismissRestored: function }}
 */
export function useFormDraft(key, formData, setFormData, { enabled = true } = {}) {
  const storageKey = PREFIX + key;
  const [restored, setRestored] = useState(false);
  // Guards the save effect so it can't overwrite a stored draft with the
  // wizard's empty initial state before the restore pass has run.
  const hydrated = useRef(false);

  // ── Restore (once, on mount) ──────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || hydrated.current) return;
    hydrated.current = true;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object' || !saved.data) return;

      if (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE_MS) {
        window.localStorage.removeItem(storageKey);
        return;
      }

      setFormData(prev => ({ ...prev, ...saved.data }));
      setRestored(true);
    } catch {
      // Private browsing, quota, or corrupt JSON — drafts are a convenience,
      // never load-bearing. Fail silently and let the wizard work normally.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, storageKey]);

  // ── Save (debounced, on every change) ─────────────────────────────────────
  useEffect(() => {
    if (!enabled || !hydrated.current) return;

    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ savedAt: Date.now(), data: formData })
        );
      } catch {
        // Ignore quota errors.
      }
    }, 400);

    return () => clearTimeout(t);
  }, [enabled, storageKey, formData]);

  const clearDraft = useCallback(() => {
    try { window.localStorage.removeItem(storageKey); } catch {}
    setRestored(false);
  }, [storageKey]);

  const dismissRestored = useCallback(() => setRestored(false), []);

  return { restored, clearDraft, dismissRestored };
}

export default useFormDraft;
