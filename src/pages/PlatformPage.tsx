import Header from "@/components/platform/Header";
import HeroSection from "@/components/platform/HeroSection";
import BeTheBoss from "@/components/platform/BeTheBoss";
import EcosystemPyramid from "@/components/platform/EcosystemPyramid";
import FeaturesGrid from "@/components/platform/FeaturesGrid";
import YouTubeIntegration from "@/components/platform/YouTubeIntegration";
import ExpertCTASection from "@/components/platform/ExpertCTASection";
import Footer from "@/components/platform/Footer";

const PlatformPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <BeTheBoss />
        <EcosystemPyramid />
        <FeaturesGrid />
        <YouTubeIntegration />
        <ExpertCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default PlatformPage;
