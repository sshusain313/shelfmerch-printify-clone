import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Admin from './Admin';
import { storeApi } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  storeApi: {
    listAllStores: vi.fn(),
    getStats: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
  productApi: {
    getAll: vi.fn().mockResolvedValue({ success: true, data: [], pagination: { total: 0 } }),
  },
  storeOrdersApi: {
    listForMerchant: vi.fn().mockResolvedValue([]),
  },
  authApi: {
    getUserCount: vi.fn().mockResolvedValue({ success: true, count: 10 }),
  }
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin1', role: 'superadmin', name: 'Admin User' },
    isAuthenticated: true,
    loading: false,
    logout: vi.fn(),
  }),
}));

// Mock Recharts to avoid sizing issues in tests
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>,
  };
});

describe('Admin Page - All Stores Table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stores table and fetches data with correct parameters', async () => {
    // Setup mock data
    const mockStores = [
      {
        id: 'store_12345678',
        storeName: 'Test Store 1',
        subdomain: 'test1',
        owner: { name: 'Owner 1', email: 'owner1@example.com' },
        productsCount: 5,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      },
      {
        id: 'store_87654321',
        storeName: 'Test Store 2',
        subdomain: 'test2',
        owner: { name: 'Owner 2', email: 'owner2@example.com' },
        productsCount: 0,
        isActive: false,
        createdAt: '2023-02-01T00:00:00Z',
        updatedAt: '2023-02-02T00:00:00Z',
      }
    ];

    (storeApi.listAllStores as any).mockResolvedValue({
      success: true,
      data: mockStores,
      pagination: { total: 2, page: 1, limit: 10, pages: 1 }
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    // Click on Stores tab (assuming it is rendered and clickable, or we can navigate via URL)
    // In the component, it checks URL param 'tab'. But default is 'overview'.
    // We can simulate clicking the tab if it exists.
    // The tabs are rendered using Shadcn Tabs.
    const storesTab = screen.getByRole('button', { name: /active stores/i });
    fireEvent.click(storesTab);

    // Verify loading state (might be too fast to catch, but we can try)
    // expect(screen.getByRole('status')).toBeInTheDocument(); 

    // Verify data display
    await waitFor(() => {
      expect(screen.getByText('Test Store 1')).toBeInTheDocument();
      expect(screen.getByText('Test Store 2')).toBeInTheDocument();
    });

    // Verify columns content
    expect(screen.getByText('store_12...')).toBeInTheDocument(); // ID truncated
    expect(screen.getByText('test1.shelfmerch.com')).toBeInTheDocument();
    expect(screen.getByText('Owner 1')).toBeInTheDocument();
    expect(screen.getByText('owner1@example.com')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Products count
    expect(screen.getByText('Active')).toBeInTheDocument(); // Status badge
    
    // Verify API call
    expect(storeApi.listAllStores).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }));
  });

  it('handles pagination interaction', async () => {
     const mockStores = Array(12).fill(null).map((_, i) => ({
        id: `store_${i}`,
        storeName: `Store ${i}`,
        subdomain: `store${i}`,
        owner: { name: 'Owner', email: 'owner@example.com' },
        productsCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
     }));

     // First page response
     (storeApi.listAllStores as any).mockResolvedValueOnce({
        success: true,
        data: mockStores.slice(0, 10),
        pagination: { total: 12, page: 1, limit: 10, pages: 2 }
     });

     // Second page response
     (storeApi.listAllStores as any).mockResolvedValueOnce({
        success: true,
        data: mockStores.slice(10),
        pagination: { total: 12, page: 2, limit: 10, pages: 2 }
     });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );

    // Navigate to Stores tab
    fireEvent.click(screen.getByRole('button', { name: /active stores/i }));

    await waitFor(() => {
        expect(screen.getByText('Store 0')).toBeInTheDocument();
    });

    // Find next page button
    // Shadcn pagination "Next" button usually has aria-label "Go to next page" or text "Next"
    const nextButton = screen.getByRole('link', { name: /next/i }); 
    fireEvent.click(nextButton);

    await waitFor(() => {
        expect(storeApi.listAllStores).toHaveBeenLastCalledWith(expect.objectContaining({
            page: 2
        }));
    });
  });

  it('handles search functionality', async () => {
    (storeApi.listAllStores as any).mockResolvedValue({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 }
    });

    render(
      <BrowserRouter>
        <Admin />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /active stores/i }));

    const searchInput = screen.getByPlaceholderText('Search stores...');
    fireEvent.change(searchInput, { target: { value: 'query' } });

    // Wait for debounce (500ms)
    await waitFor(() => {
        expect(storeApi.listAllStores).toHaveBeenCalledWith(expect.objectContaining({
            search: 'query'
        }));
    }, { timeout: 1000 });
  });
});
