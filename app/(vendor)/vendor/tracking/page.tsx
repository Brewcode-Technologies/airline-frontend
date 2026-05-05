'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import TrackingMap from '@/components/maps/TrackingMap';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTracking, clearLocations } from '@/store/slices/trackingSlice';

export default function VendorTrackingPage() {
  const dispatch = useAppDispatch();
  const { locations, loading } = useAppSelector((s) => s.tracking);

  const [orders, setOrders]   = useState<any[]>([]);
  const [orderId, setOrderId] = useState('');
  const [view, setView]       = useState<'map' | 'table'>('map');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get('/vendors/me/orders').then((res) => setOrders(res.data.data));
    return () => { dispatch(clearLocations()); if (pollRef.current) clearInterval(pollRef.current); };
  }, [dispatch]);

  const handleOrderChange = (id: string) => {
    setOrderId(id);
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (id) {
      dispatch(fetchTracking(id));
      pollRef.current = setInterval(() => dispatch(fetchTracking(id)), 10000);
    } else {
      dispatch(clearLocations());
    }
  };

  const activeOrders = orders.filter((o) => ['assigned', 'picked', 'enroute'].includes(o.status));

  return (
    <div>
      <PageHeader title="Tracking" subtitle="Live GPS tracking for your active orders" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Order</label>
        <select value={orderId} onChange={(e) => handleOrderChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">— Select Order —</option>
          {activeOrders.map((o) => (
            <option key={o._id} value={o._id}>{o.orderNumber} | {o.status} | {o.driver?.user?.name || 'No driver'}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner label="Fetching location data…" /> : locations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{locations.length} location point(s)</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {(['map', 'table'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 font-medium transition-colors cursor-pointer capitalize ${view === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {v}
                </button>
              ))}
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
                  <tr>{['#', 'Latitude', 'Longitude', 'Recorded At'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}</tr>
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
          <p className="text-gray-500">No tracking data yet for this order.</p>
        </div>
      ) : null}
    </div>
  );
}
