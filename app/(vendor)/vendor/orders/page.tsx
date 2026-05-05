'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import { MdSearch, MdPersonAdd } from 'react-icons/md';

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 ring-amber-200',
  assigned:  'bg-blue-50 text-blue-700 ring-blue-200',
  picked:    'bg-violet-50 text-violet-700 ring-violet-200',
  enroute:   'bg-orange-50 text-orange-700 ring-orange-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-600 ring-red-200',
};

export default function VendorOrdersPage() {
  const [orders, setOrders]   = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [assignOrder, setAssignOrder] = useState<any>(null);
  const [driverId, setDriverId]       = useState('');
  const [assigning, setAssigning]     = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/vendors/me/orders'), api.get('/drivers')])
      .then(([oRes, dRes]) => { setOrders(oRes.data.data); setDrivers(dRes.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssign = async () => {
    if (!driverId || !assignOrder) return;
    setAssigning(true);
    try {
      await api.post(`/vendors/me/orders/${assignOrder._id}/assign-driver`, { driverId });
      setToast({ message: 'Driver assigned successfully', type: 'success' });
      setAssignOrder(null);
      load();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to assign driver', type: 'error' });
    } finally { setAssigning(false); }
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.orderNumber?.toLowerCase().includes(q) || o.flightNumber?.toLowerCase().includes(q) || o.gate?.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isNew = (o: any) => Date.now() - new Date(o.createdAt).getTime() < 30 * 60 * 1000;

  const availableDrivers = drivers.filter((d) => d.isAvailable);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader title="Orders" subtitle={`${orders.length} total orders received`} />

      <div className="relative mb-4 max-w-sm">
        <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search order #, flight, gate…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {loading ? <Spinner label="Loading orders…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Pax', 'Status', 'Driver', 'SLA', 'OTP', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {o.orderNumber}
                    {isNew(o) && <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 ring-1 ring-green-300">NEW</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${STATUS_COLOR[o.status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{o.driver?.user?.name || <span className="text-gray-300">Unassigned</span>}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.slaDeadline ? new Date(o.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-sm">{o.deliveryOtp || '—'}</td>
                  <td className="px-4 py-3">
                    {['pending', 'assigned'].includes(o.status) && (
                      <button onClick={() => { setAssignOrder(o); setDriverId(o.driver?._id || ''); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                        <MdPersonAdd size={13} /> Assign Driver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {assignOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAssignOrder(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Assign Driver</h2>
              <button onClick={() => setAssignOrder(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer">
                <MdPersonAdd size={20} />
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">Order: <span className="font-semibold text-gray-800">{assignOrder.orderNumber}</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                <select value={driverId} onChange={(e) => setDriverId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">— Select Driver —</option>
                  {availableDrivers.map((d) => (
                    <option key={d._id} value={d._id}>{d.user?.name} — {d.vehicle || 'No vehicle'}</option>
                  ))}
                </select>
              </div>
              {availableDrivers.length === 0 && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">No available drivers right now.</p>}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setAssignOrder(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={handleAssign} disabled={!driverId || assigning}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer disabled:opacity-40">
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
