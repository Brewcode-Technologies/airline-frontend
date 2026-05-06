'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVendors, createVendor, updateVendor, deleteVendor } from '@/store/slices/vendorsSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import Link from 'next/link';
import { MdClose } from 'react-icons/md';

const emptyForm = { name: '', contact: '', email: '', address: '', password: '' };

export default function VendorsPage() {
  const dispatch = useAppDispatch();
  const { list: vendors, loading } = useAppSelector((s) => s.vendors);

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'bulkDelete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchVendors()); }, [dispatch]);

  const allChecked = vendors.length > 0 && checkedIds.size === vendors.length;
  const toggleAll = () => setCheckedIds(allChecked ? new Set() : new Set(vendors.map((v) => v._id)));
  const toggleOne = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (v: any) => {
    setSelected(v);
    setForm({ name: v.name, contact: v.contact || '', email: v.email || '', address: v.address || '', password: '' });
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    const r = await dispatch(createVendor(form)); close();
    createVendor.fulfilled.match(r) ? showToast('Vendor created successfully') : showToast('Failed to create vendor', 'error');
  };
  const handleEdit = async () => {
    const r = await dispatch(updateVendor({ id: selected._id, payload: form })); close();
    updateVendor.fulfilled.match(r) ? showToast('Vendor updated successfully') : showToast('Failed to update vendor', 'error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteVendor(deleteId)); setDeleteId(null); setModal(null);
    deleteVendor.fulfilled.match(r) ? showToast('Vendor deleted') : showToast('Failed to delete vendor', 'error');
  };
  const handleBulkDelete = async () => {
    await Promise.all([...checkedIds].map((id) => dispatch(deleteVendor(id))));
    showToast(`${checkedIds.size} vendor(s) deleted`);
    setCheckedIds(new Set()); setModal(null);
  };

  const tf = (label: string, key: keyof typeof emptyForm, type = 'text') => {
    const placeholders: Record<string, string> = {
      name:    'e.g. IndiGo Catering Services',
      contact: 'e.g. +91 98765 43210',
      email:   'e.g. vendor@airline.com',
      address: 'e.g. Terminal 1, IGI Airport, Delhi',
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
          <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vendors.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {checkedIds.size > 0 && (
            <Button variant="danger" onClick={() => setModal('bulkDelete')}>
              Delete Selected ({checkedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>+ New Vendor</Button>
        </div>
      </div>

      {loading ? <Spinner label="Loading vendors…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                </th>
                {['Name', 'Contact', 'Email', 'Address', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v._id} className={`hover:bg-gray-50 ${checkedIds.has(v._id) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedIds.has(v._id)} onChange={() => toggleOne(v._id)} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{v.name}</td>
                  <td className="px-4 py-3 text-gray-600">{v.contact || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.address || '—'}</td>
                  <td className="px-4 py-3"><Badge label={v.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/vendors/${v._id}`}><Button size="sm">View</Button></Link>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeleteId(v._id); setModal('delete'); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No vendors found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="Delete Vendor" message="Are you sure you want to delete this vendor? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}
      {modal === 'bulkDelete' && (
        <ConfirmModal title={`Delete ${checkedIds.size} Vendor(s)`} message={`Are you sure you want to delete ${checkedIds.size} selected vendor(s)? This action cannot be undone.`}
          confirmLabel={`Delete ${checkedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setModal(null)} />
      )}

      {modal && !['delete', 'bulkDelete'].includes(modal) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New Vendor' : 'Edit Vendor'}</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdClose size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {tf('Name', 'name')}
              {tf('Contact', 'contact')}
              {tf('Email', 'email', 'email')}
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters — vendor login password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-400 mt-1">This creates a vendor login account with the email above.</p>
                </div>
              )}
              {tf('Address', 'address')}
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
