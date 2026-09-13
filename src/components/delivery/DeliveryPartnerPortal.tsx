import React, { useState, useEffect } from 'react';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  User,
  Power,
  ChevronDown,
  Store,
  ExternalLink,
  Receipt,
  Cake,
  CheckSquare,
  Square,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Order, DeliveryPartner, DeliveryTrackingStage } from '../../types';
import { PRESET_DELIVERY_PARTNERS } from '../../utils/deliveryFleet';
import { DeliveryPartnerRouteMap } from './DeliveryPartnerRouteMap';

interface DeliveryPartnerPortalProps {
  onClose: () => void;
  onOpenOrderDetails?: (order: Order) => void;
}

export const DeliveryPartnerPortal: React.FC<DeliveryPartnerPortalProps> = ({
  onClose,
  onOpenOrderDetails,
}) => {
  // Current active delivery partner
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner>(() => {
    try {
      const saved = localStorage.getItem('ott_active_delivery_partner');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return PRESET_DELIVERY_PARTNERS[0];
  });

  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Save selected partner
  useEffect(() => {
    try {
      localStorage.setItem('ott_active_delivery_partner', JSON.stringify(selectedPartner));
    } catch {
      // ignore
    }
  }, [selectedPartner]);

  // Load orders for delivery partner
  const fetchOrders = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      setRefreshing(true);
      setError(null);
      const res = await api.getDeliveryPartnerOrders(selectedPartner.id);
      setOrders(res.orders || []);
      
      // If no order is selected, select the first active delivery
      const activeRuns = (res.orders || []).filter(
        (o) => o.deliveryPartner?.id === selectedPartner.id && o.status !== 'delivered' && o.status !== 'cancelled'
      );
      if (activeRuns.length > 0 && !selectedOrderId) {
        setSelectedOrderId(activeRuns[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    // Poll every 8 seconds for new order dispatches
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedPartner.id]);

  // Orders filtered by category
  const activeDeliveries = orders.filter(
    (o) => o.deliveryPartner?.id === selectedPartner.id && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const availableOrders = orders.filter(
    (o) => !o.deliveryPartner && o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const completedDeliveries = orders.filter(
    (o) => o.deliveryPartner?.id === selectedPartner.id && o.status === 'delivered'
  );

  // Active selected order
  const currentActiveOrder =
    orders.find((o) => o.id === selectedOrderId) ||
    activeDeliveries[0] ||
    null;

  // Claim unassigned order
  const handleClaimOrder = async (orderId: string) => {
    try {
      setRefreshing(true);
      const updated = await api.claimDeliveryOrder(orderId, selectedPartner);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setSelectedOrderId(orderId);
      setActiveTab('active');
    } catch (err: any) {
      alert(`Could not claim order: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Update delivery stage
  const handleUpdateStage = async (orderId: string, stage: DeliveryTrackingStage) => {
    try {
      setRefreshing(true);
      const updated = await api.updateRiderDeliveryStage(orderId, {
        stage,
        notes: `Updated to ${stage} by ${selectedPartner.name}`,
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err: any) {
      alert(`Could not update delivery status: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Check item verification in bag
  const toggleItemCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate today's earnings (e.g. ₹65 base per run + tips)
  const todaysEarnings = completedDeliveries.length * 65 + completedDeliveries.length * 15;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="relative w-full max-w-6xl rounded-3xl bg-stone-900 border border-stone-800 text-stone-100 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
        {/* TOP HEADER */}
        <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-black text-white">
                  OTT Fleet &amp; Delivery Partner Portal
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Rider Hub
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Out of the Town • Kukas NH-48 Express Delivery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rider Selector */}
            <div className="relative">
              <select
                value={selectedPartner.id}
                onChange={(e) => {
                  const p = PRESET_DELIVERY_PARTNERS.find((item) => item.id === e.target.value);
                  if (p) setSelectedPartner(p);
                }}
                className="bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-hidden focus:border-amber-500 cursor-pointer appearance-none"
              >
                {PRESET_DELIVERY_PARTNERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.vehicleType.toUpperCase()} - {p.vehicleNumber})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Shift Toggle */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOnline
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'}`} />
              <span>{isOnline ? 'On Duty (Online)' : 'Off Duty'}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchOrders(false)}
              className={`p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer ${
                refreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-stone-950/60 border-b border-stone-800 text-xs">
          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Active Deliveries</span>
              <span className="font-mono text-lg font-black text-white">{activeDeliveries.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Completed Today</span>
              <span className="font-mono text-lg font-black text-emerald-400">{completedDeliveries.length} runs</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Est. Payout Today</span>
              <span className="font-mono text-lg font-black text-purple-400">₹{todaysEarnings}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Waiting for Pickup</span>
              <span className="font-mono text-lg font-black text-blue-400">{availableOrders.length} orders</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-4 sm:px-6 pt-3 border-b border-stone-800 flex items-center gap-2 bg-stone-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'active'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Active Run &amp; Live Route Map</span>
            {activeDeliveries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black">
                {activeDeliveries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'available'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Available Kitchen Orders</span>
            {availableOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-black">
                {availableOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'completed'
                ? 'border-amber-500 text-amber-400 bg-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Today ({completedDeliveries.length})</span>
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ACTIVE RUN & ROUTE MAP */}
          {activeTab === 'active' && (
            <div className="space-y-6">
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl bg-stone-950/60 border border-stone-800">
                  <div className="w-14 h-14 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center mx-auto mb-3">
                    <Bike className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-200">No Active Delivery Runs</h3>
                  <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                    You currently don&apos;t have any active orders assigned. Switch to &ldquo;Available Kitchen Orders&rdquo; tab to claim freshly prepared delivery packages from OTT Kitchen.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    View Available Orders ({availableOrders.length})
                  </button>
                </div>
              ) : (
                <>
                  {/* Active Order Selector if rider has multiple */}
                  {activeDeliveries.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      <span className="text-xs text-stone-400 font-bold shrink-0">Active Runs:</span>
                      {activeDeliveries.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => setSelectedOrderId(ord.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            ord.id === currentActiveOrder?.id
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          }`}
                        >
                          Order #{ord.id} • {ord.customerName}
                        </button>
                      ))}
                    </div>
                  )}

                  {currentActiveOrder && (
                    <div className="space-y-6">
                      {/* 1. THE ROUTE MAP (FROM RIDER LOCATION TO CUSTOMER LOCATION) */}
                      <DeliveryPartnerRouteMap
                        order={currentActiveOrder}
                        partner={selectedPartner}
                        onUpdateLocation={(lat, lng, speed, label) => {
                          api
                            .pingRiderLocation(currentActiveOrder.id, {
                              lat,
                              lng,
                              speedKmh: speed,
                              currentLocationLabel: label,
                            })
                            .catch(() => {});
                        }}
                      />

                      {/* 2. STAGE UPDATE CONTROLLER */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                              Order Delivery Progress
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                              #{currentActiveOrder.id}
                            </span>
                          </div>
                          <span className="text-xs text-stone-400">
                            Current Stage: <strong className="text-amber-300 capitalize">{currentActiveOrder.deliveryTracking?.stage || 'assigned'}</strong>
                          </span>
                        </div>

                        {/* One-Tap Stage Action Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStage(currentActiveOrder.id, 'arrived_at_pickup')}
                            className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                              currentActiveOrder.deliveryTracking?.stage === 'arrived_at_pickup'
                                ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400'
                                : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700'
                            }`}
                          >
                            <Store className="w-4 h-4 mb-1" />
                            <span>1. Reached OTT Kitchen</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStage(currentActiveOrder.id, 'picked_up')}
                            className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                              currentActiveOrder.deliveryTracking?.stage === 'picked_up'
                                ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400'
                                : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700'
                            }`}
                          >
                            <Package className="w-4 h-4 mb-1" />
                            <span>2. Picked Up Food</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStage(currentActiveOrder.id, 'on_the_way')}
                            className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                              currentActiveOrder.deliveryTracking?.stage === 'on_the_way'
                                ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400'
                                : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700'
                            }`}
                          >
                            <Bike className="w-4 h-4 mb-1" />
                            <span>3. On The Highway</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateStage(currentActiveOrder.id, 'near_destination')}
                            className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer ${
                              currentActiveOrder.deliveryTracking?.stage === 'near_destination'
                                ? 'bg-amber-500 text-stone-950 ring-2 ring-amber-400'
                                : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700'
                            }`}
                          >
                            <MapPin className="w-4 h-4 mb-1" />
                            <span>4. At Customer Gate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Confirm order #${currentActiveOrder.id} has been safely handed over to ${currentActiveOrder.customerName}?`)) {
                                handleUpdateStage(currentActiveOrder.id, 'delivered');
                              }
                            }}
                            className="p-2.5 rounded-xl text-xs font-bold flex flex-col items-center text-center transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-102 col-span-2 sm:col-span-1"
                          >
                            <CheckCircle2 className="w-4 h-4 mb-1" />
                            <span>5. Mark Delivered</span>
                          </button>
                        </div>
                      </div>

                      {/* 3. ORDER DETAILS & PACKING CHECKLIST */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer & Address Details */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                            Customer &amp; Dropoff Details
                          </h4>
                          <div>
                            <div className="text-sm font-bold text-white">{currentActiveOrder.customerName}</div>
                            <div className="text-xs text-stone-400 flex items-start gap-1.5 mt-1">
                              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                              <span>{currentActiveOrder.deliveryAddress || 'Kukas, Jaipur'}</span>
                            </div>
                            <div className="text-xs text-stone-300 flex items-center gap-1.5 mt-1">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <a href={`tel:${currentActiveOrder.customerPhone}`} className="hover:underline font-mono">
                                {currentActiveOrder.customerPhone}
                              </a>
                            </div>
                          </div>

                          {currentActiveOrder.notes && (
                            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300">
                              <strong>Delivery Notes:</strong> {currentActiveOrder.notes}
                            </div>
                          )}

                          {/* Payment Collection Warning */}
                          <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                            <span className="text-stone-400">Payment Status:</span>
                            {currentActiveOrder.paymentMethod === 'cash' ? (
                              <span className="font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40">
                                COLLECT CASH: ₹{currentActiveOrder.total}
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40">
                                PREPAID (Do Not Collect Cash)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items Checklist for Rider Verification */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                              Package Items Checklist
                            </h4>
                            <span className="text-[11px] text-stone-400 font-mono">
                              {currentActiveOrder.items.length} items
                            </span>
                          </div>

                          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {currentActiveOrder.items.map((item, idx) => {
                              const key = `${currentActiveOrder.id}-${idx}`;
                              const isChecked = checkedItems[key] || false;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleItemCheck(key)}
                                  className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isChecked ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <Square className="w-4 h-4 text-stone-500 shrink-0" />
                                    )}
                                    <span className="font-medium">
                                      {item.quantity}x {item.name}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[11px] text-stone-400">
                                    ₹{item.price * item.quantity}
                                  </span>
                                </div>
                              );
                            })}

                            {currentActiveOrder.customCakeDetails && (
                              <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-800 text-xs text-purple-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Cake className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span>
                                    Custom Cake ({currentActiveOrder.customCakeDetails.flavor}, {currentActiveOrder.customCakeDetails.weightKg}kg)
                                  </span>
                                </div>
                                <span className="text-[10px] uppercase font-bold text-amber-400">Handle with Care</span>
                              </div>
                            )}
                          </div>

                          <p className="text-[10px] text-stone-400 italic">
                            Tap items above to verify tamper-proof sealed containers before leaving the kitchen.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: AVAILABLE ORDERS (UNASSIGNED PICKUPS) */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Orders Awaiting Rider Pickup</h3>
                  <p className="text-xs text-stone-400">
                    Fresh delivery orders placed at Out of the Town Restro &amp; Bakery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchOrders(false)}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {availableOrders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl bg-stone-950/60 border border-stone-800">
                  <Package className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-300">All Orders are Currently Dispatched</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Check back in a few minutes or wait for new incoming orders from Kukas &amp; Jaipur Highway customers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-all space-y-3 shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300">
                              #{ord.id}
                            </span>
                            <span className="text-xs font-bold text-white">{ord.customerName}</span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{ord.deliveryAddress || 'Kukas, Jaipur'}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-amber-400 block">₹{ord.total}</span>
                          <span className="text-[10px] text-stone-400 uppercase">{ord.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="text-xs text-stone-300 bg-stone-900 p-2 rounded-xl">
                        <span className="text-stone-400">Items: </span>
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        {ord.customCakeDetails && ` • Custom Cake (${ord.customCakeDetails.flavor})`}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-850">
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Status: {ord.status}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClaimOrder(ord.id)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Accept &amp; Deliver</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPLETED DELIVERIES */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Today&apos;s Delivered Orders</h3>
                  <p className="text-xs text-stone-400">
                    Runs completed by {selectedPartner.name} on {selectedPartner.vehicleNumber}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
                  Total Earned: ₹{todaysEarnings}
                </div>
              </div>

              {completedDeliveries.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl bg-stone-950/60 border border-stone-800">
                  <CheckCircle2 className="w-8 h-8 text-stone-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-300">No Completed Runs Today Yet</p>
                  <p className="text-xs text-stone-400 mt-1">
                    When you finish your active deliveries, your delivery history and earnings will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {completedDeliveries.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-stone-200">#{ord.id}</span>
                            <span className="font-bold text-white">{ord.customerName}</span>
                          </div>
                          <span className="text-stone-400 text-[11px] truncate block">
                            {ord.deliveryAddress || 'Jaipur Doorstep'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 block">+₹80 payout</span>
                          <span className="text-[10px] text-stone-400">
                            {ord.deliveryTracking?.deliveredAt
                              ? new Date(ord.deliveryTracking.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Delivered'}
                          </span>
                        </div>
                        {onOpenOrderDetails && (
                          <button
                            type="button"
                            onClick={() => onOpenOrderDetails(ord)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                            title="View Full Order Invoice"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OTT Kitchen Dispatch: <strong>SP 41 B, RIICO Kukas (NH-48)</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:+919828919626"
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Kitchen Helpline: +91 98289 19626</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition-colors cursor-pointer"
            >
              Close Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
