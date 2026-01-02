import youtubePhone from "@/assets/youtube-phone.png";
import ytstore from "@/assets/yt-store.png";
import sync from "@/assets/sync.png";
import link from "@/assets/link.png";
const YouTubePartnerSection = () => {
  const features = [
    {
      icon: (
        <img src={ytstore} alt="yt-store" />
      ),
      text: "Shelf Merch seamlessly integrates with YouTube Store",
    },
    {
      icon: (
        <img src={sync} alt="sync" /> 
      ),
      text: "Easily sync your products to automatically appear in your channel",
    },
    {
      icon: (
        <img src={link} alt="link" />
      ),
      text: "Link in-video or under content for people to watch, engage and shop",
    },
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Image */}
          <div className="flex justify-center">
            <img 
              src={youtubePhone} 
              alt="YouTube merch store on phone" 
              className="w-full max-w-lg rounded-xl shadow-2xl"
            />
          </div>

          {/* Right Content */}
          <div className="space-y-6 text-foreground">
            <h2 className="text-3xl md:text-4xl font-bold">
              YouTube Official Merch Partner
            </h2>
            <h3 className="text-xl font-semibold">
              Plug Into YouTube Shopping with Your Own Merch Store.
            </h3>
            <p className="text-base">
              Launch your custom online merchandise store effortlessly. Design and sell personalized products such as t-shirts, hoodies, jumpers, art prints, and more. Seamlessly integrate with your existing website or connect directly to YouTube's Shopping store to showcase and sell sustainable, high-quality merchandise to your subscribers, boosting engagement and opening new revenue streams.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 min-w-[120px]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <p className="text-xs font-medium text-center">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default YouTubePartnerSection;
