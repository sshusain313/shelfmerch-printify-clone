import { Search, ChevronDown, User } from "lucide-react";
import { useState } from "react";

const currencies = ["USD $", "INR ₹", "EUR €", "GBP £"];
const regions = ["United States", "India", "Europe", "United Kingdom"];

interface SearchControlsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
}

const SearchControls = ({ searchQuery, onSearchChange, onSearchSubmit }: SearchControlsProps) => {
  const [currency, setCurrency] = useState(currencies[0]);
  const [region, setRegion] = useState(regions[0]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-4xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products, designs, or creators"
            className="w-full h-11 pl-12 pr-4 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearchSubmit?.();
              }
            }}
          />
        </div>

        {/* Right Controls */}
        {/* <div className="flex items-center gap-4 md:gap-6 flex-shrink-0"> */}

          {/* Currency Dropdown */}
          {/* <div className="relative hidden md:block">
            <button
              onClick={() => {
                setCurrencyOpen(!currencyOpen);
                setRegionOpen(false);
              }}
              className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <span>{currency}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${currencyOpen ? "rotate-180" : ""}`} />
            </button>
            {currencyOpen && (
              <div className="absolute top-full right-0 mt-2 py-1 w-24 bg-popover border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                {currencies.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCurrency(c);
                      setCurrencyOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* Region Dropdown */}
          {/* <div className="relative hidden md:block">
            <button
              onClick={() => {
                setRegionOpen(!regionOpen);
                setCurrencyOpen(false);
              }}
              className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <span>{region}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${regionOpen ? "rotate-180" : ""}`} />
            </button>
            {regionOpen && (
              <div className="absolute top-full right-0 mt-2 py-1 w-40 bg-popover border border-border rounded-lg shadow-lg z-50 animate-fade-in">
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRegion(r);
                      setRegionOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          
          {/* <button className="text-sm font-semibold text-foreground hover:text-primary transition-colors hidden sm:block">
            My Designs
          </button>

          
          <button className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md">
            <User className="w-4 h-4" />
            <span>My Store</span>
          </button> */}
        {/* </div> */}
      </div>
    </header>
  );
};

export default SearchControls;
