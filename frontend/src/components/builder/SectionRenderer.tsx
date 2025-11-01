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
        <div style={sectionStyle} className="border-b p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">
              {section.settings.storeName || 'My Store'}
            </h1>
          </div>
        </div>
      );

    case 'hero':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto text-center">
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

    case 'product-grid':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto">
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-8">{section.settings.heading}</h2>
            )}
            <div className="grid grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="aspect-square bg-muted mb-4 rounded flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );

    case 'text':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto">
            {section.settings.heading && (
              <h2 className="text-3xl font-bold mb-4">{section.settings.heading}</h2>
            )}
            <div dangerouslySetInnerHTML={{ __html: section.settings.content || '' }} />
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div style={sectionStyle}>
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">{section.settings.heading}</h2>
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

    case 'footer':
      return (
        <div style={sectionStyle} className="text-white">
          <div className="container mx-auto text-center">
            <p>{section.settings.copyright}</p>
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
