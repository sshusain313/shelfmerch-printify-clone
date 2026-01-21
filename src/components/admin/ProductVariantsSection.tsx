import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ProductVariant } from '@/types/product';
import { X, RefreshCw, Info, Camera } from 'lucide-react';
import { CategoryId } from '@/config/productCategories';
import { getVariantOptions, getColorHex } from '@/config/productVariantOptions';
import { variantOptionsApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { VariantImagesModal } from './VariantImagesModal';
import { ProductVariantRow } from './ProductVariantRow';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductVariantsSectionProps {
  availableSizes: string[];
  availableColors: string[];
  variants: ProductVariant[];
  onSizesChange: (sizes: string[]) => void;
  onColorsChange: (colors: string[]) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  skuTemplate?: string;
  baseSku?: string; // Base SKU prefix for auto-generation
  categoryId?: string; // Category ID to determine variant options
  subcategoryId?: string; // Subcategory ID for more specific options
}

export const ProductVariantsSection = ({
  availableSizes,
  availableColors,
  variants,
  onSizesChange,
  onColorsChange,
  onVariantsChange,
  baseSku = 'PROD',
  categoryId,
  subcategoryId,
}: ProductVariantsSectionProps) => {
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorHexInput, setCustomColorHexInput] = useState('');
  const [sizesFromDB, setSizesFromDB] = useState<string[]>([]);
  const [colorsFromDB, setColorsFromDB] = useState<string[]>([]);
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  // State for variant images modal
  const [selectedVariantForImages, setSelectedVariantForImages] = useState<ProductVariant | null>(null);

  // Get variant options based on category and subcategory
  const staticVariantOptions = useMemo(() => {
    if (!categoryId) {
      return {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: ['White', 'Black', 'Gray'],
        allowCustomSizes: true,
        allowCustomColors: true,
        sizeLabel: 'Size',
      };
    }
    return getVariantOptions(categoryId as CategoryId, subcategoryId);
  }, [categoryId, subcategoryId]);

  // Fetch ALL options from database (DB is authoritative for sizes/colors)
  const fetchOptionsFromDB = useCallback(async () => {
    if (!categoryId) {
      // No category context: clear lists
      setSizesFromDB([]);
      setColorsFromDB([]);
      setColorHexMap({});
      return;
    }

    setIsLoadingOptions(true);
    try {
      const response = await variantOptionsApi.getAll({
        categoryId,
        subcategoryId: subcategoryId || undefined,
      });
      // Normalize response: apiRequest may return either { success, data } or data[]
      const optionsArray: any[] = Array.isArray(response)
        ? response as any[]
        : (response && (response as any).data && Array.isArray((response as any).data)
          ? (response as any).data
          : []);

      if (Array.isArray(optionsArray)) {
        if (optionsArray.length === 0) {
          console.warn('[ProductVariantsSection] No variant options returned from DB', { categoryId, subcategoryId });
        }
        // Remove duplicates by using Set, then convert back to array
        const sizeValues = optionsArray
          .filter((opt: any) => opt.optionType === 'size')
          .map((opt: any) => opt.value as string);
        const sizes: string[] = Array.from(new Set(sizeValues));

        const colorOptions = optionsArray.filter((opt: any) => opt.optionType === 'color');
        const colorValues = colorOptions.map((opt: any) => opt.value as string);
        const colors: string[] = Array.from(new Set(colorValues));

        // Build a map of color names to hex values (prefer subcategory-specific hex if available)
        const hexMap: Record<string, string> = {};
        colorOptions.forEach((opt: any) => {
          if (opt.colorHex) {
            // If color already exists, prefer subcategory-specific hex (subcategoryId is not null)
            if (!hexMap[opt.value] || opt.subcategoryId) {
              hexMap[opt.value] = opt.colorHex;
            }
          }
        });

        // DB is the single source of truth; even if empty, show empty
        setSizesFromDB(sizes);
        setColorsFromDB(colors);
        setColorHexMap(hexMap);
        if (sizes.length === 0 && colors.length === 0) {
          console.warn('[ProductVariantsSection] Empty sizes/colors after processing DB options', { categoryId, subcategoryId });
        }
      }
    } catch (error) {
      console.error('Error fetching variant options from database:', error);
      // On error, leave current state as-is
    } finally {
      setIsLoadingOptions(false);
    }
  }, [categoryId, subcategoryId]);

  useEffect(() => {
    fetchOptionsFromDB();
  }, [fetchOptionsFromDB]);

  // Use options from DB only
  const SIZE_OPTIONS = useMemo(() => {
    return sizesFromDB;
  }, [sizesFromDB]);

  const COLOR_OPTIONS = useMemo(() => {
    return colorsFromDB;
  }, [colorsFromDB]);

  const variantOptions = {
    ...staticVariantOptions,
    sizes: SIZE_OPTIONS,
    colors: COLOR_OPTIONS,
  };

  // Auto-generate variants when sizes or colors change
  useEffect(() => {
    if (availableSizes.length === 0 || availableColors.length === 0) {
      onVariantsChange([]);
      return;
    }

    const newVariants: ProductVariant[] = [];
    availableSizes.forEach((size) => {
      availableColors.forEach((color) => {
        const existingVariant = variants.find(
          v => v.size === size && v.color === color
        );

        if (existingVariant) {
          newVariants.push(existingVariant);
        } else {
          // Generate SKU: BASE-SIZE-COLOR (e.g., PROD-M-WHITE)
          const sku = `${baseSku}-${size.toUpperCase().replace(/\s+/g, '-')}-${color.toUpperCase().replace(/\s+/g, '-')}`;
          const hex = colorHexMap[color] || getColorHex(color);
          newVariants.push({
            id: `${size}-${color}-${Date.now()}-${Math.random()}`,
            size,
            color,
            colorHex: hex,
            sku,
            price: undefined, // Admin will set price manually
            isActive: true,
          });
        }
      });
    });

    // Remove variants that are no longer valid
    const validVariants = newVariants.filter(v =>
      availableSizes.includes(v.size) && availableColors.includes(v.color)
    );

    console.log('[ProductVariantsSection] variant auto-gen effect triggered', { availableSizes, availableColors, existingVariantsCount: variants.length });
    onVariantsChange(validVariants);
    console.log('[ProductVariantsSection] after onVariantsChange', { validVariantsWithImages: validVariants.filter(v => v.viewImages && Object.values(v.viewImages).some(url => url)).length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableSizes, availableColors, baseSku]);

  const handleSizeToggle = (size: string, checked: boolean) => {
    if (checked) {
      onSizesChange([...availableSizes, size]);
    } else {
      onSizesChange(availableSizes.filter(s => s !== size));
    }
  };

  const handleColorToggle = (color: string, checked: boolean) => {
    if (checked) {
      onColorsChange([...availableColors, color]);
    } else {
      onColorsChange(availableColors.filter(c => c !== color));
    }
  };

  const handleAddCustomSize = async () => {
    const trimmedValue = customSizeInput.trim();
    if (!trimmedValue) return;

    // Check if already exists
    if (availableSizes.includes(trimmedValue)) {
      toast({
        title: 'Duplicate Option',
        description: 'This size option already exists',
        variant: 'destructive',
      });
      return;
    }

    // Add to current product
    onSizesChange([...availableSizes, trimmedValue]);
    setCustomSizeInput('');

    // Try to save globally if category is selected
    if (categoryId) {
      try {
        await variantOptionsApi.create({
          categoryId,
          subcategoryId: subcategoryId || undefined,
          optionType: 'size',
          value: trimmedValue,
        });
        // Optimistically append to DB-backed list so it appears immediately
        setSizesFromDB(prev => Array.from(new Set([...(prev || []), trimmedValue])));

        // Refresh options from DB to ensure consistency
        await fetchOptionsFromDB();

        toast({
          title: 'Success',
          description: 'Custom size added globally. It will now appear as a checkbox for all future products.',
        });
      } catch (error: any) {
        // If it fails (e.g., duplicate), just use it for this product
        console.log('Custom size added for this product only:', error);
        toast({
          title: 'Added to Product',
          description: 'Custom size added to this product. (May already exist globally)',
        });
      }
    }
  };

  const handleAddCustomColor = async () => {
    const trimmedValue = customColorInput.trim();
    const trimmedHex = customColorHexInput.trim();

    if (!trimmedValue) return;

    // Validate hex color if provided
    if (trimmedHex && !/^#[0-9A-F]{6}$/i.test(trimmedHex)) {
      toast({
        title: 'Invalid Hex Color',
        description: 'Please enter a valid hex color (e.g., #FF5733)',
        variant: 'destructive',
      });
      return;
    }

    // Check if already exists
    if (availableColors.includes(trimmedValue)) {
      toast({
        title: 'Duplicate Option',
        description: 'This color option already exists',
        variant: 'destructive',
      });
      return;
    }

    // IMMEDIATELY add hex to map (before adding to product)
    if (trimmedHex) {
      setColorHexMap(prev => ({ ...prev, [trimmedValue]: trimmedHex }));
    }

    // Add to current product
    onColorsChange([...availableColors, trimmedValue]);
    setCustomColorInput('');
    setCustomColorHexInput('');

    // Try to save globally if category is selected
    if (categoryId) {
      try {
        await variantOptionsApi.create({
          categoryId,
          subcategoryId: subcategoryId || undefined,
          optionType: 'color',
          value: trimmedValue,
          colorHex: trimmedHex || undefined,
        });
        // Optimistically append to DB-backed list so it appears immediately
        setColorsFromDB(prev => Array.from(new Set([...(prev || []), trimmedValue])));

        // Refresh options from DB to ensure consistency
        await fetchOptionsFromDB();

        toast({
          title: 'Success',
          description: 'Custom color added globally. It will now appear as a checkbox for all future products.',
        });
      } catch (error: any) {
        // If it fails (e.g., duplicate), just use it for this product
        console.log('Custom color added for this product only:', error);
        toast({
          title: 'Added to Product',
          description: 'Custom color added to this product. (May already exist globally)',
        });
      }
    }
  };

  // Update only a single variant by id. Keeps other variants untouched.
  const handleVariantUpdate = useCallback((variantId: string, patch: Partial<ProductVariant>) => {
    onVariantsChange(variants.map(v => v.id === variantId ? { ...v, ...patch } : v));
  }, [variants, onVariantsChange]);

  const regenerateSkus = () => {
    onVariantsChange(
      variants.map(v => ({
        ...v,
        colorHex: v.colorHex || colorHexMap[v.color] || getColorHex(v.color),
        sku: `${baseSku}-${v.size}-${v.color.toUpperCase().replace(/\s+/g, '-')}`,
        // Preserve price when regenerating SKUs
        price: v.price,
      }))
    );
  };



  return (
    <div className="space-y-6">

      {/* Category/Subcategory Info */}
      {categoryId && (
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md border border-primary/20">
          <Info className="h-4 w-4 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Variant options for: {categoryId}{subcategoryId ? ` → ${subcategoryId}` : ''}</p>
            <p className="text-muted-foreground text-xs mt-1">
              {variantOptions.sizeLabel || 'Size'} and color options are pre-configured for this product type. You can add custom options below.
            </p>
          </div>
        </div>
      )}

      {/* Available Sizes */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{variantOptions.sizeLabel || 'Available Sizes'}</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SIZE_OPTIONS.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                checked={availableSizes.includes(size)}
                onCheckedChange={(checked) => handleSizeToggle(size, checked as boolean)}
              />
              <Label
                htmlFor={`size-${size}`}
                className="text-sm font-normal cursor-pointer"
              >
                {size}
              </Label>
            </div>
          ))}
        </div>

        {/* Custom Size Input - Always available for admins */}
        {variantOptions.allowCustomSizes !== false && (
          <div className="mt-3 space-y-2">
            {variantOptions.sizeHint && (
              <p className="text-xs text-muted-foreground italic">
                💡 {variantOptions.sizeHint}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder={`Add custom ${(variantOptions.sizeLabel || 'size').toLowerCase()}...`}
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSize()}
              />
              <Button onClick={handleAddCustomSize} size="sm" variant="secondary">
                Add Custom
              </Button>
            </div>
          </div>
        )}

      </div>

      <Separator />

      {/* Available Colors */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Available Colors</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLOR_OPTIONS.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox
                id={`color-${color}`}
                checked={availableColors.includes(color)}
                onCheckedChange={(checked) => handleColorToggle(color, checked as boolean)}
              />
              <div
                className="w-5 h-5 rounded-full border-2 shadow-sm flex-shrink-0"
                style={{
                  background: colorHexMap[color] || getColorHex(color),
                  borderColor: color === 'White' || color === 'Clear' ? '#E5E7EB' : 'rgba(0, 0, 0, 0.1)',
                }}
              />
              <Label
                htmlFor={`color-${color}`}
                className="text-sm font-normal cursor-pointer flex-1"
              >
                {color}
              </Label>
            </div>
          ))}
        </div>

        {/* Custom Color Input - Always available for admins */}
        {variantOptions.allowCustomColors !== false && (
          <div className="mt-3 space-y-2">
            {variantOptions.colorHint && (
              <p className="text-xs text-muted-foreground italic">
                💡 {variantOptions.colorHint}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Color name (e.g., Forest Blue)"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomColor()}
                className="flex-1"
              />
              <Input
                placeholder="Hex (e.g., #1E40AF)"
                value={customColorHexInput}
                onChange={(e) => setCustomColorHexInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomColor()}
                className="w-32"
              />
              <Button onClick={handleAddCustomColor} size="sm" variant="secondary">
                Add Custom
              </Button>
            </div>
          </div>
        )}

      </div>

      <Separator />

      {/* Generated Variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Generated Variants ({variants.length})
            </Label>
            {/* DEBUG: Check for duplicate IDs */}
            {(() => {
              const ids = variants.map(v => v.id);
              const uniqueIds = new Set(ids);
              if (ids.length !== uniqueIds.size) {
                console.error('[ProductVariantsSection] DUPLICATE VARIANT IDS FOUND!', {
                  total: ids.length,
                  unique: uniqueIds.size,
                  ids
                });
              } else {
                console.log('[ProductVariantsSection] Variant IDs are unique', ids);
              }
              return null;
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateSkus}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate SKUs
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {variants.map((variant) => (
              <ProductVariantRow
                key={variant.id}
                variant={variant}
                onUpdate={handleVariantUpdate}
                onClickImages={setSelectedVariantForImages}
              />
            ))}
          </div>
        </div>
      )}

      {variants.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Select sizes and colors to generate variants</p>
        </div>
      )}

      {/* Variant Images Modal */}
      {selectedVariantForImages && (
        <VariantImagesModal
          variant={selectedVariantForImages}
          isOpen={!!selectedVariantForImages}
          onClose={() => setSelectedVariantForImages(null)}
          onSave={(variantId, viewImages) => {
            console.log('[ProductVariantsSection] onSave called', { variantId, viewImages });
            // Update all variants of the same color with these images
            // IMPORTANT: MongoDB uses _id, frontend uses id - support both
            const sourceVariant = variants.find(v => {
              const vid = (v as any)._id || v.id;
              return vid === variantId;
            });
            console.log('[ProductVariantsSection] sourceVariant', sourceVariant);
            if (sourceVariant) {
              const updatedVariants = variants.map(v =>
                v.color === sourceVariant.color
                  ? { ...v, viewImages: { ...viewImages } } // Create copy for each variant
                  : v
              );
              console.log('[ProductVariantsSection] updatedVariants', updatedVariants.map(v => ({ id: (v as any)._id || v.id, color: v.color, viewImages: v.viewImages })));
              onVariantsChange(updatedVariants);
              toast({
                title: 'Images Updated',
                description: `Updated images for all ${sourceVariant.color} variants`,
              });
            }
            setSelectedVariantForImages(null);
          }}
        />
      )}
    </div>
  );
};

