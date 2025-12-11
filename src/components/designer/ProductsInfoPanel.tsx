
import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductView {
    key: string;
    mockupImageUrl: string;
    placeholders: Placeholder[];
  }

interface Placeholder {
    id?: string;
    widthIn?: number;
    heightIn?: number;
    xIn?: number;
    yIn?: number;
    rotationDeg?: number;
    scale?: number;
    dpi?: number;
}

interface Product {
    _id?: string;
    id?: string;
    catalogue?: {
      name?: string;
      description?: string;
      basePrice?: number;
    };
    design?: {
      views?: ProductView[];
      dpi?: number;
      physicalDimensions?: {
        width?: number;  // in inches
        height?: number; // in inches
        length?: number; // in inches
      };
    };
    galleryImages?: Array<{ url: string; isPrimary?: boolean }>;
    availableColors?: string[];
    availableSizes?: string[];
    variants?: Array<{ color: string; colorHex?: string }>;
  }

// Helper function to convert color name to hex code
const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'grey': '#808080',
      'gray': '#808080',
      'navy': '#000080',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'teal': '#008080',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'beige': '#F5F5DC',
      'tan': '#D2B48C',
      'khaki': '#F0E68C',
      'coral': '#FF7F50',
      'salmon': '#FA8072',
      'turquoise': '#40E0D0',
      'lavender': '#E6E6FA',
      'ivory': '#FFFFF0',
      'cream': '#FFFDD0',
      'mint': '#98FF98',
      'peach': '#FFE5B4',
    };
    
    const normalized = colorName.toLowerCase().trim();
    return colorMap[normalized] || '#CCCCCC'; // Default gray if color not found
  };
  
  export const ProductInfoPanel: React.FC<{
    product: Product | null;
    isLoading: boolean;
    selectedColors?: string[];
    selectedSizes?: string[];
    onColorToggle?: (color: string) => void;
    onSizeToggle?: (size: string) => void;
    onPrimaryColorHexChange?: (hex: string | null) => void;
  }> = ({ product, isLoading, selectedColors = [], selectedSizes = [], onColorToggle, onSizeToggle, onPrimaryColorHexChange }) => {
    // Build a map of color names to hex values from variants
    const colorHexMap = React.useMemo(() => {
      const map: Record<string, string> = {};
      if (product?.variants) {
        product.variants.forEach((variant) => {
          if (variant.color && variant.colorHex) {
            map[variant.color] = variant.colorHex;
          }
        });
      }
      return map;
    }, [product?.variants]);

    // When selection changes, notify parent of the primary color's hex
    React.useEffect(() => {
      if (!onPrimaryColorHexChange) return;

      const primaryColor = selectedColors[0];
      if (!primaryColor) {
        onPrimaryColorHexChange(null);
        return;
      }

      const hexFromVariant = colorHexMap[primaryColor];
      const hex = hexFromVariant || getColorHex(primaryColor);
      onPrimaryColorHexChange(hex || null);
    }, [selectedColors, colorHexMap, onPrimaryColorHexChange]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!product) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No product data available</p>
        </div>
      );
    }

    const productImage = product.galleryImages?.find(img => img.isPrimary)?.url || product.galleryImages?.[0]?.url;
    const views = product.design?.views || [];
    const dpi = product.design?.dpi || 300;
  
    return (
      <div className="h-full overflow-y-auto">
        <div className="space-y-4 p-4">
          {/* Product Image */}
          {/* {productImage && (
             <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
               <img
                 src={productImage}
                 alt={product.catalogue?.name || 'Product'}
                 className="w-full h-full object-cover"
               />
             </div>
           )} */}
  
          {/* Product Name */}
          {/* <div>
             <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
               Product Name
             </Label>
             <p className="font-semibold">{product.catalogue?.name || 'Unnamed Product'}</p>
           </div> */}
  
          {/* Description */}
          {/* {product.catalogue?.description && (
             <div>
               <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                 Description
               </Label>
               <p className="text-sm text-muted-foreground">{product.catalogue.description}</p>
             </div>
           )} */}
  
          {/* Colors */}
          {product.availableColors && product.availableColors.length > 0 && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Select Colors
              </Label>

              {/* Dropdown using native details/summary for accessibility */}
              <details className="relative">
                <summary className="flex items-center justify-between p-2 border rounded-md cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {selectedColors.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {selectedColors.slice(0, 3).map((c, i) => {
                              const hex = colorHexMap[c] || getColorHex(c);
                              return (
                                <span
                                  key={i}
                                  className="w-5 h-5 rounded-full border border-border inline-block"
                                  style={{ backgroundColor: hex }}
                                />
                              );
                            })}
                          </div>
                          <span className="text-sm">{selectedColors.length} selected</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Choose colors</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">▾</span>
                </summary>

                <div className="absolute left-0 right-0 mt-2 z-20 bg-background border rounded-md p-2 max-h-60 overflow-y-auto shadow-lg">
                  <div className="space-y-1">
                    {product.availableColors.map((color, index) => {
                      const isSelected = selectedColors.includes(color);
                      const colorHex = colorHexMap[color] || getColorHex(color);
                      return (
                        <label
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onColorToggle?.(color)}
                            className="cursor-pointer"
                          />
                          <span
                            className="w-5 h-5 rounded-full border border-border flex-shrink-0 inline-block"
                            style={{ backgroundColor: colorHex }}
                            aria-hidden
                          />
                          <span className="text-sm flex-1">{color}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </details>

              {selectedColors.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedColors.length} color{selectedColors.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
  
          {/* Sizes */}
          {product.availableSizes && product.availableSizes.length > 0 && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Select Sizes
              </Label>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size, index) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <Badge
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      className={`text-xs px-3 py-1.5 ${
                        onSizeToggle ? 'cursor-pointer hover:bg-primary/80 transition-colors' : ''
                      }`}
                      onClick={() => onSizeToggle?.(size)}
                    >
                      {size}
                    </Badge>
                  );
                })}
              </div>
              {selectedSizes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedSizes.length} size{selectedSizes.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
  
  
          {/* Price */}
          {product.catalogue?.basePrice && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                Base Price
              </Label>
              <p className="text-lg font-bold">${product.catalogue.basePrice.toFixed(2)}</p>
            </div>
          )}
  
          {/* Design Specifications */}
          <div className="border-t pt-4">
            <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
              Design Specifications
            </Label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DPI:</span>
                <span className="font-medium">{dpi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views:</span>
                <span className="font-medium">{views.length}</span>
              </div>
            </div>
          </div>
  
          {/* Available Views */}
          {views.length > 0 && (
            <div>
              <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                Available Views
              </Label>
              <div className="space-y-2">
                {views.map((view) => (
                  <div
                    key={view.key}
                    className="p-2 border rounded-lg flex items-center gap-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {view.mockupImageUrl ? (
                        <img
                          src={view.mockupImageUrl}
                          alt={view.key}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          {view.key}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">{view.key}</p>
                      <p className="text-xs text-muted-foreground">
                        {view.placeholders?.length || 0} print area{view.placeholders?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          {/* Print Area Info */}
          {/* {views.length > 0 && (
             <div className="border-t pt-4">
               <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                 Print Areas
               </Label>
               <div className="space-y-2 text-xs">
                 {views.map((view) => {
                   const viewDpi = product?.design?.dpi || 300;
                   return (
                     <div key={view.key} className="p-2 bg-muted rounded">
                       <p className="font-medium capitalize mb-1">{view.key}</p>
                       {view.placeholders && view.placeholders.length > 0 ? (
                         <div className="space-y-1">
                           {view.placeholders.map((placeholder: Placeholder, idx) => {
                             const placeholderDpi = placeholder.dpi || viewDpi;
                             const widthPx = placeholder.widthIn * placeholderDpi;
                             const heightPx = placeholder.heightIn * placeholderDpi;
                             return (
                               <div key={placeholder.id || idx} className="text-muted-foreground">
                                 <div className="font-medium">Area {idx + 1}</div>
                                 <div>Size: {placeholder.widthIn}" × {placeholder.heightIn}" ({Math.round(widthPx)} × {Math.round(heightPx)}px)</div>
                                 <div>Position: ({placeholder.xIn}", {placeholder.yIn}")</div>
                                 {placeholder.rotationDeg !== undefined && placeholder.rotationDeg !== 0 && (
                                   <div>Rotation: {placeholder.rotationDeg}°</div>
                                 )}
                                 {placeholder.scale !== undefined && placeholder.scale !== 1 && (
                                   <div>Scale: {placeholder.scale}x</div>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <p className="text-muted-foreground">No print areas defined</p>
                       )}
                     </div>
                   );
                 })}
               </div>
             </div>
           )} */}
        </div>
      </div>
    );
  };