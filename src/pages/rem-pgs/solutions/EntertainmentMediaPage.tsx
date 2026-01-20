import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import FeatureIcons from '@/components/shared/FeatureIcons';
import ProductGrid from '@/components/shared/ProductGrid';
import heroEntertainment from '@/assets/hero-entertainment.png';
import onDemandSolutions from '@/assets/on-demand.png';
import hunter from '@/assets/hunter.png';
import multi from '@/assets/multi.png';

const EntertainmentMediaPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Entertainment & Media
              </h1>
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                Focus on entertainment while we handle the logistics, delivering custom merch that engages your audience.
              </p>
              <Link
                to="/support/contact-us"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
              >
                Let's Talk
              </Link>
            </div>
            
            {/* Right: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={heroEntertainment}
                alt="Concert with fireworks"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Image on Left, Text on Right */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={onDemandSolutions}
                alt="iPhone 14 Pro Max Cover"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
              On-Demand Solutions to Spotlight Your Brand
              </h2>
              <p className="section-subtitle">
              Focus on entertaining your audience, not managing logistics. Shelf Merch takes care of end-to-end supply chain solutions, delivering premium products that scale your business and elevate your brand image effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Image on Right, Text on Left */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
              Quality Products That Uphold Your Brand
              </h2>
              <p className="section-subtitle">
              We know quality is non-negotiable. That's why every manufacturer in our global network meets the rigorous Shelf Merch Standard—an extensive vetting process and ongoing quality checks to ensure consistent product and print excellence. Plus, our in-house production serves as a reliable backup for immediate needs, so your brand never skips a beat
              </p>
            </div>
            
            {/* Right: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={hunter}
                alt="Multi-store management platform"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Image on Left, Text on Right */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={multi}
                alt="Entertainment platform"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
              Effortless Multi-Store Management for Seamless Scaling
              </h2>
              <p className="section-subtitle">
              Our platform is designed to simplify multi-store management and enable effortless scalability. With our robust and flexible API, brands can create tailored, out-of-the-box shopping experiences while relying on Shelf Merch’s technology to deliver a smooth and reliable user journey every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FeatureIcons />
      <ProductGrid />
      <Footer />
    </>
  );
};

export default EntertainmentMediaPage;