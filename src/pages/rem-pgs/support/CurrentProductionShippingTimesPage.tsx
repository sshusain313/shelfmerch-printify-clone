import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Link, useLocation } from 'react-router-dom';

const CurrentProductionShippingTimesPage = () => {
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
                {/* Production Timeframes Section */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Production Timeframes
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed mb-6">
                    <p>
                    95% of our orders are delivered within the estimated timeframes. The production times listed below apply to stocked apparel items. In some cases, items may be temporarily unavailable at the manufacturer, which could result in extended production times.
                    </p>
                    <p>
                    The percentages in the table reflect the share of orders completed at each specific stage or number of production days, based on data from the past two weeks.
                    </p>
                  </div>

                  {/* Production Timeframes Table */}
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Product Category</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">0-2 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">3-4 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">5-6 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">7-9 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">10+ Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Contact us if your order is in production longer than __ business days</th>
                        </tr>
                      </thead>
                      <tbody className="text-foreground">
                        <tr>
                          <td className="py-3 px-4 border border-black">Accessories - General</td>
                          <td className="py-3 px-4 border border-black">95%</td>
                          <td className="py-3 px-4 border border-black">4%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Accessories - Totes and Bags</td>
                          <td className="py-3 px-4 border border-black">78%</td>
                          <td className="py-3 px-4 border border-black">22%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Apparel - All Over Print</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">7%</td>
                          <td className="py-3 px-4 border border-black">93%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Apparel - DTF</td>
                          <td className="py-3 px-4 border border-black">97%</td>
                          <td className="py-3 px-4 border border-black">3%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Drinkware - Mugs</td>
                          <td className="py-3 px-4 border border-black">94%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Drinkware - Other</td>
                          <td className="py-3 px-4 border border-black">90%</td>
                          <td className="py-3 px-4 border border-black">10%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Embroidery</td>
                          <td className="py-3 px-4 border border-black">58%</td>
                          <td className="py-3 px-4 border border-black">30%</td>
                          <td className="py-3 px-4 border border-black">9%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">2%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Home Decor - General</td>
                          <td className="py-3 px-4 border border-black">86%</td>
                          <td className="py-3 px-4 border border-black">14%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Home Office Decor</td>
                          <td className="py-3 px-4 border border-black">70%</td>
                          <td className="py-3 px-4 border border-black">8%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">13%</td>
                          <td className="py-3 px-4 border border-black">3%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Kids & Baby</td>
                          <td className="py-3 px-4 border border-black">50%</td>
                          <td className="py-3 px-4 border border-black">47%</td>
                          <td className="py-3 px-4 border border-black">2%</td>
                          <td className="py-3 px-4 border border-black">1%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Prints</td>
                          <td className="py-3 px-4 border border-black">94%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Stationery</td>
                          <td className="py-3 px-4 border border-black">85%</td>
                          <td className="py-3 px-4 border border-black">14%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Wall Art & Canvas Products</td>
                          <td className="py-3 px-4 border border-black">41%</td>
                          <td className="py-3 px-4 border border-black">42%</td>
                          <td className="py-3 px-4 border border-black">17%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Shipping Timeframes Section */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Shipping Timeframes
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed mb-6">
                    <p>
                      We work closely with our shipping providers to ensure timely delivery. However, shipping times can vary based on several factors:
                    </p>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Extended shipping times during peak holiday seasons</li>
                      <li>Delays in international orders due to customs processing</li>
                    </ul>
                    <p>
                      The percentages in the table below indicate the share of orders at each stage or number of days in transit within India over the past two weeks.
                    </p>
                  </div>

                  {/* Shipping Timeframes Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Product Category</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">0-2 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">3-4 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">5-6 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">7-9 Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">10+ Business Days spent in Production</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Contact us if your order is in production longer than __ business days</th>
                        </tr>
                      </thead>
                      <tbody className="text-foreground">
                        <tr>
                          <td className="py-3 px-4 border border-black">Accessories - General</td>
                          <td className="py-3 px-4 border border-black">95%</td>
                          <td className="py-3 px-4 border border-black">4%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Accessories - Totes and Bags</td>
                          <td className="py-3 px-4 border border-black">78%</td>
                          <td className="py-3 px-4 border border-black">22%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Apparel - All Over Print</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">7%</td>
                          <td className="py-3 px-4 border border-black">93%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Apparel - DTF</td>
                          <td className="py-3 px-4 border border-black">97%</td>
                          <td className="py-3 px-4 border border-black">3%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Drinkware - Mugs</td>
                          <td className="py-3 px-4 border border-black">94%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Drinkware - Other</td>
                          <td className="py-3 px-4 border border-black">90%</td>
                          <td className="py-3 px-4 border border-black">10%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Embroidery</td>
                          <td className="py-3 px-4 border border-black">58%</td>
                          <td className="py-3 px-4 border border-black">30%</td>
                          <td className="py-3 px-4 border border-black">9%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">2%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Home Decor - General</td>
                          <td className="py-3 px-4 border border-black">86%</td>
                          <td className="py-3 px-4 border border-black">14%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Home Office Decor</td>
                          <td className="py-3 px-4 border border-black">70%</td>
                          <td className="py-3 px-4 border border-black">8%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">13%</td>
                          <td className="py-3 px-4 border border-black">3%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Kids & Baby</td>
                          <td className="py-3 px-4 border border-black">50%</td>
                          <td className="py-3 px-4 border border-black">47%</td>
                          <td className="py-3 px-4 border border-black">2%</td>
                          <td className="py-3 px-4 border border-black">1%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Prints</td>
                          <td className="py-3 px-4 border border-black">94%</td>
                          <td className="py-3 px-4 border border-black">6%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Stationery</td>
                          <td className="py-3 px-4 border border-black">85%</td>
                          <td className="py-3 px-4 border border-black">14%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Wall Art & Canvas Products</td>
                          <td className="py-3 px-4 border border-black">41%</td>
                          <td className="py-3 px-4 border border-black">42%</td>
                          <td className="py-3 px-4 border border-black">17%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">0%</td>
                          <td className="py-3 px-4 border border-black">12</td>
                        </tr>
                      </tbody>
                    </table>
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

export default CurrentProductionShippingTimesPage;