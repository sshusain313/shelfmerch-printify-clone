import Header from "@/components/home/Header";
import HeroSection from "@/components/home/HeroSection";
import PartnerLogos from "@/components/home/PartnerLogos";
import ZeroInvestmentSection from "@/components/home/ZeroInvestmentSection";
import ProductsShowcase from "@/components/home/ProductsShowcase";
import LaunchStoreSection from "@/components/home/LaunchStoreSection";
import PrintOnDemandSection from "@/components/home/PrintOnDemandSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import SuccessFeaturesSection from "@/components/home/SuccessFeaturesSection";
import StoreConnectionSection from "@/components/home/StoreConnectionSection";
import YouTubePartnerSection from "@/components/home/YouTubePartnerSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import ExpertCTASection from "@/components/home/ExpertCTASection";
import Footer from "@/components/home/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <PartnerLogos />
        <ZeroInvestmentSection />
        <ProductsShowcase />
        <LaunchStoreSection />
        <PrintOnDemandSection />
        <HowItWorksSection />
        <SuccessFeaturesSection />
        <StoreConnectionSection />
        <YouTubePartnerSection />
        <TestimonialSection />
        <ExpertCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
