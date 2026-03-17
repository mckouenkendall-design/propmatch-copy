import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Undo2, Save, Search, MapPin } from 'lucide-react';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Handles click events on the map
function ClickHandler({ onMapClick, active }) {
  useMapEvents({
    click: (e) => { if (active) onMapClick([e.latlng.lat, e.latlng.lng]); }
  });
  return null;
}

// Flies map to a given location
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom || 12, { duration: 1.2 });
  }, [target]);
  return null;
}

// Search bar that geocodes a place name and flies the map to it
function MapSearchBar({ onBoundsFound }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timer.current);
    if (val.length < 2) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(val)}&countrycodes=us`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
    }, 300);
  };

  const select = async (item) => {
    setQuery(item.display_name.split(',').slice(0, 2).join(','));
    setOpen(false);
    // Try to get the boundary polygon via OSM relation
    const bbox = item.boundingbox; // [minLat, maxLat, minLon, maxLon]
    if (bbox) {
      const center = [parseFloat(item.lat), parseFloat(item.lon)];
      const bounds = [[parseFloat(bbox[0]), parseFloat(bbox[2])], [parseFloat(bbox[1]), parseFloat(bbox[3])]];
      onBoundsFound({ center, bounds, name: item.display_name.split(',')[0], osm_id: item.osm_id, osm_type: item.osm_type });
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 shadow px-3 py-2">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search a neighborhood or city…"
          className="flex-1 text-sm outline-none bg-transparent"
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="absolute z-[500] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((item, i) => {
            const addr = item.address;
            const label = addr.city || addr.town || addr.village || addr.suburb || item.display_name.split(',')[0];
            const sub = [addr.county, addr.state].filter(Boolean).join(', ');
            return (
              <button
                key={i}
                type="button"
                onMouseDown={() => select(item)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MapAreaSelector({ existingAreas = [], onSave, onClose }) {
  const [mode, setMode] = useState('search'); // 'search' | 'polygon' | 'radius'
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [radiusCenter, setRadiusCenter] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [savedAreas, setSavedAreas] = useState(existingAreas);
  const [flyTarget, setFlyTarget] = useState(null);
  const [searchResult, setSearchResult] = useState(null); // highlighted bounding area

  const handleMapClick = ([lat, lng]) => {
    if (mode === 'polygon') setPolygonPoints(prev => [...prev, [lat, lng]]);
    else if (mode === 'radius') setRadiusCenter([lat, lng]);
  };

  const canSave =
    (mode === 'polygon' && polygonPoints.length >= 3) ||
    (mode === 'radius' && !!radiusCenter) ||
    (mode === 'search' && !!searchResult);

  const saveArea = () => {
    if (mode === 'polygon' && polygonPoints.length >= 3) {
      setSavedAreas(prev => [...prev, { type: 'polygon', points: polygonPoints, label: `Polygon ${prev.length + 1}` }]);
      setPolygonPoints([]);
    } else if (mode === 'radius' && radiusCenter) {
      setSavedAreas(prev => [...prev, { type: 'radius', center: radiusCenter, miles: radiusMiles, label: `${radiusMiles}mi radius` }]);
      setRadiusCenter(null);
    } else if (mode === 'search' && searchResult) {
      setSavedAreas(prev => [...prev, { type: 'bounds', bounds: searchResult.bounds, center: searchResult.center, label: searchResult.name }]);
      setSearchResult(null);
    }
  };

  const handleSearchResult = (result) => {
    setSearchResult(result);
    setFlyTarget({ center: result.center, zoom: 12 });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">Select Search Area</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b px-5 bg-white flex-shrink-0">
          {[
            { id: 'search', label: '🔍 Search Area' },
            { id: 'polygon', label: '✏️ Draw Polygon' },
            { id: 'radius', label: '📍 Set Radius' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setMode(tab.id); setPolygonPoints([]); setRadiusCenter(null); setSearchResult(null); }}
              className="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor: mode === tab.id ? 'var(--tiffany-blue)' : 'transparent',
                color: mode === tab.id ? 'var(--tiffany-blue)' : '#6b7280',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instructions / controls above map */}
        <div className="px-5 py-3 bg-gray-50 border-b flex-shrink-0">
          {mode === 'search' && (
            <MapSearchBar onBoundsFound={handleSearchResult} />
          )}
          {mode === 'polygon' && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600 flex-1">
                Click on the map to add points.
                {polygonPoints.length > 0 && <span style={{ color: 'var(--tiffany-blue)' }}> {polygonPoints.length} point{polygonPoints.length !== 1 ? 's' : ''} — need at least 3.</span>}
              </p>
              <Button variant="outline" size="sm" onClick={() => setPolygonPoints(p => p.slice(0, -1))} disabled={!polygonPoints.length}>
                <Undo2 className="w-3 h-3 mr-1" /> Undo
              </Button>
            </div>
          )}
          {mode === 'radius' && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600 flex-1">
                Click the map to set a center point.
              </p>
              <span className="text-sm text-gray-700 font-medium">Radius: {radiusMiles} mi</span>
              <input
                type="range" min="0.5" max="50" step="0.5"
                value={radiusMiles}
                onChange={e => setRadiusMiles(parseFloat(e.target.value))}
                className="w-32"
                style={{ accentColor: 'var(--tiffany-blue)' }}
              />
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0" style={{ height: 380 }}>
          <MapContainer
            center={[42.45, -83.1]}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
            cursor={mode !== 'search' ? 'crosshair' : 'grab'}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ClickHandler onMapClick={handleMapClick} active={mode === 'polygon' || mode === 'radius'} />
            <FlyTo target={flyTarget} />

            {/* In-progress polygon */}
            {polygonPoints.map((pt, i) => <Marker key={`pp${i}`} position={pt} />)}
            {polygonPoints.length >= 3 && (
              <Polygon positions={polygonPoints} pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.2 }} />
            )}

            {/* In-progress radius */}
            {radiusCenter && (
              <>
                <Marker position={radiusCenter} />
                <Circle center={radiusCenter} radius={radiusMiles * 1609.34} pathOptions={{ color: '#4FB3A9', fillOpacity: 0.2 }} />
              </>
            )}

            {/* Search result bounding box preview */}
            {searchResult && (
              <Polygon
                positions={[
                  [searchResult.bounds[0][0], searchResult.bounds[0][1]],
                  [searchResult.bounds[0][0], searchResult.bounds[1][1]],
                  [searchResult.bounds[1][0], searchResult.bounds[1][1]],
                  [searchResult.bounds[1][0], searchResult.bounds[0][1]],
                ]}
                pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.2, dashArray: '6 4' }}
              />
            )}

            {/* Saved areas */}
            {savedAreas.map((area, i) => {
              if (area.type === 'polygon')
                return <Polygon key={`sa${i}`} positions={area.points} pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.25 }} />;
              if (area.type === 'radius')
                return <Circle key={`sa${i}`} center={area.center} radius={area.miles * 1609.34} pathOptions={{ color: '#4FB3A9', fillOpacity: 0.25 }} />;
              if (area.type === 'bounds')
                return (
                  <Polygon key={`sa${i}`}
                    positions={[
                      [area.bounds[0][0], area.bounds[0][1]],
                      [area.bounds[0][0], area.bounds[1][1]],
                      [area.bounds[1][0], area.bounds[1][1]],
                      [area.bounds[1][0], area.bounds[0][1]],
                    ]}
                    pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.25 }}
                  />
                );
              return null;
            })}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex-shrink-0 space-y-3">
          {/* Saved area chips */}
          {savedAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedAreas.map((area, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
                  {area.label}
                  <button type="button" onClick={() => setSavedAreas(p => p.filter((_, j) => j !== i))} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              size="sm"
              onClick={saveArea}
              disabled={!canSave}
              className="text-white gap-1"
              style={{ backgroundColor: canSave ? 'var(--tiffany-blue)' : undefined }}
            >
              <Save className="w-3 h-3" /> Add Area
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                className="text-white"
                style={{ backgroundColor: 'var(--tiffany-blue)' }}
                onClick={() => { onSave(savedAreas); onClose(); }}
              >
                Confirm {savedAreas.length > 0 ? `(${savedAreas.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}