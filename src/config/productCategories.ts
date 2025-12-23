/**
 * Product Categories and Subcategories Configuration
 * 
 * This file defines all valid categories and subcategories for products.
 * Must match backend/config/productCategories.js
 */

export const CATEGORIES = {
  apparel: {
    id: 'apparel',
    name: 'Apparel',
    subcategories: [
      'T-Shirt',
      'Tank Top',
      'Hoodie',
      'Sweatshirt',
      'Jacket',
      'Crop Top',
      'Apron',
      'Scarf',
      'Jersey'
    ]
  },
  accessories: {
    id: 'accessories',
    name: 'Accessories',
    subcategories: [
      'Tote Bag',
      'Cap',
      'Phone Cover',
      'Gaming Pad',
      'Beanie'
    ]
  },
  home: {
    id: 'home',
    name: 'Home & Living',
    subcategories: [
      'Can',
      'Mug',
      'Cushion',
      'Frame',
      'Coaster'
    ]
  },
  print: {
    id: 'print',
    name: 'Print',
    subcategories: [
      'Business Card',
      'Book',
      'ID Card',
      'Sticker',
      'Poster',
      'Flyer',
      'Greeting Card',
      'Billboard',
      'Magazine',
      'Brochure',
      'Lanyard',
      'Banner',
      'Canvas',
      'Notebook'
    ]
  },
  packaging: {
    id: 'packaging',
    name: 'Packaging',
    subcategories: [
      'Box',
      'Tube',
      'Dropper Bottle',
      'Pouch',
      'Cosmetic',
      'Bottle'
    ]
  },
  tech: {
    id: 'tech',
    name: 'Tech',
    subcategories: [
      'IPhone',
      'Lap Top',
      'IPad',
      'Macbook',
      'Phone'
    ]
  },
  jewelry: {
    id: 'jewelry',
    name: 'Jewelry',
    subcategories: [
      'Ring',
      'Necklace',
      'Earring'
    ]
  }
} as const;

export type CategoryId = keyof typeof CATEGORIES;

/**
 * Get all valid category IDs
 */
export const getCategoryIds = (): CategoryId[] => Object.keys(CATEGORIES) as CategoryId[];

/**
 * Get subcategories for a given category
 */
export const getSubcategories = (categoryId: CategoryId): string[] => {
  const category = CATEGORIES[categoryId];
  return category ? [...category.subcategories] : [];
};

/**
 * Check if a category ID is valid
 */
export const isValidCategory = (categoryId: string): categoryId is CategoryId => {
  return categoryId in CATEGORIES;
};

/**
 * Check if a subcategory is valid for a given category
 */
export const isValidSubcategory = (categoryId: CategoryId, subcategory: string): boolean => {
  const subcategories = getSubcategories(categoryId);
  return subcategories.includes(subcategory);
};

/**
 * Generate product type code from subcategory
 * e.g., "T-Shirt" -> "TSHIRT", "Tote Bag" -> "TOTE_BAG"
 */
export const generateProductTypeCode = (subcategory: string): string => {
  return subcategory
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
};

