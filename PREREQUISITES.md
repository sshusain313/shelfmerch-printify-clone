# Prerequisites for Subdomain-Based Routing

This document outlines all prerequisites needed to set up subdomain-based routing where stores are accessed via `awesome.shelfmerch.in/` instead of `shelfmerch.in/store/awesome/`.

## Overview

**Goal**: Enable routing like:
- `awesome.shelfmerch.in/` → Store home
- `awesome.shelfmerch.in/products` → Store products
- `awesome.shelfmerch.in/product/:id` → Product detail

**Instead of**:
- `shelfmerch.in/store/awesome/` → Store home
- `shelfmerch.in/store/awesome/products` → Store products

---

## 1. Code Prerequisites ✅ (Already Implemented)

The following code changes have already been implemented:

### Backend
- ✅ `backend/utils/tenantUtils.js` - Tenant extraction utility
- ✅ `backend/middleware/tenantResolver.js` - Tenant resolution middleware
- ✅ `backend/middleware/storeRedirect.js` - Redirect middleware (production)
- ✅ `backend/server.js` - Updated with tenant resolver and redirect middleware
- ✅ Backend routes updated to use `req.tenant`

### Frontend
- ✅ `src/utils/tenantUtils.ts` - Frontend tenant utilities
- ✅ `src/components/StoreRoutes.tsx` - Conditional routing component
- ✅ `src/App.tsx` - Updated to use StoreRoutes
- ✅ Navigation updated to use `buildStorePath()` helper

**Status**: ✅ Code implementation is complete. No additional code changes needed.

---

## 2. Infrastructure Prerequisites

### 2.1 Domain and DNS Setup

**Required**:
- ✅ Domain name: `shelfmerch.in` (or your domain)
- ✅ DNS provider access (Cloudflare, Route53, Namecheap, etc.)

**DNS Records Needed**:

```
Type    Name                    Value
A       shelfmerch.in           <your-server-ip>
A       *.shelfmerch.in         <your-server-ip>
```

OR (using CNAME):
```
Type    Name                    Value
A       shelfmerch.in           <your-server-ip>
CNAME   *.shelfmerch.in         shelfmerch.in
```

**Testing DNS**:
```bash
# Test main domain
dig shelfmerch.in
nslookup shelfmerch.in

# Test wildcard subdomain
dig merch.shelfmerch.in
nslookup merch.shelfmerch.in

# Both should resolve to your server IP
```

### 2.2 Web Server (Nginx)

**Required**:
- ✅ Nginx installed on your server
- ✅ Root access or sudo privileges to configure Nginx
- ✅ Frontend build directory accessible to Nginx

**Installation** (if not installed):
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Verify installation
nginx -v
```

**Configuration File Location**:
- `/etc/nginx/sites-available/shelfmerch` (create this file)
- `/etc/nginx/sites-enabled/shelfmerch` (symlink from sites-available)

**Required Nginx Configuration**:
- See `NGINX_CONFIG.md` for complete configuration
- Key requirement: `proxy_set_header Host $host;` (preserves subdomain for backend)

### 2.3 Server Requirements

**Minimum**:
- ✅ Linux server (Ubuntu 20.04+, CentOS 7+, or similar)
- ✅ Node.js installed (v16+ recommended)
- ✅ MongoDB running (for store data)
- ✅ Port 80 (HTTP) open in firewall
- ✅ Port 443 (HTTPS, optional for production)

**Firewall Configuration**:
```bash
# Allow HTTP (required)
sudo ufw allow 80/tcp

# Allow HTTPS (optional, for production)
sudo ufw allow 443/tcp

# Allow backend port (if exposed, usually not needed with Nginx)
sudo ufw allow 5000/tcp
```

---

## 3. Environment Configuration

### 3.1 Backend Environment Variables

**Required in `backend/.env`**:

```bash
# Base domain for subdomain routing
BASE_DOMAIN=shelfmerch.in

# Node environment (affects redirect behavior)
NODE_ENV=production  # or 'development'

# Backend port (default 5000)
PORT=5000

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/shelfmerch

# Other existing environment variables...
```

**Important**:
- `BASE_DOMAIN` must match your actual domain
- `NODE_ENV=production` enables redirects from `/store/:slug/*` to subdomain

### 3.2 Frontend Environment Variables

**Required in `.env` (root or `shelfmerch-printify-clone/.env`)**:

```bash
# Base domain for subdomain routing
VITE_BASE_DOMAIN=shelfmerch.in

# API URL (only needed in development)
VITE_API_URL=http://localhost:5000/api
```

**Important**:
- `VITE_BASE_DOMAIN` must match backend `BASE_DOMAIN`
- In production, API calls use relative URLs (`/api/...`)

---

## 4. Database Prerequisites

### 4.1 Store Collection Requirements

**Required**:
- ✅ `Store` collection exists
- ✅ Stores have a `slug` field (unique identifier)
- ✅ Stores have `isActive: true` for active stores

**Example Store Document**:
```javascript
{
  _id: ObjectId("..."),
  name: "Awesome Store",
  slug: "awesome",  // ← This is used for subdomain
  isActive: true,
  // ... other fields
}
```

**Verification**:
```javascript
// In MongoDB shell or MongoDB Compass
db.stores.find({ slug: "awesome", isActive: true })
```

---

## 5. Deployment Prerequisites

### 5.1 Frontend Build

**Required**:
- ✅ Frontend build directory exists
- ✅ Build includes `index.html` (for SPA routing)
- ✅ Nginx can read the build directory

**Build Command**:
```bash
cd shelfmerch-printify-clone
npm run build
# Output: dist/ or build/ directory
```

**Nginx Access**:
```bash
# Ensure Nginx can read build directory
sudo chown -R www-data:www-data /path/to/frontend/build
sudo chmod -R 755 /path/to/frontend/build
```

### 5.2 Backend Deployment

**Required**:
- ✅ Backend running (Node.js/Express)
- ✅ Backend accessible on configured port (default: 5000)
- ✅ `trust proxy` enabled (already in code: `app.set('trust proxy', 1)`)

**Start Backend**:
```bash
cd shelfmerch-printify-clone/backend
npm install
npm start
# or
node server.js
```

---

## 6. Testing Prerequisites

### 6.1 Local Testing (Development)

**For local testing, you can use path-based routing** (no DNS needed):
- ✅ Routes work as: `http://localhost:8080/store/awesome/`
- ✅ No additional setup required
- ✅ Code automatically detects localhost and uses path-based routing

**Optional: Test subdomain locally**:
```bash
# Edit hosts file
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

# Add:
127.0.0.1 awesome.localhost

# Then access: http://awesome.localhost:8080
```

### 6.2 Production Testing

**Required before going live**:
- ✅ DNS records configured and propagated
- ✅ Nginx configuration tested: `sudo nginx -t`
- ✅ Nginx reloaded: `sudo systemctl reload nginx`
- ✅ Backend running and accessible
- ✅ Test store exists with slug (e.g., "awesome")

**Test Checklist**:
1. ✅ DNS resolves: `dig awesome.shelfmerch.in`
2. ✅ Nginx serves frontend: `curl http://awesome.shelfmerch.in/`
3. ✅ Backend API works: `curl http://awesome.shelfmerch.in/api/health`
4. ✅ Store loads: Open `http://awesome.shelfmerch.in/` in browser
5. ✅ Routes work: Navigate to products, product detail, etc.
6. ✅ Direct refresh works: Refresh any page (no 404)

---

## 7. Security Prerequisites (Optional but Recommended)

### 7.1 SSL/HTTPS (Production Only)

**Recommended for production**:
- ✅ Wildcard SSL certificate: `*.shelfmerch.in`
- ✅ SSL certificate installed on server
- ✅ Nginx configured for HTTPS
- ✅ HTTP to HTTPS redirect configured

**Options**:
1. **Let's Encrypt** (Free, recommended):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d "*.shelfmerch.in" -d "shelfmerch.in"
   ```

2. **Commercial SSL Certificate**:
   - Purchase wildcard certificate
   - Install according to provider instructions

**Note**: SSL is optional. HTTP configuration works for development/internal networks.

### 7.2 CORS Configuration

**Already configured** in backend:
- ✅ CORS allows wildcard subdomains
- ✅ Development: Allows localhost
- ✅ Production: Allows `*.shelfmerch.in`

**Verify** in `backend/server.js` - CORS configuration includes wildcard subdomain support.

---

## 8. Checklist Summary

### Code ✅
- [x] Backend tenant resolution implemented
- [x] Frontend routing updated
- [x] Navigation helpers created
- [x] Redirect middleware added

### Infrastructure
- [ ] Domain name registered
- [ ] DNS records configured (A record + wildcard)
- [ ] Nginx installed
- [ ] Nginx configuration created
- [ ] Server firewall configured

### Configuration
- [ ] Backend `.env` configured (`BASE_DOMAIN`, `NODE_ENV`)
- [ ] Frontend `.env` configured (`VITE_BASE_DOMAIN`)
- [ ] Environment variables match actual domain

### Database
- [ ] Stores have `slug` field
- [ ] Test store exists with known slug
- [ ] Stores have `isActive: true`

### Deployment
- [ ] Frontend built (`npm run build`)
- [ ] Frontend build directory accessible to Nginx
- [ ] Backend running on configured port
- [ ] Backend `trust proxy` enabled (already in code)

### Testing
- [ ] DNS resolves correctly
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded/restarted
- [ ] Store loads on subdomain
- [ ] Routes work (home, products, product detail)
- [ ] Direct refresh works (no 404)
- [ ] API calls work correctly

### Optional (Production)
- [ ] SSL certificate obtained and installed
- [ ] HTTPS configured in Nginx
- [ ] HTTP to HTTPS redirect configured

---

## 9. Quick Start Guide

If you have all prerequisites, follow these steps:

1. **Configure DNS** (5 minutes)
   ```bash
   # Add DNS records in your DNS provider
   A       *.shelfmerch.in    <server-ip>
   A       shelfmerch.in      <server-ip>
   ```

2. **Set Environment Variables** (2 minutes)
   ```bash
   # Backend
   echo "BASE_DOMAIN=shelfmerch.in" >> backend/.env
   echo "NODE_ENV=production" >> backend/.env
   
   # Frontend
   echo "VITE_BASE_DOMAIN=shelfmerch.in" >> .env
   ```

3. **Build Frontend** (2 minutes)
   ```bash
   npm run build
   ```

4. **Configure Nginx** (5 minutes)
   ```bash
   sudo nano /etc/nginx/sites-available/shelfmerch
   # Paste configuration from NGINX_CONFIG.md
   # Update paths and ports
   sudo ln -s /etc/nginx/sites-available/shelfmerch /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Start Backend** (1 minute)
   ```bash
   cd backend
   npm start
   ```

6. **Test** (5 minutes)
   ```bash
   # Wait for DNS propagation (can take up to 48 hours, usually minutes)
   curl http://awesome.shelfmerch.in/
   # Open in browser and test routes
   ```

**Total Time**: ~20 minutes (excluding DNS propagation)

---

## 10. Troubleshooting

### DNS Not Resolving
- **Check**: `dig awesome.shelfmerch.in`
- **Fix**: Verify DNS records, wait for propagation (up to 48 hours)

### 404 on All Routes
- **Check**: Nginx `try_files` directive
- **Fix**: Ensure `try_files $uri $uri/ /index.html;` is in location block

### Backend Not Receiving Host Header
- **Check**: Nginx `proxy_set_header Host $host;`
- **Fix**: Verify this line exists in `/api` location block

### Store Not Found
- **Check**: Store exists with correct slug: `db.stores.find({ slug: "awesome" })`
- **Check**: Store is active: `isActive: true`
- **Fix**: Create/update store with correct slug

### Routes Work but API Fails
- **Check**: CORS configuration
- **Check**: Backend `trust proxy` enabled
- **Check**: Backend logs for errors

---

## Next Steps

Once prerequisites are met:
1. ✅ Review `NGINX_CONFIG.md` for Nginx setup
2. ✅ Review `TEST_CHECKLIST.md` for testing procedures
3. ✅ Deploy and test
4. ✅ Monitor logs for issues

**Need Help?**
- Check `SUBDOMAIN_REFACTOR_COMPLETE.md` for implementation details
- Check `LOCALHOST_SETUP.md` for local development setup


