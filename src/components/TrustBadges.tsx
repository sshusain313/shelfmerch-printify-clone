import { Truck, ShieldCheck, Award } from "lucide-react";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On orders ₹500+",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    subtitle: "100% Protected",
  },
  {
    icon: Award,
    title: "Quality Guaranteed",
    subtitle: "Premium Materials",
  },
];

export const TrustBadges = () => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div key={badge.title} className="trust-badge">
          <badge.icon className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{badge.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{badge.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};