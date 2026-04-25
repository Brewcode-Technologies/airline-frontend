'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchTracking, addLocation, clearLocations } from '@/store/slices/trackingSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function NavigationPage() {
  const dispatch = useAppDispatch();
  const { list: orders } = useAppSelector((s) => s.orders);
  const { locations, loading } = useAppSelector((s) => s.tracking);

  const [orderId, setOrderId] = useState('');
  const [coords, setCoords] = useState({ lat: '', lng: '' });

  useEffect(() => {
    dispatch(fetchOrders());
    return () => { dispatch(clearLocations()); };
  }, [dispatch]);

  const handleSearch = () => { if (orderId) dispatch(fetchTracking(orderId)); };

  const handleLog = async () => {
    const driverId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
    await dispatch(addLocation({ order: orderId, driver: driverId, coordinates: { lat: parseFloat(coords.lat), lng: parseFloat(coords.lng) } }));
    setCoords({ lat: '', lng: '' });
  };

  return (
    <div>
      <PageHeader title="Navigation" subtitle="Track and log your location" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex gap-3 mb-4">
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">— Select Order —</option>
            {orders.filter((o) => ['assigned','picked','enroute'].includes(o.status)).map((o) => (
              <option key={o._id} value={o._id}>{o.orderNumber}</option>
            ))}
          </select>
          <Button onClick={handleSearch} disabled={!orderId}>Load</Button>
        </div>

        {orderId && (
          <div className="flex gap-3">
            <input type="number" placeholder="Latitude" value={coords.lat} onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="number" placeholder="Longitude" value={coords.lng} onChange={(e) => setCoords({ ...coords, lng: e.target.value })}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <Button onClick={handleLog} disabled={!coords.lat || !coords.lng}>Log</Button>
          </div>
        )}
      </div>

      {loading ? <Spinner /> : locations.length > 0 && (
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
  );
}
