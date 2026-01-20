
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

interface CategoryItem {
  name: string;
  children?: string[];
}

const categories: CategoryItem[] = [
  {
    name: "Apparel",
    children: ["T-shirts", "Hoodies", "Sweatshirts", "Jackets", "Crop Tops", "Tank Tops"],
  },
  { name: "Accessories", children: ["Tote Bags", "Caps", "Phone Covers", "Gaming Pads", "Beanies"] },
  { name: "Home & Living", children: ["Mugs", "Cushions", "Cans", "Frames", "Coasters"] },
  { name: "Print Products", children: ["Business Cards", "Books", "ID Cards", "Stickers", "Posters", "Flyers", "Greeting Cards", "Billboards", "Magazines", "Brochures", "Lanyards", "Banners", "Canvas", "Notebooks"] },
  { name: "Packaging", children: ["Boxes", "Tubes", "Bottles", "Pouch", "Cosmetics", "Bottles"] },
  { name: "Tech", children: ["IPhone Cases", "Lap Top Cases", "IPad Cases", "Macbook Cases", "Phone Cases"] },
  { name: "Jewelry", children: ["Rings", "Necklaces", "Earrings", "Bracelets"] },

];

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except space and hyphen
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

interface CategorySectionProps {
  category: CategoryItem;
}

const CategorySection = ({ category }: CategorySectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/30 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-sm text-foreground hover:text-accent transition-colors py-1"
      >
        <span>{category.name}</span>
        {category.children && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {isOpen && category.children && (
        <div className="pl-4 pt-1 space-y-1">
          {category.children.map((child) => {
            const slug = slugify(child);
            return (
              <Link
                key={child}
                to={`/products/category/${slug}`}
                className="block w-full text-left text-sm text-foreground hover:text-foreground transition-colors py-1"
              >
                {child}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CategorySidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-4 bg-background">
        
        <nav className="space-y-0">
          {categories.map((category) => (
            <CategorySection key={category.name} category={category} />
          ))}
        </nav>
      </div>
    </aside>
  );
};