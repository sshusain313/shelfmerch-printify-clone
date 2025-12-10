/**
 * Script to create a SUPERADMIN user
 * 
 * This script creates a superadmin user in the database.
 * Run: node scripts/create-superadmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createSuperadmin() {
  try {
    console.log('🚀 Creating SUPERADMIN user...\n');
    
    const mongoUrl = process.env.MONGO_URL;
    
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    console.log(`🔌 Connecting to MongoDB...`);
    const maskedUrl = mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`   Connection: ${maskedUrl}`);
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log(`   Database: ${mongoose.connection.name}\n`);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'shabahatsyed101@gmail.com' });
    
    if (existingUser) {
      console.log('⚠️  User already exists with this email!');
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Current role: ${existingUser.role}`);
      console.log(`   Name: ${existingUser.name}`);
      
      // Ask if we should update to superadmin
      if (existingUser.role !== 'superadmin') {
        console.log('\n📝 Updating user role to superadmin...');
        existingUser.role = 'superadmin';
        existingUser.name = 'admin';
        await existingUser.save();
        console.log('✅ User updated to superadmin successfully!');
      } else {
        console.log('\n✅ User is already a superadmin.');
      }
      
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
      return;
    }
    
    // Create new superadmin user
    console.log('📝 Creating new superadmin user...');
    console.log('   Name: admin');
    console.log('   Email: shabahatsyed101@gmail.com');
    console.log('   Role: superadmin\n');
    
    const superadmin = await User.create({
      name: 'admin',
      email: 'shabahatsyed101@gmail.com',
      password: 'Admin123',
      role: 'superadmin',
      isEmailVerified: true, // Set as verified for superadmin
      isActive: true
    });
    
    console.log('✅ SUPERADMIN user created successfully!');
    console.log(`   User ID: ${superadmin._id}`);
    console.log(`   Name: ${superadmin.name}`);
    console.log(`   Email: ${superadmin.email}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log(`   Created: ${superadmin.createdAt}`);
    
    console.log('\n📋 Login credentials:');
    console.log('   Email: shabahatsyed101@gmail.com');
    console.log('   Password: Admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 11000) {
      console.error('   Duplicate email - user already exists');
    } else if (error.name === 'ValidationError') {
      console.error('   Validation error:');
      Object.values(error.errors).forEach(err => {
        console.error(`     - ${err.path}: ${err.message}`);
      });
    } else {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run script
if (require.main === module) {
  createSuperadmin()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed');
      process.exit(1);
    });
}

module.exports = { createSuperadmin };




