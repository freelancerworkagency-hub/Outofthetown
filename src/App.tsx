import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  ChevronRight,
  Coffee,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  X,
  Star,
  Flame,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext.js';
import { CartProvider, useCart } from './context/CartContext.js';
import { Navbar } from './components/Navbar.js';
import { TopPromotionalHero } from './components/TopPromotionalHero.js';
import { FlipkartPromoBanner } from './components/FlipkartPromoBanner.js';
import { CategoryPills } from './components/CategoryPills.js';
import { FilterBar } from './components/FilterBar.js';
import { MenuItemCard } from './components/MenuItemCard.js';
import { OfferComboView } from './components/OfferComboView.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ReservationModal } from './components/ReservationModal.js';
import { CustomerProfileModal } from './components/CustomerProfileModal.js';
import { OrderStatusModal } from './components/OrderStatusModal.js';
import { AdminLoginModal } from './components/admin/AdminLoginModal.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { LocationSection } from './components/LocationSection.js';
import { api } from './services/api.js';
import type { MenuItem, Category, PromoBanner, Order, CafeInfo } from './types.js';

function CafeHome() {
  const { totalItemsCount, total, setIsCartOpen } = useCart();

  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOfferBanner, setSelectedOfferBanner] = useState<PromoBanner | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [nonVegOnly, setNonVegOnly] = useState(false);
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const [ratingOnly, setRatingOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [quickPrepOnly, setQuickPrepOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');

  const handleClearAllFilters = () => {
    setVegOnly(false);
    setNonVegOnly(false);
    setBestsellerOnly(false);
    setRatingOnly(false);
    setOffersOnly(false);
    setQuickPrepOnly(false);
    setMaxPrice(null);
    setSortBy('popular');
  };

  // Modals
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('aura_cafe_admin_token');
  });
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Smooth docking matching Zomato mobile app feel
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cats, banners, items, info] = await Promise.all([
        api.getCategories(),
        api.getPromoBanners(),
        api.getMenuItems(),
        api.getCafeInfo(),
      ]);
      setCategories(cats);
      setPromoBanners(banners);
      setMenuItems(items);
      setCafeInfo(info);
    } catch (err) {
      console.error('Failed to load cafe data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter & Sort computation
  const filteredItems = useMemo(() => {
    let result = [...menuItems];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Pure veg filter
    if (vegOnly) {
      result = result.filter((item) => item.isVeg);
    }

    // Non-veg filter
    if (nonVegOnly) {
      result = result.filter((item) => !item.isVeg);
    }

    // Bestseller filter
    if (bestsellerOnly) {
      result = result.filter((item) => item.isBestseller);
    }

    // High rating filter (4.5+)
    if (ratingOnly) {
      result = result.filter((item) => item.rating >= 4.5);
    }

    // Great Offers / Discount filter
    if (offersOnly) {
      result = result.filter((item) => item.originalPrice && item.originalPrice > item.price);
    }

    // Fast Prep (< 20 mins) filter
    if (quickPrepOnly) {
      result = result.filter((item) => (item.preparationTimeMinutes || 15) <= 20);
    }

    // Max Price filter
    if (maxPrice !== null) {
      result = result.filter((item) => item.price <= maxPrice);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'time':
        result.sort(
          (a, b) => (a.preparationTimeMinutes || 10) - (b.preparationTimeMinutes || 10)
        );
        break;
      default:
        // popularity default (bestsellers first)
        result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
        break;
    }

    return result;
  }, [
    menuItems,
    activeCategory,
    vegOnly,
    nonVegOnly,
    bestsellerOnly,
    ratingOnly,
    offersOnly,
    quickPrepOnly,
    maxPrice,
    searchQuery,
    sortBy,
  ]);

  // Counts by category
  const itemsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    menuItems.forEach((it) => {
      counts[it.category] = (counts[it.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  const handleOpenAdmin = () => {
    if (adminToken) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    setIsAdminLoginOpen(false);
    setIsAdminDashboardOpen(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('aura_cafe_admin_token');
    setAdminToken(null);
    setIsAdminDashboardOpen(false);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200 selection:bg-amber-500 selection:text-white font-sans antialiased">
      {/* Sticky Zomato Search + Veg Mode + Filter Bar with Silky Smooth Transition Animation */}
      <AnimatePresence>
        {(selectedOfferBanner || isScrolled) && (
          <motion.div
            key="zomato-sticky-navbar"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-0 left-0 right-0 z-40 w-full"
          >
            <Navbar
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                if (q && selectedOfferBanner) {
                  setSelectedOfferBanner(null);
                }
              }}
              vegOnly={vegOnly}
              onToggleVegOnly={() => {
                const nextVeg = !vegOnly;
                setVegOnly(nextVeg);
                if (nextVeg) setNonVegOnly(false);
              }}
              nonVegOnly={nonVegOnly}
              onToggleNonVegOnly={() => {
                setNonVegOnly(!nonVegOnly);
                if (!nonVegOnly) setVegOnly(false);
              }}
              bestsellerOnly={bestsellerOnly}
              onToggleBestseller={() => setBestsellerOnly(!bestsellerOnly)}
              ratingOnly={ratingOnly}
              onToggleRating={() => setRatingOnly(!ratingOnly)}
              offersOnly={offersOnly}
              onToggleOffers={() => setOffersOnly(!offersOnly)}
              quickPrepOnly={quickPrepOnly}
              onToggleQuickPrep={() => setQuickPrepOnly(!quickPrepOnly)}
              maxPrice={maxPrice}
              onSelectMaxPrice={setMaxPrice}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearAllFilters={handleClearAllFilters}
              totalFiltered={filteredItems.length}
              onOpenProfileMenu={() => setIsCustomerMenuOpen(true)}
              onNavigateHome={() => {
                setSelectedOfferBanner(null);
                setActiveCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isOfferDetailView={Boolean(selectedOfferBanner)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotional Banner Extending to the Top (Matching Reference Image) */}
      {!selectedOfferBanner && (
        <div className="relative bg-stone-950">
          <TopPromotionalHero
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q && selectedOfferBanner) {
                setSelectedOfferBanner(null);
              }
            }}
            vegOnly={vegOnly}
            onToggleVegOnly={() => {
              const nextVeg = !vegOnly;
              setVegOnly(nextVeg);
              if (nextVeg) setNonVegOnly(false);
            }}
            onOpenReservation={() => setIsReservationOpen(true)}
            onOpenAdmin={handleOpenAdmin}
            onOpenProfileMenu={() => setIsCustomerMenuOpen(true)}
            banners={promoBanners}
            onSelectBanner={(banner) => {
              setSelectedOfferBanner(banner);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              const el = document.getElementById('menu-heading');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Food Categories shifted downwards by half line */}
          <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 translate-y-3 sm:translate-y-3.5 -mb-10 sm:-mb-12">
            <CategoryPills
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              itemsCountByCategory={itemsCountByCategory}
            />
          </div>

          {/* Minimalistic clean bottom fade: ends at the bottom edge of the banner container */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-stone-50 via-stone-50/70 to-transparent dark:from-stone-950 dark:via-stone-950/70 dark:to-transparent z-10"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Homepage Container */}
      <main className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4 ${selectedOfferBanner ? 'pt-20 sm:pt-24' : 'pt-14 sm:pt-16'}`}>
        {selectedOfferBanner ? (
          /* Dedicated Pre-Selected Combo & Offer Details Page */
          <OfferComboView
            banner={selectedOfferBanner}
            allMenuItems={menuItems}
            onBack={() => {
              setSelectedOfferBanner(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenReservation={() => setIsReservationOpen(true)}
            onSelectDishDetail={(it) => setSelectedItemDetail(it)}
          />
        ) : (
          <>
            {/* 3. Zomato-Style Filter Bar: Rendered in page when at the top; smoothly docks into sticky navbar on scroll */}
            {!isScrolled && (
              <FilterBar
                vegOnly={vegOnly}
                onToggleVegOnly={() => {
                  setVegOnly(!vegOnly);
                  if (!vegOnly) setNonVegOnly(false);
                }}
                nonVegOnly={nonVegOnly}
                onToggleNonVegOnly={() => {
                  setNonVegOnly(!nonVegOnly);
                  if (!nonVegOnly) setVegOnly(false);
                }}
                bestsellerOnly={bestsellerOnly}
                onToggleBestseller={() => setBestsellerOnly(!bestsellerOnly)}
                ratingOnly={ratingOnly}
                onToggleRating={() => setRatingOnly(!ratingOnly)}
                offersOnly={offersOnly}
                onToggleOffers={() => setOffersOnly(!offersOnly)}
                quickPrepOnly={quickPrepOnly}
                onToggleQuickPrep={() => setQuickPrepOnly(!quickPrepOnly)}
                maxPrice={maxPrice}
                onSelectMaxPrice={setMaxPrice}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onClearAllFilters={handleClearAllFilters}
                totalFiltered={filteredItems.length}
              />
            )}

            {/* Section Heading with scroll margin offset for sticky header */}
            <div id="menu-heading" className="flex items-center justify-between mb-5 mt-2 scroll-mt-36">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  {activeCategory === 'all'
                    ? 'Menu'
                    : categories.find((c) => c.slug === activeCategory)?.name || 'Menu'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Freshly prepared with single-origin beans, organic produce, and stone ovens.
                </p>
              </div>
            </div>

            {/* Food Item Grids (Zomato-Inspired High Converting Layout) */}
            {isLoading ? (
              /* Loading Skeletons */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 animate-pulse flex gap-4"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-12 bg-stone-200 dark:bg-stone-800 rounded-sm" />
                      <div className="h-5 w-3/4 bg-stone-200 dark:bg-stone-800 rounded-sm" />
                      <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded-sm" />
                      <div className="h-3 w-full bg-stone-200 dark:bg-stone-800 rounded-sm" />
                    </div>
                    <div className="w-28 h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              /* Empty Search / Filter Results */
              <div className="py-16 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 my-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mx-auto mb-3">
                  <Coffee className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
                  No dishes match your selection
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-5">
                  Try adjusting your dietary filters or clearing the search query to explore other items.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                    setVegOnly(false);
                    setNonVegOnly(false);
                    setBestsellerOnly(false);
                    setRatingOnly(false);
                  }}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Grid of Food Items with Framer Motion entry */
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MenuItemCard
                        item={item}
                        onOpenDetails={(it) => setSelectedItemDetail(it)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Reserve Table Interactive Feature Banner */}
            <div className="mt-14 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-10 border border-stone-800 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Dine-In Reservations</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                  Reserve Your Table at Out of the Town (OTT)
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Whether you desire our serene open-air garden lawn, AC family lounge, breezy highway rooftop,
                  or the bakery coffee counter, we guarantee your preferred spot.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    id="book-table-cta-btn"
                    onClick={() => setIsReservationOpen(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book a Table Now</span>
                  </button>
                  <span className="text-xs text-stone-400">
                    Instant confirmation • No booking fee
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Bottom Sticky Cart Bar (Zomato Style) */}
      <AnimatePresence>
        {totalItemsCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-30"
          >
            <div
              onClick={() => setIsCartOpen(true)}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-2xl shadow-amber-600/40 flex items-center justify-between cursor-pointer border border-amber-500 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-wider text-amber-200">
                    {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in cart
                  </p>
                  <p className="text-sm font-bold font-mono">
                    Total: ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white text-amber-800 px-4 py-2 rounded-xl shadow-xs">
                <span>View Cart</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highway Location & Google Map Section */}
      <LocationSection onOpenReservation={() => setIsReservationOpen(true)} />

      {/* Footer */}
      <footer className="mt-8 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/ott-logo.svg"
                alt="Out of the Town OTT Logo"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-amber-500/30 object-contain shadow-xs shrink-0"
              />
              <div>
                <span className="font-serif text-xl font-bold">
                  {cafeInfo?.name || 'Out of the Town - Restro and Bakery'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                    4.5 on Google (550+ reviews)
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Highway Restro & Bakery
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm leading-relaxed">
              {cafeInfo?.tagline || 'Gourmet Restro, Artisan Bakery & Highway Retreat in Kukas, Jaipur.'}
            </p>
            <div className="space-y-2 text-xs text-stone-600 dark:text-stone-400 pt-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {cafeInfo?.address || 'SP 41 B, Near RIICO Industrial Area & Arya College of Industrial Training, Kukas, Delhi-Jaipur Highway (NH-48), Jaipur, Rajasthan 302038 (Near Umaid Haveli)'}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <a
                  href="tel:+919828919626"
                  className="font-bold text-stone-800 dark:text-stone-200 hover:text-amber-600 transition-colors"
                >
                  Customer Care & Hotline: +91 98289 19626
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <a
                  href="mailto:care@outofthetownjaipur.com"
                  className="hover:text-amber-600 transition-colors"
                >
                  {cafeInfo?.email || 'care@outofthetownjaipur.com'}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{cafeInfo?.openingHours || 'Mon - Sun: 11:00 AM – 12:00 AM (Midnight)'}</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
              <li>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-amber-600 cursor-pointer"
                >
                  Digital Food Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsReservationOpen(true)}
                  className="hover:text-amber-600 cursor-pointer"
                >
                  Table Reservations
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="hover:text-amber-600 cursor-pointer"
                >
                  Online Order Cart
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenAdmin}
                  className="hover:text-amber-600 cursor-pointer"
                >
                  Restaurant Owner Admin
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm mb-3">Security & Quality</h4>
            <div className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Anti-Bombing API Protection</span>
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Strict Zod Input Validation</span>
              </p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Real-Time Kitchen Status Dispatch</span>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <p>© {new Date().getFullYear()} Out of the Town - Restro and Bakery. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">
            Zomato Layout Architecture • Flipkart Promo Carousel • Light/Dark Mode
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        onOrderSuccess={(order) => {
          setActiveOrder(order);
        }}
      />

      {/* Table Reservation Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />

      {/* Customer Profile & Settings Menu Modal */}
      <CustomerProfileModal
        isOpen={isCustomerMenuOpen}
        onClose={() => setIsCustomerMenuOpen(false)}
        onOpenReservation={() => setIsReservationOpen(true)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Order Status Modal (Active Tracking) */}
      {activeOrder && (
        <OrderStatusModal
          order={activeOrder}
          onClose={() => setActiveOrder(null)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Full Management Suite */}
      {isAdminDashboardOpen && adminToken && (
        <AdminDashboard
          token={adminToken}
          onLogout={handleAdminLogout}
          onClose={() => setIsAdminDashboardOpen(false)}
          onMenuUpdated={fetchData}
        />
      )}

      {/* Dish Detailed View Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xl">
            <div className="relative h-52 bg-stone-800">
              <img
                src={selectedItemDetail.image}
                alt={selectedItemDetail.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItemDetail(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-4 h-4 rounded-xs border flex items-center justify-center p-0.5 ${
                      selectedItemDetail.isVeg ? 'border-emerald-600' : 'border-rose-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedItemDetail.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                  </span>
                  <span className="text-xs font-bold uppercase text-stone-400">
                    {selectedItemDetail.category}
                  </span>
                </div>

                <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  {selectedItemDetail.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-amber-600 font-mono">
                    ₹{selectedItemDetail.price}
                  </span>
                  <span className="text-xs text-stone-500">
                    ★ {selectedItemDetail.rating.toFixed(1)} ({selectedItemDetail.reviewsCount} reviews)
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                {selectedItemDetail.description}
              </p>

              {selectedItemDetail.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedItemDetail.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    const el = document.getElementById(`add-btn-${selectedItemDetail.id}`);
                    el?.click();
                    setSelectedItemDetail(null);
                  }}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Order • ₹{selectedItemDetail.price}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <CafeHome />
      </CartProvider>
    </ThemeProvider>
  );
}
