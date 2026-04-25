'use client';

import { useEffect } from 'react';
import { MdShoppingCart, MdCheckCircle, MdPending, MdPeople } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSummary } from '@/store/slices/analyticsSlice';
import StatCard from '@/components/cards/StatCard';
import Spinner from '@/components/ui/Spinner';
import PageHeader from '@/components/ui/PageHeader';

export default function AirlineDashboard() {
  const dispatch = useAppDispatch();
  const { summary, loading } = useAppSelector((s) => s.analytics);

  useEffect(() => { dispatch(fetchSummary()); }, [dispatch]);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of airline operations" />
      {loading ? <Spinner label="Loading dashboard…" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total Orders"      value={summary?.totalOrders ?? 0}     icon={<MdShoppingCart size={22} />} color="blue"   />
          <StatCard title="Delivered"         value={summary?.delivered ?? 0}        icon={<MdCheckCircle size={22} />}  color="green"  />
          <StatCard title="Pending"           value={summary?.pending ?? 0}          icon={<MdPending size={22} />}      color="yellow" />
          <StatCard title="Available Drivers" value={summary?.availableDrivers ?? 0} icon={<MdPeople size={22} />}       color="purple" />
        </div>
      )}
    </div>
  );
}
