import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { CategorySidebar } from '@/components/CategorySidebar';
import { FilterSidebar } from './FilterSidebar';
import { Search, ChevronDown, User, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { productApi } from '@/lib/api';
import { variantOptionsApi } from '@/lib/api';
import { getColorHex } from '@/config/productVariantOptions';
import { getFieldDefinitions, FieldDefinition, FIELD_DEFINITIONS } from '@/config/productFieldDefinitions';
import { categories } from '@/data/products';
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard, Product } from "@/components/ProductCard";

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
  'tote-bags': 'Tote Bag',
  'tote bag' : 'Tote Bag', 
  'tote bags': 'Tote Bag', // Handle plural slug
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
  'lap-top-cases': 'Lap Top', 
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
  'tote-bags': 'accessories',
  'tote bags': 'accessories', // Handle plural slug
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // find the current category from static list
  const category = useMemo(
    () => categories.find((cat) => cat.slug === slug),
    [slug]
  );

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catalogue search initialised from ?search= so navigation preserves search text
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortOption, setSortOption] = useState('popularity');
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
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
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});

  // Helper: slugify similar to CategorySidebar
  const slugify = (value: string): string => {
    return value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except space and hyphen
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Known subcategory names (aligned with CategorySidebar)
  const subcategoryNames: string[] = [
    // Apparel
    "T-shirts", "Hoodies", "Sweatshirts", "Jackets", "Crop Tops", "Tank Tops",
    // Accessories
    "Tote Bags", "Caps", "Phone Covers", "Gaming Pads", "Beanies",
    // Home & Living
    "Mugs", "Cushions", "Cans", "Frames", "Coasters",
    // Print Products
    "Business Cards", "Books", "ID Cards", "Stickers", "Posters", "Flyers", "Greeting Cards", "Billboards", "Magazines", "Brochures", "Lanyards", "Banners", "Canvas", "Notebooks",
    // Packaging
    "Boxes", "Tubes", "Bottles", "Pouch", "Cosmetics",
    // Tech
    "IPhone Cases", "Lap Top Cases", "IPad Cases", "Macbook Cases", "Phone Cases",
    // Jewelry
    "Rings", "Necklaces", "Earrings", "Bracelets",
  ];

  const resolveSubcategorySlugFromSearch = (term: string): string | null => {
    const q = term.toLowerCase().trim();
    if (!q) return null;

    for (const name of subcategoryNames) {
      const normName = name.toLowerCase().trim();

      // Basic exact match against name
      if (q === normName) {
        return slugify(name);
      }

      // Allow simple singular/plural / spacing variations
      const noDash = normName.replace(/-/g, " ");
      if (q === noDash || q === noDash.replace(/s\b/, "") || (q + "s") === noDash) {
        return slugify(name);
      }

      // If the query contains the subcategory name (e.g. "black t-shirt")
      if (q.includes(normName) || q.includes(noDash)) {
        return slugify(name);
      }
    }

    return null;
  };

  // Filter products based on selection
  const filteredProducts = useMemo(() => {
    if (
      selectedColors.length === 0 &&
      selectedSizes.length === 0 &&
      selectedTags.length === 0 &&
      selectedMaterials.length === 0 &&
      Object.keys(selectedAttributes).length === 0
    ) {
      return products;
    }

    return products.filter((product: any) => {
      const matchesColor = selectedColors.length === 0 ||
        (product.availableColors && product.availableColors.some((c: string) => selectedColors.includes(c)));

      const matchesSize = selectedSizes.length === 0 ||
        (product.availableSizes && product.availableSizes.some((s: string) => selectedSizes.includes(s)));

      const matchesTags = selectedTags.length === 0 ||
        (product.catalogue?.tags && product.catalogue.tags.some((t: string) => selectedTags.includes(t)));

      const productMaterial = product.catalogue?.attributes?.material;
      const matchesMaterial =
        selectedMaterials.length === 0 ||
        (typeof productMaterial === 'string' && selectedMaterials.includes(productMaterial));

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

      return matchesColor && matchesSize && matchesTags && matchesAttributes && matchesMaterial;
    });
  }, [products, selectedColors, selectedSizes, selectedTags, selectedMaterials, selectedAttributes]);

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

  // Keep the URL ?search= param in sync with the current searchQuery
  useEffect(() => {
    const current = searchParams.get('search') || '';
    const next = searchQuery.trim();

    if (next && current !== next) {
      const params = new URLSearchParams(searchParams);
      params.set('search', next);
      setSearchParams(params, { replace: true });
    } else if (!next && current) {
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, searchParams, setSearchParams]);

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
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
      setIsLoading(true);
      setError(null);

      try {
        // If it's a main category, fetch by category
        // If it's a subcategory, fetch by subcategory
        if (isMainCategory) {
          console.log('Fetching products for main category:', slug, 'search:', searchQuery);

          const response = await productApi.getCatalogProducts({
            page: 1,
            limit: 100,
            category: slug, // Use category filter for main categories
            search: searchQuery.trim() || undefined,
          });

          console.log('API response for category:', slug, response);

          if (response && response.success && Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            setProducts([]);
          }
        } else if (subcategory) {
          console.log('Fetching products for subcategory:', subcategory, 'search:', searchQuery);

          const response = await productApi.getCatalogProducts({
            page: 1,
            limit: 100,
            subcategory: subcategory, // Use subcategory filter for subcategories
            search: searchQuery.trim() || undefined,
          });

          console.log('API response for subcategory:', subcategory, response);

          if (response && response.success && Array.isArray(response.data)) {
            setProducts(response.data);
          } else {
            setProducts([]);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [slug, subcategory, isMainCategory, searchQuery]);

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

        // Extract colors: prioritize availableColors (backend deduplicated), use variants for colorHex mapping
        // First, build a map of color -> colorHex from variants (prioritize backend colorHex)
        const variantColorHexMap: Record<string, string> = {};
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any) => {
            if (variant.color && typeof variant.color === 'string') {
              // Prioritize colorHex from backend, fallback to getColorHex
              const colorHex = variant.colorHex || getColorHex(variant.color);
              variantColorHexMap[variant.color] = colorHex;
              // Store in product-specific map for later use
              productColorMap[variant.color] = colorHex;
            }
          });
        }
        
        // Process availableColors (this is the source of truth for what colors a product has)
        // Use colorHex from variants if available, otherwise use getColorHex
        if (Array.isArray(product.availableColors)) {
          product.availableColors.forEach((colorName: string) => {
            if (colorName && typeof colorName === 'string') {
              // Normalize color name (trim whitespace)
              const normalizedColorName = colorName.trim();
              if (!normalizedColorName) return; // Skip empty strings
              
              // Use colorHex from variant if available, otherwise use getColorHex
              const colorHex = variantColorHexMap[normalizedColorName] || getColorHex(normalizedColorName);
              
              // Store in product-specific map using normalized name
              productColorMap[normalizedColorName] = colorHex;

              // Add to global colorsMap for filters (deduplicated by Map key - normalized name)
              if (!colorsMap.has(normalizedColorName)) {
                colorsMap.set(normalizedColorName, {
                  id: normalizedColorName,
                  value: normalizedColorName,
                  colorHex: colorHex,
                });
              }
            }
          });
        } else if (product.variants && Array.isArray(product.variants)) {
          // Fallback: if no availableColors, extract from variants
          product.variants.forEach((variant: any) => {
            if (variant.color && typeof variant.color === 'string') {
              const normalizedColorName = variant.color.trim();
              if (!normalizedColorName) return; // Skip empty strings
              
              const colorHex = variant.colorHex || getColorHex(normalizedColorName);
              productColorMap[normalizedColorName] = colorHex;

              // Add to global colorsMap for filters
              if (!colorsMap.has(normalizedColorName)) {
                colorsMap.set(normalizedColorName, {
                  id: normalizedColorName,
                  value: normalizedColorName,
                colorHex: colorHex,
              });
              }
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

    // Derive available materials from dynamic attributes (if present)
    const materials = Array.from(attributesMap['material'] || []).sort();

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

    setAvailableColors(colors);
    setAvailableSizes(sizes);
    setAvailableTags(tags);
    setAvailableAttributes(processedAttributes);
    setAvailableMaterials(materials);
  }, [products, slug, subcategory, isMainCategory, colorOptionsFromDB]);

  // Format product data for display in ProductCard
  const formatProductForCard = (product: any): Product => {
    // Get brand from attributes (dynamic) or fallback to ShelfMerch
    const brand = product.catalogue?.attributes?.brand || 'ShelfMerch';

    // Resolve colors: use availableColors as single source of truth (backend already deduplicates)
    // Only use variants as fallback if availableColors is missing
    const productId = product._id || product.id;
    const colorMap = productColorHexMap[productId] || {};

    // Use availableColors as the single source of truth (backend already handles deduplication)
    // Only fallback to variants if availableColors is missing
    let colorNames: string[] = [];
    
    if (Array.isArray(product.availableColors) && product.availableColors.length > 0) {
      // Use availableColors directly - backend already handles deduplication
      // Normalize: trim whitespace and filter out empty strings
      const normalized = product.availableColors
        .filter((c: string) => c && typeof c === 'string')
        .map((c: string) => c.trim())
        .filter(Boolean);
      
      // Deduplicate by normalized name (case-sensitive to preserve exact color names)
      const uniqueColors = new Set<string>();
      normalized.forEach((c: string) => {
        if (c) uniqueColors.add(c);
      });
      colorNames = Array.from(uniqueColors);
    } else if (product.variants && Array.isArray(product.variants)) {
      // Fallback: extract unique colors from variants only if availableColors is missing
      const variantColors = new Set<string>();
      product.variants.forEach((variant: any) => {
        if (variant.color && typeof variant.color === 'string') {
          const trimmed = variant.color.trim();
          if (trimmed) variantColors.add(trimmed);
        }
      });
      colorNames = Array.from(variantColors);
    }
    
    // Map color names to hex values using productColorHexMap (from variants) or getColorHex
    // Ensure exact count matches availableColors length - no duplicates, no extra colors
    const colors = colorNames.map((c: string) => {
      // Normalize color name for lookup (trim whitespace)
      const normalized = c.trim();
      // Use colorHex from productColorHexMap if available (from variants), otherwise use getColorHex
      return colorMap[normalized] || getColorHex(normalized);
    });

    const imageUrl = product.galleryImages?.find((img: any) => img.isPrimary)?.url ||
      product.galleryImages?.[0]?.url ||
      '/placeholder.png';

    // If multiple images, map them
    // Note: ProductCard expects images[] array.
    const images = product.galleryImages?.map((img: any) => img.url) || [imageUrl];

    return {
      id: product._id || product.id,
      name: product.catalogue?.name || 'Unnamed Product',
      price: product.catalogue?.basePrice || 0,
      images: images,
      creator: brand,
      colors: colors,
      sizes: product.availableSizes || [],
      printMethod: "DTG", // Default or extract if available
      badge: product.catalogue?.tags?.[0] === 'new' ? 'new' : undefined,
    };
  };

  const productsCount = filteredProducts.length;

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <section className="bg-foreground text-background py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">
                Create. Print. <span className="text-green-500">Sell.</span>
              </h2>
              <p className="text-background/70 max-w-md">
                Launch your own merch store in minutes. No inventory, no hassle.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full px-6 py-3 font-bold"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate("/create-store");
                  } else {
                    navigate("/auth");
                  }
                }}
              >
                Start Your Store
              </Button>
              <Button
                size="lg"
                className="bg-black hover:bg-black/90 text-white border border-gray-400 rounded-full px-6 py-3 font-bold"
                onClick={() => navigate("/products")}
              >
                Explore Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search + controls bar */}
      <section className="border-b border-border bg-background">
        <div className="container py-4 flex flex-col md:flex-row items-center gap-4">
          {/* Search input */}
          <div className="w-full md:flex-1">
            <div className="flex items-center bg-secondary rounded-full px-4">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, designs, or creators"
                className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  const trimmed = value.trim();

                  // 1) Detect subcategory intent from search across all subcategories
                  const targetSlug = resolveSubcategorySlugFromSearch(trimmed);

                  // Cross-subcategory search: navigate to that subcategory page
                  if (targetSlug && targetSlug !== slug) {
                    const params = new URLSearchParams();
                    if (trimmed) {
                      params.set('search', trimmed);
                    }
                    const query = params.toString();
                    navigate(`/products/category/${targetSlug}${query ? `?${query}` : ''}`);
                    return;
                  }

                  // Same-subcategory search or no clear subcategory intent:
                  // stay on this page and filter via backend using searchQuery
                  setSearchQuery(value);
                }}
              />
            </div>
          </div>

          {/* Currency, region, actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* <select className="h-10 rounded-full border border-border bg-background px-4 text-sm">
              <option>USD $</option>
              <option>INR ₹</option>
              <option>EUR €</option>
              <option>GBP £</option>
            </select>
            <select className="h-10 rounded-full border border-border bg-background px-4 text-sm hidden sm:inline-flex">
              <option>United States</option>
              <option>India</option>
              <option>United Kingdom</option>
              <option>Germany</option>
            </select> */}
            {/* <button
              className="text-sm font-medium px-3 py-2 rounded-full hover:bg-secondary transition-colors"
              onClick={() => (window.location.href = "/my-designs")}
            >
              My Designs
            </button>
            <Button
              size="sm"
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <User className="w-4 h-4" />
              <span>My Store</span>
            </Button> */}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="container py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Category sidebar + Filters (stacked) */}
          <div className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 gap-6">
           <CategorySidebar />
            <FilterSidebar
              availableMaterials={availableMaterials}
              availableColors={availableColors}
              availableSizes={availableSizes.map((s: any) => s.value ?? s.id ?? s)}
              selectedMaterials={selectedMaterials}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              onFiltersChange={({ materials, colors, sizes }) => {
                setSelectedMaterials(materials);
                setSelectedColors(colors);
                setSelectedSizes(sizes);
              }}
            />
          </div>

          {/* Right: Product Grid */}
          <div className="flex-1">
            {/* Top Info Row */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div>
                <h1 className="text-2xl font-bold capitalize">
                  {subcategory || (isMainCategory ? slug : 'Products')}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {productsCount} Result{productsCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-secondary rounded-lg mb-3" />
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/2" />
                  </div>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product._id || product.id} product={formatProductForCard(product)} />
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <p className="text-xl text-muted-foreground mb-4">
                    No products found matching filters.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <section className="bg-accent py-16">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-black text-accent-foreground mb-4">
            Ready to build your brand?
          </h2>
          <p className="text-accent-foreground/70 mb-8 max-w-xl mx-auto">
            Join thousands of creators selling custom merch. Zero upfront costs, unlimited creativity.
          </p>
          <Button
            variant="default"
            size="lg"
            className="px-8 py-4 text-lg"
            onClick={() => {
              if (isAuthenticated) navigate("/create-store");
              else navigate("/auth");
            }}
          >
            Start Your Free Store
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CategoryProducts;