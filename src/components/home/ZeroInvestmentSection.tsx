import { Store, PenTool, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import create from "@/assets/create-store.png";
import sell from "@/assets/sell.png";
import print from "@/assets/pod.png";
import ship from "@/assets/ship-globally.png";
import { Link } from "react-router-dom";
const ZeroInvestmentSection = () => {
  const features = [
    {
      icon: <img src={create} alt="create" />,
      title: "Create Store",
      description: "Quickly set up your store, add your own domain, or use our free sub-domain. Choose your product and design your merch.",
    },
    {
      icon: <img src={sell} alt="sell" />,
      title: "Sell Online",
      description: "Choose your products, set prices, and sell anywhere. Integrate via Shopify, automate with our print API, or use our flexible fulfillment service.",
    },
    {
      icon: <img src={print} alt="print" />,
      title: "Print On Demand",
      description: "We handle printing, packing, and fulfillment, letting you focus on your business. Products are produced near your customers, wherever they are.",
    },
    {
      icon: <img src={ship} alt="ship" />,
      title: "Ship Globally",
      description: "We deliver your products in white-label packaging directly to customers through our fast, reliable global logistics network.",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12">
          Start with Zero Investment
        </h2>
        
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-full bg-lime-light flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <Link to="/auth">
        <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-6 py-3 rounded-lg flex items-center gap-2">
          Create Digital Store
          <ArrowRight className="h-4 w-4" />
        </Button>
        </Link>
      </div>
    </section>
  );
};

export default ZeroInvestmentSection;
