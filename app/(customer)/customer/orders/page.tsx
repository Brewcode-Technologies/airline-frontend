'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdFilterList, MdRefresh } from 'react-icons/md';
import api from '@/services/api';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/customer/orders', { params });
      setOrders(data.data || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const reorder = async (orderId: string) => {
    try {
      await api.post(`/customer/orders/${orderId}/reorder`);
      alert('Items added to cart!');
    } catch (e) { /* ignore */ }
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      picked: 'bg-indigo-100 text-indigo-700',
      enroute: 'bg-orange-100 text-orange-700',
      in_transit: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const statuses = ['', 'pending', 'assigned', 'picked', 'enroute', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">{orders.length} orders</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-400">No orders found</p>
          <Link href="/customer/catalog" className="inline-block mt-3 text-purple-600 hover:underline text-sm">
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/customer/orders/${order._id}`} className="font-semibold text-gray-900 hover:text-purple-600 text-sm">
                      {order.orderNumber}
                    </Link>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString()}</span>
                    <span>{order.items?.length || 0} items</span>
                    {order.deliveryLocation && <span>📍 {order.deliveryLocation}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">
                    ${order.items?.reduce((sum: number, i: any) => sum + ((i.sku?.price || 0) * i.quantity), 0).toFixed(2)}
                  </span>
                  {order.status === 'delivered' && (
                    <button onClick={() => reorder(order._id)}
                      className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 cursor-pointer">
                      <MdRefresh size={14} /> Reorder
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
