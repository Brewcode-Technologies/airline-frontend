'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder } from '@/store/slices/ordersSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const emptyForm = { orderNumber: '', vendor: '', scheduledAt: '' };

export default function BundlesPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: vendors } = useAppSelector((s) => s.vendors);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleCreate = async () => {
    await dispatch(createOrder(form));
    setModal(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <PageHeader title="Bundles" subtitle={`${orders.length} total orders`} action={<Button onClick={() => setModal(true)}>+ New Bundle</Button>} />

      {loading ? <Spinner label="Loading bundles…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Vendor', 'Driver', 'Status', 'Scheduled'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.driver?.vehicle || '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No bundles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="New Bundle" onClose={() => setModal(false)}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
            <input type="text" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
