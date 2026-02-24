import React, { useState } from 'react';
import { X, MapPin, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MapAreaSelector from './MapAreaSelector';

export default function LocationAreaInput({ areas = [], mapAreas = [], onChange }) {
  const [input, setInput] = useState('');
  const [showMap, setShowMap] = useState(false);

  const addArea = () => {
    const val = input.trim();
    if (val && !areas.includes(val)) {
      onChange({ areas: [...areas, val], mapAreas });
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addArea(); }
  };

  return (
    <div className="space-y-2.5">
      {/* Tags */}
      {(areas.length > 0 || mapAreas.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {areas.map(area => (
            <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
              <MapPin className="w-3 h-3" />
              {area}
              <button onClick={() => onChange({ areas: areas.filter(a => a !== area), mapAreas })} className="ml-0.5 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {mapAreas.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer"
              style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}
              onClick={() => setShowMap(true)}
            >
              <Map className="w-3 h-3" />
              {mapAreas.length} map area{mapAreas.length !== 1 ? 's' : ''}
              <button
                onClick={e => { e.stopPropagation(); onChange({ areas, mapAreas: [] }); }}
                className="ml-0.5 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Ferndale" — press Enter to add'
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={() => setShowMap(true)} className="flex-shrink-0 gap-1.5">
          <Map className="w-4 h-4" />
          Draw on Map
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        Type a city or neighborhood and press Enter. Or use "Draw on Map" to draw a polygon or set a radius.
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