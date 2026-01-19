import { Link } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import heroConcert from '@/assets/c1.png';

const solutionsLinks = [
  { name: 'Creators & Agencies', path: '/solutions/creators-agencies', description: 'Premium designs for creators and agencies' },
  { name: 'Fashion & Apparel', path: '/solutions/fashion-apparel', description: 'Custom fashion with on-demand designs' },
  { name: 'Entertainment & Media', path: '/solutions/entertainment-media', description: 'Merch that engages your audience' },
  { name: 'Home Decor', path: '/solutions/home-decor', description: 'Personalized décor for any space' },
  { name: 'Customized Merch', path: '/solutions/customized-merch', description: 'Unique products for your brand' },
  { name: 'Enterprise Merch', path: '/solutions/enterprise-merch', description: 'Top-quality merchandise at scale' },
  { name: 'Bulk Orders', path: '/solutions/bulk-orders', description: 'Save more with bulk orders' },
];

const Index = () => {
  return (
    <>
    <Header />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-muted/50 to-background">
        <div className="container-custom py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <h1 className="hero-title">
                Custom Merchandise,{' '}
                <span className="text-primary">Made Simple</span>
              </h1>
              <p className="hero-description">
                A print-on-demand platform enabling businesses and creators to design, sell, and fulfill custom, sustainable merchandise without inventory.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/solutions/creators-agencies"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-brand-green-hover transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  View Catalogue
                </Link>
              </div>
            </div>
            <div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroConcert}
                  alt="Concert crowd"
                  className="w-full h-auto object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="section-padding bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">Solutions for Every Need</h2>
            <p className="section-subtitle">
              Explore our tailored solutions designed for different industries and use cases.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutionsLinks.map((solution) => (
              <Link
                key={solution.path}
                to={solution.path}
                className="group bg-card border border-border rounded-xl p-6 shadow-sm card-hover"
              >
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {solution.name}
                </h3>
                <p className="text-sm text-muted-foreground">{solution.description}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                  Learn more
                  <span>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Index;