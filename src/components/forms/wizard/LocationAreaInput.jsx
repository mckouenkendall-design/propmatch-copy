import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LocationAreaInput({ areas = [], mapAreas = [], onChange }) {
  const [input, setInput] = useState('');

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
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map(area => (
            <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
              <MapPin className="w-3 h-3" />
              {area}
              <button onClick={() => onChange({ areas: areas.filter(a => a !== area), mapAreas })} className="ml-0.5 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Ferndale" — press Enter to add'
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={addArea} className="flex-shrink-0">
          Add
        </Button>
      </div>
      <p className="text-xs text-gray-400">Press Enter or click Add after each city or neighborhood.</p>
    </div>
  );
}