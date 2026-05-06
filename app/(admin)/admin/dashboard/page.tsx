'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  MdShoppingCart, MdCheckCircle, MdPending, MdPeople,
  MdBusiness, MdInventory, MdLocationOn, MdBarChart,
  MdManageAccounts, MdPerson, MdArrowForward, MdSpeed,
} from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSummary, fetchOrdersByStatus, fetchSLA } from '@/store/slices/analyticsSlice';
import { fetchOrders } from '@/store/slices/ordersSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchSKUs } from '@/store/slices/skusSlice';
import { fetchUsers } from '@/store/slices/usersSlice';
import StatCard from '@/components/cards/StatCard';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];

const sections = [
  { href: '/admin/orders',    label: 'Orders',    icon: MdShoppingCart,   color: 'text-blue-600 bg-blue-50' },
  { href: '/admin/drivers',   label: 'Drivers',   icon: MdPeople,         color: 'text-purple-600 bg-purple-50' },
  { href: '/admin/vendors',   label: 'Vendors',   icon: MdBusiness,       color: 'text-green-600 bg-green-50' },
  { href: '/admin/skus',      label: 'SKUs',      icon: MdInventory,      color: 'text-yellow-600 bg-yellow-50' },
  { href: '/admin/users',     label: 'Users',     icon: MdManageAccounts, color: 'text-indigo-600 bg-indigo-50' },
  { href: '/admin/tracking',  label: 'Tracking',  icon: MdLocationOn,     color: 'text-red-600 bg-red-50' },
  { href: '/admin/analytics', label: 'Analytics', icon: MdBarChart,       color: 'text-orange-600 bg-orange-50' },
  { href: '/admin/profile',   label: 'Profile',   icon: MdPerson,         color: 'text-gray-600 bg-gray-100' },
];

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { summary, ordersByStatus, sla, loading: analyticsLoading } = useAppSelector((s) => s.analytics);
  const { list: orders,  loading: ordersLoading  } = useAppSelector((s) => s.orders);
  const { list: drivers, loading: driversLoading } = useAppSelector((s) => s.drivers);
  const { list: vendors, loading: vendorsLoading } = useAppSelector((s) => s.vendors);
  const { list: skus,    loading: skusLoading    } = useAppSelector((s) => s.skus);
  const { list: users,   loading: usersLoading   } = useAppSelector((s) => s.users);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchOrdersByStatus());
    dispatch(fetchSLA());
    dispatch(fetchOrders());
    dispatch(fetchDrivers());
    dispatch(fetchVendors());
    dispatch(fetchSKUs());
    dispatch(fetchUsers());
  }, [dispatch]);

  const isLoading = analyticsLoading || ordersLoading || driversLoading || vendorsLoading || skusLoading || usersLoading;

  const barData = ordersByStatus.map((s: any) => ({ name: s._id.replace('_', ' '), count: s.count }));
  const pieData = ordersByStatus.map((s: any) => ({ name: s._id.replace('_', ' '), value: s.count }));

  const recentOrders  = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const availDrivers  = drivers.filter((d) => d.isAvailable);
  const activeVendors = vendors.filter((v) => v.isActive);
  const activeSkus    = skus.filter((s) => s.isActive);

  if (isLoading) return <Spinner fullPage label="Loading dashboard…" />;



  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete overview of logistics operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders"      value={summary?.totalOrders ?? 0}     icon={<MdShoppingCart size={22} />} color="blue"   />
        <StatCard title="Delivered"         value={summary?.delivered ?? 0}        icon={<MdCheckCircle size={22} />}  color="green"  />
        <StatCard title="Pending"           value={summary?.pending ?? 0}          icon={<MdPending size={22} />}      color="yellow" />
        <StatCard title="Available Drivers" value={summary?.availableDrivers ?? 0} icon={<MdPeople size={22} />}       color="purple" />
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {sections.map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center gap-2 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{label}</span>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Orders by Status</h3>
            <Link href="/admin/analytics" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
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

        {/* Pie chart */}
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

      {/* SLA + counts row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdSpeed size={18} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">SLA Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{sla?.slaRate ?? '—'}</p>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: sla?.slaRate ?? '0%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdBusiness size={18} className="text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Vendors</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{vendors.length}</p>
          <p className="text-xs text-gray-400 mt-1">{activeVendors.length} active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdInventory size={18} className="text-yellow-600" />
            <span className="text-sm font-semibold text-gray-700">SKUs</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{skus.length}</p>
          <p className="text-xs text-gray-400 mt-1">{activeSkus.length} active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <MdManageAccounts size={18} className="text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">Users</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{users.length}</p>
          <p className="text-xs text-gray-400 mt-1">all roles</p>
        </div>
      </div>

      {/* Recent orders + drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Vendor', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-2.5"><Badge label={o.status} /></td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No orders</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Drivers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Drivers</h3>
            <Link href="/admin/drivers" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Vehicle', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.slice(0, 5).map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{d.user?.name || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{d.vehicle || '—'}</td>
                  <td className="px-4 py-2.5"><Badge label={d.isAvailable ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No drivers</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendors + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vendors */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Vendors</h3>
            <Link href="/admin/vendors" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.slice(0, 5).map((v) => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{v.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{v.email || '—'}</td>
                  <td className="px-4 py-2.5"><Badge label={v.isActive ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No vendors</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Users</h3>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <MdArrowForward size={14} />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.slice(0, 5).map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{u.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-2.5"><Badge label={u.role} /></td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-xs">No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SKUs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">SKUs</h3>
          <Link href="/admin/skus" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            View all <MdArrowForward size={14} />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Name', 'Unit', 'Status'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skus.slice(0, 5).map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono font-medium text-gray-800 text-xs">{s.code}</td>
                <td className="px-4 py-2.5 text-gray-700 text-xs">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{s.unit || '—'}</td>
                <td className="px-4 py-2.5"><Badge label={s.isActive ? 'active' : 'inactive'} /></td>
              </tr>
            ))}
            {skus.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-xs">No SKUs</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
