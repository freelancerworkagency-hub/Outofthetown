import { z } from 'zod';

/**
 * ============================================================================
 * DATABASE SCHEMAS & ZOD VALIDATION MODELS
 * ============================================================================
 * These schemas model Mongoose / PostgreSQL (Prisma) database schemas and provide
 * strict, secure runtime sanitization and validation for all incoming payloads.
 */

// ==========================================
// 1. User & Admin Auth Schema
// ==========================================
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(60),
  email: z.string().email(),
  passwordHash: z.string().min(6),
  role: z.enum(['admin', 'staff', 'customer']).default('customer'),
  phone: z.string().min(7).max(15).optional(),
  createdAt: z.string().datetime().optional(),
});

export const AdminLoginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

// ==========================================
// 2. Menu Item Schema
// ==========================================
export const MenuItemSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  price: z.number().positive('Price must be greater than 0'),
  originalPrice: z.number().positive().optional(),
  isVeg: z.boolean().default(true),
  isVegan: z.boolean().optional().default(false),
  isBestseller: z.boolean().optional().default(false),
  isAvailable: z.boolean().default(true),
  rating: z.number().min(0).max(5).default(4.5),
  reviewsCount: z.number().int().min(0).default(0),
  image: z.string().url('Must be a valid image URL'),
  tags: z.array(z.string()).optional().default([]),
  preparationTimeMinutes: z.number().int().min(1).max(120).optional().default(15),
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;

// ==========================================
// 3. Online Food Order Schema
// ==========================================
export const OrderItemSchema = z.object({
  menuItemId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(50),
  isVeg: z.boolean(),
  image: z.string(),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required').max(60),
  customerPhone: z.string().trim().regex(/^[0-9+\s-]{8,15}$/, 'Invalid phone number format'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  orderType: z.enum(['delivery', 'pickup', 'dine-in']),
  deliveryAddress: z.string().max(250).optional(),
  tableNumber: z.string().max(20).optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least 1 item'),
  promoCode: z.string().max(30).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'counter']).default('upi'),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled']),
  statusNotes: z.string().max(200).optional(),
  acceptedBy: z.string().max(80).optional(),
  acceptedAt: z.string().optional(),
  estimatedTimeMinutes: z.number().int().min(1).max(180).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// ==========================================
// 4. Table Reservation Schema
// ==========================================
export const CreateReservationSchema = z.object({
  customerName: z.string().trim().min(2, 'Customer name is required').max(60),
  customerPhone: z.string().trim().regex(/^[0-9+\s-]{8,15}$/, 'Invalid phone number format'),
  customerEmail: z.string().email('Valid email is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().min(3, 'Time slot is required'),
  guestCount: z.number().int().min(1, 'At least 1 guest').max(20, 'Max 20 guests per online booking'),
  seatingArea: z.enum(['indoor_lounge', 'garden_patio', 'window_nook', 'chef_counter']).default('indoor_lounge'),
  specialRequests: z.string().max(300).optional(),
});

export const UpdateReservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

// ==========================================
// 5. Flipkart-Style Promo Banner Schema
// ==========================================
export const PromoBannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2).max(100),
  subtitle: z.string().min(2).max(150),
  highlightBadge: z.string().max(40),
  discountText: z.string().max(50),
  code: z.string().max(25),
  imageUrl: z.string().url(),
  badgeBgColor: z.string().default('bg-amber-600'),
  targetCategory: z.string().optional(),
  active: z.boolean().default(true),
});

export type PromoBannerInput = z.infer<typeof PromoBannerSchema>;
