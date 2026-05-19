'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdArrowBack, MdLocationOn, MdPerson, MdPhone, MdStar, MdCancel } from 'react-icons/md';
import api from '@/services/api';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    loadOrder();
    loadFeedback();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customer/orders/${id}`);
      setOrder(data.data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const loadFeedback = async () => {
    try {
      const { data } = await api.get(`/customer/orders/${id}/feedback`);
      setFeedback(data.data);
    } catch (e) { /* ignore */ }
  };

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/customer/orders/${id}/cancel`);
      loadOrder();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot cancel order');
    }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmittingFeedback(true);
    try {
      await api.post(`/customer/orders/${id}/feedback`, { rating, comment });
      setFeedbackSuccess(true);
      loadFeedback();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    }
    setSubmittingFeedback(false);
  };

  const statusSteps = ['pending', 'assigned', 'picked', 'enroute', 'delivered'];
  const currentStepIdx = order ? statusSteps.indexOf(order.status) : 0;

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      picked: 'bg-indigo-100 text-indigo-700',
      enroute: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!order) return <div className="text-center py-12 text-gray-400">Order not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
        <MdArrowBack size={18} /> Back to orders
      </button>

      {/* Order Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${statusColor(order.status)}`}>
              {order.status}
            </span>
            {order.status === 'pending' && (
              <button onClick={cancelOrder} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 cursor-pointer">
                <MdCancel size={16} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx <= currentStepIdx ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <p className={`text-xs mt-1 capitalize ${idx <= currentStepIdx ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                  {step}
                </p>
                {idx < statusSteps.length - 1 && (
                  <div className={`hidden sm:block absolute h-0.5 w-full ${idx < currentStepIdx ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          {order.slaDeadline && order.status !== 'delivered' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              Expected delivery by: {new Date(order.slaDeadline).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* Delivery Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Delivery Details</h3>
        <div className="space-y-2 text-sm">
          {order.deliveryLocation && (
            <div className="flex items-center gap-2 text-gray-600">
              <MdLocationOn size={16} className="text-gray-400" />
              <span>{order.deliveryLocation}</span>
            </div>
          )}
          {order.customerPhone && (
            <div className="flex items-center gap-2 text-gray-600">
              <MdPhone size={16} className="text-gray-400" />
              <span>{order.customerPhone}</span>
            </div>
          )}
          {order.deliveryInstructions && (
            <p className="text-gray-600 mt-2 pl-6">{order.deliveryInstructions}</p>
          )}
          {order.driver?.user && (
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <MdPerson size={16} className="text-gray-400" />
              <span>Driver: {order.driver.user.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm">📦</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.sku?.name || 'Item'}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">${((item.sku?.price || 0) * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          {order.services?.map((svc: any, idx: number) => (
            <div key={`svc-${idx}`} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-sm">{svc.service?.icon || '🛎️'}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{svc.service?.name || 'Service'}</p>
                  <p className="text-xs text-purple-600">Service • Qty: {svc.quantity}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">${((svc.service?.price || 0) * svc.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>${(
            (order.items?.reduce((sum: number, i: any) => sum + ((i.sku?.price || 0) * i.quantity), 0) || 0) +
            (order.services?.reduce((sum: number, s: any) => sum + ((s.service?.price || 0) * s.quantity), 0) || 0)
          ).toFixed(2)}</span>
        </div>
      </div>

      {/* Feedback */}
      {order.status === 'delivered' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Feedback</h3>
          {feedback ? (
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <MdStar key={star} size={20} className={star <= feedback.rating ? 'text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              {feedback.comment && <p className="text-sm text-gray-600 mt-2">{feedback.comment}</p>}
              <p className="text-xs text-gray-400 mt-1">Submitted on {new Date(feedback.createdAt).toLocaleDateString()}</p>
            </div>
          ) : feedbackSuccess ? (
            <p className="text-sm text-green-600">Thank you for your feedback!</p>
          ) : (
            <form onSubmit={submitFeedback} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rate your delivery</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="cursor-pointer">
                      <MdStar size={28} className={star <= rating ? 'text-yellow-400' : 'text-gray-200'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Any comments? (optional)" rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <button type="submit" disabled={rating === 0 || submittingFeedback}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 cursor-pointer">
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
