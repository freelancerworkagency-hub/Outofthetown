import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Search,
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
  CalendarCheck,
  Shield,
  Sun,
  Moon,
  X,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Info,
  UtensilsCrossed,
  Flame,
  MapPin,
  LogOut,
  LogIn,
  Cake,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useCart } from '../context/CartContext.js';
import { useAuth } from '../context/AuthContext.js';
import type { PromoBanner } from '../types.js';

interface TopPromotionalHeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  vegOnly: boolean;
  onToggleVegOnly: () => void;
  onOpenReservation: () => void;
  onOpenAdmin: () => void;
  onOpenProfileMenu?: () => void;
  onOpenCustomCake?: () => void;
  banners: PromoBanner[];
  onSelectBanner: (banner: PromoBanner) => void;
  onSelectCategory?: (category: string) => void;
  showOverlayHeader?: boolean;
}

export const TopPromotionalHero: React.FC<TopPromotionalHeroProps> = ({
  searchQuery,
  onSearchChange,
  vegOnly,
  onToggleVegOnly,
  onOpenReservation,
  onOpenAdmin,
  onOpenProfileMenu,
  onOpenCustomCake,
  banners,
  onSelectBanner,
  showOverlayHeader = true,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { totalItemsCount, total, setIsCartOpen, applyPromo, appliedPromo } = useCart();
  const { customer, isAuthenticated, logout, openAuthModal } = useAuth();

  // Unified Promotional Carousel Slide index (Slides 0..N: Highway Combos)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = banners?.length || 0;

  // Touch gesture tracking for mobile swipe
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Auto-rotate promotional carousel sliding right at fixed 4.5s interval like Zomato
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current !== null) {
      if (touchDeltaXRef.current < -35) {
        // Swiped left -> slide right (next slide)
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      } else if (touchDeltaXRef.current > 35) {
        // Swiped right -> slide left (previous slide)
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  // Modals & Popovers
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedCouponToast, setCopiedCouponToast] = useState<string | null>(null);

  // Dynamic header height to ensure promotional banner text starts just a line below the search bar without overlap
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(140);

  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Voice Search / Mic state
  const [isListening, setIsListening] = useState(false);

  // Rotating placeholder keywords featuring Out of the Town specialty dishes
  const placeholders = [
    'Search "OTT Royal Thali"',
    'Search "Artisan Blueberry Cheesecake"',
    'Search "Crispy Kurkure Momos"',
    'Search "Farmhouse Stone-Baked Pizza"',
    'Search "Dal Makhani & Garlic Naan"',
    'Search "Nutella Hazelnut Freakshake"',
    'Search "Sizzling Walnut Brownie"',
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate search placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Handle Speech Recognition for Microphone button
  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback if browser doesn't support Web Speech API
      setIsListening(true);
      setTimeout(() => {
        onSearchChange('paratha');
        setIsListening(false);
      }, 1500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleApplyCoupon = (code: string, label: string) => {
    const res = applyPromo(code);
    setCopiedCouponToast(res.message || `🎉 ${label} applied successfully!`);
    setTimeout(() => {
      setCopiedCouponToast(null);
    }, 3500);
  };

  return (
    <div
      className="relative w-full overflow-hidden select-none bg-stone-50 dark:bg-stone-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 
        ========================================================================
        FULL-BLEED PROMOTIONAL BANNER CAROUSEL EXTENDING TO THE BOTTOM
        The background image extends to the bottom and slowly fades with white background
        ========================================================================
      */}
      <div
        className={`relative w-full ${
          showOverlayHeader
            ? 'min-h-[350px] xs:min-h-[370px] sm:min-h-[395px] md:min-h-[430px]'
            : 'min-h-[210px] xs:min-h-[230px] sm:min-h-[260px] md:min-h-[290px]'
        } flex flex-col justify-between overflow-hidden`}
      >
        {/* Sliding Track for promotional banners and deals */}
        {(() => {
          const safeSlide = totalSlides > 0 ? (currentSlide >= totalSlides ? 0 : currentSlide) : 0;
          return (
            <div
              className="absolute inset-0 flex w-full h-full transition-transform duration-500 ease-out z-0"
              style={{
                transform: `translateX(-${safeSlide * 100}%)`,
              }}
            >
              {/* HIGHWAY PROMOTIONAL COMBOS & DEALS EXTENDING FULL BLEED TO THE TOP AND BOTTOM */}
              {banners.map((combo) => (
                <div
                  key={combo.id}
                  id={`hero-combo-${combo.id}`}
                  onClick={() => onSelectBanner(combo)}
                  className={`w-full h-full shrink-0 relative cursor-pointer overflow-hidden flex flex-col ${
                    showOverlayHeader ? 'justify-start' : 'justify-end'
                  } pb-5 sm:pb-7 px-4 sm:px-10 md:px-16 bg-stone-50 dark:bg-stone-950 group`}
                  style={{ paddingTop: showOverlayHeader ? `${headerHeight + 28}px` : '16px' }}
                >
                  {/* Full-bleed food promotional banner image extending fully to bottom */}
                  <img
                    src={combo.imageUrl}
                    alt={combo.title}
                    className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.82] group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Top scrim: keeps header, logo, search bar & combo title text high-contrast and readable */}
              <div className="absolute inset-x-0 top-0 h-44 sm:h-56 bg-gradient-to-b from-black/75 via-black/40 to-transparent pointer-events-none" />

              {/* Bottom slow fade: starts 1 line lower, extending smoothly to the bottom white background */}
              <div className="absolute inset-x-0 bottom-0 h-36 sm:h-46 bg-gradient-to-b from-transparent via-stone-50/20 via-40% via-stone-50/60 via-68% via-stone-50/92 via-88% to-stone-50 dark:via-stone-950/20 dark:via-stone-950/60 dark:via-stone-950/92 dark:to-stone-950 pointer-events-none" />

              {/* Lower combo details */}
              <div className="relative z-20 max-w-2xl text-white">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full text-white shadow-xs ${combo.badgeBgColor}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {combo.highlightBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-extrabold shadow-xs">
                    <Tag className="w-3 h-3" />
                    {combo.discountText}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold tracking-tight text-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {combo.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-100/95 font-medium line-clamp-2 max-w-xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-relaxed">
                  {combo.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
          );
        })()}

        {/* 
          =============================================================
          OVERLAPPING OPTIONS ON TOP OF THE PROMOTIONAL BANNER
          - Top Bar (Location, Book Table, Wallet, Theme, Cart, Profile)
          - Search Bar + Veg Mode Toggle
          =============================================================
        */}
        {showOverlayHeader && (
          <div
            ref={headerRef}
            className="relative z-20 w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-4 pointer-events-auto"
          >
            {/* ROW 1: TOP BAR OVERLAPPING BANNER */}
            <div className="w-full flex items-center justify-between gap-1 sm:gap-4 mb-3 sm:mb-4">
              {/* Cafe Name with Circular Logo (Matching User Provided Logo Image) */}
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <img
                  src="/ott-logo.svg"
                  alt="Out of the Town OTT Logo"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full drop-shadow-md shrink-0 border border-white/40 object-contain hover:scale-105 transition-transform"
                />
                <div className="leading-tight min-w-0">
                  <span className="font-serif font-extrabold text-sm sm:text-base text-white tracking-tight truncate block drop-shadow-xs">
                    Out of the Town
                  </span>
                  <span className="text-[10px] sm:text-xs text-amber-300 font-semibold tracking-wide truncate block drop-shadow-xs">
                    Highway Restro &amp; Bakery
                  </span>
                </div>
              </div>

              {/* Right Action Icons Overlapping Banner */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Restaurant Location shown just beside the Cart option */}
                <button
                  id="hero-restaurant-location-btn"
                  onClick={() => {
                    const el = document.getElementById('location-and-map-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.open(
                        'https://maps.google.com/maps?q=Out+of+the+Town+-+Restro+and+Bakery,+Kukas,+Jaipur,+Rajasthan',
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-black/40 hover:bg-black/60 text-white font-medium text-xs rounded-full backdrop-blur-md border border-white/30 shadow-md transition-all hover:scale-105 cursor-pointer shrink-0 text-left group"
                  title="Restaurant Location: SP 41 B, Kukas, Jaipur (NH-48) • Click to view map & directions"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 fill-rose-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight whitespace-nowrap">
                    <span className="text-[10px] sm:text-xs font-bold text-white">
                      Kukas, Jaipur
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-semibold text-amber-300 hidden xs:inline">
                      NH-48 Highway
                    </span>
                  </div>
                </button>

                {/* Custom Cake / Bakery Pre-Order Request Button */}
                {onOpenCustomCake && (
                  <button
                    id="hero-custom-cake-btn"
                    onClick={onOpenCustomCake}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-rose-600/70 to-amber-600/70 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-full backdrop-blur-md border border-white/30 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                    title="Design Made-to-Order Custom Celebration Cake"
                  >
                    <Cake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                    <span className="hidden sm:inline">Custom Cake</span>
                  </button>
                )}

                {/* Cart Button */}
                <button
                  id="btn-open-cart-hero"
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-lg shadow-amber-600/40 transition-all hover:scale-105 cursor-pointer shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-700 font-bold text-[10px]">
                      {totalItemsCount}
                    </span>
                  )}
                </button>

                {/* User Profile Avatar "S" - Opens Customer Profile Menu */}
                <button
                  id="btn-profile-avatar"
                  onClick={() => {
                    if (onOpenProfileMenu) {
                      onOpenProfileMenu();
                    } else {
                      setShowProfileModal(true);
                    }
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-2 border-white/80 shadow-md flex items-center justify-center font-bold text-xs sm:text-sm hover:scale-105 transition-all cursor-pointer shrink-0"
                  aria-label="Customer Profile Menu"
                  title={isAuthenticated && customer?.name ? `${customer.name} Profile & Menu` : 'Customer Profile Menu'}
                >
                  {isAuthenticated && customer?.name ? customer.name.charAt(0).toUpperCase() : 'S'}
                </button>
              </div>
            </div>

            {/* ROW 2: SEARCH BAR + VEG MODE TOGGLE OVERLAPPING BANNER */}
            <div className="w-full max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
              {/* Main Rounded Search Card */}
              <div className="flex-1 min-w-0 flex items-center bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-white/50 dark:border-stone-700/80 shadow-xl px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-2.5 transition-all focus-within:ring-2 focus-within:ring-amber-500">
                {/* Pinkish/Amber Magnifying Glass */}
                <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400 stroke-[2.5] shrink-0" />

                {/* Animated / User Controlled Search Input */}
                <div className="flex-1 min-w-0 relative flex items-center">
                  <input
                    id="search-input-top-hero"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholders[placeholderIndex]}
                    className="w-full bg-transparent text-xs sm:text-base font-normal text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden truncate"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer shrink-0"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>

                {/* Vertical Separator */}
                <div className="h-5 sm:h-6 w-px bg-stone-200 dark:bg-stone-700 shrink-0" />

                {/* Microphone Button with Voice Search Animation */}
                <button
                  id="btn-voice-search"
                  onClick={handleMicClick}
                  aria-label="Search by voice"
                  className={`p-1 sm:p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 animate-pulse'
                      : 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-stone-800'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
                  ) : (
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                  )}
                </button>
              </div>

              {/* VEG MODE Toggle Overlapping Banner */}
              <div className="flex flex-col items-center justify-center shrink-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-white/50 dark:border-stone-700/80 shadow-xl">
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-tight text-stone-800 dark:text-stone-200 leading-tight text-center">
                  VEG
                </span>
                <span className="text-[8px] sm:text-[9px] font-extrabold tracking-wider text-stone-600 dark:text-stone-400 -mt-0.5 leading-tight text-center">
                  MODE
                </span>
                <button
                  id="veg-mode-toggle-switch"
                  type="button"
                  role="switch"
                  aria-checked={vegOnly}
                  onClick={onToggleVegOnly}
                  className={`relative mt-0.5 sm:mt-1 inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    vegOnly ? 'bg-emerald-600 shadow-emerald-500/30 shadow-xs' : 'bg-stone-300 dark:bg-stone-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      vegOnly ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Left & Right Chevron Controls */}
        {totalSlides > 1 && (
          <>
            <button
              id="hero-banner-prev"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
              }}
              aria-label="Previous slide"
              style={{
                top: showOverlayHeader
                  ? `calc(${headerHeight}px + (100% - ${headerHeight}px) / 2)`
                  : '50%',
              }}
              className="absolute left-1.5 sm:left-3 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white border border-white/30 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-black/65 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
            <button
              id="hero-banner-next"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev + 1) % totalSlides);
              }}
              aria-label="Next slide"
              style={{
                top: showOverlayHeader
                  ? `calc(${headerHeight}px + (100% - ${headerHeight}px) / 2)`
                  : '50%',
              }}
              className="absolute right-1.5 sm:right-3 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 text-white border border-white/30 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-black/65 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          </>
        )}
      </div>

      {/* TOAST: When user taps on Welcome coupon */}
      <AnimatePresence>
        {copiedCouponToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white dark:bg-white dark:text-stone-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-stone-700 dark:border-stone-200 text-xs sm:text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{copiedCouponToast}</span>
            <button
              onClick={() => setCopiedCouponToast(null)}
              className="text-stone-400 hover:text-white dark:hover:text-stone-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 dark:border-stone-800"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-base shrink-0 shadow-sm">
                    {isAuthenticated ? (customer?.name ? customer.name.charAt(0).toUpperCase() : 'C') : 'G'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                      {isAuthenticated ? (customer?.name || 'Customer') : 'Guest Visitor'}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {isAuthenticated ? (customer?.email || `+91 ${customer?.phone}`) : 'Not signed in'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-2 text-xs">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileModal(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 font-semibold text-rose-700 dark:text-rose-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <span>Sign Out ({customer?.name})</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      openAuthModal('account');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 font-semibold text-amber-800 dark:text-amber-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-amber-600" />
                      <span>Sign In with Mobile OTP</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onOpenReservation();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800 font-semibold text-stone-700 dark:text-stone-300"
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-amber-600" />
                    <span>My Table Reservations</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800 font-semibold text-stone-700 dark:text-stone-300"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-stone-500" />
                    <span>Restaurant Admin Panel</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
