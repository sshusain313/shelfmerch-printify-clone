import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import office1 from '@/assets/office1.png';
import chandru from '@/assets/chandru.png';
import productRange from '@/assets/product-range.png';
import performance from '@/assets/performance.png';
import promptDelivery from '@/assets/prompt-del.png';
import profitability from '@/assets/profitability.png';
import careers from '@/assets/careers.png';
import quote from '@/assets/quote.png';
import equity from '@/assets/equity.png';
import flexible from '@/assets/flexible-hrs.png';
import health from '@/assets/health-cov.png';
import modern from '@/assets/modern.png';
import events from '@/assets/events.png';
import skill from '@/assets/skill-enh.png';
const CareersPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
              Ambitious?
            </h1>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-12">
              So are we.
            </h2>
            <div className="w-full">
              <img src={careers} alt="Modern office workspace" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Company Story Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                  Infinite ambitions. One print on demand platform.
                </h2>
              </div>
              <div>
                <p className="text-lg text-foreground leading-relaxed">
                  When we started in 2011, our goal was simple: to help businesses grow. We began with T-shirt printing, embracing print on demand to solve complex merchandising challenges. Today, we've become the go-to partner for creators, brands, and businesses worldwide. Our journey has been fueled by exceptional talent, a focus on success over ego, and a commitment to enjoying the process. As we continue to pursue our long-term vision, we're on the lookout for innovative problem solvers, strategic thinkers, and reliable teammates to join us on this exciting journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Shelf Merch Formula (4 P's) Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
              The Shelf Merch Formula (4 P's)
            </h2>
            <p className="text-lg text-foreground text-center mb-12">
              The way we work is guided by the four principles of the Shelf Merch Formula.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Range */}
              <div className="space-y-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={productRange} alt="Product Range" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Product Range</h3>
                <p className="text-foreground leading-relaxed">
                  A wide variety of customizable products to fit any niche, with new items regularly added to keep your offerings fresh and meet your customers' evolving needs.
                </p>
              </div>
              
              {/* Performance */}
              <div className="space-y-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={performance} alt="Performance" className="w-full h-full object-contain" />    
                </div>
                <h3 className="text-2xl font-bold text-foreground">Performance</h3>
                <p className="text-foreground leading-relaxed">
                  We focus on delivering top-notch quality by minimizing product defects, reducing cancellation rates, and ensuring excellent print quality with every order.
                </p>
              </div>
              
              {/* Prompt Delivery */}
              <div className="space-y-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={promptDelivery} alt="Prompt Delivery" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Prompt Delivery</h3>
                <p className="text-foreground leading-relaxed">
                  Shelf Merch ensures fast order fulfillment with in-house production and local hubs, minimizing lead times and shipping costs for rapid delivery to your customers.
                </p>
              </div>
              
              {/* Profitability */}
              <div className="space-y-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={profitability} alt="Profitability" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Profitability</h3>
                <p className="text-foreground leading-relaxed">
                  Maximize earnings with every sale. We regularly review top-selling products to ensure you get the best prices in the POD market.  
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Quote Section */}
      <section className="py-12 lg:py-16 bg-foreground text-background">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <img src={quote} alt="Chandra Koneti, Co-founder & CEO" className="w-full h-auto rounded-lg" />
              </div>
              <div>
                <blockquote className="text-xl md:text-2xl lg:text-3xl text-background leading-relaxed mb-6">
                  "We don't chase short-term trends; instead, we focus on building for the long term. To maintain our culture of speed and autonomy as we scale, we set high standards and hire only exceptional talent—people who can hit the ground running and make an immediate impact."
                </blockquote>
                <p className="text-xl text-background/90">
                  — Chandra Koneti, Co-founder & CEO
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Vacancies Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-12">
              Browse Vacancies
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-b border-border">
                <div className="font-semibold text-foreground">Senior Laravel, Php Developer</div>
                <div className="text-muted-foreground">Development</div>
                <div className="text-muted-foreground">Hyderabad →</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-b border-border">
                <div className="font-semibold text-foreground">Digital Marketer</div>
                <div className="text-muted-foreground">Marketing</div>
                <div className="text-muted-foreground">Hyderabad →</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-b border-border">
                <div className="font-semibold text-foreground">Performance Marketer</div>
                <div className="text-muted-foreground">Marketing</div>
                <div className="text-muted-foreground">Hyderabad →</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-b border-border">
                <div className="font-semibold text-foreground">Corporate Sales Executive</div>
                <div className="text-muted-foreground">Sales</div>
                <div className="text-muted-foreground">Hyderabad →</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="font-semibold text-foreground">Video Editor</div>
                <div className="text-muted-foreground">Operations</div>
                <div className="text-muted-foreground">Hyderabad →</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perks and Benefits Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
              Perks and benefits
            </h2>
            <p className="text-lg text-foreground mb-12 max-w-3xl mx-auto text-center">
              We are ambitious in everything we do, including our benefits. No matter where you choose to work from we'll support you with great extras. Our compensation is fair and competitive.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Equity for everyone */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={equity} alt="Equity" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Equity for everyone</h3>
                <p className="text-foreground leading-relaxed">
                  Most roles include stock options based on salary, giving you a chance to own a part of Shelf Merch's success.
                </p>
              </div>
              
              {/* Flexible hours */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={flexible} alt="Flexible hours" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Flexible hours that fit your life</h3>
                <p className="text-foreground leading-relaxed">
                  Start your day anytime between 8 AM and 11 AM. As long as the work gets done and you're happy and healthy, you can shape your schedule around meetings and personal time.
                </p>
              </div>
              
              {/* Health Coverage */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={health} alt="Health coverage" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Health Coverage</h3>
                <p className="text-foreground leading-relaxed">
                  At Shelf Merch, we prioritise your well-being. We offer 100% health insurance coverage after your probation period or provide an insurance allowance, depending on your contract type.
                </p>
              </div>
              
              {/* Modern Workspace */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={modern} alt="Modern workspace" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Modern Workspace</h3>
                <p className="text-foreground leading-relaxed">
                  Work in a comfortable, ergonomic office in HiTech City, designed to boost productivity and support your well-being.
                </p>
              </div>
              
              {/* Events */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={events} alt="Events" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Events</h3>
                <p className="text-foreground leading-relaxed">
                  We host work-from-anywhere friendly events that bring Shelf Merchers together to unwind, connect, and have fun
                </p>
              </div>
              
              {/* Skill Enhancement Programs */}
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  <img src={skill} alt="Skill enhancement" className="w-full h-full object-contain" />    
                </div>
                <h3 className="text-2xl font-bold text-foreground">Skill Enhancement Programs</h3>
                <p className="text-foreground leading-relaxed">
                  Unlock new opportunities with our skill development programs designed to help Shelf Merchers grow professionally and stay ahead in their careers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default CareersPage;