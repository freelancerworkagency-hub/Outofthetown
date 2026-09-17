import React, { useState, useEffect } from 'react';
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
  Navigation,
  Utensils,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { Order, OrderStatus } from '../types';
import { DeliveryTrackingVisualizer } from './DeliveryTrackingVisualizer';

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
  const isDelivery = order.orderType === 'delivery' || Boolean(order.deliveryAddress);
  const [activeTab, setActiveTab] = useState<'tracking' | 'kitchen'>(isDelivery ? 'tracking' : 'kitchen');

  // Auto-polling for live updates (order status, rider GPS position)
  useEffect(() => {
    if (order.status === 'delivered' || order.status === 'cancelled') return;
    const interval = setInterval(() => {
      api
        .getOrder(order.id)
        .then((fresh) => {
          if (fresh) setOrder(fresh);
        })
        .catch(() => {});
    }, 7000);
    return () => clearInterval(interval);
  }, [order.id, order.status]);

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
      if (updated) setOrder(updated);
    } catch {
      // Keep existing state
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/90 dark:bg-stone-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-black text-amber-600 dark:text-amber-400">
                {isDelivery ? 'Live Delivery & Food Tracker' : 'Live Kitchen Tracker'}
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                #{order.id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-1">
              {order.status === 'delivered' ? 'Order Completed' : 'Order In Progress'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              title="Refresh Live Status"
              className={`p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ${
                isRefreshing ? 'animate-spin text-amber-600' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Segmented Tab (If delivery order) */}
        {isDelivery && (
          <div className="px-6 pt-3 pb-1 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2 bg-stone-50/50 dark:bg-stone-850/50">
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live Delivery &amp; Rider GPS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kitchen')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'kitchen'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Food &amp; Kitchen Status</span>
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: LIVE DELIVERY GPS & RIDER TRACKING */}
          {isDelivery && activeTab === 'tracking' ? (
            <DeliveryTrackingVisualizer
              order={order}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          ) : (
            /* TAB 2: KITCHEN STEPS & FOOD BREAKDOWN */
            <>
              {/* Estimated Time Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold">
                      Estimated Preparation / Arrival
                    </p>
                    <p className="text-lg font-bold text-stone-900 dark:text-stone-100 font-mono">
                      {order.estimatedTimeMinutes || 25} - {(order.estimatedTimeMinutes || 25) + 10} minutes
                    </p>
                  </div>
                </div>
                <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-amber-600 text-white">
                  {order.orderType}
                </span>
              </div>

              {/* Delivery Partner Highlight if assigned */}
              {order.deliveryPartner && (
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-950 dark:text-purple-300">
                        Rider Assigned: {order.deliveryPartner.name}
                      </p>
                      <p className="text-[11px] text-stone-500 font-mono">
                        {order.deliveryPartner.vehicleNumber} ({order.deliveryPartner.vehicleType})
                      </p>
                    </div>
                  </div>
                  {isDelivery && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('tracking')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Track on Map</span>
                    </button>
                  )}
                </div>
              )}

              {/* Stepper Progress */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Kitchen Milestones
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
                  <span className="text-stone-800 dark:text-stone-200">Total Bill</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 text-sm">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Delivery or Table Info */}
              <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
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
            </>
          )}

          {/* Restaurant Call Support Button */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <span>Need immediate help with your order?</span>
            <a
              href="tel:+919828919626"
              className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Out of the Town (+91 98289 19626)</span>
            </a>
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
