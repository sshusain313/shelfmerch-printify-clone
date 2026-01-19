interface ProductCardProps {
    image: string;
    name: string;
  }
  
  const ProductCard = ({ image, name }: ProductCardProps) => {
    return (
      <div className="group">
        <div className="relative bg-brand-light-gray rounded-2xl overflow-hidden aspect-[3/4] mb-4">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="text-sm font-medium text-foreground text-center">{name}</h3>
      </div>
    );
  };
  
  export default ProductCard;