'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import Spinner from '@/components/ui/Spinner';
import { MdPrint, MdArrowBack, MdCheckCircle, MdFlight } from 'react-icons/md';

function BillingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderNumber = params.get('order');
  const orderId = params.get('id');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (orderId) {
          const { data } = await api.get(`/orders/${orderId}`);
          setOrder(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) return <Spinner label="Loading invoice…" />;
  if (!order) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-gray-500 mb-4">Order not found</p>
      <button onClick={() => router.push('/airline/create-orders')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm cursor-pointer">Go Back</button>
    </div>
  );

  const items = order.items || [];
  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.sku?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const vendorName = order.vendor?.name || '—';

  return (
    <div className="max-w-3xl mx-auto">
      {/* Actions bar - hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => router.push('/airline/create-orders')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
          <MdArrowBack size={18} /> Back to Orders
        </button>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
          <MdPrint size={18} /> Print Invoice
        </button>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <MdFlight size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Airline Logistics</h1>
              <p className="text-blue-200 text-xs">Invoice / Billing</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-emerald-200">
              <MdCheckCircle size={16} />
              <span className="text-xs font-medium">Order Confirmed</span>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Order Number</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Date</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Flight</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{order.flightNumber || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Gate</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{order.gate || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Vendor</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{vendorName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Passengers</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">{order.passengerCount || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Scheduled At</p>
              <p className="text-sm font-medium text-gray-700 mt-0.5">
                {order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-medium">Status</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full capitalize">{order.status}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-8 py-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="text-center py-2.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="text-right py-2.5 text-xs font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item: any, i: number) => {
                const sku = item.sku || {};
                const price = sku.price ?? 0;
                return (
                  <tr key={i}>
                    <td className="py-3">
                      <p className="font-medium text-gray-800">{sku.name || 'Unknown Item'}</p>
                      <p className="text-xs text-gray-400">{sku.code || ''}</p>
                    </td>
                    <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-700">${price.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">${(price * item.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-800 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18% GST)</span>
                <span className="text-gray-800 font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-base font-bold text-emerald-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">Thank you for your order • Airline Logistics Management</p>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense><BillingContent /></Suspense>;
}
