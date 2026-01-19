/**
 * TenantRoute Component
 * Wrapper for routes that can work with both subdomain and path-based tenant resolution
 * Automatically extracts tenant slug from hostname or path params
 */

import { useParams, useLocation } from 'react-router-dom';
import { getTenantSlugFromLocation } from '@/utils/tenantUtils';
import { ReactNode } from 'react';

interface TenantRouteProps {
  children: ReactNode;
  /**
   * Optional callback when tenant is resolved
   */
  onTenantResolved?: (tenantSlug: string | null) => void;
}

/**
 * TenantRoute - Wrapper component that provides tenant context
 * Works with both subdomain-based and path-based routing
 */
export function TenantRoute({ children, onTenantResolved }: TenantRouteProps) {
  const params = useParams();
  const location = useLocation();
  
  // Get tenant slug from location (subdomain or path)
  const tenantSlug = getTenantSlugFromLocation(location, params);
  
  // Callback if provided
  if (onTenantResolved && tenantSlug) {
    onTenantResolved(tenantSlug);
  }
  
  return <>{children}</>;
}

export default TenantRoute;


