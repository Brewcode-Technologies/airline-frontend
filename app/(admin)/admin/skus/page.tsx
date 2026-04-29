'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSKUs, createSKU, updateSKU, deleteSKU, uploadSKUImage, updateSKUStock, adjustStockLocally } from '@/store/slices/skusSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchUsers } from '@/store/slices/usersSlice';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import { MdStar, MdStarHalf, MdStarOutline, MdAdd, MdRemove, MdEdit, MdDelete, MdCloudUpload, MdInventory, MdLink, MdCheckCircle, MdError } from 'react-icons/md';

const API = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const emptyForm = { code: '', name: '', description: '', vendor: '', unit: '', price: '', stock: '', rating: '', reviewCount: '' };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-yellow-400 text-sm">
          {rating >= i ? <MdStar /> : rating >= i - 0.5 ? <MdStarHalf /> : <MdStarOutline />}
        </span>
      ))}
    </div>
  );
}

function StockControl({ sku }: { sku: any }) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);

  const change = async (delta: number) => {
    const newStock = Math.max(0, (sku.stock ?? 0) + delta);
    dispatch(adjustStockLocally({ id: sku._id, delta }));
    setSaving(true);
    await dispatch(updateSKUStock({ id: sku._id, stock: newStock }));
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => change(-1)}
        disabled={saving || (sku.stock ?? 0) === 0}
        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer transition-colors font-bold text-base leading-none"
      >
        <MdRemove size={18} />
      </button>
      <span className="w-8 text-center text-sm font-bold text-gray-900">{sku.stock ?? 0}</span>
      <button
        onClick={() => change(1)}
        disabled={saving}
        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-green-100 hover:text-green-700 text-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer transition-colors font-bold text-base leading-none"
      >
        <MdAdd size={18} />
      </button>
    </div>
  );
}

function ImageDisplay({ sku }: { sku: any }) {
  const cacheBust = sku._cacheBust || '';
  const imgSrc = sku.image
    ? `${sku.image.startsWith('http') ? sku.image : `${API}${sku.image}`}?v=${cacheBust}`
    : null;

  return (
    <div className="w-full h-44 bg-gray-50 rounded-t-xl overflow-hidden border-b border-gray-100 flex items-center justify-center">
      {imgSrc ? (
        <img src={imgSrc} alt={sku.name} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <MdInventory size={40} />
          <span className="text-xs">No image</span>
        </div>
      )}
    </div>
  );
}

function ModalImageUpload({ sku, onUpdated }: { sku: any; onUpdated: (s: any) => void }) {
  const dispatch = useAppDispatch();
  const fileRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput,  setUrlInput]  = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [status,    setStatus]    = useState<'idle' | 'success' | 'error'>('idle');
  const [preview,   setPreview]   = useState<string | null>(null);

  const cacheBust = sku._cacheBust || '';
  const currentImg = sku.image
    ? `${sku.image.startsWith('http') ? sku.image : `${API}${sku.image}`}?v=${cacheBust}`
    : null;

  const flash = (s: 'success' | 'error') => {
    setStatus(s);
    setTimeout(() => setStatus('idle'), 2500);
  };

  // local file upload
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const result = await dispatch(uploadSKUImage({ id: sku._id, file }));
    setUploading(false);
    e.target.value = '';
    if (uploadSKUImage.fulfilled.match(result)) {
      onUpdated(result.payload);
      setPreview(null);
      flash('success');
    } else {
      setPreview(null);
      flash('error');
    }
  };

  // URL save
  const handleSaveUrl = async () => {
    if (!urlInput.trim()) return;
    setSavingUrl(true);
    const result = await dispatch(updateSKU({ id: sku._id, payload: { image: urlInput.trim() } }));
    setSavingUrl(false);
    if (updateSKU.fulfilled.match(result)) {
      onUpdated(result.payload);
      setUrlInput('');
      flash('success');
    } else {
      flash('error');
    }
  };

  const displayImg = preview || currentImg;

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Image</p>

      <div className="flex gap-4">
        {/* Preview box */}
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0 group"
        >
          {displayImg ? (
            <img src={displayImg} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-300">
              <MdInventory size={28} />
              <span className="text-xs">No image</span>
            </div>
          )}
          {/* hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
            {uploading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <>
                  <MdCloudUpload size={20} className="text-white" />
                  <span className="text-white text-xs font-medium">Upload</span>
                </>
            }
          </div>
          {/* status badge */}
          {status === 'success' && (
            <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
              <MdCheckCircle size={28} className="text-white" />
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
              <MdError size={28} className="text-white" />
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Right side controls */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Local file button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 w-full justify-center"
          >
            {uploading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
              : <><MdCloudUpload size={16} /> Upload from Computer</>
            }
          </button>

          {/* URL input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MdLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                placeholder="Paste image URL…"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveUrl}
              disabled={!urlInput.trim() || savingUrl}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40"
            >
              {savingUrl ? '…' : 'Save'}
            </button>
          </div>

          <p className="text-xs text-gray-400">Click the preview or button to upload a local file, or paste an image URL above.</p>
        </div>
      </div>
    </div>
  );
}

export default function SKUsPage() {
  const dispatch = useAppDispatch();
  const { list: skus, loading } = useAppSelector((s) => s.skus);
  const { list: vendors } = useAppSelector((s) => s.vendors);
  const { list: users } = useAppSelector((s) => s.users);
  const airlineUsers = users.filter((u) => u.role === 'airline');

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [approvedAirlines, setApprovedAirlines] = useState<string[]>([]);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    dispatch(fetchSKUs());
    dispatch(fetchVendors());
    dispatch(fetchUsers());
  }, [dispatch]);

  const openCreate = () => {
    setForm(emptyForm);
    setApprovedAirlines([]);
    setCreateImageFile(null);
    setCreateImagePreview(null);
    setModal('create');
  };
  const openEdit = (s: any) => {
    setSelected(s);
    setForm({
      code: s.code, name: s.name, description: s.description || '',
      vendor: s.vendor?._id || s.vendor || '', unit: s.unit || '',
      price: s.price?.toString() || '', stock: s.stock?.toString() || '0',
      rating: s.rating?.toString() || '0', reviewCount: s.reviewCount?.toString() || '0',
    });
    setApprovedAirlines((s.approvedAirlines || []).map((a: any) => a._id || a));
    setModal('edit');
  };
  const close = () => {
    setModal(null);
    setSelected(null);
    setApprovedAirlines([]);
    setCreateImageFile(null);
    setCreateImagePreview(null);
  };

  const handleCreate = async () => {
    const r = await dispatch(createSKU({
      ...form, price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      approvedAirlines,
    }));
    if (createSKU.fulfilled.match(r)) {
      const newSkuId = r.payload._id;
      // if local file was selected, upload it
      if (createImageFile) {
        await dispatch(uploadSKUImage({ id: newSkuId, file: createImageFile }));
      }
      // if URL was pasted (preview exists but no file), save the URL
      else if (createImagePreview && !createImageFile) {
        await dispatch(updateSKU({ id: newSkuId, payload: { image: createImagePreview } }));
      }
      close();
      showToast('SKU created');
    } else {
      close();
      showToast('Failed to create SKU', 'error');
    }
  };

  const handleEdit = async () => {
    const r = await dispatch(updateSKU({
      id: selected._id,
      payload: {
        ...form, price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        rating: Number(form.rating) || 0,
        reviewCount: Number(form.reviewCount) || 0,
        approvedAirlines,
      },
    }));
    close();
    updateSKU.fulfilled.match(r) ? showToast('SKU updated') : showToast('Failed to update SKU', 'error');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteSKU(deleteId));
    setDeleteId(null); setModal(null);
    deleteSKU.fulfilled.match(r) ? showToast('SKU deleted') : showToast('Failed to delete SKU', 'error');
  };

  const filtered = skus.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  );

  const tf = (label: string, key: keyof typeof emptyForm, type = 'text') => {
    const placeholders: Record<string, string> = {
      code:        'e.g. SKU-MEAL-VEG-001',
      name:        'e.g. Vegetarian Meal Box',
      description: 'Short product description…',
      unit:        'e.g. box, pack, bottle, kit',
      price:       '0.00',
      stock:       '0',
      rating:      '0.0',
      reviewCount: '0',
    };
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholders[key] || ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SKUs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{skus.length} products</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
          <Button onClick={openCreate}>+ New SKU</Button>
        </div>
      </div>

      {loading ? <Spinner label="Loading products…" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">

              {/* Product image — display only, upload via Edit modal */}
              <ImageDisplay sku={s} />

              {/* Product info */}
              <div className="p-4 flex flex-col flex-1">

                {/* Vendor badge */}
                {s.vendor?.name && (
                  <p className="text-xs text-blue-600 font-medium mb-1">{s.vendor.name}</p>
                )}

                {/* Name */}
                <p className="text-sm font-semibold text-gray-800 leading-snug mb-1 line-clamp-2">{s.name}</p>

                {/* Code */}
                <p className="text-xs font-mono text-gray-400 mb-2">{s.code}</p>

                {/* Description */}
                {s.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{s.description}</p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-2">
                  <StarRating rating={s.rating ?? 0} />
                  <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                    ({(s.reviewCount ?? 0).toLocaleString()})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-lg font-bold text-gray-900">${s.price ?? 0}</span>
                  <span className="text-xs text-gray-400">/ {s.unit || 'unit'}</span>
                </div>

                {/* Approved airlines */}
                {(s.approvedAirlines || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(s.approvedAirlines || []).slice(0, 2).map((a: any) => (
                      <span key={a._id || a} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                        {a.name || a.email || a}
                      </span>
                    ))}
                    {(s.approvedAirlines || []).length > 2 && (
                      <span className="text-xs text-gray-400">+{(s.approvedAirlines || []).length - 2} more</span>
                    )}
                  </div>
                )}

                {/* Status + stock */}
                <div className="flex items-center justify-between mb-3">
                  <Badge label={s.isActive ? 'active' : 'inactive'} />
                  <span className={`text-xs font-medium ${(s.stock ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(s.stock ?? 0) > 0 ? `${s.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Quantity control */}
                <div className="flex items-center justify-between mb-4 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</span>
                  <StockControl sku={s} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <MdEdit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => { setDeleteId(s._id); setModal('delete'); }}
                    className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer border border-red-200"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <MdInventory size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No products found</p>
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && (
        <ConfirmModal title="Delete SKU" message="Are you sure you want to delete this SKU?"
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete}
          onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal title={modal === 'create' ? 'New SKU' : 'Edit SKU'} onClose={close} size="lg">

          {/* Image upload — edit mode */}
          {modal === 'edit' && selected && (
            <ModalImageUpload sku={selected} onUpdated={(updatedSku) => setSelected(updatedSku)} />
          )}

          {/* Image upload — create mode */}
          {modal === 'create' && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Image</p>
              <div className="flex gap-4">
                {/* Preview */}
                <div
                  onClick={() => createFileRef.current?.click()}
                  className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0 group"
                >
                  {createImagePreview ? (
                    <img src={createImagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-300 group-hover:text-blue-400 transition-colors">
                      <MdCloudUpload size={28} />
                      <span className="text-xs">Click to add</span>
                    </div>
                  )}
                </div>
                <input
                  ref={createFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setCreateImageFile(file);
                    setCreateImagePreview(file ? URL.createObjectURL(file) : null);
                    e.target.value = '';
                  }}
                />
                <div className="flex-1 flex flex-col gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => createFileRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer w-full"
                  >
                    <MdCloudUpload size={16} />
                    {createImageFile ? 'Change Image' : 'Upload from Computer'}
                  </button>

                  {/* URL input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MdLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        placeholder="Or paste image URL…"
                        onChange={(e) => {
                          const url = e.target.value.trim();
                          if (url) {
                            setCreateImageFile(null);
                            setCreateImagePreview(url);
                          } else {
                            setCreateImagePreview(null);
                          }
                        }}
                        className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {createImageFile && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <MdCheckCircle size={14} className="text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700 truncate">{createImageFile.name}</span>
                      <button
                        onClick={() => { setCreateImageFile(null); setCreateImagePreview(null); }}
                        className="ml-auto text-gray-400 hover:text-red-500 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Basic info */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Basic Info</p>
          <div className="grid grid-cols-2 gap-x-4">
            {tf('Code *', 'code')}
            {tf('Name *', 'name')}
            {tf('Unit (e.g. box, pack)', 'unit')}
            {tf('Price ($)', 'price', 'number')}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Short product description…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Inventory & ratings */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Inventory & Ratings</p>
          <div className="grid grid-cols-3 gap-x-4">
            {tf('Stock (qty)', 'stock', 'number')}
            {tf('Rating (0–5)', 'rating', 'number')}
            {tf('Review Count', 'reviewCount', 'number')}
          </div>

          {/* Vendor */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vendor</p>
          <div className="mb-4">
            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>

          {/* Approved Airlines */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Approved Airlines</p>
          <div className="mb-5 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-36 overflow-y-auto">
            {airlineUsers.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No airline users found</p>}
            {airlineUsers.map((u) => (
              <label key={u._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox"
                  checked={approvedAirlines.includes(u._id)}
                  onChange={() => setApprovedAirlines((prev) =>
                    prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                  )}
                  className="w-4 h-4 cursor-pointer accent-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                {approvedAirlines.includes(u._id) && (
                  <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">Approved</span>
                )}
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={modal === 'create' ? handleCreate : handleEdit}>
              {modal === 'create' ? 'Create SKU' : 'Save Changes'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
