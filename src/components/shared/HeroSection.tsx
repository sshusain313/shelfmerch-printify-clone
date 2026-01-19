import { Link } from 'react-router-dom';

interface HeroSectionProps {
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  image: string;
  imageAlt: string;
  reversed?: boolean;
  gradient?: boolean;
}

const HeroSection = ({
  title,
  description,
  ctaText = "Let's Talk",
  ctaLink = "/",
  image,
  imageAlt,
  reversed = false,
  gradient = true,
}: HeroSectionProps) => {
  return (
    <section className={`relative ${gradient ? 'bg-gradient-to-br from-muted/50 to-background' : 'bg-background'}`}>
      <div className="container-custom py-6 lg:py-8">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
          {/* Content */}
          <div className={`space-y-4 ${reversed ? 'lg:order-2' : ''}`}>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-description">{description}</p>
            <Link
              to={ctaLink}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
            >
              {ctaText}
            </Link>
          </div>

          {/* Image */}
          <div className={`${reversed ? 'lg:order-1' : ''}`}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-auto object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;