import { Box, Settings, Warehouse, Sprout, Star } from "lucide-react";

const SuccessFeaturesSection = () => {
  const features = [
    {
      icon: <Box className="h-6 w-6 text-primary" />,
      title: "On-Demand Zero Overhead",
      description: "No need to invest in inventory. Orders are produced and delivered on demand, saving you time and cost.",
    },
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Customization",
      description: "Personalize products to perfectly match your brand and create a consistent, memorable customer experience.",
    },
    {
      icon: <Warehouse className="h-6 w-6 text-primary" />,
      title: "Fast, Local Fulfillment",
      description: "We print and ship your products using a network of local printers, ensuring quick delivery to your customers.",
    },
    {
      icon: (
        <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center">
          <span className="text-primary font-bold text-lg">0</span>
        </div>
      ),
      title: "Launch with Zero Cost",
      description: "Start your online store with no upfront costs. Forget about inventory, storage, and logistics—just create and sell.",
    },
    {
      icon: <Sprout className="h-6 w-6 text-primary" />,
      title: "Sustainable Merchandise",
      description: "Meet the demand for sustainable products with on-demand production that minimizes waste and carbon footprint.",
    },
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Boost Brand Visibility",
      description: "Use customized merchandise in campaigns to enhance brand presence and connect with your audience in fresh, impactful ways",
    },
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          How Shelf Merch Powers Your E-commerce Success
        </h2>

        {/* Features Grid - 2 rows of 3 columns */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-lime-light flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-base text-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessFeaturesSection;
