import { Check, Leaf, Heart, Truck } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Sustainable",
    description: "Eco-friendly materials and processes",
  },
  {
    icon: Heart,
    title: "Made with Love",
    description: "Every piece crafted with passion",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Print on demand, shipped fresh",
  },
];

interface AboutSectionProps {
  storeName?: string;
  description?: string;
}

const AboutSection = ({ storeName = "Merch", description }: AboutSectionProps) => {
  const aboutText = description || 
    `${storeName} brings you high-quality custom merchandise designed with passion. 
    Every product is printed on demand, ensuring freshness and reducing waste. 
    We're committed to delivering exceptional quality and customer satisfaction.`;

  return (
    <section id="about" className="py-20 lg:py-28 bg-muted/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <span className="text-sm font-medium text-primary tracking-widest uppercase mb-4 block">
              Our Story
            </span>
            <h2 className="section-heading text-foreground mb-6">
              About Us
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {aboutText}
            </p>

            <ul className="space-y-4 mb-10">
              {[
                "Premium quality materials",
                "Unique, original designs",
                "Satisfaction guaranteed",
                "Carbon-neutral shipping",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-accent" />
                  </span>
                  <span className="text-foreground font-medium">{item}</span>
                </li>
              ))}
            </ul>

            <a href="#contact" className="btn-primary-store inline-block">
              Get in Touch
            </a>
          </div>

          {/* Right - Features Grid */}
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-8 border border-border/50 flex items-start gap-6 hover:shadow-lg transition-shadow duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
