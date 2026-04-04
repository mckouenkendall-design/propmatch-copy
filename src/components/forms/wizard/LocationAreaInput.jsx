import React, { useState } from 'react';
import { X, MapPin, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CityAutocomplete from './CityAutocomplete';
import MapAreaSelector from './MapAreaSelector';

const ACCENT = '#00DBC5';

export default function LocationAreaInput({ areas = [], mapAreas = [], onChange }) {
  const [input, setInput] = useState('');
  const [showMap, setShowMap] = useState(false);

  const addArea = (val) => {
    const trimmed = (val || input).trim();
    if (trimmed && !areas.includes(trimmed)) {
      onChange({ areas: [...areas, trimmed], mapAreas });
      setInput('');
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Tags */}
      {(areas.length > 0 || mapAreas.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {areas.map(area => (
            <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: 'rgba(0,219,197,0.12)', border: '1px solid rgba(0,219,197,0.3)', color: ACCENT }}>
              <MapPin className="w-3 h-3" />
              {area}
              <button onClick={() => onChange({ areas: areas.filter(a => a !== area), mapAreas })}
                className="ml-0.5" style={{ color: 'rgba(0,219,197,0.6)', lineHeight:0 }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,219,197,0.6)'}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {mapAreas.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer"
              style={{ background: 'rgba(0,219,197,0.12)', border: '1px solid rgba(0,219,197,0.3)', color: ACCENT }}
              onClick={() => setShowMap(true)}>
              <Map className="w-3 h-3" />
              {mapAreas.length} map area{mapAreas.length !== 1 ? 's' : ''}
              <button onClick={e => { e.stopPropagation(); onChange({ areas, mapAreas: [] }); }}
                style={{ color: 'rgba(0,219,197,0.6)', lineHeight:0 }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,219,197,0.6)'}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <CityAutocomplete
          value={input}
          onChange={setInput}
          onSelect={addArea}
          onEnter={addArea}
          placeholder="e.g. Ferndale, MI"
        />
        <Button type="button" variant="outline" onClick={() => setShowMap(true)} className="flex-shrink-0 gap-1.5">
          <Map className="w-4 h-4" />
          Draw on Map
        </Button>
      </div>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Type a city and click a suggestion to add it. Use "Draw on Map" for custom areas.
      </p>

      {showMap && (
        <MapAreaSelector
          existingAreas={mapAreas}
          onSave={(newMapAreas) => onChange({ areas, mapAreas: newMapAreas })}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
}