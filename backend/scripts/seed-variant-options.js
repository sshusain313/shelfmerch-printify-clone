/**
 * Migration Script: Seed Variant Options from Static Config
 * 
 * This script seeds the VariantOptionTemplate collection with all static
 * variant options from the productVariantOptions.ts config file.
 * 
 * IMPORTANT: 
 * - Backup your database before running this script
 * - Run in a development environment first
 * - This script is idempotent - it won't create duplicates
 */

require('dotenv').config();
const mongoose = require('mongoose');
const VariantOptionTemplate = require('../models/VariantOptionTemplate');
const User = require('../models/User');

// Static variant options from productVariantOptions.ts
// This mirrors the structure in src/config/productVariantOptions.ts
const STATIC_VARIANT_OPTIONS = {
  apparel: {
    default: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
      colors: [
        'White', 'Black', 'Navy', 'Red', 'Maroon', 'Gray', 'Charcoal', 'Silver',
        'Olive', 'Olive Drab', 'Forest Green', 'Royal Blue', 'Sky Blue', 'Burgundy', 
        'Pink', 'Yellow', 'Gold', 'Orange', 'Purple', 'Mint Green', 'Coral',
        'Beige-Gray', 'Tan', 'Crimson', 'Lavender', 'Teal'
      ],
    },
    bySubcategory: {
      'T-Shirt': {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
        colors: [
          'White', 'Black', 'Navy', 'Red', 'Gray', 'Charcoal', 'Light Gray',
          'Royal Blue', 'Sky Blue', 'Forest Green', 'Maroon', 'Pink', 'Yellow',
          'Orange', 'Purple', 'Olive', 'Beige-Gray', 'Tan'
        ],
      },
      'Hoodie': {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        colors: [
          'Black', 'Gray', 'Charcoal', 'Navy', 'Maroon', 'Forest Green', 
          'Olive', 'Burgundy', 'Beige-Gray'
        ],
      },
      'Tank Top': {
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        colors: [
          'White', 'Black', 'Gray', 'Light Gray', 'Navy', 'Red', 
          'Pink', 'Sky Blue', 'Coral', 'Mint Green', 'Yellow'
        ],
      },
    }
  },
  accessories: {
    default: {
      sizes: ['One Size'],
      colors: ['Black', 'Brown', 'Tan', 'Navy', 'Gray', 'Beige', 'Beige-Gray', 'Charcoal'],
    },
    bySubcategory: {
      'Tote Bag': {
        sizes: ['Small', 'Medium', 'Large'],
        colors: [
          'Natural', 'Black', 'Navy', 'Gray', 'Olive', 'Burgundy', 
          'Beige-Gray', 'Tan', 'Cream', 'Charcoal'
        ],
      },
      'Cap': {
        sizes: ['One Size', 'Youth'],
        colors: [
          'Black', 'Navy', 'Gray', 'Charcoal', 'White', 'Red', 
          'Olive', 'Camo', 'Tan', 'Beige-Gray'
        ],
      },
      'Phone Cover': {
        sizes: ['iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'Samsung Galaxy S23', 'Samsung Galaxy S24'],
        colors: [
          'Clear', 'Black', 'White', 'Blue', 'Royal Blue', 'Red', 
          'Pink', 'Purple', 'Green', 'Gold', 'Silver', 'Rose Gold'
        ],
      },
      'Gaming Pad': {
        sizes: ['Small (9x7)', 'Medium (12x10)', 'Large (16x12)', 'XL (18x16)'],
        colors: ['Black', 'Gray', 'Charcoal', 'White', 'Blue', 'Red', 'Purple', 'Green'],
      },
      'Beanie': {
        sizes: ['One Size'],
        colors: [
          'Black', 'Gray', 'Charcoal', 'Navy', 'Burgundy', 'Olive', 
          'Maroon', 'Beige-Gray', 'Forest Green'
        ],
      },
    }
  },
  home: {
    default: {
      sizes: ['Standard'],
      colors: ['White', 'Black', 'Gray', 'Beige', 'Beige-Gray', 'Navy', 'Cream', 'Ivory'],
    },
    bySubcategory: {
      'Mug': {
        sizes: ['11oz', '15oz', '20oz'],
        colors: [
          'White', 'Black', 'Red', 'Blue', 'Royal Blue', 'Green', 
          'Yellow', 'Pink', 'Purple', 'Orange', 'Gray', 'Beige-Gray'
        ],
      },
      'Can': {
        sizes: ['12oz', '16oz', '20oz'],
        colors: [
          'White', 'Black', 'Silver', 'Blue', 'Red', 'Green', 
          'Pink', 'Purple', 'Gold', 'Teal'
        ],
      },
      'Cushion': {
        sizes: ['14x14', '16x16', '18x18', '20x20'],
        colors: [
          'White', 'Black', 'Gray', 'Light Gray', 'Beige', 'Beige-Gray', 
          'Navy', 'Red', 'Yellow', 'Green', 'Blue', 'Pink', 'Cream', 'Tan'
        ],
      },
      'Frame': {
        sizes: ['5x7', '8x10', '11x14', '16x20', '18x24'],
        colors: [
          'Black', 'White', 'Wood', 'Silver', 'Gold', 'Rose Gold', 
          'Bronze', 'Copper', 'Charcoal', 'Beige-Gray'
        ],
      },
      'Coaster': {
        sizes: ['4x4', '4.5x4.5'],
        colors: [
          'White', 'Black', 'Cork', 'Wood', 'Gray', 'Beige-Gray', 
          'Tan', 'Natural', 'Slate'
        ],
      },
    }
  },
  print: {
    default: {
      sizes: ['Standard'],
      colors: ['Full Color'],
    },
    bySubcategory: {
      'Business Card': {
        sizes: ['3.5x2', '3.5x2 (Rounded)', '2x3.5'],
        colors: ['Full Color', 'Black & White'],
      },
      'Poster': {
        sizes: ['A4', 'A3', 'A2', 'A1', '11x17', '18x24', '24x36'],
        colors: ['Full Color', 'Black & White', 'Sepia'],
      },
      'Sticker': {
        sizes: ['2x2', '3x3', '4x4', '6x6', 'Custom'],
        colors: ['Full Color', 'Single Color', 'Clear Background'],
      },
      'Flyer': {
        sizes: ['A4', 'A5', 'Letter (8.5x11)', 'Half Letter (5.5x8.5)'],
        colors: ['Full Color', 'Black & White'],
      },
      'Notebook': {
        sizes: ['A4', 'A5', 'A6', 'B5', 'Letter'],
        colors: ['White Pages', 'Cream Pages', 'Black Pages', 'Ivory', 'Beige-Gray'],
      },
      'Banner': {
        sizes: ['2x4 ft', '3x6 ft', '4x8 ft', '5x10 ft'],
        colors: ['Full Color'],
      },
      'Canvas': {
        sizes: ['8x10', '11x14', '16x20', '18x24', '24x36'],
        colors: ['Standard Canvas', 'Gallery Wrap'],
      },
    }
  },
  packaging: {
    default: {
      sizes: ['Small', 'Medium', 'Large'],
      colors: ['White', 'Kraft', 'Black', 'Natural', 'Beige-Gray'],
    },
    bySubcategory: {
      'Box': {
        sizes: ['4x4x4', '6x6x6', '8x8x8', '10x10x10', '12x12x12'],
        colors: [
          'White', 'Kraft', 'Natural', 'Black', 'Brown', 
          'Beige-Gray', 'Tan', 'Custom Printed'
        ],
      },
      'Bottle': {
        sizes: ['50ml', '100ml', '250ml', '500ml', '1000ml'],
        colors: [
          'Clear', 'Amber', 'Blue', 'Cobalt Blue', 'Green', 
          'White', 'Black', 'Frosted'
        ],
      },
      'Pouch': {
        sizes: ['Small (4x6)', 'Medium (6x9)', 'Large (8x12)'],
        colors: [
          'Clear', 'White', 'Black', 'Kraft', 'Silver', 
          'Gold', 'Rose Gold', 'Beige-Gray'
        ],
      },
      'Tube': {
        sizes: ['2x12', '3x18', '4x24'],
        colors: ['White', 'Kraft', 'Natural', 'Black', 'Beige-Gray', 'Brown'],
      },
    }
  },
  tech: {
    default: {
      sizes: ['Standard'],
      colors: ['Black', 'White', 'Clear', 'Blue', 'Red', 'Gray', 'Silver'],
    },
    bySubcategory: {
      'IPhone': {
        sizes: [
          'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
          'iPhone 14', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
          'iPhone 15', 'iPhone 15 Pro', 'iPhone 15 Pro Max'
        ],
        colors: [
          'Clear', 'Black', 'White', 'Blue', 'Royal Blue', 'Navy', 'Red', 
          'Pink', 'Purple', 'Green', 'Yellow', 'Orange', 'Gray', 'Silver', 
          'Gold', 'Rose Gold', 'Beige-Gray'
        ],
      },
      'IPad': {
        sizes: [
          'iPad 10.2"', 'iPad Air 10.9"', 'iPad Pro 11"', 'iPad Pro 12.9"'
        ],
        colors: [
          'Clear', 'Black', 'White', 'Blue', 'Royal Blue', 'Navy', 'Red', 
          'Gray', 'Silver', 'Gold', 'Rose Gold'
        ],
      },
      'Macbook': {
        sizes: [
          'MacBook Air 13"', 'MacBook Pro 14"', 'MacBook Pro 16"'
        ],
        colors: [
          'Clear', 'Black', 'White', 'Blue', 'Gray', 'Silver', 
          'Charcoal', 'Beige-Gray', 'Rose Gold'
        ],
      },
      'Phone': {
        sizes: ['Small (5-6")', 'Medium (6-6.5")', 'Large (6.5"+)'],
        colors: [
          'Clear', 'Black', 'White', 'Blue', 'Red', 'Pink', 
          'Purple', 'Green', 'Gray', 'Silver'
        ],
      },
    }
  },
  jewelry: {
    default: {
      sizes: ['One Size', 'Adjustable'],
      colors: ['Silver', 'Gold', 'Rose Gold', 'White Gold', 'Black', 'Bronze', 'Copper'],
    },
    bySubcategory: {
      'Ring': {
        sizes: ['5', '6', '7', '8', '9', '10', '11', 'Adjustable'],
        colors: [
          'Silver', 'Gold', 'Rose Gold', 'White Gold', 'Black', 
          'Bronze', 'Copper', 'Brass', 'Platinum'
        ],
      },
      'Necklace': {
        sizes: ['14"', '16"', '18"', '20"', '22"', '24"', 'Adjustable'],
        colors: [
          'Silver', 'Gold', 'Rose Gold', 'White Gold', 'Black', 
          'Bronze', 'Copper', 'Brass'
        ],
      },
      'Earring': {
        sizes: ['Small', 'Medium', 'Large'],
        colors: [
          'Silver', 'Gold', 'Rose Gold', 'White Gold', 'Black', 
          'Bronze', 'Copper'
        ],
      },
    }
  }
};

// Color hex mapping (from colorMap.ts)
const COLOR_HEX_MAP = {
  'white': '#FFFFFF',
  'black': '#000000',
  'gray': '#808080',
  'grey': '#808080',
  'light gray': '#D3D3D3',
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'navy': '#000080',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'forest green': '#228B22',
  'mint green': '#98FF98',
  'olive': '#808000',
  'olive drab': '#6B8E23',
  'brown': '#A52A2A',
  'tan': '#D2B48C',
  'beige': '#F5F5DC',
  'beige-gray': '#9F9F9F',
  'maroon': '#800000',
  'burgundy': '#800020',
  'crimson': '#DC143C',
  'charcoal': '#36454F',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'rose gold': '#E8B4B8',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'coral': '#FF7F50',
  'lavender': '#E6E6FA',
  'teal': '#008080',
  'natural': '#F5F5DC',
  'clear': '#FFFFFF',
  'kraft': '#D4A574',
  'camo': '#78866B',
  'wood': '#8B4513',
  'cork': '#D4A574',
  'slate': '#708090',
  'white gold': '#F5F5DC',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'brass': '#B5A642',
  'platinum': '#E5E4E2',
  'frosted': '#F0F0F0',
  'amber': '#FFBF00',
  'cobalt blue': '#0047AB',
};

function getColorHex(colorName) {
  if (!colorName) return null;
  const normalized = colorName.toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || null;
}

async function seedVariantOptions() {
  try {
    console.log('🚀 Starting variant options seed...\n');
    
    // Connect to MongoDB
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;

    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    let connectionString = mongoUrl;
    if (dbName && !mongoUrl.includes('/') || (mongoUrl.split('/').length === 3 && !mongoUrl.split('/')[2].includes('?'))) {
      const urlParts = mongoUrl.split('/');
      if (urlParts.length <= 3 || !urlParts[3] || urlParts[3].trim() === '') {
        connectionString = dbName
          ? `${mongoUrl}/${dbName}`
          : mongoUrl;
      }
    }

    console.log(`🔌 Connecting to MongoDB...`);
    console.log(`   Database will be: ${connectionString.split('/').pop().split('?')[0]}`);
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.name}\n`);

    // Get a superadmin user to use as createdBy
    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      throw new Error('No superadmin user found. Please create a superadmin first.');
    }
    console.log(`👤 Using superadmin: ${superadmin.email}\n`);

    let totalCreated = 0;
    let totalSkipped = 0;

    // Process each category
    for (const [categoryId, categoryData] of Object.entries(STATIC_VARIANT_OPTIONS)) {
      console.log(`\n📦 Processing category: ${categoryId}`);
      
      // Process default options (subcategoryId = null)
      if (categoryData.default) {
        console.log(`   Processing default options...`);
        
        // Process sizes
        for (const size of categoryData.default.sizes || []) {
          const existing = await VariantOptionTemplate.findOne({
            categoryId,
            subcategoryId: null,
            optionType: 'size',
            value: size
          });
          
          if (!existing) {
            await VariantOptionTemplate.create({
              categoryId,
              subcategoryId: null,
              optionType: 'size',
              value: size,
              createdBy: superadmin._id
            });
            console.log(`     ✅ Created size: ${size}`);
            totalCreated++;
          } else {
            console.log(`     ⏭️  Skipped size (exists): ${size}`);
            totalSkipped++;
          }
        }
        
        // Process colors
        for (const color of categoryData.default.colors || []) {
          const existing = await VariantOptionTemplate.findOne({
            categoryId,
            subcategoryId: null,
            optionType: 'color',
            value: color
          });
          
          if (!existing) {
            const colorHex = getColorHex(color);
            await VariantOptionTemplate.create({
              categoryId,
              subcategoryId: null,
              optionType: 'color',
              value: color,
              colorHex: colorHex,
              createdBy: superadmin._id
            });
            console.log(`     ✅ Created color: ${color}${colorHex ? ` (${colorHex})` : ''}`);
            totalCreated++;
          } else {
            console.log(`     ⏭️  Skipped color (exists): ${color}`);
            totalSkipped++;
          }
        }
      }
      
      // Process subcategory-specific options
      if (categoryData.bySubcategory) {
        for (const [subcategoryId, subcategoryData] of Object.entries(categoryData.bySubcategory)) {
          console.log(`   Processing subcategory: ${subcategoryId}`);
          
          // Process sizes
          for (const size of subcategoryData.sizes || []) {
            const existing = await VariantOptionTemplate.findOne({
              categoryId,
              subcategoryId: subcategoryId,
              optionType: 'size',
              value: size
            });
            
            if (!existing) {
              await VariantOptionTemplate.create({
                categoryId,
                subcategoryId: subcategoryId,
                optionType: 'size',
                value: size,
                createdBy: superadmin._id
              });
              console.log(`     ✅ Created size: ${size}`);
              totalCreated++;
            } else {
              console.log(`     ⏭️  Skipped size (exists): ${size}`);
              totalSkipped++;
            }
          }
          
          // Process colors
          for (const color of subcategoryData.colors || []) {
            const existing = await VariantOptionTemplate.findOne({
              categoryId,
              subcategoryId: subcategoryId,
              optionType: 'color',
              value: color
            });
            
            if (!existing) {
              const colorHex = getColorHex(color);
              await VariantOptionTemplate.create({
                categoryId,
                subcategoryId: subcategoryId,
                optionType: 'color',
                value: color,
                colorHex: colorHex,
                createdBy: superadmin._id
              });
              console.log(`     ✅ Created color: ${color}${colorHex ? ` (${colorHex})` : ''}`);
              totalCreated++;
            } else {
              console.log(`     ⏭️  Skipped color (exists): ${color}`);
              totalSkipped++;
            }
          }
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Seed completed successfully!`);
    console.log(`   Created: ${totalCreated} options`);
    console.log(`   Skipped: ${totalSkipped} options (already exist)`);
    console.log('='.repeat(50) + '\n');

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding variant options:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed
seedVariantOptions();




