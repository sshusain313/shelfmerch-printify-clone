import React, { useState } from 'react';
import { BuilderSection } from '@/types/builder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Mail, Megaphone, Sparkles, ShieldCheck, Truck, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: BuilderSection;
  products?: Product[];
  isPreview?: boolean;
  globalStyles?: any;
  onProductClick?: (product: Product) => void;
}

// Image Carousel Component
const ImageCarousel: React.FC<{ images: Array<{ url: string; caption?: string }> }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="relative">
      <div className="aspect-video rounded-xl overflow-hidden bg-muted">
        {currentImage.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex ? "bg-white" : "bg-white/50"
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}

      {currentImage.caption && (
        <p className="mt-3 text-sm text-muted-foreground text-center">{currentImage.caption}</p>
      )}
    </div>
  );
};

// Product Card Component for different layouts
const ProductCard: React.FC<{
  product: Product;
  layout: 'grid' | 'carousel' | 'list';
  showPrice?: boolean;
  showAddToCart?: boolean;
  onClick?: () => void;
}> = ({ product, layout, showPrice = true, showAddToCart = true, onClick }) => {
  const primaryImage = product.mockupUrl || product.mockupUrls?.[0];

  if (layout === 'list') {
    return (
      <Card
        className={cn('p-4 transition-shadow flex gap-4', onClick && 'cursor-pointer hover:shadow-lg')}
        onClick={onClick}
      >
        <div className="w-24 h-24 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {primaryImage ? (
            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
          )}
          {showPrice && (
            <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
          )}
        </div>
        {showAddToCart && (
          <Button size="sm" className="self-center flex-shrink-0">
            Add to Cart
          </Button>
        )}
      </Card>
    );
  }

  // Grid and Carousel cards
  return (
    <Card
      className={cn('p-4 transition-shadow', onClick && 'cursor-pointer hover:shadow-lg')}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted mb-4 rounded flex items-center justify-center overflow-hidden">
        {primaryImage ? (
          <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-semibold line-clamp-2">{product.name}</h3>
      {showPrice && (
        <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
      )}
      {showAddToCart && (
        <Button size="sm" className="w-full mt-3">
          Add to Cart
        </Button>
      )}
    </Card>
  );
};

// Product Carousel Component
const ProductCarousel: React.FC<{
  products: Product[];
  showPrice?: boolean;
  showAddToCart?: boolean;
  onProductClick?: (product: Product) => void;
}> = ({ products, showPrice, showAddToCart, onProductClick }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const itemsPerView = 4;
  const maxScroll = Math.max(0, products.length - itemsPerView);

  const scrollLeft = () => setScrollPosition((prev) => Math.max(0, prev - 1));
  const scrollRight = () => setScrollPosition((prev) => Math.min(maxScroll, prev + 1));

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${scrollPosition * (100 / itemsPerView + 1.5)}%)` }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0" style={{ width: `calc(${100 / itemsPerView}% - 12px)` }}>
              <ProductCard
                product={product}
                layout="carousel"
                showPrice={showPrice}
                showAddToCart={showAddToCart}
                onClick={() => onProductClick?.(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {products.length > itemsPerView && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white shadow-md"
            onClick={scrollLeft}
            disabled={scrollPosition === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white shadow-md"
            onClick={scrollRight}
            disabled={scrollPosition >= maxScroll}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  products = [],
  isPreview = false,
  globalStyles,
  onProductClick,
}) => {
  const textAlign =
    (section.styles.textAlign ||
      (section.settings && section.settings.alignment) ||
      'left') as 'left' | 'center' | 'right';

  const sectionStyle = {
    backgroundColor: section.styles.backgroundColor || 'transparent',
    backgroundImage: section.styles.backgroundImage
      ? `url(${section.styles.backgroundImage})`
      : undefined,
    backgroundSize: section.styles.backgroundImage ? 'cover' : undefined,
    backgroundRepeat: section.styles.backgroundImage ? 'no-repeat' : undefined,
    padding: section.styles.padding
      ? `${section.styles.padding.top}px ${section.styles.padding.right}px ${section.styles.padding.bottom}px ${section.styles.padding.left}px`
      : '32px',
    margin: section.styles.margin
      ? `${section.styles.margin.top}px ${section.styles.margin.right}px ${section.styles.margin.bottom}px ${section.styles.margin.left}px`
      : '0',
    textAlign,
    maxWidth: '100%',
    borderRadius: section.styles.borderRadius || undefined,
  } as React.CSSProperties;

  const innerStyle =
    section.styles.maxWidth && section.styles.maxWidth !== '100%'
      ? { maxWidth: section.styles.maxWidth, margin: '0 auto' }
      : undefined;

  switch (section.type) {
    case 'header':
      return (
        <div style={sectionStyle} className="border-b p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">
              {section.settings.storeName || 'My Store'}
            </h1>
          </div>
        </div>
      );

    case 'announcement-bar':
      return (
        <div
          style={{
            ...sectionStyle,
            backgroundColor: section.styles.backgroundColor || '#111827',
            color: section.styles.color || '#ffffff',
            padding: section.styles.padding
              ? `${section.styles.padding.top}px ${section.styles.padding.right}px ${section.styles.padding.bottom}px ${section.styles.padding.left}px`
              : '12px 16px',
          }}
        >
          <div className="container mx-auto flex flex-col items-center justify-center gap-2 text-sm md:flex-row">
            <div className="flex items-center gap-2 font-medium">
              <Megaphone className="h-4 w-4" />
              <span>{section.settings.message || 'Share a limited time offer or store update here.'}</span>
            </div>
            {section.settings.linkLabel && section.settings.linkUrl && (
              <Button size="sm" variant="secondary">
                {section.settings.linkLabel}
              </Button>
            )}
          </div>
        </div>
      );

    case 'hero':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={{ ...innerStyle, textAlign }}>
            <h1 className="text-5xl font-bold mb-4">{section.settings.heading}</h1>
            {section.settings.subheading && (
              <p className="text-xl mb-8">{section.settings.subheading}</p>
            )}
            {section.settings.buttonText && (
              <Button size="lg">{section.settings.buttonText}</Button>
            )}
          </div>
        </div>
      );

    case 'product-grid': {
      const columns = Math.min(Math.max(Number(section.settings.columns) || 4, 1), 4);
      const productLayout = (section.settings.layout || 'grid') as 'grid' | 'carousel' | 'list';
      const maxProducts = section.settings.maxProducts || 8;
      const displayProducts = products.slice(0, maxProducts);
      const showPrice = section.settings.showPrice !== false;
      const showAddToCart = section.settings.showAddToCart !== false;

      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-8">{section.settings.heading}</h2>
            )}

            {displayProducts.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No products available</p>
              </div>
            ) : productLayout === 'list' ? (
              <div className="space-y-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="list"
                    showPrice={showPrice}
                    showAddToCart={showAddToCart}
                    onClick={() => onProductClick?.(product)}
                  />
                ))}
              </div>
            ) : productLayout === 'carousel' ? (
              <ProductCarousel
                products={displayProducts}
                showPrice={showPrice}
                showAddToCart={showAddToCart}
                onProductClick={onProductClick}
              />
            ) : (
              // Grid layout
              <div
                className={cn(
                  "grid gap-6",
                  // Mobile: Always 1 column for consistent mobile experience
                  "grid-cols-1",
                  // Tablet/Desktop: Use configured columns
                  columns === 2 && "md:grid-cols-2",
                  columns === 3 && "md:grid-cols-3",
                  columns === 4 && "md:grid-cols-4"
                )}
              >
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="grid"
                    showPrice={showPrice}
                    showAddToCart={showAddToCart}
                    onClick={() => onProductClick?.(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'product-collection': {
      const collections = Array.isArray(section.settings.collections) ? section.settings.collections : [];
      const productLayout = (section.settings.layout || 'grid') as 'grid' | 'carousel' | 'list';
      const filterBy = section.settings.filterBy || 'subcategory';
      const maxProductsPerCollection = section.settings.maxProductsPerCollection || 4;
      const showPrice = section.settings.showPrice !== false;

      // Helper function to get products by collection
      // Filters store products based on their catalog product's category/subcategory
      const getProductsForCollection = (collection: any): Product[] => {
        if (!products || products.length === 0) return [];
        if (!collection) return [];

        return products
          .filter((product: any) => {
            // Get category/subcategory from catalog product
            const catalogCategoryId = product.catalogProduct?.categoryId?.toString() ||
              product.categoryId;
            const catalogSubcategoryIds = product.catalogProduct?.subcategoryIds ||
              product.subcategoryIds ||
              [];
            const catalogSubcategoryId = product.catalogProduct?.subcategoryIds?.[0]?.toString() ||
              product.subcategoryId;

            // Normalize collection IDs to strings for comparison
            const collectionSubcategoryId = collection.subcategoryId?.toString();
            const collectionCategoryId = collection.categoryId?.toString();

            if (filterBy === 'subcategory' && collectionSubcategoryId) {
              // First try to match by subcategory
              if (catalogSubcategoryId === collectionSubcategoryId) {
                return true;
              }
              // Check if subcategory is in the array
              if (Array.isArray(catalogSubcategoryIds)) {
                const normalizedCatalogSubs = catalogSubcategoryIds.map((id: any) =>
                  id?.toString() || id
                );
                if (normalizedCatalogSubs.includes(collectionSubcategoryId)) {
                  return true;
                }
              }
              // Fallback: check product.subcategoryId directly (for backward compatibility)
              if (product.subcategoryId?.toString() === collectionSubcategoryId) {
                return true;
              }
            }

            // If subcategory not found or filterBy is 'category', try category
            if (filterBy === 'category' && collectionCategoryId) {
              return catalogCategoryId === collectionCategoryId;
            }

            // If filtering by subcategory but not found, and category is specified, try category as fallback
            if (filterBy === 'subcategory' && !collectionSubcategoryId && collectionCategoryId) {
              return catalogCategoryId === collectionCategoryId;
            }

            return false;
          })
          .slice(0, maxProductsPerCollection);
      };

      if (collections.length === 0) {
        return (
          <div style={sectionStyle}>
            <div className="container mx-auto" style={innerStyle}>
              {section.settings.heading && (
                <h2 className="text-3xl font-bold mb-6">{section.settings.heading}</h2>
              )}
              <p className="text-sm text-muted-foreground">
                Use this section to highlight curated groups of products. Switch layout between grid, carousel, or list in the settings panel.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-4">{section.settings.heading}</h2>
            )}
            {section.settings.description && (
              <p className="text-muted-foreground mb-8">{section.settings.description}</p>
            )}

            <div className="space-y-12">
              {collections.map((collection: any, collectionIndex: number) => {
                const collectionProducts = getProductsForCollection(collection);

                return (
                  <div key={collectionIndex} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold">{collection.name || `Collection ${collectionIndex + 1}`}</h3>
                      {collectionProducts.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {collectionProducts.length} product{collectionProducts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {collectionProducts.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-xl bg-muted/20">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No products found for this collection</p>
                      </div>
                    ) : productLayout === 'list' ? (
                      <div className="space-y-4">
                        {collectionProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            layout="list"
                            showPrice={showPrice}
                            showAddToCart={false}
                            onClick={() => onProductClick?.(product)}
                          />
                        ))}
                      </div>
                    ) : productLayout === 'carousel' ? (
                      <ProductCarousel
                        products={collectionProducts}
                        showPrice={showPrice}
                        showAddToCart={false}
                        onProductClick={onProductClick}
                      />
                    ) : (
                      // Grid layout
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {collectionProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            layout="grid"
                            showPrice={showPrice}
                            showAddToCart={false}
                            onClick={() => onProductClick?.(product)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    case 'text':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-4">{section.settings.heading}</h2>
            )}
            <div dangerouslySetInnerHTML={{ __html: section.settings.content || '' }} />
          </div>
        </div>
      );

    case 'image': {
      const imageLayout = section.settings.layout || 'single';
      // Normalize images to new structure
      const images: Array<{ url: string; caption?: string }> = Array.isArray(section.settings.images)
        ? section.settings.images.map((img: any) =>
          typeof img === 'string' ? { url: img, caption: '' } : img
        )
        : [];

      const renderImagePlaceholder = (caption?: string) => (
        <div className="flex flex-col">
          <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          {caption && (
            <p className="mt-2 text-sm text-muted-foreground text-center">{caption}</p>
          )}
        </div>
      );

      const renderImage = (img: { url: string; caption?: string }, index: number) => (
        <div key={index} className="flex flex-col">
          {img.url ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={img.url}
                alt={img.caption || `Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  `;
                }}
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
          {img.caption && (
            <p className="mt-2 text-sm text-muted-foreground text-center">{img.caption}</p>
          )}
        </div>
      );

      if (images.length === 0) {
        return (
          <div style={sectionStyle}>
            <div className="container mx-auto" style={innerStyle}>
              <div className="text-center py-8 border border-dashed rounded-xl bg-muted/20">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No images yet</p>
                <p className="text-xs text-muted-foreground">Add images in the settings panel</p>
              </div>
            </div>
          </div>
        );
      }

      if (imageLayout === 'single') {
        return (
          <div style={sectionStyle}>
            <div className="container mx-auto" style={innerStyle}>
              {renderImage(images[0], 0)}
            </div>
          </div>
        );
      }

      if (imageLayout === 'grid') {
        const gridColumns = Math.min(Math.max(Number(section.settings.gridColumns) || 3, 2), 4);
        return (
          <div style={sectionStyle}>
            <div className="container mx-auto" style={innerStyle}>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
              >
                {images.map((img, index) => renderImage(img, index))}
              </div>
            </div>
          </div>
        );
      }

      // Carousel layout
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <ImageCarousel images={images} />
          </div>
        </div>
      );
    }

    case 'video': {
      const videoUrl = section.settings.videoUrl || '';
      const provider = section.settings.provider || 'youtube';
      const autoplay = section.settings.autoplay ?? false;
      const controls = section.settings.controls ?? true;
      const aspectRatio = section.settings.aspectRatio || '16:9';

      // Parse aspect ratio (e.g., "16:9" -> 16/9)
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio && heightRatio ? widthRatio / heightRatio : 16 / 9;

      // Helper function to extract video ID from YouTube URL
      const getYouTubeVideoId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      // Helper function to extract video ID from Vimeo URL
      const getVimeoVideoId = (url: string): string | null => {
        const patterns = [
          /(?:vimeo\.com\/)(\d+)/,
          /(?:player\.vimeo\.com\/video\/)(\d+)/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      // Render video based on provider
      const renderVideo = () => {
        if (!videoUrl) {
          return (
            <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Package className="h-10 w-10" />
              <p className="text-sm">No video URL provided</p>
              <p className="text-xs">Add a video URL in the settings panel</p>
            </div>
          );
        }

        // Check if it's a direct video file URL (mp4, webm, etc.)
        const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoUrl);

        if (provider === 'custom' || isDirectVideo) {
          return (
            <div
              className="rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: aspectRatioValue }}
            >
              <video
                src={videoUrl}
                controls={controls}
                autoPlay={autoplay}
                muted={autoplay} // Muted is required for autoplay in most browsers
                loop
                className="w-full h-full object-contain"
                style={{ aspectRatio: aspectRatioValue }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        }

        if (provider === 'youtube') {
          const videoId = getYouTubeVideoId(videoUrl);
          if (!videoId) {
            return (
              <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Package className="h-10 w-10" />
                <p className="text-sm">Invalid YouTube URL</p>
                <p className="text-xs">Please provide a valid YouTube URL</p>
              </div>
            );
          }

          const embedUrl = `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1&mute=1' : ''}${controls ? '' : '&controls=0'}`;

          return (
            <div
              className="rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: aspectRatioValue }}
            >
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ aspectRatio: aspectRatioValue }}
              />
            </div>
          );
        }

        if (provider === 'vimeo') {
          const videoId = getVimeoVideoId(videoUrl);
          if (!videoId) {
            return (
              <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Package className="h-10 w-10" />
                <p className="text-sm">Invalid Vimeo URL</p>
                <p className="text-xs">Please provide a valid Vimeo URL</p>
              </div>
            );
          }

          const embedUrl = `https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1&muted=1' : ''}${controls ? '' : '&controls=0'}`;

          return (
            <div
              className="rounded-xl overflow-hidden bg-black"
              style={{ aspectRatio: aspectRatioValue }}
            >
              <iframe
                src={embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ aspectRatio: aspectRatioValue }}
              />
            </div>
          );
        }

        return (
          <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Package className="h-10 w-10" />
            <p className="text-sm">Unsupported video provider</p>
          </div>
        );
      };

      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            {renderVideo()}
          </div>
        </div>
      );
    }

    case 'newsletter':
      return (
        <div style={sectionStyle}>
          <div
            className="container mx-auto max-w-2xl"
            style={{ ...innerStyle, textAlign }}
          >
            <h2 className="text-3xl font-bold mb-4">{section.settings.heading}</h2>
            {section.settings.description && (
              <p className="text-muted-foreground mb-4">{section.settings.description}</p>
            )}
            <div className="flex gap-2">
              <Input placeholder={section.settings.placeholder} className="flex-1" />
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                {section.settings.buttonText}
              </Button>
            </div>
          </div>
        </div>
      );

    case 'product-details':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="rounded-xl border border-dashed border-muted-foreground/40 bg-muted/40 aspect-square flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {section.settings.showBadge !== false && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Sparkles className="h-3 w-3" />
                    {section.settings.badgeText || 'Bestseller'}
                  </span>
                )}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">Product name</h2>
                  {section.settings.tagline && (
                    <p className="text-sm text-muted-foreground">{section.settings.tagline}</p>
                  )}
                </div>
                {section.settings.showRating !== false && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>{section.settings.ratingValue ?? 4.8} rating</span>
                    <span>•</span>
                    <span>{section.settings.ratingCount ?? 120} reviews</span>
                  </div>
                )}
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                  Preview how pricing, variant selectors, and purchase actions will appear on the live store. Customize messaging, badges, and supporting content here.
                </div>
                {section.settings.showTrustBadges !== false && Array.isArray(section.settings.trustBadges) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {section.settings.trustBadges.map((badge: any, index: number) => (
                      <Card key={index} className="p-4 flex items-start gap-3">
                        <div className="rounded-md bg-primary/10 p-2 text-primary">
                          {badge.icon === 'Truck' ? <Truck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{badge.title || 'Benefit title'}</p>
                          <p className="text-xs text-muted-foreground">
                            {badge.text || 'Highlight fulfillment, quality, or return policies to build trust.'}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );

    case 'product-recommendations': {
      const productLayout = (section.settings.layout || 'grid') as 'grid' | 'carousel' | 'list';
      const maxItems = section.settings.maxItems || 4;
      const displayProducts = products.slice(0, maxItems);
      const showPrice = true;
      const showAddToCart = false;

      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-2xl font-bold">{section.settings.heading || 'You may also like'}</h2>
              {section.settings.subheading && (
                <p className="text-sm text-muted-foreground">{section.settings.subheading}</p>
              )}
            </div>

            {displayProducts.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-xl bg-muted/20">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No products available</p>
              </div>
            ) : productLayout === 'list' ? (
              <div className="space-y-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="list"
                    showPrice={showPrice}
                    showAddToCart={showAddToCart}
                    onClick={() => onProductClick?.(product)}
                  />
                ))}
              </div>
            ) : productLayout === 'carousel' ? (
              <ProductCarousel
                products={displayProducts}
                showPrice={showPrice}
                showAddToCart={showAddToCart}
                onProductClick={onProductClick}
              />
            ) : (
              // Grid layout (default)
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="grid"
                    showPrice={showPrice}
                    showAddToCart={showAddToCart}
                    onClick={() => onProductClick?.(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'footer':
      return (
        <div style={{ ...sectionStyle, color: '#fff', textAlign: 'center' }}>
          <div className="container mx-auto" style={innerStyle}>
            <p>{section.settings.copyright || '© 2025 Your Store. All rights reserved.'}</p>
          </div>
        </div>
      );

    default:
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto">
            <p className="text-muted-foreground">Section type: {section.type}</p>
          </div>
        </div>
      );
  }
};

export default SectionRenderer;
