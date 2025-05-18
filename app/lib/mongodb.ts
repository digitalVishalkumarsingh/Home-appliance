import { MongoClient, ObjectId, Db, Collection } from "mongodb";

// Environment variable validation
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "Dizitsolution";

// Only throw an error in development mode
if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error("MONGODB_URI environment variable is not set");
  } else {
    console.error("MONGODB_URI environment variable is not set");
  }
}

// Constants
const COLLECTION_USERS = "users";
const COLLECTION_BOOKINGS = "bookings";

// Interfaces for MockDb
interface MockDocument {
  _id: ObjectId;
  [key: string]: any;
}

interface MockCollection {
  findOne(query: Partial<MockDocument>): Promise<MockDocument | null>;
  insertOne(doc: MockDocument): Promise<{ insertedId: ObjectId }>;
  countDocuments(query: Partial<MockDocument>): Promise<number>;
  updateOne(query: Partial<MockDocument>, update: { $set?: Partial<MockDocument> }): Promise<{ modifiedCount: number }>;
  find(query: Partial<MockDocument>): {
    sort(sortQuery: { [key: string]: 1 | -1 }): any;
    limit(n: number): any;
    toArray(): Promise<MockDocument[]>;
  };
}

// Mock database for testing
class MockDb {
  private collections: Record<string, MockDocument[]> = {
    [COLLECTION_USERS]: [],
    [COLLECTION_BOOKINGS]: [],
  };

  collection(name: string): MockCollection {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }

    return {
      findOne: async (query: Partial<MockDocument>) => {
        const items = this.collections[name];
        return (
          items.find((item) =>
            Object.entries(query).every(([key, value]) =>
              key === "_id" ? item._id.toString() === value.toString() : item[key] === value
            )
          ) || null
        );
      },

      insertOne: async (doc: MockDocument) => {
        const id = new ObjectId();
        const newDoc = { ...doc, _id: id };
        this.collections[name].push(newDoc);
        return { insertedId: id };
      },

      countDocuments: async (query: Partial<MockDocument>) => {
        const items = this.collections[name];
        return items.filter((item) =>
          Object.entries(query).every(([key, value]) => item[key] === value)
        ).length;
      },

      updateOne: async (query: Partial<MockDocument>, update: { $set?: Partial<MockDocument> }) => {
        const items = this.collections[name];
        let modifiedCount = 0;

        const index = items.findIndex((item) =>
          Object.entries(query).every(([key, value]) =>
            key === "_id" ? item._id.toString() === value.toString() : item[key] === value
          )
        );

        if (index !== -1 && update.$set) {
          items[index] = { ...items[index], ...update.$set };
          modifiedCount = 1;
        }

        return { modifiedCount };
      },

      find: (query: Partial<MockDocument>) => {
        const items = this.collections[name];
        let filteredItems = items.filter((item) =>
          Object.entries(query).every(([key, value]) => item[key] === value)
        );

        const cursor = {
          sort: (sortQuery: { [key: string]: 1 | -1 }) => {
            const [key, order] = Object.entries(sortQuery)[0];
            filteredItems.sort((a, b) => {
              const aValue = key === "_id" ? a._id.toString() : a[key];
              const bValue = key === "_id" ? b._id.toString() : b[key];
              return order === 1 ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            });
            return cursor;
          },
          limit: (n: number) => {
            filteredItems = filteredItems.slice(0, n);
            return cursor;
          },
          toArray: async () => filteredItems,
        };

        return cursor;
      },
    };
  }
}

// Global variables to cache the MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  try {
    // Use cached connection if available
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    // If MONGODB_URI is not set, use mock database in production
    if (!MONGODB_URI) {
      console.warn("Using mock database because MONGODB_URI is not set");
      const mockDb = new MockDb();
      return {
        client: null as unknown as MongoClient,
        db: mockDb as unknown as Db
      };
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI as string, {
      maxPoolSize: 10, // Limit connection pool size
      connectTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      retryWrites: true, // Enable retryable writes
      writeConcern: { w: "majority" }, // Ensure data durability
    });

    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error(`Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`);

    // In production, use mock database as fallback
    if (process.env.NODE_ENV === 'production') {
      console.warn("Using mock database as fallback due to connection error");
      const mockDb = new MockDb();
      return {
        client: null as unknown as MongoClient,
        db: mockDb as unknown as Db
      };
    }

    throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Graceful connection cleanup
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

// Export MockDb for testing
export { MockDb, ObjectId };

