import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Printer,
  Search,
  Check,
  X,
  UserCheck,
  UtensilsCrossed,
  Eye,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Bike,
  Sparkles,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../../types.js';

interface OrdersManagementProps {
  orders: Order[];
  token: string;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    options?: {
      notes?: string;
      acceptedBy?: string;
      acceptedAt?: string;
      estimatedTimeMinutes?: number;
    } | string
  ) => Promise<void>;
  onRefresh: () => void;
  isLoading?: boolean;
}

const PRESET_STAFF_MEMBERS = [
  'Chef Vikram Singh',
  'Captain Sitaram',
  'Sunita (Bakery Lead)',
  'Manager Satyam',
  'Kitchen In-charge Rahul',
];

const PRESET_PREP_TIMES = [15, 20, 25, 35, 45];

export const OrdersManagement: React.FC<OrdersManagementProps> = ({
  orders,
  onUpdateOrderStatus,
  onRefresh,
  isLoading = false,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Staff Acceptance Modal State
  const [acceptingOrder, setAcceptingOrder] = useState<Order | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>(PRESET_STAFF_MEMBERS[0]);
  const [customStaffName, setCustomStaffName] = useState<string>('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(20);
  const [kitchenNotes, setKitchenNotes] = useState<string>('');
  const [isSubmittingAcceptance, setIsSubmittingAcceptance] = useState<boolean>(false);

  // Order Details / KOT Modal State
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
  const [isKotMode, setIsKotMode] = useState<boolean>(false);

  // Status Change Confirmation / Reason Modal
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [customStatusNotes, setCustomStatusNotes] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);

  // Calculated Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const acceptedCount = orders.filter((o) => o.status === 'accepted').length;
    const preparingCount = orders.filter((o) => o.status === 'preparing').length;
    const readyCount = orders.filter((o) => o.status === 'ready').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      totalCount,
      pendingCount,
      inKitchenCount: acceptedCount + preparingCount,
      readyCount,
      deliveredCount,
      totalRevenue,
    };
  }, [orders]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'in-kitchen') {
          if (order.status !== 'accepted' && order.status !== 'preparing') return false;
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      // Order type filter
      if (typeFilter !== 'all' && order.orderType !== typeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesCustomer = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.toLowerCase().includes(q);
        const matchesTable = order.tableNumber?.toLowerCase().includes(q);
        const matchesAddress = order.deliveryAddress?.toLowerCase().includes(q);
        const matchesItem = order.items.some((it) => it.name.toLowerCase().includes(q));

        if (!matchesId && !matchesCustomer && !matchesPhone && !matchesTable && !matchesAddress && !matchesItem) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, typeFilter, searchQuery]);

  // Open the Accept Order modal
  const handleOpenAcceptModal = (order: Order) => {
    setAcceptingOrder(order);
    setSelectedStaff(PRESET_STAFF_MEMBERS[0]);
    setCustomStaffName('');
    setPrepTimeMinutes(order.estimatedTimeMinutes || (order.orderType === 'delivery' ? 30 : 20));
    setKitchenNotes(`Order accepted by staff. Kitchen preparation initiated.`);
  };

  // Submit staff acceptance
  const handleConfirmAcceptance = async () => {
    if (!acceptingOrder) return;
    const staffName = customStaffName.trim() || selectedStaff;
    if (!staffName) return;

    try {
      setIsSubmittingAcceptance(true);
      await onUpdateOrderStatus(acceptingOrder.id, 'accepted', {
        acceptedBy: staffName,
        acceptedAt: new Date().toISOString(),
        estimatedTimeMinutes: prepTimeMinutes,
        notes: kitchenNotes.trim() || `Accepted by ${staffName}`,
      });
      setAcceptingOrder(null);
    } finally {
      setIsSubmittingAcceptance(false);
    }
  };

  // Quick status transition
  const handleQuickStatusChange = async (orderId: string, status: OrderStatus, defaultNotes?: string) => {
    await onUpdateOrderStatus(orderId, status, { notes: defaultNotes });
  };

  // Print KOT
  const handlePrintKot = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Orders Management & Staff Acceptance
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              Live Storage ({orders.length})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            All customer orders are stored here. Staff can accept incoming requests, assign kitchen chefs, and track orders from preparation to fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-refresh-orders"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <div className="flex items-center rounded-xl bg-stone-200 dark:bg-stone-800 p-1 border border-stone-300 dark:border-stone-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Orders */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stored</span>
            <ShoppingBag className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
            {metrics.totalCount}
          </p>
          <span className="text-[10px] text-stone-500">All-time stored</span>
        </div>

        {/* Needs Acceptance (Pending) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-3.5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            metrics.pendingCount > 0
              ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-500/15 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting Staff</span>
            <AlertCircle className={`w-4 h-4 ${metrics.pendingCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {metrics.pendingCount}
            </p>
            {metrics.pendingCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                Action Req
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 font-medium">
            Pending acceptance
          </span>
        </div>

        {/* In Kitchen (Accepted & Preparing) */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'in-kitchen' ? 'all' : 'in-kitchen')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Kitchen</span>
            <ChefHat className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {metrics.inKitchenCount}
          </p>
          <span className="text-[10px] text-stone-500">Accepted & Cooking</span>
        </div>

        {/* Ready for Pickup / Server */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs cursor-pointer hover:border-purple-400 transition-all"
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Ready / Plated</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {metrics.readyCount}
          </p>
          <span className="text-[10px] text-stone-500">Awaiting dispatch</span>
        </div>

        {/* Completed / Delivered */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
          className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Completed</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {metrics.deliveredCount}
          </p>
          <span className="text-[10px] text-stone-500">Fulfilled orders</span>
        </div>

        {/* Total Sales Volume */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-500/30 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Revenue</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
            ₹{metrics.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80 font-medium">
            Active orders total
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            id="input-orders-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer name, phone, table number..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-stone-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </span>
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending', count: metrics.pendingCount },
              { id: 'accepted', label: 'Accepted' },
              { id: 'preparing', label: 'Preparing' },
              { id: 'ready', label: 'Ready' },
              { id: 'delivered', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  statusFilter === st.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {st.label}
                {st.count !== undefined && st.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px]">
                    {st.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-stone-200 dark:bg-stone-700 mx-1 hidden sm:block shrink-0" />

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="delivery">Delivery</option>
            <option value="dine-in">Dine-In</option>
            <option value="pickup">Takeaway / Pickup</option>
          </select>
        </div>
      </div>

      {/* Main Orders Display: Cards View or Table View */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">No Orders Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No orders match your current search and filter criteria. Try clearing filters.'
              : 'No orders have been recorded in the system yet. Once customers order, they will appear here.'}
          </p>
          {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const isPending = ord.status === 'pending';
            const isAccepted = ord.status === 'accepted';
            const isPreparing = ord.status === 'preparing';
            const isReady = ord.status === 'ready';
            const isDelivered = ord.status === 'delivered';
            const isCancelled = ord.status === 'cancelled';

            return (
              <div
                key={ord.id}
                id={`admin-order-card-${ord.id}`}
                className={`rounded-2xl bg-white dark:bg-stone-900 border transition-all p-5 shadow-xs flex flex-col justify-between space-y-4 ${
                  isPending
                    ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-500/15'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div>
                  {/* Top Status & Timestamp Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100">
                          {ord.id}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {ord.orderType}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[11px] uppercase font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400/40 animate-pulse'
                          : isAccepted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isPreparing
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : isReady
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isPending && <AlertCircle className="w-3 h-3" />}
                      {isAccepted && <Check className="w-3 h-3" />}
                      {isPreparing && <ChefHat className="w-3 h-3" />}
                      {isReady && <Bike className="w-3 h-3" />}
                      {isDelivered && <CheckCircle2 className="w-3 h-3" />}
                      <span>{isPending ? 'Needs Acceptance' : ord.status}</span>
                    </span>
                  </div>

                  {/* Staff Acceptance Highlight Banner */}
                  {ord.acceptedBy ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300">
                            Accepted by {ord.acceptedBy}
                          </p>
                          {ord.acceptedAt && (
                            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-mono">
                              at {new Date(ord.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      {ord.estimatedTimeMinutes && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono">
                          {ord.estimatedTimeMinutes} min prep
                        </span>
                      )}
                    </div>
                  ) : isPending ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                          Awaiting staff kitchen acceptance
                        </p>
                      </div>
                      <button
                        id={`btn-accept-order-${ord.id}`}
                        onClick={() => handleOpenAcceptModal(ord)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <ChefHat className="w-3 h-3" />
                        <span>Accept Now</span>
                      </button>
                    </div>
                  ) : null}

                  {/* Customer Information */}
                  <div className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {ord.customerName}
                      </p>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{ord.customerPhone}</span>
                      </a>
                    </div>

                    {ord.orderType === 'dine-in' && ord.tableNumber && (
                      <p className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-stone-400" />
                        <span>Table: <strong className="text-amber-600 dark:text-amber-400">{ord.tableNumber}</strong></span>
                      </p>
                    )}

                    {ord.orderType === 'delivery' && ord.deliveryAddress && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{ord.deliveryAddress}</span>
                      </p>
                    )}
                  </div>

                  {/* Ordered Items Preview */}
                  <div className="bg-stone-50 dark:bg-stone-850 p-3 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                              {it.quantity}x
                            </span>
                            <span className="font-medium text-stone-800 dark:text-stone-200 truncate text-[11px]">
                              {it.name}
                            </span>
                          </div>
                          <span className="font-mono text-stone-600 dark:text-stone-400 text-[11px] shrink-0">
                            ₹{(it.price * it.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total & Payment Method */}
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between font-bold text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-stone-500">
                        <CreditCard className="w-3 h-3" />
                        <span className="uppercase">{ord.paymentMethod}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 capitalize">{ord.paymentStatus}</span>
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                        ₹{ord.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Note if available */}
                  {ord.statusNotes && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 italic mt-2">
                      Note: "{ord.statusNotes}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Controls for Staff */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Accept button for pending */}
                    {isPending && (
                      <button
                        onClick={() => handleOpenAcceptModal(ord)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept Order (Staff)</span>
                      </button>
                    )}

                    {/* Advance to Preparing */}
                    {(isPending || isAccepted) && (
                      <button
                        onClick={() =>
                          handleQuickStatusChange(ord.id, 'preparing', 'Chef started cooking in the kitchen')
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold border border-blue-200 dark:border-blue-900 cursor-pointer flex items-center gap-1"
                      >
                        <ChefHat className="w-3 h-3" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {/* Advance to Ready */}
                    {(isAccepted || isPreparing) && (
                      <button
                        onClick={() =>
                          handleQuickStatusChange(ord.id, 'ready', 'Packed & ready for customer/delivery')
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-[11px] font-semibold border border-purple-200 dark:border-purple-900 cursor-pointer flex items-center gap-1"
                      >
                        <Bike className="w-3 h-3" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {/* Advance to Delivered / Completed */}
                    {(isPreparing || isReady) && (
                      <button
                        onClick={() =>
                          handleQuickStatusChange(ord.id, 'delivered', 'Order served / delivered successfully')
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-900 cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </button>
                    )}

                    {/* Cancel button */}
                    {!isDelivered && !isCancelled && (
                      <button
                        onClick={() => {
                          if (confirm(`Cancel order ${ord.id}?`)) {
                            handleQuickStatusChange(ord.id, 'cancelled', 'Cancelled by cafe staff');
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-[11px] font-semibold border border-rose-200 dark:border-rose-900 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    {/* View Details / KOT */}
                    <button
                      onClick={() => {
                        setInspectingOrder(ord);
                        setIsKotMode(false);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-semibold border border-stone-200 dark:border-stone-700 cursor-pointer flex items-center gap-1 ml-auto"
                      title="Inspect full order breakdown & Kitchen Ticket"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details / KOT</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-850 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-4">Order ID & Time</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Type & Location</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total & Payment</th>
                  <th className="p-4">Staff In-Charge</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="p-4 font-mono">
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">
                        {ord.id}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-stone-900 dark:text-stone-100">{ord.customerName}</p>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        {ord.customerPhone}
                      </a>
                    </td>
                    <td className="p-4">
                      <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 inline-block mb-0.5">
                        {ord.orderType}
                      </span>
                      <p className="text-[11px] text-stone-500 truncate max-w-xs">
                        {ord.orderType === 'dine-in'
                          ? `Table: ${ord.tableNumber || 'N/A'}`
                          : ord.deliveryAddress || 'Takeaway'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-stone-500 truncate max-w-xs">
                        {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                      </p>
                    </td>
                    <td className="p-4 font-mono">
                      <p className="font-bold text-stone-900 dark:text-stone-100">
                        ₹{ord.total.toFixed(2)}
                      </p>
                      <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
                        {ord.paymentMethod} • {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      {ord.acceptedBy ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                          <UserCheck className="w-3.5 h-3.5 shrink-0" />
                          <div>
                            <span className="font-bold text-[11px] block">{ord.acceptedBy}</span>
                            {ord.estimatedTimeMinutes && (
                              <span className="text-[10px] text-stone-400 font-mono">
                                {ord.estimatedTimeMinutes} min
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAcceptModal(ord)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          ord.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : ord.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : ord.status === 'ready'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : ord.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setInspectingOrder(ord);
                          setIsKotMode(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: STAFF ACCEPTANCE DIALOG */}
      {/* ============================================================== */}
      {acceptingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                    Accept Kitchen Order
                  </h3>
                  <p className="text-xs font-mono text-stone-500">
                    {acceptingOrder.id} • {acceptingOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAcceptingOrder(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary of items */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-stone-700 dark:text-stone-300">
                <span>Items to Prepare:</span>
                <span className="font-mono text-amber-600">Total ₹{acceptingOrder.total.toFixed(2)}</span>
              </div>
              <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                {acceptingOrder.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
              </p>
            </div>

            {/* Staff Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                Assigning Staff / Chef Member
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_STAFF_MEMBERS.map((staff) => (
                  <button
                    key={staff}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(staff);
                      setCustomStaffName('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold cursor-pointer border transition-all ${
                      selectedStaff === staff && !customStaffName
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {staff}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customStaffName}
                onChange={(e) => setCustomStaffName(e.target.value)}
                placeholder="Or type custom staff / captain name..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Estimated Preparation Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Estimated Prep Time (Minutes)
                </label>
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {prepTimeMinutes} mins
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {PRESET_PREP_TIMES.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPrepTimeMinutes(mins)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer border transition-all ${
                      prepTimeMinutes === mins
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                Status Note / Kitchen Instructions
              </label>
              <input
                type="text"
                value={kitchenNotes}
                onChange={(e) => setKitchenNotes(e.target.value)}
                placeholder="e.g. Order accepted, tandoori items placed on fire"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcceptingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-accept-order"
                type="button"
                disabled={isSubmittingAcceptance}
                onClick={handleConfirmAcceptance}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                {isSubmittingAcceptance ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Accept</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DETAILED ORDER INSPECTION & KITCHEN ORDER TICKET (KOT) */}
      {/* ============================================================== */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                      Order Details & KOT
                    </h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                      {inspectingOrder.id}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-mono">
                    Placed on {new Date(inspectingOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsKotMode(!isKotMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors flex items-center gap-1.5 ${
                    isKotMode
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isKotMode ? 'Exit KOT' : 'Kitchen KOT'}</span>
                </button>
                <button
                  onClick={() => setInspectingOrder(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {isKotMode ? (
                /* Kitchen Order Ticket (KOT) Thermal Receipt Preview */
                <div className="p-6 rounded-2xl bg-stone-50 text-stone-900 font-mono border-2 border-dashed border-stone-300 space-y-4 shadow-inner">
                  <div className="text-center pb-3 border-b border-dashed border-stone-400">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-600">
                      KITCHEN ORDER TICKET (KOT)
                    </p>
                    <h4 className="text-lg font-bold">OUT OF THE TOWN - RESTRO & BAKERY</h4>
                    <p className="text-[11px] text-stone-500">NH-48 Kukas, Jaipur</p>
                    <p className="text-xs font-bold mt-1 text-stone-700">
                      ORDER #{inspectingOrder.id} • TYPE: {inspectingOrder.orderType.toUpperCase()}
                      {inspectingOrder.tableNumber && ` (TABLE: ${inspectingOrder.tableNumber})`}
                    </p>
                  </div>

                  <div className="flex justify-between text-xs pb-2 border-b border-stone-300">
                    <span>Customer: {inspectingOrder.customerName}</span>
                    <span>{new Date(inspectingOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {inspectingOrder.acceptedBy && (
                    <div className="text-xs font-bold text-stone-800 pb-2 border-b border-stone-300">
                      ACCEPTED BY: {inspectingOrder.acceptedBy.toUpperCase()} (PREP: {inspectingOrder.estimatedTimeMinutes}M)
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 py-2">
                    <div className="flex justify-between font-bold text-xs pb-1 border-b border-stone-300">
                      <span>QTY & ITEM NAME</span>
                      <span>PREP</span>
                    </div>
                    {inspectingOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 border-b border-stone-200">
                        <span className="font-bold">
                          [{it.quantity}X] {it.name.toUpperCase()} {it.isVeg ? '(VEG)' : '(NON-VEG)'}
                        </span>
                        <span className="text-stone-500">HOT</span>
                      </div>
                    ))}
                  </div>

                  {inspectingOrder.deliveryAddress && (
                    <div className="text-[11px] pt-2 border-t border-dashed border-stone-400">
                      <span className="font-bold">DELIVERY TO:</span> {inspectingOrder.deliveryAddress}
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <button
                      onClick={handlePrintKot}
                      className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print KOT</span>
                    </button>
                    <span className="text-[11px] text-stone-500">Total Items: {inspectingOrder.items.reduce((acc, it) => acc + it.quantity, 0)}</span>
                  </div>
                </div>
              ) : (
                /* Full Order Details */
                <div className="space-y-5">
                  {/* Status and Staff Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold text-amber-700 dark:text-amber-300">
                        Current Status
                      </span>
                      <p className="text-base font-bold text-stone-900 dark:text-stone-100 capitalize mt-0.5">
                        {inspectingOrder.status}
                      </p>
                      {inspectingOrder.acceptedBy && (
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
                          Staff assigned: {inspectingOrder.acceptedBy}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase font-bold text-stone-500">Fulfillment</span>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100 capitalize">
                        {inspectingOrder.orderType}
                      </p>
                      {inspectingOrder.tableNumber && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                          Table: {inspectingOrder.tableNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer Information Box */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                    <h4 className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-stone-400">Full Name</span>
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {inspectingOrder.customerName}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-400">Phone Number</span>
                        <p>
                          <a
                            href={`tel:${inspectingOrder.customerPhone}`}
                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{inspectingOrder.customerPhone}</span>
                          </a>
                        </p>
                      </div>
                      {inspectingOrder.customerEmail && (
                        <div>
                          <span className="text-stone-400">Email Address</span>
                          <p className="font-medium text-stone-700 dark:text-stone-300">
                            {inspectingOrder.customerEmail}
                          </p>
                        </div>
                      )}
                      {inspectingOrder.deliveryAddress && (
                        <div className="sm:col-span-2">
                          <span className="text-stone-400">Highway Delivery Address</span>
                          <p className="font-medium text-stone-700 dark:text-stone-300 flex items-start gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <span>{inspectingOrder.deliveryAddress}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itemized Order List */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3">
                    <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                      Ordered Dishes & Bakery Items
                    </h4>
                    <div className="divide-y divide-stone-200 dark:divide-stone-700 text-xs">
                      {inspectingOrder.items.map((it, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={it.image}
                              alt={it.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100">{it.name}</p>
                              <p className="text-[11px] text-stone-400 font-mono">
                                ₹{it.price.toFixed(2)} × {it.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200 text-sm">
                            ₹{(it.price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Breakdown */}
                    <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-500">
                        <span>Subtotal</span>
                        <span className="font-mono">₹{inspectingOrder.subtotal.toFixed(2)}</span>
                      </div>
                      {inspectingOrder.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span>Promo Discount ({inspectingOrder.promoCode || 'OFFER'})</span>
                          <span className="font-mono">-₹{inspectingOrder.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-stone-500">
                        <span>Delivery Fee</span>
                        <span className="font-mono">
                          {inspectingOrder.deliveryFee === 0 ? 'FREE' : `₹${inspectingOrder.deliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>GST (5%)</span>
                        <span className="font-mono">₹{inspectingOrder.tax.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-center font-bold text-sm">
                        <span>Grand Total Paid</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 text-base">
                          ₹{inspectingOrder.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-850/50">
              <span className="text-xs text-stone-500">
                Payment: <strong className="uppercase text-stone-800 dark:text-stone-200">{inspectingOrder.paymentMethod}</strong> ({inspectingOrder.paymentStatus})
              </span>
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
