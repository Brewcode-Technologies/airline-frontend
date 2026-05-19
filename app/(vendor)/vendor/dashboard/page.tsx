'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Spinner from '@/components/ui/Spinner';
import { MdShoppingCart, MdCheckCircle, MdPending, MdInventory } from 'react-icons/md';
import Link from 'next/link';

export default function VendorDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [skus, setSkus]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/vendors/me/orders'),
      api.get('/skus'),
    ]).then(([oRes, sRes]) => {
      setOrders(oRes.data.data);
      // filter skus for this vendor — backend returns all, we filter by vendor field
      setSkus(sRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullPage label="Loading dashboard…" />;

  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const pending   = orders.filter((o) => ['pending', 'assigned'].includes(o.status)).length;
  const active    = orders.filter((o) => ['picked', 'enroute'].includes(o.status)).length;

  const stats = [
    { label: 'Total Orders',   value: orders.length, icon: MdShoppingCart,  color: 'text-blue-600',    bg: 'bg-blue-50',    href: '/vendor/orders' },
    { label: 'Delivered',      value: delivered,      icon: MdCheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/vendor/orders' },
    { label: 'Pending',        value: pending,        icon: MdPending,       color: 'text-amber-600',   bg: 'bg-amber-50',   href: '/vendor/orders' },
    { label: 'SKUs in Catalog',value: skus.length,    icon: MdInventory,     color: 'text-violet-600',  bg: 'bg-violet-50',  href: '/vendor/stock' },
  ];

  const recent = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const STATUS_COLOR: Record<string, string> = {
    pending:   'bg-amber-50 text-amber-700',
    assigned:  'bg-blue-50 text-blue-700',
    picked:    'bg-violet-50 text-violet-700',
    enroute:   'bg-orange-50 text-orange-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Here&apos;s your vendor operations overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link href="/vendor/orders" className="text-xs text-emerald-600 hover:underline">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Order #', 'Flight', 'Gate', 'Driver', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recent.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{o.driver?.user?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${STATUS_COLOR[o.status] || 'bg-gray-50 text-gray-600'}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
