'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/services/api';

function SlaCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setRemaining('SLA Breached'); setBreached(true); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
      setBreached(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${breached ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
      {remaining}
    </span>
  );
}

export default function DriverOrdersPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: drivers, loading: driversLoading } = useAppSelector((s) => s.drivers);
  const [myDriverId, setMyDriverId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchDrivers());
  }, [dispatch]);

  // Find the Driver document that belongs to the logged-in user
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || !drivers.length) return;
    const found = drivers.find(
      (d) => d.user?._id === userId || d.user?.id === userId || String(d.user?._id) === userId
    );
    if (found) setMyDriverId(found._id);
  }, [drivers]);

  const openGoogleMapsNavigation = (order: any) => {
    const destination = order.gate
      ? `${order.gate} gate, airport`
      : order.vendor?.name || 'airport';
    const encodedDest = encodeURIComponent(destination);

    if (!navigator.geolocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=driving`, '_blank');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodedDest}&travelmode=driving`,
          '_blank'
        );
      },
      () => {
        // Permission denied — open Maps without origin
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=driving`, '_blank');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const updateStatus = async (id: string, action: 'picked' | 'enroute' | 'delivered') => {
    await api.put(`/orders/${id}/${action}`);
    dispatch(fetchOrders());
    if (action === 'picked') {
      const order = orders.find((o) => o._id === id);
      if (order) openGoogleMapsNavigation(order);
    }
  };

  // Filter by driver._id (the Driver document id, not the user id)
  const myOrders = orders.filter((o) =>
    ['assigned', 'picked', 'enroute'].includes(o.status) &&
    myDriverId &&
    (o.driver?._id === myDriverId || String(o.driver?._id) === myDriverId || o.driver === myDriverId)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isNew = (o: any) => Date.now() - new Date(o.createdAt).getTime() < 30 * 60 * 1000;

  return (
    <div>
      <PageHeader title="My Orders" subtitle={`${myOrders.length} active`} />

      {(loading || driversLoading) ? <Spinner label="Loading orders…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Passengers', 'Status', 'SLA', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {o.orderNumber}
                    {isNew(o) && <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 ring-1 ring-green-300">NEW</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3">
                    {o.slaDeadline ? <SlaCountdown deadline={o.slaDeadline} /> : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {o.status === 'assigned' && <Button size="sm" onClick={() => updateStatus(o._id, 'picked')}>Picked — Navigate</Button>}
                      {o.status === 'picked'   && <Button size="sm" onClick={() => updateStatus(o._id, 'enroute')}>En Route</Button>}
                      {o.status === 'enroute'  && <Button size="sm" variant="secondary" onClick={() => updateStatus(o._id, 'delivered')}>Delivered</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {myOrders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No active orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
