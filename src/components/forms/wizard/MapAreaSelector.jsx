import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { X, Undo2, Save } from 'lucide-react';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function MapAreaSelector({ existingAreas = [], onSave, onClose }) {
  const [mode, setMode] = useState('polygon');
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [radiusCenter, setRadiusCenter] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [savedAreas, setSavedAreas] = useState(existingAreas);

  const handleMapClick = ([lat, lng]) => {
    if (mode === 'polygon') setPolygonPoints(prev => [...prev, [lat, lng]]);
    else setRadiusCenter([lat, lng]);
  };

  const canSave = mode === 'polygon' ? polygonPoints.length >= 3 : !!radiusCenter;

  const saveArea = () => {
    if (mode === 'polygon' && polygonPoints.length >= 3) {
      setSavedAreas(prev => [...prev, { type: 'polygon', points: polygonPoints }]);
      setPolygonPoints([]);
    } else if (mode === 'radius' && radiusCenter) {
      setSavedAreas(prev => [...prev, { type: 'radius', center: radiusCenter, miles: radiusMiles }]);
      setRadiusCenter(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-white">
          <h3 className="text-lg font-bold text-gray-800">Draw Search Area</h3>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              {['polygon', 'radius'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setPolygonPoints([]); setRadiusCenter(null); }}
                  className="px-4 py-2 text-sm font-medium transition-colors"
                  style={mode === m
                    ? { backgroundColor: 'var(--tiffany-blue)', color: 'white' }
                    : { backgroundColor: 'white', color: '#6b7280' }
                  }
                >
                  {m === 'polygon' ? 'Draw Polygon' : 'Set Radius'}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
          </div>
        </div>

        {/* Map */}
        <div style={{ height: 400, cursor: 'crosshair', zIndex: 1 }}>
          <MapContainer center={[42.45, -83.1]} zoom={9} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ClickHandler onMapClick={handleMapClick} />

            {/* In-progress polygon points */}
            {polygonPoints.map((pt, i) => <Marker key={`pp${i}`} position={pt} />)}
            {polygonPoints.length >= 3 && (
              <Polygon positions={polygonPoints} pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.15 }} />
            )}

            {/* In-progress radius */}
            {radiusCenter && (
              <>
                <Marker position={radiusCenter} />
                <Circle center={radiusCenter} radius={radiusMiles * 1609.34} pathOptions={{ color: '#4FB3A9', fillOpacity: 0.15 }} />
              </>
            )}

            {/* Saved areas */}
            {savedAreas.map((area, i) =>
              area.type === 'polygon'
                ? <Polygon key={`sa${i}`} positions={area.points} pathOptions={{ color: '#4FB3A9', weight: 2, fillOpacity: 0.25 }} />
                : <Circle key={`sa${i}`} center={area.center} radius={area.miles * 1609.34} pathOptions={{ color: '#4FB3A9', fillOpacity: 0.25 }} />
            )}
          </MapContainer>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            {mode === 'polygon' ? (
              <>
                <p className="text-sm text-gray-600 flex-1">
                  Click map to add vertices — need at least 3 points.
                  {polygonPoints.length > 0 && (
                    <span style={{ color: 'var(--tiffany-blue)' }}> ({polygonPoints.length} pts)</span>
                  )}
                </p>
                <Button variant="outline" size="sm" onClick={() => setPolygonPoints(p => p.slice(0, -1))} disabled={!polygonPoints.length}>
                  <Undo2 className="w-3 h-3 mr-1" /> Undo
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 flex-1">
                  Click map to set center point. Radius: <strong>{radiusMiles} mi</strong>
                </p>
                <input
                  type="range" min="0.5" max="50" step="0.5"
                  value={radiusMiles}
                  onChange={e => setRadiusMiles(parseFloat(e.target.value))}
                  className="w-32"
                  style={{ accentColor: 'var(--tiffany-blue)' }}
                />
                <span className="text-sm font-medium w-12 text-gray-700">{radiusMiles}mi</span>
              </>
            )}
            <Button size="sm" onClick={saveArea} disabled={!canSave} className="text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
              <Save className="w-3 h-3 mr-1" /> Save Area
            </Button>
          </div>

          {savedAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {savedAreas.map((area, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#e6f7f5', color: '#3A8A82' }}>
                  {area.type === 'polygon' ? `Polygon ${i + 1}` : `${area.miles}mi radius`}
                  <button onClick={() => setSavedAreas(p => p.filter((_, j) => j !== i))} className="hover:text-red-500 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">{savedAreas.length} area{savedAreas.length !== 1 ? 's' : ''} saved</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                className="text-white"
                style={{ backgroundColor: 'var(--tiffany-blue)' }}
                onClick={() => { onSave(savedAreas); onClose(); }}
              >
                Confirm Areas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}