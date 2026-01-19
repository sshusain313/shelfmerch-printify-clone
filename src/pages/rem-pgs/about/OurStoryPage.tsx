import { Linkedin } from 'lucide-react';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import apollo from '@/assets/apollo.png';
import hysea from '@/assets/hysea.png';
import bounce from '@/assets/bounce.png';
import pmg from '@/assets/pmg.png';
import pfc from '@/assets/pfc.png';
import office1 from '@/assets/office1.png';
import office2 from '@/assets/office2.png';
import productRange from '@/assets/product-range.png';
import performance from '@/assets/performance.png';
import promptDelivery from '@/assets/prompt-del.png';
import profitability from '@/assets/profitability.png';   
import chandru from '@/assets/chandru.png'
import srini from '@/assets/srini.png'
import balaji from '@/assets/balaji.png'
import sabeer from '@/assets/sabeer.png'
import mouaz from '@/assets/mouaz.png'
import rupesh from '@/assets/rupesh.png'
import creators from '@/assets/creators.png'
import brands from '@/assets/brands.png'
import fans from '@/assets/fans.png' 
const OurStoryPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-12 leading-tight">
              The platform that empowers Creators, Brands & Businesses to achieve their ambitions, faster.
            </h1>
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 xl:gap-20 mt-12">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20  flex items-center justify-center mb-4 p-3">
                  <img src={creators} alt="Creators" className="w-full h-full object-contain" />
                </div>
                <p className="text-2xl font-bold text-foreground">10+ creators</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 flex items-center justify-center mb-4 p-3">
                 <img src={fans} alt="Fans" className="w-full h-full object-contain" />
                </div>
                <p className="text-2xl font-bold text-foreground">40M+ Fans</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 flex items-center justify-center mb-4 p-3">
                  <img src={brands} alt="Brands" className="w-full h-full object-contain" />
                </div>
                <p className="text-2xl font-bold text-foreground">50+ Brands</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ambition Ignites Section */}
      <section className="py-16 lg:py-20 bg-foreground text-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ambition Ignites, </h2> 
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Shelf Merch Drives.</h2>
            <p className="text-xl md:text-2xl text-background/90">
              Fuel your entrepreneurial journey with our powerful platform.
            </p>
          </div>
        </div>
      </section>

      {/* Partner Logos Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-16 lg:gap-24 xl:gap-32 flex-wrap">
            <img src={apollo} alt="Apollo" className="h-16 lg:h-20 xl:h-24 w-auto object-contain" />
            <img src={hysea} alt="HYSEA" className="h-16 lg:h-20 xl:h-24 w-auto object-contain" />
            <img src={bounce} alt="Bounce!" className="h-16 lg:h-20 xl:h-24 w-auto object-contain" />
            <img src={pfc} alt="PFC" className="h-16 lg:h-20 xl:h-24 w-auto object-contain" />
            <img src={pmg} alt="PMG Group" className="h-16 lg:h-20 xl:h-24 w-auto object-contain" />
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-3xl font-bold text-foreground text-center mb-8">
              Our Story
            </h2>
            <p className="text-lg text-foreground leading-relaxed mb-12 text-center">
            At Shelf Merch, we're driven by ambition. We started with screen printing T-shirts, back when only bulk orders were the norm. But ambition craved more, so we built a cutting-edge print-on-demand platform from the ground up. Our vision? A world where everyone can turn their passion into a business on their own terms. We eliminate traditional barriers like upfront costs, supplier access, and product sourcing, empowering anyone to launch their dream store with zero cash. From bulk printing to on-demand fulfillment, we're making entrepreneurship accessible to all.
            </p>
            
              {/* Office Images */}
              <div className="grid grid-cols-2 gap-8 lg:gap-12">
                <div className="relative">
                  <div className="rounded-lg flex items-center justify-center">
                    <img src={office1} alt="Office Image 1" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="relative">
                  <div className="rounded-lg flex items-center justify-center">
                    <img src={office2} alt="Office Image 2" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* The Shelf Merch Formula Section */}
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

      {/* Our Team Section */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-12">
              Our Team
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 justify-items-center">
              {/* Team Member 1 - Chandru */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={chandru} alt="Chandru" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/konetichandra/" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Chandru</h3>
                  <p className="text-primary font-semibold italic mb-3">The Compass</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Creative leader and product strategist with 20+ years in product management, innovation, and marketing. Skilled in growth, cross-functional leadership, and strategic execution.
                  </p>
                </div>
              </div>
              
              {/* Team Member 2 - Srini */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={srini} alt="Srini" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/ravi-srinivasa-murty-7a46041/" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Srini</h3>
                  <p className="text-primary font-semibold italic mb-3">The Blueprint</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Global business leader with 20+ years in telecom, focused on innovation, strategy, and operational excellence. Passionate about launching ventures and managing digital transformations effectively.
                  </p>
                </div>
              </div>
              
              {/* Team Member 3 - Balaji */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={balaji} alt="Balaji" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/balajikesavaraj/" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Balaji</h3>
                  <p className="text-primary font-semibold italic mb-3">The Network</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    Marketing leader with 20+ years in growth, efficiency, and team leadership across marketing, sales, and technology. Guinness World Record holder for Microsoft India's app marathon.
                  </p>
                </div>
              </div>
              
              {/* Team Member 4 - Sabeer */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={sabeer} alt="Sabeer" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/sabeermirza/" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Sabeer Mirza</h3>
                  <p className="text-primary font-semibold italic mb-3">The Workshop</p>
                  <p className="text-sm text-foreground leading-relaxed">
                  Production and operations expert with 20 years in Production, specializing in process management, efficiency optimization, and leading teams to meet objectives
                  </p>
                </div>
              </div>
              
              {/* Team Member 5 - Mouaz */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={mouaz} alt="Mouaz" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/mouaz/" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Mouaz</h3>
                  <p className="text-primary font-semibold italic mb-3">The Circuit Board</p>
                  <p className="text-sm text-foreground leading-relaxed">
                  Recently graduated engineer passionate about technology, especially in solving challenges in print-on-demand. A true jack of all trades, eager to innovate and make an impact
                  </p>
                </div>
              </div>
              
              {/* Team Member 6 - Rupesh */}
              <div className="space-y-4 w-full max-w-[280px]">
                <div className="relative w-full aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  <img src={rupesh} alt="Rupesh" className="w-full h-full object-cover" />
                  <a href="https://www.linkedin.com/in/rupesh" target="_blank" rel="noopener noreferrer" className="absolute bottom-2 right-2 bg-[#0077b5] text-white p-1.5 rounded hover:bg-[#005885] transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </div>
                <div className="text-left w-full">
                  <h3 className="text-xl font-bold text-foreground mb-1">Rupesh Koushik</h3>
                  <p className="text-primary font-semibold italic mb-3">The Integrator</p>
                  <p className="text-sm text-foreground leading-relaxed">
                  Detail-oriented engineer with a strong focus on systems thinking and execution. Rupesh thrives at the intersection of tech from product creation to delivery. He’s the guy who turns chaos into structure and ideas into systems.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    <Footer />
    </>
  );
};

export default OurStoryPage;