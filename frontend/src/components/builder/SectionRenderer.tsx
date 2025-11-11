import React from 'react';
import { BuilderSection } from '@/types/builder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Mail, Megaphone, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: BuilderSection;
  products?: Product[];
  isPreview?: boolean;
  globalStyles?: any;
  onProductClick?: (product: Product) => void;
}

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
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-8">{section.settings.heading}</h2>
            )}
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {products.slice(0, 8).map((product) => (
                <Card
                  key={product.id}
                  className={cn('p-4 transition-shadow', onProductClick && 'cursor-pointer hover:shadow-lg')}
                  onClick={() => onProductClick?.(product)}
                >
                  <div className="aspect-square bg-muted mb-4 rounded flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  {section.settings.showPrice !== false && (
                    <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'product-collection':
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

    case 'image':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            {section.settings.caption && (
              <p className="mt-3 text-sm text-muted-foreground text-center">{section.settings.caption}</p>
            )}
          </div>
        </div>
      );

    case 'video':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <div className="aspect-video rounded-xl border border-dashed border-muted-foreground/40 bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Package className="h-10 w-10" />
              <p className="text-sm">Video embed placeholder</p>
              <p className="text-xs">Supports YouTube, Vimeo, or custom sources.</p>
            </div>
          </div>
        </div>
      );

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

    case 'product-recommendations':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto" style={innerStyle}>
            <div className="flex flex-col gap-2 mb-6">
              <h2 className="text-2xl font-bold">{section.settings.heading || 'You may also like'}</h2>
              {section.settings.subheading && (
                <p className="text-sm text-muted-foreground">{section.settings.subheading}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: section.settings.maxItems || 4 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-1">
                    <p className="text-sm font-semibold">Product title</p>
                    <p className="text-xs text-muted-foreground">Preview how related products appear on the storefront.</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );

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
