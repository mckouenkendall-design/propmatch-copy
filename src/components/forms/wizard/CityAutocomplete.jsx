import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

// City/neighborhood autocomplete using Nominatim — no API key required
export default function CityAutocomplete({ value, onChange, placeholder = 'e.g. Ferndale — press Enter to add', onEnter }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    clearTimeout(timer.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }

    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(val)}&countrycodes=us&featuretype=city`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const select = (item) => {
    const addr = item.address;
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || item.display_name.split(',')[0];
    const state = stateAbbr(addr.state || '');
    const label = state ? `${city}, ${state}` : city;
    setQuery(label);
    setOpen(false);
    onChange(label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      if (onEnter && query.trim()) onEnter(query.trim());
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((item, i) => {
            const addr = item.address;
            const city = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
            const state = stateAbbr(addr.state || '');
            const label = state ? `${city}, ${state}` : city;
            return (
              <button
                key={i}
                type="button"
                onMouseDown={() => select(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-800">{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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