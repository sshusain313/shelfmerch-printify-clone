import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Image as ImageIcon, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types';
import { getProducts, saveProduct } from '@/lib/localStorage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ProductCreation = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mockups, setMockups] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id || !productId) {
      return;
    }

    const products = getProducts(user.id);
    const currentProduct = products.find((item) => item.id === productId) ?? null;

    if (!currentProduct) {
      toast.error('Product not found');
      navigate('/dashboard');
      return;
    }

    setProduct(currentProduct);
    setTitle(currentProduct.name);
    setDescription(currentProduct.description || '');
    setRetailPrice(currentProduct.price.toFixed(2));
    setMockups(
      currentProduct.mockupUrls && currentProduct.mockupUrls.length > 0
        ? currentProduct.mockupUrls
        : currentProduct.mockupUrl
        ? [currentProduct.mockupUrl]
        : []
    );
    setCompareAtPrice(
      typeof currentProduct.compareAtPrice === 'number'
        ? currentProduct.compareAtPrice.toFixed(2)
        : ''
    );
    setLoading(false);
  }, [user?.id, productId, navigate]);

  const profitRange = useMemo(() => {
    if (!retailPrice) return null;
    const price = parseFloat(retailPrice);
    if (Number.isNaN(price)) return null;
    const costMin = product?.price ? Math.min(product.price, price) * 0.6 : price * 0.6;
    const costMax = product?.price ? Math.max(product.price, price) * 0.6 : price * 0.6;
    const profitMin = price - costMax;
    const profitMax = price - costMin;
    return {
      min: profitMin.toFixed(2),
      max: profitMax.toFixed(2),
    };
  }, [retailPrice, product]);

  const handleSaveDraft = () => {
    if (!user?.id || !product) return;

    const priceNumber = parseFloat(retailPrice);
    if (Number.isNaN(priceNumber)) {
      toast.error('Please enter a valid retail price');
      return;
    }

    const updatedProduct: Product = {
      ...product,
      name: title.trim() || 'Untitled product',
      description: description.trim(),
      price: priceNumber,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) || undefined : undefined,
      mockupUrls: mockups,
      mockupUrl: mockups[0] || product.mockupUrl,
      updatedAt: new Date().toISOString(),
    };

    saveProduct(user.id, updatedProduct);
    setProduct(updatedProduct);
    toast.success('Draft saved');
  };

  const handlePublish = () => {
    handleSaveDraft();
    toast.success('Product ready to publish', {
      description: 'You can now sync this product with your store when you are ready.',
    });
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleUploadMockup = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

    try {
      const dataUrls = await Promise.all(Array.from(files).map((file) => toDataUrl(file)));
      setMockups((prev) => {
        const combined = [...prev, ...dataUrls];
        // keep unique order to prevent duplicates
        const seen = new Set<string>();
        const unique = combined.filter((url) => {
          if (seen.has(url)) return false;
          seen.add(url);
          return true;
        });
        return unique.slice(0, 6);
      });
      toast.success('Mockup uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload mockup. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const primaryMockup = mockups[0] || product?.mockupUrl;

  if (!user?.id || !productId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Unable to load product</h1>
          <p className="text-muted-foreground">
            Make sure you are signed in and selected a valid product.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center h-12">
            <span className="text-muted-foreground">Loading product…</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" className="w-fit gap-2 px-0 text-muted-foreground" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Back to My Products
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title || 'Untitled product'}</h1>
              <p className="text-sm text-muted-foreground">
                Finalize your listing details, pricing, and publishing settings before pushing live.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button onClick={handlePublish}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid gap-6 lg:grid-cols-[1fr,340px]">
        <section className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Selected mockups</h2>
                <p className="text-sm text-muted-foreground">
                  Upload or pick your product mockups to showcase in your storefront.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link to={`/designer/${product.baseProduct}`}>
                    <Sparkles className="h-4 w-4" />
                    Edit design
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload mockup
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => handleUploadMockup(event.target.files)}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => {
                const mockup = mockups[index];
                return (
                <div
                  key={index}
                  className="aspect-square rounded-lg border border-dashed border-muted-foreground/40 flex items-center justify-center bg-background"
                >
                  {mockup ? (
                    <img src={mockup} alt={`${product.name} mockup ${index + 1}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span>Mockup {index + 1}</span>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Listing details</h2>
              <p className="text-sm text-muted-foreground">
                Update how this product appears in your storefront and sales channels.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Add a catchy product title"
              />
              <p className="text-xs text-muted-foreground">
                Keep it short, descriptive, and highlight the key value of your product.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your product, materials, or any care instructions."
                rows={6}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Personalization</h2>
                <p className="text-sm text-muted-foreground">
                  Allow customers to add special requests, names, or notes to their orders.
                </p>
              </div>
              <Switch
                checked={personalizationEnabled}
                onCheckedChange={setPersonalizationEnabled}
                aria-label="Toggle personalization"
              />
            </div>
            {personalizationEnabled && (
              <Textarea placeholder="Provide instructions for how customers should submit personalization requests." rows={4} />
            )}
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Pricing</h2>
              <p className="text-sm text-muted-foreground">
                Set the retail price you want to charge and track your estimated profit.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail price</Label>
                <Input
                  id="retailPrice"
                  value={retailPrice}
                  onChange={(event) => setRetailPrice(event.target.value)}
                  placeholder="e.g. 29.99"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare-at price</Label>
                <Input
                  id="compareAtPrice"
                  value={compareAtPrice}
                  onChange={(event) => setCompareAtPrice(event.target.value)}
                  placeholder="Optional"
                  inputMode="decimal"
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground">Costs</div>
                <div className="text-2xl font-semibold mt-2">
                  {product ? `₹${product.price.toFixed(2)}` : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This is the base cost from your selected provider.
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-sm text-muted-foreground">Estimated profit</div>
                <div className="text-2xl font-semibold mt-2">
                  {profitRange ? `₹${profitRange.min} - ₹${profitRange.max}` : '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on your retail price minus production costs.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Publishing settings</h2>
              <p className="text-sm text-muted-foreground">
                Choose which product details to sync when publishing to your store.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { id: 'syncTitle', label: 'Product title', defaultChecked: true },
                { id: 'syncDescription', label: 'Description', defaultChecked: true },
                { id: 'syncMockups', label: 'Mockups', defaultChecked: true },
                { id: 'syncPricing', label: 'Colors, sizes, prices, and SKUs', defaultChecked: false },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3">
                  <Checkbox id={item.id} defaultChecked={item.defaultChecked} />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-muted/50 flex items-center justify-center">
              {primaryMockup ? (
                <img src={primaryMockup} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8" />
                  <span>No mockup uploaded</span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-semibold">{title || product.name}</h3>
              <p className="text-sm text-muted-foreground">
                Base product · <span className="font-medium capitalize">{product.baseProduct}</span>
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{product.variants.colors.length} colors</Badge>
                <Badge variant="secondary">{product.variants.sizes.length} sizes</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Summary</h4>
              <p className="text-3xl font-bold">₹{retailPrice || product.price.toFixed(2)}</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Base cost</span>
                <span>₹{product.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Estimated profit</span>
                <span>{profitRange ? `₹${profitRange.min} - ₹${profitRange.max}` : '—'}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={handleSaveDraft}>
                Save changes
              </Button>
              <Button className="w-full" onClick={handlePublish}>
                Publish
              </Button>
            </div>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default ProductCreation;

