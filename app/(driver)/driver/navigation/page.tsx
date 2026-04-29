'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchTracking, addLocation, clearLocations } from '@/store/slices/trackingSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import TrackingMap from '@/components/maps/TrackingMap';

export default function NavigationPage() {
  const dispatch = useAppDispatch();
  const { list: orders } = useAppSelector((s) => s.orders);
  const { locations, loading } = useAppSelector((s) => s.tracking);

  const [orderId, setOrderId] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'watching' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [logging, setLogging] = useState(false);
  const [view, setView] = useState<'map' | 'table'>('map');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
    return () => {
      dispatch(clearLocations());
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [dispatch]);

  const startGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      setGpsStatus('error');
      return;
    }
    setGpsStatus('watching');
    setGpsError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLastCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsError('');
      },
      (err) => {
        setGpsError(err.message);
        setGpsStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  const stopGPS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus('idle');
    setLastCoords(null);
  };

  const handleLogLocation = async () => {
    if (!orderId || !lastCoords) return;
    setLogging(true);
    const driverId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    await dispatch(addLocation({
      order: orderId,
      driver: driverId,
      coordinates: { lat: lastCoords.lat, lng: lastCoords.lng },
    }));
    setLogging(false);
  };

  const handleOrderChange = (id: string) => {
    setOrderId(id);
    dispatch(clearLocations());
    if (id) dispatch(fetchTracking(id));
  };

  const activeOrders = orders.filter((o) => ['assigned', 'picked', 'enroute'].includes(o.status));

  return (
    <div>
      <PageHeader title="Navigation" subtitle="GPS tracking for your active delivery" />

      {/* Order selector + GPS controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Order</label>
          <select
            value={orderId}
            onChange={(e) => handleOrderChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">— Select Order —</option>
            {activeOrders.map((o) => (
              <option key={o._id} value={o._id}>
                {o.orderNumber} | {o.status} {o.vendor?.name ? `| ${o.vendor.name}` : ''}
              </option>
            ))}
          </select>
        </div>

        {orderId && (
          <div className="space-y-3">
            {/* GPS status bar */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${gpsStatus === 'watching' ? 'bg-green-500 animate-pulse' : gpsStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-700 font-medium">
                  {gpsStatus === 'watching' ? 'GPS Active' : gpsStatus === 'error' ? 'GPS Error' : 'GPS Inactive'}
                </span>
                {lastCoords && (
                  <span className="text-xs text-gray-400 font-mono">
                    {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {gpsStatus !== 'watching' ? (
                  <Button size="sm" onClick={startGPS}>Start GPS</Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={stopGPS}>Stop GPS</Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleLogLocation}
                  disabled={!lastCoords || logging}
                >
                  {logging ? 'Logging…' : 'Log Position'}
                </Button>
              </div>
            </div>

            {gpsError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {gpsError}
              </p>
            )}

            <p className="text-xs text-gray-400">
              Press <strong>Start GPS</strong> to begin tracking your location, then <strong>Log Position</strong> to save each checkpoint.
            </p>
          </div>
        )}
      </div>

      {/* Map / Table view */}
      {loading ? <Spinner label="Loading location data…" /> : locations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{locations.length} point(s) logged</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                onClick={() => setView('map')}
                className={`px-4 py-1.5 font-medium transition-colors cursor-pointer ${view === 'map' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Map
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-4 py-1.5 font-medium transition-colors cursor-pointer ${view === 'table' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Table
              </button>
            </div>
          </div>

          {view === 'map' ? (
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <TrackingMap locations={locations} height="460px" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['#', 'Latitude', 'Longitude', 'Recorded At'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locations.map((loc, i) => (
                    <tr key={loc._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-gray-800">{loc.coordinates?.lat}</td>
                      <td className="px-4 py-3 font-mono text-gray-800">{loc.coordinates?.lng}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(loc.recordedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : orderId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No location points logged yet.</p>
          <p className="text-gray-400 text-sm mt-1">Start GPS and tap Log Position to record your route.</p>
        </div>
      ) : null}
    </div>
  );
}
