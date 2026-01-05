# Multi-Tenant Subdomain Implementation Guide

This document describes the implementation of subdomain-based tenant resolution for the ShelfMerch MERN application.

## Overview

The application now supports tenant (store) resolution from:
1. **Subdomain** (production): `{storeSlug}.shelfmerch.in`
2. **Path parameter** (dev/fallback): `/store/:slug`

## Backend Implementation

### Files Created/Modified

#### 1. `backend/utils/tenantUtils.js`
- Utility function `extractTenantFromHost()` that extracts tenant slug from hostname
- Handles production domains, localhost subdomains, and reserved subdomains
- **Location**: `backend/utils/tenantUtils.js`

#### 2. `backend/middleware/tenantResolver.js`
- Express middleware that resolves tenant from subdomain or path
- Sets `req.tenantSlug` and `req.tenant` on request object
- Returns 404 for API routes if tenant not found
- **Location**: `backend/middleware/tenantResolver.js`

#### 3. `backend/utils/cookieConfig.js`
- Cookie configuration utility for subdomain cookie sharing
- Sets domain to `.shelfmerch.in` in production
- **Location**: `backend/utils/cookieConfig.js`

#### 4. `backend/server.js` (Modified)
- Added tenant resolver middleware import
- Updated CORS to support wildcard subdomains (`*.shelfmerch.in`)
- Applied `tenantResolver` middleware to store-scoped routes
- Added hostname extraction middleware
- **Changes**:
  - Line ~46: Added `tenantResolver` import
  - Lines 51-89: Updated CORS configuration
  - Lines 120-127: Added hostname extraction middleware
  - Lines 163-185: Applied tenantResolver to store routes

#### 5. `backend/routes/stores.js` (Modified)
- Updated `/by-subdomain/:slug?` route to use `req.tenant` when available
- **Location**: Line ~452-485

#### 6. `backend/routes/storeProducts.js` (Modified)
- Updated `/public/:storeId?` route to use `req.tenant` when available
- **Location**: Line ~147-173

## Frontend Implementation

### Files Created/Modified

#### 1. `src/utils/tenantUtils.ts`
- Frontend utility functions for tenant extraction
- `extractTenantFromHost()` - extracts tenant from hostname
- `getTenantSlugFromLocation()` - gets tenant from hostname or path
- `isTenantSubdomain()` - checks if current location is subdomain
- `getApiBaseUrl()` - returns relative URL in production
- **Location**: `src/utils/tenantUtils.ts`

#### 2. `src/config.ts` (Modified)
- Updated `API_BASE_URL` to use relative URLs in production
- **Location**: Line ~11

#### 3. `src/components/TenantRoute.tsx` (New)
- Wrapper component for tenant-aware routes
- **Location**: `src/components/TenantRoute.tsx`

## Environment Variables

Add to your `.env` files:

```bash
# Backend .env
BASE_DOMAIN=shelfmerch.in
NODE_ENV=production  # or development

# Frontend .env
VITE_BASE_DOMAIN=shelfmerch.in
VITE_API_URL=http://localhost:5000/api  # Only needed in dev
```

## Nginx Configuration (Production)

For production, configure Nginx to proxy requests and preserve hostname:

```nginx
server {
    listen 80;
    server_name *.shelfmerch.in shelfmerch.in;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Usage Examples

### Backend Route Example

```javascript
// Route automatically gets req.tenant from middleware
router.get('/api/store-products/public/:storeId?', tenantResolver, async (req, res) => {
  // Use req.tenant when available (subdomain-based)
  // Fallback to req.params.storeId (path-based)
  const storeId = req.tenant?._id || req.params.storeId;
  
  // ... rest of route logic
});
```

### Frontend Component Example

```typescript
import { getTenantSlugFromLocation } from '@/utils/tenantUtils';
import { useParams, useLocation } from 'react-router-dom';

function MyComponent() {
  const params = useParams();
  const location = useLocation();
  
  // Get tenant slug (works with both subdomain and path)
  const tenantSlug = getTenantSlugFromLocation(location, params);
  
  // Use tenantSlug for API calls
  // API calls use relative URLs, so hostname is preserved
}
```

## Testing Checklist

### 1. Subdomain Resolution (Production)
```bash
# Test with Host header
curl -H "Host: xyz.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Should return store data for 'xyz' store
```

### 2. Path-Based Fallback (Dev)
```bash
# Test with path parameter
curl http://localhost:5000/api/stores/by-subdomain/xyz

# Should return store data for 'xyz' store
```

### 3. Reserved Subdomain
```bash
# Test reserved subdomain
curl -H "Host: www.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Should return null tenant (not treated as store)
```

### 4. Unknown Tenant
```bash
# Test unknown tenant
curl -H "Host: nonexistent.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Should return 404 JSON response
```

### 5. Localhost Subdomain (Dev)
```bash
# Test localhost subdomain
curl -H "Host: xyz.localhost:3000" http://localhost:5000/api/stores/by-subdomain

# Should return store data for 'xyz' store
```

### 6. Root Domain
```bash
# Test root domain
curl -H "Host: shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Should return null tenant (not treated as store)
```

## Migration Notes

### Existing Routes
- Routes using `/store/:subdomain` still work (fallback)
- New subdomain-based access works automatically
- No breaking changes to existing functionality

### API Calls
- Frontend uses relative URLs (`/api/...`) in production
- Backend extracts tenant from `Host` header
- No changes needed to API call code

### Cookies/Sessions
- Cookies set with domain `.shelfmerch.in` in production
- Shared across all subdomains
- Host-only in development

## Troubleshooting

### Issue: Tenant not resolving from subdomain
- Check `trust proxy` is set: `app.set('trust proxy', 1)`
- Verify Nginx passes `Host` header: `proxy_set_header Host $host;`
- Check hostname extraction middleware is running

### Issue: CORS blocking subdomain requests
- Verify CORS allows wildcard subdomains
- Check `BASE_DOMAIN` environment variable matches your domain
- Ensure production regex pattern matches your subdomains

### Issue: Cookies not working across subdomains
- Verify cookie domain is set to `.shelfmerch.in` in production
- Check `secure` flag is true in production (HTTPS required)
- Ensure `sameSite` is set to `lax` or `none`

## Next Steps

1. Update frontend routes to use `TenantRoute` wrapper where needed
2. Test in staging environment with actual subdomains
3. Configure DNS wildcard record: `*.shelfmerch.in` → server IP
4. Update SSL certificate to include wildcard: `*.shelfmerch.in`
5. Deploy to production

