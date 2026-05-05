'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder, updateOrder, deleteOrder } from '@/store/slices/ordersSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchApprovedSKUs } from '@/store/slices/skusSlice';
import { fetchMe } from '@/store/slices/authSlice';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import {
  MdAdd, MdEdit, MdDelete, MdFlight, MdOutlineInbox,
  MdCheckCircle, MdCancel, MdSearch,
} from 'react-icons/md';

const emptyForm = { orderNumber: '', vendor: '', scheduledAt: '', flightNumber: '', gate: '', passengerCount: '' };

const STATUS_STYLE: Record<string, string> = {
  pending:    'bg-amber-50  text-amber-700  ring-amber-200',
  assigned:   'bg-blue-50   text-blue-700   ring-blue-200',
  picked:     'bg-violet-50 text-violet-700 ring-violet-200',
  enroute:    'bg-orange-50 text-orange-700 ring-orange-200',
  in_transit: 'bg-orange-50 text-orange-700 ring-orange-200',
  delivered:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled:  'bg-red-50    text-red-600    ring-red-200',
};

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function BundlesPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: vendors }         = useAppSelector((s) => s.vendors);
  const { list: skus }            = useAppSelector((s) => s.skus);
  const { user }                  = useAppSelector((s) => s.auth);

  const [modal, setModal]         = useState<'create'|'edit'|'delete'|null>(null);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [deleteId, setDeleteId]   = useState<string|null>(null);
  const [form, setForm]           = useState(emptyForm);
  const [editForm, setEditForm]   = useState(emptyForm);
  const [selectedItems, setSelectedItems] = useState<{skuId:string;quantity:number}[]>([]);
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState<{message:string;type:'success'|'error'}|null>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => setToast({ message: msg, type });

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchVendors());
    dispatch(fetchApprovedSKUs());
    dispatch(fetchMe());
  }, [dispatch]);

  const openCreate = () => { setForm({ ...emptyForm, gate: user?.gate || '' }); setSelectedItems([]); setModal('create'); };
  const openEdit   = (o: any) => {
    setEditOrder(o);
    setEditForm({ orderNumber: o.orderNumber, vendor: o.vendor?._id||'', scheduledAt: o.scheduledAt?.slice(0,16)||'', flightNumber: o.flightNumber||'', gate: o.gate||'', passengerCount: o.passengerCount?.toString()||'' });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditOrder(null); setDeleteId(null); setSelectedItems([]); };

  const suggestedQty = form.passengerCount ? Math.ceil(Number(form.passengerCount) / 10) : 1;

  const toggleSKU = (skuId: string) => setSelectedItems((prev) =>
    prev.find((i) => i.skuId === skuId) ? prev.filter((i) => i.skuId !== skuId) : [...prev, { skuId, quantity: suggestedQty }]
  );
  const updateQty = (skuId: string, qty: number) => setSelectedItems((prev) => prev.map((i) => i.skuId === skuId ? { ...i, quantity: qty } : i));
  const totalCost = selectedItems.reduce((sum, item) => sum + (skus.find((s) => s._id === item.skuId)?.price ?? 0) * item.quantity, 0);

  const handleCreate = async () => {
    const p: any = { orderNumber: form.orderNumber, vendor: form.vendor||undefined, scheduledAt: form.scheduledAt||undefined, flightNumber: form.flightNumber||undefined, gate: form.gate||undefined, passengerCount: form.passengerCount ? Number(form.passengerCount) : undefined, items: selectedItems.map((i) => ({ sku: i.skuId, quantity: i.quantity })) };
    await dispatch(createOrder(p));
    await dispatch(fetchOrders());
    showToast('Bundle created');
    closeModal();
  };
  const handleEdit = async () => {
    if (!editOrder) return;
    const p: any = { orderNumber: editForm.orderNumber, vendor: editForm.vendor||undefined, scheduledAt: editForm.scheduledAt||undefined, flightNumber: editForm.flightNumber||undefined, gate: editForm.gate||undefined, passengerCount: editForm.passengerCount ? Number(editForm.passengerCount) : undefined };
    const r = await dispatch(updateOrder({ id: editOrder._id, payload: p }));
    closeModal();
    updateOrder.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Bundle updated')) : showToast('Failed to update','error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteOrder(deleteId));
    closeModal();
    deleteOrder.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Bundle deleted')) : showToast('Failed to delete','error');
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.orderNumber?.toLowerCase().includes(q) || o.vendor?.name?.toLowerCase().includes(q) || o.flightNumber?.toLowerCase().includes(q);
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api','') || 'http://localhost:5000';

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bundles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
          <MdAdd size={17} /> New Bundle
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4 max-w-sm">
        <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search order #, vendor, flight…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* ── Table ── */}
      {loading ? <Spinner label="Loading bundles…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Order #','Flight','Gate','Pax','Vendor','Status','SLA','Scheduled','Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <MdOutlineInbox size={36} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No bundles found</p>
                  </td>
                </tr>
              ) : filtered.map((o) => {
                const sla     = o.slaDeadline ? new Date(o.slaDeadline) : null;
                const slaMet  = sla ? new Date() <= sla : null;
                return (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <span className="font-semibold text-gray-900">{o.orderNumber}</span>
                    </td>
                    <td className="px-3 py-3">
                      {o.flightNumber
                        ? <span className="flex items-center gap-1 text-gray-700"><MdFlight size={13} className="text-gray-400" />{o.flightNumber}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{o.gate || <span className="text-gray-300 text-xs">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700">{o.passengerCount ?? <span className="text-gray-300 text-xs">—</span>}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-[140px] truncate">{o.vendor?.name || <span className="text-gray-300 text-xs">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[o.status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                        {o.status.replace('_',' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {sla ? (
                        <span className={`flex items-center gap-1 text-xs font-medium ${slaMet ? 'text-emerald-600' : 'text-red-500'}`}>
                          {slaMet ? <MdCheckCircle size={13} /> : <MdCancel size={13} />}
                          {sla.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(o)} title="Edit"
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => { setDeleteId(o._id); setModal('delete'); }} title="Delete"
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer transition-colors">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ── */}
      {modal === 'create' && (
        <Modal title="New Bundle Order" onClose={closeModal}>
          <div className="grid grid-cols-2 gap-x-4">
            {(['orderNumber','flightNumber','gate','passengerCount'] as const).map((key) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key==='orderNumber'?'Order Number':key==='flightNumber'?'Flight Number':key==='passengerCount'?'Passengers':'Gate'}
                </label>
                <input type={key==='passengerCount'?'number':'text'} value={form[key]}
                  onChange={(e) => setForm({...form,[key]:e.target.value})}
                  placeholder={key==='orderNumber'?'e.g. ORD-2025-0010':key==='flightNumber'?'e.g. AI-202':key==='passengerCount'?'e.g. 180':'e.g. Gate B4'}
                  className={inputCls} />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={form.vendor} onChange={(e) => setForm({...form,vendor:e.target.value})} className={inputCls}>
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({...form,scheduledAt:e.target.value})} className={inputCls} />
          </div>

          {/* SKU Picker */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Select Items</label>
              {form.passengerCount && <span className="text-xs text-blue-500">Suggested qty: {suggestedQty}</span>}
            </div>
            {(() => {
              const active = skus.filter((s) => s.isActive);
              const list   = form.vendor ? active.filter((s) => (s.vendor?._id||s.vendor) === form.vendor) : active;
              const selVendor = vendors.find((v) => v._id === form.vendor);
              if (!skus.length) return <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">No SKUs approved. Ask admin to approve SKUs.</p>;
              if (!list.length) return (
                <div className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-3 py-3">
                  <p>No SKUs from <strong>{selVendor?.name || 'this vendor'}</strong>.</p>
                  {form.vendor && <button onClick={() => setForm({...form,vendor:''})} className="text-xs text-blue-600 hover:underline mt-1 cursor-pointer">Show all SKUs</button>}
                </div>
              );
              return (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {list.map((s) => {
                    const sel = selectedItems.find((i) => i.skuId === s._id);
                    const img = s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : null;
                    return (
                      <div key={s._id} className={`flex items-center gap-3 px-3 py-2.5 ${sel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={!!sel} onChange={() => toggleSKU(s._id)} className="w-4 h-4 cursor-pointer" />
                        <div className="w-8 h-8 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {img ? <img src={img} alt={s.name} className="w-full h-full object-contain" /> : <span className="text-gray-300 text-xs">—</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.code} · {s.unit}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-600">${s.price ?? 0}</span>
                        {sel && <input type="number" min={1} value={sel.quantity} onChange={(e) => updateQty(s._id, Number(e.target.value))} className="w-14 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500" />}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Summary */}
          {selectedItems.length > 0 && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Order Summary</p>
              {selectedItems.map((item) => {
                const s = skus.find((x) => x._id === item.skuId);
                return (
                  <div key={item.skuId} className="flex justify-between text-sm py-0.5">
                    <span className="text-gray-600">{s?.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-800">${((s?.price??0)*item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                <span>Total</span><span className="text-emerald-600">${totalCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-blue-500 mt-1">SLA window: 15–22 minutes</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
            <button onClick={handleCreate} disabled={!form.orderNumber}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-40">
              Place Order
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {modal === 'edit' && editOrder && (
        <Modal title="Edit Bundle" onClose={closeModal}>
          <div className="grid grid-cols-2 gap-x-4">
            {(['orderNumber','flightNumber','gate','passengerCount'] as const).map((key) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key==='orderNumber'?'Order Number':key==='flightNumber'?'Flight Number':key==='passengerCount'?'Passengers':'Gate'}
                </label>
                <input type={key==='passengerCount'?'number':'text'} value={editForm[key]}
                  onChange={(e) => setEditForm({...editForm,[key]:e.target.value})} className={inputCls} />
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={editForm.vendor} onChange={(e) => setEditForm({...editForm,vendor:e.target.value})} className={inputCls}>
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
            <input type="datetime-local" value={editForm.scheduledAt} onChange={(e) => setEditForm({...editForm,scheduledAt:e.target.value})} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
            <button onClick={handleEdit} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">Save Changes</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {modal === 'delete' && (
        <ConfirmModal title="Delete Bundle" message="Are you sure you want to delete this bundle order?"
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={closeModal} />
      )}
    </div>
  );
}
