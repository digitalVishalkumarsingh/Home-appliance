import { MongoClient, ObjectId, Db } from "mongodb";

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "Dizitsolution";

// Check if MongoDB URI is set
if (!MONGODB_URI) {
  console.warn("MONGODB_URI environment variable is not set");
}

// Global variables to cache the MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connect to MongoDB database
 * @returns Promise with MongoDB client and database
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  try {
    // Use cached connection if available
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    // Connect to MongoDB
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    console.log("Connecting to MongoDB database...");

    // Connect with more robust options for MongoDB Atlas
    // Use simplified options to avoid SSL/TLS issues
    const client = await MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      connectTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000, // Added server selection timeout
      retryWrites: true,
    });

    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log("Successfully connected to MongoDB database");
    return { client, db };
  } catch (error) {
    // Log detailed error information
    console.error("MongoDB Connection Error:");
    console.error(`- Error Message: ${error instanceof Error ? error.message : "Unknown error"}`);
    console.error(`- MongoDB URI: ${MONGODB_URI ? MONGODB_URI.substring(0, 20) + "..." : "Not set"}`);
    console.error(`- MongoDB DB: ${MONGODB_DB}`);

    // Create a simple mock database for development
    console.warn("Using mock database due to connection error");
    const mockDb = createMockDb();
    return {
      client: null as unknown as MongoClient,
      db: mockDb as unknown as Db
    };
  }
}

/**
 * Close MongoDB connection
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

/**
 * Create a mock database with sample data for development
 */
function createMockDb() {
  // Sample data for different collections
  const mockData: Record<string, any[]> = {
    users: [
      {
        _id: new ObjectId(),
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        password: "hashedpassword",
        role: "user",
        createdAt: new Date().toISOString(),
      },
      {
        _id: new ObjectId(),
        name: "Admin User",
        email: "admin@example.com",
        phone: "9876543211",
        password: "hashedpassword",
        role: "admin",
        createdAt: new Date().toISOString(),
      }
    ],
    bookings: [
      {
        _id: new ObjectId(),
        bookingId: "BK1001",
        userId: "user123",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "9876543210",
        serviceId: "service123",
        serviceName: "AC Repair",
        status: "completed",
        amount: 1499,
        paymentStatus: "paid",
        scheduledDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
    ],
    services: [
      {
        _id: new ObjectId(),
        title: "AC Repair",
        description: "Professional AC repair service",
        price: 1499,
        discountedPrice: 1299,
        category: "AC Services",
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ]
  };

  // Return mock database implementation
  return {
    collection: (collectionName: string) => {
      // Get data for this collection (or empty array if not defined)
      const collectionData = mockData[collectionName] || [];

      return {
        findOne: async (query = {}) => {
          // Simple implementation to find one document
          const item = collectionData.find(item => {
            // Match all query criteria
            return Object.entries(query || {}).every(([key, value]) => {
              if (key === '_id' && typeof value === 'string') {
                return item._id.toString() === value;
              }
              return item[key] === value;
            });
          });
          return item || null;
        },

        find: (query = {}) => {
          // Filter items based on query
          let filteredItems = collectionData.filter(item => {
            return Object.entries(query || {}).every(([key, value]) => {
              if (key === '_id' && typeof value === 'string') {
                return item._id.toString() === value;
              }
              return item[key] === value;
            });
          });

          // Return cursor-like object
          return {
            sort: () => ({
              limit: () => ({
                skip: () => ({
                  project: () => ({
                    toArray: async () => filteredItems
                  })
                })
              })
            }),
            toArray: async () => filteredItems
          };
        },

        countDocuments: async (query = {}) => {
          // Count documents matching query
          return collectionData.filter(item => {
            return Object.entries(query || {}).every(([key, value]) => item[key] === value);
          }).length;
        },

        insertOne: async (doc: any) => {
          const id = new ObjectId();
          const newDoc = { ...doc, _id: id };
          collectionData.push(newDoc);
          return { insertedId: id };
        },

        updateOne: async (query: any, update: { $set?: any }) => {
          let modifiedCount = 0;

          // Find index of matching document
          const index = collectionData.findIndex(item => {
            return Object.entries(query || {}).every(([key, value]) => item[key] === value);
          });

          // Update document if found
          if (index !== -1 && update.$set) {
            collectionData[index] = { ...collectionData[index], ...update.$set };
            modifiedCount = 1;
          }

          return { modifiedCount };
        },

        deleteOne: async (query: any) => {
          const initialLength = collectionData.length;

          // Find index of matching document
          const index = collectionData.findIndex(item => {
            return Object.entries(query || {}).every(([key, value]) => item[key] === value);
          });

          // Remove document if found
          if (index !== -1) {
            collectionData.splice(index, 1);
          }

          return { deletedCount: initialLength - collectionData.length };
        }
      };
    }
  };
}

export { ObjectId };
