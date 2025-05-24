import { MongoClient, ObjectId, Db } from "mongodb";
import { logger } from "../config/logger";
import pRetry from "p-retry";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI || !MONGODB_DB) {
  logger.error("Missing MongoDB configuration", {
    hasMongoUri: !!MONGODB_URI,
    hasMongoDb: !!MONGODB_DB,
  });
  throw new Error("MONGODB_URI and MONGODB_DB must be set");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(p0: { timeoutMs: number; }): Promise<{ client: MongoClient; db: Db }> {
  try {
    // Check for cached connection first
    if (cachedClient && cachedDb) {
      logger.debug("Reusing cached MongoDB connection");
      return { client: cachedClient, db: cachedDb };
    }

    logger.info("Connecting to MongoDB database");

    const client = await pRetry(
      () =>
        MongoClient.connect(MONGODB_URI as string, {
          maxPoolSize: 5, // Small pool for serverless
          connectTimeoutMS: 5000,
          socketTimeoutMS: 10000,
          serverSelectionTimeoutMS: 5000,
          retryWrites: true,
          retryReads: true,
        }),
      { retries: 2, minTimeout: 500 }
    );

    client.on("connectionCreated", () => logger.debug("MongoDB connection created"));
    client.on("connectionClosed", () => logger.debug("MongoDB connection closed"));

    const db = client.db(MONGODB_DB);
    cachedClient = client;
    cachedDb = db;

    logger.info("Successfully connected to MongoDB database");
    return { client, db };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("MongoDB connection failed", { error: errorMessage });
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        logger.info("MongoDB connection refused. Ensure MongoDB is running or check MONGODB_URI.");
      } else if (error.message.includes("Authentication failed")) {
        logger.info("MongoDB authentication failed. Verify credentials in .env.local.");
      } else if (error.message.includes("ENOTFOUND")) {
        logger.info("MongoDB host not found. Check MONGODB_URI in .env.local.");
      } else if (error.name === "MongoServerSelectionError") {
        logger.info("MongoDB server selection timed out. Check network or MONGODB_URI.");
      }
    }
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    try {
      await cachedClient.close();
      logger.info("MongoDB connection closed");
    } catch (error) {
      logger.error("Failed to close MongoDB connection", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      cachedClient = null;
      cachedDb = null;
    }
  }
}

export { ObjectId };