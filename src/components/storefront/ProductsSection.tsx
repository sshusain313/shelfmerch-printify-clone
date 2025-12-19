import ProductCard from "./ProductCard";

const products = [
  {
    id: 1,
    name: "Unisex Heavy Blend™ Crewneck Sweatshirt",
    price: 500,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop",
    category: "Apparel",
  },
  {
    id: 2,
    name: "Premium Canvas Tote Bag",
    price: 100,
    image: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=750&fit=crop",
    category: "Accessories",
  },
  {
    id: 3,
    name: "Unisex Garment-Dyed T-shirt",
    price: 600,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=750&fit=crop",
    category: "Apparel",
  },
  {
    id: 4,
    name: "Vintage Style Baseball Cap",
    price: 150,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=750&fit=crop",
    category: "Accessories",
  },
  {
    id: 5,
    name: "Premium Hoodie Collection",
    price: 750,
    image: "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&h=750&fit=crop",
    category: "Apparel",
  },
  {
    id: 6,
    name: "Ceramic Mug with Custom Print",
    price: 45,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=750&fit=crop",
    category: "Home",
  },
];

const ProductsSection = () => {
  return (
    <section id="products" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">
              Shop Collection
            </span>
            <h2 className="section-heading text-foreground">Our Products</h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {products.length} products available
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["All", "Apparel", "Accessories", "Home"].map((filter, idx) => (
              <button
                key={filter}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  idx === 0
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground hover:bg-foreground hover:text-background"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-14">
          <button className="btn-primary-store">
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
