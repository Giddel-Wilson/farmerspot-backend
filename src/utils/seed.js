const mongoose = require('mongoose');
const { User } = require('../models/user');
const { hashPassword } = require('./hashUtil');
require('dotenv').config();

/**
 * Seed the database with test accounts for all user roles
 */
async function seedDatabase() {
  try {
    // Connect to MongoDB
    const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/farmerspot';
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB...');

    // Test accounts data
    const testAccounts = [
      {
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: 'password',
        userType: 'admin',
        phone: '1234567890',
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749] // San Francisco
        }
      },
      {
        name: 'Customer User',
        email: 'customer@gmail.com',
        password: 'password',
        userType: 'customer',
        phone: '1234567891',
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522] // Los Angeles
        }
      },
      {
        name: 'Farmer User',
        email: 'farmer@gmail.com',
        password: 'password',
        userType: 'farmer',
        phone: '1234567892',
        location: {
          type: 'Point',
          coordinates: [-121.8863, 37.3382] // San Jose
        }
      }
    ];

    // Create or update test accounts
    for (const accountData of testAccounts) {
      const existingUser = await User.findOne({ email: accountData.email });
      
      if (existingUser) {
        console.log(`✓ User ${accountData.email} (${accountData.userType}) already exists`);
      } else {
        // Hash password before saving
        accountData.password = await hashPassword(accountData.password);
        
        const user = new User(accountData);
        await user.save();
        
        console.log(`✓ Created ${accountData.userType} account: ${accountData.email}`);
      }
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Test Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMIN ACCOUNT:');
    console.log('  Email: admin@gmail.com');
    console.log('  Password: password');
    console.log('  Role: admin\n');
    console.log('CUSTOMER ACCOUNT:');
    console.log('  Email: customer@gmail.com');
    console.log('  Password: password');
    console.log('  Role: customer\n');
    console.log('FARMER ACCOUNT:');
    console.log('  Email: farmer@gmail.com');
    console.log('  Password: password');
    console.log('  Role: farmer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
