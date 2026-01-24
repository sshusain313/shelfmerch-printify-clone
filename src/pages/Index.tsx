import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from '@/components/home/Header';
import Footer from "@/components/home/Footer";
import { Store, Globe, Printer, Truck, DollarSign, Leaf, TrendingUp, Shield, Star, Users, Map, PlayCircle, Award, Quote } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 to-background">
        <div className="container py-16 md:py-28">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block mb-4 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                ORDER AND SELL CUSTOM PRODUCTS
              </div>
              <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Start your print-on-demand business with zero inventory
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Design products, set your prices, and we handle production, fulfillment and shipping—automatically.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  No upfront costs
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Automated fulfillment
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Global shipping network
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
                  Start for Free
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/products">Browse Product Catalog</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                100% risk-free. No credit card needed to start your journey with us and save time.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://picsum.photos/seed/hero-hoodie/1200/900"
                alt="Person wearing custom hoodie"
                className="rounded-2xl shadow-elevated"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Banner */}
      <section className="py-12 bg-emerald-950 text-primary-foreground">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm uppercase tracking-wide opacity-80">Grow more, earn more</p>
              <h3 className="font-heading text-3xl md:text-4xl font-bold mt-2">Creators are scaling profit with Shelf Merch</h3>
              <p className="mt-4 text-emerald-100/90">Flexible margins, automatic fulfillment, and low-risk launches help you keep more revenue.</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-6 md:p-8 shadow-card">
              <div className="text-sm text-emerald-100/80">Earnings in the last 30 days</div>
              <div className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight">₹28,921.86</div>
              <div className="mt-4 inline-flex items-center gap-2 text-emerald-100">
                <TrendingUp className="h-5 w-5" />
                <span>+12.4% vs previous period</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Spotlight */}
      <section className="py-10">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <div className="rounded-2xl overflow-hidden shadow-elevated">
              <img
                src="https://picsum.photos/seed/testimonial/1200/900"
                alt="Happy creator wearing merch"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="bg-accent rounded-2xl p-8 md:p-12 text-foreground shadow-card flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium">
                  <Award className="h-4 w-4 text-primary" /> Customer success

                </div>
                <h3 className="font-heading text-3xl md:text-4xl font-bold mt-4">“Shelf Merch lets us launch products in days, not months.”</h3>
                <p className="mt-4 text-muted-foreground">
                  We focus on ideas and community while Shelf Merch handles the rest — from printing to global delivery.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <Quote className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Alex Rivera</p>
                  <p className="text-sm text-muted-foreground">Founder, River Collective</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace + Social Bar */}
      <section className="py-6 border-y bg-background">
        <div className="container flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <span className="text-sm font-medium text-muted-foreground">Connect your store or sell on our marketplace</span>
          <div className="flex items-center gap-4">
            <Store className="h-6 w-6 text-primary" />
            <Globe className="h-6 w-6 text-primary" />
            <Truck className="h-6 w-6 text-primary" />
            <PlayCircle className="h-6 w-6 text-primary" />
            <Users className="h-6 w-6 text-primary" />
          </div>
        </div>
      </section>

      {/* Global Stats + Map */}
      <section className="py-10 bg-sky-50">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-sm font-medium text-primary mb-2">Trusted by creators worldwide</p>
              <h3 className="font-heading text-4xl font-bold">Fulfillment that reaches your audience</h3>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-bold">500k+</p>
                  <p className="text-muted-foreground text-sm">Orders delivered</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">203</p>
                  <p className="text-muted-foreground text-sm">Countries served</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">140+</p>
                  <p className="text-muted-foreground text-sm">Print partners</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">4.8/5</p>
                  <p className="text-muted-foreground text-sm">Average rating</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl bg-white p-6 shadow-card">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
                  alt="Global coverage map"
                  className="w-full h-auto"
                />
                <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                  <Map className="h-4 w-4 text-primary" /> Live routing to nearest print partner for faster delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-10">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-heading text-4xl font-bold">Bestsellers loved by creators</h2>
            <Button variant="outline" asChild>
              <Link to="/products">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => (
              <div key={i} className="group bg-background rounded-xl overflow-hidden shadow-card">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/best${i}/800/1000`}
                    alt="Bestseller product"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium">
                    <Star className="h-3.5 w-3.5 text-primary" /> 4.{i}k reviews
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Premium Tee</p>
                    <p className="text-sm text-muted-foreground">From ₹14.99</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-8 border-y bg-muted/30">
        <div className="container">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <span className="text-2xl font-bold">Google</span>
            <span className="text-2xl font-bold">AHA</span>
            <span className="text-2xl font-bold">Rubix</span>
            <span className="text-2xl font-bold">Datadog</span>
            <span className="text-2xl font-bold">YumChic</span>
          </div>
        </div>
      </section>

      {/* Start with Zero Investment */}
      <section className="py-12">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-12">
            Start with Zero Investment
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Create Store</h3>
              <p className="text-muted-foreground text-sm">
                We host your custom store and integrate with eCommerce platforms or use ours.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Sell Online</h3>
              <p className="text-muted-foreground text-sm">
                Customers purchase your brand and products through our verified purchasing.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Printer className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Print On Demand</h3>
              <p className="text-muted-foreground text-sm">
                No bulk printing, packing and fulfillment—no stress as we do it for you
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">Ship Globally</h3>
              <p className="text-muted-foreground text-sm">
                We manage shipping globally belonging directly to customers through our qualified partners
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
              Create Digital Store
            </Button>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-10 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-sm font-medium text-primary mb-2">OUR PRODUCTS · PRINT, PACKAGE, AND AN ARRAY OF ACCESSORIES</div>
              <h2 className="font-heading text-4xl font-bold mb-4">
                200+ Products to create your merch
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose from a wide-range of products in our catalog. Deliver variety and build a brand customers trust. With 100+ of colors inserting thousands, literally more than millions of branded opportunities.
              </p>
              <Button variant="outline" asChild>
                <Link to="/products">View our full Merch catalog →</Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://picsum.photos/seed/product-hero/1200/900"
                alt="Tote bag product"
                className="rounded-2xl shadow-elevated"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-8">
            {['T-shirts', 'Hoodies', 'SweatShirts', 'Drinkware', 'Caps', 'Accessories'].map((category) => (
              <div key={category} className="flex flex-col items-center p-4 bg-background rounded-lg hover:shadow-card transition-shadow cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-muted mb-2" />
                <span className="text-sm font-medium text-center">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Launch Your Store */}
      <section className="py-10">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-4">
            Launch Your Digital Store Instantly - No Tech Skills Required
          </h2>
          <div className="max-w-2xl mx-auto text-center mb-8">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Easily create, manage, and track your orders to success</li>
              <li>• Order setup, effortless customization, and a seamless launch process</li>
              <li>• 100% price of your purchase. Fully yours. On Verified Merch</li>
            </ul>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-elevated">
            <img 
              src="https://picsum.photos/seed/analytics/1200/720"
              alt="Analytics dashboard"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* How ShelfMerch Powers Success */}
      <section className="py-10 bg-muted/30">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-10">
            How Shelf Merch Powers Your E-commerce Success
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">On-Demand Zero Overhead</h3>
              <p className="text-muted-foreground text-sm">
                Say good-bye to unused inventory or unsold stock. We print on demand. We only manufacture as per orders received. So no cost is wasted.
              </p>
            </div>
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Printer className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Customization</h3>
              <p className="text-muted-foreground text-sm">
                Create custom branding and offer custom products to your customers. Each item can reflect your vision.
              </p>
            </div>
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Fast, Local Fulfillment</h3>
              <p className="text-muted-foreground text-sm">
                Orders are routed to our global network of local suppliers to your customers faster.
              </p>
            </div>
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Launch with Zero Cost</h3>
              <p className="text-muted-foreground text-sm">
                Start selling without upfront investment in inventory and use our print-on-demand model to sell as you market.
              </p>
            </div>
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Sustainable Merchandise</h3>
              <p className="text-muted-foreground text-sm">
                Made for the future with eco-conscious on-demand printing reducing materials wasted and carbon footprints.
              </p>
            </div>
            <div className="bg-background p-8 rounded-xl shadow-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">Boost Brand Visibility</h3>
              <p className="text-muted-foreground text-sm">
                Building a recognized brand in your category and leverage our managed platform to grow demand across all channels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Stories / Blog */}
      <section className="py-10">
        <div className="container">
          <h3 className="font-heading text-3xl md:text-4xl font-bold text-center mb-10">Everything you need to get started</h3>
          <div className="grid md:grid-cols-4 gap-5">
            {[0,1,2,3].map((i) => (
              <div key={i} className="group rounded-xl overflow-hidden bg-background shadow-card">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/guide${i}/800/450`}
                    alt="Guide"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Guide</p>
                  <p className="font-medium">How to design your first merch drop</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-heading text-4xl font-bold mb-6">
            Connect with a Shelf Merch Expert
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Get answers to your questions and explore how Shelf Merch can transform your merchandise workflow
          </p>
          <Button size="lg" variant="secondary">
            Get Started →
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
