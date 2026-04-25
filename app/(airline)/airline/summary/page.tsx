'use client';

import { useEffect } from 'react';
import { MdShoppingCart, MdCheckCircle, MdPending, MdPeople } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSummary, fetchOrdersByStatus } from '@/store/slices/analyticsSlice';
import StatCard from '@/components/cards/StatCard';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';

export default function SummaryPage() {
  const dispatch = useAppDispatch();
  const { summary, ordersByStatus, loading } = useAppSelector((s) => s.analytics);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchOrdersByStatus());
  }, [dispatch]);

  if (loading) return <Spinner fullPage label="Loading summary…" />;

  return (
    <div>
      <PageHeader title="Summary" subtitle="Operational overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Orders"      value={summary?.totalOrders ?? 0}     icon={<MdShoppingCart size={22} />} color="blue"   />
        <StatCard title="Delivered"         value={summary?.delivered ?? 0}        icon={<MdCheckCircle size={22} />}  color="green"  />
        <StatCard title="Pending"           value={summary?.pending ?? 0}          icon={<MdPending size={22} />}      color="yellow" />
        <StatCard title="Available Drivers" value={summary?.availableDrivers ?? 0} icon={<MdPeople size={22} />}       color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-w-lg">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Orders by Status</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ordersByStatus.map((row: any) => (
              <tr key={row._id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><Badge label={row._id} /></td>
                <td className="px-4 py-3 font-semibold text-gray-800">{row.count}</td>
              </tr>
            ))}
            {ordersByStatus.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
