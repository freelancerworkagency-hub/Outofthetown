import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  FolderEdit,
  Layers,
  Bell,
  Volume2,
  VolumeX,
  Printer,
  Database,
} from 'lucide-react';
import { api } from '../../services/api.js';
import type { MenuItem, PromoBanner, Order, Reservation, CafeInfo, OrderStatus, Category } from '../../types.js';
import { OrdersManagement } from './OrdersManagement.js';
import { RevenueAnalysis } from './RevenueAnalysis.js';
import { KitchenOrderTicket } from './KitchenOrderTicket.js';
import { CategoryManagementView } from './CategoryManagementView.js';
import { bellSound } from '../../utils/sound.js';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onClose: () => void;
  menuItems?: MenuItem[];
  promoBanners?: PromoBanner[];
  cafeInfo?: CafeInfo | null;
  categories?: Category[];
  onUpdateMenuItems?: (items: MenuItem[]) => void;
  onUpdatePromoBanners?: (banners: PromoBanner[]) => void;
  onUpdateCategories?: (cats: Category[]) => void;
  onMenuUpdated?: () => void;
}

type AdminTab = 'orders' | 'reservations' | 'menu' | 'categories' | 'banners' | 'revenue' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  onLogout,
  onClose,
  menuItems: initialMenuItems,
  promoBanners: initialPromoBanners,
  cafeInfo: initialCafeInfo,
  categories: initialCategories,
  onUpdateMenuItems,
  onUpdatePromoBanners,
  onUpdateCategories,
  onMenuUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // State collections initialized immediately from props for zero-lag display
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems || []);
  const [banners, setBanners] = useState<PromoBanner[]>(initialPromoBanners || []);
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(initialCafeInfo || null);
  const [categories, setCategories] = useState<Category[]>(
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : [
          { id: 'cat-all', name: 'All Dishes', slug: 'all', icon: 'Sparkles' },
          { id: 'cat-thali', name: 'Special Thalis', slug: 'thali', icon: 'UtensilsCrossed' },
          { id: 'cat-bakery', name: 'Bakery & Cakes', slug: 'bakery', icon: 'Cake' },
          { id: 'cat-bites', name: 'Bites & Chaat', slug: 'bites', icon: 'Flame' },
          { id: 'cat-burgers', name: 'Burgers & Wraps', slug: 'burgers', icon: 'Sandwich' },
          { id: 'cat-italian', name: 'Pizzas & Pastas', slug: 'italian', icon: 'Pizza' },
          { id: 'cat-mains', name: 'North Indian Mains', slug: 'mains', icon: 'Soup' },
          { id: 'cat-shakes', name: 'Shakes & Coolers', slug: 'shakes', icon: 'Wine' },
          { id: 'cat-coffee', name: 'Coffee & Kulhad Chai', slug: 'coffee', icon: 'Coffee' },
        ]
  );
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormSlug, setCategoryFormSlug] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Auto KOT & Bell Sound State
  const [autoKotOrder, setAutoKotOrder] = useState<Order | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialOrdersLoadRef = useRef<boolean>(true);

  // Sync with prop updates if available
  useEffect(() => {
    if (initialMenuItems && initialMenuItems.length > 0) {
      setMenuItems(initialMenuItems);
    }
  }, [initialMenuItems]);

  useEffect(() => {
    if (initialPromoBanners && initialPromoBanners.length > 0) {
      setBanners(initialPromoBanners);
    }
  }, [initialPromoBanners]);

  useEffect(() => {
    if (initialCafeInfo) {
      setCafeInfo(initialCafeInfo);
    }
  }, [initialCafeInfo]);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Supabase 10-Minute Auto-Sync status
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // New Menu Item form modal state
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'thali',
    description: '',
    price: 180,
    originalPrice: 220,
    isVeg: true,
    isBestseller: false,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    preparationTimeMinutes: 15,
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
      const [oList, rList, mList, bList, cInfo, catList] = await Promise.all([
        api.getAdminOrders(token),
        api.getAdminReservations(token),
        api.getMenuItems(),
        api.getPromoBanners(),
        api.getCafeInfo(),
        api.getCategories().catch(() => []),
      ]);
      setOrders(oList);
      (oList || []).forEach((o) => knownOrderIdsRef.current.add(o.id));
      isInitialOrdersLoadRef.current = false;
      setReservations(rList);
      setMenuItems(mList);
      setBanners(bList);
      setCafeInfo(cInfo);
      if (catList && catList.length > 0) {
        setCategories(catList);
      }
    } catch (err: any) {
      showNotification('Failed to sync management data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Category Management Handlers
  const handleUpdateCategory = async (catId: string, name: string, slug?: string) => {
    if (!name.trim()) return;
    const prevCats = categories;
    const targetCat = categories.find((c) => c.id === catId || c.slug === catId);
    const oldSlug = targetCat?.slug;
    const newSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim();

    const updatedCats = categories.map((c) =>
      c.id === catId || c.slug === catId
        ? { ...c, name: name.trim(), slug: newSlug }
        : c
    );
    setCategories(updatedCats);
    onUpdateCategories?.(updatedCats);

    // Also update any menu items mapped to this category locally
    if (oldSlug && newSlug && oldSlug !== newSlug) {
      const updatedMenuItems = menuItems.map((item) =>
        item.category === oldSlug ? { ...item, category: newSlug } : item
      );
      setMenuItems(updatedMenuItems);
      onUpdateMenuItems?.(updatedMenuItems);
    }

    showNotification(`Category updated to "${name}"`);
    setEditingCategory(null);

    try {
      await api.updateCategory(token, catId, { name, slug: newSlug });
      onMenuUpdated?.();
    } catch (err: any) {
      setCategories(prevCats);
      showNotification('Failed to update category: ' + err.message);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const tempCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      icon: 'UtensilsCrossed',
    };
    const nextCats = [...categories, tempCat];
    setCategories(nextCats);
    onUpdateCategories?.(nextCats);
    setNewCatName('');
    showNotification(`Category "${name}" added`);

    try {
      const saved = await api.addCategory(token, { name, slug });
      setCategories((curr) => curr.map((c) => (c.id === tempCat.id ? saved : c)));
      onMenuUpdated?.();
    } catch (err: any) {
      setCategories(categories);
      showNotification('Failed to add category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const prevCats = categories;
    const nextCats = categories.filter((c) => c.id !== catId && c.slug !== catId);
    setCategories(nextCats);
    onUpdateCategories?.(nextCats);
    showNotification('Category removed');

    try {
      await api.deleteCategory(token, catId);
      onMenuUpdated?.();
    } catch (err: any) {
      setCategories(prevCats);
      showNotification('Failed to remove category: ' + err.message);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Order arrival listener: rings the bell sound exclusively on the admin's device & auto-generates KOT
  useEffect(() => {
    // Unlock browser audio context on first administrator interaction
    const unlockAudio = () => {
      bellSound.unlock();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    // Poll every 3.5 seconds to detect fresh incoming customer orders
    const pollInterval = setInterval(async () => {
      try {
        const freshOrders = await api.getAdminOrders(token);
        if (!freshOrders || !Array.isArray(freshOrders)) return;

        // If this is first sync, record existing order IDs to avoid ringing for historical orders
        if (isInitialOrdersLoadRef.current) {
          freshOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
          isInitialOrdersLoadRef.current = false;
          setOrders(freshOrders);
          return;
        }

        // Detect brand-new pending orders that were placed since last poll
        const newlyArrived = freshOrders.filter(
          (o) => !knownOrderIdsRef.current.has(o.id) && o.status === 'pending'
        );

        // Update known order IDs
        freshOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        setOrders(freshOrders);

        if (newlyArrived.length > 0) {
          // Play the order bell sound exclusively on the admin device!
          if (!isSoundMuted) {
            bellSound.ringOrderBell();
          }

          const incomingOrder = newlyArrived[0];
          showNotification(
            `🔔 NEW ORDER #${incomingOrder.id.slice(-6).toUpperCase()} RECEIVED! (${incomingOrder.customerName || 'Customer'})`
          );

          // Prepare KOT modal for administrative review
          setAutoKotOrder(incomingOrder);
        }
      } catch (err) {
        // Continue polling silently
      }
    }, 3500);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, [token, isSoundMuted]);

  // 10-Minute Automatic Cloud Sync with Supabase & comprehensive data refresh
  useEffect(() => {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const autoSyncTimer = setInterval(async () => {
      try {
        setIsSyncing(true);
        console.log('[Admin Dashboard] Executing 10-minute automatic cloud sync with Supabase...');
        await api.syncSupabaseAll(token).catch((err) => {
          console.warn('[Admin Dashboard] Auto-sync warning:', err.message);
        });
        await loadAllData();
        setLastSyncTime(new Date());
      } catch (err: any) {
        console.warn('[Admin Dashboard] 10-minute auto-sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    }, TEN_MINUTES_MS);

    return () => clearInterval(autoSyncTimer);
  }, [token]);

  // Handle Order status update - INSTANT OPTIMISTIC UPDATE
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
    const prevOrders = orders;
    const optObj = typeof options === 'object' ? options : {};
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          ...(optObj.acceptedBy ? { acceptedBy: optObj.acceptedBy } : {}),
          ...(optObj.acceptedAt ? { acceptedAt: optObj.acceptedAt } : {}),
          ...(optObj.estimatedTimeMinutes ? { estimatedTimeMinutes: optObj.estimatedTimeMinutes } : {}),
          ...(optObj.notes ? { specialInstructions: (o.specialInstructions ? o.specialInstructions + ' | ' : '') + optObj.notes } : {}),
        };
      }
      return o;
    });
    setOrders(updated);
    const staffInfo = typeof options === 'object' && options?.acceptedBy ? ` by ${options.acceptedBy}` : '';
    showNotification(`Order ${orderId} marked as ${status}${staffInfo}`);

    try {
      const serverUpdated = await api.updateOrderStatus(token, orderId, status, options);
      setOrders((curr) => curr.map((o) => (o.id === orderId ? serverUpdated : o)));
    } catch (err: any) {
      setOrders(prevOrders);
      showNotification('Failed to update order status: ' + err.message);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handlePurgeAllOrders = () => {
    setOrders([]);
    knownOrderIdsRef.current.clear();
  };

  const handleCancelOrder = (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'cancelled' as OrderStatus,
              specialInstructions: (o.specialInstructions ? o.specialInstructions + ' | ' : '') + `Cancelled: ${reason || 'Customer request'}`,
            }
          : o
      )
    );
  };

  // Handle Reservation status update - INSTANT OPTIMISTIC UPDATE
  const handleUpdateReservationStatus = async (resvId: string, status: string) => {
    const prevReservations = reservations;
    const updated = reservations.map((r) => (r.id === resvId ? { ...r, status: status as any } : r));
    setReservations(updated);
    showNotification(`Reservation ${resvId} updated to ${status}`);

    try {
      const serverUpdated = await api.updateReservationStatus(token, resvId, status);
      setReservations((curr) => curr.map((r) => (r.id === resvId ? serverUpdated : r)));
    } catch (err: any) {
      setReservations(prevReservations);
      showNotification('Failed to update reservation: ' + err.message);
    }
  };

  // Quick toggle bestseller tag on dish
  const handleToggleBestseller = async (item: MenuItem) => {
    const nextBestseller = !item.isBestseller;
    const prevItems = menuItems;
    const nextItems = menuItems.map((m) =>
      m.id === item.id ? { ...m, isBestseller: nextBestseller } : m
    );
    setMenuItems(nextItems);
    onUpdateMenuItems?.(nextItems);
    showNotification(
      nextBestseller
        ? `⭐ "${item.name}" marked as Bestseller!`
        : `"${item.name}" removed from Bestsellers`
    );

    try {
      await api.updateMenuItem(token, item.id, { isBestseller: nextBestseller });
      onMenuUpdated?.();
    } catch (err: any) {
      setMenuItems(prevItems);
      onUpdateMenuItems?.(prevItems);
      showNotification('Failed to update bestseller tag: ' + err.message);
    }
  };

  // Save / Edit Menu item - INSTANT ADDITION & EDIT
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const prevItems = menuItems;
      const updated: MenuItem = {
        ...editingItem,
        name: menuForm.name,
        category: menuForm.category,
        description: menuForm.description,
        price: Number(menuForm.price),
        originalPrice: menuForm.originalPrice ? Number(menuForm.originalPrice) : undefined,
        isVeg: menuForm.isVeg,
        isBestseller: menuForm.isBestseller,
        image: menuForm.image,
        preparationTimeMinutes: Number(menuForm.preparationTimeMinutes) || 15,
      };
      const nextItems = prevItems.map((m) => (m.id === editingItem.id ? updated : m));
      // INSTANT UI UPDATE
      setMenuItems(nextItems);
      onUpdateMenuItems?.(nextItems);
      setIsAddMenuOpen(false);
      setEditingItem(null);
      showNotification('Dish updated successfully');

      try {
        const saved = await api.updateMenuItem(token, editingItem.id, menuForm);
        setMenuItems((curr) => curr.map((m) => (m.id === saved.id ? saved : m)));
        onUpdateMenuItems?.(nextItems.map((m) => (m.id === saved.id ? saved : m)));
      } catch (err: any) {
        setMenuItems(prevItems);
        onUpdateMenuItems?.(prevItems);
        showNotification('Failed to update dish: ' + err.message);
      }
    } else {
      const tempId = 'dish_' + Date.now();
      const newItem: MenuItem = {
        id: tempId,
        name: menuForm.name,
        category: menuForm.category,
        description: menuForm.description,
        price: Number(menuForm.price),
        originalPrice: menuForm.originalPrice ? Number(menuForm.originalPrice) : undefined,
        isVeg: menuForm.isVeg,
        isBestseller: menuForm.isBestseller,
        isAvailable: true,
        image: menuForm.image,
        rating: 4.8,
        reviewsCount: 1,
        preparationTimeMinutes: Number(menuForm.preparationTimeMinutes) || 15,
        tags: [menuForm.category, menuForm.isVeg ? 'Veg' : 'Non-Veg'],
      };
      const prevItems = menuItems;
      const nextItems = [newItem, ...prevItems];
      // INSTANT UI UPDATE
      setMenuItems(nextItems);
      onUpdateMenuItems?.(nextItems);
      setIsAddMenuOpen(false);
      showNotification('New dish added to digital menu');

      try {
        const created = await api.addMenuItem(token, menuForm);
        setMenuItems((curr) => curr.map((m) => (m.id === tempId ? created : m)));
        onUpdateMenuItems?.(nextItems.map((m) => (m.id === tempId ? created : m)));
      } catch (err: any) {
        setMenuItems(prevItems);
        onUpdateMenuItems?.(prevItems);
        showNotification('Failed to add dish: ' + err.message);
      }
    }
  };

  // Toggle item availability - INSTANT OPTIMISTIC UPDATE
  const handleToggleAvailability = async (item: MenuItem) => {
    const prevItems = menuItems;
    const updated: MenuItem = { ...item, isAvailable: !item.isAvailable };
    const nextItems = prevItems.map((m) => (m.id === item.id ? updated : m));
    setMenuItems(nextItems);
    onUpdateMenuItems?.(nextItems);
    showNotification(`${item.name} marked ${!item.isAvailable ? 'Available' : 'Sold Out'}`);

    try {
      await api.updateMenuItem(token, item.id, { isAvailable: !item.isAvailable });
    } catch (err: any) {
      setMenuItems(prevItems);
      onUpdateMenuItems?.(prevItems);
      showNotification('Failed to toggle availability: ' + err.message);
    }
  };

  // Delete Menu item - INSTANT OPTIMISTIC REMOVAL
  const handleDeleteMenuItem = async (id: string) => {
    const prevItems = menuItems;
    const nextItems = prevItems.filter((m) => m.id !== id);
    // INSTANT: disappears immediately
    setMenuItems(nextItems);
    onUpdateMenuItems?.(nextItems);
    showNotification('Menu item deleted');

    try {
      await api.deleteMenuItem(token, id);
    } catch (err: any) {
      setMenuItems(prevItems);
      onUpdateMenuItems?.(prevItems);
      showNotification('Failed to delete menu item: ' + err.message);
    }
  };

  // Save Banner - INSTANT OPTIMISTIC ADDITION
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = 'banner_' + Date.now();
    const newBanner: PromoBanner = {
      id: tempId,
      title: bannerForm.title,
      subtitle: bannerForm.subtitle,
      highlightBadge: bannerForm.highlightBadge,
      discountText: bannerForm.discountText,
      code: bannerForm.code,
      imageUrl: bannerForm.imageUrl,
      badgeBgColor: bannerForm.badgeBgColor,
      targetCategory: bannerForm.targetCategory,
      active: true,
    };
    const prevBanners = banners;
    const nextBanners = [newBanner, ...prevBanners];
    // INSTANT: appears immediately
    setBanners(nextBanners);
    onUpdatePromoBanners?.(nextBanners);
    setIsAddBannerOpen(false);
    showNotification('New promotional banner created');

    try {
      const created = await api.addPromoBanner(token, bannerForm);
      setBanners((curr) => curr.map((b) => (b.id === tempId ? created : b)));
      onUpdatePromoBanners?.(nextBanners.map((b) => (b.id === tempId ? created : b)));
    } catch (err: any) {
      setBanners(prevBanners);
      onUpdatePromoBanners?.(prevBanners);
      showNotification('Failed to add banner: ' + err.message);
    }
  };

  // Delete Banner - INSTANT OPTIMISTIC REMOVAL
  const handleDeleteBanner = async (id: string) => {
    const prevBanners = banners;
    const nextBanners = prevBanners.filter((b) => b.id !== id);
    // INSTANT: disappears immediately
    setBanners(nextBanners);
    onUpdatePromoBanners?.(nextBanners);
    showNotification('Banner removed');

    try {
      await api.deletePromoBanner(token, id);
    } catch (err: any) {
      setBanners(prevBanners);
      onUpdatePromoBanners?.(prevBanners);
      showNotification('Failed to remove banner: ' + err.message);
    }
  };

  return (
    <div
      id="admin-management-portal"
      data-admin-portal="true"
      className="fixed inset-0 z-50 overflow-y-auto no-scrollbar admin-portal-scroll bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col overscroll-contain"
    >
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
          {/* Bell sound test button */}
          <button
            type="button"
            onClick={() => {
              bellSound.unlock();
              bellSound.ringOrderBell();
              showNotification('🔔 Ding-Ding! Order bell sound tested successfully');
            }}
            title="Test Kitchen Order Bell Sound"
            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 text-xs font-semibold rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
            <span className="hidden md:inline">Test Bell</span>
          </button>

          {/* Sound Mute/Unmute toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSoundMuted(!isSoundMuted);
              showNotification(isSoundMuted ? 'Order Bell Sound Unmuted' : 'Order Bell Sound Muted');
            }}
            title={isSoundMuted ? 'Unmute Order Bell Sound' : 'Mute Order Bell Sound'}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${
              isSoundMuted
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
            }`}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Cloud Auto-Sync badge */}
          <div
            title={`Automatic Cloud Sync: Continuously syncs data with Supabase every 10 minutes. Last synced: ${lastSyncTime.toLocaleTimeString()}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
          >
            <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} />
            <span>Auto-Sync (10m)</span>
          </div>

          <button
            onClick={loadAllData}
            title="Refresh database records"
            className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer"
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
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar py-2.5">
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
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Food Categories</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              {categories.filter((c) => c.slug !== 'all').length}
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
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              activeTab === 'revenue'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue Analysis</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white font-mono">
              Live
            </span>
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
            onDeleteOrder={handleDeleteOrder}
            onCancelOrder={handleCancelOrder}
            onPurgeAllOrders={handlePurgeAllOrders}
            onRefresh={loadAllData}
            isLoading={isLoading}
            cafeInfo={cafeInfo}
            onOpenRevenueAnalysis={() => setActiveTab('revenue')}
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

              <div className="flex items-center gap-2">
                <button
                  id="admin-manage-categories-btn"
                  onClick={() => setActiveTab('categories')}
                  className="px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold rounded-xl border border-stone-300 dark:border-stone-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Edit existing food categories or create new categories"
                >
                  <FolderEdit className="w-4 h-4 text-amber-600" />
                  <span>Edit Categories ({categories.filter((c) => c.slug !== 'all').length})</span>
                </button>

                <button
                  id="admin-add-food-item-btn"
                  onClick={() => {
                    setEditingItem(null);
                    setIsCustomCategoryMode(false);
                    setMenuForm({
                      name: '',
                      category: categories.find((c) => c.slug !== 'all')?.slug || 'thali',
                      description: '',
                      price: 180,
                      originalPrice: 220,
                      isVeg: true,
                      isBestseller: false,
                      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
                      preparationTimeMinutes: 15,
                    });
                    setIsAddMenuOpen(true);
                  }}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Food Item</span>
                </button>
              </div>
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
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                        {item.isBestseller && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[9px] flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>BESTSELLER</span>
                          </span>
                        )}
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
                      <div className="flex items-center gap-1.5">
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

                        <button
                          type="button"
                          onClick={() => handleToggleBestseller(item)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1 ${
                            item.isBestseller
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              : 'bg-stone-100 text-stone-500 hover:text-amber-700 dark:bg-stone-800 dark:text-stone-400'
                          }`}
                          title={item.isBestseller ? 'Remove Bestseller tag' : 'Add Bestseller tag'}
                        >
                          <Sparkles className={`w-3 h-3 ${item.isBestseller ? 'fill-amber-500 text-amber-500' : ''}`} />
                          <span>{item.isBestseller ? 'Bestseller' : '+ Bestseller'}</span>
                        </button>
                      </div>

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
        {/* TAB: FOOD CATEGORIES MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'categories' && (
          <CategoryManagementView
            categories={categories}
            menuItems={menuItems}
            token={token}
            onUpdateCategories={onUpdateCategories}
            onUpdateMenuItems={onUpdateMenuItems}
            onMenuUpdated={onMenuUpdated}
            showNotification={showNotification}
          />
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
        {/* TAB 5: REVENUE & SALES COMPREHENSIVE ANALYSIS */}
        {/* ============================================================== */}
        {activeTab === 'revenue' && (
          <RevenueAnalysis
            orders={orders}
            onBack={() => setActiveTab('orders')}
            token={token}
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold">Category *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                      className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      {isCustomCategoryMode ? '← Choose from list' : '✏️ Custom / Edit Category'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesOpen(true)}
                      className="text-[11px] font-bold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline cursor-pointer"
                    >
                      Manage All Categories
                    </button>
                  </div>
                </div>

                {isCustomCategoryMode ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="Enter category name or slug (e.g. Continental, Desserts, Chinese)"
                      value={menuForm.category}
                      onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400 dark:border-amber-600 text-stone-900 dark:text-stone-100 font-semibold"
                    />
                    <div className="flex flex-wrap gap-1">
                      {categories
                        .filter((c) => c.slug !== 'all')
                        .map((c) => (
                          <button
                            key={c.id || c.slug}
                            type="button"
                            onClick={() => setMenuForm({ ...menuForm, category: c.slug || c.name.toLowerCase() })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                              menuForm.category === (c.slug || c.name.toLowerCase())
                                ? 'bg-amber-600 text-white'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={menuForm.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategoryMode(true);
                      } else {
                        setMenuForm({ ...menuForm, category: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {categories
                      .filter((c) => c.slug !== 'all')
                      .map((c) => (
                        <option key={c.id || c.slug} value={c.slug || c.name.toLowerCase()}>
                          {c.name}
                        </option>
                      ))}
                    <option value="__custom__">✏️ + Custom / Enter New Category...</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-bold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={menuForm.originalPrice || ''}
                    onChange={(e) => setMenuForm({ ...menuForm, originalPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="Optional for discount"
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

              {/* Bestseller & Highlight Tags Section */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        Bestseller Dish Tag
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        Shows ⭐ Bestseller badge and boosts visibility on customer storefront
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuForm.isBestseller}
                      onChange={(e) => setMenuForm({ ...menuForm, isBestseller: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-hidden rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-stone-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {menuForm.isBestseller && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] uppercase tracking-wider font-extrabold shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3 fill-white text-white" />
                      <span>⭐ BESTSELLER PREVIEW</span>
                    </span>
                    <span>Featured with golden badge in menu and filters!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={menuForm.isVeg}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.checked })}
                    className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pure Vegetarian</span>
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

      {/* MODAL: MANAGE & EDIT FOOD CATEGORIES */}
      {isManageCategoriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                  <FolderEdit className="w-5 h-5 text-amber-600" />
                  <span>Food Categories Management</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Edit or rename existing categories, adjust slugs, or add new food categories.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Category Bar */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 mb-4">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                Add New Food Category
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. South Indian, Mocktails, Desserts"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-stone-900 dark:text-stone-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1 text-xs">
              {categories
                .filter((c) => c.slug !== 'all')
                .map((cat) => {
                  const dishCount = menuItems.filter(
                    (m) => m.category === cat.slug || m.category.toLowerCase() === cat.name.toLowerCase()
                  ).length;
                  const isEditingThis = editingCategory?.id === cat.id;

                  return (
                    <div
                      key={cat.id || cat.slug}
                      className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850/60 flex flex-col gap-2"
                    >
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-0.5">
                                Category Name
                              </label>
                              <input
                                type="text"
                                value={categoryFormName}
                                onChange={(e) => setCategoryFormName(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-400 mb-0.5">
                                Slug identifier
                              </label>
                              <input
                                type="text"
                                value={categoryFormSlug}
                                onChange={(e) => setCategoryFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-mono text-stone-700 dark:text-stone-300"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              className="px-3 py-1 text-xs font-bold text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id, categoryFormName, categoryFormSlug)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {cat.name.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                                {cat.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                                <span className="font-mono bg-stone-200/60 dark:bg-stone-800 px-1.5 py-0.5 rounded-md">
                                  {cat.slug}
                                </span>
                                <span>•</span>
                                <span>{dishCount} {dishCount === 1 ? 'dish' : 'dishes'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryFormName(cat.name);
                                setCategoryFormSlug(cat.slug);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-stone-200/70 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove category "${cat.name}"?`)) {
                                  handleDeleteCategory(cat.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesOpen(false);
                  setEditingCategory(null);
                }}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-xs cursor-pointer hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automatically Generated Kitchen Order Ticket (KOT) on incoming order */}
      {autoKotOrder && (
        <KitchenOrderTicket
          order={autoKotOrder}
          cafeInfo={cafeInfo}
          isAutoGenerated={true}
          onClose={() => setAutoKotOrder(null)}
        />
      )}
    </div>
  );
};
