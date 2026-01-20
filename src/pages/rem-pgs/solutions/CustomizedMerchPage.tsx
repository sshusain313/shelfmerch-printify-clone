import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import ContentSection from '@/components/shared/ContentSection';
import FeatureIcons from '@/components/shared/FeatureIcons';
import ProductGrid from '@/components/shared/ProductGrid';
import customizedMerch from '@/assets/custom-merch.png';
import workflowCircle from '@/assets/offering.png'; 
import productRange from '@/assets/prod-range.png';
import quality from '@/assets/quality.png';
import qualityProducts from '@/assets/quality-products.png';

const CustomizedMerchPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="py-8 lg:py-12 bg-muted/20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Customized Merch
              </h1>
              <p className="text-lg md:text-xl text-foreground leading-relaxed">
                Customized merchandise with on-demand personalization, offering unique products tailored to your brand and audience.
              </p>
              <Link
                to="/support/contact-us"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
              >
                Let's Talk
              </Link>
            </div>
            
            {/* Right: Image */}
            <div>
              <img
                src={customizedMerch}
                alt="Models wearing custom printed merchandise"
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personalization Section */}
      <section className="py-8 lg:py-12 bg-muted/30">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Circular Graphic */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-md">
                <img
                  src={workflowCircle}
                  alt="Product workflow diagram"
                  className="w-full h-auto"
                />
              </div>
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                Offering personalized products has never been easier.
              </h2>
              <p className="text-base md:text-lg text-foreground leading-relaxed">
                Shelf Merch is the only print-on-demand provider with a seamless, development-free workflow that allows you to quickly personalize products. Our integration minimizes human error, ensuring your customers always receive the right order, on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Robust Product Range Section */}
      <section className="py-8 lg:py-12 bg-muted/20">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">A Robust and Flexible Product Range</h2>
              <p className="section-subtitle">
                No need to compromise on variety. With one of the largest catalogs in the print-on-demand industry, Shelf Merch offers a wide range of customizable items—from mugs and blankets to metal posters and more—helping you create unique, personalized products that perfectly represent your brand.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                View Products
                <span>→</span>
              </Link>
            </div>
            
            {/* Right: Image */}
            <div>
              <img
                src={productRange}
                alt="Product range collage"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quality Section */}
      <section className="py-8 lg:py-12 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Product Image with Testimonials */}
            <div>
              <img
                src={quality}
                alt="Quality products with customer testimonials"
                className="w-full h-auto"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h2 className="section-title">
                Quality Products = Happier Customers
              </h2>
              <p className="section-subtitle">
                Partnering with Shelf Merch gives you access to a global network of printing hubs, each held to the highest standards. Every printer in our network undergoes rigorous vetting and frequent quality control checks, ensuring that each product meets our exceptional product and print quality standards.
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

export default CustomizedMerchPage;