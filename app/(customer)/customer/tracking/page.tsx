'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdLocationOn, MdTimer, MdDeliveryDining } from 'react-icons/md';
import api from '@/services/api';

export default function CustomerTrackingPage() {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveOrders();
  }, []);

  const loadActiveOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer/orders');
      const active = (data.data || []).filter((o: any) => !['delivered', 'cancelled'].includes(o.status));
      setActiveOrders(active);
      if (active.length > 0) selectOrder(active[0]);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const selectOrder = async (order: any) => {
    setSelectedOrder(order);
    try {
      const { data } = await api.get(`/customer/orders/${order._id}/tracking`);
      setTracking(data.data);
    } catch (e) { /* ignore */ }
  };

  const getSlaRemaining = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return 'Overdue';
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getSlaColorClass = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining <= 0) return 'text-red-600 bg-red-50 border-red-200';
    if (remaining < 5 * 60 * 1000) return 'text-red-600 bg-red-50 border-red-200';
    if (remaining < 10 * 60 * 1000) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-purple-700 bg-purple-50 border-purple-200';
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      picked: 'bg-indigo-100 text-indigo-700',
      enroute: 'bg-orange-100 text-orange-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
        <p className="text-gray-500 mt-1">Real-time tracking for your active orders</p>
      </div>

      {activeOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <MdDeliveryDining size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No active orders</h3>
          <p className="text-gray-500 mt-1">All your orders have been delivered or cancelled</p>
          <Link href="/customer/catalog" className="inline-block mt-4 text-purple-600 hover:underline text-sm">
            Place a new order
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Active Orders ({activeOrders.length})</h3>
            {activeOrders.map((order) => (
              <button
                key={order._id}
                onClick={() => selectOrder(order)}
                className={`w-full text-left bg-white border rounded-xl p-4 transition-colors cursor-pointer ${
                  selectedOrder?._id === order._id ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MdLocationOn size={12} /> {order.deliveryLocation || 'N/A'}</span>
                  {order.slaDeadline && (
                    <span className="flex items-center gap-1"><MdTimer size={12} /> {getSlaRemaining(order.slaDeadline)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tracking Detail */}
          <div className="lg:col-span-2">
            {selectedOrder ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{selectedOrder.orderNumber}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                {/* SLA Timer */}
                {selectedOrder.slaDeadline && (
                  <div className={`border rounded-lg p-4 text-center ${getSlaColorClass(selectedOrder.slaDeadline)}`}>
                    <p className="text-xs font-medium opacity-80">Estimated Delivery</p>
                    <p className="text-2xl font-bold mt-1">{getSlaRemaining(selectedOrder.slaDeadline)}</p>
                    <p className="text-xs mt-1 opacity-70">SLA: 22 minutes</p>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MdLocationOn size={16} className="text-gray-400" />
                    <span>Delivering to: {selectedOrder.deliveryLocation || 'N/A'}</span>
                  </div>
                  {selectedOrder.items && (
                    <p className="text-sm text-gray-500 pl-6">{selectedOrder.items.length} items</p>
                  )}
                </div>

                {/* Status Steps */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Status Updates</h4>
                  {['pending', 'assigned', 'picked', 'enroute', 'delivered'].map((step, idx) => {
                    const stepIdx = ['pending', 'assigned', 'picked', 'enroute', 'delivered'].indexOf(selectedOrder.status);
                    const isComplete = idx <= stepIdx;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full relative ${isComplete ? 'bg-purple-600' : 'bg-gray-200'}`}>
                          {idx === stepIdx && isComplete && (
                            <span className="absolute inset-0 rounded-full bg-purple-600 animate-ping opacity-75" />
                          )}
                        </div>
                        <span className={`text-sm capitalize ${isComplete ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                          {step === 'enroute' ? 'En Route' : step}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Tracking Locations */}
                {tracking?.locations && tracking.locations.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Location Updates</h4>
                    <div className="space-y-2">
                      {tracking.locations.slice(-5).reverse().map((loc: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                          <MdLocationOn size={12} className="text-purple-400" />
                          <span>Lat: {loc.coordinates?.lat?.toFixed(4)}, Lng: {loc.coordinates?.lng?.toFixed(4)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{new Date(loc.recordedAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
                Select an order to view tracking
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
