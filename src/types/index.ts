export type OrderStatus = 'on-hold' | 'in-production' | 'shipped' | 'delivered' | 'canceled' | 'cancelled' | 'refunded';

export type StoreTheme = 'modern' | 'classic' | 'minimal';

export interface Product {
  id: string;
  userId: string;
  name: string;
  description?: string;
  baseProduct: string;
  price: number;
  compareAtPrice?: number;
  mockupUrl?: string;
  mockupUrls?: string[];
  designs: {
    front?: string;
    back?: string;
  };
  designBoundaries?: {
    front?: { x: number; y: number; width: number; height: number };
    back?: { x: number; y: number; width: number; height: number };
  };
  variants: {
    colors: string[];
    sizes: string[];
  };
  categoryId?: string;
  subcategoryId?: string;
  subcategoryIds?: string[];
  // Reference to catalog product (populated from backend) for collection filtering
  catalogProduct?: {
    _id?: string;
    name?: string;
    description?: string;
    categoryId?: string;
    subcategoryIds?: string[];
    productTypeCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  variant: {
    color: string;
    size: string;
  };
}

export interface Cart {
  items: CartItem[];
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  mockupUrl?: string;
  mockupUrls?: string[];
  quantity: number;
  price: number;
  variant: {
    color: string;
    size: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  storeId?: string;
  customerId?: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
  notes?: string;
}

import { StoreBuilder } from '@/types/builder';

export interface Store {
  id: string;
  _id?: string;
  userId: string;
  storeName: string;
  subdomain: string;
  theme: StoreTheme;
  description?: string;
  logo?: string;
  productIds: string[];
  productsCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: {
    primaryColor?: string;
    accentColor?: string;
  };
  useBuilder?: boolean;
  builder?: StoreBuilder;
  builderLastPublishedAt?: string;
  ownerName?: string;
  ownerEmail?: string;
  owner?: {
    name: string;
    email: string;
  };
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  pendingOrders: number;
  completedOrders: number;
}
