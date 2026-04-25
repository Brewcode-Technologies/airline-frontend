'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/services/api';

export default function ProofPage() {
  const dispatch = useAppDispatch();
  const { list: orders } = useAppSelector((s) => s.orders);

  const [orderId, setOrderId] = useState('');
  const [form, setForm] = useState({ imageUrl: '', notes: '' });
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);

  const loadProof = async (id: string) => {
    setOrderId(id);
    setProof(null);
    setSubmitted(false);
    if (!id) return;
    try {
      const { data } = await api.get(`/orders/${id}/proof`);
      setProof(data.data);
    } catch { setProof(null); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/proof`, form);
      setSubmitted(true);
      const { data } = await api.get(`/orders/${orderId}/proof`);
      setProof(data.data);
    } finally { setLoading(false); }
  };

  const deliveredOrders = orders.filter((o) => ['enroute', 'delivered'].includes(o.status));

  return (
    <div>
      <PageHeader title="Proof of Delivery" subtitle="Submit or view delivery proof" />

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
        <select value={orderId} onChange={(e) => loadProof(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">— Select Order —</option>
          {deliveredOrders.map((o) => <option key={o._id} value={o._id}>{o.orderNumber} ({o.status})</option>)}
        </select>
      </div>

      {orderId && (
        proof ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-800 mb-2">Proof Submitted</h3>
            {proof.imageUrl && <p className="text-sm text-gray-600">Image: <span className="font-mono">{proof.imageUrl}</span></p>}
            {proof.notes    && <p className="text-sm text-gray-600">Notes: {proof.notes}</p>}
            <p className="text-sm text-gray-500">Delivered at: {new Date(proof.deliveredAt).toLocaleString()}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Submit Proof</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3} placeholder="Delivery notes..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {submitted && <p className="text-sm text-green-600">Proof submitted successfully!</p>}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Proof'}
            </Button>
          </div>
        )
      )}
    </div>
  );
}
