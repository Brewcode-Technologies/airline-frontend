'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function DriverHistoryPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: drivers } = useAppSelector((s) => s.drivers);
  const [myDriverId, setMyDriverId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || !drivers.length) return;
    const found = drivers.find(
      (d) => d.user?._id === userId || d.user?.id === userId || String(d.user?._id) === userId
    );
    if (found) setMyDriverId(found._id);
  }, [drivers]);

  const history = orders.filter((o) =>
    ['delivered', 'cancelled'].includes(o.status) &&
    myDriverId &&
    (o.driver?._id === myDriverId || String(o.driver?._id) === myDriverId || o.driver === myDriverId)
  );

  return (
    <div>
      <PageHeader title="Order History" subtitle={`${history.length} completed`} />

      {loading ? <Spinner label="Loading history…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Passengers', 'Vendor', 'Status', 'SLA Deadline'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {o.slaDeadline ? new Date(o.slaDeadline).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No completed orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
