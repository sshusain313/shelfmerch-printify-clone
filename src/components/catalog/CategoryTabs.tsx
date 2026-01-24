import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
// Category images
import apparelImg from "@/assets/category-apparel.jpg";
import accessoriesImg from "@/assets/category-accessories.jpg";
import homeImg from "@/assets/category-home.jpg";
import printImg from "@/assets/category-print.jpg";
import packagingImg from "@/assets/category-packaging.jpg";
import techImg from "@/assets/category-tech.jpg";
import jewelryImg from "@/assets/category-jewelry.jpg";
import hotNewImg from "@/assets/category-hotnew.jpg";
import starterImg from "@/assets/category-starter.jpg";
import kitsImg from "@/assets/category-kits.jpg";

// Subcategory images
import subTshirts from "@/assets/sub-tshirts.jpg";
import subHoodies from "@/assets/sub-hoodies.jpg";
import subSweatshirts from "@/assets/sub-sweatshirts.jpg";
import subJackets from "@/assets/sub-jackets.jpg";
import subCroptops from "@/assets/sub-croptops.jpg";
import subTanktops from "@/assets/sub-tanktops.jpg";
import subLongsleeves from "@/assets/sub-longsleeves.jpg";
import subOversized from "@/assets/sub-oversized.jpg";
import subTotebags from "@/assets/sub-totebags.jpg";
import subCaps from "@/assets/sub-caps.jpg";
import subPhonecovers from "@/assets/sub-phonecovers.jpg";
import subGamingpads from "@/assets/sub-gamingpads.jpg";
import subBeanies from "@/assets/sub-beanies.jpg";
import subSocks from "@/assets/sub-socks.jpg";
import subBackpacks from "@/assets/sub-backpacks.jpg";
import subMugs from "@/assets/sub-mugs.jpg";
import subCushions from "@/assets/sub-cushions.jpg";
import subCans from "@/assets/sub-cans.jpg";
import subFrames from "@/assets/sub-frames.jpg";
import subCoasters from "@/assets/sub-coasters.jpg";
import subBlankets from "@/assets/sub-blankets.jpg";
import subWallart from "@/assets/sub-wallart.jpg";
import subBusinesscards from "@/assets/sub-businesscards.jpg";
import subBooks from "@/assets/sub-books.jpg";
import subStickers from "@/assets/sub-stickers.jpg";
import subPosters from "@/assets/sub-posters.jpg";
import subNotebooks from "@/assets/sub-notebooks.jpg";
import subBoxes from "@/assets/sub-boxes.jpg";
import subBottles from "@/assets/sub-bottles.jpg";
import subPouches from "@/assets/sub-pouches.jpg";
import subIphonecases from "@/assets/sub-iphonecases.jpg";
import subLaptopcases from "@/assets/sub-laptopcases.jpg";
import subRings from "@/assets/sub-rings.jpg";
import subNecklaces from "@/assets/sub-necklaces.jpg";
import subEarrings from "@/assets/sub-earrings.jpg";
import subBracelets from "@/assets/sub-bracelets.jpg";

interface Subcategory {
  name: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  image: string;
  subcategories: Subcategory[];
}

const categories: Category[] = [
  {
    id: "apparel",
    name: "Apparel",
    image: apparelImg,
    subcategories: [
      { name: "T-Shirts", image: subTshirts },
      { name: "Hoodies", image: subHoodies },
      { name: "Sweatshirts", image: subSweatshirts },
      { name: "Jackets", image: subJackets },
      { name: "Crop Tops", image: subCroptops },
      { name: "Tank Tops", image: subTanktops },
      { name: "Long Sleeves", image: subLongsleeves },
      { name: "Oversized Tees", image: subOversized },
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    image: accessoriesImg,
    subcategories: [
      { name: "Tote Bags", image: subTotebags },
      { name: "Caps", image: subCaps },
      { name: "Phone Covers", image: subPhonecovers },
      { name: "Gaming Pads", image: subGamingpads },
      { name: "Beanies", image: subBeanies },
      { name: "Socks", image: subSocks },
      { name: "Backpacks", image: subBackpacks },
    ],
  },
  {
    id: "home",
    name: "Home & Living",
    image: homeImg,
    subcategories: [
      { name: "Mugs", image: subMugs },
      { name: "Cushions", image: subCushions },
      { name: "Cans", image: subCans },
      { name: "Frames", image: subFrames },
      { name: "Coasters", image: subCoasters },
      { name: "Blankets", image: subBlankets },
      { name: "Wall Art", image: subWallart },
    ],
  },
  {
    id: "print",
    name: "Print Products",
    image: printImg,
    subcategories: [
      { name: "Business Cards", image: subBusinesscards },
      { name: "Books", image: subBooks },
      { name: "Stickers", image: subStickers },
      { name: "Posters", image: subPosters },
      { name: "Notebooks", image: subNotebooks },
    ],
  },
  {
    id: "packaging",
    name: "Packaging",
    image: packagingImg,
    subcategories: [
      { name: "Boxes", image: subBoxes },
      { name: "Bottles", image: subBottles },
      { name: "Pouch", image: subPouches },
    ],
  },
  {
    id: "tech",
    name: "Tech",
    image: techImg,
    subcategories: [
      { name: "iPhone Cases", image: subIphonecases },
      { name: "Laptop Cases", image: subLaptopcases },
      { name: "Phone Covers", image: subPhonecovers },
    ],
  },
  {
    id: "jewelry",
    name: "Jewelry",
    image: jewelryImg,
    subcategories: [
      { name: "Rings", image: subRings },
      { name: "Necklaces", image: subNecklaces },
      { name: "Earrings", image: subEarrings },
      { name: "Bracelets", image: subBracelets },
    ],
  },

];

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, "-");
};

const CategoryTabs = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const subcategoryRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const SUBCATEGORIES_SECTION_ID = 'section-subcategories';

  const scrollToSubcategoriesSection = () => {
    const element = document.getElementById(SUBCATEGORIES_SECTION_ID);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('scroll-highlight');
      setTimeout(() => element.classList.remove('scroll-highlight'), 2000);
    }
  };

  const handleCategoryClick = (categoryId: string, e: React.MouseEvent) => {
    const isSelecting = activeCategory !== categoryId;

    // Toggle active category for subcategories display (do this first so section renders)
    if (activeCategory === categoryId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
    }

    // On products page: scroll to "Apparel Categories" (subcategory) section, not "Explore ShelfMerch's Best"
    if (location.pathname === '/products' && isSelecting) {
      e.preventDefault();
      e.stopPropagation();
      // Delay so React can render the subcategory block before we scroll
      setTimeout(scrollToSubcategoriesSection, 200);
    }
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryRef.current) {
      const scrollAmount = 300;
      categoryRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollSubcategories = (direction: "left" | "right") => {
    if (subcategoryRef.current) {
      const scrollAmount = 200;
      subcategoryRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const activeSubcategories = categories.find((c) => c.id === activeCategory)?.subcategories || [];

  return (
    <section className="py-8 relative group/section">
      {/* Section Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Shop by Category</h2>
          <p className="text-muted-foreground mt-1">Browse our main product categories</p>
        </div>
        {/* Navigation Arrows (Top right or floating? Image had them inline/floating. I'll keep them inline but cleaner) */}
      </div>

      {/* Category Carousel Container */}
      <div className="relative">

        {/* Left Arrow - Floating */}
        <button
          onClick={() => scrollCategories("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-background shadow-md border border-border flex items-center justify-center text-foreground transition-all hover:bg-secondary opacity-0 group-hover/section:opacity-100 disabled:opacity-50"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Categories List */}
        <div
          ref={categoryRef}
          className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-4 px-1 snap-x snap-mandatory"
          style={{ scrollBehavior: 'smooth' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={(e) => handleCategoryClick(category.id, e)}
              className={`category-card group relative flex-shrink-0 aspect-[3/4] w-44 sm:w-56 rounded-2xl overflow-hidden snap-start transition-all duration-300 hover:shadow-xl cursor-pointer ${activeCategory === category.id ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

              {/* Category Name */}
              <span className="absolute bottom-4 left-4 right-4 text-left text-white font-bold text-lg tracking-wide">
                {category.name}
              </span>
            </button>
          ))}
        </div>

        {/* Right Arrow - Floating */}
        <button
          onClick={() => scrollCategories("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-background shadow-md border border-border flex items-center justify-center text-foreground transition-all hover:bg-secondary opacity-0 group-hover/section:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Subcategory Sliding Bar - "Apparel Categories" etc. Scroll target for category clicks */}
      {activeCategory && (
        <div id={SUBCATEGORIES_SECTION_ID} className="mt-8 slide-enter overflow-hidden scroll-mt-24">
          <div className="relative">
            <h3 className="text-lg font-semibold mb-4 px-1">
              {categories.find(c => c.id === activeCategory)?.name} Categories
            </h3>
            {/* Sub Scroll Left */}
            <button
              onClick={() => scrollSubcategories("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 rounded-full bg-background shadow border flex items-center justify-center hover:bg-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={subcategoryRef}
              className="flex items-center gap-4 overflow-x-auto scrollbar-hide py-2 px-1 snap-x snap-mandatory"
            >
              {activeSubcategories.map((sub, index) => {
                const slug = slugify(sub.name);
                return (
                  <Link
                    key={sub.name}
                    to={`/products/category/${slug}`}
                    className="group flex-shrink-0 aspect-square w-28 sm:w-32 relative rounded-xl overflow-hidden snap-start transition-all hover:ring-2 hover:ring-primary hover:ring-offset-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <span className="absolute bottom-2 left-2 right-2 text-xs font-semibold text-white text-center">
                      {sub.name}
                    </span>
                  </Link>
                );
              })}
            </div>
            {/* Sub Scroll Right */}
            <button
              onClick={() => scrollSubcategories("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 rounded-full bg-background shadow border flex items-center justify-center hover:bg-secondary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryTabs;
