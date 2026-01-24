import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/catalog/HeaderPlaceholder";
import SearchControls from "@/components/catalog/SearchControls";
import CategoryTabs from "@/components/catalog/CategoryTabs";
import BestProducts, { HotNewProducts, StarterEssentials, ExclusiveKits } from "@/components/catalog/BestProducts";
import Footer from "@/components/catalog/FooterPlaceholder";
import { mockProducts, categories } from '@/data/products';
import { productApi } from '@/lib/api';

// Helper to format product for the catalog components
const formatForCatalog = (product: any, isLatest = false) => {
    const brand = product.catalogue?.attributes?.brand || 'ShelfMerch';
    return {
        id: product._id || product.id,
        name: product.catalogue?.name || 'Unnamed Product',
        latest: isLatest ? (product.catalogue?.name || 'New Arrival') : (product.catalogue?.name || 'Product'),
        price: product.catalogue?.basePrice || 0,
        sizes: product.availableSizes?.length || 0,
        colors: product.availableColors?.length || 0,
        imageUrl: product.galleryImages?.find((img: any) => img.isPrimary)?.url ||
            product.galleryImages?.[0]?.url ||
            '/placeholder.png',
        // Include category/subcategory info for navigation
        categoryId: product.catalogue?.categoryId,
        subcategoryId: product.catalogue?.subcategoryIds?.[0] || product.catalogue?.subcategoryId,
        subcategoryIds: product.catalogue?.subcategoryIds || [],
    };
};

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<any[]>([]);
    const [bestProducts, setBestProducts] = useState<any[]>([]);
    const [newProducts, setNewProducts] = useState<any[]>([]);
    const [starterProducts, setStarterProducts] = useState<any[]>([]);
    const [kitProducts, setKitProducts] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Helper: slugify similar to CategorySidebar
    const slugify = (value: string): string => {
        return value
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    };

    // Known subcategory names from the catalogue sidebar
    const subcategoryNames: string[] = [
        // Apparel
        'T-shirts', 'Hoodies', 'Sweatshirts', 'Jackets', 'Crop Tops', 'Tank Tops',
        // Accessories
        'Tote Bags', 'Caps', 'Phone Covers', 'Gaming Pads', 'Beanies',
        // Home & Living
        'Mugs', 'Cushions', 'Cans', 'Frames', 'Coasters',
        // Print Products
        'Business Cards', 'Books', 'ID Cards', 'Stickers', 'Posters', 'Flyers', 'Greeting Cards', 'Billboards', 'Magazines', 'Brochures', 'Lanyards', 'Banners', 'Canvas', 'Notebooks',
        // Packaging
        'Boxes', 'Tubes', 'Bottles', 'Pouch', 'Cosmetics',
        // Tech
        'IPhone Cases', 'Lap Top Cases', 'IPad Cases', 'Macbook Cases', 'Phone Cases',
        // Jewelry
        'Rings', 'Necklaces', 'Earrings', 'Bracelets',
    ];

    const resolveSubcategorySlugFromSearch = (term: string): string | null => {
        const q = term.toLowerCase().trim();
        if (!q) return null;

        for (const name of subcategoryNames) {
            const normName = name.toLowerCase().trim();

            // Basic exact match
            if (q === normName) {
                return slugify(name);
            }

            // Allow simple singular/plural variations (e.g. "t-shirt" vs "t-shirts")
            const noDash = normName.replace(/-/g, ' ');
            if (q === noDash || q === noDash.replace(/s\b/, '') || (q + 's') === noDash) {
                return slugify(name);
            }
        }

        return null;
    };

    const getSubcategorySlugFromProduct = (product: any): string | null => {
        const catalogue = product?.catalogue || {};
        const fromArray = Array.isArray(catalogue.subcategoryIds) && catalogue.subcategoryIds[0];
        const fromSingle = catalogue.subcategoryId;
        const slug = fromArray || fromSingle;
        return typeof slug === 'string' && slug.trim() ? slug : null;
    };

    // Fetch initial data
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await productApi.getCatalogProducts({ page: 1, limit: 24 });
                if (response && response.success && response.data) {
                    const allProducts = response.data;
                    setProducts(allProducts);

                    // Distribute products to different sections for demo purposes
                    // In a real app, these might come from specific endpoints
                    setBestProducts(allProducts.slice(0, 6).map(p => formatForCatalog(p)));
                    setNewProducts(allProducts.slice(6, 12).map(p => formatForCatalog(p, true)));
                    setStarterProducts(allProducts.slice(12, 18).map(p => formatForCatalog(p)));
                    setKitProducts(allProducts.slice(18, 24).map(p => formatForCatalog(p)));
                }
            } catch (error) {
                console.error('Failed to fetch products:', error);
                // Fallback to mock products
                const mocks = mockProducts.map(p => ({
                    ...p,
                    catalogue: { 
                        name: p.name, 
                        basePrice: p.price, 
                        tags: p.badge ? [p.badge] : [],
                        categoryId: p.category
                    },
                    galleryImages: [{ url: p.image, isPrimary: true }],
                    availableSizes: p.sizes || [],
                    availableColors: p.colors || []
                }));

                setBestProducts(mocks.slice(0, 4).map(p => formatForCatalog(p)));
                setNewProducts(mocks.slice(0, 4).map(p => formatForCatalog(p, true)));
                setStarterProducts(mocks.slice(0, 4).map(p => formatForCatalog(p)));
                setKitProducts(mocks.slice(0, 4).map(p => formatForCatalog(p)));
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleSearch = async () => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        // 1) Exact subcategory match from known subcategories
        const directSubcategorySlug = resolveSubcategorySlugFromSearch(trimmed);
        if (directSubcategorySlug) {
            navigate(`/products/category/${directSubcategorySlug}?search=${encodeURIComponent(trimmed)}`);
            return;
        }

        setIsLoading(true);
        try {
            // 2) Use backend search to infer relevant subcategory from results
            const response = await productApi.getCatalogProducts({
                page: 1,
                limit: 24,
                search: trimmed,
            });

            if (response && response.success && Array.isArray(response.data) && response.data.length > 0) {
                const firstProduct = response.data[0];
                const inferredSlug = getSubcategorySlugFromProduct(firstProduct);

                if (inferredSlug) {
                    navigate(`/products/category/${inferredSlug}?search=${encodeURIComponent(trimmed)}`);
                    return;
                }

                // Fallback: keep current page and update sections with search results
                const results = response.data.map((p: any) => formatForCatalog(p));
                setBestProducts(results.slice(0, 6));
                setNewProducts(results.slice(6, 12));
                setStarterProducts(results.slice(12, 18));
                setKitProducts(results.slice(18, 24));
            } else {
                // No results – clear sections
                setBestProducts([]);
                setNewProducts([]);
                setStarterProducts([]);
                setKitProducts([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <SearchControls
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearchSubmit={handleSearch}
            />

            <main className="container pb-16">
                <CategoryTabs />

                {/* Sections with IDs for smooth scrolling */}
                <BestProducts products={bestProducts} id="section-best-products" />
                <HotNewProducts products={newProducts} id="section-hot-new" />
                {/* <StarterEssentials products={starterProducts} /> */}
                {/* <ExclusiveKits products={kitProducts} /> */}
            </main>

            <Footer />
        </div>
    );
};

export default Products;