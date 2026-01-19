
/**
 * Tenant Resolver Middleware
 * Resolves tenant (store) from subdomain or path parameter and attaches to request
 */

const Store = require('../models/Store');
const { extractTenantFromHost } = require('../utils/tenantUtils');

/**
 * Middleware to resolve tenant from subdomain or path parameter
 * Sets req.tenantSlug and req.tenant on the request object
 * 
 * Resolution order:
 * 1. Extract from subdomain (hostname) - priority for production
 * 2. Fallback to path parameter /store/:slug - for dev/localhost
 * 3. Return null if neither is found
 */
async function tenantResolver(req, res, next) {
  try {
    let tenantSlug = null;

    // Priority 1: Extract from hostname/subdomain
    const hostname = req.hostname || req.get('host') || '';
    tenantSlug = extractTenantFromHost(hostname);

    // Priority 2: Fallback to path parameter (for dev/localhost or legacy URLs)
    if (!tenantSlug && req.params && req.params.slug) {
      tenantSlug = req.params.slug;
    }

    // Also check for 'subdomain' parameter (some routes use this)
    if (!tenantSlug && req.params && req.params.subdomain) {
      tenantSlug = req.params.subdomain;
    }

    // Attach tenantSlug to request
    req.tenantSlug = tenantSlug;

    // If we have a tenant slug, try to load the Store document
    if (tenantSlug) {
      try {
        const store = await Store.findOne({
          slug: tenantSlug,
          isActive: true,
        }).lean();

        if (store) {
          req.tenant = store;
          console.log(`[TenantResolver] Resolved tenant: ${tenantSlug} (${store.name})`);
        } else {
          // Tenant slug exists but store not found
          req.tenant = null;
          console.warn(`[TenantResolver] Tenant slug '${tenantSlug}' not found or inactive`);
          
          // Return 404 for API routes, let frontend handle for web routes
          if (req.path.startsWith('/api/')) {
            return res.status(404).json({
              success: false,
              message: `Store '${tenantSlug}' not found or is inactive`
            });
          }
        }
      } catch (error) {
        console.error('[TenantResolver] Error loading tenant:', error);
        req.tenant = null;
        
        if (req.path.startsWith('/api/')) {
          return res.status(500).json({
            success: false,
            message: 'Error resolving tenant'
          });
        }
      }
    } else {
      req.tenant = null;
    }

    next();
  } catch (error) {
    console.error('[TenantResolver] Unexpected error:', error);
    req.tenantSlug = null;
    req.tenant = null;
    next(); // Continue even if resolver fails
  }
}

/**
 * Optional middleware to require tenant (returns 404 if no tenant)
 * Use this on routes that MUST have a tenant
 */
function requireTenant(req, res, next) {
  if (!req.tenant) {
    const slug = req.tenantSlug || 'unknown';
    return res.status(404).json({
      success: false,
      message: `Store '${slug}' not found or is inactive`
    });
  }
  next();
}

module.exports = {
  tenantResolver,
  requireTenant
};


