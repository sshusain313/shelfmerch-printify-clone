import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { productApi } from '@/lib/api';
import { variantOptionsApi } from '@/lib/api';
import { getColorHex } from '@/config/productVariantOptions';
import { getFieldDefinitions, FieldDefinition } from '@/config/productFieldDefinitions';
import { categories } from '@/data/products';
import { Package } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


// Main categories (these are category-level, not subcategories)
const mainCategories = ['apparel', 'accessories', 'home', 'print', 'packaging', 'tech', 'jewelry'];

// Map category slugs to subcategory names (using new category structure)
const categorySlugToSubcategory: Record<string, string> = {
  // Apparel
  't-shirts': 'T-Shirt',
  'tank-tops': 'Tank Top',
  'hoodies': 'Hoodie',
  'sweatshirts': 'Sweatshirt',
  'jackets': 'Jacket',
  'crop-tops': 'Crop Top',
  'aprons': 'Apron',
  'scarves': 'Scarf',
  'jerseys': 'Jersey',

  // Accessories
  'tote-bag': 'Tote Bag',
  'caps': 'Cap',
  'phone-covers': 'Phone Cover',
  'gaming-pads': 'Gaming Pad',
  'beanies': 'Beanie',

  // Home & Living
  'cans': 'Can',
  'mugs': 'Mug',
  'drinkware': 'Mug',
  'cushions': 'Cushion',
  'frames': 'Frame',
  'coasters': 'Coaster',

  // Print Products
  'business-cards': 'Business Card',
  'books': 'Book',
  'id-cards': 'ID Card',
  'stickers': 'Sticker',
  'posters': 'Poster',
  'flyers': 'Flyer',
  'greeting-cards': 'Greeting Card',
  'billboards': 'Billboard',
  'magazines': 'Magazine',
  'brochures': 'Brochure',
  'lanyards': 'Lanyard',
  'banners': 'Banner',
  'canvas': 'Canvas',
  'notebooks': 'Notebook',
  'stationery': 'Notebook',

  // Packaging
  'boxes': 'Box',
  'tubes': 'Tube',
  'dropper-bottles': 'Dropper Bottle',
  'pouches': 'Pouch',
  'cosmetics': 'Cosmetic',
  'bottles': 'Bottle',

  // Tech
  'iphone-cases': 'IPhone',
  'laptop-skins': 'Lap Top',
  'ipad-cases': 'IPad',
  'macbook-cases': 'Macbook',
  'phone-cases': 'Phone',

  // Jewelry
  'rings': 'Ring',
  'necklaces': 'Necklace',
  'earrings': 'Earring',
};

const categorySlugToParentCategory: Record<string, any> = {
  // Apparel
  't-shirts': 'apparel',
  'tank-tops': 'apparel',
  'hoodies': 'apparel',
  'sweatshirts': 'apparel',
  'jackets': 'apparel',
  'crop-tops': 'apparel',
  'aprons': 'apparel',
  'scarves': 'apparel',
  'jerseys': 'apparel',

  // Accessories
  'tote-bag': 'accessories',
  'caps': 'accessories',
  'phone-covers': 'accessories',
  'gaming-pads': 'accessories',
  'beanies': 'accessories',

  // Home & Living
  'cans': 'home',
  'mugs': 'home',
  'drinkware': 'home',
  'cushions': 'home',
  'frames': 'home',
  'coasters': 'home',

  // Print
  'business-cards': 'print',
  'books': 'print',
  'id-cards': 'print',
  'stickers': 'print',
  'posters': 'print',
  'flyers': 'print',
  'greeting-cards': 'print',
  'billboards': 'print',
  'magazines': 'print',
  'brochures': 'print',
  'lanyards': 'print',
  'banners': 'print',
  'canvas': 'print',
  'notebooks': 'print',
  'stationery': 'print',

  // Packaging
  'boxes': 'packaging',
  'tubes': 'packaging',
  'dropper-bottles': 'packaging',
  'pouches': 'packaging',
  'cosmetics': 'packaging',
  'bottles': 'packaging',

  // Tech
  'iphone-cases': 'tech',
  'laptop-skins': 'tech',
  'ipad-cases': 'tech',
  'macbook-cases': 'tech',
  'phone-cases': 'tech',

  // Jewelry
  'rings': 'jewelry',
  'necklaces': 'jewelry',
  'earrings': 'jewelry',
};

const CategoryProducts = () => {
  const { slug } = useParams();

  // find the current category from static list
  const category = useMemo(
    () => categories.find((cat) => cat.slug === slug),
    [slug]
  );

  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState(null);

  const { categoryId } = useParams<{ categoryId: string }>();
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('popularity');
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<Record<string, { label: string, options: string[], type: string, fieldDef: FieldDefinition, hasProducts: Set<string> }>>({});

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});

  // Filter products based on selection
  const filteredProducts = useMemo(() => {
    if (selectedColors.length === 0 && selectedSizes.length === 0 && selectedTags.length === 0 && Object.keys(selectedAttributes).length === 0) {
      return products;
    }

    return products.filter((product: any) => {
      const matchesColor = selectedColors.length === 0 ||
        (product.availableColors && product.availableColors.some((c: string) => selectedColors.includes(c)));

      const matchesSize = selectedSizes.length === 0 ||
        (product.availableSizes && product.availableSizes.some((s: string) => selectedSizes.includes(s)));

      const matchesTags = selectedTags.length === 0 ||
        (product.catalogue?.tags && product.catalogue.tags.some((t: string) => selectedTags.includes(t)));

      // Check dynamic attributes (includes gender, brand, and all other attributes)
      const matchesAttributes = Object.entries(selectedAttributes).every(([key, values]) => {
        if (values.length === 0) return true;
        const productValue = product.catalogue?.attributes?.[key];
        // Handle both string and array values
        if (Array.isArray(productValue)) {
          return productValue.some((v: string) => values.includes(v));
        }
        return values.includes(productValue);
      });

      return matchesColor && matchesSize && matchesTags && matchesAttributes;
    });
  }, [products, selectedColors, selectedSizes, selectedTags, selectedAttributes]);

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleAttribute = (key: string, value: string) => {
    setSelectedAttributes(prev => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      // Clean up empty arrays
      if (newValues.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [key]: newValues };
    });
  };

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedTags([]);
    setSelectedAttributes({});
  };

  // Determine if slug is a main category or subcategory
  const isMainCategory = useMemo(() => {
    return mainCategories.includes(slug || '');
  }, [slug]);

  // derive subcategory EXACTLY once from slug + category
  const subcategory = useMemo(() => {
    if (!slug) return null;

    // If it's a main category, return null (we'll use category filter instead)
    if (isMainCategory) return null;

    // Map slug to subcategory name
    const mapped =
      (slug && categorySlugToSubcategory[slug]) ||
      category?.name ||
      slug;

    return mapped;
  }, [slug, category, isMainCategory]);

  useEffect(() => {
    if (!slug) {
      console.log('No slug provided, skipping');
      return;
    }

    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setError(null);

      try {
        // If it's a main category, fetch by category
        // If it's a subcategory, fetch by subcategory
        if (isMainCategory) {
          console.log('Fetching products for main category:', slug);

          const response = await productApi.getCatalogProducts({
            page: 1,
            limit: 100,
            category: slug, // Use category filter for main categories
          });

          console.log('API response for category:', slug, response);

          if (response && response.success && Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            setProducts([]);
          }
        } else if (subcategory) {
          console.log('Fetching products for subcategory:', subcategory);

          const response = await productApi.getCatalogProducts({
            page: 1,
            limit: 100,
            subcategory: subcategory, // Use subcategory filter for subcategories
          });

          console.log('API response for subcategory:', subcategory, response);

          if (response && response.success && Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [slug, subcategory, isMainCategory]);

  // Extract filter options from loaded products and field definitions
  useEffect(() => {
    // Determine parent category ID for field definitions
    let parentCategoryId: string | undefined = undefined;
    
    if (isMainCategory) {
      // For main categories, use the slug directly
      parentCategoryId = slug || undefined;
    } else {
      // For subcategories, look up the parent category
      // Try exact match first
      parentCategoryId = categorySlugToParentCategory[slug || ''];
      
      // If not found, try variations (singular/plural)
      if (!parentCategoryId && slug) {
        // Try adding 's' (e.g., 'hoodie' -> 'hoodies')
        const pluralSlug = slug + 's';
        parentCategoryId = categorySlugToParentCategory[pluralSlug];
        
        // Try removing 's' if it ends with 's' (e.g., 'hoodies' -> 'hoodie')
        if (!parentCategoryId && slug.endsWith('s')) {
          const singularSlug = slug.slice(0, -1);
          parentCategoryId = categorySlugToParentCategory[singularSlug];
        }
      }
      
      // If still not found, try to find by subcategory name
      if (!parentCategoryId && subcategory) {
        // Reverse lookup: find which parent category has this subcategory
        // First, try to find the slug that maps to this subcategory
        for (const [catSlug, mappedSubcategory] of Object.entries(categorySlugToSubcategory)) {
          if (mappedSubcategory === subcategory) {
            // Found the slug, now get its parent category
            parentCategoryId = categorySlugToParentCategory[catSlug];
            if (parentCategoryId) break;
          }
        }
        
      }
    }

    // Get field definitions - always fetch them regardless of products
    const fieldDefinitions = parentCategoryId
      ? getFieldDefinitions(parentCategoryId as any, subcategory ? [subcategory] : [])
      : [];
    
    // Debug logging
    if (fieldDefinitions.length === 0) {
      console.warn('No field definitions found', { parentCategoryId, slug, subcategory, isMainCategory });
    }

    // Initialize product-specific data
    const colorsMap = new Map();
    const sizesSet = new Set();
    const tagsSet = new Set();
    const attributesMap: Record<string, Set<string>> = {};

    // Initialize attributes map from field definitions
    fieldDefinitions.forEach(def => {
      attributesMap[def.key] = new Set();
    });

    // Extract data from products if available
    if (products && products.length > 0) {
      products.forEach((product: any) => {
        // Extract colors
        if (Array.isArray(product.availableColors)) {
          product.availableColors.forEach((colorName: string) => {
            if (!colorsMap.has(colorName)) {
              colorsMap.set(colorName, {
                id: colorName,
                value: colorName,
                colorHex: getColorHex(colorName)
              });
            }
          });
        }

        // Extract sizes
        if (Array.isArray(product.availableSizes)) {
          product.availableSizes.forEach((sizeName: string) => {
            sizesSet.add(sizeName);
          });
        }

        // Extract tags
        if (product.catalogue?.tags && Array.isArray(product.catalogue.tags)) {
          product.catalogue.tags.forEach((tag: string) => {
            tagsSet.add(tag);
          });
        }

        // Extract dynamic attributes from products
        fieldDefinitions.forEach(def => {
          const val = product.catalogue?.attributes?.[def.key];
          if (val !== undefined && val !== null && val !== '') {
            // Handle both string and array values
            if (Array.isArray(val)) {
              val.forEach((v: string) => {
                if (v) attributesMap[def.key].add(String(v));
              });
            } else {
              attributesMap[def.key].add(String(val));
            }
          }
        });
      });
    }

    // Convert to arrays and sort
    const colors = Array.from(colorsMap.values()).sort((a, b) => a.value.localeCompare(b.value));

    // Custom sort for sizes to keep them in logical order
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    const sizes = Array.from(sizesSet).map(size => ({
      id: size as string,
      value: size as string
    })).sort((a, b) => {
      const indexA = sizeOrder.indexOf(a.value);
      const indexB = sizeOrder.indexOf(b.value);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.value.localeCompare(b.value);
    });

    const tags = Array.from(tagsSet).sort() as string[];

    // Process attributes for display - include ALL field definitions
    const processedAttributes: Record<string, { label: string, options: string[], type: string, fieldDef: FieldDefinition, hasProducts: Set<string> }> = {};
    
    console.log('Processing field definitions:', {
      count: fieldDefinitions.length,
      definitions: fieldDefinitions.map(d => ({ key: d.key, label: d.label, type: d.type })),
      parentCategoryId,
      subcategory,
      productsCount: products?.length || 0
    });
    
    fieldDefinitions.forEach(def => {
      // For select fields, use all options from field definition
      // For other field types, use values found in products
      let options: string[] = [];
      
      if (def.type === 'select' && def.options && def.options.length > 0) {
        // Use all options from field definition for select fields
        options = [...def.options];
      } else {
        // For text/number/textarea, use values found in products
        options = Array.from(attributesMap[def.key] || []).sort();
      }

      // Track which options have products available
      const hasProducts = new Set<string>(attributesMap[def.key] || []);

      // Always show select fields if they have options
      // Show other field types only if they have values in products
      const isSelectWithOptions = def.type === 'select' && def.options && def.options.length > 0;
      const hasProductValues = options.length > 0;
      
      if (isSelectWithOptions || hasProductValues) {
        processedAttributes[def.key] = {
          label: def.label,
          options,
          type: def.type,
          fieldDef: def,
          hasProducts
        };
        console.log(`Added filter for ${def.key}:`, {
          label: def.label,
          type: def.type,
          optionsCount: options.length,
          hasProductsCount: hasProducts.size,
          isSelectWithOptions,
          hasProductValues
        });
      } else {
        console.log(`Skipped filter for ${def.key}:`, {
          label: def.label,
          type: def.type,
          isSelectWithOptions,
          hasProductValues,
          optionsCount: options.length
        });
      }
    });

    console.log('Final processed attributes:', Object.keys(processedAttributes));
    
    setAvailableColors(colors);
    setAvailableSizes(sizes);
    setAvailableTags(tags);
    setAvailableAttributes(processedAttributes);
  }, [products, slug, subcategory, isMainCategory]);

  // Format product data for display
  const formatProduct = (product: any) => {
    // Get brand from attributes (dynamic) or fallback to ShelfMerch
    const brand = product.catalogue?.attributes?.brand || 'ShelfMerch';

    return {
      id: product._id || product.id,
      name: product.catalogue?.name || 'Unnamed Product',
      image: product.galleryImages?.find((img: any) => img.isPrimary)?.url ||
        product.galleryImages?.[0]?.url ||
        '/placeholder.png',
      brand: brand,
      price: product.catalogue?.basePrice?.toFixed(2) || '0.00',
      badge: product.catalogue?.tags?.[0] || null,
      sizesCount: product.availableSizes?.length || 0,
      gendersCount: product.catalogue.attributes.gender?.length || 0,
      colorsCount: product.availableColors?.length || 0,
    };
  };

  const productsCount = products.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/products"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Products
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {category?.name || 'Category'}
          </h1>
          <p className="text-muted-foreground">
            {isLoadingProducts
              ? 'Loading products...'
              : `${productsCount} product${productsCount !== 1 ? 's' : ''} available`}
          </p>
          {error && (
            <p className="text-sm text-red-500 mt-1">
              {error}
            </p>
          )}
        </div>

        {/* Search (UI only for now) */}
        <div className="mb-8 max-w-md">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full"
          />
        </div>

        {/* Filters and Tags */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

                  {/* Dynamic Attributes from Field Definitions */}
                  {Object.entries(availableAttributes).map(([key, { label, options, type, fieldDef, hasProducts }]) => (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>{label}</span>
                          {fieldDef.unit && (
                            <span className="text-xs text-muted-foreground">({fieldDef.unit})</span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {type === 'select' && options.length > 0 ? (
                          <div className="space-y-2">
                            {options.map((option) => {
                              const isSelected = selectedAttributes[key]?.includes(option) || false;
                              const optionHasProducts = hasProducts.has(option);
                              return (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${key}-${option}`}
                                    checked={isSelected}
                                    onCheckedChange={() => toggleAttribute(key, option)}
                                    disabled={!optionHasProducts && products.length > 0}
                                  />
                                  <Label 
                                    htmlFor={`${key}-${option}`}
                                    className={`cursor-pointer flex-1 ${!optionHasProducts && products.length > 0 ? 'text-muted-foreground opacity-60' : ''}`}
                                  >
                                    {option}
                                    {!optionHasProducts && products.length > 0 && (
                                      <span className="text-xs ml-1">(0)</span>
                                    )}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        ) : type === 'text' || type === 'textarea' ? (
                          <div className="space-y-2">
                            {options.length > 0 ? (
                              options.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${key}-${option}`}
                                    checked={selectedAttributes[key]?.includes(option) || false}
                                    onCheckedChange={() => toggleAttribute(key, option)}
                                  />
                                  <Label htmlFor={`${key}-${option}`} className="cursor-pointer flex-1">
                                    {option}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No values available</p>
                            )}
                          </div>
                        ) : type === 'number' ? (
                          <div className="space-y-2">
                            {options.length > 0 ? (
                              options.map((option) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${key}-${option}`}
                                    checked={selectedAttributes[key]?.includes(option) || false}
                                    onCheckedChange={() => toggleAttribute(key, option)}
                                  />
                                  <Label htmlFor={`${key}-${option}`} className="cursor-pointer flex-1">
                                    {option} {fieldDef.unit || ''}
                                  </Label>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No values available</p>
                            )}
                          </div>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  ))}

                  <AccordionItem value="colors">
                    <AccordionTrigger>Colors</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.length > 0 ? (
                          availableColors.map((color) => {
                            const isSelected = selectedColors.includes(color.value);
                            return (
                              <div
                                key={color.id}
                                onClick={() => toggleColor(color.value)}
                                className={`w-8 h-8 rounded-full border cursor-pointer transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:ring-2 hover:ring-offset-2 hover:ring-primary/50'
                                  }`}
                                style={{ backgroundColor: color.colorHex || color.value }}
                                title={color.value}
                              />
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No colors available</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="sizes">
                    <AccordionTrigger>Sizes</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSizes.length > 0 ? (
                          availableSizes.map((size) => {
                            const isSelected = selectedSizes.includes(size.value);
                            return (
                              <div
                                key={size.id}
                                onClick={() => toggleSize(size.value)}
                                className={`border rounded-md py-1 text-center text-sm cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                                  }`}
                              >
                                {size.value}
                              </div>
                            );
                          })
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
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear all</Button>
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
              {availableTags.length > 0 ? (
                availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "secondary" : "outline"}
                      className={`rounded-full px-4 py-1.5 text-sm font-normal whitespace-nowrap cursor-pointer transition-colors ${isSelected
                        ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        : 'hover:bg-muted'
                        }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })
              ) : (
                <span className="text-sm text-muted-foreground italic px-2">No tags available</span>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid / Empty / Loading */}
        {isLoadingProducts && productsCount === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-card rounded-lg overflow-hidden border animate-pulse h-full"
              >
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {filteredProducts.map((product: any) => {
              const formattedProduct = formatProduct(product);
              return (
                <Link
                  key={formattedProduct.id}
                  to={`/products/${formattedProduct.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all h-full">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <img
                          src={formattedProduct.image}
                          alt={formattedProduct.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {formattedProduct.badge && (
                          <Badge className="absolute top-2 right-2">
                            {formattedProduct.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-sm text-muted-foreground mb-1">
                          {formattedProduct.brand}
                        </p>
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {formattedProduct.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{formattedProduct.sizesCount} sizes</span>
                          <span>•</span>
                          <span>{formattedProduct.colorsCount} colors</span>
                        </div>
                        <p className="text-lg font-bold text-primary mt-auto">
                          From ${formattedProduct.price}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              No products found matching your filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryProducts;
