import Header from '@/components/home/Header';  
import Footer from '@/components/home/Footer';
import { Link, useLocation } from 'react-router-dom';

const ContentGuidelinesPage = () => {
  const location = useLocation();

  return (
    <>
    <Header />
      <section className="py-8 lg:py-8 bg-background">
        <div className="container-custom">
          <div className="max-w-12xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
              {/* Left Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-muted/30 rounded-lg p-6 mb-6">
                  <nav className="space-y-3">
                    <Link 
                      to="/support/policies" 
                      className={`block transition-colors ${
                        location.pathname === '/support/policies'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      Policies
                    </Link>
                    <Link 
                      to="/support/production-shipping-times" 
                      className={`block transition-colors ${
                        location.pathname === '/support/production-shipping-times'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      Current Production & Shipping Times
                    </Link>
                    <Link 
                      to="/support/customer-support-policy" 
                      className={`block transition-colors ${
                        location.pathname === '/support/customer-support-policy'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      Shelf Merch Customer Support Policy
                    </Link>
                    <Link 
                      to="/support/content-guidelines" 
                      className={`block transition-colors ${
                        location.pathname === '/support/content-guidelines'
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      Shelf Merch Content Guidelines
                    </Link>
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                  Claims for Reprints, Refunds, and Returns
                  </h2>
                  
                  <div className="space-y-6 text-foreground leading-relaxed">
                    <p>
                    At Shelf Merch, we are passionate about enabling you to create and print amazing products that showcase your creativity. We are here to empower your designs, foster your imagination, and help drive success for your business!
                    </p> 
                    <p>
                    While we respect your right to free expression, we also have guidelines in place to ensure a positive experience for everyone using our platform. We review uploaded content to ensure compliance with these standards, and Shelf Merch reserves the right to remove any content that does not meet our guidelines.
                    </p>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Prohibited Content Categories:
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Illegal Content</li>
                        <li>Hateful Content</li>
                        <li>Intellectual Property Violations</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Illegal Content
                      </h3>
                      <div className="space-y-3">
                        <p>
                        Shelf Merch will not accept or print any content that is illegal. This includes, but is not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>References to illegal drugs or activities</li>
                          <li>Obscene or explicit content promoting illegal acts</li>
                          <li>Sexual content depicting penetration, child pornography, child abuse, or rape</li>
                        </ul>
                        <p>
                        While nudity is allowed, it must not depict the aforementioned scenarios. Please note that this list is not exhaustive, and it is your responsibility to ensure your designs comply with all applicable local laws, including those of the destination where your products are shipped.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Hateful Content
                      </h3>
                      <div className="space-y-3">
                        <p>
                        At Shelf Merch, we value diversity and inclusivity. We do not accept any content that promotes or incites hatred, harassment, or violence against any individual or group based on protected characteristics, including but not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Age</li>
                          <li>Caste</li>
                          <li>Disability</li>
                          <li>Ethnicity</li>
                          <li>Religion</li>
                          <li>Race</li>
                          <li>Nationality</li>
                          <li>Sex</li>
                          <li>Sexual orientation</li>
                          <li>Gender identity and expression</li>
                          <li>Victims of major events</li>
                        </ul>
                        <p>
                        We do not tolerate content that depicts racism, defamation, or any form of harassment. We strive to create a safe and welcoming environment for all our partners and their customers.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Intellectual Property Rights
                      </h3>
                      <div className="space-y-3">
                        <p>
                        Shelf Merch supports your creativity and self-expression. However, we expect you to respect the intellectual property rights of others. We do not accept content that infringes on copyrights, trademarks, or rights of privacy and publicity. When you upload content, it should either be your own original design or a design for which you have full usage rights.
                        </p>
                        <p>
                        Ensure that your content does not violate any third-party rights, including:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Copyrights (e.g., artwork, photos, music)</li>
                          <li>Trademarks (e.g., logos, brand names)</li>
                          <li>Rights of privacy and publicity (e.g., images of celebrities without permission)</li>
                        </ul>
                         
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Reminder
                      </h3>
                      <div className="space-y-3">
                        <p>
                        All the content you upload to Shelf Merch remains your intellectual property. However, it is subject to review, and we reserve the right to decline or remove any content at our discretion if it violates our guidelines.
                        </p>
                        <p>
                        Before uploading your design, please review it carefully to ensure it meets our standards. By uploading content to Shelf Merch, you agree that your design complies with our Terms of Service and these Acceptable Content Guidelines.
                        </p>
                        <p>
                        We are excited to see your creative ideas come to life while maintaining a respectful and positive environment for all!
                        </p>
                      </div>
                    </div>
                  </div>
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

export default ContentGuidelinesPage;