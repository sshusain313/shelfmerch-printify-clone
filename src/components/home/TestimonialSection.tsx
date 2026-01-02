import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import testimonialAvatar from "@/assets/testimonial-avatar.png";
import thakurSisters from "@/assets/thakur-sisters.png";
import chhotaBheem from "@/assets/chhota-bheem.png";
import siddharthKannan from "@/assets/siddharth-kannan.png";

const TestimonialSection = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const testimonials = [
    {
      stars: 5,
      quote: "Launching Aha Merch with Shelf Merch Was a Game Changer! They Handled the Entire Digital Store from Concept to Cash!",
      description: "Introducing merchandise for our audience has been an exciting way to enhance engagement and boost our brand presence. Shelf Merch made the entire process effortless by handling all logistics and production, allowing us to focus on connecting with our viewers. Their support has been invaluable in bringing our vision to life!",
      name: "aha",
      title: "Leading Telugu OTT Platform",
      website: "ahavideo.shop",
      image: testimonialAvatar,
    },
    {
      stars: 5,
      quote: "Shelf Merch Made Launching Angaar.store a Breeze with Seamless YouTube Integration",
      description: "Launching Angaar.store with Shelf Merch has been a seamless experience. The platform's integration with YouTube was incredibly easy, and the team's support was exceptional. From building my brand to setting up the store and managing end-to-end fulfillment, they handled everything flawlessly. Shelf Merch made the entire process smooth and efficient, allowing me to focus on connecting with my fans and delivering quality merchandise",
      name: "Siddharth Kannan",
      title: "Indian television host and radio announcer",
      website: "angaar.store",
      image: siddharthKannan,
    },
    {
      stars: 5,
      quote: "We're Happy to Launch Chhota Bheem's Official Merch with Shelf Merch! Smooth Setup and Cool Customization option for Fans!",
      description: "We are thrilled to launch Chhota Bheem's official merchandise with Shelf Merch. As a beloved character for years, it was important for us to provide a seamless experience for our fans. The digital store setup was smooth, and the customization tool is a fantastic feature, allowing fans to create personalized products they love. Shelf Merch made the entire process easy and efficient!",
      name: "Chhota Bheem",
      title: "Animated Adventure Cartoon Series",
      website: "chhotabheem.store",
      image: chhotaBheem,
    },
    {
      stars: 5,
      quote: "Launching Yumchic.store with Shelf Merch Was Simple! They Helped Us Build a Digital Store with Designs Ours Fans Love!",
      description: "Launching YumChic.store with Shelf Merch has been an incredible journey. The platform made it super easy to set up our official merchandise and seamlessly integrate it with YouTube. The Shelf Merch team was there every step of the way, from designing eye-catching merch that our fans love, to handling store setup and complete fulfillment. It was a hassle-free experience, allowing us to focus on connecting with our audience and delivering awesome products!",
      name: "Thakur Sisters",
      title: "Food Bloggers",
      website: "yumchic.store",
      image: thakurSisters,
    },
  ];

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
    <section className="py-20 bg-purple-200">
      <div className="container">
        <Carousel setApi={setApi} className="w-full" opts={{ dragFree: true, loop: false }}>
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <div className="space-y-6">
                    {/* Stars */}
                    <div className="flex gap-1">
                      {[...Array(testimonial.stars)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-foreground text-foreground" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <blockquote className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    {/* Description */}
                    <p className="text-base text-foreground">
                      {testimonial.description}
                    </p>
                    
                    {/* Pagination Dots */}
                    <div className="flex gap-2 pt-4">
                      {testimonials.map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full transition-all ${
                            i === current ? "bg-foreground" : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right Panel */}
                  <div className="flex justify-center">
                    <div className="bg-[#F5F5DC] rounded-2xl p-6 w-full max-w-md shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{testimonial.name}</h3>
                          <p className="text-sm text-foreground/70">{testimonial.title}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{testimonial.website}</p>
                      </div>
                      <div className="mt-4">
                        <img 
                          src={testimonial.image} 
                          alt={`Testimonial from ${testimonial.name}`} 
                          className="w-full rounded-xl object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default TestimonialSection;
