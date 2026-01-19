# Multi-Tenant Subdomain Migration - Complete Implementation

## Summary

This implementation adds subdomain-based tenant resolution (`{slug}.shelfmerch.in`) while maintaining backward compatibility with path-based routing (`/store/:slug`).

## Files Created

### Backend
1. **`backend/utils/tenantUtils.js`** - Tenant extraction utility
2. **`backend/middleware/tenantResolver.js`** - Express middleware for tenant resolution
3. **`backend/utils/cookieConfig.js`** - Cookie configuration for subdomain sharing

### Frontend
4. **`src/utils/tenantUtils.ts`** - Frontend tenant utilities
5. **`src/components/TenantRoute.tsx`** - Tenant-aware route wrapper

### Documentation
6. **`MULTI_TENANT_IMPLEMENTATION.md`** - Full implementation guide

## Files Modified

### Backend
1. **`backend/server.js`**
   - Added tenantResolver import
   - Updated CORS for wildcard subdomains
   - Added hostname extraction middleware
   - Applied tenantResolver to store-scoped routes

2. **`backend/routes/stores.js`**
   - Updated `/by-subdomain/:slug?` to use `req.tenant`

3. **`backend/routes/storeProducts.js`**
   - Updated `/public/:storeId?` to use `req.tenant`
   - Updated `/public/:storeId?/:productId` to use `req.tenant`

### Frontend
4. **`src/config.ts`**
   - Updated `API_BASE_URL` to use relative URLs in production

## Key Changes Explained

### 1. Backend Tenant Resolution

**Priority Order:**
1. Extract from subdomain (hostname) - `xyz.shelfmerch.in` → `xyz`
2. Fallback to path parameter - `/store/xyz` → `xyz`
3. Return null if neither found

**Middleware Application:**
- Applied to store-scoped routes: `/api/store-products`, `/api/store-checkout`, etc.
- Not applied to admin/auth routes: `/api/auth`, `/api/products`, etc.

### 2. CORS Configuration

**Production:**
- Allows `https://shelfmerch.in` (root domain)
- Allows `https://*.shelfmerch.in` (wildcard subdomains)
- Regex pattern: `^https://[^.]+\.shelfmerch\.in$`

**Development:**
- Allows all `localhost` origins
- Allows `localhost` subdomains (e.g., `xyz.localhost:3000`)

### 3. Cookie Configuration

**Production:**
- Domain: `.shelfmerch.in` (shared across subdomains)
- Secure: `true` (HTTPS only)
- SameSite: `lax`

**Development:**
- Domain: not set (host-only)
- Secure: `false`
- SameSite: `lax`

### 4. Frontend API Calls

**Production:**
- Uses relative URLs: `/api/...` (preserves hostname)
- Backend extracts tenant from `Host` header

**Development:**
- Uses absolute URLs: `http://localhost:5000/api`
- Can use path parameters as fallback

## Testing Checklist

### ✅ Backend Tests

#### Test 1: Subdomain Resolution (Production)
```bash
# Should resolve tenant from subdomain
curl -H "Host: xyz.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Expected: Returns store data for 'xyz' store
# Check: req.tenant should be populated
```

#### Test 2: Path-Based Fallback (Dev)
```bash
# Should resolve tenant from path parameter
curl http://localhost:5000/api/stores/by-subdomain/xyz

# Expected: Returns store data for 'xyz' store
# Check: req.tenant should be populated from path
```

#### Test 3: Reserved Subdomain
```bash
# Should NOT treat reserved subdomain as tenant
curl -H "Host: www.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Expected: req.tenant should be null
# Check: No store lookup attempted
```

#### Test 4: Unknown Tenant
```bash
# Should return 404 for unknown tenant
curl -H "Host: nonexistent.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Expected: 404 JSON response
# Response: { "success": false, "message": "Store 'nonexistent' not found or is inactive" }
```

#### Test 5: Localhost Subdomain (Dev)
```bash
# Should resolve tenant from localhost subdomain
curl -H "Host: xyz.localhost:3000" http://localhost:5000/api/stores/by-subdomain

# Expected: Returns store data for 'xyz' store
# Check: Works in development environment
```

#### Test 6: Root Domain
```bash
# Should NOT treat root domain as tenant
curl -H "Host: shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Expected: req.tenant should be null
# Check: No store lookup attempted
```

#### Test 7: Store Products with Tenant
```bash
# Should use tenant from subdomain
curl -H "Host: xyz.shelfmerch.in" http://localhost:5000/api/store-products/public

# Expected: Returns products for 'xyz' store
# Check: Uses req.tenant._id for filtering
```

### ✅ Frontend Tests

#### Test 1: Subdomain Detection
```javascript
// In browser console on xyz.shelfmerch.in
import { extractTenantFromHost } from '@/utils/tenantUtils';
extractTenantFromHost(window.location.hostname);
// Expected: "xyz"
```

#### Test 2: Path Fallback
```javascript
// In browser console on localhost:8080/store/xyz
import { getTenantSlugFromLocation } from '@/utils/tenantUtils';
getTenantSlugFromLocation(window.location, { subdomain: 'xyz' });
// Expected: "xyz"
```

#### Test 3: API Calls Preserve Hostname
```javascript
// In browser console on xyz.shelfmerch.in
fetch('/api/stores/by-subdomain')
  .then(r => r.json())
  .then(console.log);
// Expected: Returns store data for 'xyz'
// Check: Request includes Host: xyz.shelfmerch.in header
```

## Deployment Checklist

### Pre-Deployment
- [ ] Set `BASE_DOMAIN` environment variable
- [ ] Set `NODE_ENV=production`
- [ ] Configure DNS wildcard: `*.shelfmerch.in` → server IP
- [ ] Obtain SSL certificate for `*.shelfmerch.in`
- [ ] Configure Nginx with proper proxy headers

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name *.shelfmerch.in shelfmerch.in;
    
    ssl_certificate /path/to/wildcard.crt;
    ssl_certificate_key /path/to/wildcard.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Post-Deployment
- [ ] Test subdomain access: `https://xyz.shelfmerch.in`
- [ ] Test root domain: `https://shelfmerch.in`
- [ ] Test reserved subdomains: `https://www.shelfmerch.in`
- [ ] Verify cookies work across subdomains
- [ ] Test API calls from subdomain
- [ ] Verify path-based fallback still works

## Rollback Plan

If issues occur, rollback by:
1. Remove `tenantResolver` middleware from routes in `server.js`
2. Revert CORS changes to original configuration
3. Revert route changes to use path parameters only
4. Frontend changes are backward compatible (no rollback needed)

## Notes

- **No Breaking Changes**: All existing routes continue to work
- **Backward Compatible**: Path-based routing still functions
- **Gradual Migration**: Can deploy backend first, frontend later
- **Environment Aware**: Different behavior in dev vs production

## Support

For issues or questions:
1. Check `MULTI_TENANT_IMPLEMENTATION.md` for detailed docs
2. Review console logs for tenant resolution messages
3. Verify environment variables are set correctly
4. Check Nginx proxy headers are configured properly


