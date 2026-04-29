'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder } from '@/store/slices/ordersSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchApprovedSKUs } from '@/store/slices/skusSlice';
import { fetchMe } from '@/store/slices/authSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const emptyForm = {
  orderNumber: '', vendor: '', scheduledAt: '',
  flightNumber: '', gate: '', passengerCount: '',
};

export default function BundlesPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: vendors } = useAppSelector((s) => s.vendors);
  const { list: skus } = useAppSelector((s) => s.skus);
  const { user } = useAppSelector((s) => s.auth);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const openModal = () => {
    setForm({ ...emptyForm, gate: user?.gate || '' });
    setModal(true);
  };
  const [selectedItems, setSelectedItems] = useState<{ skuId: string; quantity: number }[]>([]);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchVendors());
    dispatch(fetchApprovedSKUs());
    dispatch(fetchMe());
  }, [dispatch]);

  // auto-suggest quantity based on passenger count
  const suggestedQty = form.passengerCount ? Math.ceil(Number(form.passengerCount) / 10) : 1;

  const toggleSKU = (skuId: string) => {
    setSelectedItems((prev) =>
      prev.find((i) => i.skuId === skuId)
        ? prev.filter((i) => i.skuId !== skuId)
        : [...prev, { skuId, quantity: suggestedQty }]
    );
  };

  const updateQty = (skuId: string, qty: number) => {
    setSelectedItems((prev) => prev.map((i) => i.skuId === skuId ? { ...i, quantity: qty } : i));
  };

  const totalCost = selectedItems.reduce((sum, item) => {
    const sku = skus.find((s) => s._id === item.skuId);
    return sum + (sku?.price ?? 0) * item.quantity;
  }, 0);

  const handleCreate = async () => {
    const payload: any = {
      orderNumber: form.orderNumber,
      vendor: form.vendor || undefined,
      scheduledAt: form.scheduledAt || undefined,
      flightNumber: form.flightNumber || undefined,
      gate: form.gate || undefined,
      passengerCount: form.passengerCount ? Number(form.passengerCount) : undefined,
      items: selectedItems.map((i) => ({ sku: i.skuId, quantity: i.quantity })),
    };
    await dispatch(createOrder(payload));
    setModal(false);
    setForm(emptyForm);
    setSelectedItems([]);
  };

  const f = (label: string, key: keyof typeof emptyForm, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div>
      <PageHeader title="Bundles" subtitle={`${orders.length} total orders`} action={<Button onClick={openModal}>+ New Bundle</Button>} />

      {loading ? <Spinner label="Loading bundles…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Flight', 'Gate', 'Passengers', 'Vendor', 'Status', 'SLA Deadline'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const slaDeadline = o.slaDeadline ? new Date(o.slaDeadline) : null;
                const now = new Date();
                const slaMet = slaDeadline ? now <= slaDeadline : null;
                return (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{o.vendor?.name || '—'}</td>
                    <td className="px-4 py-3"><Badge label={o.status} /></td>
                    <td className="px-4 py-3 text-xs">
                      {slaDeadline ? (
                        <span className={slaMet ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                          {slaMet ? '✅ ' : '❌ '}{slaDeadline.toLocaleTimeString()}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No bundles found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title="New Bundle Order" onClose={() => { setModal(false); setSelectedItems([]); setForm({ ...emptyForm, gate: user?.gate || '' }); }}>
          <div className="grid grid-cols-2 gap-x-4">
            {f('Order Number', 'orderNumber', 'text', 'e.g. ORD-2025-0010')}
            {f('Flight Number', 'flightNumber', 'text', 'e.g. AI-202')}
            {f('Gate', 'gate', 'text', 'e.g. Gate B4')}
            {f('Passenger Count', 'passengerCount', 'number', 'e.g. 120')}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* SKU Picker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bundles
              {form.passengerCount && <span className="ml-2 text-xs text-blue-500">Suggested qty: {suggestedQty} per bundle</span>}
            </label>

            {/* Filter by selected vendor */}
            {(() => {
              const activeSkus = skus.filter((s) => s.isActive);
              const vendorSkus = form.vendor
                ? activeSkus.filter((s) => (s.vendor?._id || s.vendor) === form.vendor)
                : activeSkus;
              const selectedVendor = vendors.find((v) => v._id === form.vendor);

              if (skus.length === 0) return (
                <div className="border border-orange-200 bg-orange-50 rounded-lg px-4 py-5 text-center">
                  <p className="text-sm font-medium text-orange-700">No SKUs approved for your account</p>
                  <p className="text-xs text-orange-500 mt-1">Ask your admin to approve SKUs for your airline in the SKUs page.</p>
                </div>
              );

              if (vendorSkus.length === 0) return (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg px-4 py-5 text-center">
                  <p className="text-sm font-medium text-yellow-700">
                    {selectedVendor
                      ? <>No approved SKUs from <span className="font-bold">{selectedVendor.name}</span></>
                      : 'No active SKUs available'
                    }
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    {selectedVendor
                      ? 'Try selecting a different vendor, or ask admin to add SKUs for this vendor.'
                      : 'Select a vendor or ask admin to activate SKUs.'
                    }
                  </p>
                  {skus.length > 0 && form.vendor && (
                    <button
                      onClick={() => setForm({ ...form, vendor: '' })}
                      className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Show all approved SKUs instead
                    </button>
                  )}
                </div>
              );

              return (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {vendorSkus.map((s) => {
                    const selected = selectedItems.find((i) => i.skuId === s._id);
                    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
                    const imgSrc = s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : null;
                    return (
                      <div key={s._id} className={`flex items-center gap-3 px-3 py-2.5 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={!!selected} onChange={() => toggleSKU(s._id)} className="w-4 h-4 cursor-pointer" />
                        {/* Product image thumbnail */}
                        <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {imgSrc
                            ? <img src={imgSrc} alt={s.name} className="w-full h-full object-contain p-0.5" />
                            : <span className="text-gray-300 text-xs">IMG</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.code} · {s.unit} {s.vendor?.name ? `· ${s.vendor.name}` : ''}</p>
                          {(s.stock ?? 0) > 0
                            ? <p className="text-xs text-green-600">{s.stock} in stock</p>
                            : <p className="text-xs text-red-500">Out of stock</p>
                          }
                        </div>
                        <span className="text-sm font-semibold text-green-600 flex-shrink-0">${s.price ?? 0}</span>
                        {selected && (
                          <input type="number" min={1} value={selected.quantity}
                            onChange={(e) => updateQty(s._id, Number(e.target.value))}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Order Summary */}
          {selectedItems.length > 0 && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Summary</p>
              {selectedItems.map((item) => {
                const sku = skus.find((s) => s._id === item.skuId);
                return (
                  <div key={item.skuId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{sku?.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-800">${((sku?.price ?? 0) * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                <span className="text-gray-800">Total</span>
                <span className="text-green-600">${totalCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-blue-500 pt-1">⏱ SLA delivery window: 15–22 minutes</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setModal(false); setSelectedItems([]); setForm({ ...emptyForm, gate: user?.gate || '' }); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.orderNumber}>Place Order</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
