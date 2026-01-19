import youtubeDashboard from "@/assets/youtube-dashboard.png";

const YouTubeIntegration = () => {
  return (
    <section className="shelf-section bg-background">
      <div className="shelf-container">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-shelf-dark mb-4">
            YouTube Store Integration with Shelf Merch
          </h2>
          <p className="text-xl text-base text-shelf-muted leading-relaxed">
            As an official YouTube Store platform partner, Shelf Merch helps creators and brands showcase products directly on their YouTube channels. Connect your online store seamlessly to YouTube, enabling Shopping features that turn your channel into a fully integrated storefront.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-0 items-center container">

          {/* Left - Features */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-shelf-dark mb-2">
                Instant Store Connection
              </h3>
              <p className="text-xl text-shelf-muted text-base leading-relaxed">
                Quickly connect your store to YouTube to start showcasing products on your channel.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-shelf-dark mb-2">
                Digital Store Creation
              </h3>
              <p className="text-xl text-shelf-muted text-base leading-relaxed">
                Display your merchandise directly under your videos and on your channel homepage, making it easy for viewers to explore and buy.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-shelf-dark mb-2">
                Optimized Shopping Experience
              </h3>
              <p className="text-xl text-shelf-muted text-base leading-relaxed">
                Viewers can see product images, names, prices, and click through to purchase—all without leaving YouTube.
              </p>
            </div>
          </div>

          {/* Right - Dashboard Image */}
          <div className="flex justify-end">
            <img
              src={youtubeDashboard}
              alt="YouTube Store Dashboard Integration"
              className="w-full max-w-l h-auto rounded"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default YouTubeIntegration;