'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { addLocation, clearLocations } from '@/store/slices/trackingSlice';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import { MdDirectionsCar, MdTwoWheeler, MdDirectionsWalk, MdPlayArrow, MdStop } from 'react-icons/md';

const VEHICLE_MODES = [
  { key: 'car',  label: 'Car',  icon: MdDirectionsCar },
  { key: 'bike', label: 'Bike', icon: MdTwoWheeler },
  { key: 'walk', label: 'Walk', icon: MdDirectionsWalk },
] as const;
type VehicleMode = typeof VEHICLE_MODES[number]['key'];

const TRAVELMODE_MAP: Record<VehicleMode, string> = {
  car:  'driving',
  bike: 'driving',
  walk: 'walking',
};

export default function NavigationPage() {
  const dispatch = useAppDispatch();
  const { list: orders } = useAppSelector((s) => s.orders);

  const [orderId, setOrderId]           = useState('');
  const [vehicle, setVehicle]           = useState<VehicleMode>('car');
  const [status, setStatus]             = useState<'idle' | 'tracking' | 'ended' | 'error'>('idle');
  const [error, setError]               = useState('');
  const [currentPos, setCurrentPos]     = useState<{ lat: number; lng: number } | null>(null);
  const [routePath, setRoutePath]       = useState<{ lat: number; lng: number }[]>([]);
  const [stats, setStats]               = useState({ points: 0, started: '' });

  const watchIdRef  = useRef<number | null>(null);
  const autoLogRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef   = useRef<{ lat: number; lng: number } | null>(null);
  const mapRef      = useRef<google.maps.Map | null>(null);
  const startedAtRef = useRef<string>('');

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
  });

  useEffect(() => {
    dispatch(fetchOrders());
    return () => stopTracking();
  }, [dispatch]);

  const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);

  const stopTracking = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (autoLogRef.current !== null) { clearInterval(autoLogRef.current); autoLogRef.current = null; }
  };

  const openGoogleMaps = (pos: { lat: number; lng: number }, order: any) => {
    const dest = order?.gate ? encodeURIComponent(`${order.gate} gate airport`) : encodeURIComponent('airport');
    const mode = TRAVELMODE_MAP[vehicle];
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${pos.lat},${pos.lng}&destination=${dest}&travelmode=${mode}`,
      '_blank'
    );
  };

  const startDrive = () => {
    if (!orderId) return;
    if (!navigator.geolocation) { setError('Geolocation not supported on this device.'); setStatus('error'); return; }

    setError('');
    setRoutePath([]);
    setStats({ points: 0, started: '' });
    dispatch(clearLocations());

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        latestRef.current = coords;
        setCurrentPos(coords);
        setRoutePath([coords]);
        startedAtRef.current = new Date().toLocaleTimeString();
        setStats({ points: 1, started: startedAtRef.current });
        setStatus('tracking');

        // Log first point
        const driverId = localStorage.getItem('userId') || '';
        dispatch(addLocation({ order: orderId, driver: driverId, coordinates: coords }));

        // Open Google Maps navigation
        const order = orders.find((o) => o._id === orderId);
        openGoogleMaps(coords, order);

        // Watch position
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            const c = { lat: p.coords.latitude, lng: p.coords.longitude };
            latestRef.current = c;
            setCurrentPos(c);
            setRoutePath((prev) => [...prev, c]);
            if (mapRef.current) mapRef.current.panTo(c);
          },
          (err) => { setError(err.message); },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );

        // Auto-save to backend every 10s
        autoLogRef.current = setInterval(() => {
          if (latestRef.current && orderId) {
            const dId = localStorage.getItem('userId') || '';
            dispatch(addLocation({ order: orderId, driver: dId, coordinates: latestRef.current }));
            setStats((prev) => ({ ...prev, points: prev.points + 1 }));
          }
        }, 10000);
      },
      (err) => { setError(err.message); setStatus('error'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const endDrive = () => {
    stopTracking();
    setStatus('ended');
  };

  const resetDrive = () => {
    setStatus('idle');
    setCurrentPos(null);
    setRoutePath([]);
    setError('');
    setStats({ points: 0, started: '' });
    dispatch(clearLocations());
  };

  const activeOrders = orders.filter((o) => ['assigned', 'picked', 'enroute'].includes(o.status));
  const selectedOrder = orders.find((o) => o._id === orderId);

  return (
    <div className="space-y-4">
      <PageHeader title="Navigation" subtitle="Live GPS route tracking" />

      {/* Setup card — only shown when idle/error */}
      {(status === 'idle' || status === 'error') && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">

          {/* Order selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Order</label>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Select Order —</option>
              {activeOrders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.orderNumber} | {o.status}{o.gate ? ` | Gate ${o.gate}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle mode */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Vehicle</label>
            <div className="flex gap-3">
              {VEHICLE_MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setVehicle(m.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${
                    vehicle === m.key
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <m.icon size={24} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={startDrive}
            disabled={!orderId}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <MdPlayArrow size={18} /> Start Drive
          </button>
        </div>
      )}

      {/* Live tracking view */}
      {status === 'tracking' && (
        <div className="space-y-3">

          {/* Status bar */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">Live Tracking</span>
              <span className="text-xs text-gray-400">Started {stats.started}</span>
              {selectedOrder?.gate && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  → Gate {selectedOrder.gate}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{routePath.length} pts tracked</span>
              {(() => { const V = VEHICLE_MODES.find((m) => m.key === vehicle)?.icon; return V ? <V size={18} className="text-gray-500" /> : null; })()}
              <button
                onClick={endDrive}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
              >
                <MdStop size={16} /> End Drive
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Live map */}
          {!isLoaded ? <Spinner label="Loading map…" /> : loadError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">Failed to load Google Maps.</div>
          ) : currentPos ? (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '480px' }}
                center={currentPos}
                zoom={16}
                onLoad={onMapLoad}
                options={{ zoomControl: true, streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
              >
                {/* Route polyline */}
                {routePath.length > 1 && (
                  <Polyline
                    path={routePath}
                    options={{ strokeColor: '#f97316', strokeWeight: 4, strokeOpacity: 0.9 }}
                  />
                )}
                {/* Start marker */}
                {routePath.length > 0 && (
                  <Marker
                    position={routePath[0]}
                    icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
                    title="Start"
                  />
                )}
                {/* Current position marker */}
                <Marker
                  position={currentPos}
                  icon={{ path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
                  title="You are here"
                />
              </GoogleMap>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Spinner label="Getting your location…" />
            </div>
          )}

          {/* Coords */}
          {currentPos && (
            <p className="text-xs text-gray-400 text-center font-mono">
              {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
            </p>
          )}
        </div>
      )}

      {/* Ended summary */}
      {status === 'ended' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <MdStop size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Drive Ended</h2>
          <p className="text-sm text-gray-500">{routePath.length} location points recorded</p>
          {stats.started && <p className="text-xs text-gray-400">Started at {stats.started}</p>}

          {/* Final route map */}
          {isLoaded && routePath.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-gray-200 mt-4">
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '300px' }}
                center={routePath[routePath.length - 1]}
                zoom={14}
                options={{ zoomControl: false, streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
              >
                <Polyline path={routePath} options={{ strokeColor: '#f97316', strokeWeight: 4, strokeOpacity: 0.9 }} />
                <Marker
                  position={routePath[0]}
                  icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#22c55e', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
                />
                <Marker
                  position={routePath[routePath.length - 1]}
                  icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
                />
              </GoogleMap>
            </div>
          )}

          <button
            onClick={resetDrive}
            className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors flex items-center gap-2 mx-auto"
          >
            <MdPlayArrow size={16} /> Start New Drive
          </button>
        </div>
      )}
    </div>
  );
}
