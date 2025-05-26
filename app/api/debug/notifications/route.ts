import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Debug endpoint to check notifications without authentication
export async function GET(request: Request) {
  try {
    console.log("Debug: Checking notifications system...");
    
    // Test database connection
    let db;
    try {
      const connection = await connectToDatabase({ timeoutMs: 5000 });
      db = connection.db;
      console.log("Debug: Database connection successful");
    } catch (dbError) {
      console.error("Debug: Database connection failed:", dbError);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : "Unknown error"
      });
    }

    // Check if notifications collection exists
    try {
      const collections = await db.listCollections().toArray();
      const hasNotifications = collections.some(col => col.name === "notifications");
      console.log("Debug: Collections found:", collections.map(c => c.name));
      console.log("Debug: Has notifications collection:", hasNotifications);

      // Count total notifications
      const totalNotifications = await db.collection("notifications").countDocuments({});
      console.log("Debug: Total notifications in database:", totalNotifications);

      // Get sample notifications
      const sampleNotifications = await db
        .collection("notifications")
        .find({})
        .limit(3)
        .toArray();

      console.log("Debug: Sample notifications:", sampleNotifications.length);

      return NextResponse.json({
        success: true,
        debug: {
          databaseConnected: true,
          hasNotificationsCollection: hasNotifications,
          totalNotifications,
          sampleNotifications: sampleNotifications.map(n => ({
            _id: n._id.toString(),
            userId: n.userId,
            title: n.title,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt
          })),
          allCollections: collections.map(c => c.name)
        }
      });
    } catch (collectionError) {
      console.error("Debug: Error checking collections:", collectionError);
      return NextResponse.json({
        success: false,
        error: "Error checking collections",
        details: collectionError instanceof Error ? collectionError.message : "Unknown error"
      });
    }
  } catch (error) {
    console.error("Debug: Unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Create test notifications
export async function POST(request: Request) {
  try {
    console.log("Debug: Creating test notifications...");
    
    const body = await request.json();
    const userId = body.userId || "test-user-123";

    const { db } = await connectToDatabase();

    // Create test notifications
    const testNotifications = [
      {
        userId,
        title: "Welcome to Dizit!",
        message: "Thank you for joining our platform.",
        type: "info",
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId,
        title: "Test Notification",
        message: "This is a test notification created by the debug endpoint.",
        type: "general",
        isRead: false,
        createdAt: new Date(),
      }
    ];

    const result = await db.collection("notifications").insertMany(testNotifications);

    return NextResponse.json({
      success: true,
      message: "Test notifications created",
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds).map(id => id.toString()),
      userId
    });
  } catch (error) {
    console.error("Debug: Error creating test notifications:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create test notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
