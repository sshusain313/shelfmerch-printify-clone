import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { storeApi } from '@/lib/api';

const StoreFrontend = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadStore = async () => {
      if (!subdomain) return;
      try {
        const response = await storeApi.getBySubdomain(subdomain);
        if (response.success && response.data) {
          setStore(response.data);
        } else {
          setStore(null);
        }
      } catch (error) {
        console.error('Error loading store by subdomain:', error);
        setStore(null);
      }
    };

    loadStore();

    // TODO: Load products for this store from backend (StoreProducts)
    // For now, keep empty list
    setProducts([]);
  }, [subdomain]);

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The store "{subdomain}" does not exist.
          </p>
          <Link to="/">
            <Button>Go to ShelfMerch</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-primary">
                {store.storeName}
              </h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#products" className="text-sm hover:text-primary transition-colors">
                  list
                </a>
                <a href="#about" className="text-sm hover:text-primary transition-colors">
                  About
                </a>
                <a href="#contact" className="text-sm hover:text-primary transition-colors">
                  Contact
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  0
                </span>
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-4">
            Welcome to {store.storeName}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover our collection of custom designed merchandise
          </p>
          <Button size="lg" asChild>
            <a href="#products">Shop Now</a>
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Our Products</h2>
              <p className="text-muted-foreground">
                Handpicked designs, printed on demand just for you
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Filter</Button>
              <Button variant="outline">Sort</Button>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const mockup = product.mockupUrls?.[0] || product.mockupUrl;
                return (
                  <Card key={index} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {mockup ? (
                      <img
                        src={mockup}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    {product.featured && (
                      <Badge className="absolute top-2 right-2">Featured</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-primary">
                        ₹{product.price || '24.99'}
                      </p>
                      <Button size="sm">Add to Cart</Button>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No Products Yet</h3>
              <p className="text-muted-foreground">
                The store owner is currently adding products. Check back soon!
              </p>
            </Card>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-muted-foreground leading-relaxed">
            {store.storeName} brings you high-quality custom merchandise designed with passion. 
            Every product is printed on demand, ensuring freshness and reducing waste. 
            We're committed to delivering exceptional quality and customer satisfaction.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 {store.storeName}. Powered by{' '}
            <Link to="/" className="text-primary hover:underline">
              ShelfMerch
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StoreFrontend;
