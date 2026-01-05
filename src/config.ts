/**
 * Centralized configuration for the frontend.
 * These values are derived from environment variables with safe fallbacks for local development.
 */

// Basic health check to see if we're in dev or prod
export const IS_DEV = import.meta.env.DEV;
export const IS_PROD = import.meta.env.PROD;

// API Base URL - The backend endpoint
// In production, use relative URL to preserve hostname for tenant resolution
// In development, use absolute URL
const isDev = import.meta.env.DEV;
export const API_BASE_URL = isDev 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  : '/api';

// Store Base URL - Where the storefronts are hosted
// In development, this is typically localhost:8080 or similar
// In production, this should be the main domain, e.g., https://shelfmerch.com
export const STORE_BASE_URL = import.meta.env.VITE_STORE_BASE_URL || 'http://localhost:8080';

// Helper to get raw API URL (without /api suffix if needed)
export const RAW_API_URL = API_BASE_URL.endsWith('/api')
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;

console.log(`[Config] Running in ${IS_DEV ? 'development' : 'production'} mode`);
console.log(`[Config] API Base URL: ${API_BASE_URL}`);
console.log(`[Config] Store Base URL: ${STORE_BASE_URL}`);
