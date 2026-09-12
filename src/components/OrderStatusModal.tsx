import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  RefreshCw,
  Phone,
  Cake,
  Calendar,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api.js';
import type { Order, OrderStatus } from '../types.js';

interface OrderStatusModalProps {
  order: Order;
  onClose: () => void;
}

const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'pending', label: 'Order Placed & Received', icon: <CheckCircle2 className="w-4 h-4" /> },
  { status: 'accepted', label: 'Accepted by Staff', icon: <ChefHat className="w-4 h-4" /> },
  { status: 'preparing', label: 'Kitchen Preparing', icon: <ChefHat className="w-4 h-4" /> },
  { status: 'ready', label: 'Ready / Out for Delivery', icon: <Bike className="w-4 h-4" /> },
  { status: 'delivered', label: 'Delivered / Completed', icon: <PackageCheck className="w-4 h-4" /> },
];

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({ order: initialOrder, onClose }) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'preparing': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
    }
  };

  const currentStep = getStepIndex(order.status);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const updated = await api.getOrder(order.id);
      setOrder(updated);
    } catch {
      // Keep existing state
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-900/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                Live Kitchen Tracker
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                {order.id}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
              Order In Progress
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              title="Refresh Order Status"
              className={`p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Estimated Time Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold">
                  Estimated Arrival / Pickup
                </p>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                  {order.estimatedTimeMinutes} - {order.estimatedTimeMinutes + 10} minutes
                </p>
              </div>
            </div>
            <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-amber-600 text-white">
              {order.orderType}
            </span>
          </div>

          {/* Stepper Progress */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Status Timeline
            </h4>
            <div className="relative pl-6 border-l-2 border-stone-200 dark:border-stone-700 space-y-5">
              {STEPS.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;

                return (
                  <div key={step.status} className="relative">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                        isPassed
                          ? 'bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-amber-600 dark:text-amber-400'
                            : isPassed
                            ? 'text-stone-900 dark:text-stone-200'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.status === 'accepted' && order.acceptedBy && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-0.5">
                          Staff: {order.acceptedBy} {order.acceptedAt ? `(${new Date(order.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
                        </p>
                      )}
                      {isCurrent && order.statusNotes && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {order.statusNotes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Celebration Cake Details Card */}
          {(order.isCustomCake || order.customCakeDetails) && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200 dark:border-rose-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <Cake className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Made-to-Order Celebration Cake
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                      {order.customCakeDetails?.occasion || 'Special Celebration'}
                    </h5>
                  </div>
                </div>
                {order.customCakeDetails?.isEggless && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    100% Eggless
                  </span>
                )}
              </div>

              {/* Reference Image and Specs */}
              <div className="flex items-start gap-3 bg-white/60 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                {order.customCakeDetails?.referenceImageUrl && (
                  <img
                    src={order.customCakeDetails.referenceImageUrl}
                    alt="Custom Cake Reference"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-stone-300 dark:border-stone-700 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0 text-xs space-y-1">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">
                    <span className="text-stone-500 font-normal">Flavor &amp; Size:</span>{' '}
                    {order.customCakeDetails?.weightKg || 1}kg • {order.customCakeDetails?.flavor}
                  </p>
                  {order.customCakeDetails?.shape && (
                    <p className="text-stone-600 dark:text-stone-400">
                      <span className="text-stone-500">Shape:</span> {order.customCakeDetails.shape}
                    </p>
                  )}
                  {order.customCakeDetails?.targetDate && (
                    <p className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Event Date: {order.customCakeDetails.targetDate} ({order.customCakeDetails.targetTime})</span>
                    </p>
                  )}
                  {order.customCakeDetails?.messageOnCake && (
                    <p className="text-rose-600 dark:text-rose-400 font-medium">
                      Piped Message: "{order.customCakeDetails.messageOnCake}"
                    </p>
                  )}
                </div>
              </div>

              {order.customCakeDetails?.designDescription && (
                <div className="text-xs bg-stone-100/70 dark:bg-stone-800/70 p-2.5 rounded-xl text-stone-700 dark:text-stone-300">
                  <span className="font-bold text-stone-900 dark:text-stone-100">Design Instructions: </span>
                  {order.customCakeDetails.designDescription}
                </div>
              )}

              <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                Our pastry chef will review your reference image and contact you on WhatsApp/Phone for proof confirmation.
              </p>
            </div>
          )}

          {/* Items Summary */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
              Items Ordered
            </h4>
            <div className="divide-y divide-stone-200 dark:divide-stone-700 text-xs">
              {order.items.map((it, i) => (
                <div key={i} className="py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-stone-500 dark:text-stone-400">{it.quantity}x</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{it.name}</span>
                  </div>
                  <span className="font-mono text-stone-700 dark:text-stone-300">
                    ₹{(it.price * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between font-bold text-xs">
              <span>Total Paid</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 text-sm">
                ₹{order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivery or Table Detail */}
          <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
            <p>
              <strong>Recipient:</strong> {order.customerName} ({order.customerPhone})
            </p>
            {order.deliveryAddress && (
              <p>
                <strong>Delivery Address:</strong> {order.deliveryAddress}
              </p>
            )}
            {order.tableNumber && (
              <p>
                <strong>Table:</strong> {order.tableNumber}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
            <Phone className="w-3.5 h-3.5 text-amber-600" />
            <span>Need help? Call OTT at +91 98289 19626</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 dark:bg-stone-700 text-white rounded-xl font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
