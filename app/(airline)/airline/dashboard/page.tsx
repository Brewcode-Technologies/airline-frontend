'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  MdShoppingCart, MdCheckCircle, MdPending, MdPeople,
  MdLocationOn, MdHistory, MdSummarize, MdArrowForward, MdSpeed,
} from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSummary, fetchOrdersByStatus, fetchSLA } from '@/store/slices/analyticsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

const quickLinks = [
  { href: '/airline/bundles',  label: 'Bundles',  icon: MdShoppingCart, color: 'text-blue-600 bg-blue-50' },
  { href: '/airline/tracking', label: 'Tracking', icon: MdLocationOn,   color: 'text-red-600 bg-red-50' },
  { href: '/airline/history',  label: 'History',  icon: MdHistory,      color: 'text-green-600 bg-green-50' },
  { href: '/airline/summary',  label: 'Summary',  icon: MdSummarize,    color: 'text-purple-600 bg-purple-50' },
];

export default function AirlineDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { summary, ordersByStatus, sla, loading } = useAppSelector((s) => s.analytics);
  const { list: orders, loading: ordersLoading } = useAppSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchOrdersByStatus());
    dispatch(fetchSLA());
    dispatch(fetchOrders());
  }, [dispatch]);

  const isLoading = loading || ordersLoading;

  const barData = ordersByStatus.map((s: any) => ({ name: s._id.replace('_', ' '), count: s.count }));
  const pieData = ordersByStatus.map((s: any) => ({ name: s._id.replace('_', ' '), value: s.count }));
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  if (isLoading) return <Spinner fullPage label="Loading dashboard…" />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of airline operations</p>
      </div>

      {/* Stat Cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => router.push('/airline/bundles')}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600"><MdShoppingCart size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-800">{summary?.totalOrders ?? 0}</p>
          </div>
        </button>

        <button onClick={() => router.push('/airline/history')}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-green-300 transition-all text-left">
          <div className="p-3 rounded-lg bg-green-50 text-green-600"><MdCheckCircle size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-gray-800">{summary?.delivered ?? 0}</p>
          </div>
        </button>

        <button onClick={() => router.push('/airline/bundles')}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all text-left">
          <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600"><MdPending size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-800">{summary?.pending ?? 0}</p>
          </div>
        </button>

        <button onClick={() => router.push('/airline/tracking')}
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-left">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-600"><MdPeople size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Available Drivers</p>
            <p className="text-2xl font-bold text-gray-800">{summary?.availableDrivers ?? 0}</p>
          </div>
        </button>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-4 gap-3">
        {quickLinks.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{label}</span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Orders by Status</h3>
            <Link href="/airline/history" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Status Distribution</h3>
            <span className="text-xs text-gray-400">{summary?.totalOrders ?? 0} total</span>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((entry: any, i: number) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 capitalize">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SLA + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* SLA Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MdSpeed size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800">SLA Performance</h3>
          </div>
          {sla ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-semibold text-gray-800">{sla.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivered</span>
                <span className="font-semibold text-green-600">{sla.delivered}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">SLA Rate</span>
                <span className="font-semibold text-blue-600">{sla.slaRate}</span>
              </div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-orange-500 h-2.5 rounded-full transition-all" style={{ width: sla.slaRate }} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No SLA data available.</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link href="/airline/history" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Vendor', 'Scheduled', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/airline/bundles')}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5"><Badge label={o.status} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">No orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
