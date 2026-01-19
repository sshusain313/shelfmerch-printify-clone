import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroProducts from "@/assets/maas.png";

const HeroSection = () => {
  return (
    <section className="py-16 md:py-20 lg:py-24 bg-secondary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            The single platform for merchandise as a service (MaaS).
            </h1>
            <p className="text-lg md:text-xl text-foreground max-w-xl">
            Shelf Merch platform enables local, on-demand production of personalized products for individuals and businesses with zero upfront investment. By tapping into our platform and maker network, creators enjoy low production costs, fast delivery, and seamless scalability. We empower entrepreneurs to enter e-commerce risk-free, driving a shift towards smarter, sustainable, and greener production for the on-demand economy.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
                  Get started for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="flex justify-center ">
            <div className="w-fit">
              <img 
                src={heroProducts}
                alt="Merchandise products - t-shirt, hoodie, tote bag"
                className="max-w-xl w-full rounded-2xl mix-blend-multiply"
              />
            </div>
          </div>           
        </div>
      </div>
    </section>
  );
};

export default HeroSection;