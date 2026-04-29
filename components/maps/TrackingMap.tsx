'use client';

import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { useState, useRef, useCallback, useEffect } from 'react';

interface Location {
  _id: string;
  coordinates: { lat: number; lng: number };
  recordedAt: string;
}

interface TrackingMapProps {
  locations: Location[];
  height?: string;
}

const mapContainerStyle = { width: '100%', borderRadius: '12px' };

type FocusKey = 'start' | 'waypoint' | 'latest' | 'route';

export default function TrackingMap({ locations, height = '420px' }: TrackingMapProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [focused, setFocused] = useState<FocusKey | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Auto-pan to latest point whenever a new location is logged
  useEffect(() => {
    if (!mapRef.current || !locations.length) return;
    const latest = locations[locations.length - 1];
    if (latest?.coordinates?.lat && latest?.coordinates?.lng) {
      mapRef.current.panTo({ lat: latest.coordinates.lat, lng: latest.coordinates.lng });
    }
  }, [locations.length]);

  if (loadError) return (
    <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-600">
      Failed to load Google Maps. Check your API key in .env.local
    </div>
  );

  if (!isLoaded) return (
    <div className="flex items-center justify-center bg-gray-100 rounded-xl animate-pulse" style={{ height }}>
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  );

  if (!locations.length) return (
    <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl" style={{ height }}>
      <p className="text-sm text-gray-400">No location data to display.</p>
    </div>
  );

  // Safely extract points — guard against missing coordinates
  const points = locations
    .filter((l) => l?.coordinates?.lat != null && l?.coordinates?.lng != null)
    .map((l) => ({ lat: l.coordinates.lat, lng: l.coordinates.lng }));

  if (!points.length) return (
    <div className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl" style={{ height }}>
      <p className="text-sm text-gray-400">Invalid location data.</p>
    </div>
  );

  const isMultiPoint  = points.length > 1;
  const hasWaypoints  = points.length > 2;
  const startPoint    = points[0];
  const latestPoint   = points[points.length - 1];
  const initialCenter = latestPoint;

  // --- Legend button handlers ---

  const handleStart = () => {
    const next: FocusKey | null = focused === 'start' ? null : 'start';
    setFocused(next);
    if (next === 'start' && mapRef.current) {
      mapRef.current.panTo(startPoint);
      mapRef.current.setZoom(17);
      setActiveMarker(0);
    } else {
      setActiveMarker(null);
    }
  };

  const handleWaypoint = () => {
    if (!hasWaypoints) return; // need at least 3 points for waypoints
    const next: FocusKey | null = focused === 'waypoint' ? null : 'waypoint';
    setFocused(next);
    setActiveMarker(null);
    if (next === 'waypoint' && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      points.slice(1, -1).forEach((p) => bounds.extend(p));
      mapRef.current.fitBounds(bounds, 80);
    }
  };

  const handleLatest = () => {
    const next: FocusKey | null = focused === 'latest' ? null : 'latest';
    setFocused(next);
    if (next === 'latest' && mapRef.current) {
      mapRef.current.panTo(latestPoint);
      mapRef.current.setZoom(17);
      setActiveMarker(-1);
    } else {
      setActiveMarker(null);
    }
  };

  const handleRoute = () => {
    const next: FocusKey | null = focused === 'route' ? null : 'route';
    setFocused(next);
    setActiveMarker(null);
    if (next === 'route' && mapRef.current) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      mapRef.current.fitBounds(bounds, 60);
    }
  };

  const legendButtons = [
    { key: 'start'    as FocusKey, label: 'Start',    color: 'bg-green-500', border: 'border-green-500', text: 'text-green-700', isLine: false, onClick: handleStart,    disabled: false },
    { key: 'waypoint' as FocusKey, label: 'Waypoint', color: 'bg-blue-500',  border: 'border-blue-500',  text: 'text-blue-700',  isLine: false, onClick: handleWaypoint, disabled: !hasWaypoints },
    { key: 'latest'   as FocusKey, label: 'Latest',   color: 'bg-red-500',   border: 'border-red-500',   text: 'text-red-700',   isLine: false, onClick: handleLatest,   disabled: false },
    { key: 'route'    as FocusKey, label: 'Route',    color: 'bg-blue-400',  border: 'border-blue-400',  text: 'text-blue-600',  isLine: true,  onClick: handleRoute,    disabled: !isMultiPoint },
  ];

  return (
    <div className="space-y-2">
      {/* Legend buttons */}
      <div className="flex flex-wrap gap-2">
        {legendButtons.map(({ key, label, color, border, text, isLine, onClick, disabled }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            title={disabled ? 'Not enough points' : undefined}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              focused === key
                ? `${color} border-transparent text-white shadow-md scale-105`
                : `bg-white ${border} ${text} hover:shadow-sm`
            }`}
          >
            {isLine
              ? <span className={`w-5 h-0.5 ${focused === key ? 'bg-white' : color} inline-block rounded`} />
              : <span className={`w-2.5 h-2.5 rounded-full ${focused === key ? 'bg-white' : color} inline-block`} />
            }
            {label}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={initialCenter}
        zoom={15}
        onLoad={onMapLoad}
        options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
      >
        {/* Route polyline — only when 2+ points */}
        {isMultiPoint && (
          <Polyline
            path={points}
            options={{ strokeColor: '#3b82f6', strokeWeight: 3, strokeOpacity: 0.8 }}
          />
        )}

        {/* Start marker — green (always shown) */}
        <Marker
          position={startPoint}
          icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
          label={{ text: 'S', color: 'white', fontWeight: 'bold', fontSize: '11px' }}
          onClick={() => { setActiveMarker(activeMarker === 0 ? null : 0); setFocused('start'); }}
          title="Start"
        >
          {activeMarker === 0 && (
            <InfoWindow onCloseClick={() => { setActiveMarker(null); setFocused(null); }}>
              <div className="text-xs space-y-0.5 p-1">
                <p className="font-semibold text-gray-800">Start Point</p>
                <p className="text-gray-600">Lat: {startPoint.lat.toFixed(6)}</p>
                <p className="text-gray-600">Lng: {startPoint.lng.toFixed(6)}</p>
                <p className="text-gray-400">{new Date(locations[0].recordedAt).toLocaleTimeString()}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>

        {/* Intermediate waypoint markers — only when 3+ points */}
        {hasWaypoints && points.slice(1, -1).map((pt, i) => (
          <Marker
            key={i}
            position={pt}
            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
            onClick={() => { setActiveMarker(activeMarker === i + 1 ? null : i + 1); setFocused('waypoint'); }}
          >
            {activeMarker === i + 1 && (
              <InfoWindow onCloseClick={() => { setActiveMarker(null); setFocused(null); }}>
                <div className="text-xs space-y-0.5 p-1">
                  <p className="font-semibold text-gray-800">Waypoint {i + 2}</p>
                  <p className="text-gray-600">Lat: {pt.lat.toFixed(6)}</p>
                  <p className="text-gray-600">Lng: {pt.lng.toFixed(6)}</p>
                  <p className="text-gray-400">{new Date(locations[i + 1].recordedAt).toLocaleTimeString()}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Latest marker — red, always shown when 2+ points, same as start when only 1 point */}
        {isMultiPoint && (
          <Marker
            position={latestPoint}
            icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
            label={{ text: 'E', color: 'white', fontWeight: 'bold', fontSize: '11px' }}
            onClick={() => { setActiveMarker(activeMarker === -1 ? null : -1); setFocused('latest'); }}
            title="Latest position"
          >
            {activeMarker === -1 && (
              <InfoWindow onCloseClick={() => { setActiveMarker(null); setFocused(null); }}>
                <div className="text-xs space-y-0.5 p-1">
                  <p className="font-semibold text-gray-800">Latest Position</p>
                  <p className="text-gray-600">Lat: {latestPoint.lat.toFixed(6)}</p>
                  <p className="text-gray-600">Lng: {latestPoint.lng.toFixed(6)}</p>
                  <p className="text-gray-400">{new Date(locations[locations.length - 1].recordedAt).toLocaleTimeString()}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}
      </GoogleMap>
    </div>
  );
}
