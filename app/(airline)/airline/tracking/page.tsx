'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTracking, clearLocations } from '@/store/slices/trackingSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function AirlineTrackingPage() {
  const dispatch = useAppDispatch();
  const { locations, loading } = useAppSelector((s) => s.tracking);
  const { list: orders } = useAppSelector((s) => s.orders);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    dispatch(fetchOrders());
    return () => { dispatch(clearLocations()); };
  }, [dispatch]);

  return (
    <div>
      <PageHeader title="Tracking" subtitle="View live location history for an order" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex gap-3">
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select Order —</option>
            {orders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} ({o.status})</option>)}
          </select>
          <Button onClick={() => orderId && dispatch(fetchTracking(orderId))} disabled={!orderId}>Search</Button>
        </div>
      </div>

      {loading ? <Spinner /> : locations.length > 0 ? (
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
      ) : orderId ? (
        <p className="text-center text-gray-400 py-12">No tracking data found for this order.</p>
      ) : null}
    </div>
  );
}
