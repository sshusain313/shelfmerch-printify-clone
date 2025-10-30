import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const products = [
  {
    id: 1,
    name: "Unisex Jersey Short Sleeve Tee",
    brand: "Bella+Canvas · 3001",
    price: "From USD 10.98",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800",
    badge: "Bestseller",
  },
  {
    id: 2,
    name: "Unisex Three-Quarter Sleeve Raglan Shirt",
    brand: "By Tultex · 245",
    price: "From USD 16.83",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800",
    badge: "New",
  },
  {
    id: 3,
    name: "Unisex Hooded Long Sleeve Tee",
    brand: "By Bella+Canvas · 3512",
    price: "From USD 20.65",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    badge: "New",
  },
  {
    id: 4,
    name: "Unisex Heavy Cotton Tee",
    brand: "By Gildan · 5000",
    price: "From USD 8.77",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800",
  },
  {
    id: 5,
    name: "Velveteen Plush Blanket",
    brand: "By Generic brand",
    price: "From USD 13.24",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800",
    badge: "Bestseller",
  },
  {
    id: 6,
    name: "Unisex Heavy Blend™ Crewneck Sweatshirt",
    brand: "By Gildan · 18000",
    price: "From USD 15.24",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800",
    badge: "Bestseller",
  },
];

const categories = [
  { name: "Embroidery", image: "https://images.unsplash.com/photo-1562572159-4efc207f5aff?q=80&w=400" },
  { name: "T-shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400" },
  { name: "Sweatshirts", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400" },
  { name: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400" },
  { name: "Magnets and Stickers", image: "https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?q=80&w=400" },
  { name: "Seasonal Decorations", image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=400" },
];

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
                to={`/products/category/${category.name.toLowerCase()}`}
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
            {products.slice(0, 4).map((product) => (
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
                      <p className="font-semibold">{product.price}</p>
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
            {products.slice(2).map((product) => (
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
                      <p className="font-semibold">{product.price}</p>
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
