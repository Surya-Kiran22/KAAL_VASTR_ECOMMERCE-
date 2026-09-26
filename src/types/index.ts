export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  description: string;
  selling_price: number;
  compare_at_price?: number | null;
  sizes: string[];
  colors: string[];
  image_url: string;
  images?: string[];
  stock: number;
  /** Per-variant stock keyed by "color|size" (e.g. "Black|XL"). Absent means use flat `stock`. */
  variant_stock?: Record<string, number> | null;
  is_available: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  description: string;
  whatsapp_number: string;
  mobile_number: string;
  email: string;
  address: string;
  store_timings: string;
  instagram_url?: string;
  facebook_url?: string;
  logo_url?: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor?: string;
  quantity: number;
}

export interface StaffAccount {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  created_at?: string;
}

export interface WhatsAppOrderPayload {
  customerName: string;
  customerPhone: string;
  addressNotes?: string;
  items: CartItem[];
  totalAmount: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  address_notes?: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';
  created_at: string;
}

export interface SalesAnalytics {
  todaySales: number;
  todayOrderCount: number;
  weekSales: number;
  weekOrderCount: number;
  monthSales: number;
  monthOrderCount: number;
  totalCustomers: number;
  todaysShoppingCount: number;
  averageOrderValue: number;
  topProducts: { name: string; salesCount: number; revenue: number }[];
  categoryBreakdown: { category: string; salesCount: number; revenue: number }[];
}

