'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTracking, clearLocations } from '@/store/slices/trackingSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import TrackingMap from '@/components/maps/TrackingMap';

export default function AirlineTrackingPage() {
  const dispatch = useAppDispatch();
  const { locations, loading } = useAppSelector((s) => s.tracking);
  const { list: orders } = useAppSelector((s) => s.orders);
  const [orderId, setOrderId] = useState('');
  const [view, setView] = useState<'map' | 'table'>('map');

  useEffect(() => {
    dispatch(fetchOrders());
    return () => { dispatch(clearLocations()); };
  }, [dispatch]);

  return (
    <div>
      <PageHeader title="Tracking" subtitle="Live GPS map for your orders" />

      {/* Order selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Order</label>
        <select
          value={orderId}
          onChange={(e) => {
            setOrderId(e.target.value);
            if (e.target.value) dispatch(fetchTracking(e.target.value));
            else dispatch(clearLocations());
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select Order —</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o.orderNumber} | {o.status} {o.vendor?.name ? `| ${o.vendor.name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? <Spinner label="Fetching location data…" /> : locations.length > 0 ? (
        <div className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{locations.length} location point(s)</span>
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
        <p className="text-center text-gray-400 py-12">No tracking data found for this order.</p>
      ) : null}
    </div>
  );
}
