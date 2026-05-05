'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { MdArrowBack, MdBusiness, MdEmail, MdPhone, MdLocationOn, MdInventory, MdShoppingCart } from 'react-icons/md';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [vendor, setVendor]   = useState<any>(null);
  const [skus, setSkus]       = useState<any[]>([]);
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'skus' | 'orders'>('skus');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/vendors/${id}`),
      api.get(`/skus?vendorId=${id}`),
      api.get('/orders'),
    ]).then(([vRes, sRes, oRes]) => {
      setVendor(vRes.data.data);
      setSkus(sRes.data.data);
      setOrders(oRes.data.data.filter((o: any) => o.vendor?._id === id || o.vendor === id));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner fullPage label="Loading vendor…" />;
  if (!vendor) return <div className="p-8 text-center text-gray-400">Vendor not found.</div>;

  const totalRevenue = orders.reduce((sum: number, o: any) =>
    sum + (o.items?.reduce((s: number, i: any) => s + (i.sku?.price ?? 0) * (i.quantity ?? 0), 0) ?? 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">
        <MdArrowBack size={16} /> Back to Vendors
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <MdBusiness size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
            <Badge label={vendor.isActive ? 'active' : 'inactive'} />
          </div>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MdPhone size={16} className="text-gray-400 flex-shrink-0" />
            {vendor.contact || <span className="text-gray-300">No contact</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MdEmail size={16} className="text-gray-400 flex-shrink-0" />
            {vendor.email || <span className="text-gray-300">No email</span>}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MdLocationOn size={16} className="text-gray-400 flex-shrink-0" />
            {vendor.address || <span className="text-gray-300">No address</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total SKUs',   value: skus.length,                          icon: MdInventory,    color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Total Orders', value: orders.length,                         icon: MdShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Revenue',      value: `$${totalRevenue.toFixed(2)}`,         icon: MdBusiness,     color: 'text-violet-600',  bg: 'bg-violet-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm w-fit">
        {(['skus', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 font-medium transition-colors cursor-pointer capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            {t === 'skus' ? `SKUs (${skus.length})` : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {/* SKUs tab */}
      {tab === 'skus' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Image', 'Name', 'Code', 'Unit', 'Price', 'Stock', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {skus.map((s) => {
                const img = s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : null;
                return (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                        {img ? <img src={img} alt={s.name} className="w-full h-full object-contain" /> : <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.code}</td>
                    <td className="px-4 py-3 text-gray-600">{s.unit}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">${s.price ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{s.stock ?? '—'}</td>
                    <td className="px-4 py-3"><Badge label={s.isActive ? 'active' : 'inactive'} /></td>
                  </tr>
                );
              })}
              {skus.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No SKUs for this vendor</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Status', 'SLA Deadline', 'Scheduled'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.slaDeadline ? new Date(o.slaDeadline).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No orders for this vendor</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
