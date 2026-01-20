import { Button } from "@/components/ui/button";
import connect from "@/assets/connect.png";
import shipped from "@/assets/shipped.png";
import selling from "@/assets/selling.png";
import seamless from "@/assets/seamless.png";  
const HowItWorksSection = () => {
  const steps = [
    {
      icon: <img src={connect} alt="connect" />,
      title: "Connect to Shelf Merch",
      description: "Connect your e-commerce business to link existing products or create new ones with our easy-to-use store creator.",
    },
    {
      icon: <img src={selling} alt="connect" />,
      title: "Start Selling",
      description: "Your customer browses through your online store, selects their desired products, and completes the purchase seamlessly.",
    },
    {
      icon: <img src={seamless} alt="connect" />,
      title: "Seamless production",
      description: "We handle everything, producing your product closer to your customer through our expert production hubs.",
    },
    {
      icon: <img src={shipped} alt="connect" />,
      title: "The Order is Shipped",
      description: "We ship your products directly to customers using our fast and reliable global logistics network.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
          How print on demand works with Shelf Merch
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-lime-light flex items-center justify-center mx-auto">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
