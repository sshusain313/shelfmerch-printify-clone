import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProducts, categories } from '@/data/products';

const CategoryProducts = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const category = categories.find(cat => cat.slug === slug);
  const filteredProducts = mockProducts.filter(p => p.category === slug);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Products
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{category?.name || 'Category'}</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} products available
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full"
          />
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group"
              >
                <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-all">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary">
                      From ${product.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground mb-4">
              No products in this category yet
            </p>
            <Link to="/products">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryProducts;
