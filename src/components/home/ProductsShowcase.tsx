import { ArrowRight } from "lucide-react";
import tshirtWhite from "@/assets/product-tshirt-white.png";
import hoodieBlack from "@/assets/product-hoodie-black.png";
import sweatshirtGreen from "@/assets/product-sweatshirt-green.png";
import mug from "@/assets/product-mug.png";
import caps from "@/assets/product-caps.png";
import accessories from "@/assets/product-accessories.png";
import { Link } from "react-router-dom";

const ProductsShowcase = () => {
  const products = [
    { name: "Round Neck", image: tshirtWhite },
    { name: "Hoodie", image: hoodieBlack },
    { name: "Sweatshirt", image: sweatshirtGreen },
    { name: "Mug", image: mug },
    { name: "Caps", image: caps },
    { name: "Accessories", image: accessories },
  ];

  return (
    <section className="py-16 bg-secondary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Products Grid */}
          <div className="grid grid-cols-3 gap-4">
            {products.map((product, index) => (
              <div key={index} className="bg-card rounded-xl p-4 flex flex-col items-center hover:shadow-lg transition-shadow cursor-pointer border border-border">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-20 h-20 object-contain mb-2"
                />
                <span className="text-sm text-foreground font-medium">{product.name}</span>
              </div>
            ))}
          </div>

          {/* Right Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              200+ Products to<br />create your merch
            </h2>
            <p className="text-muted-foreground">
              Choose from a wide range of products in our catalog. Deliver reliable quality and build a brand customers trust. With 99.8% of orders meeting standards, leading brands rely on us for fulfillment.
            </p>
            <Link to="/products">
            <a href="#" className="text-primary font-semibold flex items-center gap-2 hover:underline">
                  View our full Product range
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>

            
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-10 text-sm">
          Customize T-shirts, hoodies, and an array of accessories.
        </p>
      </div>
    </section>
  );
};

export default ProductsShowcase;
