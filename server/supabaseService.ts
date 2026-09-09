import { getSupabaseClient, getSupabaseConfig, SUPABASE_SQL_SCHEMA } from './supabase.js';
import type { Order, Reservation, MenuItem, PromoBanner, CafeInfo } from '../src/types.js';

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

export class SupabaseService {
  public static async saveOrder(order: Order): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const row = orderToRow(order);
      const { error } = await supabase.from('orders').upsert(row, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase: could not upsert order:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase: saveOrder exception:', err);
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

    try {
      const updatePayload: Record<string, any> = { status };
      if (typeof options === 'string') {
        updatePayload.status_notes = options;
      } else if (options) {
        if (options.notes !== undefined) updatePayload.status_notes = options.notes;
        if (options.acceptedBy !== undefined) updatePayload.accepted_by = options.acceptedBy;
        if (options.acceptedAt !== undefined) updatePayload.accepted_at = options.acceptedAt;
        if (options.estimatedTimeMinutes !== undefined) updatePayload.estimated_time_minutes = options.estimatedTimeMinutes;
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) {
        console.warn(`Supabase: updateOrderStatus error for ${orderId}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase: updateOrderStatus exception:', err);
      return false;
    }
  }

  public static async fetchOrders(): Promise<Order[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase: fetchOrders returned error:', error.message);
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map(rowToOrder);
      }
      return [];
    } catch (err) {
      console.warn('Supabase: fetchOrders exception:', err);
      return null;
    }
  }

  public static async saveReservation(reservation: Reservation): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const row = reservationToRow(reservation);
      const { error } = await supabase.from('reservations').upsert(row, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase: could not upsert reservation:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase: saveReservation exception:', err);
      return false;
    }
  }

  public static async updateReservationStatus(id: string, status: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
      if (error) {
        console.warn(`Supabase: updateReservationStatus error for ${id}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase: updateReservationStatus exception:', err);
      return false;
    }
  }

  public static async fetchReservations(): Promise<Reservation[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase: fetchReservations returned error:', error.message);
        return null;
      }

      if (data && Array.isArray(data)) {
        return data.map(rowToReservation);
      }
      return [];
    } catch (err) {
      console.warn('Supabase: fetchReservations exception:', err);
      return null;
    }
  }

  public static async checkStatus(): Promise<{
    configured: boolean;
    url: string | null;
    connected: boolean;
    tablesFound: string[];
    error?: string;
  }> {
    const config = getSupabaseConfig();
    if (!config.isConfigured || !config.url) {
      return {
        configured: false,
        url: null,
        connected: false,
        tablesFound: [],
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        configured: true,
        url: config.url,
        connected: false,
        tablesFound: [],
        error: 'Supabase client could not be instantiated',
      };
    }

    const tablesFound: string[] = [];
    try {
      const { data, error } = await supabase.from('orders').select('id').limit(1);
      if (!error) {
        tablesFound.push('orders');
      }

      const { data: resData, error: resError } = await supabase.from('reservations').select('id').limit(1);
      if (!resError) {
        tablesFound.push('reservations');
      }

      return {
        configured: true,
        url: config.url,
        connected: tablesFound.length > 0 || !error,
        tablesFound,
        error: error?.message,
      };
    } catch (err: any) {
      return {
        configured: true,
        url: config.url,
        connected: false,
        tablesFound: [],
        error: err.message,
      };
    }
  }

  public static getSchemaSql(): string {
    return SUPABASE_SQL_SCHEMA;
  }
}
