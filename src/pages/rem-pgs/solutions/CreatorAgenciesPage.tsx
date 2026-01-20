import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import HeroSection from '@/components/shared/HeroSection';
import CenteredStatement from '@/components/shared/CenteredStatement';
import ContentSection from '@/components/shared/ContentSection';
import InfoCard from '@/components/shared/InfoCard';
import heroConcert from '@/assets/c1.png';
import manageMerch from '@/assets/manage-merch.png';
import worldMap from '@/assets/world-map.png';
import flexible from '@/assets/flexible.png';
const infoCards = [
  {
    title: 'Entertainment Agencies/OTTs/Channels',
    description: 'Boost brand awareness and loyalty for your clients by promoting new films or TV series with licensed products. These high-quality, customized items not only drive engagement but also elevate profits, creating a lasting connection with audiences.',
  },
  {
    title: 'Personal Brands',
    description: "Leverage your online influence with custom merchandise featuring your unique catchphrases, illustrations, or artwork. It's a powerful way to engage with your fans, strengthen your personal brand, and generate additional revenue streams.",
  },
  {
    title: 'Online Retailers and Marketplaces',
    description: 'Tap into the Shelf Merch fulfillment network to unlock the benefits of on-demand manufacturing. Transition your existing product catalog to on-demand to cut inventory costs and minimize risks. Launch new products globally with ease, or enable customers to design and order custom products through the Shelf Merch API.',
  },
  {
    title: 'Event Organizers',
    description: 'From conferences to music festivals, personalized merchandise is key to boosting event success. Easily drive revenue and expand brand visibility without the hassle of order fulfillment, packaging, or shipping.',
  },
];

const CreatorsAgenciesPage = () => {
  return (
    <>
    <Header />
      <HeroSection
        title="Creators & Agencies"
        description="Shelf Merch makes custom merch easy with premium designs and reliable delivery for creators and agencies."
        ctaText="Let's Talk"
        ctaLink="/support/contact-us"
        image={heroConcert}
        imageAlt="Concert crowd with stage lights"
      />

      <CenteredStatement
        text="Whether you're an influencer, talent manager, or agency handling multiple brands, Shelf Merch provides all the tools you need to create and launch a successful merchandise line."
      />

      {/* Maximize your Merch Section */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Long Text */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Maximize your Merch
              </h2>
              <div className="space-y-4">
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  Gone are the days when merchandise creators were limited to band t-shirts sold at shows. Today, creators are driving sales through live streams, collaborations, eCommerce, and more.
                </p>
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  Take Taylor Swift's merchandise, for example. Her creative and diverse merch range—from vinyl records and jewelry to clothing and exclusive fan bundles—has become a major revenue stream and an extension of her brand. In fact, global consumers spent over $200 billion on merchandise last year, spanning industries like music, media, entertainment, and gaming. Whether it's a pop star, a production company, or a TV personality, merchandise is now an integral part of every brand's marketing strategy.
                </p>
                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  That's why it's crucial to move beyond the classic t-shirt and create more engaging, personalized products that truly resonate with your audience. Offering exclusive merchandise as part of a loyalty program, replacing traditional coupons, or using limited-edition items to create buzz around a product launch or campaign can elevate your brand, build deeper connections, and drive customer loyalty. With Shelf Merch, you can offer a wide range of customizable products to create memorable merch experiences that go beyond expectations.
                </p>
              </div>
            </div>

            {/* Right Column - Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4">
              {infoCards.map((card) => (
                <InfoCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <ContentSection
        title="Manage Your Merch with Ease"
        description="In just minutes, connect Shelf Merch to your existing store or create a new one. Enjoy the power of an automated supply chain—no more worrying about order entry, printing, packing, or shipping. With our centralized order management system, you can effortlessly manage everything while we handle the rest."
        image={manageMerch}
        imageAlt="Woman managing merch on laptop"
        ctaText="Get started"
        ctaLink="/"
      />

      {/* Unlimited Stores Section */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="section-title">Unlimited Stores and SKUs</h2>
              <p className="section-subtitle">
                Easily manage unlimited stores and products across multiple platforms with a single tool. Choose from over 100 high-quality products and enjoy the flexibility to add new items as your business grows. With endless options at your fingertips, you'll never run out of possibilities.
              </p>
              <a href="/" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                View Catalogue
                <span>→</span>
              </a>
            </div>
            <div>
              <img
                src={worldMap}
                alt="Global distribution network"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Flexible and Reliable Solutions Section */}
      <section className="py-4 lg:py-6 bg-background">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Image */}
            <div className="max-w-md mx-auto lg:max-w-full lg:mx-0">
              <img
                src={flexible}
                alt="Licensed products solutions"
                className="w-full h-auto max-w-md mx-auto lg:max-w-lg"
              />
            </div>
            
            {/* Right: Text Content */}
            <div className="space-y-4">
              <h2 className="section-title">Flexible and Reliable Solutions for Your Licensed Products</h2>
              <p className="section-subtitle">
                Bring your custom product ideas to life with the Shelf Merch API, offering the flexibility to build tailored tech stacks. Our integrations seamlessly connect across multiple platforms, ensuring a smooth experience for your brand. Effortlessly route orders and deliver products globally, all without managing any inventory.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default CreatorsAgenciesPage;