// Script to create an admin account
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string - hardcoded for local development
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/";
const MONGODB_DB = process.env.MONGODB_DB || "Dizitsolution";

console.log("Using MongoDB URI:", MONGODB_URI);
console.log("Using MongoDB Database:", MONGODB_DB);

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@gmail.com',
  phone: '9112564731', // Using the default phone number from the environment variables
  password: 'Admin@123', // Default password, should be changed after first login
  role: 'admin',
  createdAt: new Date().toISOString()
};

// Regular user details
const regularUser = {
  name: 'Regular User',
  email: 'user@gmail.com',
  phone: '9112564731', // Using the default phone number from the environment variables
  password: 'User@123', // Default password, should be changed after first login
  role: 'user',
  createdAt: new Date().toISOString()
};

async function createUsers() {
  let client;

  try {
    // Connect to MongoDB with options matching the app
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000,
      retryWrites: true,
    });
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection('users');

    // Create admin user if it doesn't exist
    const existingAdmin = await usersCollection.findOne({ email: adminUser.email });

    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Hash the password
      const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);

      // Create the admin user with hashed password
      const adminResult = await usersCollection.insertOne({
        ...adminUser,
        password: hashedAdminPassword
      });

      console.log('Admin user created successfully');
      console.log('Admin email:', adminUser.email);
      console.log('Admin password:', adminUser.password);
    }

    // Create regular user if it doesn't exist
    const existingUser = await usersCollection.findOne({ email: regularUser.email });

    if (existingUser) {
      console.log('Regular user already exists');
    } else {
      // Hash the password
      const hashedUserPassword = await bcrypt.hash(regularUser.password, 10);

      // Create the regular user with hashed password
      const userResult = await usersCollection.insertOne({
        ...regularUser,
        password: hashedUserPassword
      });

      console.log('Regular user created successfully');
      console.log('User email:', regularUser.email);
      console.log('User password:', regularUser.password);
    }

    // Print summary
    console.log('\nAccount Summary:');
    console.log('----------------');
    console.log('Admin Account:');
    console.log('  Email:', adminUser.email);
    console.log('  Password:', adminUser.password);
    console.log('  Secret Key:', process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_SECRET_KEY || "dizit221002");
    console.log('\nRegular User Account:');
    console.log('  Email:', regularUser.email);
    console.log('  Password:', regularUser.password);

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the function
createUsers();
