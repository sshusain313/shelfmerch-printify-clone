import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import FeatureIcons from '@/components/shared/FeatureIcons';
import ProductGrid from '@/components/shared/ProductGrid';
import f1 from '@/assets/f1.png';
import f2 from '@/assets/f2.png';
import f3 from '@/assets/f3.png';
import f4 from '@/assets/f4.png';

const FashionApparelPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="py-3 lg:py-4 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Fashion & Apparel
              </h1>
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                Custom fashion and apparel with premium-quality, on-demand designs to elevate your brand.
              </p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
              >
                Let's Talk
              </Link>
            </div>
            
            {/* Right: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={f1}
                alt="Fashion & Apparel"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Image on Left, Text on Right */}
      <section className="pt-2 pb-2 lg:pt-3 lg:pb-3 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={f2}
                alt="Set trends without compromising on quality or speed"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
                Set trends without compromising on quality or speed
              </h2>
              <p className="section-subtitle">
                Why choose between quality and speed when you can have both? Our partnerships with top-tier manufacturers, equipped with cutting-edge technology, ensure high-quality products at competitive prices. Enjoy rapid production times without sacrificing excellence, so you can stay ahead of the curve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Image on Right, Text on Left */}
      <section className="pt-2 pb-2 lg:pt-3 lg:pb-3 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
                Leverage a Global Network for Unmatched Scalability
              </h2>
              <p className="section-subtitle">
                Shelf Merch's distributed and managed global supply chain goes beyond single manufacturers or in-house facilities. By partnering with multiple production hubs worldwide, we ensure consistent product availability and seamless order fulfillment—no matter the demand or circumstances.
              </p>
            </div>
            
            {/* Right: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={f3}
                alt="Global Network for Scalability"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Image on Left, Text on Right */}
      <section className="pt-2 pb-2 lg:pt-3 lg:pb-3 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={f4}
                alt="Sustainable Fashion"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
                Create Freely While Staying Sustainably Conscious
              </h2>
              <p className="section-subtitle">
                With our extensive range of apparel, you can embrace trends and test your creativity without the burden of unsold inventory. By producing only what's needed, Shelf Merch helps eliminate waste, reduce overproduction, and support a more sustainable future.
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


export default FashionApparelPage;