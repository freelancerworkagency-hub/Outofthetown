import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazy client singleton to prevent module-load crashes if keys are not yet configured
let supabaseInstance: SupabaseClient | null = null;
let hasLoggedMissingKey = false;

export function getSupabaseConfig(): {
  url: string | null;
  hasKey: boolean;
  isConfigured: boolean;
} {
  const url = process.env.SUPABASE_URL || null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;

  return {
    url,
    hasKey: Boolean(key),
    isConfigured: Boolean(url && key),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, hasKey, isConfigured } = getSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!isConfigured || !url || !key) {
    if (!hasLoggedMissingKey) {
      console.log('Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY) are not set. Operating with local high-performance store.');
      hasLoggedMissingKey = true;
    }
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`Supabase client initialized successfully with URL: ${url}`);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- OUT OF THE TOWN - RESTRO AND BAKERY
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==========================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup', 'dine-in')),
    delivery_address TEXT,
    table_number TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    promo_code TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'counter')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'paid')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled')),
    status_notes TEXT,
    accepted_by TEXT,
    accepted_at TIMESTAMPTZ,
    estimated_time_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for ordering & querying active status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Table Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guest_count INTEGER NOT NULL DEFAULT 2,
    seating_area TEXT NOT NULL,
    special_requests TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date, time);

-- 3. Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    is_veg BOOLEAN NOT NULL DEFAULT true,
    is_spicy BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 50,
    tags JSONB DEFAULT '[]'::jsonb,
    available BOOLEAN NOT NULL DEFAULT true
);

-- 4. Promotional Banners
CREATE TABLE IF NOT EXISTS public.promo_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    promo_code TEXT,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    image TEXT,
    badge_text TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    link TEXT
);

-- 5. Cafe Information
CREATE TABLE IF NOT EXISTS public.cafe_info (
    id TEXT PRIMARY KEY DEFAULT 'default_cafe',
    name TEXT NOT NULL,
    tagline TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    opening_hours TEXT,
    announcement TEXT
);

-- Row Level Security (RLS) policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_info ENABLE ROW LEVEL SECURITY;

-- Allow public read access to Menu, Banners, Cafe Info
CREATE POLICY IF NOT EXISTS "Public read menu items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read promo banners" ON public.promo_banners FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read cafe info" ON public.cafe_info FOR SELECT USING (true);

-- Allow public insert to Orders and Reservations
CREATE POLICY IF NOT EXISTS "Public create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public read own order" ON public.orders FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Public read reservations" ON public.reservations FOR SELECT USING (true);

-- Allow full access with service role
CREATE POLICY IF NOT EXISTS "Service role full access orders" ON public.orders USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access reservations" ON public.reservations USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Service role full access menu" ON public.menu_items USING (true) WITH CHECK (true);
`;
