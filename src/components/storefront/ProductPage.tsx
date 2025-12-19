import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Star, Package, Shield, Minus, Plus, Heart, Share2, Truck, RefreshCw, Check, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import StoreFooter from "@/components/store/StoreFooter";

const ProductPage = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("Natural");
  const [selectedSize, setSelectedSize] = useState("M");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const product = {
    name: "Tote Bag",
    price: 100.00,
    originalPrice: 120.00,
    rating: 4.8,
    reviewCount: 128,
    description: "The Tote Bag is the ultimate everyday accessory. Made from strong, premium fabric, this tote is designed to handle whatever life throws at you. With a large main compartment and sturdy handles, it's perfect for shopping, the beach, or carrying essentials.",
    features: [
      "Premium organic cotton canvas",
      "Reinforced stitching for durability",
      "Internal pocket for small items",
      "Comfortable shoulder straps"
    ],
    colors: [
      { name: "Natural", hex: "#E8DDD4" },
      { name: "Sage", hex: "#9CAF88" },
      { name: "Terracotta", hex: "#CD7F5C" },
    ],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
    ],
    isBestseller: true,
    inStock: true,
  };

  const reviews = [
    {
      name: "Alex Morgan",
      avatar: "AM",
      date: "October 12, 2025",
      rating: 5,
      verified: true,
      text: "The print quality is outstanding and the fabric feels premium. Would definitely recommend to anyone looking for comfort and style.",
    },
    {
      name: "Priya Desai",
      avatar: "PD",
      date: "October 05, 2025",
      rating: 4,
      verified: true,
      text: "Loved the colors and fit. Shipping was quick too! Slightly wish there were more pastel color options.",
    },
    {
      name: "Jordan Lee",
      avatar: "JL",
      date: "September 28, 2025",
      rating: 5,
      verified: false,
      text: "Fits perfectly and the size guide is accurate. The design looks even better in person. Great job!",
    },
  ];

  const sizeChart = [
    { size: "S", chest: '34" - 36"', length: '28"' },
    { size: "M", chest: '38" - 40"', length: '29"' },
    { size: "L", chest: '42" - 44"', length: '30"' },
    { size: "XL", chest: '46" - 48"', length: '31"' },
  ];

  const relatedProducts = [
    { id: 1, name: "Unisex Heavy Blend™ Crewneck", price: 500.00, image: "/placeholder.svg" },
    { id: 2, name: "Unisex Garment-Dyed T-shirt", price: 600.00, image: "/placeholder.svg" },
    { id: 4, name: "Classic Canvas Backpack", price: 450.00, image: "/placeholder.svg" },
  ];

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price);

  const formattedOriginalPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.originalPrice);

  const discountPercentage = Math.round((1 - product.price / product.originalPrice) * 100);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 transition-colors ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
      />
    ));
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="font-display text-xl font-bold text-primary hover:opacity-80 transition-opacity">
                merch
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <a href="#details" className="text-sm text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Details</a>
                <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Reviews</a>
                <a href="#size-chart" className="text-sm text-muted-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full">Size chart</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back to store</span>
              </Link>
              <button className="p-2.5 hover:bg-primary/10 rounded-full transition-all hover:scale-105 relative">
                <ShoppingCart className="w-5 h-5 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/" className="hover:text-primary transition-colors">Products</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Section */}
      <section id="details" className="py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-3xl border border-border overflow-hidden group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-32 h-32 text-muted-foreground/30" />
                </div>
                
                {/* Image Navigation */}
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isBestseller && (
                    <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-fade-in">
                      ✨ Bestseller
                    </span>
                  )}
                  {discountPercentage > 0 && (
                    <span className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                      -{discountPercentage}% OFF
                    </span>
                  )}
                </div>

                {/* Wishlist & Share */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-2.5 rounded-full shadow-lg transition-all hover:scale-110 ${isWishlisted ? 'bg-red-500 text-white' : 'bg-background/80 backdrop-blur-sm hover:bg-background'}`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-2.5 bg-background/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-background transition-all hover:scale-110">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                  {activeImageIndex + 1} / {product.images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 justify-center">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-16 h-16 rounded-xl border-2 transition-all overflow-hidden ${
                      activeImageIndex === index 
                        ? "border-primary ring-2 ring-primary/20 scale-105" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Rating */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                  <div className="flex">{renderStars(product.rating)}</div>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {product.rating}
                  </span>
                </div>
                <a href="#reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline">
                  {product.reviewCount} reviews
                </a>
              </div>

              {/* Title */}
              <div>
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {product.name}
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {product.features.map((feature, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
                    <Check className="w-3 h-3 text-primary" />
                    {feature}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pb-4 border-b border-border">
                <span className="text-4xl font-bold text-primary">{formattedPrice}</span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-muted-foreground line-through">{formattedOriginalPrice}</span>
                )}
              </div>

              {/* Color Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Color</label>
                  <span className="text-sm text-muted-foreground">{selectedColor}</span>
                </div>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full transition-all relative ${
                        selectedColor === color.name
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor === color.name && (
                        <Check className="w-4 h-4 absolute inset-0 m-auto text-foreground drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Size</label>
                  <a href="#size-chart" className="text-sm text-primary hover:underline underline-offset-4">Size guide</a>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-12 rounded-xl text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "bg-primary text-primary-foreground shadow-lg scale-105"
                          : "bg-muted text-foreground hover:bg-muted/80 hover:scale-105"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 rounded-lg hover:bg-background transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2.5 rounded-lg hover:bg-background transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 btn-primary-store flex items-center justify-center gap-2 !py-4 !text-base group">
                  <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add to cart
                </button>
                <button className="flex-1 btn-outline-store !py-4 !text-base hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  Buy it now
                </button>
              </div>

              {/* Stock Status */}
              {product.inStock && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  In stock and ready to ship
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-3 bg-gradient-to-br from-muted to-transparent p-4 rounded-2xl border border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Free Shipping</p>
                    <p className="text-xs text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-muted to-transparent p-4 rounded-2xl border border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">30-day guarantee</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-muted to-transparent p-4 rounded-2xl border border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Fast Fulfillment</p>
                    <p className="text-xs text-muted-foreground">2-3 business days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-muted to-transparent p-4 rounded-2xl border border-border/50">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">SSL encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section id="reviews" className="py-16 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm tracking-wider uppercase">Testimonials</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-2">Customer Reviews</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">Real feedback from shoppers who purchased this product.</p>
          </div>

          {/* Reviews Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 p-6 bg-background rounded-2xl border border-border">
            <div className="text-center">
              <span className="text-5xl font-bold text-foreground">{product.rating}</span>
              <div className="flex justify-center mt-2">{renderStars(product.rating)}</div>
              <p className="text-sm text-muted-foreground mt-1">Based on {product.reviewCount} reviews</p>
            </div>
            <div className="h-16 w-px bg-border hidden sm:block" />
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-sm w-3">{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '5%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div 
                key={index} 
                className="bg-background border border-border rounded-2xl p-6 space-y-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  {review.verified && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex">{renderStars(review.rating)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="btn-outline-store">Load more reviews</button>
          </div>
        </div>
      </section>

      {/* Size Chart */}
      <section id="size-chart" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm tracking-wider uppercase">Fit Guide</span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-2">Size Chart</h2>
            <p className="text-muted-foreground mt-2">Compare measurements to find your ideal fit.</p>
          </div>
          <div className="bg-background border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Size</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Chest</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Length</th>
                </tr>
              </thead>
              <tbody>
                {sizeChart.map((row) => (
                  <tr 
                    key={row.size} 
                    className={`border-t border-border transition-colors ${
                      selectedSize === row.size ? "bg-primary/5" : "hover:bg-muted/30"
                    }`}
                  >
                    <td className={`py-4 px-6 text-sm font-medium ${selectedSize === row.size ? "text-primary" : "text-foreground"}`}>
                      {row.size}
                      {selectedSize === row.size && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Selected</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{row.chest}</td>
                    <td className="py-4 px-6 text-sm text-muted-foreground">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-16 bg-gradient-to-t from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <span className="text-primary font-medium text-sm tracking-wider uppercase">More Products</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mt-2">You May Also Like</h2>
              <p className="text-muted-foreground mt-2">Explore more designs that pair perfectly with this product.</p>
            </div>
            <Link to="/" className="btn-outline-store whitespace-nowrap">
              View all products
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default ProductPage;