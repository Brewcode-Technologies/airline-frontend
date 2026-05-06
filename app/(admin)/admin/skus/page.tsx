'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSKUs, createSKU, updateSKU, deleteSKU, uploadSKUImage, updateSKUStock, adjustStockLocally } from '@/store/slices/skusSlice';
import { fetchVendors } from '@/store/slices/vendorsSlice';
import { fetchUsers } from '@/store/slices/usersSlice';
import Spinner from '@/components/ui/Spinner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdInventory, MdClose,
  MdRemove, MdCloudUpload, MdLink, MdCheckCircle, MdError,
  MdStar, MdStarHalf, MdStarOutline, MdOutlineInbox,
} from 'react-icons/md';

const API       = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const emptyForm = { code: '', name: '', description: '', vendor: '', unit: '', price: '', stock: '', rating: '', reviewCount: '', category: '' };
const inputCls  = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

/* ── helpers ── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} className="text-amber-400 text-xs">
          {rating >= i ? <MdStar /> : rating >= i - 0.5 ? <MdStarHalf /> : <MdStarOutline />}
        </span>
      ))}
    </span>
  );
}

function StockControl({ sku }: { sku: any }) {
  const dispatch = useAppDispatch();
  const [saving, setSaving] = useState(false);
  const change = async (delta: number) => {
    dispatch(adjustStockLocally({ id: sku._id, delta }));
    setSaving(true);
    await dispatch(updateSKUStock({ id: sku._id, stock: Math.max(0, (sku.stock ?? 0) + delta) }));
    setSaving(false);
  };
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => change(-1)} disabled={saving || (sku.stock ?? 0) === 0}
        className="w-7 h-7 rounded-md bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 flex items-center justify-center disabled:opacity-30 cursor-pointer transition-colors">
        <MdRemove size={14} />
      </button>
      <span className="w-7 text-center text-sm font-semibold text-gray-900">{sku.stock ?? 0}</span>
      <button onClick={() => change(1)} disabled={saving}
        className="w-7 h-7 rounded-md bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-600 flex items-center justify-center disabled:opacity-30 cursor-pointer transition-colors">
        <MdAdd size={14} />
      </button>
    </div>
  );
}

function ModalImageUpload({ sku, onUpdated }: { sku: any; onUpdated: (s: any) => void }) {
  const dispatch  = useAppDispatch();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput]   = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [status, setStatus]       = useState<'idle'|'success'|'error'>('idle');
  const [preview, setPreview]     = useState<string|null>(null);

  const cacheBust  = sku._cacheBust || '';
  const currentImg = sku.image ? `${sku.image.startsWith('http') ? sku.image : `${API}${sku.image}`}?v=${cacheBust}` : null;
  const flash = (s: 'success'|'error') => { setStatus(s); setTimeout(() => setStatus('idle'), 2500); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPreview(URL.createObjectURL(file)); setUploading(true);
    const r = await dispatch(uploadSKUImage({ id: sku._id, file }));
    setUploading(false); e.target.value = '';
    if (uploadSKUImage.fulfilled.match(r)) { onUpdated(r.payload); setPreview(null); flash('success'); }
    else { setPreview(null); flash('error'); }
  };
  const handleSaveUrl = async () => {
    if (!urlInput.trim()) return; setSavingUrl(true);
    const r = await dispatch(updateSKU({ id: sku._id, payload: { image: urlInput.trim() } }));
    setSavingUrl(false);
    if (updateSKU.fulfilled.match(r)) { onUpdated(r.payload); setUrlInput(''); flash('success'); }
    else flash('error');
  };

  const displayImg = preview || currentImg;
  return (
    <div className="mb-5 pb-5 border-b border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Image</p>
      <div className="flex gap-4">
        <div onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0 group">
          {displayImg ? <img src={displayImg} alt="preview" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1 text-gray-300 group-hover:text-blue-400"><MdInventory size={24} /><span className="text-xs">No image</span></div>}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <MdCloudUpload size={20} className="text-white" />}
          </div>
          {status === 'success' && <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center"><MdCheckCircle size={24} className="text-white" /></div>}
          {status === 'error'   && <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center"><MdError size={24} className="text-white" /></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        <div className="flex-1 flex flex-col gap-2 justify-center">
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-50 transition-colors">
            {uploading ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</> : <><MdCloudUpload size={15} /> Upload File</>}
          </button>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MdLink size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                placeholder="Or paste image URL…"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleSaveUrl} disabled={!urlInput.trim() || savingUrl}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg cursor-pointer disabled:opacity-40 transition-colors">
              {savingUrl ? '…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function SKUsPage() {
  const dispatch = useAppDispatch();
  const { list: skus, loading } = useAppSelector((s) => s.skus);
  const { list: vendors }       = useAppSelector((s) => s.vendors);
  const { list: users }         = useAppSelector((s) => s.users);
  const airlineUsers = users.filter((u) => u.role === 'airline');

  const [modal, setModal]       = useState<'create'|'edit'|'delete'|null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [form, setForm]         = useState(emptyForm);
  const [approvedAirlines, setApprovedAirlines] = useState<string[]>([]);
  const [createImageFile, setCreateImageFile]   = useState<File|null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string|null>(null);
  const [search, setSearch]     = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkVendor, setBulkVendor] = useState('');
  const [toast, setToast]       = useState<{message:string;type:'success'|'error'}|null>(null);
  const createFileRef = useRef<HTMLInputElement>(null);

  const showToast  = (message: string, type: 'success'|'error' = 'success') => setToast({ message, type });
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { dispatch(fetchSKUs()); dispatch(fetchVendors()); dispatch(fetchUsers()); }, [dispatch]);

  const openCreate = () => { setForm(emptyForm); setApprovedAirlines([]); setCreateImageFile(null); setCreateImagePreview(null); setModal('create'); };
  const openEdit   = (s: any) => {
    setSelected(s);
    setForm({ code: s.code, name: s.name, description: s.description||'', vendor: s.vendor?._id||s.vendor||'', unit: s.unit||'', price: s.price?.toString()||'', stock: s.stock?.toString()||'0', rating: s.rating?.toString()||'0', reviewCount: s.reviewCount?.toString()||'0', category: s.category||'General' });
    setApprovedAirlines((s.approvedAirlines||[]).map((a: any) => a._id||a));
    setModal('edit');
  };
  const close = () => { setModal(null); setSelected(null); setApprovedAirlines([]); setCreateImageFile(null); setCreateImagePreview(null); };

  const handleCreate = async () => {
    const r = await dispatch(createSKU({ ...form, price: Number(form.price)||0, stock: Number(form.stock)||0, rating: Number(form.rating)||0, reviewCount: Number(form.reviewCount)||0, category: form.category || 'General', approvedAirlines }));
    if (createSKU.fulfilled.match(r)) {
      if (createImageFile) await dispatch(uploadSKUImage({ id: r.payload._id, file: createImageFile }));
      else if (createImagePreview) await dispatch(updateSKU({ id: r.payload._id, payload: { image: createImagePreview } }));
      close(); showToast('SKU created');
    } else { close(); showToast('Failed to create SKU','error'); }
  };
  const handleEdit = async () => {
    const r = await dispatch(updateSKU({ id: selected._id, payload: { ...form, price: Number(form.price)||0, stock: Number(form.stock)||0, rating: Number(form.rating)||0, reviewCount: Number(form.reviewCount)||0, category: form.category || 'General', approvedAirlines } }));
    close();
    updateSKU.fulfilled.match(r) ? showToast('SKU updated') : showToast('Failed to update','error');
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    const r = await dispatch(deleteSKU(deleteId)); setDeleteId(null); setModal(null);
    deleteSKU.fulfilled.match(r) ? showToast('SKU deleted') : showToast('Failed to delete','error');
  };

  const handleBulkAssign = async () => {
    if (!bulkVendor || checkedIds.size === 0) return;
    const promises = [...checkedIds].map((id) => dispatch(updateSKU({ id, payload: { vendor: bulkVendor } })));
    await Promise.all(promises);
    showToast(`${checkedIds.size} SKU(s) assigned to vendor`);
    setCheckedIds(new Set());
    setShowBulkAssign(false);
    setBulkVendor('');
  };

  const filtered = skus.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    const matchVendor = !filterVendor || (s.vendor?._id || s.vendor) === filterVendor;
    return matchSearch && matchVendor;
  });

  const allChecked = filtered.length > 0 && checkedIds.size === filtered.length;
  const toggleAll = () => setCheckedIds(allChecked ? new Set() : new Set(filtered.map((s) => s._id)));
  const toggleOne = (id: string) => setCheckedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const tf = (label: string, key: keyof typeof emptyForm, type = 'text', placeholder = '') => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({...form,[key]:e.target.value})} placeholder={placeholder} className={inputCls} />
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SKUs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{skus.length} products</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {checkedIds.size > 0 && (
            <button onClick={() => setShowBulkAssign(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
              Assign Vendor ({checkedIds.size})
            </button>
          )}
          <div className="relative">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search name or code…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
          </div>
          <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="">All Vendors</option>
            {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
            <MdAdd size={17} /> New SKU
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? <Spinner label="Loading SKUs…" /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 cursor-pointer" />
                </th>
                {['Image','Code','Name','Vendor','Price','Stock','Rating','Status','Actions'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <MdOutlineInbox size={36} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No SKUs found</p>
                  </td>
                </tr>
              ) : filtered.map((s) => {
                const cacheBust = s._cacheBust || '';
                const imgSrc = s.image ? `${s.image.startsWith('http') ? s.image : `${API}${s.image}`}?v=${cacheBust}` : null;
                return (
                  <tr key={s._id} className={`hover:bg-gray-50 transition-colors ${checkedIds.has(s._id) ? 'bg-purple-50' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={checkedIds.has(s._id)} onChange={() => toggleOne(s._id)} className="w-4 h-4 cursor-pointer" />
                    </td>
                    {/* Image */}
                    <td className="px-3 py-2.5">
                      <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {imgSrc ? <img src={imgSrc} alt={s.name} className="w-full h-full object-cover" />
                          : <MdInventory size={18} className="text-gray-300" />}
                      </div>
                    </td>
                    {/* Code */}
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{s.code}</span>
                    </td>
                    {/* Name + description */}
                    <td className="px-3 py-2.5 max-w-[180px]">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                      {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
                    </td>
                    {/* Vendor */}
                    <td className="px-3 py-2.5 text-gray-600 text-sm">{s.vendor?.name || <span className="text-gray-300">—</span>}</td>
                    {/* Price */}
                    <td className="px-3 py-2.5">
                      <span className="font-semibold text-gray-900">${s.price ?? 0}</span>
                      <span className="text-xs text-gray-400 ml-1">/{s.unit||'unit'}</span>
                    </td>
                    {/* Stock control */}
                    <td className="px-3 py-2.5">
                      <StockControl sku={s} />
                    </td>
                    {/* Rating */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <Stars rating={s.rating ?? 0} />
                        <span className="text-xs text-gray-400">{(s.reviewCount ?? 0).toLocaleString()} reviews</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${s.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-gray-50 text-gray-500 ring-gray-200'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} title="Edit"
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">
                          <MdEdit size={16} />
                        </button>
                        <button onClick={() => { setDeleteId(s._id); setModal('delete'); }} title="Delete"
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 cursor-pointer transition-colors">
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete ── */}
      {modal === 'delete' && (
        <ConfirmModal title="Delete SKU" message="Are you sure you want to delete this SKU?"
          confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => { setModal(null); setDeleteId(null); }} />
      )}

      {/* ── Bulk Assign Vendor Modal ── */}
      {showBulkAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Assign Vendor</h3>
            <p className="text-sm text-gray-500 mb-4">Assign {checkedIds.size} selected SKU(s) to a vendor</p>
            <select value={bulkVendor} onChange={(e) => setBulkVendor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4">
              <option value="">— Select Vendor —</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => { setShowBulkAssign(false); setBulkVendor(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={handleBulkAssign} disabled={!bulkVendor}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer disabled:opacity-40 transition-colors">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Drawer ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New SKU' : 'Edit SKU'}</h2>
              <button onClick={close} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"><MdClose size={20} /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">

              {/* Image — edit */}
              {modal === 'edit' && selected && (
                <ModalImageUpload sku={selected} onUpdated={(u) => setSelected(u)} />
              )}

              {/* Image — create */}
              {modal === 'create' && (
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Product Image</p>
                  <div className="flex gap-4">
                    <div onClick={() => createFileRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0 group">
                      {createImagePreview
                        ? <img src={createImagePreview} alt="preview" className="w-full h-full object-cover" />
                        : <div className="flex flex-col items-center gap-1 text-gray-300 group-hover:text-blue-400"><MdCloudUpload size={20} /><span className="text-[10px]">Add</span></div>}
                    </div>
                    <input ref={createFileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]||null; setCreateImageFile(f); setCreateImagePreview(f ? URL.createObjectURL(f) : null); e.target.value = ''; }} />
                    <div className="flex-1 flex flex-col gap-2 justify-center">
                      <button onClick={() => createFileRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                        <MdCloudUpload size={14} /> {createImageFile ? 'Change' : 'Upload'}
                      </button>
                      <div className="relative">
                        <MdLink size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="url" placeholder="Or paste URL…"
                          onChange={(e) => { const u = e.target.value.trim(); setCreateImageFile(null); setCreateImagePreview(u || null); }}
                          className="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Basic Info</p>
              <div className="grid grid-cols-2 gap-3">
                {tf('Code *','code','text','e.g. SKU-MEAL-VEG-001')}
                {tf('Name *','name','text','e.g. Vegetarian Meal Box')}
                {tf('Unit','unit','text','e.g. box, pack, bottle')}
                {tf('Price ($)','price','number','0.00')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className={inputCls}>
                  <option value="">— Select —</option>
                  {['Meals','Beverages','Snacks','Cargo','Fuel','Supplies','Comfort','Safety','Hygiene','Electronics'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} rows={2}
                  placeholder="Short product description…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Inventory & Ratings</p>
              <div className="grid grid-cols-3 gap-3">
                {tf('Stock','stock','number','0')}
                {tf('Rating (0–5)','rating','number','0.0')}
                {tf('Reviews','reviewCount','number','0')}
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendor</p>
              <select value={form.vendor} onChange={(e) => setForm({...form,vendor:e.target.value})} className={inputCls}>
                <option value="">— None —</option>
                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Approved Airlines</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-36 overflow-y-auto">
                {airlineUsers.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No airline users found</p>}
                {airlineUsers.map((u) => (
                  <label key={u._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={approvedAirlines.includes(u._id)}
                      onChange={() => setApprovedAirlines((prev) => prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id])}
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
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <button onClick={close} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={modal === 'create' ? handleCreate : handleEdit}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer">
                {modal === 'create' ? 'Create SKU' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
