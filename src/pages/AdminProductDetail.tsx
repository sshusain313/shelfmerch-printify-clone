import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Package, Layers, Eye, Images, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { productApi } from '@/lib/api';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { MockupPreview } from '@/components/admin/MockupPreview';

const AdminProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const response = await productApi.getById(id);
        if (response && response.success === true && response.data) {
          setProduct(response.data);
        } else if (response && response.data) {
          // Fallback: if response has data but no success field
          setProduct(response.data);
        } else {
          toast.error(response?.message || 'Product not found');
          navigate('/admin?tab=products');
        }
      } catch (error: any) {
        console.error('Failed to fetch product:', error);
        toast.error(error.message || 'Failed to load product details');
        navigate('/admin?tab=products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // navigate is stable and doesn't need to be in dependencies

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '₹0.00';
    return `₹${price.toFixed(2)}`;
  };

  const getStatus = (product: any): 'active' | 'draft' | 'archived' | 'inactive' => {
    if (!product?.isActive) return 'inactive';
    return 'active';
  };

  const getThumbnailUrl = (product: any) => {
    const primaryImage = product?.galleryImages?.find((img: any) => img.isPrimary);
    return primaryImage?.url || product?.galleryImages?.[0]?.url || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin?tab=products')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/products/${id}/edit`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Product
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1">
              {getThumbnailUrl(product) ? (
                <img
                  src={getThumbnailUrl(product)}
                  alt={product.catalogue?.name || 'Product'}
                  className="h-24 w-24 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {product.catalogue?.name || 'Unnamed Product'}
                </h1>
                <p className="text-muted-foreground mb-3">
                  {product.catalogue?.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-3">
                  <StatusBadge status={getStatus(product)} />
                  <Badge variant="outline" className="gap-2">
                    <DollarSign className="h-3 w-3" />
                    {formatPrice(product.catalogue?.basePrice)}
                  </Badge>
                  <Badge variant="outline" className="gap-2">
                    <Calendar className="h-3 w-3" />
                    Created {formatDate(product.createdAt)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Variants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{product.variants?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total variants</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {product.design?.views?.filter((v: any) => v.mockupImageUrl).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Mockup views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Images className="h-4 w-4" />
                    Gallery Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{product.galleryImages?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total images</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Basic product details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                    <p className="text-base font-semibold">{product.catalogue?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Base Price</p>
                    <p className="text-base font-semibold">{formatPrice(product.catalogue?.basePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={getStatus(product)} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="text-base font-semibold">{formatDate(product.createdAt)}</p>
                  </div>
                  {product.catalogue?.material && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Material</p>
                      <p className="text-base font-semibold">{product.catalogue.material}</p>
                    </div>
                  )}
                  {product.catalogue?.brand && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Brand</p>
                      <p className="text-base font-semibold">{product.catalogue.brand}</p>
                    </div>
                  )}
                </div>
                {product.catalogue?.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                    <p className="text-base">{product.catalogue.description}</p>
                  </div>
                )}
                {product.catalogue?.tags && product.catalogue.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {product.catalogue.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variants Tab */}
          <TabsContent value="variants" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>
                  {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {product.variants && product.variants.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {product.variants.map((variant: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">{variant.sku || `Variant ${index + 1}`}</div>
                            {variant.isActive !== false ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-1 text-sm">
                            {variant.size && (
                              <p><span className="text-muted-foreground">Size:</span> {variant.size}</p>
                            )}
                            {variant.color && (
                              <p><span className="text-muted-foreground">Color:</span> {variant.color}</p>
                            )}
                            {variant.price && (
                              <p><span className="text-muted-foreground">Price:</span> {formatPrice(variant.price)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No variants configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Design & Mockups</CardTitle>
                <CardDescription>Mockup images and print area configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {product.design?.views && product.design.views.length > 0 ? (
                  <div className="space-y-8">
                    {product.design.views.map((view: any, index: number) => (
                      <div key={index} className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className='col-span-1'>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold capitalize">{view.key || `View ${index + 1}`}</h3>
                          {view.placeholders && view.placeholders.length > 0 && (
                            <Badge variant="secondary">
                              {view.placeholders.length} print area{view.placeholders.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Visual Mockup Preview with Placeholders */}
                        {view.mockupImageUrl ? (
                          <MockupPreview
                            mockupImageUrl={view.mockupImageUrl}
                            placeholders={view.placeholders || []}
                            canvasWidth={800}
                            canvasHeight={600}
                            physicalWidth={20}
                            physicalHeight={24}
                            unit="in"
                          />
                        ) : (
                          <div className="border rounded-lg p-8 bg-muted flex items-center justify-center min-h-[400px]">
                            <p className="text-muted-foreground">No mockup image</p>
                          </div>
                        )}
                        </div>
                        
                        {/* Print Areas Summary */}
                        {view.placeholders && view.placeholders.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 mt-4">
                            {view.placeholders.map((placeholder: any, pIndex: number) => {
                              const area = (placeholder.wIn || 0) * (placeholder.hIn || 0);
                              return (
                                <Card key={pIndex}>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                      <span>Print Area {pIndex + 1}</span>
                                      <Badge variant="secondary">{area.toFixed(2)} in²</Badge>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="text-xs space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Position:</span>
                                      <span className="font-mono">
                                        X: {placeholder.xIn?.toFixed(2) || '0.00'}", Y: {placeholder.yIn?.toFixed(2) || '0.00'}"
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Size:</span>
                                      <span className="font-mono">
                                        {placeholder.wIn?.toFixed(2) || '0.00'}" × {placeholder.hIn?.toFixed(2) || '0.00'}"
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Rotation:</span>
                                      <span className="font-mono">{placeholder.rotationDeg?.toFixed(1) || '0.0'}°</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No design views configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
                <CardDescription>
                  {product.galleryImages?.length || 0} image{product.galleryImages?.length !== 1 ? 's' : ''} in gallery
                </CardDescription>
              </CardHeader>
              <CardContent>
                {product.galleryImages && product.galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {product.galleryImages.map((image: any, index: number) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square border rounded-lg overflow-hidden">
                          <img
                            src={image.url}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.isPrimary && (
                          <Badge className="absolute top-2 right-2">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No gallery images</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping & Packaging</CardTitle>
                <CardDescription>Package dimensions and weight</CardDescription>
              </CardHeader>
              <CardContent>
                {product.shipping ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Length</p>
                      <p className="text-2xl font-bold mt-1">
                        {product.shipping.packageLengthCm || 0} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Width</p>
                      <p className="text-2xl font-bold mt-1">
                        {product.shipping.packageWidthCm || 0} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Height</p>
                      <p className="text-2xl font-bold mt-1">
                        {product.shipping.packageHeightCm || 0} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Weight</p>
                      <p className="text-2xl font-bold mt-1">
                        {product.shipping.packageWeightGrams || 0} g
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No shipping information configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminProductDetail;

