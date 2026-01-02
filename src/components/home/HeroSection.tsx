import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroProducts from "@/assets/hero-products.png";

const HeroSection = () => {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-secondary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
              Driving Global E-commerce with Locally Produced, Print-On-Demand Products
            </h1>
            <p className="text-base text-foreground max-w-xl">
              Design, sell, and scale your brand effortlessly with Shelf Merch's powerful print-on-demand platform. Custom merchandise, global delivery, zero upfront costs
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                  Get started for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="bg-background border-primary text-primary hover:bg-secondary font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                  See our Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-fit">
              <img 
                src={heroProducts}
                alt="Merchandise products - t-shirt, hoodie, tote bag"
                className="max-w-md w-full rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
