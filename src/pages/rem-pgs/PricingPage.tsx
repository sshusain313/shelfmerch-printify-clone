import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Building2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pricingImage from '@/assets/pricing.png';
import createStore from '@/assets/create-store.png';
import sellOnline from '@/assets/sell-online.png';
import printOnDemand from '@/assets/pod.png';
import shipGlobally from '@/assets/ship.png';
import expertImage from '@/assets/connect.png';
const PricingPage = () => {
  const [isMonthly, setIsMonthly] = useState(true);
  const navigate = useNavigate();

  const pricingPlans = [
    {
      name: 'Free',
      price: isMonthly ? '0 ₹/month' : '0 ₹ /month (billed annually)',
      priceYearly: '0 ₹ /month (billed annually)',
      description: 'For merchants starting a business.',
      featuresMonthly: [
        '2 stores per account',
        'Unlimited product designs',
        'Own Domain',
      ],
      featuresYearly: [
        '5 stores per account',
        'Unlimited product designs',
      ],
      cta: 'Start for free',
      ctaVariant: 'default' as const,
      popular: false,
    },
    {
      name: 'Premium',
      price: isMonthly ? '99 ₹/month' : '83 ₹ /month (billed annually)',
      priceYearly: '83 ₹ /month (billed annually)',
      description: 'For merchants starting a business.',
      featuresMonthly: [
        '10 stores per account',
        'Unlimited product designs',
        'Order management with Shelf Merch Connect',
      ],
      featuresYearly: [
        '10 stores per account',
        'Unlimited product designs',
        'Order management with Shelf Merch Connect',
      ],
      cta: 'Start for free',
      ctaVariant: 'default' as const,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom Pricing',
      description: 'For merchants starting a business.',
      featuresMonthly: [
        'Unlimited stores per account',
        'Unlimited product designs',
        'Additional discounts on all products',
        'Dedicated Account Manager',
        'Dedicated Designer Support',
      ],
      featuresYearly: [
        'Unlimited stores per account',
        'Unlimited product designs',
        'Additional discounts on all products',
      ],
      cta: "Let's Talk",
      ctaVariant: 'outline' as const,
      popular: false,
    },
  ];

  const premiumFeatures = [
    {
      icon: <img src={createStore} alt="Create Store" className="w-10 h-10" />,
      title: 'Create Store',
      description: 'Quickly set up your store, add your own domain, or use our free sub-domain. Choose your product and design your merch.',
    },
    {
      icon: <img src={sellOnline} alt="Sell Online" className="w-10 h-10" />,
      title: 'Sell Online',
      description: 'Choose your products, set prices, and sell anywhere. Integrate via Shopify, automate with our print API, or use our flexible fulfillment service.',
    },
    {
      icon: <img src={printOnDemand} alt="Print On Demand" className="w-10 h-10" />,
      title: 'Print On Demand',
      description: 'We handle printing, packing, and fulfillment, letting you focus on your business. Products are produced near your customers, wherever they are.',
    },
    {
      icon: <img src={shipGlobally} alt="Ship Globally" className="w-10 h-10" />,
      title: 'Ship Globally',
      description: 'We deliver your products in white-label packaging directly to customers through our fast, reliable global logistics network.',
    },
  ];

  return (
    <>
    <Header />
      {/* Hero Section */}
 <section className="py-12 lg:py-20 bg-muted/30">
  <div className="container-custom">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* Left Content */}
      <div className="space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
          Find the plan to build your business
        </h1>

        <p className="text-lg text-foreground leading-relaxed max-w-xl">
          Plans for every creator — find the right fit to save you money and scale up your business more quickly.
        </p>

        <Button className="bg-primary hover:bg-brand-green-hover text-primary-foreground font-semibold px-6 py-3 rounded-lg">
          Learn More
        </Button>
      </div>

      {/* Right Image */}
      <div className="flex justify-center lg:justify-end">
        <img
          src={pricingImage}
          alt="Pricing plans"
          className="max-w-md w-full h-auto"
        />
      </div>

    </div>
  </div>
</section>


      {/* Pricing Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Start for free, then scale with unmatched pricing
              </h2>
              
              {/* Toggle Switch */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isMonthly
                      ? 'bg-foreground text-background'
                      : 'bg-muted/30 text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    !isMonthly
                      ? 'bg-foreground text-background'
                      : 'bg-muted/30 text-foreground'
                  }`}
                >
                  Yearly (Save 14%)
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="relative bg-primary/10 rounded-lg p-8"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-4 py-1.5 rounded-full text-sm font-medium">
                      Most popular
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      {plan.name === 'Free' && <Heart className="h-5 w-5 text-foreground fill-foreground" />}
                      {plan.name === 'Premium' && (
                        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                          <span className="text-xs font-bold text-background">P</span>
                        </div>
                      )}
                      {plan.name === 'Enterprise' && <Building2 className="h-5 w-5 text-foreground" />}
                      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        {!isMonthly && plan.priceYearly ? plan.priceYearly : plan.price}
                      </div>
                      <p className="text-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      if (plan.name === 'Enterprise' && plan.cta === "Let's Talk") {
                        navigate('/support/contact-us');
                        return;
                      }
                    }}
                    className={`w-full mb-6 ${
                      plan.ctaVariant === 'default'
                        ? 'bg-primary hover:bg-brand-green-hover text-primary-foreground'
                        : 'bg-background border-2 border-foreground hover:bg-muted text-foreground'
                    } font-semibold py-3 rounded-lg`}
                  >
                    {plan.cta}
                  </Button>

                  <ul className="space-y-3">
                    {(isMonthly ? plan.featuresMonthly : plan.featuresYearly).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-12 lg:py-16 bg-muted">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-8">
                Included in every Premium plan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
              {premiumFeatures.map((feature) => {
                return (
                  <div key={feature.title} className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="flex items-center justify-center">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-foreground leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="bg-primary hover:bg-brand-green-hover text-primary-foreground font-semibold px-6 py-3 rounded-lg"
              >
                Start for free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Connect Section */}
       <section className="py-8 lg:py-12 bg-background">
  <div className="container-custom">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* Left Content */}
      <div className="space-y-6">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
          Connect with a Shelf Merch Expert.
        </h2>

        <p className="text-lg text-foreground leading-relaxed max-w-xl">
          Get answers to your questions and explore how Shelf Merch can transform
          your merchandise workflows.
        </p>

        <Button className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2">
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right Illustration */}
      <div className="flex justify-center lg:justify-end">
        <img
          src={expertImage}
          alt="Shelf Merch expert working"
          className="max-w-md w-full h-auto"
        />
      </div>

    </div>
  </div>
</section>
    <Footer />
    </>
  );
};

export default PricingPage;