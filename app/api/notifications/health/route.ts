import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Health check endpoint for notifications system
export async function GET(request: Request) {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: "unknown",
    checks: {
      database: false,
      notificationsCollection: false,
      sampleData: false,
    },
    errors: [] as string[],
    recommendations: [] as string[],
  };

  try {
    console.log("Starting notifications health check...");

    // Test database connection
    try {
      const { db } = await connectToDatabase({ timeoutMs: 5000 });
      healthCheck.checks.database = true;
      console.log("✅ Database connection successful");

      // Check if notifications collection exists
      try {
        const collections = await db.listCollections().toArray();
        const hasNotifications = collections.some(col => col.name === "notifications");
        healthCheck.checks.notificationsCollection = hasNotifications;
        
        if (hasNotifications) {
          console.log("✅ Notifications collection exists");
          
          // Check if there's sample data
          const sampleCount = await db.collection("notifications").countDocuments({});
          healthCheck.checks.sampleData = sampleCount > 0;
          
          if (sampleCount > 0) {
            console.log(`✅ Found ${sampleCount} notifications in database`);
          } else {
            console.log("⚠️ No notifications found in database");
            healthCheck.recommendations.push("Consider creating sample notifications for testing");
          }
        } else {
          console.log("⚠️ Notifications collection does not exist");
          healthCheck.recommendations.push("Notifications collection will be created automatically when first notification is added");
        }
      } catch (collectionError) {
        console.error("❌ Error checking collections:", collectionError);
        healthCheck.errors.push(`Collection check failed: ${collectionError instanceof Error ? collectionError.message : "Unknown error"}`);
      }
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      healthCheck.errors.push(`Database connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`);
      healthCheck.recommendations.push("Check database connection string and network connectivity");
    }

    // Determine overall status
    if (healthCheck.checks.database && healthCheck.checks.notificationsCollection) {
      healthCheck.status = "healthy";
    } else if (healthCheck.checks.database) {
      healthCheck.status = "degraded";
    } else {
      healthCheck.status = "unhealthy";
    }

    // Add general recommendations
    if (healthCheck.status !== "healthy") {
      healthCheck.recommendations.push("Use fallback notifications endpoint: /api/notifications/fallback");
    }

    console.log(`Health check completed with status: ${healthCheck.status}`);

    return NextResponse.json({
      success: true,
      healthCheck,
      endpoints: {
        main: "/api/user/notifications",
        fallback: "/api/notifications/fallback",
        test: "/api/user/notifications/test",
        debug: "/api/debug/notifications",
        health: "/api/notifications/health"
      }
    });
  } catch (error) {
    console.error("❌ Health check failed:", error);
    
    healthCheck.status = "error";
    healthCheck.errors.push(`Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    healthCheck.recommendations.push("Check server logs for detailed error information");

    return NextResponse.json({
      success: false,
      healthCheck,
      error: "Health check failed"
    });
  }
}

// POST endpoint to fix common issues
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`Attempting to fix notifications issue: ${action}`);

    switch (action) {
      case "create-sample-data":
        try {
          const { db } = await connectToDatabase();
          
          const sampleNotifications = [
            {
              userId: "health-check-sample",
              title: "Health Check Notification",
              message: "This is a sample notification created by the health check system.",
              type: "info",
              isRead: false,
              createdAt: new Date(),
            }
          ];

          const result = await db.collection("notifications").insertMany(sampleNotifications);
          
          return NextResponse.json({
            success: true,
            message: "Sample notifications created",
            insertedCount: result.insertedCount
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Failed to create sample notifications",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }

      case "test-connection":
        try {
          const { db } = await connectToDatabase({ timeoutMs: 3000 });
          const collections = await db.listCollections().toArray();
          
          return NextResponse.json({
            success: true,
            message: "Database connection test successful",
            collections: collections.map(c => c.name)
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            message: "Database connection test failed",
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }

      default:
        return NextResponse.json({
          success: false,
          message: "Unknown action",
          availableActions: ["create-sample-data", "test-connection"]
        });
    }
  } catch (error) {
    console.error("Error in notifications health fix:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to process health fix request",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
