import dashboardMockup from "@/assets/dashboard-mockup.png";

const LaunchStoreSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Launch Your Digital Store Instantly - No Tech Skills Required
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
          Easily create, design, and launch your online store in minutes.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
          Quick setup, effortless customization, and a seamless launch process—everything you need, right at your fingertips.
          </p>
          <p className="text-primary font-semibold mt-4">
            100% yours at zero cost. Full control, no hidden fees.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Dashboard Preview */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-foreground p-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1 bg-muted rounded text-sm">
                  <span className="text-primary font-semibold">Shelf</span>
                  <span className="text-foreground font-semibold">Merch</span>
                </div>
              </div>
            </div>
            
            <img 
              src={dashboardMockup} 
              alt="Shelf Merch Dashboard" 
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LaunchStoreSection;
