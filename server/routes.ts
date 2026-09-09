import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { store } from './store.js';
import { SupabaseService } from './supabaseService.js';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  CreateReservationSchema,
  UpdateReservationStatusSchema,
  MenuItemSchema,
  PromoBannerSchema,
  AdminLoginSchema,
} from './schemas.js';
import {
  orderLimiter,
  reservationLimiter,
  adminAuthLimiter,
} from './middleware/rateLimiter.js';
import type { Order, Reservation, MenuItem, PromoBanner } from '../src/types.js';

export const apiRouter = Router();

// Simple admin token authentication middleware
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'admin123';
const VALID_TOKEN = 'aura_cafe_admin_sec_token_' + ADMIN_SECRET;

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== VALID_TOKEN) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid admin credentials' });
  }

  next();
}

// ==========================================
// PUBLIC CAFE & PROMOTIONAL APIS
// ==========================================

// Get cafe information & announcements
apiRouter.get('/cafe-info', (req: Request, res: Response) => {
  res.json({ success: true, data: store.cafeInfo });
});

// Get categories
apiRouter.get('/categories', (req: Request, res: Response) => {
  res.json({ success: true, data: store.categories });
});

// Get promotional banners (Flipkart style carousel)
apiRouter.get('/banners', (req: Request, res: Response) => {
  const activeBanners = store.promoBanners.filter((b) => b.active);
  res.json({ success: true, data: activeBanners });
});

// Get menu items with optional filtering
apiRouter.get('/menu', (req: Request, res: Response) => {
  const { category, isVeg, search } = req.query;
  let items = [...store.menuItems];

  if (category && category !== 'all') {
    items = items.filter((item) => item.category === category);
  }

  if (isVeg === 'true') {
    items = items.filter((item) => item.isVeg);
  }

  if (typeof search === 'string' && search.trim().length > 0) {
    const q = search.toLowerCase().trim();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: items });
});

// ==========================================
// ONLINE FOOD ORDERING (Anti-bombing rate limited)
// ==========================================

apiRouter.post('/orders', orderLimiter, (req: Request, res: Response) => {
  const validation = CreateOrderSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid order input data',
      details: validation.error.flatten(),
    });
  }

  const data = validation.data;

  // Calculate prices securely on the server to prevent client-side price tampering
  let subtotal = 0;
  const sanitizedItems = data.items.map((cartItem) => {
    const original = store.menuItems.find((m) => m.id === cartItem.menuItemId);
    const verifiedPrice = original ? original.price : cartItem.price;
    subtotal += verifiedPrice * cartItem.quantity;

    return {
      menuItemId: cartItem.menuItemId,
      name: original ? original.name : cartItem.name,
      price: verifiedPrice,
      quantity: cartItem.quantity,
      isVeg: original ? original.isVeg : cartItem.isVeg,
      image: original ? original.image : cartItem.image,
    };
  });

  // Calculate promotional discounts
  let discount = 0;
  if (data.promoCode) {
    const code = data.promoCode.toUpperCase().trim();
    if (code === 'OTTTHALI') {
      discount = subtotal >= 400 ? 100 : 50;
    } else if (code === 'BAKERY25') {
      discount = Math.min(150, Math.round(subtotal * 0.25 * 100) / 100);
    } else if (code === 'CAMPUS30' || code === 'COMBO30' || code === 'AURA30') {
      discount = Math.min(150, Math.round(subtotal * 0.3 * 100) / 100);
    } else if (code === 'WELCOME50' || code === 'AURA10') {
      discount = subtotal >= 200 ? 50 : 25;
    } else if (code === 'BREW25') {
      discount = Math.round(subtotal * 0.25 * 100) / 100;
    }
  }

  const deliveryFee = data.orderType === 'delivery' ? (subtotal >= 499 ? 0 : 40) : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100; // 5% Restaurant GST
  const total = Math.round((taxableAmount + deliveryFee + tax) * 100) / 100;

  const newOrder: Order = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || '',
    orderType: data.orderType,
    deliveryAddress: data.deliveryAddress,
    tableNumber: data.tableNumber,
    items: sanitizedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    deliveryFee,
    tax,
    total,
    promoCode: data.promoCode,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'paid', // Simulated immediate processing
    status: 'pending',
    statusNotes: 'Order received by the kitchen',
    createdAt: new Date().toISOString(),
    estimatedTimeMinutes: data.orderType === 'delivery' ? 35 : 15,
  };

  store.orders.unshift(newOrder);

  // Sync to Supabase database if configured
  SupabaseService.saveOrder(newOrder).catch((err) => {
    console.warn('Background Supabase order sync error:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: newOrder,
  });
});

// Track an order by ID
apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, data: order });
});

// ==========================================
// TABLE RESERVATIONS (Anti-bombing rate limited)
// ==========================================

apiRouter.post('/reservations', reservationLimiter, (req: Request, res: Response) => {
  const validation = CreateReservationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid reservation input data',
      details: validation.error.flatten(),
    });
  }

  const data = validation.data;

  const newReservation: Reservation = {
    id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    date: data.date,
    time: data.time,
    guestCount: data.guestCount,
    seatingArea: data.seatingArea,
    specialRequests: data.specialRequests,
    status: 'confirmed', // Auto-confirm reservation with real reservation ID
    createdAt: new Date().toISOString(),
  };

  store.reservations.unshift(newReservation);

  // Sync reservation to Supabase database if configured
  SupabaseService.saveReservation(newReservation).catch((err) => {
    console.warn('Background Supabase reservation sync error:', err);
  });

  res.status(201).json({
    success: true,
    message: 'Table reservation successfully confirmed!',
    data: newReservation,
  });
});

// Track reservation by ID
apiRouter.get('/reservations/:id', (req: Request, res: Response) => {
  const reservation = store.reservations.find((r) => r.id === req.params.id);
  if (!reservation) {
    return res.status(404).json({ success: false, error: 'Reservation not found' });
  }
  res.json({ success: true, data: reservation });
});

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

apiRouter.post('/admin/login', adminAuthLimiter, (req: Request, res: Response) => {
  const validation = AdminLoginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Password required' });
  }

  if (validation.data.password !== ADMIN_SECRET) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin passcode. Default demo passcode is "admin123".',
    });
  }

  res.json({
    success: true,
    token: VALID_TOKEN,
    message: 'Authenticated successfully as Cafe Manager',
  });
});

// ==========================================
// ADMIN PROTECTED MANAGEMENT ENDPOINTS
// ==========================================

// Get all orders (admin)
apiRouter.get('/admin/orders', requireAdmin, async (req: Request, res: Response) => {
  // Pull from Supabase if connected
  try {
    const sbOrders = await SupabaseService.fetchOrders();
    if (sbOrders && sbOrders.length > 0) {
      // Merge unique orders
      const existingIds = new Set(sbOrders.map((o) => o.id));
      const localOnly = store.orders.filter((o) => !existingIds.has(o.id));
      store.orders = [...sbOrders, ...localOnly];
    }
  } catch {
    // In-memory fallback
  }
  res.json({ success: true, data: store.orders });
});

// Update order status (admin)
apiRouter.patch('/admin/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const validation = UpdateOrderStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid status update', details: validation.error });
  }

  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.status = validation.data.status;
  if (validation.data.statusNotes !== undefined) {
    order.statusNotes = validation.data.statusNotes;
  }
  if (validation.data.acceptedBy !== undefined) {
    order.acceptedBy = validation.data.acceptedBy;
  }
  if (validation.data.acceptedAt !== undefined) {
    order.acceptedAt = validation.data.acceptedAt;
  } else if ((validation.data.status === 'accepted' || validation.data.status === 'preparing') && !order.acceptedAt) {
    order.acceptedAt = new Date().toISOString();
  }
  if (validation.data.estimatedTimeMinutes !== undefined) {
    order.estimatedTimeMinutes = validation.data.estimatedTimeMinutes;
  }

  // Update in Supabase
  SupabaseService.updateOrderStatus(order.id, order.status, {
    notes: order.statusNotes,
    acceptedBy: order.acceptedBy,
    acceptedAt: order.acceptedAt,
    estimatedTimeMinutes: order.estimatedTimeMinutes,
  }).catch((err) => {
    console.warn('Background Supabase order status update error:', err);
  });

  res.json({ success: true, message: 'Order status updated', data: order });
});

// Cancel any order (admin)
apiRouter.post('/admin/orders/:id/cancel', requireAdmin, async (req: Request, res: Response) => {
  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const reason = req.body.reason || 'Cancelled by restaurant management / customer request';
  order.status = 'cancelled';
  order.statusNotes = reason;

  await SupabaseService.updateOrderStatus(order.id, 'cancelled', { notes: reason }).catch((err) => {
    console.warn('Supabase: failed to update cancelled status:', err);
  });

  res.json({ success: true, message: `Order #${order.id} has been cancelled`, data: order });
});

// Delete / Remove order history record permanently (admin)
apiRouter.delete('/admin/orders/:id', requireAdmin, async (req: Request, res: Response) => {
  const index = store.orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Order not found in records' });
  }

  const [deletedOrder] = store.orders.splice(index, 1);

  await SupabaseService.deleteOrder(req.params.id).catch((err) => {
    console.warn(`Supabase: failed to delete order ${req.params.id}:`, err);
  });

  res.json({
    success: true,
    message: `Order #${req.params.id} permanently removed from history and database`,
    data: deletedOrder,
  });
});

// Generate and record invoice / bill in Supabase (admin)
apiRouter.post('/admin/orders/:id/invoice', requireAdmin, async (req: Request, res: Response) => {
  const order = store.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const invoiceNumber = `INV-${order.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const invoiceData = {
    id: `inv-${order.id}`,
    orderId: order.id,
    invoiceNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    discount: order.discount,
    deliveryFee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
    paymentMethod: order.paymentMethod,
    items: order.items,
    createdAt: new Date().toISOString(),
  };

  await SupabaseService.saveInvoice(invoiceData).catch((err) => {
    console.warn('Supabase: failed to save invoice record:', err);
  });

  res.json({
    success: true,
    message: 'Official invoice generated and saved to Supabase',
    data: {
      ...invoiceData,
      cafe: store.cafeInfo,
    },
  });
});

// Get all reservations (admin)
apiRouter.get('/admin/reservations', requireAdmin, async (req: Request, res: Response) => {
  try {
    const sbReservations = await SupabaseService.fetchReservations();
    if (sbReservations && sbReservations.length > 0) {
      const existingIds = new Set(sbReservations.map((r) => r.id));
      const localOnly = store.reservations.filter((r) => !existingIds.has(r.id));
      store.reservations = [...sbReservations, ...localOnly];
    }
  } catch {
    // In-memory fallback
  }
  res.json({ success: true, data: store.reservations });
});

// Update reservation status (admin)
apiRouter.patch('/admin/reservations/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const validation = UpdateReservationStatusSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid status', details: validation.error });
  }

  const resv = store.reservations.find((r) => r.id === req.params.id);
  if (!resv) {
    return res.status(404).json({ success: false, error: 'Reservation not found' });
  }

  resv.status = validation.data.status;

  // Update in Supabase
  SupabaseService.updateReservationStatus(resv.id, resv.status).catch((err) => {
    console.warn('Background Supabase reservation update error:', err);
  });

  res.json({ success: true, message: 'Reservation status updated', data: resv });
});

// Add new menu item (admin)
apiRouter.post('/admin/menu', requireAdmin, async (req: Request, res: Response) => {
  const validation = MenuItemSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid menu item data', details: validation.error });
  }

  const newItem: MenuItem = {
    ...validation.data,
    id: `item-${Date.now()}`,
    isVeg: validation.data.isVeg ?? true,
    isAvailable: validation.data.isAvailable ?? true,
    rating: validation.data.rating ?? 4.5,
    reviewsCount: validation.data.reviewsCount ?? 1,
  };

  store.menuItems.unshift(newItem);
  await SupabaseService.saveMenuItem(newItem).catch((err) => {
    console.warn('Supabase: failed to save menu item:', err);
  });

  res.status(201).json({ success: true, message: 'Menu item created and saved to database', data: newItem });
});

// Edit menu item (admin)
apiRouter.put('/admin/menu/:id', requireAdmin, async (req: Request, res: Response) => {
  const validation = MenuItemSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid menu item data', details: validation.error });
  }

  const index = store.menuItems.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Menu item not found' });
  }

  store.menuItems[index] = {
    ...store.menuItems[index],
    ...validation.data,
  };

  await SupabaseService.saveMenuItem(store.menuItems[index]).catch((err) => {
    console.warn('Supabase: failed to update menu item:', err);
  });

  res.json({ success: true, message: 'Menu item updated in database', data: store.menuItems[index] });
});

// Delete menu item (admin)
apiRouter.delete('/admin/menu/:id', requireAdmin, async (req: Request, res: Response) => {
  const index = store.menuItems.findIndex((m) => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Menu item not found' });
  }

  const deleted = store.menuItems.splice(index, 1);
  await SupabaseService.deleteMenuItem(req.params.id).catch((err) => {
    console.warn('Supabase: failed to delete menu item:', err);
  });

  res.json({ success: true, message: 'Menu item deleted from database', data: deleted[0] });
});

// Manage Promotional Banners (admin)
apiRouter.get('/admin/banners', requireAdmin, (req: Request, res: Response) => {
  res.json({ success: true, data: store.promoBanners });
});

apiRouter.post('/admin/banners', requireAdmin, async (req: Request, res: Response) => {
  const validation = PromoBannerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid banner data', details: validation.error });
  }

  const newBanner: PromoBanner = {
    ...validation.data,
    id: `promo-${Date.now()}`,
    active: validation.data.active ?? true,
    badgeBgColor: validation.data.badgeBgColor || 'bg-amber-600',
  };

  store.promoBanners.unshift(newBanner);
  await SupabaseService.saveBanner(newBanner).catch((err) => {
    console.warn('Supabase: failed to save banner:', err);
  });

  res.status(201).json({ success: true, message: 'Banner added and saved to database', data: newBanner });
});

apiRouter.put('/admin/banners/:id', requireAdmin, async (req: Request, res: Response) => {
  const validation = PromoBannerSchema.partial().safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ success: false, error: 'Invalid banner data', details: validation.error });
  }

  const index = store.promoBanners.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Banner not found' });
  }

  store.promoBanners[index] = {
    ...store.promoBanners[index],
    ...validation.data,
  };

  await SupabaseService.saveBanner(store.promoBanners[index]).catch((err) => {
    console.warn('Supabase: failed to update banner:', err);
  });

  res.json({ success: true, message: 'Banner updated in database', data: store.promoBanners[index] });
});

apiRouter.delete('/admin/banners/:id', requireAdmin, async (req: Request, res: Response) => {
  const index = store.promoBanners.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Banner not found' });
  }

  const deleted = store.promoBanners.splice(index, 1);
  await SupabaseService.deleteBanner(req.params.id).catch((err) => {
    console.warn('Supabase: failed to delete banner:', err);
  });

  res.json({ success: true, message: 'Banner deleted from database', data: deleted[0] });
});

// Update Cafe Info (admin)
apiRouter.put('/admin/cafe-info', requireAdmin, async (req: Request, res: Response) => {
  store.cafeInfo = {
    ...store.cafeInfo,
    ...req.body,
  };

  await SupabaseService.saveCafeInfo(store.cafeInfo).catch((err) => {
    console.warn('Supabase: failed to save cafe info:', err);
  });

  res.json({ success: true, message: 'Cafe details updated and stored in database', data: store.cafeInfo });
});

// ==========================================
// SUPABASE DATABASE MANAGEMENT ENDPOINTS
// ==========================================

// Check Supabase connection status
apiRouter.get('/admin/supabase/status', requireAdmin, async (req: Request, res: Response) => {
  const status = await SupabaseService.checkStatus();
  res.json({ success: true, data: status });
});

// Public status endpoint (safe: only returns boolean connected / configured)
apiRouter.get('/supabase/status', async (req: Request, res: Response) => {
  const status = await SupabaseService.checkStatus();
  res.json({
    success: true,
    data: {
      configured: status.configured,
      connected: status.connected,
      tablesFound: status.tablesFound,
    },
  });
});

// Get SQL DDL schema for manual or automated migration in Supabase SQL editor
apiRouter.get('/admin/supabase/schema', requireAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      sql: SupabaseService.getSchemaSql(),
    },
  });
});

// Bulk sync existing in-memory data to Supabase (orders, reservations, menu, banners, cafe-info)
apiRouter.post('/admin/supabase/sync-all', requireAdmin, async (req: Request, res: Response) => {
  const activeTables = await SupabaseService.getActiveTables(true);
  if (activeTables.size === 0) {
    return res.status(400).json({
      success: false,
      error: 'No tables detected in Supabase schema cache yet. Please copy the SQL schema from below and run it in your Supabase SQL Editor first.',
      needsSchemaSetup: true,
    });
  }

  let ordersCount = 0;
  let resvCount = 0;
  let menuCount = 0;
  let bannersCount = 0;

  for (const order of store.orders) {
    const ok = await SupabaseService.saveOrder(order);
    if (ok) ordersCount++;
  }

  for (const resv of store.reservations) {
    const ok = await SupabaseService.saveReservation(resv);
    if (ok) resvCount++;
  }

  for (const m of store.menuItems) {
    const ok = await SupabaseService.saveMenuItem(m);
    if (ok) menuCount++;
  }

  for (const b of store.promoBanners) {
    const ok = await SupabaseService.saveBanner(b);
    if (ok) bannersCount++;
  }

  await SupabaseService.saveCafeInfo(store.cafeInfo);

  res.json({
    success: true,
    message: `Synchronized ${ordersCount} orders, ${resvCount} reservations, ${menuCount} menu items, and ${bannersCount} banners with Supabase.`,
    data: {
      syncedOrders: ordersCount,
      syncedReservations: resvCount,
      syncedMenu: menuCount,
      syncedBanners: bannersCount,
      totalOrders: store.orders.length,
      totalReservations: store.reservations.length,
      totalMenuItems: store.menuItems.length,
      totalBanners: store.promoBanners.length,
    },
  });
});

// Auto-hydrate store from Supabase on module load / server boot
SupabaseService.hydrateStoreFromSupabase(store).catch((err) => {
  console.warn('Startup Supabase hydration error:', err);
});
