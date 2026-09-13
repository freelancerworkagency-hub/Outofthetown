import React, { useState, useEffect } from 'react';
import {
  Bike,
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Store,
  PackageCheck,
  AlertCircle,
  Car,
  ChevronRight,
  ExternalLink,
  RotateCw,
  Map as MapIcon,
} from 'lucide-react';
import type { Order, DeliveryTracking, DeliveryTrackingStage } from '../types';
import { STAGE_CONFIG, PRESET_DELIVERY_PARTNERS, createInitialDeliveryTracking } from '../utils/deliveryFleet';
import { DeliveryPartnerRouteMap } from './delivery/DeliveryPartnerRouteMap';

interface DeliveryTrackingVisualizerProps {
  order: Order;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DeliveryTrackingVisualizer: React.FC<DeliveryTrackingVisualizerProps> = ({
  order,
  onRefresh,
  isRefreshing = false,
}) => {
  // If order does not have tracking initialized yet, create a provisional simulated preview tracking
  const tracking: DeliveryTracking =
    order.deliveryTracking ||
    createInitialDeliveryTracking(order, order.deliveryPartner || PRESET_DELIVERY_PARTNERS[0], {
      initialStage: order.status === 'ready' ? 'picked_up' : order.status === 'delivered' ? 'delivered' : 'assigned',
      notes: order.statusNotes || 'Rider being coordinated by OTT Kitchen',
    });

  const stage = tracking.stage || (order.status === 'ready' ? 'picked_up' : order.status === 'delivered' ? 'delivered' : 'assigned');
  const stageCfg = STAGE_CONFIG[stage] || STAGE_CONFIG.assigned;
  const progressPercent = tracking.progressPercent || stageCfg.progressPercent;
  const partner = tracking.partner;

  // Local simulated seconds countdown for dynamic feel
  const [countdownMinutes, setCountdownMinutes] = useState(tracking.estimatedDeliveryMinutes || 25);
  const [viewMode, setViewMode] = useState<'map' | 'strip'>('map');

  useEffect(() => {
    if (stage === 'delivered') {
      setCountdownMinutes(0);
    } else {
      setCountdownMinutes(Math.max(3, tracking.estimatedDeliveryMinutes));
    }
  }, [stage, tracking.estimatedDeliveryMinutes]);

  return (
    <div className="space-y-4">
      {/* Live Status Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-4 sm:p-5 border border-stone-800 shadow-lg">
        {/* Decorative background road texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Live GPS Delivery Dispatch
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                NH-48 Kukas
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
              {stage === 'delivered' ? 'Order Delivered!' : stageCfg.label}
            </h3>
            <p className="text-xs text-stone-300 mt-0.5 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{tracking.currentLocationLabel || stageCfg.description}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-stone-800/80 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl border border-stone-700/60 text-right">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Estimated Arrival</span>
              {stage === 'delivered' ? (
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Delivered
                </span>
              ) : (
                <div>
                  <span className="font-mono text-lg font-black text-amber-400">
                    {countdownMinutes} mins
                  </span>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    by ~{tracking.estimatedArrivalTime || 'soon'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher: Live Map vs Highway Corridor Strip */}
        <div className="relative mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Interactive GPS Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('strip')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'strip'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Highway Strip</span>
            </button>
          </div>

          <span className="text-[11px] text-amber-400 font-mono hidden sm:inline-block">
            {stageCfg.description}
          </span>
        </div>

        {/* Dynamic Route View */}
        {viewMode === 'map' ? (
          <div className="mt-3">
            <DeliveryPartnerRouteMap order={order} partner={partner} />
          </div>
        ) : (
          /* Live Highway Visual Route Track */
          <div className="relative mt-3">
            <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold mb-2">
              <span className="flex items-center gap-1 text-amber-300">
                <Store className="w-3.5 h-3.5" /> OTT Restro (Kukas)
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <MapPin className="w-3.5 h-3.5" /> Your Doorstep
              </span>
            </div>

            {/* Road Visual Strip */}
            <div className="relative h-12 rounded-xl bg-stone-950 border border-stone-800 flex items-center px-4 overflow-hidden">
              {/* Road center dashed line */}
              <div className="absolute inset-x-0 h-0.5 top-1/2 -translate-y-1/2 border-b border-dashed border-stone-700/80 pointer-events-none" />

              {/* Road progress fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500/30 to-amber-500/10 border-r-2 border-amber-400 transition-all duration-700 pointer-events-none"
                style={{ width: `${Math.min(100, Math.max(6, progressPercent))}%` }}
              />

              {/* Waypoint 1: OTT Kitchen */}
              <div className="absolute left-3 flex flex-col items-center z-10">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    progressPercent >= 20 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  1
                </div>
              </div>

              {/* Waypoint 2: RIICO Junction */}
              <div className="absolute left-[33%] -translate-x-1/2 flex flex-col items-center z-10">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    progressPercent >= 50 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  2
                </div>
              </div>

              {/* Waypoint 3: Highway Corridor */}
              <div className="absolute left-[66%] -translate-x-1/2 flex flex-col items-center z-10">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    progressPercent >= 80 ? 'bg-amber-500 text-stone-950 shadow-xs' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  3
                </div>
              </div>

              {/* Waypoint 4: Destination */}
              <div className="absolute right-3 flex flex-col items-center z-10">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    progressPercent >= 100 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                </div>
              </div>

              {/* Animated Moving Rider Marker */}
              <div
                className="absolute z-20 -translate-x-1/2 transition-all duration-700 flex flex-col items-center"
                style={{ left: `${Math.min(94, Math.max(6, progressPercent))}%` }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping" />
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg border-2 border-white dark:border-stone-900">
                    {partner.vehicleType === 'van' ? (
                      <Car className="w-4 h-4" />
                    ) : (
                      <Bike className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 px-1">
              <span>OTT Kitchen</span>
              <span>RIICO Junction</span>
              <span>Highway Corridor</span>
              <span>Customer Address</span>
            </div>
          </div>
        )}
      </div>

      {/* Assigned Delivery Partner Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Assigned Fleet Delivery Partner</span>
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
            Verified OTT Rider
          </span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img
              src={
                partner.photoUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
              alt={partner.name}
              referrerPolicy="no-referrer"
              className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xs"
            />
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                {partner.name}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                <span className="font-mono font-semibold uppercase">{partner.vehicleNumber}</span>
                <span>•</span>
                <span className="capitalize">{partner.vehicleType}</span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                <span className="font-bold text-amber-600 dark:text-amber-400">⭐ {partner.rating}</span>
                <span>•</span>
                <span>{partner.totalDeliveries}+ highway runs</span>
              </div>
            </div>
          </div>

          {/* Direct Communication Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${partner.phone}`}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </a>
            <a
              href={`https://wa.me/91${partner.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hi ${partner.name}, I am tracking my Out of the Town order #${order.id}. Where are you currently?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Safety & Hygiene Assurance */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Insulated Thermal Carrier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tamper-Proof Box Seal</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Hot &amp; Fresh Highway Dispatch</span>
          </div>
        </div>
      </div>

      {/* Pickup vs Delivery Locations */}
      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                {tracking.pickupLocation.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Pickup Confirmed
              </span>
            </div>
            <p className="text-stone-500 mt-0.5 line-clamp-1">{tracking.pickupLocation.address}</p>
          </div>
        </div>

        <div className="h-4 border-l-2 border-dashed border-stone-300 dark:border-stone-700 ml-3.5" />

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 dark:text-stone-100">
                Delivery to {order.customerName}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                +91 {order.customerPhone}
              </span>
            </div>
            <p className="text-stone-600 dark:text-stone-300 font-medium mt-0.5">
              {order.deliveryAddress || 'Kukas / Highway Locality, Jaipur'}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Milestone Timeline */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
            Live Route Milestones
          </h4>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>

        <div className="relative pl-5 border-l-2 border-stone-200 dark:border-stone-700 space-y-4 text-xs">
          {[
            {
              stageKey: 'assigned',
              title: 'Delivery Partner Assigned',
              desc: `${partner.name} assigned to dispatch order from OTT Kukas`,
              time: tracking.assignedAt ? new Date(tracking.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done',
              active: stage === 'assigned',
              passed: progressPercent >= 15,
            },
            {
              stageKey: 'arrived_at_pickup',
              title: 'Rider Reached OTT Kitchen',
              desc: 'Partner verified items at the restaurant pickup counter',
              time: tracking.arrivedAtPickupAt ? new Date(tracking.arrivedAtPickupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
              active: stage === 'arrived_at_pickup',
              passed: progressPercent >= 30,
            },
            {
              stageKey: 'picked_up',
              title: 'Order Picked Up & Hot-Sealed',
              desc: 'Food safely packed with thermal insulation and handed to rider',
              time: tracking.pickedUpAt ? new Date(tracking.pickedUpAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending',
              active: stage === 'picked_up',
              passed: progressPercent >= 50,
            },
            {
              stageKey: 'on_the_way',
              title: 'On the Way (NH-48 Transit)',
              desc: 'Rider cruising towards your address via highway bypass',
              time: stage === 'on_the_way' || progressPercent >= 78 ? 'In Transit' : 'Upcoming',
              active: stage === 'on_the_way',
              passed: progressPercent >= 78,
            },
            {
              stageKey: 'near_destination',
              title: 'Arriving in Locality',
              desc: 'Rider is within 2-3 minutes of your building/gate',
              time: stage === 'near_destination' || progressPercent >= 92 ? 'Very Soon' : 'Upcoming',
              active: stage === 'near_destination',
              passed: progressPercent >= 92,
            },
            {
              stageKey: 'delivered',
              title: 'Delivered to Doorstep',
              desc: 'Package handed over. Enjoy your meal!',
              time: tracking.deliveredAt ? new Date(tracking.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Final Step',
              active: stage === 'delivered',
              passed: progressPercent >= 100,
            },
          ].map((m) => (
            <div key={m.stageKey} className="relative">
              <div
                className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  m.passed
                    ? 'bg-amber-500 text-stone-950 font-bold ring-3 ring-amber-100 dark:ring-amber-950'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                }`}
              >
                {m.passed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={`font-bold ${
                    m.active
                      ? 'text-amber-600 dark:text-amber-400'
                      : m.passed
                      ? 'text-stone-900 dark:text-stone-100'
                      : 'text-stone-400'
                  }`}
                >
                  {m.title}
                </span>
                <span className="font-mono text-[11px] text-stone-400">{m.time}</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
