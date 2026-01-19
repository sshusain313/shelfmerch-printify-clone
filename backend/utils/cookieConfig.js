/**
 * Cookie Configuration Utility
 * Handles cookie domain settings for multi-tenant subdomain architecture
 */

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'shelfmerch.in';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get cookie options for setting cookies
 * In production: uses .shelfmerch.in to share cookies across subdomains
 * In development: host-only cookies (no domain)
 */
function getCookieOptions(overrides = {}) {
  const defaultOptions = {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'lax' : 'lax', // Lax for subdomain support
  };

  // Set domain for production to share cookies across subdomains
  if (isProduction) {
    defaultOptions.domain = `.${BASE_DOMAIN}`;
  }
  // In dev, don't set domain (host-only cookie)

  return {
    ...defaultOptions,
    ...overrides,
  };
}

module.exports = {
  getCookieOptions,
  BASE_DOMAIN,
};


