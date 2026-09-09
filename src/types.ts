export type DietaryType = 'veg' | 'non-veg' | 'vegan';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  isVeg: boolean;
  isVegan?: boolean;
  isBestseller?: boolean;
  isAvailable: boolean;
  rating: number;
  reviewsCount: number;
  image: string;
  tags?: string[];
  preparationTimeMinutes?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  image?: string;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export type OrderType = 'delivery' | 'pickup' | 'dine-in';
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'counter';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType: OrderType;
  deliveryAddress?: string;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  promoCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid';
  status: OrderStatus;
  statusNotes?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  createdAt: string;
  estimatedTimeMinutes?: number;
}

export type SeatingArea = 'indoor_lounge' | 'garden_patio' | 'window_nook' | 'chef_counter';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  guestCount: number;
  seatingArea: SeatingArea;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  highlightBadge: string;
  discountText: string;
  code: string;
  imageUrl: string;
  badgeBgColor: string;
  targetCategory?: string;
  active: boolean;
  comboItemIds?: string[];
  comboDescription?: string;
  terms?: string[];
}

export interface CafeInfo {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  announcement?: string;
}
