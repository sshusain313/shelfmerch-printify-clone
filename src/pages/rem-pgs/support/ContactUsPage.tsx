import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import contact from '@/assets/contact.png'; 
import bulkOrder from '@/assets/bulk-order.png';
const ContactUsPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How much does it cost to use Shelf Merch Services?',
      answer: "It's free to create and launch your digital store (print on demand business) with Shelf Merch. As your business grows, you can choose from advanced or plus plans to access more features.",
    },
    {
      question: 'Does Shelf Merch ship globally?',
      answer: 'Yes, Shelf Merch handles printing and shipping locally in India and the USA. For other countries, orders are fulfilled through the nearest printing partner.',
    },
    {
      question: 'Can I order product samples?',
      answer: 'Yes, with Shelf Merch, you can create your store, add your products, and make purchases directly from your own store to test product quality, packaging, and shipping.',
    },
    {
      question: 'Who can join Shelf Merch to launch a store?',
      answer: "There's no criteria for who can join Shelf Merch. The platform supports wide use cases such as merch store builder, ecommerce store builder, print on demand drop shipping, digital goods shop etc. From social media creators to indie hackers and online brands, all can use Shelf Merch for their unique use cases.",
    },
    {
      question: 'How to connect Shelf Merch Store to YouTube?',
      answer: 'Go to studio.youtube.com. -> Select Monetization -> Click on Shopping -> Select Shelf Merch.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
    <Header />
      {/* Account Support Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                {/* Placeholder for office image */}
                <img src={contact} alt="Contact Image" className="w-full h-auto" />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Need help with your Shelf Merch account?
                </h2>
                <Button 
                  onClick={() => {
                    document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-primary hover:bg-brand-green-hover text-primary-foreground font-semibold px-6 py-3 rounded-lg"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offices and Contact Form Section */}
      <section id="contact-form-section" className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Our Offices */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  Our offices
                </h2>
                
                <div className="space-y-8">
                  {/* Hyderabad Office */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Hyderabad</h3>
                    <div className="space-y-2 text-foreground mb-4">
                      <p>G2, Win Win Towers, Hi-Tech City Road, Madhapur, Hyderabad, India - 500081.</p>
                      <p>Mobile: 9515888515</p>
                      <p>Email: support@shelfmerch.com</p>
                    </div>
                    {/* Google Maps placeholder */}
                    <div className="w-full h-64 bg-muted/30 rounded-lg flex items-center justify-center mb-2">
                      <p className="text-muted-foreground">Google Maps</p>
                    </div>
                    <a href="#" className="text-primary hover:underline text-sm">View larger map</a>
                  </div>

                  {/* Bengaluru Office */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-4">Bengaluru</h3>
                    <div className="space-y-2 text-foreground">
                      <p>S10, St Mark's Rd, Shanthala Nagar, Ashok Nagar, Bengaluru, India-560001.</p>
                      <p>Mobile: 9515888515</p>
                      <p>Email: support@shelfmerch.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Contact
                </h2>
                <p className="text-foreground mb-6">
                  Send us a message from right here using the form!
                </p>
                
                <form className="space-y-4">
                  <div>
                    <select className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Account & Stores</option>
                      <option>Delivery Issues</option>
                      <option>Products and Design</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="How can we help?"
                      rows={6}
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <Button className="w-full bg-primary hover:bg-brand-green-hover text-primary-foreground font-semibold px-6 py-3 rounded-lg">
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bulk Orders Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Interested in placing a bulk order or shift your products to Shelf Merch Platform?
                </h2>
                <p className="text-lg text-foreground leading-relaxed">
                  Our Sales team is here to simplify the process and support your success every step of the way.
                </p>
                <Button 
                  asChild
                  className="bg-primary hover:bg-brand-green-hover text-primary-foreground font-semibold px-6 py-3 rounded-lg"
                >
                  <a 
                    href="https://api.whatsapp.com/send/?phone=%2B919515888515&text&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Talk to sales
                  </a>
                </Button>
              </div>
              <div>
                {/* Placeholder for bulk order image */}
                <img src={bulkOrder} alt="Bulk Order Image" className="w-xl h-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container-custom">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Left Column - Introduction */}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                  Frequently Asked Questions
                </h2>
                <p className="text-foreground leading-relaxed">
                  Here, you'll find answers to the most common questions about Shelf Merch and our services. From understanding costs to learning about our global shipping options, we're here to make your experience smooth and hassle-free. If you need more assistance, feel free to reach out to us directly.
                </p>
              </div>

              {/* Right Column - FAQ Items */}
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-border pb-6">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-start justify-between text-left gap-4"
                    >
                      <h3 className={`text-lg font-bold flex-1 ${openFaq === index ? 'text-primary' : 'text-foreground'}`}>
                        {faq.question}
                      </h3>
                      {openFaq === index ? (
                        <ChevronUp className={`h-5 w-5 flex-shrink-0 ${openFaq === index ? 'text-primary' : 'text-foreground'}`} />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-foreground flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <p className="text-foreground mt-4 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
                <div className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <a 
                      href="https://studio.youtube.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block"
                    >
                      Go to studio.youtube.com.
                    </a>
                    <div className="space-y-1 text-foreground">
                      <p>→ Select Monetization</p>
                      <p>→ Click on Shopping</p>
                      <p>→ Select Shelf Merch</p>
                    </div>
                  </div>
                  <div>
                    <a 
                      href="https://api.whatsapp.com/send/?phone=%2B919515888515&text&type=phone_number&app_absent=0" 
                      className="text-primary hover:underline font-medium"
                    >
                      +91 9515888515
                    </a>
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

export default ContactUsPage;