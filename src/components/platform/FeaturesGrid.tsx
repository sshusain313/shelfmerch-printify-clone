import digitalStore from "@/assets/dig-store.png";
import easyIntegration from "@/assets/integ.png";
import diverseProductCatalog from "@/assets/div-prod.png";
import personalization from "@/assets/pers.png";
import printOnDemandProduction from "@/assets/pod.png";
import automatedFulfillment from "@/assets/auto.png";

const features = [
  {
    icon: <img src={digitalStore} alt="Digital Store Creation" className="w-16 h-16" />,
    title: "Digital Store Creation",
    description: "Launch your online store in minutes with Shelf Merch's Store Creator. Choose products, add custom designs, and start selling instantly—no tech skills needed. Use your own domain or our free sub-domain, and integrate seamlessly."
  },
  {
    icon: <img src={easyIntegration} alt="Easy Integration & Marketing APIs" className="w-16 h-16" />,
    title: "Easy Integration & Marketing APIs",
    description: "Shelf Merch connects seamlessly with major websites, eCommerce platforms, and marketplaces. Brands can also use our APIs to integrate directly into their marketing campaigns, automating product promotions effortlessly."
  },
  {
    icon: <img src={diverseProductCatalog} alt="Diverse Product Catalog" className="w-16 h-16" />,
    title: "Diverse Product Catalog",
    description: "Offering over 200 products, Shelf Merch covers a wide range from clothing and home goods to custom gifts, giving businesses the flexibility to diversify their product lines."
  },
  {
    icon: <img src={personalization} alt="Personalization & Customization" className="w-16 h-16" />,
    title: "Personalization & Customization",
    description: "With Shelf Merch, easily create custom products tailored to your customers' preferences. Our advanced design tools and AI generators allow you to add personal touches like names, graphics, and text, offering endless personalization options."
  },
  {
    icon: <img src={printOnDemandProduction} alt="Print on Demand Production" className="w-16 h-16" />,
    title: "Print on Demand Production",
    description: "Shelf Merch leverages our in-house production and a local partner network to ensure quick, high-quality print-on-demand fulfillment. With fast, reliable delivery, we handle production from start to finish, so you can focus on scaling your brand."
  },
  {
    icon: <img src={automatedFulfillment} alt="Automated fulfillment" className="w-16 h-16" />,
    title: "Automated fulfillment",
    description: "Use customized merchandise in campaigns to enhance brand presence and connect with your audience in fresh, impactful ways."
  }
];

const FeaturesGrid = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="space-y-4">
              {feature.icon}
              <h3 className="text-xl font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;