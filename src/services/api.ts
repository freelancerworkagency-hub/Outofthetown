import type { MenuItem, Category, Order, Reservation, PromoBanner, CafeInfo, Customer } from '../types.js';

const BASE_URL = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  retryAfterSeconds?: number;
}

function getCustomerAuthHeaders(token?: string, extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  let resolvedToken = token;

  if (typeof window !== 'undefined') {
    try {
      if (!resolvedToken) {
        resolvedToken = localStorage.getItem('ott_customer_token') || undefined;
      }
      const savedSession = localStorage.getItem('ott_customer_session');
      if (savedSession) {
        const cust = JSON.parse(savedSession);
        if (cust?.phone) headers['x-customer-phone'] = cust.phone;
        if (cust?.email) headers['x-customer-email'] = cust.email;
        if (cust?.id) headers['x-customer-id'] = cust.id;
        if (cust?.name) headers['x-customer-name'] = cust.name;
      }
    } catch {
      // ignore
    }
  }

  if (resolvedToken) {
    headers['Authorization'] = `Bearer ${resolvedToken}`;
    headers['x-customer-token'] = resolvedToken;
  }

  return headers;
}

export const api = {
  // Customer Auth (Email + Mobile OTP)
  async sendCustomerOtp(payload: { email: string; phone: string; name?: string }): Promise<{
    message: string;
    phone: string;
    otpPreview?: string;
  }> {
    const res = await fetch(`${BASE_URL}/auth/customer/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to send verification code');
    return { message: json.message, phone: json.phone, otpPreview: json.otpPreview };
  },

  async verifyCustomerOtp(payload: {
    email: string;
    phone: string;
    otp: string;
    name?: string;
  }): Promise<{ customer: Customer; token: string }> {
    const res = await fetch(`${BASE_URL}/auth/customer/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success || !json.customer || !json.token) {
      throw new Error(json.error || 'Failed to verify code');
    }
    return { customer: json.customer, token: json.token };
  },

  async getCustomerProfile(token?: string): Promise<Customer> {
    const res = await fetch(`${BASE_URL}/user/profile`, {
      headers: getCustomerAuthHeaders(token),
    });
    const json: ApiResponse<Customer> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch customer profile');
    return json.data;
  },

  async getMyOrders(token?: string): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/user/orders`, {
      headers: getCustomerAuthHeaders(token),
    });
    const json: ApiResponse<Order[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch your orders');
    return json.data;
  },

  async getMyReservations(token?: string): Promise<Reservation[]> {
    const res = await fetch(`${BASE_URL}/user/reservations`, {
      headers: getCustomerAuthHeaders(token),
    });
    const json: ApiResponse<Reservation[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch your reservations');
    return json.data;
  },

  // Public
  async getCafeInfo(): Promise<CafeInfo> {
    const res = await fetch(`${BASE_URL}/cafe-info`);
    const json: ApiResponse<CafeInfo> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch cafe info');
    return json.data;
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/categories`);
    const json: ApiResponse<Category[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch categories');
    return json.data;
  },

  async getPromoBanners(): Promise<PromoBanner[]> {
    const res = await fetch(`${BASE_URL}/banners`);
    const json: ApiResponse<PromoBanner[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch banners');
    return json.data;
  },

  async getMenuItems(params?: { category?: string; isVeg?: boolean; search?: string }): Promise<MenuItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.isVeg !== undefined) query.append('isVeg', String(params.isVeg));
    if (params?.search) query.append('search', params.search);

    const url = `${BASE_URL}/menu${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    const json: ApiResponse<MenuItem[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch menu items');
    return json.data;
  },

  async createOrder(payload: any, token?: string): Promise<Order> {
    const headers = getCustomerAuthHeaders(token, { 'Content-Type': 'application/json' });
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json: ApiResponse<Order> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to place order');
    return json.data;
  },

  async reverseGeocodeLocation(lat: number, lng: number): Promise<{
    formattedAddress: string;
    street?: string;
    sublocality?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    source: 'google' | 'osm' | 'coords';
    location?: { lat: number; lng: number };
  }> {
    const res = await fetch(
      `${BASE_URL}/maps/reverse-geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
    );
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Failed to resolve location address');
    }
    return json.data;
  },

  async getOrder(id: string, token?: string): Promise<Order> {
    const headers = getCustomerAuthHeaders(token);
    const res = await fetch(`${BASE_URL}/orders/${id}`, { headers });
    const json: ApiResponse<Order> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Order not found');
    return json.data;
  },

  async createReservation(payload: any, token?: string): Promise<Reservation> {
    const headers = getCustomerAuthHeaders(token, { 'Content-Type': 'application/json' });
    const res = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json: ApiResponse<Reservation> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to make reservation');
    return json.data;
  },

  // Admin Auth
  async adminLogin(password: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success || !json.token) throw new Error(json.error || 'Admin login failed');
    return json.token;
  },

  // Admin Actions
  async getAdminOrders(token: string): Promise<Order[]> {
    const res = await fetch(`${BASE_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<Order[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to load admin orders');
    return json.data;
  },

  async updateOrderStatus(
    token: string,
    orderId: string,
    status: string,
    options?: {
      notes?: string;
      acceptedBy?: string;
      acceptedAt?: string;
      estimatedTimeMinutes?: number;
    } | string
  ): Promise<Order> {
    const payload: Record<string, any> = { status };
    if (typeof options === 'string') {
      payload.statusNotes = options;
    } else if (options) {
      if (options.notes !== undefined) payload.statusNotes = options.notes;
      if (options.acceptedBy !== undefined) payload.acceptedBy = options.acceptedBy;
      if (options.acceptedAt !== undefined) payload.acceptedAt = options.acceptedAt;
      if (options.estimatedTimeMinutes !== undefined) payload.estimatedTimeMinutes = options.estimatedTimeMinutes;
    }

    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json: ApiResponse<Order> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to update order');
    return json.data;
  },

  async getAdminReservations(token: string): Promise<Reservation[]> {
    const res = await fetch(`${BASE_URL}/admin/reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<Reservation[]> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to load reservations');
    return json.data;
  },

  async updateReservationStatus(token: string, reservationId: string, status: string): Promise<Reservation> {
    const res = await fetch(`${BASE_URL}/admin/reservations/${reservationId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const json: ApiResponse<Reservation> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to update reservation');
    return json.data;
  },

  async addMenuItem(token: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${BASE_URL}/admin/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
    const json: ApiResponse<MenuItem> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to add menu item');
    return json.data;
  },

  async updateMenuItem(token: string, id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${BASE_URL}/admin/menu/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    const json: ApiResponse<MenuItem> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to update menu item');
    return json.data;
  },

  async deleteMenuItem(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/menu/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete menu item');
  },

  // Category Management (Admin)
  async addCategory(
    token: string,
    cat: { name: string; slug?: string; description?: string; icon?: string; image?: string }
  ): Promise<Category> {
    const res = await fetch(`${BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cat),
    });
    const json: ApiResponse<Category> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to add category');
    return json.data;
  },

  async updateCategory(
    token: string,
    idOrSlug: string,
    cat: { name?: string; slug?: string; description?: string; icon?: string; image?: string }
  ): Promise<Category> {
    const res = await fetch(`${BASE_URL}/admin/categories/${idOrSlug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cat),
    });
    const json: ApiResponse<Category> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to update category');
    return json.data;
  },

  async deleteCategory(token: string, idOrSlug: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/categories/${idOrSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete category');
  },

  async addPromoBanner(token: string, banner: Partial<PromoBanner>): Promise<PromoBanner> {
    const res = await fetch(`${BASE_URL}/admin/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(banner),
    });
    const json: ApiResponse<PromoBanner> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to add banner');
    return json.data;
  },

  async deletePromoBanner(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete banner');
  },

  // Order Management: Cancel & Delete & Invoice
  async cancelOrder(token: string, orderId: string, reason?: string): Promise<Order> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason: reason || 'Cancelled by staff / customer request' }),
    });
    const json: ApiResponse<Order> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to cancel order');
    return json.data;
  },

  async deleteOrder(token: string, orderId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete order history record');
  },

  async purgeFakeOrders(token: string): Promise<{ purgedCount: number }> {
    const res = await fetch(`${BASE_URL}/admin/orders/purge-fake`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<{ purgedCount: number }> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to purge fake orders');
    return json.data;
  },

  async purgeAllOrders(token: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/orders-purge-all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<void> = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to clear all orders');
  },

  async registerInvoice(token: string, orderId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<any> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to register invoice');
    return json.data;
  },

  // Supabase Database Management
  async getSupabaseStatus(token: string): Promise<{
    configured: boolean;
    url: string | null;
    connected: boolean;
    tablesFound: string[];
    error?: string;
  }> {
    const res = await fetch(`${BASE_URL}/admin/supabase/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<any> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to check Supabase status');
    return json.data;
  },

  async getSupabaseSchema(token: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/admin/supabase/schema`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<{ sql: string }> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to fetch schema');
    return json.data.sql;
  },

  async syncSupabaseAll(token: string): Promise<{
    syncedOrders: number;
    syncedReservations: number;
    totalOrders: number;
    totalReservations: number;
  }> {
    const res = await fetch(`${BASE_URL}/admin/supabase/sync-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: ApiResponse<any> = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to sync with Supabase');
    return json.data;
  },
};
