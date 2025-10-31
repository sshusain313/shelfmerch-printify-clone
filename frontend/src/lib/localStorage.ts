import { Product, Order, Store, Cart, CartItem } from '@/types';

// Helper function to get user-specific key
const getUserKey = (userId: string, type: string): string => {
  return `${type}_${userId}`;
};

// Dispatch custom event for real-time sync
const dispatchDataUpdate = (type: string, data?: any) => {
  window.dispatchEvent(
    new CustomEvent('shelfmerch-data-update', {
      detail: { type, data, timestamp: Date.now() },
    })
  );
};

// Products
export const getProducts = (userId: string): Product[] => {
  const key = getUserKey(userId, 'products');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (userId: string, product: Product): void => {
  const products = getProducts(userId);
  const existingIndex = products.findIndex((p) => p.id === product.id);
  
  if (existingIndex >= 0) {
    products[existingIndex] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.push(product);
  }
  
  const key = getUserKey(userId, 'products');
  localStorage.setItem(key, JSON.stringify(products));
  dispatchDataUpdate('product', product);
};

export const deleteProduct = (userId: string, productId: string): void => {
  const products = getProducts(userId).filter((p) => p.id !== productId);
  const key = getUserKey(userId, 'products');
  localStorage.setItem(key, JSON.stringify(products));
  dispatchDataUpdate('product');
};

// Orders
export const getOrders = (userId: string): Order[] => {
  const key = getUserKey(userId, 'orders');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = (userId: string, order: Order): void => {
  const orders = getOrders(userId);
  const existingIndex = orders.findIndex((o) => o.id === order.id);
  
  if (existingIndex >= 0) {
    orders[existingIndex] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    orders.push(order);
  }
  
  const key = getUserKey(userId, 'orders');
  localStorage.setItem(key, JSON.stringify(orders));
  dispatchDataUpdate('order', order);
};

export const updateOrderStatus = (
  userId: string,
  orderId: string,
  status: Order['status'],
  trackingNumber?: string
): void => {
  const orders = getOrders(userId);
  const orderIndex = orders.findIndex((o) => o.id === orderId);
  
  if (orderIndex >= 0) {
    orders[orderIndex] = {
      ...orders[orderIndex],
      status,
      trackingNumber: trackingNumber || orders[orderIndex].trackingNumber,
      updatedAt: new Date().toISOString(),
    };
    
    const key = getUserKey(userId, 'orders');
    localStorage.setItem(key, JSON.stringify(orders));
    dispatchDataUpdate('order', orders[orderIndex]);
  }
};

// Store
export const getStore = (userId: string): Store | null => {
  const key = getUserKey(userId, 'store');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const getStoreBySubdomain = (subdomain: string): Store | null => {
  // Search through all stores (this is a limitation of localStorage approach)
  // In production, this would be a database query
  const allKeys = Object.keys(localStorage).filter((key) => key.startsWith('store_'));
  
  for (const key of allKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      const store: Store = JSON.parse(data);
      if (store.subdomain === subdomain) {
        return store;
      }
    }
  }
  
  return null;
};

export const saveStore = (userId: string, store: Store): void => {
  const key = getUserKey(userId, 'store');
  const updatedStore = { ...store, updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(updatedStore));
  dispatchDataUpdate('store', updatedStore);
};

// Cart
export const getCart = (userId: string): Cart => {
  const key = getUserKey(userId, 'cart');
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : { items: [], updatedAt: new Date().toISOString() };
};

export const addToCart = (userId: string, item: CartItem): void => {
  const cart = getCart(userId);
  const existingIndex = cart.items.findIndex(
    (i) =>
      i.productId === item.productId &&
      i.variant.color === item.variant.color &&
      i.variant.size === item.variant.size
  );
  
  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  
  cart.updatedAt = new Date().toISOString();
  const key = getUserKey(userId, 'cart');
  localStorage.setItem(key, JSON.stringify(cart));
  dispatchDataUpdate('cart', cart);
};

export const updateCartItemQuantity = (
  userId: string,
  productId: string,
  variant: { color: string; size: string },
  quantity: number
): void => {
  const cart = getCart(userId);
  const itemIndex = cart.items.findIndex(
    (i) =>
      i.productId === productId &&
      i.variant.color === variant.color &&
      i.variant.size === variant.size
  );
  
  if (itemIndex >= 0) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    cart.updatedAt = new Date().toISOString();
    const key = getUserKey(userId, 'cart');
    localStorage.setItem(key, JSON.stringify(cart));
    dispatchDataUpdate('cart', cart);
  }
};

export const removeFromCart = (
  userId: string,
  productId: string,
  variant: { color: string; size: string }
): void => {
  const cart = getCart(userId);
  cart.items = cart.items.filter(
    (i) =>
      !(i.productId === productId && i.variant.color === variant.color && i.variant.size === variant.size)
  );
  
  cart.updatedAt = new Date().toISOString();
  const key = getUserKey(userId, 'cart');
  localStorage.setItem(key, JSON.stringify(cart));
  dispatchDataUpdate('cart', cart);
};

export const clearCart = (userId: string): void => {
  const key = getUserKey(userId, 'cart');
  const emptyCart: Cart = { items: [], updatedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(emptyCart));
  dispatchDataUpdate('cart', emptyCart);
};

// Dashboard Stats
export const getDashboardStats = (userId: string): any => {
  const products = getProducts(userId);
  const orders = getOrders(userId);
  
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProfit = orders.reduce((sum, order) => {
    // Assuming 40% profit margin on each order
    return sum + order.total * 0.4;
  }, 0);
  
  const pendingOrders = orders.filter(
    (o) => o.status === 'on-hold' || o.status === 'in-production'
  ).length;
  
  const completedOrders = orders.filter(
    (o) => o.status === 'delivered'
  ).length;
  
  return {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: totalRevenue.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    pendingOrders,
    completedOrders,
  };
};
