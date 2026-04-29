'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders } from '@/store/slices/ordersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/services/api';

export default function ProofPage() {
  const dispatch = useAppDispatch();
  const { list: orders } = useAppSelector((s) => s.orders);

  const [orderId, setOrderId]     = useState('');
  const [notes, setNotes]         = useState('');
  const [signature, setSignature] = useState('');
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [proof, setProof]         = useState<any>(null);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);

  const loadProof = async (id: string) => {
    setOrderId(id);
    setProof(null);
    setSubmitted(false);
    setFile(null);
    setPreview(null);
    if (!id) return;
    try {
      const { data } = await api.get(`/orders/${id}/proof`);
      setProof(data.data);
    } catch { setProof(null); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('photo', file);
      formData.append('notes', notes);
      formData.append('signature', signature);

      await api.post(`/orders/${orderId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmitted(true);
      const { data } = await api.get(`/orders/${orderId}/proof`);
      setProof(data.data);
    } finally { setLoading(false); }
  };

  const deliveredOrders = orders.filter((o) => ['enroute', 'delivered'].includes(o.status));

  return (
    <div>
      <PageHeader title="Proof of Delivery" subtitle="Submit or view delivery proof" />

      {/* Order Select */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Order</label>
        <select value={orderId} onChange={(e) => loadProof(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">— Select Order —</option>
          {deliveredOrders.map((o) => (
            <option key={o._id} value={o._id}>{o.orderNumber} ({o.status})</option>
          ))}
        </select>
      </div>

      {orderId && (
        proof ? (
          /* ── Already submitted ── */
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Proof Submitted ✅</h3>

            {proof.imageUrl && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Photo</p>
                <img src={proof.imageUrl} alt="Delivery proof"
                  className="w-full max-w-sm rounded-lg border border-gray-200 object-cover" />
              </div>
            )}

            {proof.signature && (
              <p className="text-sm text-gray-600">
                Signature / PIN: <span className="font-mono font-medium">{proof.signature}</span>
              </p>
            )}
            {proof.notes && (
              <p className="text-sm text-gray-600">Notes: {proof.notes}</p>
            )}
            <p className="text-sm text-gray-400">
              Delivered at: {new Date(proof.deliveredAt).toLocaleString()}
            </p>
          </div>
        ) : (
          /* ── Submit form ── */
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Submit Proof</h3>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
              >
                {preview ? (
                  <img src={preview} alt="Preview"
                    className="w-full max-w-xs rounded-lg object-cover mb-2" />
                ) : (
                  <>
                    <span className="text-3xl mb-2">📷</span>
                    <p className="text-sm text-gray-500">Tap to take photo or upload image</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — max 5MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-xs text-green-600 mt-1">✅ {file.name} selected</p>
              )}
            </div>

            {/* Signature / PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Signature / PIN</label>
              <input type="text" value={signature} onChange={(e) => setSignature(e.target.value)}
                placeholder="Agent PIN or signature"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
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
