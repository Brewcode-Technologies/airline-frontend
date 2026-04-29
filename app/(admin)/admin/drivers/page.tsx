'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDrivers, createDriver, updateDriver, deleteDriver } from '@/store/slices/driversSlice';
import { fetchUsers } from '@/store/slices/usersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';

const emptyForm = { user: '', licenseNumber: '', vehicle: '', isAvailable: true };

export default function DriversPage() {
  const dispatch = useAppDispatch();
  const { list: drivers, loading } = useAppSelector((s) => s.drivers);
  const { list: users } = useAppSelector((s) => s.users);

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchDrivers()); dispatch(fetchUsers()); }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (d: any) => {
    setSelected(d);
    setForm({ user: d.user?._id || '', licenseNumber: d.licenseNumber || '', vehicle: d.vehicle || '', isAvailable: d.isAvailable });
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    const r = await dispatch(createDriver(form)); close();
    createDriver.fulfilled.match(r) ? showToast('Driver created successfully') : showToast('Failed to create driver', 'error');
  };
  const handleEdit = async () => {
    const r = await dispatch(updateDriver({ id: selected._id, payload: form })); close();
    updateDriver.fulfilled.match(r) ? showToast('Driver updated successfully') : showToast('Failed to update driver', 'error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteDriver(deleteId)); setDeleteId(null); setModal(null);
    deleteDriver.fulfilled.match(r) ? showToast('Driver deleted') : showToast('Failed to delete driver', 'error');
  };

  const tf = (label: string, key: 'licenseNumber' | 'vehicle') => {
    const placeholders: Record<string, string> = {
      licenseNumber: 'e.g. DL-AP-2019-001234',
      vehicle:       'e.g. Tata Ace Truck',
    };
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="text"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholders[key]}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
      <PageHeader title="Drivers" subtitle={`${drivers.length} total`} action={<Button onClick={openCreate}>+ New Driver</Button>} />

      {loading ? <Spinner label="Loading drivers…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Name', 'Email', 'License', 'Vehicle', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{d.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.user?.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.licenseNumber || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{d.vehicle || '—'}</td>
                  <td className="px-4 py-3"><Badge label={d.isAvailable ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(d)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeleteId(d._id); setModal('delete'); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No drivers found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="Delete Driver" message="Are you sure you want to delete this driver? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}

      {modal && modal !== 'delete' && (
        <Modal title={modal === 'create' ? 'New Driver' : 'Edit Driver'} onClose={close}>
          {modal === 'create' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select User —</option>
                {users.filter((u) => u.role === 'driver').map((u) => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}
          {tf('License Number', 'licenseNumber')}
          {tf('Vehicle', 'vehicle')}
          <div className="mb-4 flex items-center gap-2">
            <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="avail" className="text-sm text-gray-700">Available</label>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={modal === 'create' ? handleCreate : handleEdit}>{modal === 'create' ? 'Create' : 'Save'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
