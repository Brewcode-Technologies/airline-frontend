'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdSearch, MdFilterList, MdShoppingCart, MdStar, MdCheck } from 'react-icons/md';
import api from '@/services/api';

export default function CatalogPage() {
  const [skus, setSkus] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, search, sort]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/customer/categories');
      setCategories(['All', ...(data.data || [])]);
    } catch (e) { /* ignore */ }
  };

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      if (sort) params.sort = sort;
      const { data } = await api.get('/customer/catalog', { params });
      setSkus(data.data || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const addToCart = async (skuId: string) => {
    try {
      await api.post('/customer/cart/add', { skuId, quantity: 1 });
      setAddedItems(prev => ({ ...prev, [skuId]: true }));
      setTimeout(() => setAddedItems(prev => ({ ...prev, [skuId]: false })), 2000);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
        <p className="text-gray-500 mt-1">Browse and order items for delivery to your gate</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading catalog...</div>
      ) : skus.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No items found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skus.map((sku) => (
            <div key={sku._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {sku.image ? (
                  <img src={sku.image} alt={sku.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-4xl">📦</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/customer/catalog/${sku._id}`} className="font-semibold text-gray-900 hover:text-purple-600 text-sm line-clamp-1">
                      {sku.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{sku.category}</p>
                  </div>
                </div>

                {sku.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{sku.description}</p>
                )}

                {/* Rating */}
                {sku.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <MdStar size={14} className="text-yellow-400" />
                    <span className="text-xs text-gray-600">{sku.rating.toFixed(1)}</span>
                    {sku.reviewCount > 0 && <span className="text-xs text-gray-400">({sku.reviewCount})</span>}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gray-900">${sku.price?.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(sku._id)}
                    disabled={addedItems[sku._id]}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      addedItems[sku._id]
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {addedItems[sku._id] ? <><MdCheck size={14} /> Added</> : <><MdShoppingCart size={14} /> Add</>}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
