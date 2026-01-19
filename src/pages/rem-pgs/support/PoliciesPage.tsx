import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Link, useLocation } from 'react-router-dom';

const PoliciesPage = () => {
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
                {/* Fulfillment Policies */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Fulfillment Policies
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed">
                    <p>
                    Shelf Merch-approved vendors will ship orders according to Digital Store’s fulfillment guidelines. Orders must be marked as "Awaiting Collection" within two business days of order submission. "Awaiting Collection" indicates the order is ready for pick-up and that the tracking number has been provided.
                    </p>
                    <p>
                      Once a shipping label is created, the carrier must scan the order within 24 hours.
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Shelf Merch vendors must meet the following performance metrics set by the Digital Store:
                  </h2>
                  <div className="space-y-6 text-foreground leading-relaxed">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Seller Fault Cancellation Rate (SFCR):
                      </h3>
                      <p>
                      This is the percentage of confirmed orders canceled due to the seller's fault before reaching the "Transit to Ship" (TTS) or "Shipped" status. All sellers must maintain an SFCR of 2.5% or lower.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Late Dispatch Rate (LDR):
                      </h3>
                      <p>
                      This is the percentage of orders not dispatched on time. Sellers are expected to maintain an LDR of 4% or lower.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Valid Tracking Rate (VTR):
                      </h3>
                      <p>
                      Defined as the percentage of orders with accurate and verifiable tracking information. Sellers using "Ship by Seller" must input correct tracking IDs, shipping provider, and service details. The required VTR is 95% or higher.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        Return and Refund Error Rate:
                      </h3>
                      <p>
                        The rate of seller-related return and refund errors must be less than 1.0%.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Service Policies */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Customer Service Policies
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed">
                    <p>
                    All sellers on the Digital Store platform must adhere to the Customer Order Cancellation, Return, and Refund Policy. This policy is periodically updated, so sellers are responsible for staying informed of any changes to ensure compliance.
                    </p> 
                    <p>
                    Note: As the Digital Store regularly updates its policies, any new guidelines not explicitly outlined will require review and approval by the Shelf Merch team.
                    </p>
                  </div>
                </div>

                {/* Order Cancellation */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Customers may request order cancellations under the following circumstances:
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed">
                    <p>
                    • If the shipping method is "Ship by Seller," a cancellation request made within one hour of ordering during the "Pending" period will be automatically processed without a refund requirement.
                    </p>
                    <p>
                    • If the order status has not changed to "Shipped" after three business days and the seller adjusts the Order Processing Time, extending the Estimated Delivery Time range, Shelf Merch will issue a refund upon customer request.
                    </p>
                    <p>
                    • If the order is not delivered within the Estimated Delivery Time, Shelf Merch will provide a refund for orders within the contiguous 48 states (excluding Alaska, Hawaii, U.S. Territories, or APO/FPO addresses).
                    </p>
                    <p>
                    • Orders cannot be canceled once they reach "Ready to Ship" (RTS) status ("Shipped" in Shelf Merch's system). For cancellation requests before the RTS status, the seller must either upload the tracking number or approve the customer's cancellation request within 24 hours. If the tracking information is not uploaded within this period, the Digital Store will automatically cancel the order.
                    </p>
                    <p>
                    • Note: Shelf Merch cannot guarantee cancellations for items already in production; if an item is in production, the seller can request cancellation, but production cost still applies.
                    </p>
                  </div>
                </div>

                {/* Refunds and Returns */}
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                    Refunds and Returns
                  </h2>
                  <div className="space-y-4 text-foreground leading-relaxed mb-6">
                    <p>
                    Customers may request a return and refund only after the order status is marked as "Shipped." They have 30 calendar days from the "Delivered" status update to initiate a return and refund request.
                    </p>
                    <p>
                    Shelf Merch does not accept physical returns. Digital Store will auto-approve valid return requests, and Shelf Merch will issue refunds according to the outlined policies. Any returns outside this scope are the seller’s responsibility to refund. Full refunds will include applicable Digital Store processing fees.
                    </p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                      For any customer refund requests, sellers must comply with the following guidelines:
                    </h3>
                    <div className="space-y-3 text-foreground leading-relaxed">
                      <p>
                      • Customers must provide reasonable supporting materials (e.g., photos or videos of the product) when submitting refund requests.
                      </p>
                      <p>
                      • Sellers have two business days (excluding weekends) to review refund-only requests. If no action is taken within this period, the Digital Store will auto-approve the refund request.
                      </p>
                      <p>
                      • Sellers must not reject a refund or return request without a valid reason. If a refund request is accepted, the seller must submit a ticket to Shelf Merch with all photo and video evidence for processing the refund.
                      </p>
                    </div>
                  </div>

                  {/* Refund Request Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-black">
                      <thead>
                        <tr>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Reason</th>
                          <th className="text-left py-3 px-4 font-bold text-foreground border border-black">Responsible Party</th>
                        </tr>
                      </thead>
                      <tbody className="text-foreground">
                        <tr>
                          <td className="py-3 px-4 border border-black">The customer no longer needs the product</td>
                          <td className="py-3 px-4 border border-black">Seller will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The customer received a product that did not match the product description provided at the time of purchase.</td>
                          <td className="py-3 px-4 border border-black">Seller will refund. Shelf Merch will refund for a wrong or defective item.</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Product with missing parts or accessories was delivered</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The product's condition upon delivery was defective. This includes poor print quality that does not result from poor-quality image files or incorrect image placement.</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The wrong product was delivered</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The package was not received within the Estimated Delivery Time, and the customer did not consent to the delay. TikTok will issue an automatic refund to the customer.</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The shipping box was damaged, but the product is in good condition</td>
                          <td className="py-3 px-4 border border-black">Seller will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The product was damaged, but the shipping box is in good condition</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The product doesn't fit properly</td>
                          <td className="py-3 px-4 border border-black">Seller will refund. Shelf Merch will refund if the wrong size is delivered.</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The product's fabric, material, or style is not as expected</td>
                          <td className="py-3 px-4 border border-black">Seller will refund. Shelf Merch will refund if the item is defective.</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The colour or pattern of the product is not as expected</td>
                          <td className="py-3 px-4 border border-black">Seller will refund. Shelf Merch will refund if the item is defective.</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">If a product is out of stock, the seller may notify the customer and cancel the order. However, these cancellations will negatively impact SFCR.</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund if the order is OOS and the customer cancels.</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Lost in Transit Shipments</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">Invalid tracking numbers</td>
                          <td className="py-3 px-4 border border-black">Shelf Merch will refund</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 border border-black">The package wasn't received after the order status was marked as delivered</td>
                          <td className="py-3 px-4 border border-black">This is at the seller's discretion to refund. Shelf Merch will not refund if the order is marked "delivered."</td>
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

export default PoliciesPage;
