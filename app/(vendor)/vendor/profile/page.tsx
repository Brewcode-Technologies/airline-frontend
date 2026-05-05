'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';
import { MdBusiness, MdEdit, MdSave, MdClose } from 'react-icons/md';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export default function VendorProfilePage() {
  const [vendor, setVendor]   = useState<any>(null);
  const [form, setForm]       = useState({ name: '', contact: '', email: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    api.get('/vendors/me/profile').then((res) => {
      const v = res.data.data;
      setVendor(v);
      setForm({ name: v.name || '', contact: v.contact || '', email: v.email || '', address: v.address || '' });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/vendors/me/profile', form);
      setVendor(res.data.data);
      setEditing(false);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner fullPage label="Loading profile…" />;
  if (!vendor) return <div className="p-8 text-center text-gray-400">No vendor linked to your account. Contact admin.</div>;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader title="Vendor Profile" subtitle="Manage your vendor information" />

      <div className="max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <MdBusiness size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{vendor.name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vendor.isActive ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'}`}>
              {vendor.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: 'Vendor Name', value: vendor.name },
            { label: 'Contact',     value: vendor.contact },
            { label: 'Email',       value: vendor.email },
            { label: 'Address',     value: vendor.address },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</span>
            </div>
          ))}
          <button onClick={() => setEditing(true)}
            className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors">
            <MdEdit size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Edit Profile Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer">
                <MdClose size={20} />
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              {[
                { label: 'Vendor Name', key: 'name' as const, type: 'text' },
                { label: 'Contact Number', key: 'contact' as const, type: 'text' },
                { label: 'Email', key: 'email' as const, type: 'email' },
                { label: 'Address', key: 'address' as const, type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1">
                <MdSave size={15} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
