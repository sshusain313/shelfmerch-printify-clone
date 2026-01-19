
import { FileText, Droplet, Wind, Archive } from "lucide-react";

const instructions = [
  {
    icon: FileText,
    title: "General",
    description: "A top-choice garment known for its softness, durability, and compatibility with DTG printing, making it a favorite in both retail and promotional markets.",
  },
  {
    icon: Droplet,
    title: "Wash",
    description: "Maintain the tee's quality by washing it in cold water, which helps preserve the fabric and the vibrancy of the print.",
  },
  {
    icon: Wind,
    title: "Dry",
    description: "Tumble dry on a low setting or hang dry to retain the shape and size of the tee post-wash.",
  },
  {
    icon: Archive,
    title: "Store",
    description: "Store in a cool, dry place away from direct sunlight to maintain the integrity of the fabric and colors.",
  },
];

export const CareInstructions = () => {
  return (
    <section className="space-y-6">
      <h2 className="section-title">Care Instructions</h2>
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="space-y-0">
          {instructions.map((item, index) => (
            <div
              key={item.title}
              className="flex items-start gap-4 py-3"
            >
              <item.icon className="w-5 h-5 text-black flex-shrink-0 mt-0.5" strokeWidth={2.0} />
              <div className="space-y-2 flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};