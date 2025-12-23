import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProductPricingData, SpecificPrice, ProductVariant } from '@/types/product';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SpecificPriceModal } from './SpecificPriceModal';
import { Plus, Trash2, Pencil, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductPricingSectionProps {
  data: ProductPricingData;
  variants: ProductVariant[];
  onChange: (data: ProductPricingData) => void;
}

const GST_SLABS = [0, 5, 12, 18] as const;

export const ProductPricingSection = ({ data, variants, onChange }: ProductPricingSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<SpecificPrice | null>(null);

  // Initialize GST if not present
  useEffect(() => {
    if (!data.gst) {
      onChange({
        ...data,
        gst: {
          slab: 18,
          mode: 'EXCLUSIVE',
          hsn: ''
        }
      });
    }
  }, [data, onChange]);

  const gstConfig = data.gst || { slab: 18, mode: 'EXCLUSIVE', hsn: '' };

  const pricingSummary = useMemo(() => {
    if (!variants || variants.length === 0) return null;

    const prices = variants
      .map((v) => v.price)
      .filter((p): p is number => p !== undefined && p > 0);

    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const calculateFinal = (val: number) => {
      if (gstConfig.mode === 'EXCLUSIVE') {
        const gst = val * (gstConfig.slab / 100);
        return { initial: val, gst, final: val + gst };
      } else {
        const base = val / (1 + gstConfig.slab / 100);
        return { initial: val, gst: val - base, final: val };
      }
    };

    return {
      min: calculateFinal(minPrice),
      max: calculateFinal(maxPrice),
      count: variants.length
    };
  }, [variants, gstConfig]);

  const handleGstUpdate = (patch: Partial<NonNullable<ProductPricingData['gst']>>) => {
    onChange({
      ...data,
      gst: {
        ...gstConfig,
        ...patch
      }
    });
  };

  const handleSavePrice = (specificPrice: SpecificPrice) => {
    const existingPrices = data.specificPrices || [];
    const existingIndex = existingPrices.findIndex(sp => sp.id === specificPrice.id);

    let updatedPrices: SpecificPrice[];
    if (existingIndex >= 0) {
      updatedPrices = [...existingPrices];
      updatedPrices[existingIndex] = specificPrice;
    } else {
      updatedPrices = [...existingPrices, specificPrice];
    }

    onChange({
      ...data,
      specificPrices: updatedPrices,
    });

    setEditingPrice(null);
  };

  const handleDeletePrice = (priceId: string) => {
    if (confirm('Are you sure you want to delete this specific price?')) {
      const updatedPrices = (data.specificPrices || []).filter(sp => sp.id !== priceId);
      onChange({
        ...data,
        specificPrices: updatedPrices,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* GST Configuration Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">GST Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure GST settings for this product</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gstSlab">GST Slab *</Label>
            <Select
              value={String(gstConfig.slab)}
              onValueChange={(val) => handleGstUpdate({ slab: parseInt(val) as any })}
            >
              <SelectTrigger id="gstSlab">
                <SelectValue placeholder="Select GST Slab" />
              </SelectTrigger>
              <SelectContent>
                {GST_SLABS.map((slab) => (
                  <SelectItem key={slab} value={String(slab)}>
                    {slab}% GST Slab
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>GST Mode *</Label>
            <RadioGroup
              value={gstConfig.mode}
              onValueChange={(val) => handleGstUpdate({ mode: val as any })}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXCLUSIVE" id="mode-exclusive" />
                <Label htmlFor="mode-exclusive" className="font-normal cursor-pointer">Tax Exclusive</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INCLUSIVE" id="mode-inclusive" />
                <Label htmlFor="mode-inclusive" className="font-normal cursor-pointer">Tax Inclusive</Label>
              </div>
            </RadioGroup>
            <p className="text-[10px] text-muted-foreground pt-1">
              {gstConfig.mode === 'EXCLUSIVE'
                ? 'GST will be added ON TOP of variant prices.'
                : 'Variant prices already INCLUDE GST.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hsnCode">HSN Code (Optional)</Label>
            <Input
              id="hsnCode"
              placeholder="e.g., 6109"
              value={gstConfig.hsn || ''}
              onChange={(e) => handleGstUpdate({ hsn: e.target.value })}
            />
          </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs text-primary/80">
            GST will apply on top of variant prices (after specific price rules if any).
          </AlertDescription>
        </Alert>
      </div>

      <Separator />

      {/* Pricing Summary Preview */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Pricing Summary</h3>
          <p className="text-sm text-muted-foreground">Summary based on variant prices set in Step 3</p>
        </div>

        {!pricingSummary ? (
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            No variant prices found. Please set prices in Step 3.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Minimum Price', data: pricingSummary.min },
              { label: 'Maximum Price', data: pricingSummary.max }
            ].map((item, idx) => (
              <Card key={idx} className="p-4 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{item.label}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Base Price:</span>
                    <span className="text-lg font-semibold">₹{item.data.initial.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">GST ({gstConfig.slab}%):</span>
                    <span className="text-sm font-medium text-primary">
                      {gstConfig.mode === 'EXCLUSIVE' ? '+' : ''}₹{item.data.gst.toFixed(2)}
                    </span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-sm font-bold">Final Price:</span>
                    <span className="text-xl font-bold">₹{item.data.final.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {gstConfig.mode === 'EXCLUSIVE' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
            <Info className="h-3 w-3" />
            Base price is set per variant in Step 3. These prices exclude GST.
          </p>
        )}
      </div>

      <Separator />

      {/* Cost Price Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Cost Price</h3>
          <p className="text-sm text-muted-foreground">Your cost for this product (internal use)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPriceTaxExcl">Cost price (tax excl.)</Label>
          <Input
            id="costPriceTaxExcl"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={data.costPriceTaxExcl || ''}
            onChange={(e) => onChange({
              ...data,
              costPriceTaxExcl: parseFloat(e.target.value) || 0,
            })}
          />
        </div>
      </div>

      <Separator />

      {/* Specific Prices / Bulk Discounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Specific prices</h3>
            <p className="text-sm text-muted-foreground">
              Set specific prices and bulk discounts for different conditions
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add a specific price
          </Button>
        </div>

        {(data.specificPrices && data.specificPrices.length > 0) ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Combination</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Specific price (tax excl.)</TableHead>
                  <TableHead>Discount (tax incl.)</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.specificPrices.map((sp, index) => (
                  <TableRow key={sp.id}>
                    <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                    <TableCell>{sp.combination || 'All combinations'}</TableCell>
                    <TableCell>{sp.currency || 'All currencies'}</TableCell>
                    <TableCell>{sp.country || 'All countries'}</TableCell>
                    <TableCell>{sp.group || 'All groups'}</TableCell>
                    <TableCell>{sp.store || 'All stores'}</TableCell>
                    <TableCell>
                      {sp.applyToAllCustomers ? 'All customers' : (sp.customer || '—')}
                    </TableCell>
                    <TableCell>
                      {sp.useSpecificPrice && sp.specificPriceTaxExcl
                        ? `₹${sp.specificPriceTaxExcl.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {sp.useDiscount && sp.discountValue
                        ? `${sp.discountType === 'percentage' ? sp.discountValue + '%' : `₹${sp.discountValue.toFixed(2)}`}`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {sp.isUnlimited
                        ? 'Unlimited'
                        : sp.startDate && sp.endDate
                          ? `${sp.startDate} → ${sp.endDate}`
                          : '—'}
                    </TableCell>
                    <TableCell>{sp.minQuantity || 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPrice(sp);
                            setModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePrice(sp.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p>No specific prices defined yet.</p>
            <p className="text-sm mt-1">Click "Add a specific price" to create your first pricing rule.</p>
          </div>
        )}
      </div>

      {/* Specific Price Modal */}
      <SpecificPriceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPrice(null);
        }}
        onSave={handleSavePrice}
        specificPrice={editingPrice}
        taxRate={data.taxRate}
      />
    </div>
  );
};

