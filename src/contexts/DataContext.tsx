import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Product, Order, Store, Cart, DashboardStats } from '@/types';
import * as storage from '@/lib/localStorage';

interface DataContextType {
  products: Product[];
  orders: Order[];
  store: Store | null;
  stores: Store[]; // expose all stores (currently single-store-backed)
  cart: Cart;
  stats: DashboardStats;
  refreshData: () => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], trackingNumber?: string) => void;
  saveStore: (store: Store) => void;
  addToCart: (item: Cart['items'][0]) => void;
  updateCartQuantity: (productId: string, variant: any, quantity: number) => void;
  removeFromCart: (productId: string, variant: any) => void;
  clearCart: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [cart, setCart] = useState<Cart>({ items: [], updatedAt: new Date().toISOString() });
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  const refreshData = useCallback(() => {
    if (!user?.id) return;

    const loadedProducts = storage.getProducts(user.id);
    const loadedOrders = storage.getOrders(user.id);
    const loadedStore = storage.getStore(user.id);
    const loadedCart = storage.getCart(user.id);
    const loadedStats = storage.getDashboardStats(user.id);

    setProducts(loadedProducts);
    setOrders(loadedOrders);
    setStore(loadedStore);
    // For now we only persist a single store per user; expose it as a 1-element array
    // so components like Stores.tsx can safely use stores.length.
    setStores(loadedStore ? [loadedStore] : []);
    setCart(loadedCart);
    setStats(loadedStats);
  }, [user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = (event: any) => {
      refreshData();
    };

    window.addEventListener('shelfmerch-data-update', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('shelfmerch-data-update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshData]);

  const addProduct = useCallback(
    (product: Product) => {
      if (!user?.id) return;
      storage.saveProduct(user.id, product);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      if (!user?.id) return;
      storage.deleteProduct(user.id, productId);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const addOrder = useCallback(
    (order: Order) => {
      if (!user?.id) return;
      storage.saveOrder(user.id, order);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: Order['status'], trackingNumber?: string) => {
      if (!user?.id) return;
      storage.updateOrderStatus(user.id, orderId, status, trackingNumber);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const saveStoreData = useCallback(
    (storeData: Store) => {
      if (!user?.id) return;
      storage.saveStore(user.id, storeData);
      // keep both single store and stores[] in sync
      setStore(storeData);
      setStores(storeData ? [storeData] : []);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const addToCartItem = useCallback(
    (item: Cart['items'][0]) => {
      if (!user?.id) return;
      storage.addToCart(user.id, item);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const updateCartQuantity = useCallback(
    (productId: string, variant: any, quantity: number) => {
      if (!user?.id) return;
      storage.updateCartItemQuantity(user.id, productId, variant, quantity);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const removeFromCart = useCallback(
    (productId: string, variant: any) => {
      if (!user?.id) return;
      storage.removeFromCart(user.id, productId, variant);
      refreshData();
    },
    [user?.id, refreshData]
  );

  const clearCartData = useCallback(() => {
    if (!user?.id) return;
    storage.clearCart(user.id);
    refreshData();
  }, [user?.id, refreshData]);

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        store,
        stores,
        cart,
        stats,
        refreshData,
        addProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        saveStore: saveStoreData,
        addToCart: addToCartItem,
        updateCartQuantity,
        removeFromCart,
        clearCart: clearCartData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
