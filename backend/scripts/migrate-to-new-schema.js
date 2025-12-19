/**
 * Migration Script: Products → CatalogProducts + StoreProducts
 * 
 * This script migrates existing Product and ProductVariant collections
 * to the new CatalogProduct, CatalogProductVariant, Store, StoreProduct,
 * and StoreProductVariant collections.
 * 
 * IMPORTANT: 
 * - Backup your database before running this script
 * - Run in a development environment first
 * - Handle base64 images separately (see REFACTORING_PLAN.md)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Import old models
const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const User = require('../models/User');

// Import new models
const CatalogProduct = require('../models/CatalogProduct');
const CatalogProductVariant = require('../models/CatalogProductVariant');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const StoreProductVariant = require('../models/StoreProductVariant');

async function migrate() {
  try {
    console.log('🚀 Starting migration...\n');
    
    // Connect to MongoDB (mirror server.js logic, don't force DB_NAME)
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;

    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    // If MONGO_URL already contains a database name, use it as-is
    // Otherwise, append DB_NAME if provided
    let connectionString = mongoUrl;
    if (dbName && !mongoUrl.includes('/') || (mongoUrl.split('/').length === 3 && !mongoUrl.split('/')[2].includes('?'))) {
      // Only append DB_NAME if URL doesn't already have a database path
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
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}\n`);

    // Step 1: Update User roles (admin → superadmin)
    console.log('\n📝 Step 1: Updating user roles...');
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      await User.updateMany(
        { role: 'admin' },
        { $set: { role: 'superadmin' } }
      );
      console.log(`   Updated ${admins.length} admin(s) to superadmin`);
    } else {
      console.log('   No admins found to update');
    }

    // Step 2: Migrate products to CatalogProducts
    console.log('\n📦 Step 2: Migrating products to CatalogProducts...');
    const oldProducts = await Product.find({});
    console.log(`   Found ${oldProducts.length} products to migrate`);

    let catalogProductCount = 0;
    let variantCount = 0;
    let base64ImageWarnings = 0;

    for (const oldProduct of oldProducts) {
      try {
        // Convert base64 mockups to URLs (mark for manual fix if base64)
        const designViews = (oldProduct.design?.views || []).map(view => {
          const mockupUrl = view.mockupImageUrl || '';
          if (mockupUrl.startsWith('data:')) {
            base64ImageWarnings++;
            console.log(`   ⚠️  WARNING: Product ${oldProduct._id} has base64 mockup - needs manual upload to S3`);
            return {
              key: view.key,
              mockupImageUrl: '', // Empty - needs to be set after S3 upload
              placeholders: view.placeholders || []
            };
          }
          return {
            key: view.key,
            mockupImageUrl: mockupUrl,
            placeholders: view.placeholders || []
          };
        });

        // Check gallery images for base64
        const galleryImages = (oldProduct.galleryImages || []).map(img => {
          const imgUrl = img.url || '';
          if (imgUrl.startsWith('data:')) {
            base64ImageWarnings++;
            console.log(`   ⚠️  WARNING: Product ${oldProduct._id} has base64 gallery image - needs manual upload to S3`);
            return {
              id: img.id,
              url: '', // Empty - needs to be set after S3 upload
              position: img.position,
              isPrimary: img.isPrimary || false,
              imageType: img.imageType || 'other',
              altText: img.altText || ''
            };
          }
          return {
            id: img.id,
            url: imgUrl,
            position: img.position,
            isPrimary: img.isPrimary || false,
            imageType: img.imageType || 'other',
            altText: img.altText || ''
          };
        });

        const catalogProduct = new CatalogProduct({
          name: oldProduct.catalogue?.name || 'Untitled Product',
          description: oldProduct.catalogue?.description || '',
          categoryId: oldProduct.catalogue?.categoryId || 'apparel',
          subcategoryIds: oldProduct.catalogue?.subcategoryIds || [],
          productTypeCode: oldProduct.catalogue?.productTypeCode || 'PRODUCT',
          tags: oldProduct.catalogue?.tags || [],
          attributes: oldProduct.catalogue?.attributes || new Map(),
          basePrice: oldProduct.catalogue?.basePrice || 0,
          design: {
            views: designViews,
            dpi: oldProduct.design?.dpi || 300,
            physicalDimensions: oldProduct.design?.physicalDimensions
          },
          shipping: oldProduct.shipping || {
            packageLengthCm: 10,
            packageWidthCm: 10,
            packageHeightCm: 10,
            packageWeightGrams: 100
          },
          galleryImages: galleryImages,
          details: oldProduct.details || {},
          createdBy: oldProduct.createdBy,
          isActive: oldProduct.isActive !== false,
          isPublished: oldProduct.isActive !== false, // Assume active = published
          createdAt: oldProduct.createdAt,
          updatedAt: oldProduct.updatedAt
        });

        const savedCatalogProduct = await catalogProduct.save();
        catalogProductCount++;
        console.log(`   ✓ Migrated: ${savedCatalogProduct.name} (${savedCatalogProduct._id})`);

        // Step 3: Migrate variants to CatalogProductVariants
        // First, try ProductVariant collection
        const oldVariants = await ProductVariant.find({ productId: oldProduct._id });
        
        // Fallback: if no variants in collection, use embedded variants
        let variantsToMigrate = [];
        if (oldVariants.length > 0) {
          variantsToMigrate = oldVariants;
        } else if (oldProduct.variants && oldProduct.variants.length > 0) {
          variantsToMigrate = oldProduct.variants;
        } else {
          // Create default variant from availableSizes and availableColors
          const sizes = oldProduct.availableSizes || ['M'];
          const colors = oldProduct.availableColors || ['Black'];
          for (const size of sizes) {
            for (const color of colors) {
              variantsToMigrate.push({
                size,
                color,
                sku: oldProduct.catalogue?.productTypeCode 
                  ? `${oldProduct.catalogue.productTypeCode}-${size}-${color}`
                  : `PRODUCT-${size}-${color}`,
                isActive: true
              });
            }
          }
        }

        for (const oldVariant of variantsToMigrate) {
          const catalogVariant = new CatalogProductVariant({
            catalogProductId: savedCatalogProduct._id,
            size: oldVariant.size,
            color: oldVariant.color,
            skuTemplate: oldVariant.sku || `${savedCatalogProduct.productTypeCode}-${oldVariant.size}-${oldVariant.color}`,
            isActive: oldVariant.isActive !== false
          });
          await catalogVariant.save();
          variantCount++;
        }

        if (variantsToMigrate.length > 0) {
          console.log(`      → Migrated ${variantsToMigrate.length} variant(s)`);
        }

      } catch (error) {
        console.error(`   ❌ Error migrating product ${oldProduct._id}:`, error.message);
      }
    }

    console.log(`\n   ✅ Migrated ${catalogProductCount} catalog products`);
    console.log(`   ✅ Migrated ${variantCount} catalog product variants`);
    console.log('\n🧹 Step 3: Removing legacy FAQ data from products...');
    // Purge any existing FAQ fields from old and new product collections
    const faqUnsetResult1 = await Product.updateMany(
      { faqs: { $exists: true } },
      { $unset: { faqs: 1 } }
    );
    const faqUnsetResult2 = await CatalogProduct.updateMany(
      { faqs: { $exists: true } },
      { $unset: { faqs: 1 } }
    );
    console.log(`   Removed faqs from ${faqUnsetResult1.modifiedCount || 0} Product docs and ${faqUnsetResult2.modifiedCount || 0} CatalogProduct docs`);
    if (base64ImageWarnings > 0) {
      console.log(`   ⚠️  ${base64ImageWarnings} base64 images need manual S3 upload`);  
    }

    // Step 4: Create default stores for existing merchants
    console.log('\n🏪 Step 4: Creating stores for merchants...');
    const merchants = await User.find({ role: 'merchant' });
    console.log(`   Found ${merchants.length} merchant(s)`);

    let storeCount = 0;
    let storeProductCount = 0;
    let storeVariantCount = 0;

    for (const merchant of merchants) {
      try {
        // Check if store already exists for this merchant
        let store = await Store.findOne({ merchant: merchant._id, type: 'native' });
        
        if (!store) {
          // Create a default native store for each merchant
          const slug = `${merchant.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${merchant._id.toString().slice(-6)}`;
          store = new Store({
            name: `${merchant.name}'s Store`,
            slug: slug,
            merchant: merchant._id,
            type: 'native',
            isActive: merchant.isActive !== false,
            createdAt: merchant.createdAt
          });
          await store.save();
          storeCount++;
          console.log(`   ✓ Created store: ${store.name} (${store._id})`);
        } else {
          console.log(`   → Store already exists: ${store.name}`);
        }

        // Step 5: Create StoreProducts for this merchant's products
        const merchantProducts = await CatalogProduct.find({ createdBy: merchant._id });
        console.log(`      Found ${merchantProducts.length} product(s) for merchant ${merchant.name}`);
        
        for (const catalogProduct of merchantProducts) {
          try {
            // Check if StoreProduct already exists
            let storeProduct = await StoreProduct.findOne({
              storeId: store._id,
              catalogProductId: catalogProduct._id
            });

            if (!storeProduct) {
              // Default 50% markup
              const sellingPrice = Math.round(catalogProduct.basePrice * 1.5 * 100) / 100;
              
              storeProduct = new StoreProduct({
                storeId: store._id,
                catalogProductId: catalogProduct._id,
                sellingPrice: sellingPrice,
                isActive: catalogProduct.isActive && catalogProduct.isPublished,
                createdAt: catalogProduct.createdAt
              });
              await storeProduct.save();
              storeProductCount++;

              // Step 6: Create StoreProductVariants
              const catalogVariants = await CatalogProductVariant.find({ 
                catalogProductId: catalogProduct._id 
              });
              
              for (const catalogVariant of catalogVariants) {
                const storeVariant = new StoreProductVariant({
                  storeProductId: storeProduct._id,
                  catalogProductVariantId: catalogVariant._id,
                  sku: catalogVariant.skuTemplate,
                  isActive: catalogVariant.isActive
                });
                await storeVariant.save();
                storeVariantCount++;
              }
            }
          } catch (error) {
            console.error(`      ❌ Error creating StoreProduct for ${catalogProduct._id}:`, error.message);
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing merchant ${merchant._id}:`, error.message);
      }
    }

    console.log(`\n   ✅ Created ${storeCount} store(s)`);
    console.log(`   ✅ Created ${storeProductCount} store product(s)`);
    console.log(`   ✅ Created ${storeVariantCount} store product variant(s)`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Catalog Products:     ${catalogProductCount}`);
    console.log(`Catalog Variants:    ${variantCount}`);
    console.log(`Stores:              ${storeCount}`);
    console.log(`Store Products:      ${storeProductCount}`);
    console.log(`Store Variants:      ${storeVariantCount}`);
    if (base64ImageWarnings > 0) {
      console.log(`\n⚠️  WARNING: ${base64ImageWarnings} base64 images need manual handling`);
      console.log('   See REFACTORING_PLAN.md for details on uploading to S3');
    }
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Review migrated data');
    console.log('2. Handle base64 images (upload to S3 and update URLs)');
    console.log('3. Test API endpoints with new schemas');
    console.log('4. Update frontend to use new endpoints');
    console.log('5. Once verified, archive old collections:');
    console.log('   - db.products.renameCollection("products_old")');
    console.log('   - db.productvariants.renameCollection("productvariants_old")');

  } catch (error) {
    console.error('\n❌ Migration error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
