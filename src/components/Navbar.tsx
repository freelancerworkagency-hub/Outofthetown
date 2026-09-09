import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Coffee,
  X,
  Mic,
  MicOff,
  ChevronLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { FilterBar, FilterBarProps } from './FilterBar.js';

export interface NavbarProps extends Omit<FilterBarProps, 'isSticky'> {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenProfileMenu: () => void;
  onOpenReservation?: () => void;
  onOpenAdmin?: () => void;
  onNavigateHome?: () => void;
  isOfferDetailView?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  vegOnly,
  onToggleVegOnly,
  nonVegOnly,
  onToggleNonVegOnly,
  bestsellerOnly,
  onToggleBestseller,
  ratingOnly,
  onToggleRating,
  offersOnly,
  onToggleOffers,
  quickPrepOnly,
  onToggleQuickPrep,
  maxPrice,
  onSelectMaxPrice,
  sortBy,
  onSortChange,
  onClearAllFilters,
  totalFiltered,
  onOpenProfileMenu,
  onNavigateHome,
  isOfferDetailView = false,
}) => {
  const { totalItemsCount, total, setIsCartOpen } = useCart();

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

  // Rotate search placeholder every 3.2 seconds
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

  return (
    <header
      id="zomato-sticky-navbar"
      className="fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-stone-900/95 border-b border-stone-200/90 dark:border-stone-800 transition-all duration-200 shadow-md"
    >
      {/* ROW 1: BRAND / BACK + SEARCH BAR + VEG MODE + CART */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-2 pb-1 sm:pt-2.5 sm:pb-1.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Identity or Back Button */}
        {isOfferDetailView ? (
          <button
            id="navbar-back-to-menu-btn"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold shrink-0 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Menu</span>
          </button>
        ) : (
          <button
            id="navbar-brand-logo-btn"
            onClick={onNavigateHome || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
            className="flex items-center gap-2 shrink-0 text-left cursor-pointer group"
            title="Out of the Town - Back to Top"
          >
            <img
              src="/ott-logo.svg"
              alt="Out of the Town Logo"
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full drop-shadow-xs border border-amber-500/30 object-contain group-hover:scale-105 transition-transform"
            />
            <div className="hidden xs:block leading-tight">
              <span className="font-serif text-xs sm:text-sm font-extrabold text-stone-900 dark:text-stone-100 block">
                Out of the Town
              </span>
              <span className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 font-semibold block">
                Highway Restro &amp; Bakery
              </span>
            </div>
          </button>
        )}

        {/* Center: Zomato-Style Sticky Search Bar */}
        <div className="flex-1 min-w-0 flex items-center rounded-xl sm:rounded-2xl bg-stone-100 dark:bg-stone-800/95 border border-stone-200/90 dark:border-stone-700/80 shadow-inner px-2.5 sm:px-3.5 py-1.5 sm:py-2 gap-2 focus-within:ring-2 focus-within:ring-amber-500 transition-all">
          <Search className="w-4 h-4 text-rose-500 dark:text-rose-400 stroke-[2.5] shrink-0" />
          <div className="flex-1 min-w-0 flex items-center">
            <input
              id="sticky-search-menu-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholders[placeholderIndex]}
              className="w-full bg-transparent text-xs sm:text-sm font-normal text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden truncate"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="h-4 w-px bg-stone-200 dark:bg-stone-700 shrink-0" />

          {/* Microphone Voice Search Button */}
          <button
            id="sticky-btn-voice-search"
            onClick={handleMicClick}
            aria-label="Search by voice"
            className={`p-1 rounded-full transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 animate-pulse'
                : 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-stone-700'
            }`}
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
            ) : (
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            )}
          </button>
        </div>

        {/* Right 1: Sticky VEG MODE Switch */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 bg-stone-100 dark:bg-stone-800/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 shadow-2xs">
          <div className="flex flex-col items-center">
            <span className="text-[8px] sm:text-[9px] font-extrabold tracking-tight text-stone-800 dark:text-stone-200 leading-none">
              VEG
            </span>
            <span className="text-[7px] sm:text-[8px] font-extrabold tracking-wider text-stone-600 dark:text-stone-400 leading-none">
              MODE
            </span>
          </div>
          <button
            id="navbar-veg-mode-toggle"
            type="button"
            role="switch"
            aria-checked={vegOnly}
            onClick={onToggleVegOnly}
            className={`relative inline-flex h-4 w-7 sm:h-5 sm:w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              vegOnly ? 'bg-emerald-600 shadow-emerald-500/30 shadow-xs' : 'bg-stone-300 dark:bg-stone-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                vegOnly ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Right 2: Action Icons (Cart, Theme, Table Reservation) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Cart Trigger Button */}
          <button
            id="navbar-open-cart-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cart</span>
            {totalItemsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-white text-amber-700 rounded-full">
                {totalItemsCount}
              </span>
            )}
            {total > 0 && (
              <span className="hidden md:inline font-mono text-xs pl-1 border-l border-amber-500">
                ₹{Math.round(total)}
              </span>
            )}
          </button>

          {/* Customer Profile Button (Opens Customer Menu with Book Table, Night Mode, etc.) */}
          <button
            id="navbar-customer-profile-btn"
            onClick={onOpenProfileMenu}
            title="Customer Profile & Menu"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-blue-400/50"
            aria-label="Open Customer Profile Menu"
          >
            S
          </button>
        </div>
      </div>

      {/* ROW 2: ZOMATO STICKY FILTER BAR (Filters, Sort, Pure Veg, Non Veg, Rating 4.5+, etc.) */}
      {!isOfferDetailView && (
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 border-t border-stone-100 dark:border-stone-800/80">
          <FilterBar
            vegOnly={vegOnly}
            onToggleVegOnly={onToggleVegOnly}
            nonVegOnly={nonVegOnly}
            onToggleNonVegOnly={onToggleNonVegOnly}
            bestsellerOnly={bestsellerOnly}
            onToggleBestseller={onToggleBestseller}
            ratingOnly={ratingOnly}
            onToggleRating={onToggleRating}
            offersOnly={offersOnly}
            onToggleOffers={onToggleOffers}
            quickPrepOnly={quickPrepOnly}
            onToggleQuickPrep={onToggleQuickPrep}
            maxPrice={maxPrice}
            onSelectMaxPrice={onSelectMaxPrice}
            sortBy={sortBy}
            onSortChange={onSortChange}
            onClearAllFilters={onClearAllFilters}
            totalFiltered={totalFiltered}
            isSticky={true}
          />
        </div>
      )}
    </header>
  );
};
