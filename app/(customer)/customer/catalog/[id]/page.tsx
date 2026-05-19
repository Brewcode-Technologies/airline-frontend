'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdArrowBack, MdShoppingCart, MdStar, MdAdd, MdRemove, MdCheck } from 'react-icons/md';
import api from '@/services/api';

export default function CatalogItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sku, setSku] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [relatedItems, setRelatedItems] = useState<any[]>([]);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customer/catalog/${id}`);
      setSku(data.data);
      // Load related items from same category
      if (data.data?.category) {
        const { data: related } = await api.get('/customer/catalog', { params: { category: data.data.category } });
        setRelatedItems((related.data || []).filter((s: any) => s._id !== id).slice(0, 4));
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const addToCart = async () => {
    try {
      await api.post('/customer/cart/add', { skuId: id, quantity });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) { /* ignore */ }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!sku) return <div className="text-center py-12 text-gray-400">Item not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
        <MdArrowBack size={18} /> Back to catalog
      </button>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="h-64 md:h-96 bg-gray-100 flex items-center justify-center">
            {sku.image ? (
              <img src={sku.image} alt={sku.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-6xl">📦</div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{sku.category}</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-3">{sku.name}</h1>
              {sku.code && <p className="text-sm text-gray-400 mt-1">SKU: {sku.code}</p>}

              {sku.rating > 0 && (
                <div className="flex items-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MdStar key={star} size={18} className={star <= sku.rating ? 'text-yellow-400' : 'text-gray-200'} />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">{sku.rating.toFixed(1)}</span>
                  {sku.reviewCount > 0 && <span className="text-sm text-gray-400">({sku.reviewCount} reviews)</span>}
                </div>
              )}

              {sku.description && (
                <p className="text-gray-600 mt-4">{sku.description}</p>
              )}

              {sku.unit && (
                <p className="text-sm text-gray-500 mt-2">Unit: {sku.unit}</p>
              )}

              {sku.vendor && (
                <p className="text-sm text-gray-500 mt-1">Vendor: {sku.vendor.name}</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-3xl font-bold text-gray-900">${sku.price?.toFixed(2)}</p>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100 cursor-pointer">
                    <MdRemove size={18} />
                  </button>
                  <span className="px-4 text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-100 cursor-pointer">
                    <MdAdd size={18} />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  disabled={added}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                    added
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {added ? <><MdCheck size={18} /> Added to Cart</> : <><MdShoppingCart size={18} /> Add to Cart</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Related Items</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedItems.map((item) => (
              <div key={item._id} onClick={() => router.push(`/customer/catalog/${item._id}`)}
                className="bg-white border border-gray-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                  {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" /> : <span className="text-2xl">📦</span>}
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                <p className="text-sm font-bold text-purple-600 mt-1">${item.price?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
