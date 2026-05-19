'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdDelete, MdAdd, MdRemove, MdShoppingCart, MdLocationOn, MdPhone, MdNotes } from 'react-icons/md';
import api from '@/services/api';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any>({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ deliveryLocation: '', deliveryInstructions: '', customerPhone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customer/cart');
      setCart(data.data || { items: [], totalAmount: 0 });
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const updateQuantity = async (skuId: string, quantity: number) => {
    try {
      const { data } = await api.put('/customer/cart/update', { skuId, quantity });
      setCart(data.data);
    } catch (e) { /* ignore */ }
  };

  const removeItem = async (skuId: string) => {
    try {
      const { data } = await api.delete(`/customer/cart/remove/${skuId}`);
      setCart(data.data);
    } catch (e) { /* ignore */ }
  };

  const clearCart = async () => {
    try {
      await api.delete('/customer/cart/clear');
      setCart({ items: [], totalAmount: 0 });
    } catch (e) { /* ignore */ }
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.deliveryLocation) { setError('Delivery location is required'); return; }
    setPlacing(true);
    try {
      await api.post('/customer/orders', form);
      setSuccess(true);
      setCart({ items: [], totalAmount: 0 });
      setTimeout(() => router.push('/customer/orders'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
    setPlacing(false);
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading cart...</div>;

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
        <p className="text-gray-500 mt-2">Your order will be delivered within 22 minutes.</p>
        <p className="text-sm text-gray-400 mt-1">Redirecting to orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
          <p className="text-gray-500 mt-1">{cart.items?.length || 0} items</p>
        </div>
        {cart.items?.length > 0 && (
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 cursor-pointer">
            Clear Cart
          </button>
        )}
      </div>

      {!cart.items || cart.items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <MdShoppingCart size={48} className="text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">Your cart is empty</h3>
          <p className="text-gray-500 mt-1">Browse the catalog to add items</p>
          <Link href="/customer/catalog" className="inline-block mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item: any) => (
              <div key={item.sku?._id || item._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  {item.sku?.image ? (
                    <img src={item.sku.image} alt={item.sku.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.sku?.name || 'Item'}</p>
                  <p className="text-sm text-gray-500">${item.price?.toFixed(2)} each</p>
                </div>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => updateQuantity(item.sku?._id, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 cursor-pointer">
                    <MdRemove size={16} />
                  </button>
                  <span className="px-3 text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.sku?._id, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 cursor-pointer">
                    <MdAdd size={16} />
                  </button>
                </div>
                <p className="font-semibold text-gray-900 text-sm w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeItem(item.sku?._id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                  <MdDelete size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.items.length} items)</span>
                  <span>${cart.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${cart.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={placeOrder} className="mt-5 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Delivery Location *</label>
                  <div className="relative">
                    <MdLocationOn size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" required value={form.deliveryLocation}
                      onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
                      placeholder="Gate A2, Seat 14B, etc."
                      className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phone</label>
                  <div className="relative">
                    <MdPhone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="tel" value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1.5">Instructions</label>
                  <div className="relative">
                    <MdNotes size={16} className="absolute left-3 top-3 text-gray-500" />
                    <textarea value={form.deliveryInstructions}
                      onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })}
                      placeholder="Any special instructions..."
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none" />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button type="submit" disabled={placing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer">
                  {placing ? 'Placing Order...' : `Place Order — $${cart.totalAmount?.toFixed(2)}`}
                </button>

                <p className="text-xs text-gray-400 text-center">Delivery within 22 minutes guaranteed</p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
