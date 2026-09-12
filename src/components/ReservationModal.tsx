import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import type { Reservation, SeatingArea } from '../types.js';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = [
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '06:00 PM',
  '07:30 PM',
  '09:00 PM',
  '10:30 PM',
];

const SEATING_OPTIONS: { id: SeatingArea; label: string; desc: string; icon: string }[] = [
  { id: 'garden_patio', label: 'Lush Garden Lawn', desc: 'Open-air green lawn seating under fairy lights and starry highway sky', icon: '🌿' },
  { id: 'indoor_lounge', label: 'AC Family Lounge', desc: 'Air-conditioned comfort with plush booth seating and warm ambient lights', icon: '🛋️' },
];

export const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose }) => {
  const { customer, customerToken, isAuthenticated, requireAuth, logout } = useAuth();

  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('07:00 PM');
  const [guestCount, setGuestCount] = useState(2);
  const [seatingArea, setSeatingArea] = useState<SeatingArea>('indoor_lounge');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync customer details when authenticated
  useEffect(() => {
    if (customer) {
      if (customer.name) setCustomerName(customer.name);
      if (customer.phone) setCustomerPhone(customer.phone);
      if (customer.email) setCustomerEmail(customer.email);
    }
  }, [customer]);

  if (!isOpen) return null;

  const executeReservation = async () => {
    setErrorMessage(null);

    const effectiveName = (customerName || customer?.name || '').trim();
    const effectivePhone = (customerPhone || customer?.phone || '').trim();
    const effectiveEmail = (customerEmail || customer?.email || '').trim();

    if (!effectiveName) {
      setErrorMessage('Please provide your full name');
      return;
    }
    if (!effectivePhone || effectivePhone.replace(/\D/g, '').length < 8) {
      setErrorMessage('Please provide a valid phone number for SMS confirmation');
      return;
    }
    if (!effectiveEmail || !effectiveEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const resv = await api.createReservation(
        {
          customerName: effectiveName,
          customerPhone: effectivePhone,
          customerEmail: effectiveEmail,
          date,
          time,
          guestCount,
          seatingArea,
          specialRequests: specialRequests.trim() || undefined,
        },
        customerToken || undefined
      );

      setConfirmedReservation(resv);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Prompt OTP login if guest tries to reserve table
    if (!isAuthenticated) {
      requireAuth(() => {
        executeReservation();
      }, 'reservation');
      return;
    }

    await executeReservation();
  };

  const resetForm = () => {
    setConfirmedReservation(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all my-8">
        {/* Header - High contrast warm gradient with crisp visible text */}
        <div className="p-6 border-b border-amber-600/30 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-amber-700 via-amber-800 to-orange-800 dark:from-amber-950 dark:via-stone-900 dark:to-orange-950 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white shadow-md backdrop-blur-md border border-white/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-tight drop-shadow-xs">
                Reserve Your Table
              </h2>
              <p className="text-xs text-amber-100 dark:text-amber-200/90 font-medium">
                Experience royal thalis, artisan bakes & highway ambiance at Out of the Town
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-2 text-white/80 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedReservation ? (
          /* Confirmation Success Card */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400">
                Instant Confirmation
              </span>
              <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
                Table Reserved Successfully!
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                We've sent the booking voucher and SMS confirmation to{' '}
                <strong>{confirmedReservation.customerEmail}</strong>.
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400">Booking Reference</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {confirmedReservation.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400">Guest Name</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {confirmedReservation.customerName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400">Date & Time</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {confirmedReservation.date} at {confirmedReservation.time}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500 dark:text-stone-400">Party Size & Area</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {confirmedReservation.guestCount} Guests • {confirmedReservation.seatingArea.replace('_', ' ')}
                </span>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              Done & Explore Menu
            </button>
          </div>
        ) : (
          /* Reservation Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Date & Guest Count Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Select Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                  Party Size (Guests) *
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        guestCount === num
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
                Preferred Time Slot *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      time === slot
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-500'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Seating Area Preference */}
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2">
                Seating Atmosphere Preference
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SEATING_OPTIONS.map((opt) => {
                  const isSelected = seatingArea === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSeatingArea(opt.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 ring-1 ring-amber-600'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Guest Contact Information */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  Guest Contact Details
                </label>
                {isAuthenticated && customer && (
                  <button
                    type="button"
                    id="reservation-customer-sign-out-btn"
                    onClick={() => {
                      logout();
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerEmail('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out ({customer.name})</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Full Name *"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
                />

                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <input
                type="email"
                placeholder="Email Address (for instant confirmation voucher) *"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500"
              />

              <textarea
                placeholder="Special requests or occasion (e.g. Birthday candles, quiet booth, high chair, dietary notes)..."
                rows={2}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-amber-500 resize-none"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-400 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submit-reservation-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Table...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm Table Booking</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
