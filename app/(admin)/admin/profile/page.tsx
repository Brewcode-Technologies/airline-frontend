'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMe());
  }, [dispatch]);

  if (!mounted || loading) return <Spinner fullPage label="Loading profile…" />;

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details" />

      <div className="max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
            <span className="text-sm text-gray-500">Name</span>
            <span className="text-sm font-medium text-gray-800">{user?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-800">{user?.email ?? '—'}</span>
          </div>
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
    </div>
  );
}
