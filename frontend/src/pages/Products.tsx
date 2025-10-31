import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockProducts, categories } from '@/data/products';

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="search"
            placeholder="Search for products, brands, categories, and print providers"
            className="w-full px-4 py-3 border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Explore Categories */}
        <section className="mb-12">
          <h2 className="font-heading text-3xl font-bold mb-6">Explore ShelfMerch's best</h2>
          <p className="text-muted-foreground mb-6">Here are some of the most popular product categories in our catalog.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/products/category/${category.slug}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3 text-center">
                      <h3 className="font-medium">{category.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Hot New Products */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-heading text-3xl font-bold">Hot new products</h2>
              <p className="text-muted-foreground">Get ahead of the game with our newest offering of products that just hit our catalog.</p>
            </div>
            <Link to="/products/new" className="text-sm font-medium underline hover:text-primary">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockProducts.slice(0, 4).map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group">
                <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {product.badge && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          {product.badge}
                        </Badge>
                      )}
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                      <p className="font-semibold">From ${product.price}</p>
                      <p className="text-xs text-muted-foreground mt-1">9 sizes · 126 colors · 21 print providers</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Starter Essentials */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-heading text-3xl font-bold">Starter essentials</h2>
              <p className="text-muted-foreground">Kickstart your business with these handpicked products that are ideal for new sellers.</p>
            </div>
            <Link to="/products/starters" className="text-sm font-medium underline hover:text-primary">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockProducts.slice(2).map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="group">
                <Card className="overflow-hidden hover:shadow-elevated transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {product.badge && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          {product.badge}
                        </Badge>
                      )}
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                      <p className="font-semibold">From ${product.price}</p>
                      <p className="text-xs text-muted-foreground mt-1">8 sizes · 70 colors · 23 print providers</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
