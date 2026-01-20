import { ArrowRight } from "lucide-react";
import storeIntegration from "@/assets/store-integration.png";

const StoreConnectionSection = () => {

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Effortless Store Connection
            </h2>
            <p className="text-muted-foreground">
            Built for creators and entrepreneurs, scalable for enterprises, Shelf Merch's platform lets you produce and deliver custom printed products worldwide. Connect your store seamlessly through Shelf Merch's API or easily integrate with top e-commerce platforms.
            </p>
            <p className="text-muted-foreground">
            Our Print API connects you to production facilities in India and instantly links you to a global network of on-demand manufacturing partners across the USA, Middle East, UK, and beyond.
            </p>
            <p className="text-primary font-semibold flex items-center gap-2 ">
              Coming Soon
            </p>
          </div>

          {/* Right - Integration Image */}
          <div className="flex justify-center">
            <img 
              src={storeIntegration} 
              alt="Store integration platforms" 
              className="w-full max-w-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreConnectionSection;
