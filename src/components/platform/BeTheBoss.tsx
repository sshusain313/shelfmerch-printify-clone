import creatorsImg from "@/assets/creators-card.png";
import ecommerceImg from "@/assets/ecommerce.png";
import brandsImg from "@/assets/brands-and-ent.png";

const cards = [
  {
    image: creatorsImg,
    title: "Creators and Designers",
    description: "Monetize your art and audience with zero upfront costs. Selling custom merchandise is a powerful way to turn your creative passion into profit."
  },
  {
    image: ecommerceImg,
    title: "eCommerce Entrepreneurs",
    description: "Start your online business with no upfront investment. Shelf Merch makes launching and scaling your e-commerce brand effortless."
  },
  {
    image: brandsImg,
    title: "Brands and Enterprises",
    description: "Launch new products, expand your reach, or move your merch to on-demand production with ease. Integrate our APIs into your marketing campaigns for seamless promotions."
  }
];

const BeTheBoss = () => {
  return (
    <section className="py-16 md:py-20 lg:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black mb-4">
            Be the Boss with Shelf Merch's Print on Demand Platform
          </h2>
          <p className="text-base md:text-lg text-black">
            From a single order to thousands, our platform handles it all seamlessly.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div key={index} className="relative">
              {/* Image - on top, no border */}
              <div className="aspect-[4/3] overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={card.image} 
                  alt={card.title}
                  className="w-full h-full object-contain object-center"
                />
              </div>
              {/* Text container with gray background - positioned below image, behind text */}
              <div className="bg-gray-50 p-6 relative -mt-8 pt-12">
                <h3 className="text-xl font-bold text-black mb-3 relative z-10">{card.title}</h3>
                <p className="text-base text-black leading-relaxed relative z-10">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeTheBoss;