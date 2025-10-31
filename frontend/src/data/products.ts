export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  badge?: string;
  category: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Bella Canvas 3001',
    brand: 'Bella + Canvas',
    price: 7.46,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    badge: 'Best Seller',
    category: 't-shirts',
    description: 'Premium cotton t-shirt, soft and comfortable',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['White', 'Black', 'Navy', 'Gray']
  },
  {
    id: '2',
    name: 'Gildan Heavy Cotton',
    brand: 'Gildan',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400',
    category: 't-shirts',
    description: 'Classic heavyweight cotton tee',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['White', 'Black', 'Red', 'Blue']
  },
  {
    id: '3',
    name: 'Premium Hoodie',
    brand: 'Independent',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    badge: 'Hot',
    category: 'hoodies',
    description: 'Cozy fleece hoodie with kangaroo pocket',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Black', 'Gray', 'Navy']
  },
  {
    id: '4',
    name: 'Canvas Tote Bag',
    brand: 'Liberty Bags',
    price: 8.50,
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
    category: 'bags',
    description: 'Durable cotton canvas tote bag',
    sizes: ['One Size'],
    colors: ['Natural', 'Black']
  },
  {
    id: '5',
    name: 'Coffee Mug 11oz',
    brand: 'ShelfMerch',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400',
    category: 'drinkware',
    description: 'Ceramic coffee mug, dishwasher safe',
    sizes: ['11oz', '15oz'],
    colors: ['White', 'Black']
  },
  {
    id: '6',
    name: 'Baseball Cap',
    brand: 'Flexfit',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400',
    category: 'caps',
    description: 'Adjustable baseball cap with structured front',
    sizes: ['One Size'],
    colors: ['Black', 'Navy', 'Red', 'White']
  },
  {
    id: '7',
    name: 'Crewneck Sweatshirt',
    brand: 'Bella + Canvas',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400',
    category: 'hoodies',
    description: 'Classic crewneck sweatshirt',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Gray', 'Black', 'Navy']
  },
  {
    id: '8',
    name: 'Spiral Notebook',
    brand: 'ShelfMerch',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
    category: 'stationery',
    description: '80 pages, ruled, spiral-bound notebook',
    sizes: ['5x7', '8x10'],
    colors: ['White']
  }
];

export const categories = [
  { name: 'T-Shirts', slug: 't-shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
  { name: 'Hoodies', slug: 'hoodies', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400' },
  { name: 'Tote Bags', slug: 'bags', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
  { name: 'Drinkware', slug: 'drinkware', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400' },
  { name: 'Caps', slug: 'caps', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400' },
  { name: 'Stationery', slug: 'stationery', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400' }
];
