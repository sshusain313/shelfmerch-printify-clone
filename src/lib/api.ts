import { API_BASE_URL } from '@/config';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: T;
  token?: string;
  refreshToken?: string;
  count?: number;
  errors?: Array<{ msg: string; param: string }>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ msg: string; param: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Store Products API
export const storeProductsApi = {
  // Create or update a store product with design data and optional variants
  create: async (payload: {
    storeId?: string;
    storeSlug?: string;
    catalogProductId: string;
    sellingPrice: number;
    compareAtPrice?: number;
    title?: string;
    description?: string;
    tags?: string[];
    status?: 'draft' | 'published';
    galleryImages?: Array<{ id: string; url: string; position: number; isPrimary?: boolean; imageType?: string; altText?: string }>;
    designData?: any;
    variants?: Array<{ catalogProductVariantId: string; sku: string; sellingPrice?: number; isActive?: boolean }>;
  }) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/store-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to save store product',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },

  // Get a specific store product by ID
  getById: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/store-products/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to fetch store product', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; data: any };
  },

  // List store products for current merchant (optionally filter)
  list: async (params?: { status?: 'draft' | 'published'; isActive?: boolean }) => {
    const token = getToken();
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));

    const response = await fetch(`${API_BASE_URL}/store-products${qs.toString() ? `?${qs.toString()}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to fetch store products', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; data: any[] };
  },

  // Update a store product
  update: async (id: string, updates: Partial<{ status: 'draft' | 'published'; isActive: boolean; title: string; description: string; sellingPrice: number; compareAtPrice: number; tags: string[]; designData: any }>) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/store-products/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to update store product', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; data: any };
  },

  // Update design preview image for a specific view
  updateDesignPreview: async (id: string, payload: {
    viewKey: string;
    previewUrl: string;
    elements?: any[];
    designUrlsByPlaceholder?: Record<string, string>;
  }) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/store-products/${id}/design-preview`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to update design preview', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },

  // Delete a store product
  delete: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/store-products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to delete store product', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; message: string };
  },

  // Get a specific store product for public storefront viewing (with variants)
  getPublic: async (storeId: string | undefined, productId: string) => {
    // Build URL - if storeId provided, use it; otherwise backend will use Host header (subdomain)
    // Note: storeId can be undefined when using subdomain-based resolution
    const url = storeId
      ? `${API_BASE_URL}/store-products/public/${storeId}/${productId}`
      : `${API_BASE_URL}/store-products/public/${productId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include credentials to preserve cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to fetch store product', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; data: any };
  },

  // List public products for a store
  listPublic: async (storeId?: string) => {
    // Build URL - if storeId provided, use it; otherwise backend will use Host header (subdomain)
    const url = storeId
      ? `${API_BASE_URL}/store-products/public/${storeId}`
      : `${API_BASE_URL}/store-products/public`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include credentials to preserve cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'Failed to fetch store products', response.status, errorData.errors);
    }

    const json = await response.json();
    return json as { success: boolean; data: any[] };
  },
};

// Catalog Products API (for internal catalog, not store-specific listings)
export const catalogProductsApi = {
  // List catalog products with optional filters/search
  list: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));

    const query = queryParams.toString();

    return apiRequest<{
      success: boolean;
      data: any[];
      count?: number;
    }>(`/products${query ? `?${query}` : ''}`);
  },
};

// Catalog Product Variants API
export const catalogVariantsApi = {
  // Get all catalog variants for a specific catalog product
  listByProduct: async (productId: string) => {
    return apiRequest<{
      success: boolean;
      data: any[];
      count?: number;
    }>(`/variants/product/${encodeURIComponent(productId)}`, {
      method: 'GET',
    });
  },
};

// Store orders API (merchant dashboard)
export const storeOrdersApi = {
  // List store orders for the current user:
  // - merchant: orders for their stores
  // - superadmin: orders for all active stores
  listForMerchant: async () => {
    return apiRequest<any[]>('/store-orders');
  },
  // Get single order by id
  getById: async (id: string) => {
    return apiRequest<any>(`/store-orders/${encodeURIComponent(id)}`);
  },
  // Update order status (superadmin only)
  updateStatus: async (
    id: string,
    status: 'on-hold' | 'in-production' | 'shipped' | 'delivered' | 'refunded' | 'cancelled'
  ) => {
    return apiRequest<any>(`/store-orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Store customers API (merchant dashboard)
export const storeCustomersApi = {
  // List customers for a specific store
  listByStore: async (storeId: string) => {
    return apiRequest<any>(`/store-customers/store/${encodeURIComponent(storeId)}`);
  },
  // Get single customer by id
  getById: async (id: string) => {
    return apiRequest<any>(`/store-customers/${encodeURIComponent(id)}`);
  },
};

// Storefront Checkout API (uses store-customer token, not merchant token)
export const checkoutApi = {
  // Place an order for a public store by subdomain
  placeOrder: async (
    subdomain: string,
    payload: { cart: any[]; shippingInfo: any }
  ) => {
    const storeTokenKey = `store_token_${subdomain}`;
    const storeToken = localStorage.getItem(storeTokenKey);

    const response = await fetch(
      `${API_BASE_URL}/store-checkout/${encodeURIComponent(subdomain)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storeToken ? { Authorization: `Bearer ${storeToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return (data || {
        success: false,
        message: 'Failed to place order',
      }) as { success: boolean; data: any; message?: string };
    }

    return data as { success: boolean; data: any; message?: string };
  },

  // Create Razorpay order
  createRazorpayOrder: async (
    subdomain: string,
    payload: { cart: any[]; shippingInfo: any; shipping?: number; tax?: number }
  ) => {
    const storeTokenKey = `store_token_${subdomain}`;
    const storeToken = localStorage.getItem(storeTokenKey);

    const response = await fetch(
      `${API_BASE_URL}/store-checkout/${encodeURIComponent(subdomain)}/razorpay/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storeToken ? { Authorization: `Bearer ${storeToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return (data || {
        success: false,
        message: 'Failed to create Razorpay order',
      }) as { success: boolean; data?: { razorpayOrder?: any }; message?: string };
    }

    return data as { success: boolean; data?: { razorpayOrder?: any; razorpayKeyId?: string }; message?: string };
  },

  // Verify Razorpay payment and create order
  verifyRazorpayPayment: async (
    subdomain: string,
    payload: {
      cart: any[];
      shippingInfo: any;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      shipping?: number;
      tax?: number;
    }
  ) => {
    const storeTokenKey = `store_token_${subdomain}`;
    const storeToken = localStorage.getItem(storeTokenKey);

    const response = await fetch(
      `${API_BASE_URL}/store-checkout/${encodeURIComponent(subdomain)}/razorpay/verify-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(storeToken ? { Authorization: `Bearer ${storeToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return (data || {
        success: false,
        message: 'Failed to verify payment',
      }) as { success: boolean; data?: any; message?: string };
    }

    return data as { success: boolean; data?: any; message?: string };
  },
};

// Shipping API
export const shippingApi = {
  getQuote: async (destPincode: string, weightGrams: number) => {
    return apiRequest<any>('/shipping-quote', {
      method: 'POST',
      body: JSON.stringify({ destPincode, weightGrams }),
    });
  },
};

// Fulfillment Invoices API
export const invoiceApi = {
  // Get all invoices for logged in merchant
  listForMerchant: async () => {
    return apiRequest<any[]>('/invoices');
  },
  // Get all invoices for super admin
  listAll: async () => {
    return apiRequest<any[]>('/invoices/all');
  },
  // Get single invoice by ID
  getById: async (id: string) => {
    return apiRequest<any>(`/invoices/${encodeURIComponent(id)}`);
  },
  // Pay invoice (legacy)
  pay: async (id: string, paymentDetails: { transactionId?: string; method?: string }) => {
    return apiRequest<any>(`/invoices/${encodeURIComponent(id)}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentDetails),
    });
  },
  // Pay invoice with wallet (full or partial + Razorpay)
  payWithWallet: async (id: string, useWallet: boolean = true) => {
    return apiRequest<{
      invoiceId: string;
      status: string;
      walletDebitedPaise: number;
      walletDebitedRupees: string;
      remainingPaise: number;
      remainingRupees?: string;
      razorpayOrderId?: string;
      razorpayKeyId?: string;
      razorpayAmount?: number;
      razorpayCurrency?: string;
    }>(`/invoices/${encodeURIComponent(id)}/pay-with-wallet`, {
      method: 'POST',
      body: JSON.stringify({ useWallet }),
    });
  },
};

// Wallet API
export const walletApi = {
  // Get current user's wallet balance
  getBalance: async () => {
    return apiRequest<{
      balancePaise: number;
      balanceRupees: string;
      currency: string;
      status: string;
    }>('/wallet');
  },

  // Get paginated transaction history
  getTransactions: async (params?: { limit?: number; cursor?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();

    return apiRequest<{
      data: Array<{
        id: string;
        type: string;
        direction: string;
        amountPaise: number;
        amountRupees: string;
        status: string;
        source: string;
        referenceType: string;
        referenceId: string;
        description: string;
        balanceBeforePaise: number;
        balanceAfterPaise: number;
        createdAt: string;
        completedAt: string;
      }>;
      pagination: {
        total: number;
        hasMore: boolean;
        nextCursor: string | null;
      };
    }>(`/wallet/transactions${query ? `?${query}` : ''}`);
  },

  // Create Razorpay order for wallet top-up
  createTopupOrder: async (amountPaise: number) => {
    return apiRequest<{
      razorpayOrderId: string;
      amountPaise: number;
      currency: string;
      razorpayKeyId: string;
      receipt: string;
    }>('/wallet/topup/create-order', {
      method: 'POST',
      body: JSON.stringify({ amountPaise }),
    });
  },
};

// Admin Wallet API
export const adminWalletApi = {
  // List all wallets
  listWallets: async (params?: { search?: string; limit?: number; skip?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    const query = queryParams.toString();

    return apiRequest<{
      data: Array<{
        id: string;
        userId: string;
        userEmail: string;
        userName: string;
        balancePaise: number;
        balanceRupees: string;
        currency: string;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        skip: number;
      };
    }>(`/admin/wallet/wallets${query ? `?${query}` : ''}`);
  },

  // Get specific user's wallet
  getWallet: async (userId: string) => {
    return apiRequest<{
      userId: string;
      balancePaise: number;
      balanceRupees: string;
      currency: string;
      status: string;
    }>(`/admin/wallet/wallets/${encodeURIComponent(userId)}`);
  },

  // Get user's transaction history
  getTransactions: async (userId: string, params?: { limit?: number; cursor?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    const query = queryParams.toString();

    return apiRequest<{
      data: Array<{
        id: string;
        type: string;
        direction: string;
        amountPaise: number;
        amountRupees: string;
        status: string;
        source: string;
        description: string;
        adminId?: string;
        meta?: any;
        createdAt: string;
        completedAt: string;
      }>;
      pagination: {
        total: number;
        hasMore: boolean;
        nextCursor: string | null;
      };
    }>(`/admin/wallet/wallets/${encodeURIComponent(userId)}/transactions${query ? `?${query}` : ''}`);
  },

  // Adjust wallet balance (credit or debit)
  adjustBalance: async (data: {
    userId: string;
    direction: 'CREDIT' | 'DEBIT';
    amountPaise: number;
    reason: string;
  }) => {
    return apiRequest<{
      newBalancePaise: number;
      newBalanceRupees: string;
      transactionId: string;
    }>('/admin/wallet/wallets/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get wallet statistics
  getStats: async () => {
    return apiRequest<{
      totalWallets: number;
      activeWallets: number;
      lockedWallets: number;
      totalBalancePaise: number;
      totalBalanceRupees: string;
      transactionsByType: Record<string, {
        count: number;
        totalPaise: number;
        totalRupees: string;
      }>;
    }>('/admin/wallet/stats');
  },
};

// ============================================
// Merchant Withdrawals API
// ============================================
export const withdrawalApi = {
  // Get wallet summary with pending withdrawals
  getWalletSummary: async () => {
    return apiRequest<{
      balancePaise: number;
      balanceRupees: string;
      currency: string;
      status: string;
      pendingWithdrawalsPaise: number;
      pendingWithdrawalsRupees: string;
      availableForWithdrawalPaise: number;
      availableForWithdrawalRupees: string;
    }>('/merchant/wallet/summary');
  },

  // List merchant's withdrawal requests
  list: async (params?: { status?: string; limit?: number; skip?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    const query = queryParams.toString();

    return apiRequest<{
      data: Array<{
        id: string;
        amountPaise: number;
        amountRupees: string;
        currency: string;
        upiId: string;
        status: string;
        requestedAt: string;
        reviewedAt?: string;
        paidAt?: string;
        rejectionReason?: string;
        payoutMethod: string;
        payoutReference?: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        skip: number;
      };
    }>(`/merchant/withdrawals${query ? `?${query}` : ''}`);
  },

  // Create a new withdrawal request
  create: async (data: { amountPaise: number; upiId: string }) => {
    return apiRequest<{
      id: string;
      amountPaise: number;
      amountRupees: string;
      upiId: string;
      status: string;
      requestedAt: string;
    }>('/merchant/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// Admin Withdrawals API
// ============================================
export const adminWithdrawalsApi = {
  // Get withdrawal statistics
  getStats: async () => {
    return apiRequest<{
      byStatus: Record<string, {
        count: number;
        totalPaise: number;
        totalRupees: string;
      }>;
      todayApproved: {
        count: number;
        totalPaise: number;
        totalRupees: string;
      };
      todayPaid: {
        count: number;
        totalPaise: number;
        totalRupees: string;
      };
    }>('/admin/withdrawals/stats');
  },

  // List all withdrawal requests with filters
  list: async (params?: { status?: string; merchantId?: string; limit?: number; skip?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.merchantId) queryParams.append('merchantId', params.merchantId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    const query = queryParams.toString();

    return apiRequest<{
      data: Array<{
        id: string;
        merchantId: string;
        merchantEmail?: string;
        merchantName?: string;
        amountPaise: number;
        amountRupees: string;
        currency: string;
        upiId: string;
        status: string;
        requestedAt: string;
        reviewedAt?: string;
        reviewedBy?: string;
        paidAt?: string;
        rejectionReason?: string;
        payoutMethod: string;
        payoutReference?: string;
        payoutNotes?: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        skip: number;
      };
    }>(`/admin/withdrawals${query ? `?${query}` : ''}`);
  },

  // Get single withdrawal details
  getById: async (id: string) => {
    return apiRequest<{
      id: string;
      merchantId: string;
      merchantEmail?: string;
      merchantName?: string;
      amountPaise: number;
      amountRupees: string;
      currency: string;
      upiId: string;
      status: string;
      requestedAt: string;
      reviewedAt?: string;
      reviewedBy?: string;
      paidAt?: string;
      rejectionReason?: string;
      payoutMethod: string;
      payoutReference?: string;
      payoutNotes?: string;
      balanceBeforeRequestPaise?: number;
      transactionId?: string;
    }>(`/admin/withdrawals/${encodeURIComponent(id)}`);
  },

  // Approve a withdrawal request
  approve: async (id: string) => {
    return apiRequest<{
      id: string;
      status: string;
      amountPaise: number;
      amountRupees: string;
      transactionId: string;
    }>(`/admin/withdrawals/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
  },

  // Reject a withdrawal request
  reject: async (id: string, reason: string) => {
    return apiRequest<{
      id: string;
      status: string;
      rejectionReason: string;
    }>(`/admin/withdrawals/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Mark withdrawal as paid
  markPaid: async (id: string, data: { payoutReference: string; notes?: string }) => {
    return apiRequest<{
      id: string;
      status: string;
      payoutReference: string;
      paidAt: string;
    }>(`/admin/withdrawals/${encodeURIComponent(id)}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// Reviews API
// ============================================
export const reviewsApi = {
  // Get reviews for a product with pagination
  getReviews: async (productId: string, params?: { limit?: number; skip?: number; sort?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();

    return apiRequest<{
      success: boolean;
      data: {
        reviews: Array<{
          id: string;
          customerName: string;
          rating: number;
          title?: string;
          body: string;
          images: Array<{ url: string; caption?: string }>;
          isVerifiedPurchase: boolean;
          helpfulCount: number;
          createdAt: string;
        }>;
        stats: {
          averageRating: number;
          totalCount: number;
          distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
        };
        pagination: {
          total: number;
          limit: number;
          skip: number;
          hasMore: boolean;
        };
      };
    }>(`/reviews/${encodeURIComponent(productId)}${query ? `?${query}` : ''}`);
  },

  // Get review stats only (lightweight)
  getStats: async (productId: string) => {
    return apiRequest<{
      success: boolean;
      data: {
        averageRating: number;
        totalCount: number;
        distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
      };
    }>(`/reviews/${encodeURIComponent(productId)}/stats`);
  },

  // Submit a new review
  create: async (productId: string, data: {
    customerName: string;
    customerEmail?: string;
    rating: number;
    title?: string;
    body: string;
    images?: Array<{ url: string; caption?: string }>;
  }) => {
    return apiRequest<{
      success: boolean;
      message: string;
      data: {
        id: string;
        customerName: string;
        rating: number;
        title?: string;
        body: string;
        images: Array<{ url: string; caption?: string }>;
        isVerifiedPurchase: boolean;
        createdAt: string;
      };
    }>(`/reviews/${encodeURIComponent(productId)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Mark a review as helpful
  markHelpful: async (reviewId: string, voterId: string) => {
    return apiRequest<{
      success: boolean;
      data: { helpfulCount: number };
    }>(`/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ voterId }),
    });
  },
};

// Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

// Save tokens to localStorage
const saveTokens = (token: string, refreshToken: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
};

// Remove tokens from localStorage
const removeTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data: ApiResponse = await response.json();

    if (data.success && data.token && data.refreshToken) {
      saveTokens(data.token, data.refreshToken);
      return data.token;
    }

    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// Make API request with automatic token refresh
const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for httpOnly tokens
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // If unauthorized, try to refresh token
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry request with new token
      config.headers = {
        ...defaultHeaders,
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      };
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } else {
      // Refresh failed, remove tokens
      removeTokens();
      throw new ApiError('Session expired. Please login again.', 401);
    }
  }

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (error) {
    // If response is not JSON, create error from status
    throw new ApiError(
      `Server error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status,
      data.errors
    );
  }

  // For auth endpoints, return the full response object (includes success, token, refreshToken, user, count)
  // For other endpoints, return data.data or data.user or the whole data object
  if (data.success !== undefined && (data.token !== undefined || data.user !== undefined || typeof (data as any).count === 'number')) {
    return data as T;
  }

  return (data.data || data.user || data) as T;
};

// Auth API methods
export const authApi = {
  register: async (name: string, email: string, password: string) => {
    // Validate inputs before sending
    if (!email || !email.trim()) {
      throw new ApiError('Email is required', 400);
    }
    if (!name || !name.trim()) {
      throw new ApiError('Name is required', 400);
    }
    if (!password || password.length < 6) {
      throw new ApiError('Password must be at least 6 characters', 400);
    }

    const response = await apiRequest<{
      success: boolean;
      message?: string;
      user?: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
        isEmailVerified: boolean;
      };
      token?: string;
      refreshToken?: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase().replace(/^@+/, ''), // Remove any leading @ that might have been added
        password
      }),
    });

    // Only save tokens if they exist (they won't exist until email is verified)
    if (response.token && response.refreshToken) {
      saveTokens(response.token, response.refreshToken);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      success: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
      };
      token: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token && response.refreshToken) {
      saveTokens(response.token, response.refreshToken);
    }

    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      removeTokens();
    }
  },

  getMe: async () => {
    return apiRequest<{
      success: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
        lastLogin?: string;
      };
    }>('/auth/me');
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest<{
      success: boolean;
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
      token: string;
      refreshToken: string;
    }>('/auth/updatepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  getUserCount: async () => {
    return apiRequest<{
      success: boolean;
      count: number;
    }>('/auth/users/count');
  },

  forgotPassword: async (email: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyResetOTP: async (email: string, otp: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },

};

// Product API methods
export const productApi = {
  create: async (productData: any) => {
    // Make direct fetch to preserve full response structure
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
          body: JSON.stringify(productData),
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'An error occurred',
            retryResponse.status,
            errorData.errors
          );
        }
        const data = await retryResponse.json();
        return data;
      } else {
        removeTokens();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'An error occurred',
        response.status,
        errorData.errors
      );
    }

    const data = await response.json();
    // Return full response to preserve success field
    return data;
  },

  getAll: async (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }
    // Only append isActive if it's explicitly true or false, not undefined
    if (params?.isActive === true || params?.isActive === false) {
      queryParams.append('isActive', params.isActive.toString());
    }

    const query = queryParams.toString();
    const token = getToken();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for list requests

    try {
      // Use apiRequest but get the raw response to preserve pagination
      const response = await fetch(`${API_BASE_URL}/products${query ? `?${query}` : ''}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        signal: controller.signal, // Add abort signal
      });

      clearTimeout(timeoutId);

      // Handle 401 with token refresh
      if (response.status === 401 && token) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Create new controller for retry
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);

          try {
            const retryResponse = await fetch(`${API_BASE_URL}/products${query ? `?${query}` : ''}`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              signal: retryController.signal,
            });

            clearTimeout(retryTimeoutId);

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw new ApiError(
                errorData.message || 'An error occurred',
                retryResponse.status,
                errorData.errors
              );
            }
            const data = await retryResponse.json();
            return {
              success: data.success !== false,
              data: data.data || [],
              pagination: data.pagination || {
                page: parseInt(String(params?.page || 1)),
                limit: parseInt(String(params?.limit || 20)),
                total: 0,
                pages: 0
              }
            };
          } catch (retryError: any) {
            clearTimeout(retryTimeoutId);
            if (retryError.name === 'AbortError') {
              throw new ApiError('Request timeout - server is taking too long to respond', 408);
            }
            throw retryError;
          }
        } else {
          removeTokens();
          throw new ApiError('Session expired. Please login again.', 401);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'An error occurred',
          response.status,
          errorData.errors
        );
      }

      const data = await response.json();
      // Return the full response object including success, data, and pagination
      return {
        success: data.success !== false,
        data: data.data || [],
        pagination: data.pagination || {
          page: parseInt(String(params?.page || 1)),
          limit: parseInt(String(params?.limit || 20)),
          total: 0,
          pages: 0
        }
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout - server is taking too long to respond', 408);
      }
      throw error;
    }
  },

  getById: async (id: string) => {
    // Make direct fetch to preserve full response structure
    const token = getToken();

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        signal: controller.signal, // Add abort signal
      });

      clearTimeout(timeoutId);

      // Handle 401 with token refresh
      if (response.status === 401 && token) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Create new controller for retry
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);

          try {
            const retryResponse = await fetch(`${API_BASE_URL}/products/${id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              credentials: 'include',
              signal: retryController.signal,
            });

            clearTimeout(retryTimeoutId);

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw new ApiError(
                errorData.message || 'An error occurred',
                retryResponse.status,
                errorData.errors
              );
            }
            const data = await retryResponse.json();
            return data;
          } catch (retryError: any) {
            clearTimeout(retryTimeoutId);
            if (retryError.name === 'AbortError') {
              throw new ApiError('Request timeout - server is taking too long to respond', 408);
            }
            throw retryError;
          }
        } else {
          removeTokens();
          throw new ApiError('Session expired. Please login again.', 401);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || 'An error occurred',
          response.status,
          errorData.errors
        );
      }

      const data = await response.json();
      // Return full response to preserve success and data fields
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout - server is taking too long to respond', 408);
      }
      throw error;
    }
  },

  update: async (id: string, productData: any) => {
    // Make direct fetch to preserve full response structure
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(productData),
    });

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
          body: JSON.stringify(productData),
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'An error occurred',
            retryResponse.status,
            errorData.errors
          );
        }
        const data = await retryResponse.json();
        return data;
      } else {
        removeTokens();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'An error occurred',
        response.status,
        errorData.errors
      );
    }

    const data = await response.json();
    // Return full response to preserve success and data fields
    return data;
  },

  delete: async (id: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },


  getCatalogProducts: async (params?: { page?: number; limit?: number; category?: string; subcategory?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.subcategory) queryParams.append('subcategory', params.subcategory);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/products/catalog/active${queryString ? `?${queryString}` : ''}`;

    // Public endpoint - no auth required
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(errorData.message || 'An error occurred', response.status, errorData.errors);
    }

    return await response.json();
  },
};

// Product Variant API (for variants stored in separate collection)
export const variantApi = {
  // Get all variants for a specific product
  getByProductId: async (productId: string) => {
    return apiRequest<{
      success: boolean;
      data: any[];
      count: number;
    }>(`/variants/product/${productId}`, {
      method: 'GET',
    });
  },

  // Get single variant by ID
  getById: async (id: string) => {
    return apiRequest(`/variants/${id}`, {
      method: 'GET',
    });
  },

  // Create a new variant
  create: async (data: {
    productId: string;
    id: string;
    size: string;
    color: string;
    colorHex?: string;
    sku: string;
    isActive?: boolean;
  }) => {
    return apiRequest('/variants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Create multiple variants at once
  createBulk: async (productId: string, variants: Array<{
    id: string;
    size: string;
    color: string;
    colorHex?: string;
    sku: string;
    isActive?: boolean;
  }>) => {
    return apiRequest('/variants/bulk', {
      method: 'POST',
      body: JSON.stringify({ productId, variants }),
    });
  },

  // Update a variant
  update: async (id: string, data: {
    size?: string;
    color?: string;
    colorHex?: string;
    sku?: string;
    isActive?: boolean;
  }) => {
    return apiRequest(`/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a variant
  delete: async (id: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/variants/${id}`, {
      method: 'DELETE',
    });
  },

  // Delete all variants for a product
  deleteByProductId: async (productId: string) => {
    return apiRequest<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`/variants/product/${productId}`, {
      method: 'DELETE',
    });
  },
};

// Stores API
export const storeApi = {
  // Create a new store for the current user
  create: async (data: { name: string; theme?: string; description?: string }) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to create store',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    // json has shape { success, message, data }
    return json as { success: boolean; message: string; data: any };
  },

  // Get all stores admin
  listAllStores: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    const token = getToken();
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/stores/admin/all${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch stores',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as {
      success: boolean;
      message: string;
      data: any[];
      pagination: { total: number; page: number; limit: number; pages: number }
    };
  },

  // Get all stores for the current user
  listMyStores: async () => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch stores',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; data: any[] };
  },

  // Get the current user's primary store
  getMyStore: async () => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch store',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; data: any | null };
  },

  // Get a public store by subdomain (slug)
  getBySubdomain: async (subdomain?: string) => {
    // Build URL - if subdomain provided, use it; otherwise backend will use Host header
    const url = subdomain
      ? `${API_BASE_URL}/stores/by-subdomain/${subdomain}`
      : `${API_BASE_URL}/stores/by-subdomain`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include credentials to preserve cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch store',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; data: any | null };
  },

  // Get store by ID (for builder access)
  getById: async (storeId: string, includeBuilder = false) => {
    const token = getToken();

    const url = `${API_BASE_URL}/stores/${storeId}${includeBuilder ? '?includeBuilder=true' : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch store',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; data: any | null };
  },
  // Update basic store settings
  update: async (
    storeId: string,
    data: {
      description?: string;
      theme?: string;
      settings?: {
        currency?: string;
        timezone?: string;
        logoUrl?: string;
        primaryColor?: string;
      };
    }
  ) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to update store',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },
};

// Store Builder API
export const builderApi = {
  // Get builder data for a store
  get: async (storeId: string) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/builder`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to fetch builder data',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; data: any };
  },

  // Save builder draft
  saveDraft: async (storeId: string, builder: any) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/builder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(builder),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to save builder draft',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },

  // Publish builder (make it live)
  publish: async (storeId: string, builder: any) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/builder/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(builder),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to publish builder',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },

  // Reset builder to default template
  reset: async (storeId: string) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/builder`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to reset builder',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },

  // Toggle builder on/off
  toggle: async (storeId: string, useBuilder: boolean) => {
    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/stores/${storeId}/builder/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ useBuilder }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to toggle builder',
        response.status,
        errorData.errors
      );
    }

    const json = await response.json();
    return json as { success: boolean; message: string; data: any };
  },
};

// Variant Options API
export const variantOptionsApi = {
  // Get all custom variant options (filtered by category/subcategory)
  getAll: async (params?: { categoryId?: string; subcategoryId?: string; optionType?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.subcategoryId) queryParams.append('subcategoryId', params.subcategoryId);
    if (params?.optionType) queryParams.append('optionType', params.optionType);

    const queryString = queryParams.toString();
    const url = `/variant-options${queryString ? `?${queryString}` : ''}`;

    return apiRequest(url, { method: 'GET' });
  },

  // Create a new custom variant option
  create: async (data: {
    categoryId: string;
    subcategoryId?: string;
    optionType: 'size' | 'color';
    value: string;
    colorHex?: string;
  }) => {
    return apiRequest('/variant-options', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a custom variant option
  update: async (id: string, data: {
    value?: string;
    colorHex?: string;
    isActive?: boolean;
  }) => {
    return apiRequest(`/variant-options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete (soft delete) a custom variant option
  delete: async (id: string) => {
    return apiRequest(`/variant-options/${id}`, { method: 'DELETE' });
  },

  // Get statistics about variant options usage
  getStats: async () => {
    return apiRequest('/variant-options/stats', { method: 'GET' });
  },
};

// Catalogue Fields API
export const catalogueFieldsApi = {
  // Get all catalogue field templates (filtered by category/subcategory)
  getAll: async (params?: { categoryId?: string; subcategoryId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.subcategoryId) queryParams.append('subcategoryId', params.subcategoryId);

    const queryString = queryParams.toString();
    const url = `/catalogue-fields${queryString ? `?${queryString}` : ''}`;

    return apiRequest(url, { method: 'GET' });
  },

  // Create a new catalogue field template
  create: async (data: {
    categoryId: string;
    subcategoryId?: string;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select';
    options?: string[];
    required?: boolean;
    placeholder?: string;
    unit?: string;
  }) => {
    return apiRequest('/catalogue-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update a catalogue field template
  update: async (id: string, data: {
    label?: string;
    type?: 'text' | 'textarea' | 'number' | 'select';
    options?: string[];
    required?: boolean;
    placeholder?: string;
    unit?: string;
    isActive?: boolean;
  }) => {
    return apiRequest(`/catalogue-fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete a catalogue field template
  delete: async (id: string) => {
    return apiRequest(`/catalogue-fields/${id}`, { method: 'DELETE' });
  },

  // Get statistics about catalogue fields
  getStats: async () => {
    return apiRequest('/catalogue-fields/stats', { method: 'GET' });
  },
};

// Image Upload API
export const uploadApi = {
  /**
   * Upload a single image file to S3
   * @param file - File object to upload
   * @param folder - Folder path in S3 (e.g., 'gallery', 'mockups')
   * @returns Promise with the S3 URL
   */
  uploadImage: async (file: File, folder: string = 'uploads'): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
          body: formData,
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'Failed to upload image',
            retryResponse.status
          );
        }
        const data = await retryResponse.json();
        return data.url;
      } else {
        removeTokens();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to upload image',
        response.status
      );
    }

    const data = await response.json();
    return data.url;
  },

  /**
   * Upload a video file to S3
   * @param file - Video file object to upload
   * @param folder - Folder path in S3 (e.g., 'videos')
   * @returns Promise with the S3 URL
   */
  uploadVideo: async (file: File, folder: string = 'videos'): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('video', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/upload/video`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/upload/video`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
          body: formData,
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'Failed to upload video',
            retryResponse.status
          );
        }
        const data = await retryResponse.json();
        return data.url;
      } else {
        removeTokens();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to upload video',
        response.status
      );
    }

    const data = await response.json();
    return data.url;
  },

  /**
   * Upload a base64 image to S3 (for backward compatibility)
   * @param base64 - Base64 encoded image string
   * @param fileName - Original filename
   * @param folder - Folder path in S3
   * @returns Promise with the S3 URL
   */
  uploadBase64: async (base64: string, fileName: string = 'image.jpg', folder: string = 'uploads'): Promise<string> => {
    return apiRequest<{ success: boolean; url: string }>('/upload/base64', {
      method: 'POST',
      body: JSON.stringify({ base64, fileName, folder }),
    }).then(response => response.url);
  },

  /**
   * Upload multiple images to S3
   * @param files - Array of File objects
   * @param folder - Folder path in S3
   * @returns Promise with array of S3 URLs
   */
  uploadBatch: async (files: File[], folder: string = 'uploads'): Promise<string[]> => {
    const token = getToken();
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/upload/batch`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        const retryResponse = await fetch(`${API_BASE_URL}/upload/batch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
          },
          credentials: 'include',
          body: formData,
        });
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new ApiError(
            errorData.message || 'Failed to upload images',
            retryResponse.status
          );
        }
        const data = await retryResponse.json();
        return data.urls;
      } else {
        removeTokens();
        throw new ApiError('Session expired. Please login again.', 401);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || 'Failed to upload images',
        response.status
      );
    }

    const data = await response.json();
    return data.urls;
  },
};

// Assets API
export const assetsApi = {
  // Get all published assets (public)
  getAll: async (params?: {
    category?: string;
    type?: string;
    tags?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.tags) queryParams.append('tags', params.tags);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiRequest(`/assets${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // Get single asset by ID
  getById: async (id: string) => {
    return apiRequest(`/assets/${id}`, { method: 'GET' });
  },

  // Track download (public)
  trackDownload: async (id: string) => {
    return apiRequest(`/assets/${id}/download`, { method: 'POST' });
  },

  // Admin: Get all assets (including unpublished)
  adminGetAll: async (params?: {
    category?: string;
    type?: string;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiRequest(`/assets/admin/all${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // Admin: Update asset
  adminUpdate: async (id: string, data: any) => {
    return apiRequest(`/assets/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Admin: Delete asset
  adminDelete: async (id: string) => {
    return apiRequest(`/assets/admin/${id}`, { method: 'DELETE' });
  }
};

// Generic API request method
export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  patch: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError, getToken, removeTokens, apiRequest };

