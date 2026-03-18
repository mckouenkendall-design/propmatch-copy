import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

// Uses OpenStreetMap Nominatim — no API key required
export default function AddressAutocomplete({ value, onChange, placeholder = '123 Main Street' }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const containerRef = useRef(null);

  // Keep query in sync if value changes externally
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ address: val }); // immediate passthrough

    clearTimeout(timer.current);
    if (val.length < 3) { setSuggestions([]); setOpen(false); return; }

    timer.current = setTimeout(async () => {
      try {
        // Use structured search for better accuracy — search full query as street
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&countrycodes=us&q=${encodeURIComponent(val)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        // Deduplicate by display_name to avoid identical results
        const seen = new Set();
        const unique = data.filter(item => {
          const key = item.display_name;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        // Prefer results that actually contain a house number (more specific)
        const sorted = [...unique].sort((a, b) => {
          const aHas = a.address?.house_number ? 1 : 0;
          const bHas = b.address?.house_number ? 1 : 0;
          return bHas - aHas;
        });
        setSuggestions(sorted.slice(0, 6));
        setOpen(sorted.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);
  };

  const select = (item) => {
    const addr = item.address;
    const streetNum = addr.house_number || '';
    const street = addr.road || addr.pedestrian || '';
    const addressLine = [streetNum, street].filter(Boolean).join(' ') || item.display_name.split(',')[0];
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const state = addr.state || '';
    const zip = addr.postcode || '';

    setQuery(addressLine);
    setOpen(false);
    onChange({ address: addressLine, city, state: stateAbbr(state), zip_code: zip });
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((item, i) => {
            const addr = item.address;
            const line1 = [addr.house_number, addr.road || addr.pedestrian].filter(Boolean).join(' ') || item.display_name.split(',')[0];
            const line2 = [addr.city || addr.town || addr.village, addr.state, addr.postcode].filter(Boolean).join(', ');
            return (
              <button
                key={i}
                type="button"
                onMouseDown={() => select(item)}
                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{line1}</p>
                  <p className="text-xs text-gray-500">{line2}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Convert full state name to 2-letter abbreviation
const STATE_MAP = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO',
  'Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
  'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH',
  'Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
  'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  'District of Columbia':'DC'
};
function stateAbbr(name) { return STATE_MAP[name] || name; }