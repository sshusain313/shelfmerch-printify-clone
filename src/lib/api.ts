const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

  getUserCount: async ()=>{
    return apiRequest<{
        success: boolean;
        count: number;
    }>('/auth/users/count');
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

export { ApiError, getToken, removeTokens };

