# Localhost Setup Guide

## ✅ Option 1: Path-Based (Works Out of the Box - RECOMMENDED)

**No configuration needed!** The implementation automatically falls back to path parameters on localhost.

### Usage:
```
http://localhost:8080/store/xyz
http://localhost:8080/store/xyz/products
http://localhost:8080/store/xyz/product/123
```

### How it works:
1. Backend detects `localhost` in hostname → returns `null` from subdomain extraction
2. Middleware falls back to `req.params.slug` or `req.params.subdomain`
3. Works exactly as before - **no breaking changes**

## 🎯 Option 2: Localhost Subdomains (Optional)

If you want to test subdomain-based routing on localhost, you can use `*.localhost` subdomains.

### Windows Setup:

1. **Edit hosts file** (Run Notepad as Administrator):
   ```
   C:\Windows\System32\drivers\etc\hosts
   ```

2. **Add entries** (one per store you want to test):
   ```
   127.0.0.1 xyz.localhost
   127.0.0.1 myshop.localhost
   127.0.0.1 tests-store.localhost
   ```

3. **Access stores**:
   ```
   http://xyz.localhost:8080
   http://myshop.localhost:8080
   ```

### macOS/Linux Setup:

1. **Edit hosts file** (requires sudo):
   ```bash
   sudo nano /etc/hosts
   ```

2. **Add entries**:
   ```
   127.0.0.1 xyz.localhost
   127.0.0.1 myshop.localhost
   127.0.0.1 tests-store.localhost
   ```

3. **Access stores**:
   ```
   http://xyz.localhost:8080
   http://myshop.localhost:8080
   ```

### Important Notes:

- **Modern browsers** (Chrome, Edge, Firefox) automatically resolve `*.localhost` to `127.0.0.1` - you may not need hosts file edits!
- Test with: `http://xyz.localhost:8080` - if it works, you're good!
- If it doesn't work, add the hosts file entries above

## Testing Checklist

### Path-Based (No Setup Needed):
```bash
# Backend
curl http://localhost:5000/api/stores/by-subdomain/xyz

# Frontend
# Navigate to: http://localhost:8080/store/xyz
```

### Subdomain-Based (Optional):
```bash
# Backend
curl -H "Host: xyz.localhost" http://localhost:5000/api/stores/by-subdomain

# Frontend
# Navigate to: http://xyz.localhost:8080
```

## Recommendation

**For development, use Option 1 (path-based)**:
- ✅ No configuration needed
- ✅ Works immediately
- ✅ Easier to share URLs with team
- ✅ No browser/DNS issues

**Option 2 is only needed if**:
- You want to test exact production behavior
- You're testing subdomain-specific features
- You want to verify CORS/cookie behavior with subdomains

## Summary

**The implementation works on localhost by default using path-based routing.** No additional setup is required for development. Subdomain support on localhost is optional and only needed for testing production-like behavior.

