const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  update: async (id: string, updates: Partial<{ status: 'draft' | 'published'; isActive: boolean; title: string; description: string; sellingPrice: number; compareAtPrice: number; tags: string[] }>) => {
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
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: string;
      };
      token: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase().replace(/^@+/, ''), // Remove any leading @ that might have been added
        password
      }),
    });

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
  getBySubdomain: async (subdomain: string) => {
    const response = await fetch(`${API_BASE_URL}/stores/by-subdomain/${subdomain}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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

