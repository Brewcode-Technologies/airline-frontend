'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

interface SKU {
  _id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  isActive: boolean;
}

interface CartItem {
  skuId: string;
  quantity: number;
}

function PunchoutCatalog() {
  const searchParams = useSearchParams();
  const buyerCookie = searchParams.get('session') || '';

  const [skus, setSkus] = useState<SKU[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/skus/approved')
      .then(({ data }) => setSkus(data.data.filter((s: SKU) => s.isActive)))
      .catch(() => setError('Failed to load catalog'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (skuId: string) => {
    setCart((prev) =>
      prev.find((i) => i.skuId === skuId)
        ? prev.filter((i) => i.skuId !== skuId)
        : [...prev, { skuId, quantity: 1 }]
    );
  };

  const updateQty = (skuId: string, qty: number) => {
    setCart((prev) => prev.map((i) => i.skuId === skuId ? { ...i, quantity: qty } : i));
  };

  const total = cart.reduce((sum, item) => {
    const sku = skus.find((s) => s._id === item.skuId);
    return sum + (sku?.price ?? 0) * item.quantity;
  }, 0);

  const handleReturn = async () => {
    if (!buyerCookie) { setError('No session cookie — this page must be opened from Coupa.'); return; }
    if (!cart.length) { setError('Add at least one item to the cart.'); return; }
    setReturning(true);
    try {
      await api.post('/coupa/punchout/return', { buyerCookie, items: cart });
      setDone(true);
    } catch {
      setError('Failed to return cart to Coupa. Please try again.');
    } finally {
      setReturning(false);
    }
  };

  if (loading) return <Spinner fullPage label="Loading catalog…" />;

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center max-w-sm">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Cart Returned to Coupa</h2>
        <p className="text-sm text-gray-500">You can close this window. Coupa will create the purchase order.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <PageHeader title="Coupa PunchOut Catalog" subtitle="Select items and return cart to Coupa" />

        {!buyerCookie && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
            ⚠️ No session detected. This page should be opened from your Coupa procurement system.
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Catalog */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Approved Bundle Catalog</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {skus.map((s) => {
              const inCart = cart.find((i) => i.skuId === s._id);
              return (
                <div key={s._id} className={`flex items-center gap-4 px-5 py-3 ${inCart ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={!!inCart} onChange={() => toggle(s._id)} className="w-4 h-4 cursor-pointer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.code} · {s.unit}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">${s.price}</span>
                  {inCart && (
                    <input
                      type="number" min={1} value={inCart.quantity}
                      onChange={(e) => updateQty(s._id, Number(e.target.value))}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              );
            })}
            {skus.length === 0 && (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No approved SKUs found for your account.</p>
            )}
          </div>
        </div>

        {/* Cart summary + return */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Cart Summary</p>
            {cart.map((item) => {
              const sku = skus.find((s) => s._id === item.skuId);
              return (
                <div key={item.skuId} className="flex justify-between text-sm">
                  <span className="text-gray-700">{sku?.name} × {item.quantity}</span>
                  <span className="font-medium text-gray-800">${((sku?.price ?? 0) * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button onClick={handleReturn} disabled={returning || !cart.length}>
          {returning ? 'Returning cart…' : '↩ Return Cart to Coupa'}
        </Button>
      </div>
    </div>
  );
}

export default function PunchoutPage() {
  return (
    <Suspense fallback={<Spinner fullPage label="Loading…" />}>
      <PunchoutCatalog />
    </Suspense>
  );
}
