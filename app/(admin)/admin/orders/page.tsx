'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchOrders, createOrder, updateOrder, deleteOrder, assignDriver, updateOrderStatus } from '@/store/slices/ordersSlice';
import { fetchDrivers } from '@/store/slices/driversSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import {
  MdEdit, MdDelete, MdPersonAdd, MdSwapHoriz, MdAdd,
  MdSearch, MdFilterList, MdFlight, MdOutlineInbox,
} from 'react-icons/md';

const STATUSES = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'];
const emptyForm = { orderNumber: '', vendor: '', driver: '', status: 'pending', scheduledAt: '', flightNumber: '', gate: '', passengerCount: '' };

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

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const { list: orders, loading } = useAppSelector((s) => s.orders);
  const { list: drivers }         = useAppSelector((s) => s.drivers);
  const { list: vendors }         = useAppSelector((s) => s.vendors);

  const [modal, setModal]                   = useState<'create'|'edit'|'assign'|'status'|'delete'|'bulkDelete'|null>(null);
  const [selected, setSelected]             = useState<any>(null);
  const [deleteId, setDeleteId]             = useState<string|null>(null);
  const [checkedIds, setCheckedIds]         = useState<Set<string>>(new Set());
  const [form, setForm]                     = useState(emptyForm);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [newStatus, setNewStatus]           = useState('');
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [toast, setToast]                   = useState<{message:string;type:'success'|'error'}|null>(null);

  const showToast  = (message: string, type: 'success'|'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchDrivers());
    dispatch(fetchVendors());
  }, [dispatch]);

  const allChecked = orders.length > 0 && checkedIds.size === orders.length;
  const toggleAll  = () => setCheckedIds(allChecked ? new Set() : new Set(orders.map((o) => o._id)));
  const toggleOne  = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit   = (o: any) => {
    setSelected(o);
    setForm({ orderNumber: o.orderNumber, vendor: o.vendor?._id||'', driver: o.driver?._id||'', status: o.status, scheduledAt: o.scheduledAt?.slice(0,16)||'', flightNumber: o.flightNumber||'', gate: o.gate||'', passengerCount: o.passengerCount?.toString()||'' });
    setModal('edit');
  };
  const openAssign = (o: any) => { setSelected(o); setAssignDriverId(''); setModal('assign'); };
  const openStatus = (o: any) => { setSelected(o); setNewStatus(o.status); setModal('status'); };
  const close      = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    const p: any = { orderNumber: form.orderNumber, status: form.status };
    if (form.vendor)         p.vendor         = form.vendor;
    if (form.scheduledAt)    p.scheduledAt    = form.scheduledAt;
    if (form.flightNumber)   p.flightNumber   = form.flightNumber;
    if (form.gate)           p.gate           = form.gate;
    if (form.passengerCount) p.passengerCount = Number(form.passengerCount);
    const r = await dispatch(createOrder(p));
    createOrder.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Order created')) : showToast('Failed to create order','error');
    close();
  };
  const handleEdit = async () => {
    const p: any = { orderNumber: form.orderNumber, status: form.status };
    if (form.vendor)         p.vendor         = form.vendor;
    if (form.scheduledAt)    p.scheduledAt    = form.scheduledAt;
    if (form.flightNumber)   p.flightNumber   = form.flightNumber;
    if (form.gate)           p.gate           = form.gate;
    if (form.passengerCount) p.passengerCount = Number(form.passengerCount);
    const r = await dispatch(updateOrder({ id: selected._id, payload: p }));
    close();
    updateOrder.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Order updated')) : showToast('Failed to update','error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteOrder(deleteId)); setDeleteId(null); setModal(null);
    deleteOrder.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Order deleted')) : showToast('Failed to delete','error');
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
    assignDriver.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Driver assigned')) : showToast('Failed to assign','error');
  };
  const handleStatus = async () => {
    const r = await dispatch(updateOrderStatus({ id: selected._id, status: newStatus }));
    close();
    updateOrderStatus.fulfilled.match(r) ? (await dispatch(fetchOrders()), showToast('Status updated')) : showToast('Failed to update status','error');
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (!q || o.orderNumber?.toLowerCase().includes(q) || o.vendor?.name?.toLowerCase().includes(q) || o.flightNumber?.toLowerCase().includes(q))
      && (!filterStatus || o.status === filterStatus);
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isNew = (o: any) => Date.now() - new Date(o.createdAt).getTime() < 30 * 60 * 1000;

  const field = (label: string, key: keyof typeof emptyForm, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className={inputCls} />
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {orders.length} orders</p>
        </div>
        <div className="flex gap-2 items-center">
          {checkedIds.size > 0 && (
            <button onClick={() => setModal('bulkDelete')}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
              <MdDelete size={15} /> Delete {checkedIds.size}
            </button>
          )}
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
            <MdAdd size={17} /> New Order
          </button>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search order #, vendor, flight…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="relative">
          <MdFilterList size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? <Spinner label="Loading orders…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer rounded" />
                </th>
                {['Order #','Flight','Gate','Pax','Vendor','Driver','Status','Scheduled','Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <MdOutlineInbox size={36} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No orders found</p>
                  </td>
                </tr>
              ) : filtered.map((o) => (
                <tr key={o._id} className={`hover:bg-gray-50 transition-colors ${checkedIds.has(o._id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedIds.has(o._id)} onChange={() => toggleOne(o._id)} className="w-4 h-4 cursor-pointer rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-semibold text-gray-900 text-sm">{o.orderNumber}</span>
                    {isNew(o) && <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 ring-1 ring-green-300">NEW</span>}
                  </td>
                  <td className="px-3 py-3">
                    {o.flightNumber
                      ? <span className="flex items-center gap-1 text-gray-700"><MdFlight size={13} className="text-gray-400" />{o.flightNumber}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{o.gate || <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-3 py-3 text-gray-700">{o.passengerCount ?? <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-3 py-3 text-gray-700 max-w-[140px] truncate">{o.vendor?.name || <span className="text-gray-300 text-xs">—</span>}</td>
                  <td className="px-3 py-3 text-gray-700">
                    {o.driver?.user?.name
                      ? <div><p className="text-sm text-gray-800 font-medium">{o.driver.user.name}</p><p className="text-xs text-gray-400">{o.driver.vehicle}</p></div>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[o.status] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                      {o.status.replace('_',' ')}
                    </span>
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
                      <button onClick={() => openAssign(o)} title="Assign Driver"
                        className="p-1.5 rounded-md hover:bg-blue-50 text-gray-500 hover:text-blue-600 cursor-pointer transition-colors">
                        <MdPersonAdd size={16} />
                      </button>
                      <button onClick={() => openStatus(o)} title="Update Status"
                        className="p-1.5 rounded-md hover:bg-purple-50 text-gray-500 hover:text-purple-600 cursor-pointer transition-colors">
                        <MdSwapHoriz size={16} />
                      </button>
                      <button onClick={() => { setDeleteId(o._id); setModal('delete'); }} title="Delete"
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer transition-colors">
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      {modal === 'delete' && (
        <ConfirmModal title="Delete Order" message="Are you sure you want to delete this order?"
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}
      {modal === 'bulkDelete' && (
        <ConfirmModal title={`Delete ${checkedIds.size} Orders`} message={`Delete ${checkedIds.size} selected orders? This cannot be undone.`}
          confirmLabel={`Delete ${checkedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setModal(null)} />
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New Order' : 'Edit Order'}</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdEdit size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {field('Order Number','orderNumber','text','e.g. ORD-2025-0010')}
                {field('Flight Number','flightNumber','text','e.g. AI-202')}
                {field('Gate','gate','text','e.g. Gate B4')}
                {field('Passengers','passengerCount','number','e.g. 180')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <select value={form.vendor} onChange={(e) => setForm({...form,vendor:e.target.value})} className={inputCls}>
                  <option value="">— None —</option>
                  {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({...form,status:e.target.value})} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
              {field('Scheduled At','scheduledAt','datetime-local')}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={modal==='create'?handleCreate:handleEdit}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                {modal==='create'?'Create Order':'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'assign' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Assign Driver</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdPersonAdd size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <p className="text-sm text-gray-500">Order: <span className="font-semibold text-gray-800">{selected?.orderNumber}</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Driver</label>
                <select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} className={inputCls}>
                  <option value="">— Select Driver —</option>
                  {drivers.filter((d) => d.isAvailable).map((d) => (
                    <option key={d._id} value={d._id}>{d.user?.name} — {d.vehicle}</option>
                  ))}
                </select>
                {drivers.filter((d) => d.isAvailable).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 px-3 py-2 rounded-lg">No available drivers right now.</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={handleAssign} disabled={!assignDriverId}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer disabled:opacity-40">
                Assign Driver
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'status' && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdSwapHoriz size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <p className="text-sm text-gray-500">Order: <span className="font-semibold text-gray-800">{selected?.orderNumber}</span></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputCls}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={handleStatus}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
