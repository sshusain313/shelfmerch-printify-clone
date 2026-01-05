import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import rubixLogo from "@/assets/rubix-full.png";
import yumChicLogo from "@/assets/yumchic.png";
import datadogLogo from "@/assets/datadog2.png";
import chhotaBheemLogo from "@/assets/chhota.png";
import indeRacingLogo from "@/assets/racing.png";
import googleLogo from "@/assets/google.png";
import ahaLogo from "@/assets/aha.png";

const PartnerLogos = () => {
  // Update this array with your logo image imports
  // Example: import rubixLogo from "@/assets/logos/rubix.png";
  const partners = [
    { name: "Chhota Bheem", logo: chhotaBheemLogo },
    { name: "INDE Racing", logo: indeRacingLogo },
    { name: "Google", logo: googleLogo },
    { name: "aha", logo: ahaLogo },
    { name: "Rubix", logo: rubixLogo },
    { name: "Yum Chic", logo: yumChicLogo },
    { name: "Datadog", logo: datadogLogo },
  ];

  return (
    <section className="py-8 border-y border-border bg-background">
      <div className="container">
        <Carousel 
          className="w-full" 
          opts={{ 
            dragFree: true, 
            loop: false,
            align: "start",
            slidesToScroll: "auto"
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-2">
            {partners.map((partner, index) => (
              <CarouselItem key={index} className="pl-2 md:pl-3 basis-auto">
                <div className="flex items-center justify-center h-16 md:h-20 px-6 md:px-8 opacity-70 hover:opacity-100 transition-opacity">
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name} 
                      className="h-12 md:h-14 max-w-[120px] md:max-w-[140px] w-auto object-contain object-center grayscale hover:grayscale-0 transition-all cursor-pointer"
                    />
                  ) : (
                    <div className="text-foreground font-semibold text-lg md:text-xl grayscale hover:grayscale-0 transition-all cursor-pointer">
                      {partner.name}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default PartnerLogos;
