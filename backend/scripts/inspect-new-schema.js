require('dotenv').config();
const mongoose = require('mongoose');

const CatalogProduct = require('../models/CatalogProduct');
const CatalogProductVariant = require('../models/CatalogProductVariant');
const Store = require('../models/Store');
const StoreProduct = require('../models/StoreProduct');
const StoreProductVariant = require('../models/StoreProductVariant');

async function run() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;
    if (!mongoUrl) throw new Error('MONGO_URL not set');

    const connStr = dbName ? `${mongoUrl}/${dbName}` : mongoUrl;
    await mongoose.connect(connStr);

    console.log('DB Name:', mongoose.connection.name);

    const [cp, cpv, s, sp, spv] = await Promise.all([
      CatalogProduct.countDocuments(),
      CatalogProductVariant.countDocuments(),
      Store.countDocuments(),
      StoreProduct.countDocuments(),
      StoreProductVariant.countDocuments(),
    ]);

    console.log('CatalogProducts:', cp);
    console.log('CatalogProductVariants:', cpv);
    console.log('Stores:', s);
    console.log('StoreProducts:', sp);
    console.log('StoreProductVariants:', spv);
  } catch (e) {
    console.error('Error inspecting DB:', e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
