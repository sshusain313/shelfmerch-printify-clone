import { Instagram, Twitter, Facebook } from "lucide-react";

interface EnhancedFooterProps {
  storeName: string;
  description?: string;
}

const EnhancedFooter = ({ storeName, description }: EnhancedFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Left Column - Brand */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-semibold text-foreground">
              {storeName}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description || "Premium custom merchandise designed with passion. Every piece tells a story."}
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href="#"
                className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-background hover:bg-primary/10 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">
              Shop
            </h4>
            <ul className="space-y-3">
              {["All Products", "New Arrivals", "Best Sellers", "Sale"].map((link) => (
                <li key={link}>
                  <a
                    href="#products"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">
              Help
            </h4>
            <ul className="space-y-3">
              {["Shipping", "Returns", "Size Guide"].map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 uppercase text-sm tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              {["About Us", "Contact", "Careers", "Press"].map((link) => (
                <li key={link}>
                  <a
                    href={link === "About Us" ? "#about" : "#contact"}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} {storeName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Powered by ShelfMerch</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Edit with Lovable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default EnhancedFooter;


