'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSKUs, createSKU, updateSKU, deleteSKU } from '@/store/slices/skusSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';

const emptyForm = { code: '', name: '', description: '', vendor: '', unit: '' };

export default function SKUsPage() {
  const dispatch = useAppDispatch();
  const { list: skus, loading } = useAppSelector((s) => s.skus);
  const { list: vendors } = useAppSelector((s) => s.vendors);

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'bulkDelete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchSKUs()); dispatch(fetchVendors()); }, [dispatch]);

  const allChecked = skus.length > 0 && checkedIds.size === skus.length;
  const toggleAll = () => setCheckedIds(allChecked ? new Set() : new Set(skus.map((s) => s._id)));
  const toggleOne = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setForm(emptyForm); setModal('create'); };
  const openEdit = (s: any) => {
    setSelected(s);
    setForm({ code: s.code, name: s.name, description: s.description || '', vendor: s.vendor || '', unit: s.unit || '' });
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    const r = await dispatch(createSKU(form)); close();
    createSKU.fulfilled.match(r) ? showToast('SKU created successfully') : showToast('Failed to create SKU', 'error');
  };
  const handleEdit = async () => {
    const r = await dispatch(updateSKU({ id: selected._id, payload: form })); close();
    updateSKU.fulfilled.match(r) ? showToast('SKU updated successfully') : showToast('Failed to update SKU', 'error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteSKU(deleteId)); setDeleteId(null); setModal(null);
    deleteSKU.fulfilled.match(r) ? showToast('SKU deleted') : showToast('Failed to delete SKU', 'error');
  };
  const handleBulkDelete = async () => {
    await Promise.all([...checkedIds].map((id) => dispatch(deleteSKU(id))));
    showToast(`${checkedIds.size} SKU(s) deleted`);
    setCheckedIds(new Set()); setModal(null);
  };

  const tf = (label: string, key: keyof typeof emptyForm) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SKUs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{skus.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {checkedIds.size > 0 && (
            <Button variant="danger" onClick={() => setModal('bulkDelete')}>
              Delete Selected ({checkedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>+ New SKU</Button>
        </div>
      </div>

      {loading ? <Spinner label="Loading SKUs…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                </th>
                {['Code', 'Name', 'Description', 'Unit', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {skus.map((s) => (
                <tr key={s._id} className={`hover:bg-gray-50 ${checkedIds.has(s._id) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedIds.has(s._id)} onChange={() => toggleOne(s._id)} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-gray-800">{s.code}</td>
                  <td className="px-4 py-3 text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{s.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.unit || '—'}</td>
                  <td className="px-4 py-3"><Badge label={s.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeleteId(s._id); setModal('delete'); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {skus.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No SKUs found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="Delete SKU" message="Are you sure you want to delete this SKU? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}
      {modal === 'bulkDelete' && (
        <ConfirmModal title={`Delete ${checkedIds.size} SKU(s)`} message={`Are you sure you want to delete ${checkedIds.size} selected SKU(s)? This action cannot be undone.`}
          confirmLabel={`Delete ${checkedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setModal(null)} />
      )}

      {modal && !['delete', 'bulkDelete'].includes(modal) && (
        <Modal title={modal === 'create' ? 'New SKU' : 'Edit SKU'} onClose={close}>
          {tf('Code', 'code')}
          {tf('Name', 'name')}
          {tf('Description', 'description')}
          {tf('Unit', 'unit')}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
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
