const { MongoClient } = require('mongodb');

async function checkUser() {
  // MongoDB connection string from .env.local
  const uri = 'mongodb+srv://singhvishalkumar412:c4VHZHOAMDGVv0qF@homeapp.gg3w9wk.mongodb.net/Dizitsolution?retryWrites=true&w=majority';
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Get database and collection
    const db = client.db('Dizitsolution');
    const usersCollection = db.collection('users');

    // Check if user exists with exact email
    const exactUser = await usersCollection.findOne({ email: 'vishalsingh21@gmail.com' });
    console.log('User with exact email:', exactUser ? 'Found' : 'Not found');

    // Check if user exists with case-insensitive email
    const caseInsensitiveUser = await usersCollection.findOne({ 
      email: { $regex: new RegExp('^vishalsingh21@gmail\\.com$', 'i') } 
    });
    console.log('User with case-insensitive email:', caseInsensitiveUser ? 'Found' : 'Not found');

    // List all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log('All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

checkUser();
