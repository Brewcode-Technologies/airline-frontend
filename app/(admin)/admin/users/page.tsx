'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/store/slices/usersSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import { MdClose } from 'react-icons/md';
import PasswordInput from '@/components/ui/PasswordInput';

const ROLES = ['admin', 'airline', 'driver', 'vendor'];
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', airline: 'Airline Staff', driver: 'Driver', vendor: 'Vendor' };
const emptyForm: any = { name: '', email: '', password: '', role: 'airline', contact: '', address: '', licenseNumber: '', vehicle: '' };

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list: users, loading } = useAppSelector((s) => s.users);

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'bulkDelete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const allChecked = users.length > 0 && checkedIds.size === users.length;
  const toggleAll = () => setCheckedIds(allChecked ? new Set() : new Set(users.map((u) => u._id)));
  const toggleOne = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const openCreate = () => { setForm(emptyForm); setFormError(''); setModal('create'); };
  const openEdit = (u: any) => {
    setSelected(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setFormError('');
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); };

  const friendlyError = (msg: string) => msg;

  const validateForm = () => {
    if (!form.name.trim()) { setFormError('Name is required'); return false; }
    if (!form.email.trim()) { setFormError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFormError('Please enter a valid email address'); return false; }
    if (modal === 'create' && !form.password) { setFormError('Password is required'); return false; }
    if (form.password && form.password.length < 6) { setFormError('Password must be at least 6 characters'); return false; }
    setFormError('');
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    const r = await dispatch(createUser(form));
    if (createUser.fulfilled.match(r)) { close(); showToast('User created successfully'); }
    else setFormError(friendlyError((r.payload as string) || 'Failed to create user'));
  };
  const handleEdit = async () => {
    if (!validateForm()) return;
    const payload: any = { name: form.name, email: form.email, role: form.role };
    if (form.password) payload.password = form.password;
    const r = await dispatch(updateUser({ id: selected._id, payload }));
    if (updateUser.fulfilled.match(r)) { close(); showToast('User updated successfully'); }
    else setFormError(friendlyError((r.payload as string) || 'Failed to update user'));
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteUser(deleteId));
    if (deleteUser.fulfilled.match(r)) { setDeleteId(null); setModal(null); showToast('User deleted'); }
    else { setDeleteId(null); setModal(null); showToast((r.payload as string) || 'Failed to delete user', 'error'); }
  };
  const handleBulkDelete = async () => {
    await Promise.all([...checkedIds].map((id) => dispatch(deleteUser(id))));
    showToast(`${checkedIds.size} user(s) deleted`);
    setCheckedIds(new Set()); setModal(null);
  };

  const tf = (label: string, key: keyof typeof emptyForm, type = 'text') => {
    const placeholders: Record<string, string> = {
      name:     'e.g. John Smith',
      email:    'e.g. john@airline.com',
      password: modal === 'edit' ? 'Leave blank to keep current password' : 'Min. 6 characters',
    };
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholders[key as string] || ''}
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
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {checkedIds.size > 0 && (
            <Button variant="danger" onClick={() => setModal('bulkDelete')}>
              Delete Selected ({checkedIds.size})
            </Button>
          )}
          <Button onClick={openCreate}>+ New User</Button>
        </div>
      </div>

      {loading ? <Spinner label="Loading users…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                </th>
                {['Name', 'Email', 'Role', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className={`hover:bg-gray-50 ${checkedIds.has(u._id) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={checkedIds.has(u._id)} onChange={() => toggleOne(u._id)} className="w-4 h-4 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3"><Badge label={u.role} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(u)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => { setDeleteId(u._id); setModal('delete'); }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'delete' && (
        <ConfirmModal title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}
      {modal === 'bulkDelete' && (
        <ConfirmModal title={`Delete ${checkedIds.size} User(s)`} message={`Are you sure you want to delete ${checkedIds.size} selected user(s)? This action cannot be undone.`}
          confirmLabel={`Delete ${checkedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setModal(null)} />
      )}

      {modal && !['delete', 'bulkDelete'].includes(modal) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New User' : 'Edit User'}</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdClose size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              {tf('Name', 'name')}
              {tf('Email', 'email', 'email')}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={modal === 'edit' ? 'Leave blank to keep current password' : 'Min. 6 characters'} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              {form.role === 'vendor' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                    <input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="e.g. +1 555-123-4567"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="e.g. Cargo Terminal, JFK Airport, NY"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}
              {form.role === 'driver' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input type="text" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      placeholder="e.g. CDL-TX-2019-78234"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                    <input type="text" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                      placeholder="e.g. Ford F-150 Cargo"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </>
              )}
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
