import React, { useState, useEffect } from 'react';
import {
  Store,
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  CalendarCheck,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Eye,
  LogOut,
  Sparkles,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Database,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { MenuItem, PromoBanner, Order, Reservation, CafeInfo, OrderStatus } from '../../types.js';
import { OrdersManagement } from './OrdersManagement.js';
import { SupabaseDatabaseTab } from './SupabaseDatabaseTab.js';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onClose: () => void;
  onMenuUpdated?: () => void;
}

type AdminTab = 'orders' | 'reservations' | 'menu' | 'banners' | 'database' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
  onClose,
  onMenuUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // State collections
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // New Menu Item form modal state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'coffee',
    description: '',
    price: 6.5,
    originalPrice: 8.0,
    isVeg: true,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 10,
  });

  // New Banner form modal state
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    highlightBadge: 'SPECIAL OFFER',
    discountText: '20% OFF',
    code: 'SAVE20',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    badgeBgColor: 'bg-amber-600',
    targetCategory: 'all',
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [oList, rList, mList, bList, cInfo] = await Promise.all([
        api.getAdminOrders(token),
        api.getAdminReservations(token),
        api.getMenuItems(),
        api.getPromoBanners(),
        api.getCafeInfo(),
      ]);
      setOrders(oList);
      setReservations(rList);
      setMenuItems(mList);
      setBanners(bList);
      setCafeInfo(cInfo);
    } catch (err: any) {
      showNotification('Failed to sync management data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Handle Order status update
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    options?: {
      notes?: string;
      acceptedBy?: string;
      acceptedAt?: string;
      estimatedTimeMinutes?: number;
    } | string
  ) => {
    try {
      const updated = await api.updateOrderStatus(token, orderId, status, options);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      const staffInfo = typeof options === 'object' && options?.acceptedBy ? ` by ${options.acceptedBy}` : '';
      showNotification(`Order ${orderId} marked as ${status}${staffInfo}`);
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  // Handle Reservation status update
  const handleUpdateReservationStatus = async (resvId: string, status: string) => {
    try {
      const updated = await api.updateReservationStatus(token, resvId, status);
      setReservations((prev) => prev.map((r) => (r.id === resvId ? updated : r)));
      showNotification(`Reservation ${resvId} updated to ${status}`);
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  // Save / Edit Menu item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        const updated = await api.updateMenuItem(token, editingItem.id, menuForm);
        setMenuItems((prev) => prev.map((m) => (m.id === editingItem.id ? updated : m)));
        showNotification('Dish updated successfully');
      } else {
        const created = await api.addMenuItem(token, menuForm);
        setMenuItems((prev) => [created, ...prev]);
        showNotification('New dish added to digital menu');
      }
      setIsAddMenuOpen(false);
      setEditingItem(null);
      onMenuUpdated?.();
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  // Toggle item availability
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateMenuItem(token, item.id, { isAvailable: !item.isAvailable });
      setMenuItems((prev) => prev.map((m) => (m.id === item.id ? updated : m)));
      showNotification(`${item.name} marked ${!item.isAvailable ? 'Available' : 'Sold Out'}`);
      onMenuUpdated?.();
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  // Delete Menu item
  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(token, id);
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      showNotification('Menu item deleted');
      onMenuUpdated?.();
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  // Save Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.addPromoBanner(token, bannerForm);
      setBanners((prev) => [created, ...prev]);
      setIsAddBannerOpen(false);
      showNotification('New promotional banner created');
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await api.deletePromoBanner(token, id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showNotification('Banner removed');
    } catch (err: any) {
      showNotification(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                Cafe Management Portal
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Live & Protected
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Aura Artisan Cafe & Roastery
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadAllData}
            title="Refresh database records"
            className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-8">
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto py-2.5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders & Staff Acceptance</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {orders.length}
            </span>
            {orders.some((o) => o.status === 'pending') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'reservations'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Reservations</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {reservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu Dishes</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {menuItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Flipkart Banners</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {banners.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'database'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Supabase Database</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ============================================================== */}
        {/* TAB 1: ONLINE FOOD ORDERS & STAFF ACCEPTANCE */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <OrdersManagement
            orders={orders}
            token={token}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onRefresh={loadAllData}
            isLoading={isLoading}
            cafeInfo={cafeInfo}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 2: TABLE RESERVATIONS */}
        {/* ============================================================== */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  Table Reservations
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Review booking requests, assign tables, approve or cancel.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-850 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="p-4">Ref ID</th>
                      <th className="p-4">Guest</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Party Size</th>
                      <th className="p-4">Seating</th>
                      <th className="p-4">Special Requests</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                    {reservations.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50 dark:hover:bg-stone-850/50">
                        <td className="p-4 font-mono font-bold text-stone-900 dark:text-stone-100">
                          {r.id}
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-stone-900 dark:text-stone-100">{r.customerName}</p>
                          <p className="text-[11px] text-stone-400">{r.customerPhone}</p>
                          <p className="text-[11px] text-stone-400">{r.customerEmail}</p>
                        </td>
                        <td className="p-4 font-medium">
                          {r.date} <br />
                          <span className="text-stone-500">{r.time}</span>
                        </td>
                        <td className="p-4 font-bold">{r.guestCount} Guests</td>
                        <td className="p-4 capitalize">{r.seatingArea.replace('_', ' ')}</td>
                        <td className="p-4 max-w-xs truncate text-stone-500">
                          {r.specialRequests || 'None'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              r.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : r.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          {r.status !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateReservationStatus(r.id, 'confirmed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateReservationStatus(r.id, 'cancelled')}
                              className="px-2.5 py-1 bg-stone-200 dark:bg-stone-800 hover:bg-rose-100 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MENU DISHES MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  Digital Menu Management
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Add new offerings, adjust prices, edit descriptions, and toggle stock availability.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setMenuForm({
                    name: '',
                    category: 'coffee',
                    description: '',
                    price: 6.5,
                    originalPrice: 8.0,
                    isVeg: true,
                    isBestseller: false,
                    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
                    preparationTimeMinutes: 10,
                  });
                  setIsAddMenuOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Item</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 shadow-xs flex gap-3"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                            item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        ₹{item.price}{' '}
                        {item.originalPrice && (
                          <span className="line-through text-stone-400">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">
                        Category: {item.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                        }`}
                      >
                        {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setMenuForm({
                              name: item.name,
                              category: item.category,
                              description: item.description,
                              price: item.price,
                              originalPrice: item.originalPrice || item.price,
                              isVeg: item.isVeg,
                              isBestseller: !!item.isBestseller,
                              image: item.image,
                              preparationTimeMinutes: item.preparationTimeMinutes || 10,
                            });
                            setIsAddMenuOpen(true);
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: FLIPKART PROMOTIONAL BANNERS */}
        {/* ============================================================== */}
        {activeTab === 'banners' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  Flipkart-Style Promo Banners
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Customize the rotating hero banner slider and promotional discounts.
                </p>
              </div>

              <button
                onClick={() => setIsAddBannerOpen(true)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Promo Slide</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-36 bg-stone-800">
                    <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 p-4 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.badgeBgColor}`}>
                          {b.highlightBadge}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-amber-400 text-stone-950">
                          {b.code}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{b.title}</h4>
                        <p className="text-xs text-stone-300 line-clamp-1">{b.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {b.discountText}
                    </span>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SUPABASE POSTGRESQL DATABASE */}
        {/* ============================================================== */}
        {activeTab === 'database' && (
          <SupabaseDatabaseTab
            token={token}
            onNotification={showNotification}
          />
        )}
      </div>

      {/* MODAL: ADD / EDIT MENU ITEM */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {editingItem ? 'Edit Dish' : 'Add New Dish to Menu'}
              </h3>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Category *</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="thali">Special Thalis</option>
                    <option value="bakery">Bakery & Patisserie</option>
                    <option value="bites">Bite Up & Chaat</option>
                    <option value="burgers">Burgers & Wraps</option>
                    <option value="italian">Pizzas & Pastas</option>
                    <option value="mains">North Indian Mains</option>
                    <option value="shakes">Shakes & Coolers</option>
                    <option value="coffee">Coffee & Kulhad Chai</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Culinary Description *</label>
                <textarea
                  rows={2}
                  required
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isVeg}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isBestseller}
                    onChange={(e) => setMenuForm({ ...menuForm, isBestseller: e.target.checked })}
                    className="rounded-sm"
                  />
                  <span>Mark Bestseller</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl mt-3 cursor-pointer"
              >
                {editingItem ? 'Save Updates' : 'Add Dish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROMO BANNER */}
      {isAddBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Add Flipkart-Style Promo Banner
              </h3>
              <button
                onClick={() => setIsAddBannerOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">Headline Campaign *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourdough Brunch Combo Fest"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Subtitle / Deal Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Buy any 2 toasts and get a complimentary cold brew"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.code}
                    onChange={(e) => setBannerForm({ ...bannerForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Discount Tag *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.discountText}
                    onChange={(e) => setBannerForm({ ...bannerForm, discountText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  required
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl mt-3 cursor-pointer"
              >
                Create Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
