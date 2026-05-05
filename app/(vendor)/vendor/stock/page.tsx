'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import Toast from '@/components/ui/Toast';
import {
  MdEdit, MdSearch, MdCloudUpload, MdAdd, MdStar,
  MdStarHalf, MdStarOutline, MdFilterList, MdInventory, MdClose,
} from 'react-icons/md';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const CATEGORIES = ['All', 'Meals', 'Beverages', 'Snacks', 'Cargo', 'Fuel', 'Supplies', 'Comfort', 'Safety', 'Hygiene', 'Electronics'];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-amber-400 text-sm">
          {rating >= i ? <MdStar /> : rating >= i - 0.5 ? <MdStarHalf /> : <MdStarOutline />}
        </span>
      ))}
    </span>
  );
}

export default function VendorStockPage() {
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editSku, setEditSku] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', stock: '', unit: '', category: '' });
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  useEffect(() => {
    api.get('/vendors/me/profile').then((res) => {
      const v = res.data.data;
      return api.get(`/skus?vendorId=${v._id}`);
    }).then((res) => setSkus(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (s: any) => {
    setEditSku(s);
    setEditForm({
      name: s.name || '', description: s.description || '',
      price: s.price?.toString() || '0', stock: s.stock?.toString() || '0',
      unit: s.unit || '', category: s.category || 'General',
    });
  };

  const handleEditSave = async () => {
    if (!editSku) return;
    try {
      const payload = {
        name: editForm.name, description: editForm.description,
        price: Number(editForm.price) || 0, stock: Number(editForm.stock) || 0,
        unit: editForm.unit, category: editForm.category,
      };
      await api.put(`/skus/${editSku._id}`, payload);
      setSkus((prev) => prev.map((s) => s._id === editSku._id ? { ...s, ...payload } : s));
      setToast({ message: 'Product updated', type: 'success' });
      setEditSku(null);
    } catch {
      setToast({ message: 'Failed to update product', type: 'error' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploading(uploadTarget);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post(`/skus/${uploadTarget}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSkus((prev) => prev.map((s) => s._id === uploadTarget ? { ...s, image: data.data.image } : s));
      setToast({ message: 'Image uploaded', type: 'success' });
    } catch {
      setToast({ message: 'Failed to upload image', type: 'error' });
    } finally {
      setUploading(null);
      setUploadTarget(null);
      e.target.value = '';
    }
  };

  const triggerUpload = (id: string) => {
    setUploadTarget(id);
    fileRef.current?.click();
  };

  const filtered = skus.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    const matchCategory = category === 'All' || (s.category || 'General') === category;
    return matchSearch && matchCategory;
  });

  // Get unique categories from actual data
  const availableCategories = ['All', ...Array.from(new Set(skus.map((s) => s.category || 'General')))];

  if (loading) return <Spinner fullPage label="Loading products…" />;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <PageHeader title="My Products" subtitle={`${skus.length} products in your catalog`} />

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search products…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div className="relative">
          <MdFilterList size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none">
            {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {availableCategories.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-all ${
              category === c
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}>
            {c}
            {c !== 'All' && <span className="ml-1.5 text-xs opacity-70">({skus.filter((s) => (s.category || 'General') === c).length})</span>}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MdInventory size={48} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s) => {
            const img = s.image ? (s.image.startsWith('http') ? s.image : `${API_BASE}${s.image}`) : null;
            const isLowStock = (s.stock ?? 0) < 10;
            return (
              <div key={s._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                {/* Image */}
                <div className="relative h-44 bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  {img ? (
                    <img src={img} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <MdInventory size={40} />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                  {/* Upload overlay */}
                  <button onClick={() => triggerUpload(s._id)}
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <div className="bg-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      {uploading === s._id ? (
                        <span className="text-xs">Uploading…</span>
                      ) : (
                        <><MdCloudUpload size={16} /> Upload Image</>
                      )}
                    </div>
                  </button>
                  {/* Category badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-semibold text-gray-600 border border-gray-200">
                    {s.category || 'General'}
                  </span>
                  {/* Status */}
                  {!s.isActive && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-100 rounded-full text-[10px] font-bold text-red-600">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{s.description}</p>}

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <Stars rating={s.rating ?? 0} />
                    <span className="text-xs text-gray-400">({s.reviewCount ?? 0})</span>
                  </div>

                  {/* Price + Stock */}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-xl font-bold text-gray-900">${s.price ?? 0}</span>
                      <span className="text-xs text-gray-400 ml-1">/{s.unit || 'unit'}</span>
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isLowStock ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isLowStock ? `⚠️ ${s.stock ?? 0} left` : `${s.stock ?? 0} in stock`}
                    </div>
                  </div>

                  {/* Code */}
                  <p className="text-[10px] text-gray-400 font-mono mt-2">{s.code}</p>

                  {/* Edit Button */}
                  <button onClick={() => openEdit(s)}
                    className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-emerald-200">
                    <MdEdit size={14} /> Edit Product
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Product Drawer */}
      {editSku && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditSku(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
              <button onClick={() => setEditSku(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer">
                <MdClose size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Preview */}
              {editSku.image && (
                <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <img src={editSku.image.startsWith('http') ? editSku.image : `${API_BASE}${editSku.image}`}
                    alt={editSku.name} className="h-32 object-contain rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={inputCls}>
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input type="text" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={() => setEditSku(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={handleEditSave} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
