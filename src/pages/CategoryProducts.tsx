import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Filter, ChevronDown, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productApi } from '@/lib/api';
import { variantOptionsApi } from '@/lib/api';
import { getColorHex } from '@/config/productVariantOptions';
import { getFieldDefinitions, FieldDefinition, FIELD_DEFINITIONS } from '@/config/productFieldDefinitions';
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
  // Real color options and hex codes from backend
  const [colorOptionsFromDB, setColorOptionsFromDB] = useState<Array<{ value: string; colorHex?: string }>>([]);
  const [colorHexMapFromDB, setColorHexMapFromDB] = useState<Record<string, string>>({});
  const [colorsWithHex, setColorsWithHex] = useState<Array<{ value: string; colorHex?: string }>>([]);
  // Map of product ID -> color name -> colorHex from variants
  const [productColorHexMap, setProductColorHexMap] = useState<Record<string, Record<string, string>>>({});

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

           // Build available colors with hex from variants returned by backend
           const variants: Array<any> = Array.isArray(response.data.variants) ? response.data.variants : [];
           const colorMapUnique: Record<string, string | undefined> = {};
           variants.forEach((v) => {
             if (v && typeof v.color === 'string') {
               const key = v.color;
               if (colorMapUnique[key] === undefined) {
                 colorMapUnique[key] = v.colorHex || undefined;
               }
             }
           });
           const colorsArr = Object.entries(colorMapUnique).map(([value, hex]) => ({ value, colorHex: hex || getColorHex(value) }));
           setColorsWithHex(colorsArr);

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

  // Store parent category ID for use in other hooks
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>(undefined);

  // Fetch real color options (and hex) from backend for this category/subcategory
  useEffect(() => {
    const fetchColorOptions = async () => {
      if (!parentCategoryId) return;
      try {
        const resp = await variantOptionsApi.getAll({
          categoryId: parentCategoryId,
          subcategoryId: subcategory || undefined,
          optionType: 'color',
        });
        if (resp && (resp as any).success !== false && Array.isArray((resp as any).data)) {
          const colors = (resp as any).data
            .filter((opt: any) => opt.optionType === 'color')
            .map((opt: any) => ({ value: opt.value as string, colorHex: opt.colorHex as string | undefined }));
          const hexMap: Record<string, string> = {};
          colors.forEach(c => { if (c.colorHex) hexMap[c.value] = c.colorHex; });
          setColorOptionsFromDB(colors);
          setColorHexMapFromDB(hexMap);
        } else {
          setColorOptionsFromDB([]);
          setColorHexMapFromDB({});
        }
      } catch (e) {
        console.warn('Failed to fetch color options for filters:', e);
        setColorOptionsFromDB([]);
        setColorHexMapFromDB({});
      }
    };
    fetchColorOptions();
  }, [parentCategoryId, subcategory]);

  // Extract filter options from loaded products and field definitions
  useEffect(() => {
    // Determine parent category ID for field definitions
    let categoryId: string | undefined = undefined;
    
    if (isMainCategory) {
      // For main categories, use the slug directly
      categoryId = slug || undefined;
    } else {
      // For subcategories, look up the parent category
      // Try exact match first
      categoryId = categorySlugToParentCategory[slug || ''];
      
      // If not found, try variations (singular/plural)
      if (!categoryId && slug) {
        // Try adding 's' (e.g., 'hoodie' -> 'hoodies')
        const pluralSlug = slug + 's';
        categoryId = categorySlugToParentCategory[pluralSlug];
        
        // Try removing 's' if it ends with 's' (e.g., 'hoodies' -> 'hoodie')
        if (!categoryId && slug.endsWith('s')) {
          const singularSlug = slug.slice(0, -1);
          categoryId = categorySlugToParentCategory[singularSlug];
        }
      }
      
      // If still not found, try to find by subcategory name
      if (!categoryId && subcategory) {
        // Reverse lookup: find which parent category has this subcategory
        // First, try to find the slug that maps to this subcategory
        for (const [catSlug, mappedSubcategory] of Object.entries(categorySlugToSubcategory)) {
          if (mappedSubcategory === subcategory) {
            // Found the slug, now get its parent category
            categoryId = categorySlugToParentCategory[catSlug];
            if (categoryId) break;
          }
        }
        
      }
    }

    // Update parent category ID state
    setParentCategoryId(categoryId);

    // Get field definitions - always fetch them regardless of products
    const fieldDefinitions = categoryId
      ? getFieldDefinitions(categoryId as any, subcategory ? [subcategory] : [])
      : [];
    
    // Also get subcategory-specific attributes directly from bySubcategory
    let subcategorySpecificAttributes: FieldDefinition[] = [];
    if (categoryId && subcategory && FIELD_DEFINITIONS[categoryId as keyof typeof FIELD_DEFINITIONS]) {
      const categoryDef = FIELD_DEFINITIONS[categoryId as keyof typeof FIELD_DEFINITIONS];
      if (categoryDef.bySubcategory && categoryDef.bySubcategory[subcategory]) {
        subcategorySpecificAttributes = categoryDef.bySubcategory[subcategory];
      }
    }
    
    // Debug logging
    if (fieldDefinitions.length === 0) {
      console.warn('No field definitions found', { categoryId, slug, subcategory, isMainCategory });
    }

    // Initialize product-specific data
    const colorsMap = new Map();
    const sizesSet = new Set();
    const tagsSet = new Set();
    const attributesMap: Record<string, Set<string>> = {};

    // Initialize attributes map from field definitions (including subcategory-specific)
    fieldDefinitions.forEach(def => {
      attributesMap[def.key] = new Set();
    });
    
    // Also initialize from subcategory-specific attributes
    subcategorySpecificAttributes.forEach(def => {
      if (!attributesMap[def.key]) {
        attributesMap[def.key] = new Set();
      }
    });

    // Seed with backend color options first so filters show real colors even before products load
    if (colorOptionsFromDB.length > 0) {
      colorOptionsFromDB.forEach((opt) => {
        if (!colorsMap.has(opt.value)) {
          colorsMap.set(opt.value, {
            id: opt.value,
            value: opt.value,
            colorHex: opt.colorHex || getColorHex(opt.value),
          });
        }
      });
    }

    // Extract data from products if available, merging with DB colors
    // Also build product-specific colorHex map for display
    const productColorHexMapLocal: Record<string, Record<string, string>> = {};
    
    if (products && products.length > 0) {
      products.forEach((product: any) => {
        const productId = product._id || product.id;
        const productColorMap: Record<string, string> = {};
        
        // Extract colors from product variants (with colorHex) or availableColors
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any) => {
            if (variant.color) {
              const colorHex = variant.colorHex || getColorHex(variant.color);
              // Store in product-specific map
              productColorMap[variant.color] = colorHex;
              
              // Also add to global colorsMap for filters
              if (!colorsMap.has(variant.color)) {
                colorsMap.set(variant.color, {
                  id: variant.color,
                  value: variant.color,
                  colorHex: colorHex,
                });
              }
            }
          });
        } else if (Array.isArray(product.availableColors)) {
          product.availableColors.forEach((colorName: string) => {
            const colorHex = getColorHex(colorName);
            // Store in product-specific map
            productColorMap[colorName] = colorHex;
            
            // Also add to global colorsMap for filters
            if (!colorsMap.has(colorName)) {
              colorsMap.set(colorName, {
                id: colorName,
                value: colorName,
                colorHex: colorHex,
              });
            }
          });
        }
        
        // Store product color map
        if (productId && Object.keys(productColorMap).length > 0) {
          productColorHexMapLocal[productId] = productColorMap;
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

        // Extract dynamic attributes from products (all field definitions + subcategory-specific)
        const allFieldDefs = [...fieldDefinitions, ...subcategorySpecificAttributes];
        allFieldDefs.forEach(def => {
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
    
    // Update product color hex map state
    setProductColorHexMap(productColorHexMapLocal);

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

    // Process attributes for display - prioritize subcategory-specific attributes from bySubcategory
    const processedAttributes: Record<string, { label: string, options: string[], type: string, fieldDef: FieldDefinition, hasProducts: Set<string> }> = {};
    
    // First, process subcategory-specific attributes (these are unique to the subcategory from bySubcategory)
    subcategorySpecificAttributes.forEach(def => {
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
      }
    });
    
    // Then, process all other field definitions (common + any remaining fields)
    fieldDefinitions.forEach(def => {
      // Skip if already processed (subcategory-specific takes priority)
      if (processedAttributes[def.key]) return;
      
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

  const productsCount = filteredProducts.length;
  const totalProductsCount = products.length;

  // Get parent category ID for subcategory options
  const parentCategoryIdForSubcats = useMemo(() => {
    if (isMainCategory) return slug;
    return categorySlugToParentCategory[slug || ''] || undefined;
  }, [slug, isMainCategory]);

  // Get subcategories for category filter buttons
  const subcategoryOptions = useMemo(() => {
    if (!parentCategoryIdForSubcats) return [];
    
    // Get subcategories from categorySlugToSubcategory that belong to this parent
    const subcats: string[] = [];
    Object.entries(categorySlugToSubcategory).forEach(([catSlug, subcatName]) => {
      if (categorySlugToParentCategory[catSlug] === parentCategoryIdForSubcats) {
        if (!subcats.includes(subcatName)) {
          subcats.push(subcatName);
        }
      }
    });
    return subcats;
  }, [parentCategoryIdForSubcats]);

  // Derive category name with fallbacks (after isMainCategory, subcategory, and parentCategoryId are defined)
  const categoryName = useMemo(() => {
    // First try to get from static category list
    if (category?.name) return category.name;
    
    // If it's a main category, format the slug
    if (isMainCategory && slug) {
      return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    // If we have a subcategory, try to get parent category name
    if (subcategory && parentCategoryId) {
      const parentCategoryNames: Record<string, string> = {
        'apparel': 'Apparel',
        'accessories': 'Accessories',
        'home': 'Home & Living',
        'print': 'Print',
        'packaging': 'Packaging',
        'tech': 'Tech',
        'jewelry': 'Jewelry'
      };
      return parentCategoryNames[parentCategoryId] || parentCategoryId;
    }
    
    // Fallback: format slug
    if (slug) {
      return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    return 'Category';
  }, [category, slug, isMainCategory, subcategory, parentCategoryId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="w-full">
        {/* Breadcrumb */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <Link to="/products" className="hover:text-foreground">Catalogue</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{categoryName}</span>
              {subcategory && !isMainCategory && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-foreground">{subcategory}</span>
                </>
              )}
            </div>
            
            <div className="relative flex-1 max-w-3xl mx-auto sm:mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" placeholder="Search products..." className="w-full h-10 bg-[#ECECE9] pl-14 pr-4 text-base sm:text-md border border-input/40 rounded-2xl  shadow-sm hover:shadow-md hover:border-primary/30 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-300 placeholder:text-muted-foreground/60" />
            </div>  

            {/* Sort Dropdown */}
            <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[120px] border-0 shadow-none text-sm">
                      <SelectValue placeholder="Sorted by Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
            </Select>
            </div>
        </div>

        {/* Header */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-semibold">
              {categoryName}
            </h1>
            {error && (
              <p className="text-sm text-red-500 mt-2">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Main Content Area with Sidebar */}
        <div className="flex">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 border-r bg-white min-h-[calc(100vh-200px)] sticky top-0 self-start">
            <div className="p-4">
              
              {subcategoryOptions.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => {
                        
                      }}
                      className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors bg-primary text-primary-foreground"
                    >
                      All
                    </button>
                    {subcategoryOptions.map((subcat) => (
                      <button
                        key={subcat}
                        className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                      >
                        {subcat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Accordions */}
              <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                <Accordion type="multiple" className="w-full">
                  {/* Dynamic Attributes from Field Definitions */}
                  {Object.entries(availableAttributes).map(([key, { label, options, type, fieldDef, hasProducts }]) => (
                    <AccordionItem key={key} value={key} className="border-b">
                      <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span>{label}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
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
                                    className={`cursor-pointer flex-1 text-sm ${!optionHasProducts && products.length > 0 ? 'text-muted-foreground opacity-60' : ''}`}
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
                                  <Label htmlFor={`${key}-${option}`} className="cursor-pointer flex-1 text-sm">
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
                                  <Label htmlFor={`${key}-${option}`} className="cursor-pointer flex-1 text-sm">
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

                  <AccordionItem value="colors" className="border-b">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span>Colors</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="flex flex-wrap gap-2">
                        {availableColors.length > 0 ? (
                          availableColors.map((color) => {
                            const isSelected = selectedColors.includes(color.value);
                            return (
                              <div
                                key={color.id}
                                onClick={() => toggleColor(color.value)}
                                className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:ring-2 hover:ring-offset-2 hover:ring-primary/50'
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

                  <AccordionItem value="sizes" className="border-b">
                    <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span>Sizes</span>
                        
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="grid grid-cols-3 gap-2">
                        {availableSizes.length > 0 ? (
                          availableSizes.map((size) => {
                            const isSelected = selectedSizes.includes(size.value);
                            return (
                              <div
                                key={size.id}
                                onClick={() => toggleSize(size.value)}
                                className={`border rounded-md py-1.5 text-center text-xs cursor-pointer transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                                  }`}
                              >
                                {size.value}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground col-span-3">No sizes available</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>

              {/* Clear Filters Button */}
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                  size="sm"
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 bg-white">
            <div className="container mx-auto px-4 py-6">
              {/* Product Grid Controls */}
              <div className="flex items-center justify-between mb-6">
                {/* <div className="text-sm text-muted-foreground">
                  {isLoadingProducts
                    ? 'Loading...'
                    : `${productsCount} Item${productsCount !== 1 ? 's' : ''}`}
                </div> */}
                <div className="flex items-center gap-4">
                  {/* Sort Dropdown */}
                  {/* <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-[180px] border-0 shadow-none text-sm">
                      <SelectValue placeholder="Sorted by Featured" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
                  </Select> */}

                  {/* Attribute Tags - Display all unique attribute values as tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Size Tags */}
                    {/* {availableSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size.value);
                      return (
                        <Badge
                          key={size.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors whitespace-nowrap ${
                            isSelected
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleSize(size.value)}
                        >
                          Size: {size.value}
                        </Badge>
                      );
                    })} */}

                    {/* Color Tags */}
                    {/* {availableColors.map((color) => {
                      const isSelected = selectedColors.includes(color.value);
                      return (
                        <Badge
                          key={color.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleColor(color.value)}
                        >
                          <div
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.colorHex || color.value }}
                          />
                          Color: {color.value}
                        </Badge>
                      );
                    })} */}

                    {/* Dynamic Attribute Tags */}
                    {Object.entries(availableAttributes).map(([key, { label, options }]) => {
                      return options.map((option) => {
                        const isSelected = selectedAttributes[key]?.includes(option) || false;
                        return (
                          <Badge
                            key={`${key}-${option}`}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => toggleAttribute(key, option)}
                          >
                            {label}: {option}
                          </Badge>
                        );
                      });
                    })}

                    {/* Tag Tags (if any) */}
                    {/* {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors whitespace-nowrap ${
                            isSelected
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </Badge>
                      );
                    })} */}
                  </div>
                </div>
              </div>

              {/* Products Grid / Empty / Loading */}
              {isLoadingProducts && productsCount === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredProducts.map((product: any) => {
                    const formattedProduct = formatProduct(product);
                    // Get available colors for this product
                    const productColors = product.availableColors || [];
                    const displayColors = productColors.slice(0, 5);
                    const remainingColorsCount = productColors.length - 5;
                    
                    return (
                      <Link
                        key={formattedProduct.id}
                        to={`/products/${formattedProduct.id}`}
                        className="group"
                      >
                        <div className="flex flex-col h-full">
                          {/* Product Image */}
                          <div className="aspect-square bg-muted relative overflow-hidden mb-3">
                            <img
                              src={formattedProduct.image}
                              alt={formattedProduct.name}
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                            />
                            {formattedProduct.badge && (
                              <Badge className="absolute top-2 right-2 bg-black/80 text-white border-0">
                                {formattedProduct.badge}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="font-medium text-base mb-1 group-hover:underline transition-colors line-clamp-2">
                              {formattedProduct.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {product.catalogue?.description || formattedProduct.brand}
                            </p>
                            
                            {/* Color Swatches */}
                            {displayColors.length > 0 && (
                              <div className="flex items-center gap-1.5 mb-3">
                                {displayColors.map((colorName: string, idx: number) => {
                                  // Get colorHex from product variants, fallback to getColorHex
                                  const productId = formattedProduct.id;
                                  const productColorMap = productColorHexMap[productId] || {};
                                  const colorHex = productColorMap[colorName] || getColorHex(colorName);
                                  return (
                                    <div
                                      key={idx}
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: colorHex || colorName }}
                                      title={colorName}
                                    />
                                  );
                                })}
                                {remainingColorsCount > 0 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    + {remainingColorsCount} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Price */}
                            <p className="text-base font-semibold mt-auto">
                              ${formattedProduct.price}
                            </p>
                          </div>
                        </div>
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryProducts;
