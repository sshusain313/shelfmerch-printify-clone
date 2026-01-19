# Subdomain-Based Routing Refactor - Complete Implementation

## Overview

This refactor changes store routing from path-based (`/store/:slug/*`) to subdomain-based (`{slug}.shelfmerch.in/*`) while maintaining backward compatibility.

## Implementation Summary

### ✅ Backend Changes

1. **Redirect Middleware** (`backend/middleware/storeRedirect.js`)
   - Redirects `/store/:slug/*` to `https://{slug}.shelfmerch.in/*` in production
   - Only applies 301 redirects in production (dev uses path-based routing)
   - Applied in `server.js` after health check, before API routes

2. **Tenant Resolution** (Already implemented)
   - `backend/middleware/tenantResolver.js` - Extracts tenant from subdomain
   - `backend/utils/tenantUtils.js` - Utility functions

### ✅ Frontend Changes

1. **Route Helper Utilities** (`src/utils/tenantUtils.ts`)
   - `tenantBasePath()` - Returns base path (empty for subdomain, `/store/:slug` for path)
   - `buildStorePath(path, tenantSlug)` - Builds tenant-aware paths
   - `buildStoreUrl(path, tenantSlug)` - Builds absolute URLs

2. **StoreRoutes Component** (`src/components/StoreRoutes.tsx`)
   - Conditionally renders routes based on routing mode
   - Subdomain mode: `/`, `/products`, `/product/:id`
   - Path mode: `/store/:subdomain`, `/store/:subdomain/products`, etc.

3. **App.tsx Updates**
   - Uses `StoreRoutes` component for all store routes
   - Routes automatically adapt to subdomain vs path-based routing

4. **Navigation Updates**
   - `StoreFrontendNew.tsx` - Updated navigation to use `buildStorePath()`
   - `StoreProductsPage.tsx` - Updated navigation to use `buildStorePath()`
   - All store-scoped navigation now uses route helpers

## Files Created

1. `backend/middleware/storeRedirect.js` - Redirect middleware
2. `src/components/StoreRoutes.tsx` - Conditional routing component
3. `SUBDOMAIN_REFACTOR_COMPLETE.md` - This file

## Files Modified

1. `backend/server.js` - Added storeRedirect middleware
2. `src/utils/tenantUtils.ts` - Added route helper functions
3. `src/App.tsx` - Updated to use StoreRoutes component
4. `src/pages/StoreFrontendNew.tsx` - Updated navigation
5. `src/pages/StoreProductsPage.tsx` - Updated navigation

## Route Mapping

| Old Route | New Route (Subdomain) | New Route (Path/Dev) |
|-----------|----------------------|---------------------|
| `/store/merch` | `merch.shelfmerch.in/` | `/store/merch` |
| `/store/merch/products` | `merch.shelfmerch.in/products` | `/store/merch/products` |
| `/store/merch/product/:id` | `merch.shelfmerch.in/product/:id` | `/store/merch/product/:id` |
| `/store/merch/checkout` | `merch.shelfmerch.in/checkout` | `/store/merch/checkout` |
| `/store/merch/auth` | `merch.shelfmerch.in/auth` | `/store/merch/auth` |
| `/store/merch/account` | `merch.shelfmerch.in/account` | `/store/merch/account` |

## Behavior

### Production
- `merch.shelfmerch.in/products` → Works (subdomain routing)
- `shelfmerch.in/store/merch/products` → 301 redirects to `merch.shelfmerch.in/products`

### Development
- `localhost:8080/store/merch/products` → Works (path-based routing)
- `merch.localhost:8080/products` → Works if hosts file configured (subdomain routing)

## Next Steps

1. Update Nginx configuration (see `NGINX_CONFIG.md`)
2. Test in staging environment
3. Deploy to production
4. Monitor redirects and routing


