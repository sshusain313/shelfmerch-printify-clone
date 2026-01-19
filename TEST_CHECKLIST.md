# Test Checklist - Subdomain-Based Routing

## Pre-Deployment Tests (Localhost)

### 1. Backend Tenant Resolution

```bash
# Test subdomain extraction (should return store data)
curl -H "Host: merch.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Test path fallback (should return store data)
curl http://localhost:5000/api/stores/by-subdomain/merch

# Test unknown tenant (should return 404)
curl -H "Host: nonexistent.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain

# Expected: {"success": false, "message": "Store 'nonexistent' not found or is inactive"}

# Test reserved subdomain (should return null tenant, not treated as store)
curl -H "Host: www.shelfmerch.in" http://localhost:5000/api/stores/by-subdomain
```

### 2. Backend Redirect (Production Mode)

```bash
# Set NODE_ENV=production temporarily
NODE_ENV=production node backend/server.js

# Test redirect (should 301 to subdomain)
curl -I -H "Host: shelfmerch.in" http://localhost:5000/store/merch/products

# Expected: Location: https://merch.shelfmerch.in/products
# Status: 301 Moved Permanently

# Test redirect on subdomain (should NOT redirect)
curl -I -H "Host: merch.shelfmerch.in" http://localhost:5000/store/merch/products
# Should NOT redirect (already on subdomain)
```

### 3. Frontend Routing (Development)

```bash
# Start frontend dev server
npm run dev

# Test path-based routing (should work)
# Navigate to: http://localhost:8080/store/merch
# Navigate to: http://localhost:8080/store/merch/products
# Navigate to: http://localhost:8080/store/merch/product/123

# Verify:
# - All pages load correctly
# - Navigation links work
# - Direct refresh (F5) doesn't cause 404
# - Browser back/forward works
```

### 4. Frontend Routing (Localhost Subdomain - Optional)

```bash
# Edit hosts file (Windows: C:\Windows\System32\drivers\etc\hosts)
# Add: 127.0.0.1 merch.localhost

# Navigate to: http://merch.localhost:8080
# Navigate to: http://merch.localhost:8080/products
# Navigate to: http://merch.localhost:8080/product/123

# Verify:
# - Routes work without /store/:slug prefix
# - Navigation links are correct
# - Direct refresh works
```

## Production Tests

### 1. DNS Resolution

```bash
# Verify DNS records
dig merch.shelfmerch.in
dig shelfmerch.in
dig *.shelfmerch.in

# Should resolve to server IP
```

### 2. SSL Certificate

```bash
# Verify wildcard certificate
openssl s_client -connect merch.shelfmerch.in:443 -servername merch.shelfmerch.in

# Should show certificate for *.shelfmerch.in
```

### 3. Subdomain Access

```bash
# Test subdomain home page
curl -I https://merch.shelfmerch.in/

# Test subdomain products page
curl -I https://merch.shelfmerch.in/products

# Test subdomain product page
curl -I https://merch.shelfmerch.in/product/123

# Expected: 200 OK (or 404 if product doesn't exist, but route should work)
```

### 4. Redirect Behavior

```bash
# Test redirect from path-based to subdomain
curl -I https://shelfmerch.in/store/merch
# Expected: 301 Location: https://merch.shelfmerch.in/

curl -I https://shelfmerch.in/store/merch/products
# Expected: 301 Location: https://merch.shelfmerch.in/products

curl -I https://shelfmerch.in/store/merch/product/123
# Expected: 301 Location: https://merch.shelfmerch.in/product/123
```

### 5. Direct Refresh (Critical Test)

**Manual Browser Tests:**

1. Navigate to: `https://merch.shelfmerch.in/products`
2. Press F5 (refresh)
3. **Expected**: Page reloads correctly (no 404)

4. Navigate to: `https://merch.shelfmerch.in/product/123`
5. Press F5 (refresh)
6. **Expected**: Page reloads correctly (no 404)

7. Navigate to: `https://merch.shelfmerch.in/checkout`
8. Press F5 (refresh)
9. **Expected**: Page reloads correctly (no 404)

### 6. Navigation Links

**Manual Browser Tests:**

1. Navigate to: `https://merch.shelfmerch.in/`
2. Click "Products" link in header
3. **Expected**: Navigates to `https://merch.shelfmerch.in/products`

4. Click on a product card
5. **Expected**: Navigates to `https://merch.shelfmerch.in/product/{id}`

6. Click "View All Products" button
7. **Expected**: Navigates to `https://merch.shelfmerch.in/products`

### 7. API Calls

```bash
# Test API call from subdomain context
curl -H "Host: merch.shelfmerch.in" https://shelfmerch.in/api/store-products/public

# Expected: Returns products for 'merch' store only

# Test API call from root domain (should not return tenant-specific data)
curl https://shelfmerch.in/api/store-products/public

# Expected: 400 error or empty results (no tenant context)
```

### 8. Reserved Subdomains

```bash
# Test reserved subdomains (should NOT be treated as stores)
curl -I https://www.shelfmerch.in/
curl -I https://admin.shelfmerch.in/
curl -I https://api.shelfmerch.in/
curl -I https://shelfmerch.shelfmerch.in/

# Expected: Loads main site, NOT store pages
```

### 9. Unknown Store

```bash
# Test unknown store subdomain
curl -I https://nonexistent.shelfmerch.in/

# Expected: 404 or error page (store doesn't exist)
```

## Test Scenarios Summary

| Scenario | URL | Expected Behavior |
|----------|-----|------------------|
| Store home (subdomain) | `merch.shelfmerch.in/` | Loads store homepage |
| Store products (subdomain) | `merch.shelfmerch.in/products` | Loads products page |
| Store product (subdomain) | `merch.shelfmerch.in/product/123` | Loads product page |
| Redirect (path → subdomain) | `shelfmerch.in/store/merch/products` | 301 → `merch.shelfmerch.in/products` |
| Main site | `shelfmerch.in/` | Loads main site (not store) |
| Reserved subdomain | `www.shelfmerch.in/` | Loads main site (not store) |
| Unknown store | `nonexistent.shelfmerch.in/` | 404 error |
| Direct refresh | `merch.shelfmerch.in/products` + F5 | Page reloads (no 404) |

## Automated Test Script

```bash
#!/bin/bash
# test-subdomain-routing.sh

BASE_DOMAIN="shelfmerch.in"
STORE_SLUG="merch"
BACKEND_URL="http://localhost:5000"

echo "Testing Subdomain Routing..."

# Test 1: Backend tenant resolution
echo "Test 1: Backend tenant resolution"
RESPONSE=$(curl -s -H "Host: ${STORE_SLUG}.${BASE_DOMAIN}" ${BACKEND_URL}/api/stores/by-subdomain)
if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✓ Tenant resolution works"
else
    echo "✗ Tenant resolution failed"
    exit 1
fi

# Test 2: Path fallback
echo "Test 2: Path fallback"
RESPONSE=$(curl -s ${BACKEND_URL}/api/stores/by-subdomain/${STORE_SLUG})
if echo "$RESPONSE" | grep -q "success.*true"; then
    echo "✓ Path fallback works"
else
    echo "✗ Path fallback failed"
    exit 1
fi

# Test 3: Unknown tenant
echo "Test 3: Unknown tenant"
RESPONSE=$(curl -s -H "Host: nonexistent.${BASE_DOMAIN}" ${BACKEND_URL}/api/stores/by-subdomain)
if echo "$RESPONSE" | grep -q "not found"; then
    echo "✓ Unknown tenant handling works"
else
    echo "✗ Unknown tenant handling failed"
    exit 1
fi

echo "All tests passed!"
```

## Sign-off Checklist

Before deploying to production, verify:

- [ ] All backend tests pass
- [ ] Frontend routing works in dev (path-based)
- [ ] Frontend routing works with localhost subdomain (optional)
- [ ] DNS wildcard record configured
- [ ] SSL wildcard certificate installed
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded/restarted
- [ ] Backend running with `trust proxy` enabled
- [ ] Production redirects work (301 from path to subdomain)
- [ ] Direct refresh works on all store pages
- [ ] Navigation links work correctly
- [ ] API calls scope correctly to tenant
- [ ] Reserved subdomains load main site
- [ ] Unknown stores return 404


