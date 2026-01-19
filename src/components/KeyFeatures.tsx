import {
    Users,
    Layers,
    Star,
    Ruler,
    Check,
    Droplets,
    Shield,
    Heart
} from "lucide-react";

const specs = [
    {
        icon: Users,
        title: "Unisex Design",
        description: "Suitable for both men and women for versatile styling"
    },
    {
        icon: Layers,
        title: "Premium Material",
        description: "High-quality polyester blend for durability and comfort"
    },
    {
        icon: Ruler,
        title: "200 GSM Fabric",
        description: "Mid-weight fabric that is durable and comfortable"
    },
    {
        icon: Check,
        title: "Comfort Fit",
        description: "Designed for relaxed and comfortable everyday wear"
    },
    {
        icon: Droplets,
        title: "Natural Dyes",
        description: "Safe and eco-friendly, suitable for everyday use"
    },
    {
        icon: Shield,
        title: "Preshrunk Fabric",
        description: "Maintains size and shape after washing for consistent fit"
    },
    {
        icon: Heart,
        title: "Durable Wearing",
        description: "Built to withstand regular use over the long term"
    },
    {
        icon: Star,
        title: "Premium Quality",
        description: "Crafted with attention to detail for lasting satisfaction"
    },
];

export const KeyFeatures = () => {
    return (
        <section className="space-y-6">
            <h2 className="section-title">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {specs.map((spec, index) => (
                    <div
                        key={spec.title}
                        className="bg-card rounded-2xl p-6 border border-border/50 flex flex-col items-start gap-4 hover:shadow-lg transition-shadow duration-300"
                    >
                        <spec.icon className="w-6 h-6 text-black flex-shrink-0" strokeWidth={2.0} />
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">
                                {spec.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {spec.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
