'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe } from '@/store/slices/authSlice';
import { updateDriverStatus } from '@/store/slices/driversSlice';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import api from '@/services/api';

export default function DriverDetailsPage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMe());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    api.get('/drivers').then(({ data }) => {
      const found = data.data.find((d: any) => d.user?._id === user._id || d.user?.email === user.email);
      if (found) setDriverInfo(found);
    });
  }, [user]);

  const toggleAvailability = async () => {
    if (!driverInfo) return;
    setToggling(true);
    const result = await dispatch(updateDriverStatus({ id: driverInfo._id, isAvailable: !driverInfo.isAvailable }));
    if (updateDriverStatus.fulfilled.match(result)) {
      setDriverInfo({ ...driverInfo, isAvailable: !driverInfo.isAvailable });
    }
    setToggling(false);
  };

  if (!mounted || loading) return <Spinner fullPage label="Loading profile…" />;

  return (
    <div>
      <PageHeader title="My Details" subtitle="Your driver profile" />

      <div className="max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name ?? '—'}</h2>
            <p className="text-orange-100 text-sm">{user?.email ?? '—'}</p>
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
          {driverInfo && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Vehicle</span>
                <span className="text-sm font-medium text-gray-800">{driverInfo.vehicle || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">License</span>
                <span className="text-sm font-medium text-gray-800">{driverInfo.licenseNumber || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-500">Availability</span>
                <div className="flex items-center gap-3">
                  <Badge label={driverInfo.isAvailable ? 'active' : 'inactive'} />
                  <Button size="sm" variant="secondary" onClick={toggleAvailability} disabled={toggling}>
                    {toggling ? '…' : driverInfo.isAvailable ? 'Set Unavailable' : 'Set Available'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
