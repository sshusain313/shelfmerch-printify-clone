/**
 * Tenant Utilities
 * Extracts tenant (store) slug from hostname for multi-tenant subdomain support
 */

// Reserved subdomains that should not be treated as tenant slugs
const RESERVED_SUBDOMAINS = ['www', 'shelfmerch', 'admin', 'api'];
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'shelfmerch.com';

/**
 * Extract tenant slug from hostname
 * @param {string} hostname - The hostname from the request (e.g., "xyz.shelfmerch.in:3000")
 * @returns {string | null} - The tenant slug or null if not a tenant subdomain
 * 
 * Examples:
 * - "xyz.shelfmerch.in" -> "xyz"
 * - "xyz.shelfmerch.in:3000" -> "xyz"
 * - "www.shelfmerch.in" -> null (reserved)
 * - "shelfmerch.in" -> null (root domain)
 * - "localhost" -> null
 * - "xyz.localhost" -> "xyz" (dev support)
 * - "127.0.0.1" -> null
 */
function extractTenantFromHost(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return null;
  }

  // Remove port if present (e.g., "xyz.shelfmerch.in:3000" -> "xyz.shelfmerch.in")
  const hostnameWithoutPort = hostname.split(':')[0].toLowerCase().trim();

  // Handle localhost (dev environment)
  if (hostnameWithoutPort === 'localhost' || hostnameWithoutPort === '127.0.0.1') {
    return null;
  }

  // Handle localhost subdomains for dev (e.g., "xyz.localhost")
  if (hostnameWithoutPort.endsWith('.localhost')) {
    const subdomain = hostnameWithoutPort.replace('.localhost', '');
    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
      return subdomain;
    }
    return null;
  }

  // Handle production domain (shelfmerch.in or custom base domain)
  const domainParts = hostnameWithoutPort.split('.');
  
  // Must have at least 2 parts (subdomain.domain or domain.tld)
  if (domainParts.length < 2) {
    return null;
  }

  // Check if it matches our base domain
  // Support both exact match and wildcard matching
  const isBaseDomain = hostnameWithoutPort === BASE_DOMAIN || 
                       hostnameWithoutPort.endsWith('.' + BASE_DOMAIN);

  if (!isBaseDomain) {
    // Not our domain, but could be a subdomain pattern
    // Allow it if it has a subdomain part and is not reserved
    if (domainParts.length >= 2) {
      const potentialSubdomain = domainParts[0];
      if (potentialSubdomain && !RESERVED_SUBDOMAINS.includes(potentialSubdomain)) {
        return potentialSubdomain;
      }
    }
    return null;
  }

  // Extract subdomain from base domain
  const subdomain = hostnameWithoutPort.replace('.' + BASE_DOMAIN, '').replace(BASE_DOMAIN, '');
  
  // If no subdomain or it's reserved, return null
  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

module.exports = {
  extractTenantFromHost,
  RESERVED_SUBDOMAINS,
  BASE_DOMAIN
};


