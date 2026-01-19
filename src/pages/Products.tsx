import { useState, useEffect } from 'react';
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
    };
};

const Products = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [bestProducts, setBestProducts] = useState<any[]>([]);
    const [newProducts, setNewProducts] = useState<any[]>([]);
    const [starterProducts, setStarterProducts] = useState<any[]>([]);
    const [kitProducts, setKitProducts] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                    catalogue: { name: p.name, basePrice: parseFloat(p.price), tags: [p.badge] },
                    galleryImages: [{ url: p.image, isPrimary: true }],
                    availableSizes: Array(p.sizesCount).fill('M'),
                    availableColors: Array(p.colorsCount).fill('Black')
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
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        try {
            const response = await productApi.getCatalogProducts({
                page: 1,
                limit: 24,
                search: searchQuery
            });
            if (response && response.success && response.data) {
                const results = response.data.map(p => formatForCatalog(p));
                // Update all sections with search results or show a specific search results section
                // For this layout, we'll update the "Best Products" and maybe others
                setBestProducts(results.slice(0, 6));
                setNewProducts(results.slice(6, 12));
                setStarterProducts(results.slice(12, 18));
                setKitProducts(results.slice(18, 24));
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

                {/* Sections */}
                <BestProducts products={bestProducts} />
                <HotNewProducts products={newProducts} />
                {/* <StarterEssentials products={starterProducts} /> */}
                {/* <ExclusiveKits products={kitProducts} /> */}
            </main>

            <Footer />
        </div>
    );
};

export default Products;