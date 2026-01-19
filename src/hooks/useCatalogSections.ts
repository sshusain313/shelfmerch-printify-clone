import { useQuery } from '@tanstack/react-query';
import { catalogProductsApi } from '@/lib/api';

export interface CatalogSectionProduct {
  id: string;
  name: string;
  latest: string;
  price: number;
  sizes: number;
  colors: number;
  imageUrl: string;
  tags: string[];
}

interface UseCatalogSectionsResult {
  best: CatalogSectionProduct[];
  hotNew: CatalogSectionProduct[];
  starter: CatalogSectionProduct[];
  kits: CatalogSectionProduct[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const deriveSections = (products: any[]): Omit<UseCatalogSectionsResult, 'isLoading' | 'isError' | 'refetch'> => {
  const mapProduct = (p: any): CatalogSectionProduct => {
    const tags: string[] = Array.isArray(p.tags) ? p.tags : Array.isArray(p.catalogue?.tags) ? p.catalogue.tags : [];

    // Use galleryImages primary image or first sample mockup as thumbnail
    const galleryImages = p.galleryImages || [];
    const primaryImage = galleryImages.find((img: any) => img.isPrimary) || galleryImages[0];
    const imageUrl: string = primaryImage?.url || '';

    // Derive a representative price from variants or basePrice
    const variants = p.variants || [];
    const variantPrices: number[] = variants
      .map((v: any) => (typeof v.price === 'number' ? v.price : undefined))
      .filter((v: any): v is number => typeof v === 'number');
    const basePrice = typeof p.basePrice === 'number' ? p.basePrice : typeof p.catalogue?.basePrice === 'number' ? p.catalogue.basePrice : undefined;
    const price = (variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice) ?? 0;

    // Sizes & colors counts from variants
    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    variants.forEach((v: any) => {
      if (v.size) sizeSet.add(String(v.size));
      if (v.color) colorSet.add(String(v.color));
    });

    return {
      id: String(p._id || p.id),
      name: p.name || p.catalogue?.name || '',
      latest: p.description || p.catalogue?.description || p.name || '',
      price,
      sizes: sizeSet.size || (Array.isArray(p.availableSizes) ? p.availableSizes.length : 0),
      colors: colorSet.size || (Array.isArray(p.availableColors) ? p.availableColors.length : 0),
      imageUrl,
      tags,
    };
  };

  const mapped = products.map(mapProduct);

  const hasTag = (product: CatalogSectionProduct, tag: string) =>
    product.tags?.some(t => t.toLowerCase() === tag.toLowerCase());

  const best = mapped.filter(p => hasTag(p, 'best'));
  const hotNew = mapped.filter(p => hasTag(p, 'hot-new') || hasTag(p, 'hot_new') || hasTag(p, 'new'));
  const starter = mapped.filter(p => hasTag(p, 'starter') || hasTag(p, 'essentials'));
  const kits = mapped.filter(p => hasTag(p, 'kit') || hasTag(p, 'bundle') || hasTag(p, 'exclusive-kit'));

  return { best, hotNew, starter, kits };
};

export const useCatalogSections = (): UseCatalogSectionsResult => {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['catalog-sections'],
    queryFn: async () => {
      const response = await catalogProductsApi.list({ page: 1, limit: 60, isActive: true });
      // catalogProductsApi.list returns ApiResponse-like structure; normalize to array
      const raw = (response as any)?.data || (response as any)?.products || response;
      return Array.isArray(raw) ? raw : [];
    },
  });

  const sections = deriveSections(data || []);

  return {
    ...sections,
    isLoading,
    isError,
    refetch,
  };
};
