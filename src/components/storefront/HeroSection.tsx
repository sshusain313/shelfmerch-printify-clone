const HeroSection = () => {
    return (
      <section className="hero-gradient min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
  
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-primary/10 animate-float" />
        <div className="absolute bottom-32 right-20 w-16 h-16 rounded-full bg-accent/10 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "4s" }} />
  
        <div className="container mx-auto px-6 lg:px-8 text-center relative z-10">
          <span className="animate-fade-up inline-block text-sm font-medium text-primary tracking-widest uppercase mb-6">
            New Collection 2025
          </span>
          <h1 className="animate-fade-up animate-delay-100 font-display text-5xl md:text-7xl lg:text-8xl font-semibold text-foreground tracking-tight mb-6 leading-[1.1]">
            Welcome to
            <br />
            <span className="text-primary">merch</span>
          </h1>
          <p className="animate-fade-up animate-delay-200 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 font-light">
            Premium custom merchandise designed with passion. 
            Every piece tells a story.
          </p>
          <div className="animate-fade-up animate-delay-300 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="btn-primary-store">
              Shop Now
            </a>
            <a href="#about" className="btn-outline-store">
              Our Story
            </a>
          </div>
        </div>
  
        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 40V80H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>
    );
  };
  
  export default HeroSection;
  