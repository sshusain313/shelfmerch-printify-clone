import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import expertSupport from "@/assets/expert-support.png";

const ExpertCTASection = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          {/* Left Content */}
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Connect with a Shelf Merch Expert.
            </h2>
            <p className="text-lg text-foreground">
              Get answers to your questions and explore how Shelf Merch can transform your merchandise workflows.
            </p>
            <Link to="/auth">
              <Button className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-8 py-3 rounded-lg flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Right Image */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src={expertSupport} 
              alt="Shelf Merch Expert Support" 
              className="w-64 md:w-72 rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertCTASection;
