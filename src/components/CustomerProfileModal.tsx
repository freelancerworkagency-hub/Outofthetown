import React from 'react';
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
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';

export interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReservation: () => void;
  onOpenAdmin: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenReservation,
  onOpenAdmin,
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-stone-200 dark:border-stone-800 my-auto text-stone-900 dark:text-stone-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: Customer Profile Card */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/20">
                  S
                </div>
                <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate">
                    Satyam Kumar
                  </h3>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                    <Sparkles className="w-2.5 h-2.5" /> VIP
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  kumarsatyam5868@gmail.com
                </p>
                <p className="text-[10.5px] text-amber-700 dark:text-amber-400 font-medium">
                  OTT Highway Club Member
                </p>
              </div>
            </div>

            <button
              id="customer-profile-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              aria-label="Close profile menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Options */}
          <div className="space-y-2 text-xs mt-4">
            {/* 1. BOOK A TABLE */}
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

            {/* 2. NIGHT MODE / DARK MODE OPTION */}
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

              {/* Night Mode Toggle Switch */}
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

            {/* 3. RESTAURANT ADMIN PANEL SHORTCUT */}
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
                    Staff & Kitchen live orders dashboard
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* 4. CUSTOMER CARE & ORDERS HELPLINE */}
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
                    Customer Care & Orders Hotline
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
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
            <span>Out of the Town • Kukas, Jaipur</span>
            <span>Care: +91 98289 19626</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
