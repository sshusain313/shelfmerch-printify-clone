import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { categories } from '@/data/products';
import { productApi } from '@/lib/api';
import { Search, ArrowLeft } from 'lucide-react';

// Map category slugs to subcategory names
const categorySlugToSubcategory: Record<string, string> = {
  // Apparel
  't-shirts': 'T-Shirt',
  'tank-tops': 'Tank Top',
  'hoodies': 'Hoodie',
  'sweatshirts': 'Sweatshirt',
  'jackets': 'Jacket',
  'crop-tops': 'Crop Top',
  
  // Accessories
  'bags': 'Tote Bag',
  'caps': 'Cap',
  'phone-covers': 'Phone Cover',
  'beanies': 'Beanie',
  
  // Home & Living
  'mugs': 'Mug',
  'cushions': 'Cushion',
  'frames': 'Frame',
  'coasters': 'Coaster',
  
  // Print Products
  'notebooks': 'Notebook',
  'posters': 'Poster',
  'stickers': 'Sticker',
  'business-cards': 'Business Card',
  
  // Tech
  'iphone-cases': 'IPhone',
  'laptop-skins': 'Lap Top',
  
  // Packaging
  'boxes': 'Box',
  'bottles': 'Bottle',
  
  // Jewelry
  'rings': 'Ring',
  'necklaces': 'Necklace',
};

const AllCategories = () => {
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch latest product for each category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setIsLoading(true);
      const categoryMap: Record<string, any> = {};
      
      try {
        await Promise.all(
          categories.map(async (category) => {
            try {
              const subcategory = categorySlugToSubcategory[category.slug] || category.name;
              const response = await productApi.getCatalogProducts({
                page: 1,
                limit: 1,
                subcategory: subcategory
              });
              
              if (response && response.success && response.data && response.data.length > 0) {
                categoryMap[category.slug] = response.data[0];
              }
            } catch (error) {
              console.error(`Failed to fetch products for category ${category.slug}:`, error);
            }
          })
        );
        
        setCategoryProducts(categoryMap);
      } catch (error) {
        console.error('Failed to fetch category products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, []);

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
          <h1 className="font-heading text-4xl font-bold mb-2">All Categories</h1>
          <p className="text-muted-foreground">
            Browse through all {categories.length} product categories available in our catalog
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Grid */}
        {searchQuery && filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No categories found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredCategories.map((category) => {
              const latestProduct = categoryProducts[category.slug];
              const productImage = latestProduct?.galleryImages?.find((img: any) => img.isPrimary)?.url || 
                                   latestProduct?.galleryImages?.[0]?.url || 
                                   category.image;
              
              return (
                <Link
                  key={category.name}
                  to={`/products/category/${category.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-elevated transition-shadow h-full">
                    <CardContent className="p-0">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {isLoading ? (
                          <Skeleton className="w-full h-full" />
                        ) : (
                          <>
                            <img 
                              src={productImage} 
                              alt={latestProduct ? latestProduct.catalogue?.name || category.name : category.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {latestProduct && (
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            )}
                            {latestProduct && (
                              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-white text-xs font-medium line-clamp-1 drop-shadow-lg">
                                  {latestProduct.catalogue?.name || 'Latest Product'}
                                </p>
                                <p className="text-white/90 text-xs drop-shadow-lg">
                                  ${latestProduct.catalogue?.basePrice?.toFixed(2) || '0.00'}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <h3 className="font-medium text-sm">{category.name}</h3>
                        {latestProduct && !isLoading && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {latestProduct.catalogue?.name || 'New Product'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Category Count */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AllCategories;

