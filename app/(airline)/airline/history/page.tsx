'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function HistoryPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const myOrders = orders.filter((o) =>
    !o.createdBy || o.createdBy === userId || o.createdBy?._id === userId
  );

  return (
    <div>
      <PageHeader title="Order History" subtitle={`${myOrders.length} total records`} />

      {loading ? <Spinner label="Loading history…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Passengers', 'Status', 'Scheduled', 'Created'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {myOrders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No history found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
