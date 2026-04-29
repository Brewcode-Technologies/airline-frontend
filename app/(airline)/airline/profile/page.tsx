'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe, updateMe } from '@/store/slices/authSlice';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';

export default function AirlineProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);
  const [airport, setAirport] = useState('');
  const [gate, setGate] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setAirport(user.airport || '');
      setGate(user.gate || '');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const r = await dispatch(updateMe({ airport, gate }));
    setSaving(false);
    updateMe.fulfilled.match(r)
      ? setToast({ message: 'Profile updated', type: 'success' })
      : setToast({ message: 'Failed to update profile', type: 'error' });
  };

  if (!mounted || loading) return <Spinner fullPage label="Loading profile…" />;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader title="Profile" subtitle="Your account details and default airport/gate" />

      <div className="max-w-lg space-y-5">
        {/* Account info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name ?? '—'}</h2>
              <p className="text-blue-100 text-sm">{user?.email ?? '—'}</p>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Role</span>
              {user?.role ? <Badge label={user.role} /> : <span className="text-sm text-gray-400">—</span>}
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-500">Member Since</span>
              <span className="text-sm font-medium text-gray-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Airport / Gate */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Default Airport &amp; Gate</h3>
          <p className="text-xs text-gray-400 mb-4">These will be pre-filled when you create a new bundle order.</p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Airport</label>
              <input
                type="text"
                value={airport}
                onChange={(e) => setAirport(e.target.value)}
                placeholder="e.g. DEL, BOM, JFK, HYD"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gate</label>
              <input
                type="text"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                placeholder="e.g. Gate B4, Gate 12A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
