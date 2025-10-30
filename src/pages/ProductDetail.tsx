import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="aspect-square bg-muted rounded-xl overflow-hidden mb-4">
              <img 
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"
                alt="Product"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary">
                  <img 
                    src={`https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&fit=crop&crop=entropy&seed=${i}`}
                    alt={`Thumbnail ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">Unisex Heavy Faded Tee</h1>
            <p className="text-muted-foreground mb-4">Art Editor: 3006 · <Link to="#" className="text-primary hover:underline">product series</Link></p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">100% washed cotton</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">Heavyweight fabric (7.1 oz/yd² (240 g/m²))</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">Oversized fit</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">Tear-away label</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-sm">Ribbed knit collar without seam</span>
              </div>
            </div>

            <div className="mb-6">
              <Badge variant="secondary" className="mb-2">
                Decoration Method · <span className="font-semibold">shop his product</span>
              </Badge>
              <div className="p-4 bg-accent rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Printify</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Choice</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Get the best price and quality in every order with Printify Choice.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">from</p>
                    <p className="text-2xl font-bold">USD 28.08</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <div className="font-semibold mb-1">
                      <span className="text-primary">Printify</span> Factor
                    </div>
                    <p className="text-sm text-muted-foreground">Get the best price and quality in every order with Printify Choice.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">from</p>
                    <p className="text-2xl font-bold">USD 28.28</p>
                  </div>
                </div>
              </div>
            </div>

            <Button size="lg" className="w-full bg-primary hover:bg-primary-hover text-primary-foreground mb-4" asChild>
              <Link to="/designer/1">Start designing</Link>
            </Button>

            <Tabs defaultValue="fulfillment" className="mt-8">
              <TabsList className="w-full">
                <TabsTrigger value="fulfillment" className="flex-1">Fulfillment Options</TabsTrigger>
                <TabsTrigger value="choose" className="flex-1">Choose Manually</TabsTrigger>
              </TabsList>
              <TabsContent value="fulfillment" className="mt-4">
                <div className="p-6 bg-accent rounded-lg">
                  <h3 className="font-semibold mb-2">Printify Choice - Trusted network of quality providers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Each order is automatically routed to top-rated print providers for automatically selecting a top-rated print provider from our network.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <div className="text-lg font-bold mb-1">From USD 28.28</div>
                      <p className="text-xs text-muted-foreground">Lowest price</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <div className="text-lg font-bold mb-1">From USD 3.99</div>
                      <p className="text-xs text-muted-foreground">Cheapest shipping</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <div className="text-lg font-bold mb-1">2.6 days*</div>
                      <p className="text-xs text-muted-foreground">Fastest delivery</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="choose">
                <p className="text-sm text-muted-foreground p-4">Select your preferred print provider manually.</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-heading text-2xl font-bold mb-4">About</h2>
            <p className="text-muted-foreground">
              Add both comfort and style to your experience with this Unisex Faded Tee, where effortless elegance meets 
              laid-back charm for that ever-so-trendy aesthetic. Its body, cut straight, flat shoulders display an 
              old-lazy oversized fit and cropped shoulders and a touch of relaxed sophistication. Each tee undergoes 
              garment dyeing for a unique, faded appearance and a touch of lived-in character.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold mb-4">Key features</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Dropped shoulders</h3>
                <p className="text-sm text-muted-foreground">
                  Cropped shoulders give the garment a relaxed fit overall.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Shoulder-to-shoulder tape</h3>
                <p className="text-sm text-muted-foreground">
                  Twill tape covers the shoulder seams to stabilize the back of the garment and prevent stretching.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
