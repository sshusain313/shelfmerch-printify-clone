# Quick Reference - Multi-Tenant Subdomain Implementation

## Code Locations

### Backend Files

| File | Purpose | Status |
|------|---------|--------|
| `backend/utils/tenantUtils.js` | Extract tenant from hostname | ✅ Created |
| `backend/middleware/tenantResolver.js` | Resolve tenant in Express middleware | ✅ Created |
| `backend/utils/cookieConfig.js` | Cookie domain configuration | ✅ Created |
| `backend/server.js` | Apply middleware & CORS updates | ✅ Modified |
| `backend/routes/stores.js` | Use req.tenant | ✅ Modified |
| `backend/routes/storeProducts.js` | Use req.tenant | ✅ Modified |

### Frontend Files

| File | Purpose | Status |
|------|---------|--------|
| `src/utils/tenantUtils.ts` | Frontend tenant utilities | ✅ Created |
| `src/components/TenantRoute.tsx` | Tenant-aware route wrapper | ✅ Created |
| `src/config.ts` | Relative API URLs in production | ✅ Modified |

## Quick Test Commands

```bash
# 1. Test subdomain resolution
curl -H "Host: xyz.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# 2. Test path fallback
curl http://localhost:5000/api/stores/by-subdomain/xyz

# 3. Test unknown tenant (should return 404)
curl -H "Host: nonexistent.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# 4. Test reserved subdomain (should return null tenant)
curl -H "Host: www.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# 5. Test localhost subdomain (dev)
curl -H "Host: xyz.localhost:3000" http://localhost:5000/api/stores/by-subdomain
```

## Environment Variables Needed

### Backend `.env`
```bash
BASE_DOMAIN=shelfmerch.in
NODE_ENV=production  # or development
```

### Frontend `.env`
```bash
VITE_BASE_DOMAIN=shelfmerch.in
VITE_API_URL=http://localhost:5000/api  # Only needed in dev
```

## Key Points

1. **Backend** automatically extracts tenant from `Host` header
2. **Frontend** uses relative URLs (`/api/...`) in production to preserve hostname
3. **Fallback** to path parameters works for dev/localhost
4. **No breaking changes** - existing routes still work

## Localhost Support

✅ **Works out of the box on localhost!**

- **Path-based (default)**: `http://localhost:8080/store/xyz` - works immediately, no setup needed
- **Subdomain-based (optional)**: `http://xyz.localhost:8080` - requires hosts file configuration

See `LOCALHOST_SETUP.md` for detailed setup instructions.

