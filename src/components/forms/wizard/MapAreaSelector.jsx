import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { X, Undo2, Save, Search, MapPin } from 'lucide-react';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TEAL = '#4FB3A9';

// ── Geocoder search bar ────────────────────────────────────────────────────────
function GeoSearch({ placeholder, onSelect, onBoundsFound }) {
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
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(val)}&countrycodes=us`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
    }, 320);
  };

  const select = (item) => {
    const addr = item.address;
    const label = [addr.house_number, addr.road].filter(Boolean).join(' ')
      || addr.city || addr.town || addr.village
      || item.display_name.split(',')[0];
    const sub = [addr.city || addr.town || addr.village, addr.state].filter(Boolean).join(', ');
    const displayLabel = sub ? `${label}, ${sub}` : label;
    setQuery(displayLabel);
    setOpen(false);

    const center = [parseFloat(item.lat), parseFloat(item.lon)];
    if (onSelect) onSelect({ label: displayLabel, center, raw: item });

    if (onBoundsFound && item.boundingbox) {
      const bb = item.boundingbox;
      const bounds = [[parseFloat(bb[0]), parseFloat(bb[2])], [parseFloat(bb[1]), parseFloat(bb[3])]];
      onBoundsFound({ name: item.display_name.split(',')[0], center, bounds });
    }
  };

  const clear = () => { setQuery(''); setSuggestions([]); setOpen(false); if (onSelect) onSelect(null); };

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder || 'Search address or city…'}
          className="flex-1 outline-none bg-transparent text-gray-800 text-sm"
          autoComplete="off"
        />
        {query && (
          <button type="button" onMouseDown={clear} className="text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((item, i) => {
            const addr = item.address;
            const line1 = [addr.house_number, addr.road].filter(Boolean).join(' ') || addr.city || addr.town || addr.village || item.display_name.split(',')[0];
            const line2 = [addr.city || addr.town, addr.state].filter(Boolean).join(', ');
            return (
              <button key={i} type="button" onMouseDown={() => select(item)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{line1}</p>
                  {line2 && <p className="text-xs text-gray-400">{line2}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Build corridor polygon ─────────────────────────────────────────────────────
function buildCorridorPolygon(points, widthMiles) {
  if (points.length < 2) return [];
  const R = 6371000;
  const offsetMeters = widthMiles * 1609.34;
  const left = [], right = [];
  for (let i = 0; i < points.length; i++) {
    const prev = i === 0 ? points[0] : points[i - 1];
    const next = i === points.length - 1 ? points[i] : points[i + 1];
    const lat1 = prev[0] * Math.PI / 180, lon1 = prev[1] * Math.PI / 180;
    const lat2 = next[0] * Math.PI / 180, lon2 = next[1] * Math.PI / 180;
    const bearing = Math.atan2(Math.sin(lon2 - lon1) * Math.cos(lat2),
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));
    const latC = points[i][0] * Math.PI / 180;
    const offsetLat = offsetMeters / R;
    const offsetLon = offsetMeters / (R * Math.cos(latC));
    left.push([points[i][0] + offsetLat * Math.sin(bearing - Math.PI / 2) * (180 / Math.PI),
               points[i][1] + offsetLon * Math.cos(bearing - Math.PI / 2) * (180 / Math.PI)]);
    right.push([points[i][0] + offsetLat * Math.sin(bearing + Math.PI / 2) * (180 / Math.PI),
                points[i][1] + offsetLon * Math.cos(bearing + Math.PI / 2) * (180 / Math.PI)]);
  }
  return [...left, ...[...right].reverse()];
}

// ── Travel isochrone ───────────────────────────────────────────────────────────
async function fetchIsochrone(lat, lng, minutes, mode) {
  const profile = mode === 'drive' ? 'car' : mode === 'bike' ? 'bike' : 'foot';
  const speedKmh = { drive: 50, walk: 5, bike: 15, transit: 30 }[mode] || 50;
  const radiusM = (speedKmh * minutes / 60) * 1000;
  const samples = 48;
  const candidates = [];
  for (let i = 0; i < samples; i++) {
    const angle = (2 * Math.PI * i) / samples;
    for (const factor of [0.4, 0.7, 1.0]) {
      const r = radiusM * factor;
      candidates.push([lat + (r / 111320) * Math.cos(angle), lng + (r / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle)]);
    }
  }
  try {
    const origin = `${lng},${lat}`;
    const dests = candidates.map(([clat, clng]) => `${clng},${clat}`).join(';');
    const dstIdxs = candidates.map((_, i) => i + 1).join(';');
    const res = await fetch(`https://router.project-osrm.org/table/v1/${profile}/${origin};${dests}?sources=0&destinations=${dstIdxs}&annotations=duration`);
    const data = await res.json();
    const durations = data.durations?.[0] || [];
    const reachable = candidates.filter((_, i) => durations[i] != null && durations[i] <= minutes * 60);
    if (reachable.length < 4) return null;
    return convexHull(reachable);
  } catch { return null; }
}

function convexHull(points) {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const cross = (O, A, B) => (A[1] - O[1]) * (B[0] - O[0]) - (A[0] - O[0]) * (B[1] - O[1]);
  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop(); upper.pop();
  return [...lower, ...upper];
}

const MODES = [
  { id: 'search',   label: 'Search Area', icon: '🔍' },
  { id: 'polygon',  label: 'Polygon',     icon: '✏️' },
  { id: 'radius',   label: 'Radius',      icon: '📍' },
  { id: 'corridor', label: 'Corridor',    icon: '🛣️' },
  { id: 'travel',   label: 'Travel Time', icon: '🚗' },
];
const TRAVEL_TIMES = [5, 10, 15, 20, 30, 40, 50, 60];
const TRAVEL_MODES = ['drive', 'walk', 'bike', 'transit'];
const TRAFFIC_OPTIONS = ['No Traffic', 'Rush Hour'];

// ── Pure Leaflet map hook ──────────────────────────────────────────────────────
function useLeafletMap(containerRef, onMapClick, isClickActive) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [42.45, -83.1],
      zoom: 9,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e) => {
      if (isClickActive) onMapClick([e.latlng.lat, e.latlng.lng]);
    };
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [isClickActive, onMapClick]);

  return mapRef;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MapAreaSelector({ existingAreas = [], onSave, onClose }) {
  const [mode, setMode] = useState('search');
  const [searchResult, setSearchResult] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [radiusCenter, setRadiusCenter] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [corridorPoints, setCorridorPoints] = useState([]);
  const [corridorWidth, setCorridorWidth] = useState(0.5);
  const [travelMinutes, setTravelMinutes] = useState(10);
  const [travelMode, setTravelMode] = useState('drive');
  const [travelTraffic, setTravelTraffic] = useState('No Traffic');
  const [travelAddress, setTravelAddress] = useState(null);
  const [travelPoly, setTravelPoly] = useState(null);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelLabel, setTravelLabel] = useState('');
  const [savedAreas, setSavedAreas] = useState(existingAreas);

  const mapContainerRef = useRef(null);
  const isClickActive = mode === 'polygon' || mode === 'radius' || mode === 'corridor';

  const handleMapClick = useCallback(([lat, lng]) => {
    if (mode === 'polygon') setPolygonPoints(p => [...p, [lat, lng]]);
    else if (mode === 'radius') setRadiusCenter([lat, lng]);
    else if (mode === 'corridor') setCorridorPoints(p => [...p, [lat, lng]]);
  }, [mode]);

  const mapRef = useLeafletMap(mapContainerRef, handleMapClick, isClickActive);

  // Track overlay layers so we can remove/re-add them
  const overlayLayersRef = useRef([]);

  const clearOverlays = () => {
    overlayLayersRef.current.forEach(l => {
      if (mapRef.current) mapRef.current.removeLayer(l);
    });
    overlayLayersRef.current = [];
  };

  const addOverlay = (layer) => {
    if (mapRef.current) {
      layer.addTo(mapRef.current);
      overlayLayersRef.current.push(layer);
    }
  };

  // Re-draw all overlays whenever relevant state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clearOverlays();

    const opts = { color: TEAL, weight: 2, fillOpacity: 0.2 };

    // Polygon in progress
    polygonPoints.forEach(pt => addOverlay(L.marker(pt)));
    if (polygonPoints.length >= 3) addOverlay(L.polygon(polygonPoints, opts));

    // Radius in progress
    if (radiusCenter) {
      addOverlay(L.marker(radiusCenter));
      addOverlay(L.circle(radiusCenter, { radius: radiusMiles * 1609.34, ...opts }));
    }

    // Search result bounds
    if (searchResult) {
      const b = searchResult.bounds;
      addOverlay(L.polygon([
        [b[0][0], b[0][1]], [b[0][0], b[1][1]],
        [b[1][0], b[1][1]], [b[1][0], b[0][1]],
      ], { ...opts, dashArray: '6 4' }));
    }

    // Corridor
    if (corridorPoints.length >= 1) {
      corridorPoints.forEach(pt => addOverlay(L.marker(pt)));
      if (corridorPoints.length >= 2) {
        addOverlay(L.polyline(corridorPoints, { color: TEAL, weight: 3, dashArray: '6 4' }));
        const poly = buildCorridorPolygon(corridorPoints, corridorWidth);
        if (poly.length >= 3) addOverlay(L.polygon(poly, opts));
      }
    }

    // Travel isochrone
    if (travelPoly && travelAddress) {
      addOverlay(L.marker(travelAddress.center));
      if (travelPoly.type === 'circle') {
        addOverlay(L.circle(travelPoly.center, { radius: travelPoly.radius, ...opts }));
      } else {
        addOverlay(L.polygon(travelPoly, opts));
      }
    }

    // Saved areas
    savedAreas.forEach(area => {
      const savedOpts = { color: TEAL, weight: 2, fillOpacity: 0.25 };
      if (area.type === 'polygon') addOverlay(L.polygon(area.points, savedOpts));
      else if (area.type === 'radius') addOverlay(L.circle(area.center, { radius: area.miles * 1609.34, ...savedOpts }));
      else if (area.type === 'bounds') {
        const b = area.bounds;
        addOverlay(L.polygon([
          [b[0][0], b[0][1]], [b[0][0], b[1][1]],
          [b[1][0], b[1][1]], [b[1][0], b[0][1]],
        ], savedOpts));
      }
    });
  }, [polygonPoints, radiusCenter, radiusMiles, searchResult, corridorPoints, corridorWidth, travelPoly, travelAddress, savedAreas]);

  // Fit bounds when search result arrives
  useEffect(() => {
    if (!mapRef.current || !searchResult) return;
    const b = searchResult.bounds;
    mapRef.current.fitBounds([[b[0][0], b[0][1]], [b[1][0], b[1][1]]], { padding: [40, 40] });
  }, [searchResult]);

  // Fit bounds when travel poly arrives
  useEffect(() => {
    if (!mapRef.current || !travelPoly || travelPoly.type === 'circle') return;
    mapRef.current.fitBounds(travelPoly.map(p => [p[0], p[1]]), { padding: [40, 40] });
  }, [travelPoly]);

  const switchMode = (m) => {
    setMode(m);
    setPolygonPoints([]);
    setRadiusCenter(null);
    setSearchResult(null);
    setCorridorPoints([]);
    setTravelPoly(null);
  };

  const corridorPoly = corridorPoints.length >= 2 ? buildCorridorPolygon(corridorPoints, corridorWidth) : [];

  const applyTravel = async () => {
    if (!travelAddress) return;
    setTravelLoading(true);
    setTravelPoly(null);
    const [lat, lng] = travelAddress.center;
    const poly = await fetchIsochrone(lat, lng, travelMinutes, travelMode);
    setTravelLoading(false);
    if (poly) {
      setTravelPoly(poly);
      setTravelLabel(`${travelMinutes} min ${travelMode} from ${travelAddress.label.split(',')[0]}`);
    } else {
      const speedKmh = { drive: 50, walk: 5, bike: 15, transit: 30 }[travelMode] || 50;
      const r = (speedKmh * travelMinutes / 60) * 1000;
      setTravelPoly({ type: 'circle', center: travelAddress.center, radius: r });
      setTravelLabel(`${travelMinutes} min ${travelMode} from ${travelAddress.label.split(',')[0]}`);
    }
  };

  const canSave =
    (mode === 'search' && !!searchResult) ||
    (mode === 'polygon' && polygonPoints.length >= 3) ||
    (mode === 'radius' && !!radiusCenter) ||
    (mode === 'corridor' && corridorPoints.length >= 2) ||
    (mode === 'travel' && !!travelPoly);

  const saveArea = () => {
    if (mode === 'search' && searchResult) {
      setSavedAreas(p => [...p, { type: 'bounds', bounds: searchResult.bounds, center: searchResult.center, label: searchResult.name }]);
      setSearchResult(null);
    } else if (mode === 'polygon' && polygonPoints.length >= 3) {
      setSavedAreas(p => [...p, { type: 'polygon', points: polygonPoints, label: `Polygon ${p.length + 1}` }]);
      setPolygonPoints([]);
    } else if (mode === 'radius' && radiusCenter) {
      setSavedAreas(p => [...p, { type: 'radius', center: radiusCenter, miles: radiusMiles, label: `${radiusMiles}mi radius` }]);
      setRadiusCenter(null);
    } else if (mode === 'corridor' && corridorPoints.length >= 2) {
      setSavedAreas(p => [...p, { type: 'polygon', points: corridorPoly, label: `${corridorWidth}mi corridor` }]);
      setCorridorPoints([]);
    } else if (mode === 'travel' && travelPoly) {
      if (travelPoly.type === 'circle') {
        setSavedAreas(p => [...p, { type: 'radius', center: travelPoly.center, miles: travelPoly.radius / 1609.34, label: travelLabel }]);
      } else {
        setSavedAreas(p => [...p, { type: 'polygon', points: travelPoly, label: travelLabel }]);
      }
      setTravelPoly(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden" style={{ maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">Select Search Area</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b bg-white flex-shrink-0 overflow-x-auto">
          {MODES.map(tab => (
            <button key={tab.id} type="button" onClick={() => switchMode(tab.id)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                borderColor: mode === tab.id ? TEAL : 'transparent',
                color: mode === tab.id ? TEAL : '#6b7280',
                backgroundColor: mode === tab.id ? '#f0fdfb' : 'transparent',
              }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Controls panel */}
        <div className="px-5 py-3 bg-gray-50 border-b flex-shrink-0">
          {mode === 'search' && (
            <GeoSearch
              placeholder="Search a city, neighborhood, or zip code…"
              onBoundsFound={(r) => setSearchResult(r)}
            />
          )}
          {mode === 'polygon' && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600 flex-1">
                Click on the map to place polygon vertices (minimum 3).
                {polygonPoints.length > 0 && <span style={{ color: TEAL }}> {polygonPoints.length} point{polygonPoints.length !== 1 ? 's' : ''}</span>}
              </p>
              <Button variant="outline" size="sm" onClick={() => setPolygonPoints(p => p.slice(0, -1))} disabled={!polygonPoints.length}>
                <Undo2 className="w-3 h-3 mr-1" /> Undo
              </Button>
            </div>
          )}
          {mode === 'radius' && (
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-gray-600 flex-1">Click the map to set a center point.</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-20">Radius: {radiusMiles} mi</span>
                <input type="range" min="0.5" max="50" step="0.5"
                  value={radiusMiles} onChange={e => setRadiusMiles(parseFloat(e.target.value))}
                  className="w-36" style={{ accentColor: TEAL }} />
              </div>
            </div>
          )}
          {mode === 'corridor' && (
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-gray-600 flex-1">
                Click points along a corridor. A buffer zone will be drawn on both sides.
                {corridorPoints.length > 0 && <span style={{ color: TEAL }}> {corridorPoints.length} point{corridorPoints.length !== 1 ? 's' : ''}</span>}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Width: {corridorWidth} mi</span>
                <input type="range" min="0.1" max="5" step="0.1"
                  value={corridorWidth} onChange={e => setCorridorWidth(parseFloat(e.target.value))}
                  className="w-32" style={{ accentColor: TEAL }} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setCorridorPoints(p => p.slice(0, -1))} disabled={!corridorPoints.length}>
                <Undo2 className="w-3 h-3 mr-1" /> Undo
              </Button>
            </div>
          )}
          {mode === 'travel' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <span className="font-medium">Find properties within a</span>
                <select value={travelMinutes} onChange={e => setTravelMinutes(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none" style={{ color: TEAL }}>
                  {TRAVEL_TIMES.map(t => <option key={t} value={t}>{t === 60 ? '1 hour' : `${t} minute`}</option>)}
                </select>
                <select value={travelMode} onChange={e => setTravelMode(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none" style={{ color: TEAL }}>
                  {TRAVEL_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
                <span className="font-medium">in</span>
                <select value={travelTraffic} onChange={e => setTravelTraffic(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none" style={{ color: TEAL }}>
                  {TRAFFIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <span className="font-medium">from</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <GeoSearch placeholder="Enter an address or location…" onSelect={(r) => setTravelAddress(r)} />
                </div>
                <Button onClick={applyTravel} disabled={!travelAddress || travelLoading}
                  className="text-white flex-shrink-0" style={{ backgroundColor: TEAL }}>
                  {travelLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Calculating…
                    </span>
                  ) : 'Apply'}
                </Button>
              </div>
              {travelPoly && <p className="text-xs font-medium" style={{ color: TEAL }}>✓ {travelLabel} — click "Add Area" below to save.</p>}
            </div>
          )}
        </div>

        {/* Map — pure Leaflet via ref */}
        <div ref={mapContainerRef} style={{ height: 380, width: '100%', flexShrink: 0 }} />

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex-shrink-0 space-y-3">
          {savedAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedAreas.map((area, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
                  {area.label}
                  <button type="button" onClick={() => setSavedAreas(p => p.filter((_, j) => j !== i))} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <Button size="sm" onClick={saveArea} disabled={!canSave}
              className="gap-1 text-white" style={{ backgroundColor: canSave ? TEAL : undefined }}>
              <Save className="w-3 h-3" /> Add Area
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button className="text-white" style={{ backgroundColor: TEAL }}
                onClick={() => { onSave(savedAreas); onClose(); }}>
                Confirm{savedAreas.length > 0 ? ` (${savedAreas.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}