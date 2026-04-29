'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTracking, clearLocations } from '@/store/slices/trackingSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import TrackingMap from '@/components/maps/TrackingMap';

export default function AdminTrackingPage() {
  const dispatch = useAppDispatch();
  const { locations, loading } = useAppSelector((s) => s.tracking);
  const { list: orders, loading: ordersLoading } = useAppSelector((s) => s.orders);
  const [orderId, setOrderId] = useState('');
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<'map' | 'table'>('map');

  useEffect(() => {
    dispatch(fetchOrders());
    return () => { dispatch(clearLocations()); };
  }, [dispatch]);

  const handleSearch = () => {
    if (!orderId) return;
    setSearched(true);
    dispatch(fetchTracking(orderId));
  };

  const trackableOrders = orders.filter((o) =>
    ['delivered', 'in_transit', 'enroute', 'picked', 'assigned'].includes(o.status)
  );

  return (
    <div>
      <PageHeader title="Tracking" subtitle="Live GPS map for any order" />

      {/* Order selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Order</label>
        <div className="flex gap-3">
          {ordersLoading ? (
            <div className="flex-1 flex items-center text-sm text-gray-400">Loading orders…</div>
          ) : (
            <select
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); setSearched(false); dispatch(clearLocations()); }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select Order —</option>
              <optgroup label="Active / Delivered">
                {trackableOrders.map((o) => (
                  <option key={o._id} value={o._id}>{o.orderNumber} — {o.status}</option>
                ))}
              </optgroup>
              {orders.filter((o) => !trackableOrders.includes(o)).length > 0 && (
                <optgroup label="Other Orders">
                  {orders.filter((o) => !trackableOrders.includes(o)).map((o) => (
                    <option key={o._id} value={o._id}>{o.orderNumber} — {o.status}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          <Button onClick={handleSearch} disabled={!orderId || loading}>
            {loading ? 'Loading…' : 'Search'}
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner label="Fetching location data…" />
      ) : searched && locations.length > 0 ? (
        <div className="space-y-4">
          {/* Map / Table toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{locations.length} location point(s) recorded</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                onClick={() => setView('map')}
                className={`px-4 py-1.5 font-medium transition-colors cursor-pointer ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Map
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-4 py-1.5 font-medium transition-colors cursor-pointer ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Table
              </button>
            </div>
          </div>

          {view === 'map' ? (
            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <TrackingMap locations={locations} height="480px" />
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
                      <td className="px-4 py-3 font-mono text-gray-900">{loc.coordinates?.lat}</td>
                      <td className="px-4 py-3 font-mono text-gray-900">{loc.coordinates?.lng}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(loc.recordedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : searched ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No tracking data found for this order.</p>
          <p className="text-gray-400 text-sm mt-1">The driver has not logged any location updates yet.</p>
        </div>
      ) : null}
    </div>
  );
}
