import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { storeApi } from '@/lib/api';
import { Store } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface StoreContextType {
  stores: Store[];
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  selectStoreById: (storeId: string) => void;
  refreshStores: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedStoreIdRef = useRef<string | null>(null);

  // Load stores from API
  const refreshStores = useCallback(async () => {
    if (!user?.id) {
      setStores([]);
      setSelectedStore(null);
      selectedStoreIdRef.current = null;
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await storeApi.listMyStores();
      if (response.success) {
        const loadedStores = response.data || [];
        setStores(loadedStores);

        // Get current selected store ID from ref or localStorage
        const currentSelectedId = selectedStoreIdRef.current || localStorage.getItem('selectedStoreId');
        
        // Auto-select first store if none selected and stores exist
        if (!currentSelectedId && loadedStores.length > 0) {
          // Try to restore from localStorage first
          const savedStoreId = localStorage.getItem('selectedStoreId');
          const savedStore = savedStoreId
            ? loadedStores.find((s: Store) => s.id === savedStoreId || s._id === savedStoreId)
            : null;
          
          if (savedStore) {
            setSelectedStore(savedStore);
            selectedStoreIdRef.current = savedStore.id || savedStore._id || null;
          } else {
            // Default to first store
            const firstStore = loadedStores[0];
            setSelectedStore(firstStore);
            const firstStoreId = firstStore.id || firstStore._id || '';
            selectedStoreIdRef.current = firstStoreId;
            localStorage.setItem('selectedStoreId', firstStoreId);
          }
        } else if (currentSelectedId) {
          // Re-validate selected store still exists
          const currentStore = loadedStores.find(
            (s: Store) => s.id === currentSelectedId || s._id === currentSelectedId
          );
          
          if (currentStore) {
            // Update with latest data
            setSelectedStore(currentStore);
          } else if (loadedStores.length > 0) {
            // Current store no longer exists, select first
            const firstStore = loadedStores[0];
            setSelectedStore(firstStore);
            const firstStoreId = firstStore.id || firstStore._id || '';
            selectedStoreIdRef.current = firstStoreId;
            localStorage.setItem('selectedStoreId', firstStoreId);
          } else {
            // No stores available
            setSelectedStore(null);
            selectedStoreIdRef.current = null;
            localStorage.removeItem('selectedStoreId');
          }
        }
      } else {
        setError('Failed to load stores');
      }
    } catch (err: any) {
      console.error('Error loading stores:', err);
      setError(err.message || 'Failed to load stores');
      setStores([]);
      setSelectedStore(null);
      selectedStoreIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load stores on mount and when user changes
  useEffect(() => {
    refreshStores();
  }, [refreshStores]);

  // Select store by ID
  const selectStoreById = useCallback((storeId: string) => {
    const store = stores.find(
      (s: Store) => s.id === storeId || s._id === storeId
    );
    if (store) {
      setSelectedStore(store);
      const storeIdToSave = store.id || store._id || storeId;
      selectedStoreIdRef.current = storeIdToSave;
      localStorage.setItem('selectedStoreId', storeIdToSave);
      toast.success(`Switched to ${store.storeName}`);
    } else {
      toast.error('Store not found');
    }
  }, [stores]);

  // Update selected store when stores list changes (sync with latest store data)
  useEffect(() => {
    const currentStoreId = selectedStoreIdRef.current;
    if (currentStoreId && stores.length > 0) {
      // Find the store with the current ID
      const updatedStore = stores.find(
        (s: Store) => s.id === currentStoreId || s._id === currentStoreId
      );
      if (updatedStore) {
        // Update with latest data from API (functional update to avoid stale closure)
        setSelectedStore(prevStore => {
          // Only update if it's actually different (different object reference)
          if (prevStore !== updatedStore) {
            const prevId = prevStore?.id || prevStore?._id;
            const newId = updatedStore.id || updatedStore._id;
            if (prevId === newId) {
              return updatedStore;
            }
          }
          return prevStore;
        });
      }
    }
  }, [stores]);

  // Sync ref when selectedStore changes externally
  useEffect(() => {
    if (selectedStore) {
      const storeId = selectedStore.id || selectedStore._id || null;
      selectedStoreIdRef.current = storeId;
    } else {
      selectedStoreIdRef.current = null;
    }
  }, [selectedStore?.id, selectedStore?._id]);

  const value: StoreContextType = {
    stores,
    selectedStore,
    setSelectedStore: (store: Store | null) => {
      setSelectedStore(store);
      if (store) {
        const storeId = store.id || store._id || '';
        selectedStoreIdRef.current = storeId;
        localStorage.setItem('selectedStoreId', storeId);
      } else {
        selectedStoreIdRef.current = null;
        localStorage.removeItem('selectedStoreId');
      }
    },
    selectStoreById,
    refreshStores,
    loading,
    error,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

