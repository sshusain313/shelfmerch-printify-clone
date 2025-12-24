import { STORE_BASE_URL } from '@/config';

export const getStoreUrl = (subdomain: string) => {
  // Localhost → route-based store
  if (STORE_BASE_URL.includes('localhost')) {
    return `${STORE_BASE_URL}/store/${subdomain}`;
  }

  // Production → subdomain-based store
  const hostname = new URL(STORE_BASE_URL).hostname;
  return `https://${subdomain}.${hostname}`;
};
