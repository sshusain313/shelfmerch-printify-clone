import ProductCard from './ProductCard';
import sustainablePolo from '@/assets/sustainable-unisex.png';
import deluxePolo from '@/assets/deluxe-unisex.png';
import zipperHoodie from '@/assets/unisex-zipper.png';
import regularPolo from '@/assets/reg-unisex.png';

const products = [
  { name: 'Sustainable Unisex Polo T-Shirt', image: sustainablePolo },
  { name: 'Deluxe Unisex Polo T-Shirt', image: deluxePolo },
  { name: 'Unisex Zipper Hoodie', image: zipperHoodie },
  { name: 'Regular Unisex Polo T-shirt', image: regularPolo },
];

const ProductGrid = () => {
  return (
    <section className="py-4 lg:py-6 bg-background">
      <div className="container-custom">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Popular in Customized merch
          </h2>
          <p className="text-muted-foreground">
            Check out our recommended items made for your store!
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;