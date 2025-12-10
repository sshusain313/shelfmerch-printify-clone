require('dotenv').config();
const mongoose = require('mongoose');

console.log('Starting connection test...');
console.log('MONGO_URL:', process.env.MONGO_URL ? 'SET' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!mongoUrl) {
  console.error('ERROR: MONGO_URL not set!');
  process.exit(1);
}

const connectionString = dbName
  ? `${mongoUrl}/${dbName}`
  : mongoUrl;

console.log('Connecting to:', connectionString.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

mongoose.connect(connectionString)
  .then(() => {
    console.log('✅ Connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    // List all collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('\n📚 Existing Collections:');
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
      }
      
      mongoose.disconnect().then(() => {
        console.log('\n✅ Disconnected');
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });




