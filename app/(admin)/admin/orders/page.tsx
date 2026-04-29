'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder, updateOrder, deleteOrder, assignDriver, updateOrderStatus } from '@/store/slices/ordersSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';

const STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];
const emptyForm = { orderNumber: '', vendor: '', driver: '', status: 'pending', scheduledAt: '' };

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: drivers } = useAppSelector((s) => s.drivers);
  const { list: vendors } = useAppSelector((s) => s.vendors);

  const [modal, setModal] = useState<'create' | 'edit' | 'assign' | 'status' | 'delete' | 'bulkDelete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchDrivers());
    dispatch(fetchVendors());
  }, [dispatch]);

  const allChecked = orders.length > 0 && checkedIds.size === orders.length;
  const toggleAll = () => setCheckedIds(allChecked ? new Set() : new Set(orders.map((o) => o._id)));
  const toggleOne = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (o: any) => {
    setSelected(o);
    setForm({ orderNumber: o.orderNumber, vendor: o.vendor?._id || '', driver: o.driver?._id || '', status: o.status, scheduledAt: o.scheduledAt?.slice(0, 16) || '' });
    setModal('edit');
  };
  const openAssign = (o: any) => { setSelected(o); setAssignDriverId(''); setModal('assign'); };
  const openStatus = (o: any) => { setSelected(o); setNewStatus(o.status); setModal('status'); };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    const payload: any = { orderNumber: form.orderNumber, status: form.status };
    if (form.vendor) payload.vendor = form.vendor;
    if (form.driver) payload.driver = form.driver;
    if (form.scheduledAt) payload.scheduledAt = form.scheduledAt;
    const r = await dispatch(createOrder(payload));
    if (createOrder.fulfilled.match(r)) {
      await dispatch(fetchOrders());
      showToast('Order created successfully');
    } else {
      showToast('Failed to create order', 'error');
    }
    close();
  };
  const handleEdit = async () => {
    const payload: any = { orderNumber: form.orderNumber, status: form.status };
    if (form.vendor) payload.vendor = form.vendor;
    if (form.driver) payload.driver = form.driver;
    if (form.scheduledAt) payload.scheduledAt = form.scheduledAt;
    const r = await dispatch(updateOrder({ id: selected._id, payload }));
    close();
    if (updateOrder.fulfilled.match(r)) { await dispatch(fetchOrders()); showToast('Order updated successfully'); }
    else showToast('Failed to update order', 'error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteOrder(deleteId)); setDeleteId(null); setModal(null);
    if (deleteOrder.fulfilled.match(r)) { await dispatch(fetchOrders()); showToast('Order deleted'); }
    else showToast('Failed to delete order', 'error');
  };
  const handleBulkDelete = async () => {
    await Promise.all([...checkedIds].map((id) => dispatch(deleteOrder(id))));
    await dispatch(fetchOrders());
    showToast(`${checkedIds.size} order(s) deleted`);
    setCheckedIds(new Set()); setModal(null);
  };
  const handleAssign = async () => {
    const r = await dispatch(assignDriver({ id: selected._id, driverId: assignDriverId }));
    close();
    if (assignDriver.fulfilled.match(r)) { await dispatch(fetchOrders()); showToast('Driver assigned successfully'); }
    else showToast('Failed to assign driver', 'error');
  };
  const handleStatus = async () => {
    const r = await dispatch(updateOrderStatus({ id: selected._id, status: newStatus }));
    close();
    if (updateOrderStatus.fulfilled.match(r)) { await dispatch(fetchOrders()); showToast('Status updated successfully'); }
    else showToast('Failed to update status', 'error');
  };

  const field = (label: string, key: keyof typeof emptyForm, type = 'text') => {
    const placeholders: Record<string, string> = {
      orderNumber: 'e.g. ORD-2025-0010',
      scheduledAt: '',
    };
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholders[key] || ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {checkedIds.size > 0 && (
            <Button variant="danger" onClick={() => setModal('bulkDelete')}>
              Delete Selected ({checkedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>+ New Order</Button>
        </div>
      </div>

      {loading ? <Spinner label="Loading orders…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                </th>
                {['Order #', 'Flight', 'Gate', 'Pax', 'Vendor', 'Driver', 'Status', 'Scheduled', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o._id} className={`hover:bg-gray-50 ${checkedIds.has(o._id) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedIds.has(o._id)} onChange={() => toggleOne(o._id)} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.flightNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.gate || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.passengerCount ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.vendor?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.driver?.vehicle || '—'}</td>
                  <td className="px-4 py-3"><Badge label={o.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{o.scheduledAt ? new Date(o.scheduledAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(o)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => openAssign(o)}>Assign</Button>
                      <Button size="sm" variant="ghost" onClick={() => openStatus(o)}>Status</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeleteId(o._id); setModal('delete'); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="Delete Order" message="Are you sure you want to delete this order? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}

      {modal === 'bulkDelete' && (
        <ConfirmModal title={`Delete ${checkedIds.size} Order(s)`} message={`Are you sure you want to delete ${checkedIds.size} selected order(s)? This action cannot be undone.`}
          confirmLabel={`Delete ${checkedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setModal(null)} />
      )}

      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'New Order' : 'Edit Order'} onClose={close}>
          {field('Order Number', 'orderNumber')}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {field('Scheduled At', 'scheduledAt', 'datetime-local')}
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={modal === 'create' ? handleCreate : handleEdit}>{modal === 'create' ? 'Create' : 'Save'}</Button>
          </div>
        </Modal>
      )}

      {modal === 'assign' && (
        <Modal title="Assign Driver" onClose={close} size="sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
            <select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select Driver —</option>
              {drivers.filter((d) => d.isAvailable).map((d) => (
                <option key={d._id} value={d._id}>{d.user?.name} — {d.vehicle}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignDriverId}>Assign</Button>
          </div>
        </Modal>
      )}

      {modal === 'status' && (
        <Modal title="Update Status" onClose={close} size="sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={handleStatus}>Update</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
