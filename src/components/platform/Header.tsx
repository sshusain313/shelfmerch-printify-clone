import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.webp";

const solutionsItems = [
  { name: 'Creators & Agencies', path: '/solutions/creators-agencies' },
  { name: 'Fashion & Apparel', path: '/solutions/fashion-apparel' },
  { name: 'Entertainment & Media', path: '/solutions/entertainment-media' },
  { name: 'Home Decor', path: '/solutions/home-decor' },
  { name: 'Customized Merch', path: '/solutions/customized-merch' },
  { name: 'Enterprise Merch', path: '/solutions/enterprise-merch' },
  { name: 'Bulk Orders', path: '/solutions/bulk-orders' },
];

const aboutUsItems = [
  { name: 'Our Story', path: '/about/our-story' },
  { name: 'Careers', path: '/about/careers' },
];

const supportItems = [
  { name: 'Help Center', path: '/support/help-center' },
  { name: 'Policies', path: '/support/policies' },
  { name: 'Production & Shipping Times', path: '/support/production-shipping-times' },
  { name: 'Customer Support Policy', path: '/support/customer-support-policy' },
  { name: 'Content Guidelines', path: '/support/content-guidelines' },
  { name: 'Contact Us', path: '/support/contact-us' },
];

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="logo" 
              className="w-40 rounded-3xl shadow-2xl"
            />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/platform" className={`flex items-center gap-1 transition-colors ${
            location.pathname === '/platform'
              ? 'text-primary font-medium'
              : 'hover:text-primary'
          }`}>
            <span className="text-l font-medium">Platform</span>
          </Link>
          <Link to="/products" className="flex items-center gap-1 transition-colors hover:text-primary">
            <span className="text-l font-medium">Products</span>
          </Link>
          
          {/* Solutions Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsSolutionsOpen(true)}
            onMouseLeave={() => setIsSolutionsOpen(false)}
          >
            <button 
              onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            >
              <span className="text-l font-medium">Solutions</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSolutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSolutionsOpen && (
              <div className="absolute top-full left-0 w-56 z-50 pt-1">
                <div className="bg-popover border border-border rounded-lg shadow-lg py-2">
                  {solutionsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSolutionsOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* About Us Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsAboutUsOpen(true)}
            onMouseLeave={() => setIsAboutUsOpen(false)}
          >
            <button 
              onClick={() => setIsAboutUsOpen(!isAboutUsOpen)}
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            >
              <span className="text-l font-medium">About Us</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAboutUsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isAboutUsOpen && (
              <div className="absolute top-full left-0 w-56 z-50 pt-1">
                <div className="bg-popover border border-border rounded-lg shadow-lg py-2">
                  {aboutUsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsAboutUsOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Support Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsSupportOpen(true)}
            onMouseLeave={() => setIsSupportOpen(false)}
          >
            <button 
              onClick={() => setIsSupportOpen(!isSupportOpen)}
              className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            >
              <span className="text-l font-medium">Support</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSupportOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isSupportOpen && (
              <div className="absolute top-full left-0 w-56 z-50 pt-1">
                <div className="bg-popover border border-border rounded-lg shadow-lg py-2">
                  {supportItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSupportOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link to="/pricing" className="flex items-center gap-1 transition-colors hover:text-primary">
            <span className="text-l font-medium">Pricing</span>
          </Link>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <span className="text-sm font-medium hidden md:inline">{user?.name}</span>
              <Button 
                variant="ghost" 
                className="text-sm font-medium"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">
                  Log in
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-5 py-2 rounded-lg">
                  Sign up for free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
