import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CalendarCheck,
  Moon,
  Sun,
  Shield,
  Phone,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  LogOut,
  LogIn,
  Package,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Cake,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import type { Order, Reservation } from '../types.js';

export interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReservation: () => void;
  onOpenAdmin: () => void;
  onOpenCustomCake?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenReservation,
  onOpenAdmin,
  onOpenCustomCake,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { customer, customerToken, isAuthenticated, logout, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'menu' | 'orders' | 'reservations'>('menu');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load customer's private data (guaranteed isolated)
  const fetchCustomerData = async () => {
    if (!isOpen || (!isAuthenticated && !customer)) {
      setOrders([]);
      setReservations([]);
      return;
    }

    try {
      setIsLoadingData(true);
      setLoadError(null);
      const [userOrders, userResvs] = await Promise.all([
        api.getMyOrders(customerToken || undefined),
        api.getMyReservations(customerToken || undefined),
      ]);
      setOrders(userOrders);
      setReservations(userResvs);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load your personal data');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen && (isAuthenticated || customer)) {
      fetchCustomerData();
    }
  }, [isOpen, isAuthenticated, customerToken, activeTab]);

  if (!isOpen) return null;

  const handleOpenLogin = () => {
    onClose();
    openAuthModal('account');
  };

  const initial = customer?.name ? customer.name.charAt(0).toUpperCase() : 'G';

  return (
    <AnimatePresence>
      <div
        id="customer-profile-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 my-auto text-stone-900 dark:text-stone-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Customer Profile Card */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl ${
                  isAuthenticated
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                } text-white font-black flex items-center justify-center text-lg shadow-md`}>
                  {initial}
                </div>
                {isAuthenticated && (
                  <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                    {isAuthenticated ? customer?.name : 'Guest Visitor'}
                  </h3>
                  {isAuthenticated ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                      <Sparkles className="w-2.5 h-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">No login required to browse</span>
                  )}
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {isAuthenticated ? customer?.email : 'Sign in to track orders & bookings'}
                </p>

                {isAuthenticated && customer?.phone && (
                  <p className="text-[10.5px] text-amber-700 dark:text-amber-400 font-mono font-medium">
                    📱 +91 {customer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <button
                  id="header-sign-out-btn"
                  onClick={() => {
                    logout();
                    setActiveTab('menu');
                  }}
                  title="Sign out of your customer account"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  id="header-sign-in-btn"
                  onClick={handleOpenLogin}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              <button
                id="customer-profile-close-btn"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                aria-label="Close profile menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs when logged in */}
          {isAuthenticated && (
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl my-3">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'menu'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Account &amp; Shortcuts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'orders'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Orders ({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reservations')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'reservations'
                    ? 'bg-white dark:bg-stone-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tables ({reservations.length})</span>
              </button>
            </div>
          )}

          {/* TAB 1: MENU / MAIN VIEW */}
          {activeTab === 'menu' && (
            <div className="space-y-2 text-xs mt-3">
              {/* Not Logged In Promo Banner */}
              {!isAuthenticated && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-transparent border border-amber-300 dark:border-amber-800 text-stone-800 dark:text-stone-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-stone-900 dark:text-stone-100 mb-1">
                    <LogIn className="w-4 h-4 text-amber-600" />
                    <span>Customer Sign In</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                    Verify via mobile number &amp; OTP when placing orders or booking tables. No login is needed to explore our menu!
                  </p>
                  <button
                    id="profile-sign-in-cta-btn"
                    onClick={handleOpenLogin}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Sign In with Mobile OTP</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 1. MY ORDERS QUICK ACCESS */}
              {isAuthenticated && (
                <button
                  id="customer-menu-my-orders-btn"
                  onClick={() => setActiveTab('orders')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700/80 font-semibold text-stone-900 dark:text-stone-100 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Package className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span>My Order History</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {orders.length} orders
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        View live order tracking &amp; GST tax invoices
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* 2. BOOK A TABLE */}
              <button
                id="customer-menu-book-table-btn"
                onClick={() => {
                  onClose();
                  onOpenReservation();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent hover:from-amber-500/20 hover:via-orange-500/20 border border-amber-200/80 dark:border-amber-800/50 font-semibold text-stone-900 dark:text-stone-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                    <CalendarCheck className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>Book a Table</span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500 text-white">
                        Instant
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Reserve highway dining, family booths or outdoor terrace
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 3. CUSTOM CAKE / CELEBRATION PRE-ORDER */}
              {onOpenCustomCake && (
                <button
                  id="customer-menu-custom-cake-btn"
                  onClick={() => {
                    onClose();
                    onOpenCustomCake();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent hover:from-rose-500/20 hover:via-amber-500/20 border border-rose-200/80 dark:border-rose-900/50 font-semibold text-stone-900 dark:text-stone-100 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Cake className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>Custom Cake &amp; Bakery Pre-Order</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                          Design Your Own
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400">
                        Upload reference photo, custom flavor, weight &amp; message
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* 4. NIGHT MODE / DARK MODE OPTION */}
              <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isDark ? 'bg-indigo-900/60 text-indigo-300' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isDark ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {isDark ? 'Night Mode Active' : 'Day / Light Mode'}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      {isDark
                        ? 'Comfortable for evening highway drives'
                        : 'High-contrast bright daylight theme'}
                    </div>
                  </div>
                </div>

                <button
                  id="customer-menu-night-mode-toggle"
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isDark ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isDark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 4. RESTAURANT ADMIN PANEL SHORTCUT */}
              <button
                id="customer-menu-admin-btn"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 font-semibold text-stone-700 dark:text-stone-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-stone-800 dark:text-stone-200">
                      Restaurant Management Portal
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      Staff &amp; Kitchen live orders dashboard
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* 5. CUSTOMER CARE & ORDERS HELPLINE */}
              <a
                id="customer-menu-call-support"
                href="tel:+919828919626"
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700/80 font-semibold text-stone-700 dark:text-stone-300 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Phone className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-stone-800 dark:text-stone-200">
                      Customer Care &amp; Orders Hotline
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      +91 98289 19626 • 11:00 AM – 12:00 AM
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Call Now
                </span>
              </a>

              {/* Sign Out Card if logged in */}
              {isAuthenticated && (
                <div className="pt-2">
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <LogOut className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 dark:text-stone-100 truncate text-xs">
                          {customer?.name || 'Customer Account'}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                          {customer?.email || (customer?.phone ? `+91 ${customer.phone}` : 'Signed In')}
                        </div>
                      </div>
                    </div>
                    <button
                      id="customer-logout-btn"
                      onClick={() => {
                        logout();
                        setActiveTab('menu');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY ORDERS (Isolated to this user) */}
          {activeTab === 'orders' && (
            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
              {isLoadingData ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-xs">Loading your personal orders...</span>
                </div>
              ) : loadError ? (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchCustomerData}
                    className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-bold text-sm">No orders yet</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Your delicious orders placed with +91 {customer?.phone} will appear here.
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-stone-900 dark:text-stone-100">
                            #{ord.id}
                          </span>
                          {(ord.isCustomCake || ord.customCakeDetails) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                              <Cake className="w-2.5 h-2.5" />
                              <span>Custom Cake</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {ord.status}
                      </span>
                    </div>

                    {(ord.isCustomCake || ord.customCakeDetails) && ord.customCakeDetails?.referenceImageUrl && (
                      <div className="mb-2 p-1.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center gap-2">
                        <img
                          src={ord.customCakeDetails.referenceImageUrl}
                          alt="Cake reference"
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                        <div className="text-[11px] min-w-0">
                          <p className="font-semibold text-rose-900 dark:text-rose-200 truncate">
                            {ord.customCakeDetails.occasion} • {ord.customCakeDetails.weightKg}kg {ord.customCakeDetails.flavor}
                          </p>
                          {ord.customCakeDetails.targetDate && (
                            <p className="text-[10px] text-stone-500 dark:text-stone-400">
                              Event: {ord.customCakeDetails.targetDate} ({ord.customCakeDetails.targetTime})
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items preview */}
                    <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1 mb-2">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-mono">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-700 text-xs">
                      <span className="text-stone-500">Total Amount:</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                        ₹{ord.total}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: MY RESERVATIONS (Isolated to this user) */}
          {activeTab === 'reservations' && (
            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
              {isLoadingData ? (
                <div className="py-12 text-center text-stone-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-xs">Loading your reservations...</span>
                </div>
              ) : reservations.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <CalendarCheck className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="font-bold text-sm">No reservations yet</p>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenReservation();
                    }}
                    className="mt-3 py-1.5 px-3 rounded-xl bg-amber-600 text-white font-bold text-xs"
                  >
                    Reserve Table Now
                  </button>
                </div>
              ) : (
                reservations.map((resv) => (
                  <div
                    key={resv.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs">#{resv.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {resv.status}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-stone-600 dark:text-stone-300">
                      <div>
                        <strong>Date &amp; Time:</strong> {resv.date} at {resv.time}
                      </div>
                      <div>
                        <strong>Guests:</strong> {resv.guestCount} People
                      </div>
                      <div>
                        <strong>Area:</strong> {resv.seatingArea.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
            <span>Out of the Town • Kukas, Jaipur</span>
            <span>Customer Care: +91 98289 19626</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
