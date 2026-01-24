import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface EnhancedStoreHeaderProps {
  storeName: string;
  navLinks?: { name: string; href: string }[];
  cartItemCount: number;
  onCartClick: () => void;
  onSearchClick?: () => void;
  primaryColor?: string;
}

const EnhancedStoreHeader = ({ 
  storeName,
  navLinks: propNavLinks,
  cartItemCount, 
  onCartClick,
  onSearchClick,
  primaryColor
}: EnhancedStoreHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = propNavLinks || [
    { name: "Products", href: "#products" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-foreground text-background text-center py-2.5 text-sm font-medium tracking-wide">
        <span className="opacity-90">Free shipping on orders over ₹75</span>
        <span className="mx-3 opacity-50">•</span>
        <span className="opacity-90">Powered by ShelfMerch</span>
      </div>

      {/* Main Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span 
                className="font-display text-2xl lg:text-3xl font-semibold text-foreground tracking-tight"
                style={{ color: primaryColor }}
              >
                {storeName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isExternal = link.href.startsWith('http') || link.href.startsWith('#');
                
                if (isExternal) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className="nav-link text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="nav-link text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search"
                onClick={onSearchClick}
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                aria-label="Cart"
                onClick={onCartClick}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border animate-fade-in">
            <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => {
                const isExternal = link.href.startsWith('http') || link.href.startsWith('#');
                
                if (isExternal) {
                  return (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-base font-medium text-foreground py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.name}
                    </a>
                  );
                }
                
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="text-base font-medium text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default EnhancedStoreHeader;

