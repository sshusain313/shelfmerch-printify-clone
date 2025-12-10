import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

interface VariantRow {
  size: string;
  color: string;
  sku: string;
  retailPrice: string;
  profit: string;
  profitMargin: string;
  cost: string;
}

const sampleVariants: VariantRow[] = [
  {
    size: 'S',
    color: '1 color',
    sku: '70095709892970033704',
    retailPrice: '20.68',
    profit: '8.27',
    profitMargin: '40%',
    cost: '12.41',
  },
  {
    size: 'M',
    color: '1 color',
    sku: '28884413898365779599',
    retailPrice: '20.68',
    profit: '8.27',
    profitMargin: '40%',
    cost: '12.41',
  },
  {
    size: 'L',
    color: '1 color',
    sku: '33210482601132596809',
    retailPrice: '20.68',
    profit: '8.27',
    profitMargin: '40%',
    cost: '12.41',
  },
  {
    size: 'XL',
    color: '1 color',
    sku: '24231972701808289371',
    retailPrice: '20.68',
    profit: '8.27',
    profitMargin: '40%',
    cost: '12.41',
  },
  {
    size: '2XL',
    color: '1 color',
    sku: '33679103195382017056',
    retailPrice: '22.78',
    profit: '9.11',
    profitMargin: '40%',
    cost: '13.67',
  },
  {
    size: '3XL',
    color: '1 color',
    sku: '28193768428113689123',
    retailPrice: '26.18',
    profit: '10.47',
    profitMargin: '40%',
    cost: '15.71',
  },
  {
    size: '4XL',
    color: '1 color',
    sku: '24196879499804553430',
    retailPrice: '29.43',
    profit: '11.77',
    profitMargin: '40%',
    cost: '17.66',
  },
];

const ListingEditor = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('wyz Logo Circle Graphic T-Shirt | Minimal Branding Tee');
  const [description, setDescription] = useState('This relaxed-fit garment-dyed tee wears in like an old favorite...');
  const [addSizeTable, setAddSizeTable] = useState(false);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [hideInStore, setHideInStore] = useState(false);
  const [syncTitle, setSyncTitle] = useState(true);
  const [syncDescription, setSyncDescription] = useState(true);
  const [syncMockups, setSyncMockups] = useState(true);
  const [syncPricing, setSyncPricing] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    // Placeholder – wire into backend later
    console.log('Save as draft clicked');
  };

  const handlePublish = () => {
    // Placeholder – wire into backend later
    console.log('Publish clicked');
  };

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
            <Button onClick={handlePublish}>Publish</Button>
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
              <p className="text-lg font-semibold">$20.68 - $29.43</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Costs</p>
              <p className="text-lg font-semibold">$12.41 - $17.66</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estimated profit</p>
              <p className="text-lg font-semibold">$8.27 - $11.77 (40%)</p>
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
                  {sampleVariants.map((variant) => (
                    <TableRow key={variant.sku}>
                      <TableCell className="font-medium">{variant.size}</TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell>All in stock</TableCell>
                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">USD</span>
                          <Input
                            className="h-8 w-24"
                            defaultValue={variant.retailPrice}
                            inputMode="decimal"
                          />
                        </div>
                      </TableCell>
                      <TableCell>USD {variant.profit}</TableCell>
                      <TableCell>{variant.profitMargin}</TableCell>
                      <TableCell>USD {variant.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
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
