'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDrivers, createDriver, updateDriver, deleteDriver } from '@/store/slices/driversSlice';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import { MdClose } from 'react-icons/md';

const emptyForm = { name: '', email: '', password: '', licenseNumber: '', vehicle: '', isAvailable: true };

export default function DriversPage() {
  const dispatch = useAppDispatch();
  const { list: drivers, loading } = useAppSelector((s) => s.drivers);

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchDrivers()); }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (d: any) => {
    setSelected(d);
    setForm({ name: d.user?.name || '', email: d.user?.email || '', password: '', licenseNumber: d.licenseNumber || '', vehicle: d.vehicle || '', isAvailable: d.isAvailable });
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
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New Driver' : 'Edit Driver'}</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdClose size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {modal === 'create' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="e.g. ravi@driver.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}
              {tf('License Number', 'licenseNumber')}
              {tf('Vehicle', 'vehicle')}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="avail" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="avail" className="text-sm text-gray-700">Available</label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={modal === 'create' ? handleCreate : handleEdit}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                {modal === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
