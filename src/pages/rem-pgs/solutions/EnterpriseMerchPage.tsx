import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import HeroSection from '@/components/shared/HeroSection';
import ContentSection from '@/components/shared/ContentSection';
import FeatureIcons from '@/components/shared/FeatureIcons';
import ProductGrid from '@/components/shared/ProductGrid';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import heroEnterprise from '@/assets/hero-enterprise.png';
import digitalStore from '@/assets/digital-store.png';
import orderSummary from '@/assets/submit-order.png';
import dataDog from '@/assets/datadog.png';
import spalba from '@/assets/spalba.png';
import chhotaBheem from '@/assets/superhero.png';
import cocaCola from '@/assets/cocacola.png';
import rubix from '@/assets/rubix.png';
import aiims from '@/assets/aiims.png';
import brandedDigitalStore from '@/assets/branded-dig.png';
import robust from '@/assets/robust.png'; 
import quality from '@/assets/quality-products.png';
import seamless from '@/assets/seamless.png';
import unlimited from '@/assets/unlim-cap.png';
import consistent from '@/assets/consistent-q.png';

const testimonials = [
  {
    company: 'Data Dog',
    subtitle: 'Cloud Monitoring Experts',
    quote: "Shelf Merch delivered premium, on-demand T-shirts that perfectly showcased our brand for our giveaway campaign. Their seamless process, focus on customization, and high-quality designs were a hit with attendees, making them the ideal partner!",
    headerBg: 'bg-blue-600 ',
    textBoxBg: 'bg-green-100',
    image: dataDog,
  },
  {
    company: 'Spalba',
    subtitle: 'Event Management',
    quote: "For our sustainability initiative, Shelf Merch delivered premium, high-GSM T-shirts made from recycled bottles and waste fabric, meeting top sustainable standards. Their eco-conscious, carbon-neutral approach made them the perfect partner for impactful branding.",
    headerBg: 'bg-gray-800',
    textBoxBg: 'bg-blue-100',
    image: spalba,
  },
  {
    company: 'Green Gold Animations',
    subtitle: 'Creators of Chhota Bheem',
    quote: "Shelf Merch revolutionized Chhota Bheem merchandise, refreshing our product line and launching ChhotaBheem.store with seamless customization for fans. Their innovative approach and flawless execution have elevated our brand, delivering an exceptional experience for our audience.",
    headerBg: 'bg-white',
    textBoxBg: 'bg-purple-100',
    image: chhotaBheem,
  },
  {
    company: 'Coca Cola',
    subtitle: 'Soft Drink Manufacturer',
    quote: "Coca-Cola sought unique, sustainable merchandise for giveaways, and Shelf Merch delivered customized T-shirts made from eco-friendly fabric with the Coke logo creatively placed on the back. Their Hyderabad experience center with samples and a live printing studio enhanced the experience.",
    headerBg: 'bg-gray-100',
    textBoxBg: 'bg-gray-100',
    image: cocaCola,
  },
  {
    company: 'Rubix',
    subtitle: 'L1 Blockchain Platform',
    quote: "Shelfmerch saved the day for Gitex Dubai, delivering 500 high-quality units in just 48 hours. Their speed, reliability, and exceptional service boosted our brand presence, making them our go-to partner for merchandise.",
    textBoxBg: 'bg-yellow-100',
    headerBg: 'bg-yellow-100',
    image: rubix,
  },
  {
    company: 'AIIMS',
    subtitle: 'Public Medical Research and Hospital',
    quote: "Coca-Cola sought unique, sustainable merchandise for giveaways, and Shelf Merch delivered customized T-shirts made from eco-friendly fabric with the Coke logo creatively placed on the back. Their Hyderabad experience center with samples and a live printing studio enhanced the experience.",
    headerBg: 'bg-light-pink-100',
    textBoxBg: 'bg-gray-100',
    image: aiims,
  },
];

const EnterpriseMerchPage = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <>
    <Header />
      <HeroSection
        title="Enterprise Merch"
        description="Elevate your business with Shelf Merch—providing top-quality merchandise and high profitability for businesses of any size. Zero risk, all reward."
        ctaText="Let's Talk"
        ctaLink="/support/contact-us"
        image={heroEnterprise}
        imageAlt="Premium framed artwork"
      />

      {/* Testimonials Section */}
      <section className="py-8 lg:py-12 bg-muted/30">
        <div className="container-custom">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/3">
                  <div className="bg-white rounded-t-2xl overflow-hidden shadow-lg h-full flex flex-col">
                    {/* Header Section */}
                    <div className={`relative ${testimonial.headerBg} h-56 flex overflow-hidden`}>
                      {/* Left: Image/Logo Area */}
                      <div className="flex-1 flex items-center justify-center p-4">
                        {testimonial.image ? (
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.company}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white/30 text-sm">Image</span>
                          </div>
                        )}
                      </div>
                      {/* Right: Text Box */}
                      <div className={`${testimonial.textBoxBg} px-4 py-6 flex flex-col justify-center min-w-[160px] border-l border-white/20`}>
                        <h3 className="text-base font-bold text-foreground mb-1">{testimonial.company}</h3>
                        <p className="text-sm text-foreground/70">{testimonial.subtitle}</p>
                      </div>
                    </div>
                    {/* Testimonial Content */}
                    <div className="bg-white p-6 flex-1">
                      <p className="text-sm text-foreground leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  current === index ? 'bg-foreground' : 'bg-foreground/20'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Print on Demand Section */}
      <section className="py-8 lg:py-12 bg-background">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Is Print on Demand right for your business?
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Image with Branded Digital Store */}
            <div className="relative">
              <div className="relative">
                <img
                  src={brandedDigitalStore}
                  alt="Branded Digital Store on smartphone"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    Branded Digital Store
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-6">
              <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                Offering personalized products has never been easier.
              </h3>
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
            {/* Content */}
            <div className="space-y-6 lg:order-1">
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
            
            {/* Image */}
            <div className="lg:order-2">
              <img
                src={robust}
                alt="Digital store on devices"
                className="w-full h-auto rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quality Products Section - Custom to blend image with background */}
      <section className="py-8 lg:py-12 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image - Blended with background */}
            <div>
              <img
                src={quality}
                alt="Order summary dashboard"
                className="w-full h-auto"
              />
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              <h2 className="section-title">Quality Products = Happier Customers</h2>
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

export default EnterpriseMerchPage;