'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdStorefront, MdShoppingCart, MdHistory, MdLocationOn, MdArrowForward, MdTimer } from 'react-icons/md';
import api from '@/services/api';

export default function CustomerDashboard() {
  const [name, setName] = useState('');
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [slaText, setSlaText] = useState('');

  useEffect(() => {
    setName(localStorage.getItem('name') || 'Customer');
    loadData();
  }, []);

  // SLA countdown timer
  useEffect(() => {
    if (!activeOrder?.slaDeadline) return;
    const tick = () => {
      const remaining = new Date(activeOrder.slaDeadline).getTime() - Date.now();
      if (remaining <= 0) { setSlaText('Overdue'); return; }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setSlaText(`${mins}m ${secs}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  const loadData = async () => {
    try {
      const { data } = await api.get('/customer/orders');
      const orders = data.data || [];
      setRecentOrders(orders.slice(0, 5));
      const activeOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
      setStats({
        total: orders.length,
        active: activeOrders.length,
        delivered: orders.filter((o: any) => o.status === 'delivered').length,
      });
      if (activeOrders.length > 0) setActiveOrder(activeOrders[0]);
    } catch (e) { /* ignore */ }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getSlaColor = () => {
    if (!activeOrder?.slaDeadline) return 'text-gray-600';
    const remaining = new Date(activeOrder.slaDeadline).getTime() - Date.now();
    if (remaining <= 0) return 'text-red-600';
    if (remaining < 5 * 60 * 1000) return 'text-red-500';
    if (remaining < 10 * 60 * 1000) return 'text-yellow-600';
    return 'text-green-600';
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      picked: 'bg-indigo-100 text-indigo-700',
      enroute: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {name}! 👋</h1>
        <p className="text-gray-500 mt-1">Order food, water, and snacks delivered to your gate.</p>
      </div>

      {/* Active Order SLA Banner */}
      {activeOrder && activeOrder.slaDeadline && (new Date(activeOrder.slaDeadline).getTime() - Date.now()) > 0 && (
        <Link href={`/customer/orders/${activeOrder._id}`} className="block bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-xs font-medium uppercase tracking-wide">Active Delivery</p>
              <p className="text-lg font-bold mt-1">{activeOrder.orderNumber}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-purple-100 capitalize">{activeOrder.status}</span>
                <span className="text-purple-300">•</span>
                <span className="text-sm text-purple-100">{activeOrder.deliveryLocation}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <MdTimer size={18} className="text-purple-200" />
                <span className="text-xs text-purple-200">ETA</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-white">
                {slaText || '--:--'}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/customer/catalog" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
            <MdStorefront size={20} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Browse Catalog</h3>
          <p className="text-sm text-gray-500 mt-1">View available items</p>
          <MdArrowForward className="text-purple-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link href="/customer/cart" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <MdShoppingCart size={20} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900">My Cart</h3>
          <p className="text-sm text-gray-500 mt-1">Review and checkout</p>
          <MdArrowForward className="text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link href="/customer/orders" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <MdHistory size={20} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900">My Orders</h3>
          <p className="text-sm text-gray-500 mt-1">{stats.total} total orders</p>
          <MdArrowForward className="text-green-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link href="/customer/tracking" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
            <MdLocationOn size={20} className="text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Track Order</h3>
          <p className="text-sm text-gray-500 mt-1">{stats.active} active</p>
          <MdArrowForward className="text-orange-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Active Orders</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.delivered}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/customer/orders" className="text-sm text-purple-600 hover:underline">View all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No orders yet. Start browsing the catalog!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <Link key={order._id} href={`/customer/orders/${order._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                  {order.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
