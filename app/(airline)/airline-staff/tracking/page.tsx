'use client';

import { useEffect, useState, useRef } from 'react';
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
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

  return (
    <div>
      <PageHeader title="Tracking" subtitle="Live GPS map for your orders" />

      {/* Order selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Order</label>
        <select
          value={orderId}
          onChange={(e) => handleOrderChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">— Select Order —</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o.orderNumber} | {o.status} {o.vendor?.name ? `| ${o.vendor.name}` : ''}
            </option>
          ))}
        </select>

        {/* OTP display */}
        {orderId && (() => {
          const order = orders.find((o) => o._id === orderId);
          return order?.deliveryOtp ? (
            <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase mb-1">Delivery OTP</p>
                <p className="text-3xl font-bold tracking-widest text-blue-700 font-mono">{order.deliveryOtp}</p>
                <p className="text-xs text-blue-400 mt-1">Give this OTP to the driver to confirm delivery</p>
              </div>
              <span className="text-4xl">🔐</span>
            </div>
          ) : null;
        })()}
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
