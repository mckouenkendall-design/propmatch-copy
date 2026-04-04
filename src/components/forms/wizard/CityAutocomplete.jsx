import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

// Uses Photon (Komoot) geocoder — much better than Nominatim, no API key needed
export default function CityAutocomplete({ value, onChange, placeholder = 'e.g. Ferndale, MI', onEnter, onSelect }) {
  const [query, setQuery]           = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]             = useState(false);
  const timer     = useRef(null);
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
        // Photon geocoder — excellent US city results, completely free, no key
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=7&lang=en&layer=city&layer=state`,
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();

        // Filter to US results with actual city/town names
        const features = (data.features || []).filter(f => {
          const p = f.properties;
          return p.countrycode === 'US' && (p.city || p.name) && p.state;
        });

        setSuggestions(features);
        setOpen(features.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const formatLabel = (feature) => {
    const p = feature.properties;
    const city = p.name || p.city || '';
    const state = stateAbbr(p.state || '');
    return state ? `${city}, ${state}` : city;
  };

  const select = (feature) => {
    const label = formatLabel(feature);
    setQuery(label);
    setSuggestions([]);
    setOpen(false);
    onChange(label);
    // Immediately add as a selected area — no Enter needed
    if (onSelect) onSelect(label);
    else if (onEnter) onEnter(label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setOpen(false);
      if (onEnter && query.trim()) onEnter(query.trim());
    }
    if (e.key === 'Escape') setOpen(false);
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
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
      />
      {open && suggestions.length > 0 && (
        <div style={{ position:'absolute', zIndex:9999, top:'calc(100% + 4px)', left:0, right:0, background:'#161d25', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', boxShadow:'0 12px 40px rgba(0,0,0,0.5)', overflow:'hidden' }}>
          {suggestions.map((feature, i) => {
            const p = feature.properties;
            const label = formatLabel(feature);
            const sub = [p.county, stateAbbr(p.state)].filter(Boolean).join(', ');
            return (
              <button key={i} type="button" onMouseDown={() => select(feature)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'transparent', border:'none', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor:'pointer', textAlign:'left', transition:'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,219,197,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <MapPin style={{ width:'14px', height:'14px', color:'#00DBC5', flexShrink:0 }}/>
                <div>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:500, color:'white', margin:0 }}>{label}</p>
                  {sub && <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)', margin:0 }}>{sub}</p>}
                </div>
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