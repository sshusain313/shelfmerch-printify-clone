/**
 * Migration Script for NEW Database
 * 
 * This script creates the new schema collections in your fresh database.
 * Since this is a new database, it will:
 * 1. Create the collections (they'll be empty initially)
 * 2. Set up indexes
 * 3. Verify the schema structure
 * 
 * Run: node scripts/migrate-new-db.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import new models (this will create the collections)
const CatalogProduct = require('../models/CatalogProduct');
const CatalogProductVariant = require('../models/CatalogProductVariant');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const StoreProductVariant = require('../models/StoreProductVariant');
const User = require('../models/User');

async function setupNewDatabase() {
  try {
    console.log('🚀 Setting up new database schema...\n');
    
    const mongoUrl = process.env.MONGO_URL;
    
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    // Connection string already includes database name
    console.log(`🔌 Connecting to MongoDB...`);
    const maskedUrl = mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`   Connection: ${maskedUrl}`);
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}\n`);
    
    // Create collections by creating and dropping a dummy document
    // This ensures indexes are created
    console.log('📦 Creating collections and indexes...\n');
    
    // CatalogProduct
    console.log('   Creating CatalogProduct collection...');
    try {
      await CatalogProduct.createIndexes();
      console.log('   ✅ CatalogProduct collection ready');
    } catch (err) {
      console.log(`   ⚠️  CatalogProduct: ${err.message}`);
    }
    
    // CatalogProductVariant
    console.log('   Creating CatalogProductVariant collection...');
    try {
      await CatalogProductVariant.createIndexes();
      console.log('   ✅ CatalogProductVariant collection ready');
    } catch (err) {
      console.log(`   ⚠️  CatalogProductVariant: ${err.message}`);
    }
    
    // Store
    console.log('   Creating Store collection...');
    try {
      await Store.createIndexes();
      console.log('   ✅ Store collection ready');
    } catch (err) {
      console.log(`   ⚠️  Store: ${err.message}`);
    }
    
    // StoreProduct
    console.log('   Creating StoreProduct collection...');
    try {
      await StoreProduct.createIndexes();
      console.log('   ✅ StoreProduct collection ready');
    } catch (err) {
      console.log(`   ⚠️  StoreProduct: ${err.message}`);
    }
    
    // StoreProductVariant
    console.log('   Creating StoreProductVariant collection...');
    try {
      await StoreProductVariant.createIndexes();
      console.log('   ✅ StoreProductVariant collection ready');
    } catch (err) {
      console.log(`   ⚠️  StoreProductVariant: ${err.message}`);
    }
    
    // User (update indexes)
    console.log('   Updating User collection indexes...');
    try {
      await User.createIndexes();
      console.log('   ✅ User collection ready');
    } catch (err) {
      console.log(`   ⚠️  User: ${err.message}`);
    }
    
    // Verify collections exist
    console.log('\n📊 Verifying collections...\n');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = [
      'catalogproducts',
      'catalogproductvariants',
      'stores',
      'storeproducts',
      'storeproductvariants',
      'users'
    ];
    
    console.log('Existing collections:');
    collectionNames.forEach(name => {
      const isRequired = requiredCollections.includes(name.toLowerCase());
      console.log(`   ${isRequired ? '✅' : '  '} ${name}`);
    });
    
    console.log('\n📋 Required collections:');
    requiredCollections.forEach(name => {
      const exists = collectionNames.some(c => c.toLowerCase() === name.toLowerCase());
      console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    });
    
    // Count documents
    console.log('\n📈 Collection counts:');
    const counts = {
      catalogproducts: await CatalogProduct.countDocuments(),
      catalogproductvariants: await CatalogProductVariant.countDocuments(),
      stores: await Store.countDocuments(),
      storeproducts: await StoreProduct.countDocuments(),
      storeproductvariants: await StoreProductVariant.countDocuments(),
      users: await User.countDocuments(),
    };
    
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`   ${name}: ${count}`);
    });
    
    console.log('\n✅ Database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Create a SUPERADMIN user (role: "superadmin")');
    console.log('2. Create catalog products via API or admin panel');
    console.log('3. Create stores for merchants');
    console.log('4. Merchants can then add catalog products to their stores');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run setup
if (require.main === module) {
  setupNewDatabase()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed');
      process.exit(1);
    });
}

module.exports = { setupNewDatabase };




