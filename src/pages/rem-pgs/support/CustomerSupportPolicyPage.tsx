import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Link, useLocation } from 'react-router-dom';

const CustomerSupportPolicyPage = () => {
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
                      All claims for reprints, refunds, and returns must be submitted within 4 weeks of receiving an order or its expected delivery date.
                    </p>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Order Cancellations and Address Changes
                      </h3>
                      <div className="space-y-3">
                        <p>
                        Orders cannot be canceled or have their address changed once they have entered the production phase. Due to the customized nature of our products, vendors typically begin production within 24 hours of order submission. At this stage, we cannot guarantee that the manufacturer will process any changes or cancellations. 
                        </p>
                        <p>
                        To allow modifications, orders can be held in a pending status before being sent to production. Utilize this feature to make necessary adjustments before production begins. 
                        </p>
                        <p>
                        If an order is flagged with an Address Issue and no changes are made within 45 days of submission, it will be automatically canceled. Please ensure that any address changes are completed within this period or before the order proceeds to production.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Reprint & Refund Policy
                      </h3>
                      <div className="space-y-3">
                        <p>
                        We strive to deliver perfect orders every time. However, if an issue arises, we can offer reprints or refunds based on the situation. Photo evidence is required when submitting a reprint or refund request. Depending on the issue, the cost will be covered by either Shelf Merch or you, the seller. Upgraded shipping costs are not covered and must be borne by the seller.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Scenarios Where Shelf Merch Covers Reprint/Refund Costs
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        <li>Manufacturing issues with the product.</li>
                        <li>Damage during shipping or broken items upon delivery.</li>
                        <li>Incorrect product received by the customer.</li>
                        <li>Orders lost in transit without any address changes.</li>
                        <li>Shipping times that exceed the general timeframes for orders.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Scenarios Where Shelf Merch Does Not Cover Reprint/Refund Costs
                      </h3>
                      <ul className="list-disc list-inside space-y-2">
                        <li> Dissatisfaction with the product that meets manufacturing standards.</li>
                        <li>Errors in product creation, such as incorrect image placement or design uploads.</li>
                        <li> Incorrect size selection by the customer.</li>
                        <li> Mislinked SKU variants on integrated platforms like Shopify or Etsy.</li>
                        <li>Orders still within specified production and shipping timeframes.</li>
                        <li>Orders lost in transit where address changes are requested during the reprint process.</li>
                        <li>Tracking shows "Delivered," but the package was not received.</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Lost in Transit
                      </h3>
                      <div className="space-y-3">
                        <p>
                        An order is considered lost in transit if it fails to arrive at the provided shipping address within the maximum specified shipping timeframe. If a customer reports a missing package and the shipping duration has exceeded standard timeframes, Shelf Merch may honor refund requests. Please note that shipping updates may vary, especially with standard shipping methods.
                        </p> 
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Returns Policy
                      </h3>
                      <div className="space-y-3">
                        <p>
                        Shelf Merch does not accept returns. However, the following options are available:
                        </p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Some vendors may accept returns if the return address is the vendor’s location.</li>
                          <li>Sellers can choose to accept returns to their own address and decide how to handle returned items.</li>
                          <li>Refunds are not issued for returned orders. Instead, Shelf Merch may offer a reshipment or reprint based on the vendor’s policies.</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Exchange Policy
                      </h3>
                      <p>
                        Shelf Merch does not offer exchanges due to the personalized nature of print-on-demand products.There is no inventory kept for exchanging items.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Apparel Substitution Policy
                      </h3>
                      <p>
                      If an ordered product is out of stock, Shelf Merch may substitute it with a similar item. Substitutions will only be made if the replacement item matches the color and is of equal or higher quality than the original.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Bulk Discount Policy
                      </h3>
                      <p>
                      Shelf Merch does not provide bulk discounts on product or shipping costs, nor do we offer wholesaling services. For bulk orders, items will be shipped in a single box or consolidated into multiple boxes based on the order size.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-4">
                        Custom Packaging Policy
                      </h3>
                      <p>
                      Shelf Merch does not offer custom inserts or packaging for orders. Due to the high volume of orders processed by our vendors, any disruption to standard packaging is not feasible.
                      </p>
                    </div>

                    <p>
                    For more details on policies such as Apparel Substitution or current production and shipping times, please refer to the relevant sections on our website.
                    </p>
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

export default CustomerSupportPolicyPage;