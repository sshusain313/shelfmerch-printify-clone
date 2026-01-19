/**
 * Store Redirect Middleware
 * Redirects /store/:slug/* routes to subdomain-based routes in production
 * Example: /store/merch/products -> https://merch.shelfmerch.in/products
 */

const BASE_DOMAIN = process.env.BASE_DOMAIN || 'shelfmerch.in';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Middleware to redirect /store/:slug/* to subdomain-based routes
 * Only applies in production; in dev, routes work as-is for backward compatibility
 */
function storeRedirect(req, res, next) {
  // Only redirect in production
  if (!isProduction) {
    return next();
  }

  // Only redirect if we're on the root domain (not already on a subdomain)
  const hostname = req.hostname || req.get('host')?.split(':')[0] || '';
  const isRootDomain = hostname === BASE_DOMAIN || hostname === `www.${BASE_DOMAIN}`;
  
  if (!isRootDomain) {
    // Already on a subdomain, no redirect needed
    return next();
  }

  // Check if path matches /store/:slug/*
  const storePathMatch = req.path.match(/^\/store\/([^/]+)(\/.*)?$/);
  
  if (storePathMatch) {
    const storeSlug = storePathMatch[1];
    const restOfPath = storePathMatch[2] || '';
    
    // Build subdomain URL
    const protocol = req.protocol || 'https';
    const subdomainUrl = `${protocol}://${storeSlug}.${BASE_DOMAIN}${restOfPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
    
    // 301 Permanent Redirect
    return res.redirect(301, subdomainUrl);
  }

  next();
}

module.exports = storeRedirect;


