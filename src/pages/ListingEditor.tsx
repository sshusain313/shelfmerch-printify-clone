import { useMemo, useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { storeApi, storeProductsApi, catalogVariantsApi } from '@/lib/api';

// Normalize key for matching: trim, lowercase, collapse spaces
const norm = (str: string): string => {
  return (str || '').trim().toLowerCase().replace(/\s+/g, '');
};

interface IncomingVariant {
  id?: string;
  size: string;
  color: string;
  sku?: string;
  // Optional fields passed from previous steps
  price?: number; // retail price / selling price suggestion
  productionCost?: number; // optional if already computed elsewhere
}

interface LocationState {
  storeProductId?: string; // Draft ID from DesignEditor
  productId?: string;
  baseSellingPrice?: number;
  title?: string;
  description?: string;
  galleryImages?: Array<{ id: string; url: string; position: number; isPrimary?: boolean; imageType?: string; altText?: string }>;
  designData?: any;
  variants?: IncomingVariant[];
}

interface VariantRow {
  id?: string;
  size: string;
  color: string;
  sku: string;
  retailPrice: number;
  productionCost: number;
}

const ListingEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state } = location as { state: LocationState | null };

  // Get storeProductId from route query or state
  const storeProductId = searchParams.get('storeProductId') || state?.storeProductId;
  const [draftData, setDraftData] = useState<any>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [variantCostMap, setVariantCostMap] = useState<
    Record<string, { cost: number; id?: string; sku?: string }>
  >({});

  // Load draft from database if storeProductId is provided
  useEffect(() => {
    if (storeProductId) {
      setIsLoadingDraft(true);
      storeProductsApi.getById(storeProductId)
        .then((response) => {
          if (response.success && response.data) {
            setDraftData(response.data);
            console.log('Loaded draft for editing:', response.data);
          } else {
            toast.error('Failed to load draft data');
          }
        })
        .catch((error) => {
          console.error('Error loading draft:', error);
          toast.error('Failed to load draft: ' + (error.message || 'Unknown error'));
        })
        .finally(() => {
          setIsLoadingDraft(false);
        });
    }
  }, [storeProductId]);

  // Get productId from state or draftData
  const productId = state?.productId || draftData?.catalogProductId;

  // Initialize title and description from draft or state
  const [title, setTitle] = useState(() => {
    return draftData?.title || state?.title || 'wyz Logo Circle Graphic T-Shirt | Minimal Branding Tee';
  });
  const [description, setDescription] = useState(() => {
    return draftData?.description || state?.description || 'This relaxed-fit garment-dyed tee wears in like an old favorite...';
  });

  // Update title/description when draft loads
  useEffect(() => {
    if (draftData) {
      if (draftData.title) setTitle(draftData.title);
      if (draftData.description) setDescription(draftData.description);
    }
  }, [draftData]);
  const [addSizeTable, setAddSizeTable] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [hideInStore, setHideInStore] = useState(false);
  const [syncTitle, setSyncTitle] = useState(true);
  const [syncDescription, setSyncDescription] = useState(true);
  const [syncMockups, setSyncMockups] = useState(true);
  const [syncPricing, setSyncPricing] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  // Ref to track user-entered retail prices so they don't reset when cost map loads
  const retailPriceRef = useRef<Record<string, number>>({});

  // --- STORE SELECTION STATE ---
  interface ConnectedStore {
    _id: string;
    id?: string;
    name: string;
    subdomain?: string;
    status?: string;
  }
  const [connectedStores, setConnectedStores] = useState<ConnectedStore[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // Fetch connected stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoadingStores(true);
      try {
        const response = await storeApi.listMyStores();
        if (response.success && Array.isArray(response.data)) {
          setConnectedStores(response.data);
          // Pre-select all stores by default
          const allIds = new Set(response.data.map((s: any) => s._id || s.id));
          setSelectedStoreIds(allIds);
        }
      } catch (error) {
        console.error('Failed to fetch stores:', error);
        toast.error('Failed to load connected stores');
      } finally {
        setIsLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Load catalog variant costs (production basePrice) and SKU template
  // for the specific catalog product backing this design.
  useEffect(() => {
    // Get productId from state OR draftData (draft may load later)
    const currentProductId = state?.productId || draftData?.catalogProductId;

    console.log('[ListingEditor] Fetch catalog variants:', {
      productId: currentProductId,
      fromState: state?.productId,
      fromDraft: draftData?.catalogProductId,
    });

    if (!currentProductId) {
      console.log('[ListingEditor] No productId available yet, skipping fetch');
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        console.log('[ListingEditor] Calling catalogVariantsApi.listByProduct:', currentProductId);
        const resp = await catalogVariantsApi.listByProduct(currentProductId);

        console.log('[ListingEditor] Raw API response:', {
          resp,
          respType: typeof resp,
          isArray: Array.isArray(resp),
          hasData: !!(resp as any)?.data,
          dataType: typeof (resp as any)?.data,
          dataIsArray: Array.isArray((resp as any)?.data),
        });

        // Handle various response shapes: resp.data, resp.data.data, or resp is array
        let data: any[] = [];
        if (Array.isArray(resp)) {
          data = resp;
        } else if (Array.isArray((resp as any)?.data)) {
          data = (resp as any).data;
        } else if (Array.isArray((resp as any)?.data?.data)) {
          data = (resp as any).data.data;
        }

        console.log('[ListingEditor] Extracted data array:', {
          length: data.length,
          sample: data[0],
          sampleFields: data[0] ? Object.keys(data[0]) : [],
        });

        if (!Array.isArray(data) || isCancelled) {
          console.warn('[ListingEditor] No valid data array, aborting');
          return;
        }

        const map: Record<string, { cost: number; id?: string; sku?: string }> = {};
        data.forEach((v: any) => {
          // Normalize keys for matching
          const normalizedSize = norm(v.size || '');
          const normalizedColor = norm(v.color || '');
          const key = `${normalizedSize}__${normalizedColor}`;

          // Production cost: prefer basePrice (DB field), fallback to price (transformed)
          // Requirement: productionCost MUST come from basePrice
          const basePrice = typeof v.basePrice === 'number' && Number.isFinite(v.basePrice)
            ? v.basePrice
            : undefined;
          const price = typeof v.price === 'number' && Number.isFinite(v.price)
            ? v.price
            : undefined;

          // Use basePrice if available (DB field), otherwise use price (if backend transformed it)
          const cost = basePrice !== undefined ? basePrice : (price !== undefined ? price : 0);

          // SKU: backend may transform skuTemplate -> sku, but check both
          const sku = v.sku || v.skuTemplate || '';

          map[key] = {
            cost,
            id: v._id || v.id,
            sku,
          };

          console.log('[ListingEditor] Mapped catalog variant:', {
            originalSize: v.size,
            originalColor: v.color,
            normalizedKey: key,
            basePrice,
            price,
            finalCost: cost,
            sku,
            id: v._id || v.id,
          });
        });

        console.log('[ListingEditor] Final variantCostMap:', {
          keyCount: Object.keys(map).length,
          keys: Object.keys(map),
          sampleEntry: Object.entries(map)[0],
        });

        if (!isCancelled) {
          setVariantCostMap(map);
        }
      } catch (err) {
        console.error('[ListingEditor] Failed to load catalog variant costs:', err);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [productId, draftData?.catalogProductId]);

  // Initialize/recompute variantRows when incoming variants OR cost map changes
  // Preserve user-entered retailPrice using ref
  useEffect(() => {
    const incoming = state?.variants || [];

    console.log('[ListingEditor] Recompute variantRows:', {
      incomingCount: incoming.length,
      variantCostMapKeys: Object.keys(variantCostMap).length,
      existingRowsCount: variantRows.length,
      sampleIncoming: incoming[0],
    });

    if (!incoming.length) {
      console.log('[ListingEditor] No incoming variants, skipping row creation');
      return;
    }

    const rows: VariantRow[] = incoming.map((v) => {
      // Normalize keys for matching
      const normalizedSize = norm(v.size || '');
      const normalizedColor = norm(v.color || '');
      const key = `${normalizedSize}__${normalizedColor}`;
      const mapped = variantCostMap[key];

      console.log('[ListingEditor] Processing variant:', {
        originalSize: v.size,
        originalColor: v.color,
        normalizedKey: key,
        foundInMap: !!mapped,
        mappedData: mapped,
      });

      // Production cost (base price) – MUST come from CatalogProductVariant.basePrice
      const costFromCatalog = mapped?.cost;
      const costSource = Number.isFinite(costFromCatalog as number)
        ? (costFromCatalog as number)
        : Number.isFinite(v.productionCost as number)
          ? (v.productionCost as number)
          : 0;
      const cost = costSource || 0;

      console.log('[ListingEditor] Cost resolution:', {
        costFromCatalog,
        costFromIncoming: v.productionCost,
        finalCost: cost,
      });

      // Retail price: preserve user-entered value if exists, otherwise use default
      const rowKey = `${v.size}__${v.color}`;
      const preservedRetailPrice = retailPriceRef.current[rowKey];

      let defaultRetail = 0;
      if (preservedRetailPrice !== undefined && Number.isFinite(preservedRetailPrice)) {
        // User has entered a price, preserve it
        defaultRetail = preservedRetailPrice;
        console.log('[ListingEditor] Preserving user-entered retailPrice:', preservedRetailPrice);
      } else {
        // No user entry yet, use default
        if (Number.isFinite(v.price as number)) {
          defaultRetail = v.price as number;
        } else if (Number.isFinite(state?.baseSellingPrice as number)) {
          defaultRetail = state!.baseSellingPrice as number;
        } else if (cost > 0) {
          defaultRetail = parseFloat((cost / 0.6).toFixed(2));
        }
      }

      const row: VariantRow = {
        // Prefer mapped?.id (catalogProductVariantId from cost map) over v.id
        // mapped?.id is guaranteed to be a CatalogProductVariant ID
        id: mapped?.id || v.id,
        size: v.size,
        color: v.color,
        // SKU from catalog variant, or fallback
        sku: mapped?.sku || v.sku || '',
        productionCost: parseFloat(cost.toFixed(2)),
        retailPrice: defaultRetail,
      };

      // Store retail price in ref for preservation
      if (defaultRetail > 0) {
        retailPriceRef.current[rowKey] = defaultRetail;
      }

      return row;
    });

    console.log('[ListingEditor] Final rows created:', {
      count: rows.length,
      sampleRow: rows[0],
      allCosts: rows.map(r => r.productionCost),
      allSkus: rows.map(r => r.sku),
    });

    setVariantRows(rows);
  }, [state?.variants, state?.baseSellingPrice, variantCostMap]);

  // Update ref when user edits retail price
  useEffect(() => {
    variantRows.forEach((row) => {
      const rowKey = `${row.size}__${row.color}`;
      if (row.retailPrice > 0) {
        retailPriceRef.current[rowKey] = row.retailPrice;
      }
    });
  }, [variantRows]);
  const [isPublishing, setIsPublishing] = useState(false);

  const hasVariantData = variantRows.length > 0;

  const pricingSummary = useMemo(() => {
    if (!variantRows.length) return null;

    const retailPrices = variantRows.map((v) => v.retailPrice).filter((v) => Number.isFinite(v));
    const costs = variantRows.map((v) => v.productionCost).filter((v) => Number.isFinite(v));

    if (!retailPrices.length || !costs.length) return null;

    const profits = variantRows.map((v) => v.retailPrice - v.productionCost);
    const margins = variantRows.map((v) => {
      if (!v.retailPrice || v.retailPrice <= 0) return 0;
      return (v.retailPrice - v.productionCost) / v.retailPrice;
    });

    const minRetail = Math.min(...retailPrices);
    const maxRetail = Math.max(...retailPrices);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;

    return {
      minRetail,
      maxRetail,
      minCost,
      maxCost,
      minProfit,
      maxProfit,
      avgMargin,
    };
  }, [variantRows]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    // Placeholder – wire into backend later
    console.log('Save as draft clicked');
  };

  const handlePublish = () => {
    // Publish: update the existing draft (PATCH) instead of creating new
    (async () => {
      if (!storeProductId) {
        toast.error('No draft ID available. Please start from Design Editor.');
        return;
      }

      // Validate store selection
      if (selectedStoreIds.size === 0) {
        toast.error('Please select at least one store to publish to.');
        return;
      }

      setIsPublishing(true);

      try {
        // Derive selected colors and sizes from variant rows
        const colors = Array.from(
          new Set(
            (variantRows || [])
              .map((v) => v.color)
              .filter((c): c is string => !!c && c.trim().length > 0),
          ),
        );
        const sizes = Array.from(
          new Set(
            (variantRows || [])
              .map((v) => v.size)
              .filter((s): s is string => !!s && s.trim().length > 0),
          ),
        );

        // Build base update payload
        const currentDesignData = draftData?.designData || state?.designData || {};
        const basePayload: any = {
          status: 'published',
          designData: {
            ...currentDesignData,
            ...(colors.length ? { selectedColors: colors } : {}),
            ...(sizes.length ? { selectedSizes: sizes } : {}),
          },
        };

        if (syncTitle) basePayload.title = title;
        if (syncDescription) basePayload.description = description;
        if (Array.isArray(state?.galleryImages)) basePayload.galleryImages = state.galleryImages;

        // Set selling price
        if (state?.baseSellingPrice) {
          basePayload.sellingPrice = state.baseSellingPrice;
        } else if (variantRows[0]?.retailPrice) {
          basePayload.sellingPrice = variantRows[0].retailPrice;
        }

        // Build variants array
        if (variantRows && variantRows.length > 0) {
          basePayload.variants = variantRows
            .filter((v) => v.id)
            .map((v) => ({
              catalogProductVariantId: v.id,
              sku: v.sku || '',
              sellingPrice: v.retailPrice,
              isActive: true,
            }));
        }

        const selectedStoreIdsArray = Array.from(selectedStoreIds);
        console.log('[ListingEditor] Publishing to stores:', selectedStoreIdsArray);

        // Track success/failure
        let successCount = 0;
        const errors: string[] = [];

        // 1. Update the existing draft for the FIRST selected store
        if (selectedStoreIdsArray.length > 0) {
          const firstStoreId = selectedStoreIdsArray[0];
          try {
            const updates = { ...basePayload, storeId: firstStoreId };
            const resp = await storeProductsApi.update(storeProductId, updates);
            if (resp && resp.success) {
              successCount++;
              console.log('[ListingEditor] Updated existing draft for store:', firstStoreId);
            } else {
              errors.push(`Failed to update for first store`);
            }
          } catch (err: any) {
            errors.push(err?.message || 'Failed to update first store');
          }
        }

        // 2. CREATE new StoreProducts for remaining selected stores
        if (selectedStoreIdsArray.length > 1) {
          const catalogProductId = draftData?.catalogProductId || state?.productId;
          if (!catalogProductId) {
            console.warn('[ListingEditor] No catalogProductId available for creating copies');
          } else {
            for (let i = 1; i < selectedStoreIdsArray.length; i++) {
              const storeId = selectedStoreIdsArray[i];
              try {
                // Create a new StoreProduct for this store
                const createPayload = {
                  storeId,
                  catalogProductId,
                  sellingPrice: basePayload.sellingPrice || 0,
                  title: basePayload.title,
                  description: basePayload.description,
                  designData: basePayload.designData,
                  galleryImages: basePayload.galleryImages,
                  variants: basePayload.variants,
                  status: 'published' as const,
                };

                console.log('[ListingEditor] Creating new StoreProduct for store:', storeId);
                const resp = await storeProductsApi.create(createPayload);
                if (resp && resp.success) {
                  successCount++;
                  console.log('[ListingEditor] Created product for store:', storeId);
                } else {
                  errors.push(`Failed to create for store ${storeId}`);
                }
              } catch (err: any) {
                console.error('[ListingEditor] Error creating for store', storeId, err);
                errors.push(err?.message || `Failed for store ${storeId}`);
              }
            }
          }
        }

        // Report results
        if (successCount === selectedStoreIdsArray.length) {
          toast.success(`Product published to ${successCount} store${successCount > 1 ? 's' : ''}!`);
        } else if (successCount > 0) {
          toast.warning(`Published to ${successCount}/${selectedStoreIdsArray.length} stores. ${errors.join(', ')}`);
        } else {
          toast.error('Failed to publish: ' + errors.join(', '));
        }

        // Navigate if at least one succeeded
        if (successCount > 0) {
          navigate('/stores', {
            state: {
              ...state,
              storeProductId,
              title,
              description,
              variantRows,
            }
          });
        }
      } catch (err: any) {
        console.error('Publish failed', err);
        toast.error(err?.message || 'Publish failed');
      } finally {
        setIsPublishing(false);
      }
    })();
  };

  if (isLoadingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading draft data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-fit gap-2 px-0 text-muted-foreground"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Listing editor</h1>
              <p className="text-sm text-muted-foreground">
                Configure listing details, pricing, and publishing options before pushing live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as draft
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Listing details */}
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Listing details</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              A good listing title is clear, concise, and highlights key features to attract buyers and improve visibility.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter product title"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="addSizeTable"
              checked={addSizeTable}
              onCheckedChange={(checked) => setAddSizeTable(!!checked)}
            />
            <Label htmlFor="addSizeTable" className="text-sm font-normal">
              Add size table to description
            </Label>
          </div>
        </Card>

        {/* Personalization */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Personalization</h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Let buyers add custom requests for text, design, and more—on average, they are willing to pay extra for personalization.
              </p>
            </div>
            <Switch
              checked={personalizationEnabled}
              onCheckedChange={setPersonalizationEnabled}
              aria-label="Toggle personalization"
            />
          </div>
          {personalizationEnabled && (
            <Textarea
              placeholder="Add optional instructions or notes about personalization for your buyers."
              rows={4}
            />
          )}
        </Card>

        {/* Pricing */}
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Pricing</h2>
            <p className="text-sm text-muted-foreground">
              Review retail prices, costs, and estimated profit for each variant.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Retail price</p>
              {pricingSummary ? (
                <p className="text-lg font-semibold">
                  ${pricingSummary.minRetail.toFixed(2)} - ${pricingSummary.maxRetail.toFixed(2)}
                </p>
              ) : (
                <p className="text-lg font-semibold">—</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Costs</p>
              {pricingSummary ? (
                <p className="text-lg font-semibold">
                  ${pricingSummary.minCost.toFixed(2)} - ${pricingSummary.maxCost.toFixed(2)}
                </p>
              ) : (
                <p className="text-lg font-semibold">—</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated profit</p>
              {pricingSummary ? (
                <p className="text-lg font-semibold">
                  ${pricingSummary.minProfit.toFixed(2)} - ${pricingSummary.maxProfit.toFixed(2)} ({
                    Math.round(pricingSummary.avgMargin * 100)
                  }
                  %)
                </p>
              ) : (
                <p className="text-lg font-semibold">—</p>
              )}
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="quick" className="w-full">
            <div className="flex items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="quick">Quick overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed table view</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="quick" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Use the detailed table to adjust pricing per size or variant. Changes here will update your retail price and estimated profit.
              </p>
            </TabsContent>

            <TabsContent value="detailed" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Retail price</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Profit margin</TableHead>
                    <TableHead>Production cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hasVariantData ? (
                    variantRows.map((variant) => {
                      const profit = variant.retailPrice - variant.productionCost;
                      const margin =
                        variant.retailPrice > 0
                          ? Math.round((profit / variant.retailPrice) * 100)
                          : 0;

                      return (
                        <TableRow key={variant.id || `${variant.size}-${variant.color}-${variant.sku}`}>
                          <TableCell className="font-medium">{variant.size}</TableCell>
                          <TableCell>{variant.color}</TableCell>
                          <TableCell>All in stock</TableCell>
                          <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">USD</span>
                              <Input
                                className="h-8 w-24"
                                value={Number.isFinite(variant.retailPrice) ? variant.retailPrice.toFixed(2) : ''}
                                inputMode="decimal"
                                onChange={(event) => {
                                  const value = event.target.value.replace(/[^0-9.]/g, '');
                                  const parsed = parseFloat(value);
                                  const newRetailPrice = Number.isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2));

                                  // Update ref to preserve user entry
                                  const rowKey = `${variant.size}__${variant.color}`;
                                  retailPriceRef.current[rowKey] = newRetailPrice;

                                  setVariantRows((rows) =>
                                    rows.map((row) =>
                                      row === variant
                                        ? {
                                          ...row,
                                          retailPrice: newRetailPrice,
                                        }
                                        : row,
                                    ),
                                  );
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>USD {profit.toFixed(2)}</TableCell>
                          <TableCell>{margin}%</TableCell>
                          <TableCell>USD {variant.productionCost.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No variants received from Design editor. Publish from a designed product to configure pricing.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Publishing destination - Store Selection */}
        <Card className="p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Publishing destination</h2>
            <p className="text-sm text-muted-foreground">
              Select which stores to publish this product to.
            </p>
          </div>

          {isLoadingStores ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading stores...</span>
            </div>
          ) : connectedStores.length > 0 ? (
            <div className="space-y-3">
              {connectedStores.map((store) => {
                const storeId = store._id || store.id || '';
                const isSelected = selectedStoreIds.has(storeId);
                return (
                  <label
                    key={storeId}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        const newSelectedIds = new Set(selectedStoreIds);
                        if (checked) {
                          newSelectedIds.add(storeId);
                        } else {
                          newSelectedIds.delete(storeId);
                        }
                        setSelectedStoreIds(newSelectedIds);
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{store.name}</p>
                      {store.subdomain && (
                        <p className="text-xs text-muted-foreground">{store.subdomain}</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${store.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {store.status === 'active' ? 'Connected' : store.status || 'Draft'}
                    </span>
                  </label>
                );
              })}
              {selectedStoreIds.size === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Please select at least one store to publish to.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4 border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">No stores connected yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Go to Stores page to create or connect a store.
              </p>
            </div>
          )}
        </Card>

        {/* Publishing settings */}
        <Card className="p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Publishing settings</h2>
            <p className="text-sm text-muted-foreground">
              Control product visibility and which details to sync when publishing to your store.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hideInStore"
                checked={hideInStore}
                onCheckedChange={(checked) => setHideInStore(!!checked)}
              />
              <Label htmlFor="hideInStore" className="text-sm font-normal">
                Hide in store
              </Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Sync product details</p>
            <p className="text-xs text-muted-foreground">
              Select which product details to sync and publish on your store. This will not impact SEO.
            </p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={syncTitle}
                  onCheckedChange={(checked) => setSyncTitle(!!checked)}
                />
                <span>Product title</span>
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={syncDescription}
                  onCheckedChange={(checked) => setSyncDescription(!!checked)}
                />
                <span>Description</span>
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={syncMockups}
                  onCheckedChange={(checked) => setSyncMockups(!!checked)}
                />
                <span>Mockups</span>
              </label>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={syncPricing}
                  onCheckedChange={(checked) => setSyncPricing(!!checked)}
                />
                <span>Colors, sizes, prices, and SKUs</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as draft
            </Button>
            <Button onClick={handlePublish}>Publish</Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ListingEditor;
