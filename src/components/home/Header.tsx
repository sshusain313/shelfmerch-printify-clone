import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

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
          <Link to="/products" className="flex items-center gap-1 transition-colors hover:text-primary">
            <span className="text-l font-medium">Products</span>
          </Link>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <span className="text-l font-medium">Solutions</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <span className="text-l font-medium">About Us</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <span className="text-l font-medium">Support</span>
            <ChevronDown className="h-4 w-4" />
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
