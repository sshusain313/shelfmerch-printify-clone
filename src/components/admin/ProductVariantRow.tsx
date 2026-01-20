import { useCallback, memo } from 'react';
import { ProductVariant } from '@/types/product';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductVariantRowProps {
    variant: ProductVariant;
    onUpdate: (id: string, patch: Partial<ProductVariant>) => void;
    onClickImages: (variant: ProductVariant) => void;
}

export const ProductVariantRow = memo(function ProductVariantRow({ variant, onUpdate, onClickImages }: ProductVariantRowProps) {

    // Controlled handlers - no local state, direct updates

    const handleSkuChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(variant.id, { sku: e.target.value });
    }, [onUpdate, variant.id]);

    const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Handle empty string
        if (val === '') {
            onUpdate(variant.id, { price: undefined });
            return;
        }

        // Parse number
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onUpdate(variant.id, { price: num });
        }
    }, [onUpdate, variant.id]);

    const handleActiveChange = useCallback((checked: boolean) => {
        onUpdate(variant.id, { isActive: checked });
    }, [onUpdate, variant.id]);

    // Count how many view images are set
    const imageCount = variant.viewImages
        ? Object.values(variant.viewImages).filter((url) => url && url.trim() !== '').length
        : 0;

    return (
        <Card className="p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                    <div>
                        <Label className="text-xs text-muted-foreground">Size</Label>
                        <p className="text-sm font-medium">{variant.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full border flex-shrink-0"
                            style={{
                                backgroundColor: variant.colorHex || '#ccc',
                                borderColor: variant.color?.toLowerCase() === 'white' ? '#E5E7EB' : 'transparent',
                            }}
                        />
                        <div>
                            <Label className="text-xs text-muted-foreground">Color</Label>
                            <p className="text-sm font-medium">{variant.color}</p>
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">SKU</Label>
                        <Input
                            value={variant.sku ?? ''}
                            onChange={handleSkuChange}
                            className="h-8 text-sm"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Price</Label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            value={variant.price ?? ''}
                            onChange={handlePriceChange}
                            placeholder="0.00"
                            className="h-8 text-sm"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Images Button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 relative"
                                    onClick={() => onClickImages(variant)}
                                >
                                    <Camera className="h-4 w-4" />
                                    {imageCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                            {imageCount}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Manage variant images ({imageCount}/4)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs">Active</Label>
                        <Switch
                            checked={!!variant.isActive}
                            onCheckedChange={handleActiveChange}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
}); // Default shallow comparison is sufficient and safe
