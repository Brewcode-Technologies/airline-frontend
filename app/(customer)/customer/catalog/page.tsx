'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MdSearch, MdShoppingCart, MdStar, MdCheck, MdInventory, MdMiscellaneousServices, MdAccessTime, MdClose, MdDelete, MdArrowForward } from 'react-icons/md';
import api from '@/services/api';
import Toast from '@/components/ui/Toast';

export default function CatalogPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  // Products state
  const [skus, setSkus] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  // Services state
  const [services, setServices] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState('All');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSort, setServiceSort] = useState('');
  const [servicesLoading, setServicesLoading] = useState(true);
  const [addedServices, setAddedServices] = useState<Record<string, boolean>>({});

  // Cart drawer state
  const [cart, setCart] = useState<any>({ items: [], services: [], totalAmount: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadCategories();
    loadServiceCategories();
    loadCart();
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, search, sort]);

  useEffect(() => {
    loadServices();
  }, [selectedServiceCategory, serviceSearch, serviceSort]);

  const loadCart = async () => {
    try {
      const { data } = await api.get('/customer/cart');
      setCart(data.data || { items: [], services: [], totalAmount: 0 });
    } catch (e) { /* ignore */ }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/customer/categories');
      setCategories(['All', ...(data.data || [])]);
    } catch (e) { /* ignore */ }
  };

  const loadServiceCategories = async () => {
    try {
      const { data } = await api.get('/customer/services/categories');
      setServiceCategories(['All', ...(data.data || [])]);
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

  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const params: any = {};
      if (selectedServiceCategory !== 'All') params.category = selectedServiceCategory;
      if (serviceSearch) params.search = serviceSearch;
      if (serviceSort) params.sort = serviceSort;
      const { data } = await api.get('/customer/services', { params });
      setServices(data.data || []);
    } catch (e) { /* ignore */ }
    setServicesLoading(false);
  };

  const addToCart = async (skuId: string) => {
    try {
      const { data } = await api.post('/customer/cart/add', { skuId, quantity: 1 });
      setCart(data.data);
      setAddedItems(prev => ({ ...prev, [skuId]: true }));
      setDrawerOpen(true);
      setToast({ message: 'Product added to cart', type: 'success' });
      setTimeout(() => setAddedItems(prev => ({ ...prev, [skuId]: false })), 2000);
    } catch (e) { /* ignore */ }
  };

  const addServiceToCart = async (serviceId: string) => {
    try {
      const { data } = await api.post('/customer/cart/add-service', { serviceId, quantity: 1 });
      setCart(data.data);
      setAddedServices(prev => ({ ...prev, [serviceId]: true }));
      setDrawerOpen(true);
      setToast({ message: 'Service added to cart', type: 'success' });
      setTimeout(() => setAddedServices(prev => ({ ...prev, [serviceId]: false })), 2000);
    } catch (e) { /* ignore */ }
  };

  const removeItemFromCart = async (skuId: string) => {
    try {
      const { data } = await api.delete(`/customer/cart/remove/${skuId}`);
      setCart(data.data);
    } catch (e) { /* ignore */ }
  };

  const removeServiceFromCart = async (serviceId: string) => {
    try {
      const { data } = await api.delete(`/customer/cart/remove-service/${serviceId}`);
      setCart(data.data);
    } catch (e) { /* ignore */ }
  };

  const cartItemCount = (cart.items?.length || 0) + (cart.services?.length || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-gray-500 mt-1">Browse products and services for delivery to your gate</p>
        </div>
        {/* Cart button (mobile/when drawer closed) */}
        {cartItemCount > 0 && !drawerOpen && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 cursor-pointer"
          >
            <MdShoppingCart size={18} />
            <span>Cart</span>
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          </button>
        )}
      </div>

      {/* Tab Switch */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MdInventory size={18} />
          Products
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'services'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MdMiscellaneousServices size={18} />
          Services
        </button>
      </div>

      {/* ─── Products Tab ─── */}
      {activeTab === 'products' && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sort by</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
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

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading products...</div>
          ) : skus.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No products found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skus.map((sku) => (
                <div key={sku._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {sku.image ? (
                      <img src={sku.image} alt={sku.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <Link href={`/customer/catalog/${sku._id}`} className="font-semibold text-gray-900 hover:text-purple-600 text-sm line-clamp-1">
                      {sku.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{sku.category}</p>
                    {sku.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{sku.description}</p>}
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
        </>
      )}

      {/* ─── Services Tab ─── */}
      {activeTab === 'services' && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <select
                value={serviceSort}
                onChange={(e) => setServiceSort(e.target.value)}
                className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sort by</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedServiceCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {servicesLoading ? (
            <div className="text-center py-12 text-gray-400">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No services found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center relative">
                    {service.image ? (
                      <img src={service.image} alt={service.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-5xl">{service.icon || '🛎️'}</div>
                    )}
                    {service.duration && (
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <MdAccessTime size={12} /> {service.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{service.name}</h3>
                    <p className="text-xs text-purple-600 font-medium mt-0.5">{service.category}</p>
                    {service.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{service.description}</p>}
                    {service.rating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <MdStar size={14} className="text-yellow-400" />
                        <span className="text-xs text-gray-600">{service.rating.toFixed(1)}</span>
                        {service.reviewCount > 0 && <span className="text-xs text-gray-400">({service.reviewCount})</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gray-900">${service.price?.toFixed(2)}</span>
                      <button
                        onClick={() => addServiceToCart(service._id)}
                        disabled={addedServices[service._id]}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          addedServices[service._id]
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                      >
                        {addedServices[service._id] ? <><MdCheck size={14} /> Added</> : <><MdShoppingCart size={14} /> Add</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Right Drawer ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

          {/* Drawer */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MdShoppingCart size={20} className="text-purple-600" />
                <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{cartItemCount}</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <MdClose size={22} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartItemCount === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MdShoppingCart size={40} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {/* Products */}
                  {cart.items?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Products ({cart.items.length})</h3>
                      <div className="space-y-2">
                        {cart.items.map((item: any) => (
                          <div key={item.sku?._id || item._id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                              {item.sku?.image ? (
                                <img src={item.sku.image} alt={item.sku.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-sm">📦</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.sku?.name || 'Item'}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                              <button onClick={() => removeItemFromCart(item.sku?._id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                <MdDelete size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {cart.services?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services ({cart.services.length})</h3>
                      <div className="space-y-2">
                        {cart.services.map((svc: any) => (
                          <div key={svc.service?._id || svc._id} className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-purple-200">
                              {svc.service?.image ? (
                                <img src={svc.service.image} alt={svc.service.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <span className="text-sm">{svc.service?.icon || '🛎️'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{svc.service?.name || 'Service'}</p>
                              <p className="text-xs text-purple-600">Qty: {svc.quantity} × ${svc.price?.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">${(svc.price * svc.quantity).toFixed(2)}</span>
                              <button onClick={() => removeServiceFromCart(svc.service?._id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                                <MdDelete size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {cartItemCount > 0 && (
              <div className="border-t border-gray-200 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <span className="text-xl font-bold text-gray-900">${cart.totalAmount?.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => router.push('/customer/cart')}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Continue
                  <MdArrowForward size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
