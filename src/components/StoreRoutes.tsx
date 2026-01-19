/**
 * StoreRoutes Component
 * Handles routing for storefront pages with support for both:
 * - Subdomain-based routing: merch.shelfmerch.in/products
 * - Path-based routing (legacy/dev): shelfmerch.in/store/merch/products
 */

import { Routes, Route } from 'react-router-dom';
import { StoreAuthProvider } from '@/contexts/StoreAuthContext';
import StoreFrontendNew from '@/pages/StoreFrontendNew';
import StoreProductsPage from '@/pages/StoreProductsPage';
import StoreProductPage from '@/pages/StoreProductPage';
import StoreCheckoutPage from '@/pages/StoreCheckoutPage';
import StoreCustomerAccountPage from '@/pages/StoreCustomerAccountPage';
import StoreAuthPage from '@/pages/StoreAuthPage';
import { isTenantSubdomain } from '@/utils/tenantUtils';

/**
 * StoreRoutes - Conditionally renders routes based on routing mode
 * - Subdomain mode: Routes are relative (/, /products, /product/:id)
 * - Path mode: Routes are prefixed with /store/:subdomain
 */
export function StoreRoutes() {
  const isSubdomainMode = isTenantSubdomain();

  if (isSubdomainMode) {
    // Subdomain-based routing: routes are relative to root
    return (
      <Routes>
        <Route path="/" element={<StoreAuthProvider><StoreFrontendNew /></StoreAuthProvider>} />
        <Route path="/products" element={<StoreAuthProvider><StoreProductsPage /></StoreAuthProvider>} />
        <Route path="/auth" element={<StoreAuthProvider><StoreAuthPage /></StoreAuthProvider>} />
        <Route path="/account" element={<StoreAuthProvider><StoreCustomerAccountPage /></StoreAuthProvider>} />
        <Route path="/product/:productId" element={
          <StoreAuthProvider>
            <StoreProductPage />
          </StoreAuthProvider>
        } />
        <Route path="/checkout" element={<StoreAuthProvider><StoreCheckoutPage /></StoreAuthProvider>} />
      </Routes>
    );
  }

  // Path-based routing (legacy/dev): routes are prefixed with /store/:subdomain
  return (
    <Routes>
      <Route path="/store/:subdomain" element={<StoreAuthProvider><StoreFrontendNew /></StoreAuthProvider>} />
      <Route path="/store/:subdomain/products" element={<StoreAuthProvider><StoreProductsPage /></StoreAuthProvider>} />
      <Route path="/store/:subdomain/auth" element={<StoreAuthProvider><StoreAuthPage /></StoreAuthProvider>} />
      <Route path="/store/:subdomain/account" element={<StoreAuthProvider><StoreCustomerAccountPage /></StoreAuthProvider>} />
      <Route path="/store/:subdomain/product/:productId" element={
        <StoreAuthProvider>
          <StoreProductPage />
        </StoreAuthProvider>
      } />
      <Route path="/store/:subdomain/checkout" element={<StoreAuthProvider><StoreCheckoutPage /></StoreAuthProvider>} />
    </Routes>
  );
}

export default StoreRoutes;


