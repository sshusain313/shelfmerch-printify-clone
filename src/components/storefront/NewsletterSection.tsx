import { ArrowRight } from "lucide-react";

const NewsletterSection = () => {
  return (
    <section className="py-20 lg:py-24 bg-foreground text-background">
      <div className="container mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 tracking-tight">
          Stay in the Loop
        </h2>
        <p className="text-background/70 text-lg mb-10 max-w-lg mx-auto">
          Be the first to know about new drops, exclusive offers, and more.
        </p>

        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-6 py-4 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:border-background/40 transition-colors"
          />
          <button
            type="submit"
            className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors group"
          >
            Subscribe
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;
