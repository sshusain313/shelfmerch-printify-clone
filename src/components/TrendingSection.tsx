import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, Product } from "@/components/ProductCard";

interface TrendingSectionProps {
  title: string;
  products: Product[];
  accentTitle?: boolean;
}

export const TrendingSection = ({ title, products, accentTitle = false }: TrendingSectionProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Products per page: 4-5 products (4 on tablet, 5 on desktop)
  // Using 5 as base - grid will show 2 on mobile, 4 on tablet, 5 on desktop
  const productsPerPage = 5;
  const totalPages = Math.ceil(products.length / productsPerPage);
  
  // Calculate which products to show
  const startIndex = currentPage * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);
  
  // Check if arrows should be disabled
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;
  
  const goToPrevious = () => {
    if (!isFirstPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };
  
  const goToNext = () => {
    if (!isLastPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">
          {accentTitle ? (
            <>
              {title.split(" ")[0]}{" "}
              <span className="text-green-500">{title.split(" ").slice(1).join(" ")}</span>
            </>
          ) : (
            title
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToPrevious}
            disabled={isFirstPage}
            className={`w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center transition-all duration-200 ${
              isFirstPage
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-foreground hover:text-background cursor-pointer"
            }`}
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={isLastPage}
            className={`w-10 h-10 rounded-full border-2 border-foreground flex items-center justify-center transition-all duration-200 ${
              isLastPage
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-foreground hover:text-background cursor-pointer"
            }`}
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div
          key={currentPage}
          className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in"
        >
          {currentProducts.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};