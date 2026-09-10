import { getSupabaseClient, getSupabaseConfig, SUPABASE_SQL_SCHEMA } from './supabase.js';
import type { Order, Reservation, MenuItem, PromoBanner, CafeInfo } from '../src/types.js';

export const ALL_EXPECTED_TABLES = [
  'orders',
  'reservations',
  'menu_items',
  'promo_banners',
  'cafe_info',
  'invoices',
  'customers',
];

// In-memory cache of active tables detected via Supabase OpenAPI
let cachedActiveTables: Set<string> | null = null;
let lastTableCheckTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const code = String(error.code || '');
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    code === 'PGRST106' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the table') ||
    msg.includes('relation') ||
    msg.includes('does not exist')
  );
}

// Converts an Order object to Supabase snake_case columns
export function orderToRow(order: Order) {
  return {
    id: order.id,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || null,
    order_type: order.orderType,
    delivery_address: order.deliveryAddress || null,
    table_number: order.tableNumber || null,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    delivery_fee: order.deliveryFee,
    tax: order.tax,
    total: order.total,
    promo_code: order.promoCode || null,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    status: order.status,
    status_notes: order.statusNotes || null,
    accepted_by: order.acceptedBy || null,
    accepted_at: order.acceptedAt || null,
    estimated_time_minutes: order.estimatedTimeMinutes ?? 20,
    created_at: order.createdAt,
  };
}

// Converts a Supabase row back to Order
export function rowToOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    orderType: row.order_type,
    deliveryAddress: row.delivery_address || undefined,
    tableNumber: row.table_number || undefined,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total),
    promoCode: row.promo_code || undefined,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    statusNotes: row.status_notes || undefined,
    acceptedBy: row.accepted_by || undefined,
    acceptedAt: row.accepted_at || undefined,
    estimatedTimeMinutes: row.estimated_time_minutes ?? undefined,
    createdAt: row.created_at,
  };
}

export function reservationToRow(r: Reservation) {
  return {
    id: r.id,
    customer_name: r.customerName,
    customer_phone: r.customerPhone,
    customer_email: r.customerEmail || null,
    date: r.date,
    time: r.time,
    guest_count: r.guestCount,
    seating_area: r.seatingArea,
    special_requests: r.specialRequests || null,
    status: r.status,
    created_at: r.createdAt,
  };
}

export function rowToReservation(row: any): Reservation {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    date: row.date,
    time: row.time,
    guestCount: Number(row.guest_count),
    seatingArea: row.seating_area,
    specialRequests: row.special_requests || undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function menuItemToRow(item: MenuItem) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    image: item.image,
    is_veg: item.isVeg,
    is_spicy: false,
    is_bestseller: item.isBestseller ?? false,
    rating: item.rating ?? 4.8,
    reviews_count: item.reviewsCount ?? 20,
    tags: item.tags || [],
    available: item.isAvailable ?? true,
  };
}

export function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category,
    image: row.image,
    isVeg: Boolean(row.is_veg),
    isBestseller: Boolean(row.is_bestseller),
    isAvailable: Boolean(row.available),
    rating: Number(row.rating || 4.8),
    reviewsCount: Number(row.reviews_count || 20),
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
  };
}

export function bannerToRow(b: PromoBanner) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    promo_code: b.code,
    discount_percentage: 0,
    image: b.imageUrl,
    badge_text: b.highlightBadge,
    active: b.active ?? true,
    link: b.targetCategory || null,
  };
}

export function rowToBanner(row: any): PromoBanner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    code: row.promo_code || 'OTTSPECIAL',
    highlightBadge: row.badge_text || 'SPECIAL',
    discountText: 'Special Deal',
    imageUrl: row.image,
    badgeBgColor: 'bg-amber-600',
    targetCategory: row.link || undefined,
    active: Boolean(row.active),
  };
}

export function cafeInfoToRow(info: CafeInfo) {
  return {
    id: 'default_cafe',
    name: info.name,
    tagline: info.tagline,
    phone: info.phone,
    email: info.email,
    address: info.address,
    opening_hours: info.openingHours,
    announcement: info.announcement || null,
  };
}

export function rowToCafeInfo(row: any): CafeInfo {
  return {
    name: row.name,
    tagline: row.tagline || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    openingHours: row.opening_hours || '',
    announcement: row.announcement || '',
  };
}

export class SupabaseService {
  /**
   * Introspects Supabase PostgREST OpenAPI schema to find active tables in the schema cache.
   * This prevents calling tables that do not exist yet and completely avoids PGRST205 errors.
   */
  public static async getActiveTables(forceRefresh = false): Promise<Set<string>> {
    const now = Date.now();
    if (!forceRefresh && cachedActiveTables && now - lastTableCheckTime < CACHE_TTL_MS) {
      return cachedActiveTables;
    }

    const { url, isConfigured } = getSupabaseConfig();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!isConfigured || !url || !key) {
      cachedActiveTables = new Set<string>();
      lastTableCheckTime = now;
      return cachedActiveTables;
    }

    try {
      const res = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const tables = new Set<string>(Object.keys(data.definitions || {}));
        cachedActiveTables = tables;
        lastTableCheckTime = now;
        return cachedActiveTables;
      }
    } catch {
      // Network failure or timeout: keep fallback
    }

    if (!cachedActiveTables) {
      cachedActiveTables = new Set<string>();
    }
    lastTableCheckTime = now;
    return cachedActiveTables;
  }

  // =====================================
  // ORDERS
  // =====================================
  public static async saveOrder(order: Order): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('orders')) return false;

    try {
      const row = orderToRow(order);
      const { error } = await supabase.from('orders').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('orders');
          return false;
        }
        console.warn('Supabase: could not upsert order:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveOrder exception:', err.message);
      }
      return false;
    }
  }

  public static async deleteOrder(orderId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('orders')) return false;

    try {
      if (activeTables.has('invoices')) {
        await supabase.from('invoices').delete().eq('order_id', orderId);
      }
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('orders');
          return false;
        }
        console.warn(`Supabase: deleteOrder error for ${orderId}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: deleteOrder exception:', err.message);
      }
      return false;
    }
  }

  public static async updateOrderStatus(
    orderId: string,
    status: string,
    options?: {
      notes?: string;
      acceptedBy?: string;
      acceptedAt?: string;
      estimatedTimeMinutes?: number;
    } | string
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('orders')) return false;

    try {
      const updatePayload: Record<string, any> = { status };
      if (typeof options === 'string') {
        updatePayload.status_notes = options;
      } else if (options) {
        if (options.notes !== undefined) updatePayload.status_notes = options.notes;
        if (options.acceptedBy !== undefined) updatePayload.accepted_by = options.acceptedBy;
        if (options.acceptedAt !== undefined) updatePayload.accepted_at = options.acceptedAt;
        if (options.estimatedTimeMinutes !== undefined)
          updatePayload.estimated_time_minutes = options.estimatedTimeMinutes;
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('orders');
          return false;
        }
        console.warn(`Supabase: updateOrderStatus error for ${orderId}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: updateOrderStatus exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchOrders(): Promise<Order[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('orders')) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('orders');
          return null;
        }
        console.warn('Supabase: fetchOrders returned error:', error.message);
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map(rowToOrder);
      }
      return [];
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: fetchOrders exception:', err.message);
      }
      return null;
    }
  }

  // =====================================
  // RESERVATIONS
  // =====================================
  public static async saveReservation(reservation: Reservation): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('reservations')) return false;

    try {
      const row = reservationToRow(reservation);
      const { error } = await supabase.from('reservations').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('reservations');
          return false;
        }
        console.warn('Supabase: could not upsert reservation:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveReservation exception:', err.message);
      }
      return false;
    }
  }

  public static async updateReservationStatus(id: string, status: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('reservations')) return false;

    try {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('reservations');
          return false;
        }
        console.warn(`Supabase: updateReservationStatus error for ${id}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: updateReservationStatus exception:', err.message);
      }
      return false;
    }
  }

  public static async deleteReservation(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('reservations')) return false;

    try {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('reservations');
          return false;
        }
        console.warn(`Supabase: deleteReservation error for ${id}:`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: deleteReservation exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchReservations(): Promise<Reservation[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('reservations')) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('reservations');
          return null;
        }
        console.warn('Supabase: fetchReservations returned error:', error.message);
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map(rowToReservation);
      }
      return [];
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: fetchReservations exception:', err.message);
      }
      return null;
    }
  }

  // =====================================
  // MENU ITEMS
  // =====================================
  public static async saveMenuItem(item: MenuItem): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('menu_items')) return false;

    try {
      const row = menuItemToRow(item);
      const { error } = await supabase.from('menu_items').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('menu_items');
          return false;
        }
        console.warn('Supabase: saveMenuItem error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveMenuItem exception:', err.message);
      }
      return false;
    }
  }

  public static async deleteMenuItem(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('menu_items')) return false;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('menu_items');
          return false;
        }
        console.warn('Supabase: deleteMenuItem error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: deleteMenuItem exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchMenuItems(): Promise<MenuItem[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('menu_items')) {
      return null;
    }

    try {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('menu_items');
          return null;
        }
        console.warn('Supabase: fetchMenuItems error:', error.message);
        return null;
      }
      if (data && Array.isArray(data)) {
        return data.map(rowToMenuItem);
      }
      return [];
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: fetchMenuItems exception:', err.message);
      }
      return null;
    }
  }

  // =====================================
  // PROMO BANNERS
  // =====================================
  public static async saveBanner(banner: PromoBanner): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('promo_banners')) return false;

    try {
      const row = bannerToRow(banner);
      const { error } = await supabase.from('promo_banners').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('promo_banners');
          return false;
        }
        console.warn('Supabase: saveBanner error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveBanner exception:', err.message);
      }
      return false;
    }
  }

  public static async deleteBanner(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('promo_banners')) return false;

    try {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('promo_banners');
          return false;
        }
        console.warn('Supabase: deleteBanner error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: deleteBanner exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchBanners(): Promise<PromoBanner[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('promo_banners')) {
      return null;
    }

    try {
      const { data, error } = await supabase.from('promo_banners').select('*');
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('promo_banners');
          return null;
        }
        console.warn('Supabase: fetchBanners error:', error.message);
        return null;
      }
      if (data && Array.isArray(data)) {
        return data.map(rowToBanner);
      }
      return [];
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: fetchBanners exception:', err.message);
      }
      return null;
    }
  }

  // =====================================
  // CAFE INFO
  // =====================================
  public static async saveCafeInfo(info: CafeInfo): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('cafe_info')) return false;

    try {
      const row = cafeInfoToRow(info);
      const { error } = await supabase.from('cafe_info').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('cafe_info');
          return false;
        }
        console.warn('Supabase: saveCafeInfo error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveCafeInfo exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchCafeInfo(): Promise<CafeInfo | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('cafe_info')) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('cafe_info')
        .select('*')
        .eq('id', 'default_cafe')
        .single();
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('cafe_info');
          return null;
        }
        console.warn('Supabase: fetchCafeInfo error:', error.message);
        return null;
      }
      if (data) {
        return rowToCafeInfo(data);
      }
      return null;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: fetchCafeInfo exception:', err.message);
      }
      return null;
    }
  }

  // =====================================
  // INVOICES
  // =====================================
  public static async saveInvoice(inv: {
    id: string;
    orderId: string;
    invoiceNumber: string;
    customerName: string;
    customerPhone: string;
    subtotal: number;
    discount: number;
    deliveryFee: number;
    tax: number;
    total: number;
    paymentMethod: string;
    items: any[];
    createdAt?: string;
  }): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('invoices')) return false;

    try {
      const row = {
        id: inv.id,
        order_id: inv.orderId,
        invoice_number: inv.invoiceNumber,
        customer_name: inv.customerName,
        customer_phone: inv.customerPhone,
        subtotal: inv.subtotal,
        discount: inv.discount,
        delivery_fee: inv.deliveryFee,
        tax: inv.tax,
        total: inv.total,
        payment_method: inv.paymentMethod,
        items: inv.items,
        created_at: inv.createdAt || new Date().toISOString(),
      };

      const { error } = await supabase.from('invoices').upsert(row, { onConflict: 'id' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('invoices');
          return false;
        }
        console.warn('Supabase: saveInvoice error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveInvoice exception:', err.message);
      }
      return false;
    }
  }

  // =====================================
  // CUSTOMERS (Email + Mobile Verified)
  // =====================================
  public static async saveCustomer(customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    createdAt?: string;
    lastLogin?: string;
  }): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('customers')) return false;

    try {
      const row = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        created_at: customer.createdAt || new Date().toISOString(),
        last_login: customer.lastLogin || new Date().toISOString(),
      };

      const { error } = await supabase.from('customers').upsert(row, { onConflict: 'phone' });
      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('customers');
          return false;
        }
        console.warn('Supabase: saveCustomer error:', error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      if (!isTableMissingError(err)) {
        console.warn('Supabase: saveCustomer exception:', err.message);
      }
      return false;
    }
  }

  public static async fetchCustomers(): Promise<any[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const activeTables = await SupabaseService.getActiveTables();
    if (!activeTables.has('customers')) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isTableMissingError(error)) {
          activeTables.delete('customers');
        }
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map((r: any) => ({
          id: r.id,
          name: r.name,
          phone: r.phone,
          email: r.email,
          createdAt: r.created_at,
          lastLogin: r.last_login,
        }));
      }
      return [];
    } catch {
      return null;
    }
  }

  // =====================================
  // SYSTEM HYDRATION & PERSISTENCE
  // =====================================
  public static async hydrateStoreFromSupabase(store: any): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.log('Supabase not configured yet. Operating with local in-memory store.');
      return false;
    }

    try {
      const activeTables = await SupabaseService.getActiveTables(true);
      if (activeTables.size === 0) {
        console.log(
          '[Supabase] Database connected. Tables not yet initialized in schema cache. Local high-performance store is active.'
        );
        return false;
      }

      console.log(
        `[Supabase] Hydrating store from Supabase (${activeTables.size} active tables detected)...`
      );

      // 1. Cafe Info
      if (activeTables.has('cafe_info')) {
        const dbCafeInfo = await SupabaseService.fetchCafeInfo();
        if (dbCafeInfo) {
          store.cafeInfo = { ...store.cafeInfo, ...dbCafeInfo };
        } else if (store.cafeInfo) {
          await SupabaseService.saveCafeInfo(store.cafeInfo);
        }
      }

      // 2. Menu Items
      if (activeTables.has('menu_items')) {
        const dbMenu = await SupabaseService.fetchMenuItems();
        if (dbMenu && dbMenu.length > 0) {
          store.menuItems = dbMenu;
          console.log(`[Supabase] Loaded ${dbMenu.length} menu items from database.`);
        } else if (store.menuItems && store.menuItems.length > 0) {
          for (const item of store.menuItems) {
            await SupabaseService.saveMenuItem(item);
          }
        }
      }

      // 3. Promo Banners
      if (activeTables.has('promo_banners')) {
        const dbBanners = await SupabaseService.fetchBanners();
        if (dbBanners && dbBanners.length > 0) {
          store.promoBanners = dbBanners;
          console.log(`[Supabase] Loaded ${dbBanners.length} promo banners from database.`);
        } else if (store.promoBanners && store.promoBanners.length > 0) {
          for (const banner of store.promoBanners) {
            await SupabaseService.saveBanner(banner);
          }
        }
      }

      // 4. Orders
      if (activeTables.has('orders')) {
        const dbOrders = await SupabaseService.fetchOrders();
        if (dbOrders && dbOrders.length > 0) {
          const sbIds = new Set(dbOrders.map((o) => o.id));
          const localRemaining = store.orders.filter((o: Order) => !sbIds.has(o.id));
          store.orders = [...dbOrders, ...localRemaining];
          console.log(`[Supabase] Loaded ${dbOrders.length} orders from database.`);
        } else if (store.orders && store.orders.length > 0) {
          for (const ord of store.orders) {
            await SupabaseService.saveOrder(ord);
          }
        }
      }

      // 5. Reservations
      if (activeTables.has('reservations')) {
        const dbReservations = await SupabaseService.fetchReservations();
        if (dbReservations && dbReservations.length > 0) {
          const sbIds = new Set(dbReservations.map((r) => r.id));
          const localRemaining = store.reservations.filter((r: Reservation) => !sbIds.has(r.id));
          store.reservations = [...dbReservations, ...localRemaining];
          console.log(`[Supabase] Loaded ${dbReservations.length} reservations from database.`);
        } else if (store.reservations && store.reservations.length > 0) {
          for (const resv of store.reservations) {
            await SupabaseService.saveReservation(resv);
          }
        }
      }

      // 6. Customers
      if (activeTables.has('customers')) {
        const dbCustomers = await SupabaseService.fetchCustomers();
        if (dbCustomers && dbCustomers.length > 0) {
          const sbPhones = new Set(dbCustomers.map((c) => c.phone));
          const localRemaining = (store.customers || []).filter((c: any) => !sbPhones.has(c.phone));
          store.customers = [...dbCustomers, ...localRemaining];
          console.log(`[Supabase] Loaded ${dbCustomers.length} customers from database.`);
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  // Check health and existing tables
  public static async checkStatus(): Promise<{
    configured: boolean;
    url: string | null;
    connected: boolean;
    tablesFound: string[];
    tablesMissing: string[];
    error?: string;
  }> {
    const config = getSupabaseConfig();
    if (!config.isConfigured || !config.url) {
      return {
        configured: false,
        url: null,
        connected: false,
        tablesFound: [],
        tablesMissing: ALL_EXPECTED_TABLES,
      };
    }

    try {
      const activeTables = await SupabaseService.getActiveTables(true);
      const tablesFound = Array.from(activeTables);
      const tablesMissing = ALL_EXPECTED_TABLES.filter((t) => !activeTables.has(t));

      return {
        configured: true,
        url: config.url,
        connected: tablesFound.length > 0,
        tablesFound,
        tablesMissing,
      };
    } catch (err: any) {
      return {
        configured: true,
        url: config.url,
        connected: false,
        tablesFound: [],
        tablesMissing: ALL_EXPECTED_TABLES,
        error: err.message,
      };
    }
  }

  public static getSchemaSql(): string {
    return SUPABASE_SQL_SCHEMA;
  }
}
