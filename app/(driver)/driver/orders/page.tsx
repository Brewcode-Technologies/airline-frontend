'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, updateOrderStatus } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/services/api';

export default function DriverOrdersPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);

  const updateStatus = async (id: string, action: 'picked' | 'enroute' | 'delivered') => {
    await api.put(`/orders/${id}/${action}`);
    dispatch(fetchOrders());
  };

  const myOrders = orders.filter((o) => ['assigned', 'picked', 'enroute'].includes(o.status));

  return (
    <div>
      <PageHeader title="My Orders" subtitle={`${myOrders.length} active`} />

      {loading ? <Spinner label="Loading orders…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Vendor', 'Status', 'Scheduled', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {o.status === 'assigned' && <Button size="sm" onClick={() => updateStatus(o._id, 'picked')}>Picked</Button>}
                      {o.status === 'picked'   && <Button size="sm" onClick={() => updateStatus(o._id, 'enroute')}>En Route</Button>}
                      {o.status === 'enroute'  && <Button size="sm" variant="secondary" onClick={() => updateStatus(o._id, 'delivered')}>Delivered</Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {myOrders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No active orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
