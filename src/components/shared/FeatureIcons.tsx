import unlimited from '@/assets/unlim-cap.png';
import consistent from '@/assets/consistent-q.png';
import seamless from '@/assets/seamless.png';
import FeatureIconCard from './FeatureIconCard';

const features = [
  {
    icon: unlimited,
    title: 'Unlimited Capacity',
    description: 'With our vast global network of manufacturing partners, your production has no limits. We handle it all as your single point of contact.',
  },
  {
    icon: consistent,
    title: 'Consistent Quality',
    description: 'Our automated fulfillment process reduces human error, ensuring top-notch quality and happier customers every time.',
  },
  {
    icon: seamless,
    title: 'Seamless Flexibility',
    description: 'Easily connect multiple stores and platforms to Shelf Merch and manage all orders and shipping updates from one intuitive dashboard.',
  },
];

const FeatureIcons = () => {
  return (
    <section className="py-4 lg:py-6 bg-background">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-left">
              <div className="inline-flex items-left justify-left w-20 h-20 rounded-lg ">
                <img src={feature.icon} alt={feature.title} className="w-20 h-20 object-contain" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureIcons;