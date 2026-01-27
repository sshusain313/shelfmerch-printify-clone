import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { storeOrdersApi } from '@/lib/api';
import { storeProductsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ShoppingBag, Store as StoreIcon, Mail, Clock, Image as ImageIcon, Layers, Eye, Download } from 'lucide-react';
import { Order } from '@/types';

const AdminOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storeProductsById, setStoreProductsById] = useState<Record<string, any>>({});
  const [storeProductsLoading, setStoreProductsLoading] = useState<Record<string, boolean>>({});

  const getStoreProductIdFromItem = (item: any): string | null => {
    const sp = item?.storeProductId;
    if (!sp) return null;
    if (typeof sp === 'string') return sp;
    const candidate = sp._id || sp.id;
    return candidate ? String(candidate) : null;
  };

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const response = await storeOrdersApi.getById(id);
        // apiRequest for non-auth APIs usually returns `{ success, data }`
        const data = (response && (response.data || response)) as any;
        if (isMounted) {
          setOrder(data as Order);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load order');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch latest store product design data (savedPreviewImages + elements) for ordered items
  useEffect(() => {
    let isMounted = true;

    const uniqueIds = Array.from(
      new Set((order?.items || []).map(getStoreProductIdFromItem).filter(Boolean) as string[])
    );

    const idsToFetch = uniqueIds.filter((spId) => !storeProductsById[spId] && !storeProductsLoading[spId]);
    if (idsToFetch.length === 0) return () => {
      isMounted = false;
    };

    idsToFetch.forEach((spId) => {
      setStoreProductsLoading((prev) => (prev[spId] ? prev : { ...prev, [spId]: true }));
      storeProductsApi
        .getById(spId)
        .then((resp: any) => {
          const data = resp?.data ?? resp;
          if (isMounted && data) {
            setStoreProductsById((prev) => ({ ...prev, [spId]: data }));
          }
        })
        .catch((err: any) => {
          console.error('Failed to fetch store product:', spId, err);
        })
        .finally(() => {
          if (isMounted) {
            setStoreProductsLoading((prev) => ({ ...prev, [spId]: false }));
          }
        });
    });

    return () => {
      isMounted = false;
    };
  }, [order, storeProductsById, storeProductsLoading]);

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return '-';
    return `₹${value.toFixed(2)}`;
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const storeName = order && (order as any).storeId && typeof (order as any).storeId === 'object'
    ? (order as any).storeId.name
    : 'Direct';

  const orderId = order ? ((order as any)._id || (order as any).id || '').toString() : id;
  const hasAnyStoreProductIds = !!order?.items?.some((item: any) => !!getStoreProductIdFromItem(item));

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-muted-foreground text-sm">Order {orderId ? `#${orderId.slice(0, 8)}` : ''}</p>
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        {isLoading && !order && (
          <p className="text-sm text-muted-foreground">Loading order...</p>
        )}

        {!isLoading && !order && !error && (
          <p className="text-sm text-muted-foreground">Order not found.</p>
        )}

        {order && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>Key information about this order</CardDescription>
                  </div>
                  <Badge variant="secondary">{order.status}</Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {order.customerEmail || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Store</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <StoreIcon className="h-4 w-4 text-muted-foreground" />
                      {storeName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime((order as any).createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime((order as any).updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium mt-1">{formatCurrency(order.total)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Quick admin actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin?tab=orders">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Back to Orders
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>Products included in this order</CardDescription>
              </CardHeader>
              <CardContent>
                {(!order.items || order.items.length === 0) ? (
                  <p className="text-sm text-muted-foreground">No items on this order.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item: any, idx: number) => {
                        const variant = item.variantName || item.variant;

                        let variantLabel: string;
                        if (!variant) {
                          variantLabel = '-';
                        } else if (typeof variant === 'string') {
                          variantLabel = variant;
                        } else if (typeof variant === 'object') {
                          // Format objects like { color, size } into a readable string
                          const entries = Object.entries(variant).filter(([_, v]) => v != null && v !== '');
                          variantLabel = entries.length
                            ? entries.map(([k, v]) => `${k}: ${v}`).join(', ')
                            : '[variant]';
                        } else {
                          variantLabel = String(variant);
                        }

                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.productName || item.name || 'Product'}</TableCell>
                            <TableCell>{variantLabel}</TableCell>
                            <TableCell>{item.quantity ?? 1}</TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{formatCurrency((item.price || 0) * (item.quantity || 1))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Design and Preview Section */}
            {order.items && order.items.length > 0 && hasAnyStoreProductIds && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Design & Preview
                  </CardTitle>
                  <CardDescription>Design elements and preview images for ordered products</CardDescription>
                </CardHeader>
                <CardContent>
                  {order.items.map((item: any, idx: number) => {
                    const storeProductId = getStoreProductIdFromItem(item);
                    const storeProductFromOrder = item.storeProductId && typeof item.storeProductId === 'object' ? item.storeProductId : null;
                    const storeProduct = (storeProductId ? storeProductsById[storeProductId] : null) || storeProductFromOrder;
                    const isLoadingStoreProduct = !!(storeProductId && storeProductsLoading[storeProductId]);
                    const designData = storeProduct?.designData;

                    if (!storeProductId) return null;

                    const views = designData?.views || {};
                    const previewsByView = designData?.previewImagesByView || {};
                    const savedPreviewImages = designData?.savedPreviewImages || {};
                    const elements = designData?.elements || [];

                    const viewKeys = Array.from(
                      new Set([
                        // ...Object.keys(views),
                        // ...Object.keys(previewsByView),
                        ...Object.keys(savedPreviewImages),
                      ])
                    );

                    return (
                      <div key={idx} className="mb-6 last:mb-0">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          {item.productName || storeProduct?.title || 'Product'}
                        </h4>

                        {!designData ? (
                          <p className="text-sm text-muted-foreground">
                            {isLoadingStoreProduct ? 'Loading design data…' : 'No design data available'}
                          </p>
                        ) : viewKeys.length > 0 ? (
                          <Tabs defaultValue={viewKeys[0]} className="w-full">
                            <TabsList className="mb-4">
                              {viewKeys.map((viewKey: string) => (
                                <TabsTrigger key={viewKey} value={viewKey} className="capitalize">
                                  <Eye className="h-3 w-3 mr-1" />
                                  {viewKey}
                                </TabsTrigger>
                              ))}
                            </TabsList>

                            {viewKeys.map((viewKey: string) => {
                              const viewKeyLower = viewKey.toLowerCase();
                              const viewData = (views && (views[viewKey] || views[viewKeyLower])) || {};
                              const previewUrl =
                                viewData.savedPreviewImages ||
                                viewData.savedPreviewImage ||
                                savedPreviewImages[viewKey] ||
                                savedPreviewImages[viewKeyLower] ||
                                previewsByView[viewKey] ||
                                previewsByView[viewKeyLower];
                              const viewElements =
                                viewData.elements ||
                                elements.filter((el: any) => {
                                  const elView = (el?.view || 'front').toLowerCase();
                                  return elView === viewKeyLower || (!el?.view && viewKeyLower === 'front');
                                });
                              const designUrls = viewData.designUrlsByPlaceholder || {};

                              return (
                                <TabsContent key={viewKey} value={viewKey}>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Preview Image */}
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Preview
                                      </h5>
                                      {previewUrl ? (
                                        <>
                                          <div className="border rounded-lg overflow-hidden bg-muted">
                                            <img
                                              src={previewUrl}
                                              alt={`${viewKey} view preview`}
                                              className="w-full h-auto object-contain max-h-[300px]"
                                            />
                                          </div>
                                          <div className="mt-2 flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                              <a href={previewUrl} download target="_blank" rel="noreferrer">
                                                <Download className="h-4 w-4 mr-1" />
                                                Download design
                                              </a>
                                            </Button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="border rounded-lg bg-muted p-8 text-center text-muted-foreground">
                                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          <p className="text-sm">No preview available</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Design Elements */}
                                    <div className="space-y-2">
                                      <h5 className="text-sm font-medium flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        Design Elements
                                      </h5>
                                      <div className="border rounded-lg bg-muted/50 p-3 space-y-2 max-h-[300px] overflow-y-auto">
                                        {viewElements.length > 0 ? (
                                          viewElements.map((el: any, elIdx: number) => (
                                            <div key={elIdx} className="text-xs bg-background p-2 rounded border">
                                              <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                  {el.type}
                                                </Badge>
                                                {el.id && (
                                                  <span className="text-muted-foreground">
                                                    #{el.id.slice(0, 6)}
                                                  </span>
                                                )}
                                              </div>
                                              {el.type === 'text' && el.text && (
                                                <p className="mt-1 truncate">{el.text}</p>
                                              )}
                                              {el.type === 'image' && el.imageUrl && (
                                                <img
                                                  src={el.imageUrl}
                                                  alt="Design element"
                                                  className="mt-1 h-12 w-12 object-contain rounded border"
                                                />
                                              )}
                                              <div className="mt-1 text-muted-foreground">
                                                {el.x !== undefined && el.y !== undefined && (
                                                  <span>Pos: ({Math.round(el.x)}, {Math.round(el.y)})</span>
                                                )}
                                                {el.width && el.height && (
                                                  <span className="ml-2">Size: {Math.round(el.width)}×{Math.round(el.height)}</span>
                                                )}
                                              </div>
                                            </div>
                                          ))
                                        ) : Object.keys(designUrls).length > 0 ? (
                                          Object.entries(designUrls).map(([placeholderId, url]: [string, any]) => (
                                            <div key={placeholderId} className="text-xs bg-background p-2 rounded border">
                                              <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className="text-xs">placeholder</Badge>
                                                <span className="text-muted-foreground">
                                                  #{placeholderId.slice(0, 6)}
                                                </span>
                                              </div>
                                              {url && (
                                                <img
                                                  src={url}
                                                  alt="Design"
                                                  className="mt-1 h-12 w-12 object-contain rounded border"
                                                />
                                              )}
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground text-center py-4">
                                            No design elements
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              );
                            })}
                          </Tabs>
                        ) : designData.previewImageUrl ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Preview
                              </h5>
                              <>
                                <div className="border rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={designData.previewImageUrl}
                                    alt="Product preview"
                                    className="w-full h-auto object-contain max-h-[300px]"
                                  />
                                </div>
                                <div className="mt-2 flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={designData.previewImageUrl} download target="_blank" rel="noreferrer">
                                      <Download className="h-4 w-4 mr-1" />
                                      Download design
                                    </a>
                                  </Button>
                                </div>
                              </>
                            </div>
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Elements
                              </h5>
                              <div className="border rounded-lg bg-muted/50 p-3">
                                <p className="text-sm text-muted-foreground">
                                  {elements.length} element(s)
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No design data available</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrderDetail;
