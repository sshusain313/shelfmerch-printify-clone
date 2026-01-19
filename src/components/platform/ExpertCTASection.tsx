import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import expertSupport from "@/assets/expert-support.png";

const ExpertCTASection = () => {
  return (
    <section className="py-6 md:py-2 lg:py-6 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black leading-tight">
              Connect with a Shelf Merch Expert.
            </h2>
            <p className="space-y-2 text-base text-black">
              Get answers to your questions and explore how Shelf Merch can transform your merchandise workflows.
            </p>
            
          <Link to="/auth">
              <Button className="space-y-4 bg-lime-500 hover:bg-lime-600 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 w-fit text-sm">
                Get Started
                <ArrowRight className="space-y-4 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Right Image - merged with background */}
          <div className="flex justify-center lg:justify-end relative overflow-hidden">
            <img 
              src={expertSupport} 
              alt="Shelf Merch Expert Support" 
              className="w-full max-w-md h-auto object-contain mix-blend-multiply"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertCTASection;