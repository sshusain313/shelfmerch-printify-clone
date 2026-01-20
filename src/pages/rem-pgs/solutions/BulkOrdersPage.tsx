import { Link } from 'react-router-dom';
import retail from '@/assets/retail.png';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import corporateMerch from '@/assets/corporate-merch.png';
import nonProfit from '@/assets/non-profit.png';
import entertainment from '@/assets/entertainment.png';
import heroBulk from '@/assets/hero-bulk.png';
import digitalStore from '@/assets/digital-store.png';
import submitOrder from '@/assets/submit-order.png';
import add from '@/assets/add-design.png';
import bulkOrderIllustration from '@/assets/what-is-bulk.png';
// TODO: Add bulk order illustration image when available
// import bulkOrderIllustration from '@/assets/bulk-order-illustration.png';


const steps = [
  {
    number: '1',
    title: 'Pick a product',
    description: 'Explore our catalog of over 400 products and select from 50+ print providers around the globe.',
    image: digitalStore,
    imageAlt: 'Product selection interface',
  },
  {
    number: '2',
    title: 'Add your design',
    description: 'Create custom items effortlessly with our easy-to-use Product Creator. Choose your preferred size, color, and design placement.',
    image: add,
    imageAlt: 'Custom product designs',
  },
  {
    number: '3',
    title: 'Submit your order',
    description: 'With our fast production and global shipping, enjoy quick and reliable delivery right to your doorstep.',
    image: submitOrder,
    imageAlt: 'Order summary and delivery confirmation',
  },
];

const useCases = [
  {
    icon: <img src={retail} alt="Retail" />,
    title: 'Retail stores',
    description: 'Effortlessly create and order custom products for your physical store, no matter where you are.',
  },
  {
    icon: <img src={corporateMerch} alt="Corporate Merch" />,
    title: 'Corporate merch',
    description: 'Order your corporate merch in bulk to enhance company culture and leave your brand.',
  },
  {
    icon: <img src={nonProfit} alt="Non-Profit" />,
    title: 'Non-profits and charities',
    description: 'Bulk order merch in advance to sell or distribute at your fundraiser or awareness campaign.',
  },
  {
    icon: <img src={entertainment} alt="Entertainment" />,
    title: 'Entertainment and events',
    description: 'Order merch in bulk to sell, promote, or give as prizes at your next concert, event, or party.',
  },
];

const BulkOrdersPage = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="bg-muted/30">
        <div className="container-custom py-12 lg:py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Save More with Bulk Orders
              </h1>
              <p className="text-lg md:text-xl text-foreground leading-relaxed max-w-xl">
                Order in bulk and save—design and customize products for your brand, organization, event, or shop with up to 30% savings.
              </p>
              <Link
                to="/support/contact-us"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
              >
                Get your quote
              </Link>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-lg ">
                
                  <img
                    src={heroBulk}
                    alt="Bulk order illustration"
                    className="w-full h-full object-cover object-center"
                  />
                
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="section-padding bg-background">
        <div className="container-custom py-8 lg:py-0">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            Order high-quality print-on-demand products in bulk from our extensive network.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="bg-background rounded-xl shadow-lg overflow-hidden">
                <div className="aspect-video overflow-hidden bg-muted/20">
                  <img
                    src={step.image}
                    alt={step.imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-lg md:text-xl font-bold text-foreground">
                    {step.number}. {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk Order Info */}
      <section className="section-padding bg-muted/20">
        <div className="container-custom py-8 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
            {/* Left: Text Content */}
            <div className="space-y-4 max-w-lg">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                What is considered a Bulk Order?
              </h2>
              <p className="text-sm md:text-base text-foreground leading-relaxed">
                Bulk ordering is available for select products when ordering 60 or more similar items from the same print provider. You can mix different products within the order as long as they come from the same provider.
              </p>
              <Link
                to="/support/contact-us"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
              >
                Get your quote
              </Link>
            </div>
            
            {/* Right: Illustration */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md aspect-square">
                <img 
                  src={bulkOrderIllustration} 
                  alt="Bulk order delivery illustration" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <h2 className="section-title text-center mb-4">Get exactly what you need At bulk quantities.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="text-left space-y-1">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  {useCase.icon}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{useCase.title}</h3>
                <p className="text-sm text-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default BulkOrdersPage;