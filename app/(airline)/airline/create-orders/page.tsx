'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder } from '@/store/slices/ordersSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchSKUs } from '@/store/slices/skusSlice';
import { fetchMe } from '@/store/slices/authSlice';
import Toast from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import {
  MdSearch, MdAdd, MdRemove, MdShoppingCart, MdArrowForward,
  MdCheckCircle, MdClose, MdFlight, MdStore, MdDelete,
} from 'react-icons/md';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CreateOrdersPage() {
  const dispatch = useAppDispatch();
  const { list: vendors } = useAppSelector((s) => s.vendors);
  const { list: skus, loading: skusLoading } = useAppSelector((s) => s.skus);
  const { list: orders } = useAppSelector((s) => s.orders);
  const { user } = useAppSelector((s) => s.auth);

  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ flightNumber: '', gate: '', passengerCount: '', scheduledAt: '' });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [placedOrder, setPlacedOrder] = useState('');

  useEffect(() => {
    dispatch(fetchVendors());
    dispatch(fetchSKUs());
    dispatch(fetchOrders());
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (vendors.length && !selectedVendor) setSelectedVendor(vendors[0]._id);
  }, [vendors]);

  const vendorProducts = useMemo(() => {
    let list = skus.filter((s: any) => s.isActive);
    if (selectedVendor) list = list.filter((s: any) => (s.vendor?._id || s.vendor) === selectedVendor);
    return list;
  }, [skus, selectedVendor]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(vendorProducts.map((s: any) => s.category || 'General')));
    return ['All', ...cats.sort()];
  }, [vendorProducts]);

  const filteredProducts = useMemo(() => {
    let list = vendorProducts;
    if (selectedCategory !== 'All') list = list.filter((s: any) => (s.category || 'General') === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s: any) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    }
    return list;
  }, [vendorProducts, selectedCategory, search]);

  const selectedCount = Object.values(selectedItems).reduce((a, b) => a + b, 0);
  const selectedTotal = Object.entries(selectedItems).reduce((sum, [id, qty]) => {
    const sku = skus.find((s: any) => s._id === id);
    return sum + (sku?.price ?? 0) * qty;
  }, 0);

  const addItem = (id: string) => setSelectedItems((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeItem = (id: string) => setSelectedItems((p) => {
    const next = { ...p };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });
  const deleteItem = (id: string) => setSelectedItems((p) => {
    const next = { ...p };
    delete next[id];
    return next;
  });

  const [orderNumber] = useState(() => {
    const year = new Date().getFullYear();
    const num = Date.now().toString().slice(-6);
    return `ORD-${year}-${num}`;
  });
  const generateOrderNumber = () => orderNumber;

  const handlePlaceOrder = async () => {
    const orderNum = generateOrderNumber();
    const items = Object.entries(selectedItems).map(([skuId, quantity]) => ({ sku: skuId, quantity }));
    const payload: any = {
      orderNumber: orderNum,
      vendor: selectedVendor || undefined,
      flightNumber: form.flightNumber || undefined,
      gate: form.gate || undefined,
      passengerCount: form.passengerCount ? Number(form.passengerCount) : undefined,
      scheduledAt: form.scheduledAt || undefined,
      items,
    };
    const result = await dispatch(createOrder(payload));
    if (createOrder.fulfilled.match(result)) {
      setPlacedOrder(orderNum);
      setShowDrawer(false);
      setShowConfirm(true);
      setSelectedItems({});
      setForm({ flightNumber: '', gate: '', passengerCount: '', scheduledAt: '' });
      dispatch(fetchOrders());
    } else {
      const errMsg = (result.payload as string) || 'Failed to place order';
      setToast({ message: errMsg, type: 'error' });
    }
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const vendorName = vendors.find((v: any) => v._id === selectedVendor)?.name || '';

  if (skusLoading && !skus.length) return <Spinner label="Loading products…" />;

  return (
    <div className="min-h-[calc(100vh-80px)]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select products from a vendor</p>
        </div>
      </div>

      {/* Vendor Dropdown + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative sm:w-64">
          <MdStore size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={selectedVendor} onChange={(e) => { setSelectedVendor(e.target.value); setSelectedItems({}); setSelectedCategory('All'); }}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer">
            {vendors.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>
        <div className="relative flex-1">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Category Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}{cat !== 'All' ? ` (${vendorProducts.filter((s: any) => (s.category || 'General') === cat).length})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <MdShoppingCart size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No products found for this vendor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((sku: any) => {
            const qty = selectedItems[sku._id] || 0;
            const img = sku.image ? (sku.image.startsWith('http') ? sku.image : `${API_BASE}${sku.image}`) : null;
            return (
              <div key={sku._id} className={`bg-white rounded-xl border ${qty > 0 ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'} shadow-sm overflow-hidden transition-all hover:shadow-md`}>
                <div className="relative h-36 bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  {img ? <img src={img} alt={sku.name} className="h-full w-full object-cover" />
                    : <span className="text-gray-300 text-3xl">📦</span>}
                  {sku.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-gray-600 border border-gray-200">
                      {sku.category}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{sku.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sku.code} · {sku.unit}</p>
                  <p className="text-xs text-gray-400 truncate">{vendorName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-emerald-600">${sku.price ?? 0}</span>
                    {qty === 0 ? (
                      <button onClick={() => addItem(sku._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                        <MdAdd size={14} /> Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => removeItem(sku._id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer">
                          <MdRemove size={14} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-gray-900">{qty}</span>
                        <button onClick={() => addItem(sku._id)}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                          <MdAdd size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Cart Button */}
      {selectedCount > 0 && (
        <button onClick={() => setShowDrawer(true)}
          className="fixed top-20 right-6 z-40 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-xl cursor-pointer transition-all hover:scale-105">
          <MdShoppingCart size={20} />
          <span className="bg-white text-blue-600 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{selectedCount}</span>
          <span className="text-sm">Continue</span>
          <MdArrowForward size={16} />
        </button>
      )}

      {/* ── Right Drawer: Order Details ── */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDrawer(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right flex flex-col">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              <button onClick={() => setShowDrawer(false)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer">
                <MdClose size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">
              {/* Order Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
                <input type="text" value={generateOrderNumber()} disabled
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Auto-generated</p>
              </div>

              {/* Flight + Gate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number *</label>
                  <div className="relative">
                    <MdFlight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })}
                      placeholder="AI-202" className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gate</label>
                  <input type="text" value={form.gate} onChange={(e) => setForm({ ...form, gate: e.target.value })}
                    placeholder="Gate B4" className={inputCls} />
                </div>
              </div>

              {/* Passengers + Scheduled */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passengers *</label>
                  <input type="number" value={form.passengerCount} onChange={(e) => setForm({ ...form, passengerCount: e.target.value })}
                    placeholder="180" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At *</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className={inputCls}>
                  {vendors.map((v: any) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>

              {/* Cart Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cart Items ({selectedCount})</label>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {Object.entries(selectedItems).map(([id, qty]) => {
                    const sku = skus.find((s: any) => s._id === id);
                    if (!sku) return null;
                    const img = sku.image ? (sku.image.startsWith('http') ? sku.image : `${API_BASE}${sku.image}`) : null;
                    return (
                      <div key={id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {img ? <img src={img} alt={sku.name} className="w-full h-full object-contain" /> : <span className="text-gray-300 text-xs">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{sku.name}</p>
                          <p className="text-xs text-gray-400">${sku.price ?? 0} × {qty}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">${((sku.price ?? 0) * qty).toFixed(2)}</span>
                        <button onClick={() => deleteItem(id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer">
                          <MdDelete size={14} />
                        </button>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between px-3 py-3 bg-gray-50">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-emerald-600">${selectedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setShowDrawer(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                Back
              </button>
              <button onClick={handlePlaceOrder}
                disabled={!form.flightNumber || !form.passengerCount || !form.scheduledAt || selectedCount === 0}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-40 transition-colors">
                Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <MdCheckCircle size={36} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Order Placed!</h3>
            <p className="text-sm text-gray-500 mb-2">Your order has been placed successfully.</p>
            <p className="text-sm font-semibold text-blue-600 mb-6">{placedOrder}</p>
            <button onClick={() => setShowConfirm(false)}
              className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
