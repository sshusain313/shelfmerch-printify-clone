import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Store, Globe, Printer, Truck, DollarSign, Leaf, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/30 to-background">
        <div className="container py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
                src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200"
                alt="Person wearing custom hoodie"
                className="rounded-2xl shadow-elevated"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-12 border-y bg-muted/30">
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
      <section className="py-20">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-16">
            Start with Zero Investment
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
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
          <div className="text-center mt-12">
            <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground">
              Create Digital Store
            </Button>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
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
                src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200"
                alt="Tote bag product"
                className="rounded-2xl shadow-elevated"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-12">
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
      <section className="py-20">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-4">
            Launch Your Digital Store Instantly - No Tech Skills Required
          </h2>
          <div className="max-w-2xl mx-auto text-center mb-12">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Easily create, manage, and track your orders to success</li>
              <li>• Order setup, effortless customization, and a seamless launch process</li>
              <li>• 100% price of your purchase. Fully yours. On Verified Merch</li>
            </ul>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-elevated">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200"
              alt="Analytics dashboard"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* How ShelfMerch Powers Success */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="font-heading text-4xl font-bold text-center mb-16">
            How Shelf Merch Powers Your E-commerce Success
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
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
