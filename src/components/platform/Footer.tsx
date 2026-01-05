import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Instagram, Linkedin } from "lucide-react";
import logo from "@/assets/logo-white.png";
import amfori from "@/assets/amfori.png";
import global from "@/assets/global.png";
import fairwear from "@/assets/fair-wear.png";
import sedex from "@/assets/sedex.png";
import bsci from "@/assets/bsci.png";
import sustainableapparelcoalition from "@/assets/coalition.png";
import higgindex from "@/assets/higg.png";
import accord from "@/assets/accord.png";
import organic from "@/assets/organic.png"; 
const Footer = () => {
  const footerLinks = {
    products: {
      title: "Products",
      links: ["Catalogue", "T-shirts", "Polos", "Oversized", "Hoodies", "Sweatshirts", "Mrchx", "Tees Graphy"],
    },
    solutions: {
      title: "Solutions",
      links: ["Creators & Agencies", "Fashion & Apparel", "Entertainment & Media", "Home Decor", "Customized Merch", "Enterprise Merch", "Bulk Orders"],
    },
    about: {
      title: "About",
      links: ["Our Story", "Careers", "Contact Us"],
    },
    
  };

  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-20 mb-4">
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-8">
              <img src={logo} alt="logo" />
            </div>
            <p className="text-sm text-muted-foreground">
              A print-on-demand platform enabling businesses and creators to design, sell, and fulfill custom, sustainable merchandise without inventory.
            </p>
            <Button className="bg-primary hover:bg-lime-dark text-primary-foreground font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">{footerLinks.products.title}</h4>
            <ul className="space-y-2">
              {footerLinks.products.links.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">{footerLinks.solutions.title}</h4>
            <ul className="space-y-2">
              {footerLinks.solutions.links.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="font-semibold text-background">{footerLinks.about.title}</h4>
            <ul className="space-y-2">
              {footerLinks.about.links.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          
        </div>

        {/* Partner Certifications */}
        <div className="border-t border-muted pt-8 mb-8">
          <h3 className="text-center text-background mb-6 text-lg font-medium">
            Our Partner Certifications
          </h3>
          <div className="flex items-center justify-center gap-16 flex-wrap">
            <img src={amfori} alt="amfori" className="h-4 w-auto object-contain" />
            <img src={global} alt="global" className="h-4 w-auto object-contain" />
            <img src={fairwear} alt="fairwear" className="h-4 w-auto object-contain" />
            <img src={sedex} alt="sedex" className="h-4 w-auto object-contain" />
            <img src={bsci} alt="bsci" className="h-4 w-auto object-contain" />
            <img src={sustainableapparelcoalition} alt="sustainableapparelcoalition" className="h-4 w-auto object-contain" />
            <img src={higgindex} alt="higgindex" className="h-4 w-auto object-contain" />
            <img src={accord} alt="accord" className="h-4 w-auto object-contain" />
            <img src={organic} alt="organic" className="h-4 w-auto object-contain" />
          </div>
        </div>
        {/* Bottom */}
        <div className="border-t border-muted pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            {/* Left - Copyright */}
            <p>© 2024 Chitlu Innovations Pvt Ltd. All rights reserved</p>
            
            {/* Center - Legal Links */}
            <div className="flex items-center gap-2">
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <span className="text-muted-foreground">|</span>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span className="text-muted-foreground">|</span>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
              <span className="text-muted-foreground">|</span>
              <a href="#" className="hover:text-primary transition-colors">Return & Refunds</a>
            </div>
            
            {/* Right - Social Media Icons */}
            <div className="flex items-center gap-3">
              <a 
                href="#" 
                className="w-8 h-8 rounded-full bg-background border border-muted-foreground flex items-center justify-center hover:border-primary transition-colors"
              >
                <Play className="h-4 w-4 text-foreground" fill="currentColor" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-full bg-background border border-muted-foreground flex items-center justify-center hover:border-primary transition-colors"
              >
                <Instagram className="h-4 w-4 text-foreground" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-full bg-background border border-muted-foreground flex items-center justify-center hover:border-primary transition-colors"
              >
                <Linkedin className="h-4 w-4 text-foreground" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );

};

export default Footer;