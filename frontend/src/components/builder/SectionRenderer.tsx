import React from 'react';
import { BuilderSection } from '@/types/builder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Mail } from 'lucide-react';
import { Product } from '@/types';

interface SectionRendererProps {
  section: BuilderSection;
  products?: Product[];
  isPreview?: boolean;
  globalStyles?: any;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  products = [],
  isPreview = false,
  globalStyles,
}) => {
  const sectionStyle = {
    backgroundColor: section.styles.backgroundColor || 'transparent',
    backgroundImage: section.styles.backgroundImage
      ? `url(${section.styles.backgroundImage})`
      : undefined,
    padding: section.styles.padding
      ? `${section.styles.padding.top}px ${section.styles.padding.right}px ${section.styles.padding.bottom}px ${section.styles.padding.left}px`
      : '32px',
    margin: section.styles.margin
      ? `${section.styles.margin.top}px ${section.styles.margin.right}px ${section.styles.margin.bottom}px ${section.styles.margin.left}px`
      : '0',
    textAlign: section.styles.textAlign || 'left',
    maxWidth: section.styles.maxWidth || '100%',
  };

  switch (section.type) {
    case 'header':
      return (
        <header style={sectionStyle} className="border-b">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1
                className="text-2xl font-bold"
                style={{ color: globalStyles?.primaryColor || '#000' }}
              >
                {section.settings.logo ? (
                  <img src={section.settings.logo} alt="Logo" className="h-8" />
                ) : (
                  section.settings.storeName
                )}
              </h1>
              {section.settings.menuItems && (
                <nav className="hidden md:flex gap-6">
                  {section.settings.menuItems.map((item: any, idx: number) => (
                    <a key={idx} href={item.link} className="hover:opacity-70 transition-opacity">
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
            </div>
            {section.settings.showSearch && (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  Search
                </Button>
                <Button size="sm" style={{ backgroundColor: globalStyles?.primaryColor }}>
                  Cart (0)
                </Button>
              </div>
            )}
          </div>
        </header>
      );

    case 'hero':
      return (
        <section style={sectionStyle} className="relative">
          <div className="container mx-auto" style={{ textAlign: section.settings.alignment || 'center' }}>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ fontFamily: globalStyles?.headingFont }}
            >
              {section.settings.heading}
            </h1>
            {section.settings.subheading && (
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {section.settings.subheading}
              </p>
            )}
            {section.settings.buttonText && (
              <Button
                size="lg"
                style={{ backgroundColor: globalStyles?.primaryColor }}
                asChild
              >
                <a href={section.settings.buttonLink || '#'}>{section.settings.buttonText}</a>
              </Button>
            )}
          </div>
        </section>
      );

    case 'product-grid':
      const displayProducts = section.settings.showAll
        ? products
        : products.filter((p) => section.settings.productIds?.includes(p.id));

      return (
        <section style={sectionStyle}>
          <div className="container mx-auto">
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-8" style={{ textAlign: section.styles.textAlign }}>
                {section.settings.heading}
              </h2>
            )}
            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${section.settings.columns || 4}, minmax(0, 1fr))`,
              }}
            >
              {displayProducts.length > 0 ? (
                displayProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden group">
                    <div className="aspect-square bg-muted">
                      {product.mockupUrl ? (
                        <img
                          src={product.mockupUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{product.name}</h3>
                      {section.settings.showPrice && (
                        <p
                          className="text-lg font-bold mb-2"
                          style={{ color: globalStyles?.primaryColor }}
                        >
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                      {section.settings.showAddToCart && (
                        <Button
                          size="sm"
                          className="w-full"
                          style={{ backgroundColor: globalStyles?.primaryColor }}
                        >
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products to display</p>
                </div>
              )}
            </div>
          </div>
        </section>
      );

    case 'text':
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto max-w-4xl\">
            {section.settings.heading && (
              <h2
                className=\"text-3xl font-bold mb-6\"
                style={{ fontFamily: globalStyles?.headingFont }}
              >
                {section.settings.heading}
              </h2>
            )}
            <div
              className=\"prose prose-lg max-w-none\"
              dangerouslySetInnerHTML={{ __html: section.settings.content || '' }}
            />
          </div>
        </section>
      );

    case 'image':
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto\">
            {section.settings.images && section.settings.images.length > 0 ? (
              <div
                className={
                  section.settings.layout === 'gallery'
                    ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
                    : ''
                }
              >
                {section.settings.images.map((img: string, idx: number) => (
                  <img
                    key={idx}
                    src={img}
                    alt={section.settings.caption || `Image ${idx + 1}`}
                    className=\"w-full rounded-lg\"
                    style={{
                      aspectRatio: section.settings.aspectRatio || 'auto',
                      objectFit: 'cover',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className=\"bg-muted rounded-lg p-12 text-center\">
                <p className=\"text-muted-foreground\">No images added</p>
              </div>
            )}
            {section.settings.caption && (
              <p className=\"text-center text-muted-foreground mt-4\">{section.settings.caption}</p>
            )}
          </div>
        </section>
      );

    case 'video':
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto max-w-4xl\">
            {section.settings.videoUrl ? (
              <div
                className=\"relative w-full\"
                style={{
                  paddingBottom:
                    section.settings.aspectRatio === '16:9' ? '56.25%' : '75%',
                }}
              >
                <iframe
                  src={section.settings.videoUrl}
                  className=\"absolute top-0 left-0 w-full h-full rounded-lg\"
                  allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className=\"bg-muted rounded-lg p-12 text-center\">
                <p className=\"text-muted-foreground\">No video URL provided</p>
              </div>
            )}
          </div>
        </section>
      );

    case 'newsletter':
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto max-w-2xl\">
            {section.settings.heading && (
              <h2 className=\"text-3xl font-bold mb-4\">{section.settings.heading}</h2>
            )}
            {section.settings.description && (
              <p className=\"text-gray-600 mb-6\">{section.settings.description}</p>
            )}
            <div className=\"flex gap-3\">
              <Input
                placeholder={section.settings.placeholder || 'Enter your email'}
                type=\"email\"
                className=\"flex-1\"
              />
              <Button style={{ backgroundColor: globalStyles?.primaryColor }}>
                <Mail className=\"h-4 w-4 mr-2\" />
                {section.settings.buttonText || 'Subscribe'}
              </Button>
            </div>
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto\">
            {section.settings.heading && (
              <h2 className=\"text-3xl font-bold mb-8 text-center\">{section.settings.heading}</h2>
            )}
            <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
              {section.settings.testimonials?.map((testimonial: any, idx: number) => (
                <Card key={idx} className=\"p-6\">
                  <div className=\"flex items-center gap-4 mb-4\">
                    {testimonial.avatar && (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className=\"w-12 h-12 rounded-full\"
                      />
                    )}
                    <div>
                      <p className=\"font-semibold\">{testimonial.name}</p>
                      <div className=\"flex gap-1\">
                        {Array.from({ length: testimonial.rating || 5 }).map((_, i) => (
                          <span key={i} className=\"text-yellow-500\">
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className=\"text-gray-600\">{testimonial.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );

    case 'footer':
      return (
        <footer style={sectionStyle} className=\"text-white\">
          <div className=\"container mx-auto\">
            <div className=\"grid grid-cols-1 md:grid-cols-4 gap-8 mb-8\">
              {section.settings.sections?.map((footerSection: any, idx: number) => (
                <div key={idx}>
                  <h3 className=\"font-semibold mb-4\">{footerSection.title}</h3>
                  <ul className=\"space-y-2\">
                    {footerSection.links?.map((link: any, linkIdx: number) => (
                      <li key={linkIdx}>
                        <a href={link.url} className=\"hover:opacity-70 transition-opacity\">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {section.settings.copyright && (
              <div className=\"border-t border-gray-700 pt-8 text-center text-sm\">
                {section.settings.copyright}
              </div>
            )}
          </div>
        </footer>
      );

    case 'custom-html':
      return (
        <section style={sectionStyle}>
          <div
            className=\"container mx-auto\"
            dangerouslySetInnerHTML={{ __html: section.settings.html || '' }}
          />
        </section>
      );

    default:
      return (
        <section style={sectionStyle}>
          <div className=\"container mx-auto\">
            <p className=\"text-muted-foreground\">Unknown section type: {section.type}</p>
          </div>
        </section>
      );
  }
};

export default SectionRenderer;
