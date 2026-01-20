import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import customTshirt from "@/assets/product-custom-tshirt.png";
import { Link } from "react-router-dom";


const PrintOnDemandSection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Print on demand for your<br />ecommerce business
            </h2>
            <p className="text-muted-foreground">
              Shelf Merch provides a wide range of custom products, a zero inventory business model, and free design tools all in one platform. Our print-on-demand system enables local production and shipping with no minimum order.
            </p>
            <p className="text-muted-foreground">
              When an order is placed, it's automatically sent to the nearest printing facility, so there's no need for inventory, management, or storage.
            </p>
            <Link to="/stores">     
            <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
              Start Selling
              <ArrowRight className="h-4 w-4" />
            </Button>
            </Link>
          </div>

          {/* Right Images */}
          <div className="relative">
            <div className="grid grid-cols-1 gap-10">
              <img 
                src={customTshirt} 
                alt="Custom printed t-shirt" 
                className="w-full rounded-2xl shadow-lg"
              />
            
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrintOnDemandSection;
