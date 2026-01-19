import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { productApi, variantOptionsApi } from '@/lib/api';
import { Search, ArrowLeft, Filter } from 'lucide-react';
import { CATEGORIES, CategoryId, getSubcategories } from '@/config/productCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Helper to convert subcategory name to slug
const toSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and');
};

const CategorySubcategories = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('popularity');
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);

  // Get category info
  const category = useMemo(() => {
    if (!categoryId) return null;
    return CATEGORIES[categoryId as CategoryId];
  }, [categoryId]);

  // Get subcategories for this category
  const subcategories = useMemo(() => {
    if (!categoryId) return [];
    const subList = getSubcategories(categoryId as CategoryId);
    return subList.map(name => ({
      name,
      slug: toSlug(name)
    }));
  }, [categoryId]);

  // Fetch latest product for each subcategory
  useEffect(() => {
    if (!categoryId || subcategories.length === 0) return;

    const fetchCategoryProducts = async () => {
      setIsLoading(true);
      const subcategoryMap: Record<string, any> = {};

      try {
        await Promise.all(
          subcategories.map(async (subcategory) => {
            try {
              const response = await productApi.getCatalogProducts({
                page: 1,
                limit: 1,
                category: categoryId, // Fetch from specified category
                subcategory: subcategory.name
              });

              if (response && response.success && response.data && response.data.length > 0) {
                subcategoryMap[subcategory.slug] = response.data[0];
              }
            } catch (error) {
              console.error(`Failed to fetch products for subcategory ${subcategory.slug}:`, error);
            }
          })
        );

        setCategoryProducts(subcategoryMap);
      } catch (error) {
        console.error(`Failed to fetch ${categoryId} products:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId, subcategories]);

  // Filter and Sort subcategories
  const sortedSubcategories = useMemo(() => {
    let result = subcategories.filter((subcategory) =>
      subcategory.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return result.sort((a, b) => {
      const productA = categoryProducts[a.slug];
      const productB = categoryProducts[b.slug];

      // If one is missing product data, push it to the end
      if (!productA && !productB) return 0;
      if (!productA) return 1;
      if (!productB) return -1;

      switch (sortOption) {
        case 'price-low':
          return (productA.catalogue?.basePrice || 0) - (productB.catalogue?.basePrice || 0);
        case 'price-high':
          return (productB.catalogue?.basePrice || 0) - (productA.catalogue?.basePrice || 0);
        case 'newest':
          // Fallback to name if createdAt is missing, or implement proper date parsing
          return (productB.createdAt || '').localeCompare(productA.createdAt || '');
        case 'popularity':
        default:
          return 0; // Keep default order
      }
    });
  }, [subcategories, searchQuery, categoryProducts, sortOption]);

  // If no category found, show error
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Category Not Found</h1>
            <p className="text-muted-foreground mb-4">The requested category does not exist.</p>
            <Link to="/products" className="text-primary hover:underline">
              Back to Products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Header Section */}
        <div className="mb-8 space-y-6">
          {/* Breadcrumbs */}
          {/* <div className="text-sm text-muted-foreground">
            <Link to="/products" className="hover:text-primary">Catalog</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{category.name}</span>
          </div> */}

          {/* Title and Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="font-heading text-4xl font-semibold">{category.name}</h1>

            <div className="relative flex-1 max-w-4xl mx-auto sm:mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`Search ${category.name.toLowerCase()}...`}
                className="w-full pl-14 pr-4 py-4 text-base sm:text-lg border border-input/40 rounded-lg bg-[#ECECE9] shadow-sm hover:shadow-md hover:border-primary/30 focus:shadow-lg focus:outline-none transition-all duration-300 placeholder:text-muted-foreground/60"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by</span>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Banner */}
          <div className="relative w-full h-[300px] rounded-xl overflow-hidden group">
            <img
              src="/embroidary.png"
              alt="Embroidery Banner"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Filters and Tags */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] px-6">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="category">
                      <AccordionTrigger>Category</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="cat-1" />
                            <Label htmlFor="cat-1">Men's Clothing</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="cat-2" />
                            <Label htmlFor="cat-2">Women's Clothing</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="colors">
                      <AccordionTrigger>Colors</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2">
                          {availableColors.length > 0 ? (
                            availableColors.map((color) => (
                              <div
                                key={color.id}
                                className="w-8 h-8 rounded-full border cursor-pointer hover:ring-2 ring-offset-2 ring-primary"
                                style={{ backgroundColor: color.colorHex || color.value }}
                                title={color.value}
                              />
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No colors available</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="branding">
                      <AccordionTrigger>Branding</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="brand-1" />
                            <Label htmlFor="brand-1">Neck labels</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="brand-2" />
                            <Label htmlFor="brand-2">Sleeve printing</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="print-area">
                      <AccordionTrigger>Print area</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="print-1" />
                            <Label htmlFor="print-1">Front</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="print-2" />
                            <Label htmlFor="print-2">Back</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="large-embroidery">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          Large embroidery
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-blue-600 bg-blue-50">New</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="le-1" />
                            <Label htmlFor="le-1">Available</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="providers">
                      <AccordionTrigger>Providers</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="prov-1" />
                            <Label htmlFor="prov-1">Printify</Label>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sizes">
                      <AccordionTrigger>Sizes</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSizes.length > 0 ? (
                            availableSizes.map((size) => (
                              <div key={size.id} className="border rounded-md py-1 text-center text-sm cursor-pointer hover:bg-muted">
                                {size.value}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground col-span-4">No sizes available</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </ScrollArea>
                <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
                  <div className="flex w-full gap-2">
                    <SheetClose asChild>
                      <Button variant="outline" className="flex-1">Clear all</Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button className="flex-1">Show results</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="flex-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-secondary/80">
                  Large embroidery <span className="ml-1 text-xs font-bold text-blue-600">New</span>
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-muted">
                  Lowest price
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-muted">
                  Lowest shipping
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-muted">
                  Gift messages
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-muted">
                  Easy mockups
                </Badge>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer hover:bg-muted">
                  Packing inserts
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        {searchQuery && sortedSubcategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No subcategories found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-green">
            {sortedSubcategories.map((subcategory) => {
              const latestProduct = categoryProducts[subcategory.slug];
              const productImage = latestProduct?.galleryImages?.find((img: any) => img.isPrimary)?.url ||
                latestProduct?.galleryImages?.[0]?.url ||
                'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';

              return (
                <Link
                  key={subcategory.name}
                  to={`/products/category/${subcategory.slug}`}
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
                              alt={latestProduct ? latestProduct.catalogue?.name || subcategory.name : subcategory.name}
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
                        <h3 className="font-medium text-sm">{subcategory.name}</h3>
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

        {/* Subcategory Count */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {sortedSubcategories.length} of {subcategories.length} {category.name.toLowerCase()} subcategories
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CategorySubcategories;
