/**
 * Tenant Utilities (Frontend)
 * Extracts tenant (store) slug from hostname for multi-tenant subdomain support
 */

const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || 'shelfmerch.in';
const RESERVED_SUBDOMAINS = ['www', 'shelfmerch', 'admin', 'api'];

/**
 * Extract tenant slug from hostname
 * @param hostname - The hostname from window.location.hostname
 * @returns The tenant slug or null if not a tenant subdomain
 * 
 * Examples:
 * - "xyz.shelfmerch.in" -> "xyz"
 * - "www.shelfmerch.in" -> null (reserved)
 * - "shelfmerch.in" -> null (root domain)
 * - "localhost" -> null
 * - "xyz.localhost" -> "xyz" (dev support)
 */
export function extractTenantFromHost(hostname: string): string | null {
  if (!hostname || typeof hostname !== 'string') {
    return null;
  }

  const hostnameLower = hostname.toLowerCase().trim();

  // Handle localhost (dev environment)
  if (hostnameLower === 'localhost' || hostnameLower === '127.0.0.1') {
    return null;
  }

  // Handle localhost subdomains for dev (e.g., "xyz.localhost")
  if (hostnameLower.endsWith('.localhost')) {
    const subdomain = hostnameLower.replace('.localhost', '');
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      return subdomain;
    }
    return null;
  }

  // Handle production domain
  const domainParts = hostnameLower.split('.');
  
  // Must have at least 2 parts
  if (domainParts.length < 2) {
    return null;
  }

  // Check if it matches our base domain
  const isBaseDomain = hostnameLower === BASE_DOMAIN || 
                       hostnameLower.endsWith('.' + BASE_DOMAIN);

  if (!isBaseDomain) {
    // Not our domain, but could be a subdomain pattern
    if (domainParts.length >= 2) {
      const potentialSubdomain = domainParts[0];
      if (potentialSubdomain && !RESERVED_SUBDOMAINS.includes(potentialSubdomain)) {
        return potentialSubdomain;
      }
    }
    return null;
  }

  // Extract subdomain from base domain
  const subdomain = hostnameLower.replace('.' + BASE_DOMAIN, '').replace(BASE_DOMAIN, '');
  
  // If no subdomain or it's reserved, return null
  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Get tenant slug from current location
 * Priority:
 * 1. Subdomain from hostname (production)
 * 2. Path parameter /store/:slug (dev/fallback)
 * 
 * @param location - window.location or useParams() result
 * @returns Tenant slug or null
 */
export function getTenantSlugFromLocation(
  location?: { hostname?: string; pathname?: string },
  pathParams?: { subdomain?: string; slug?: string }
): string | null {
  // Priority 1: Extract from hostname (subdomain)
  const hostname = location?.hostname || (typeof window !== 'undefined' ? window.location.hostname : '');
  const tenantFromHost = hostname ? extractTenantFromHost(hostname) : null;
  
  if (tenantFromHost) {
    return tenantFromHost;
  }

  // Priority 2: Fallback to path parameter
  if (pathParams?.subdomain) {
    return pathParams.subdomain;
  }
  
  if (pathParams?.slug) {
    return pathParams.slug;
  }

  // Priority 3: Try to extract from pathname
  const pathname = location?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (pathname) {
    const match = pathname.match(/\/store\/([^/]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if current location is a tenant subdomain
 */
export function isTenantSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const tenantSlug = extractTenantFromHost(window.location.hostname);
  return tenantSlug !== null;
}

/**
 * Get API base URL - uses relative URLs in production to preserve hostname
 * Falls back to absolute URL in development
 */
export function getApiBaseUrl(): string {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // In dev, use absolute URL from config
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }
  
  // In production, use relative URL to preserve hostname for tenant resolution
  return '/api';
}

