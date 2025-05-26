import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// GET handler to fetch pending job notifications for technicians
export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    let token: string;
    try {
      token = getTokenFromRequest(request);
    } catch (error) {
      logger.warn("Failed to extract token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error instanceof AuthError) {
        logger.warn("Token verification failed", { error: error.message });
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }
      logger.error("Unexpected error during token verification", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Authentication failed" },
        { status: 401 }
      );
    }

    const { userId } = decoded;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token: missing user ID" },
        { status: 401 }
      );
    }

    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase({ timeoutMs: 10000 });
      db = connection.db;
    } catch (dbError) {
      logger.error("Database connection failed", { error: dbError });
      
      // Return demo job notifications as fallback
      return NextResponse.json({
        success: true,
        jobNotifications: getDemoJobNotifications(),
        total: 2,
        fallback: true,
        message: "Using demo data - database not available"
      });
    }

    // Find technician by userId
    let technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found, creating basic profile", { userId });
      
      // Create a basic technician profile if it doesn't exist
      try {
        const newTechnician = {
          userId,
          name: decoded.name || "Technician",
          email: decoded.email || "",
          phone: "",
          isAvailable: true,
          rating: 0,
          completedJobs: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await db.collection("technicians").insertOne(newTechnician);
        technician = { ...newTechnician, _id: result.insertedId };
        
        logger.info("Created new technician profile for job notifications", { userId, technicianId: result.insertedId });
      } catch (createError) {
        logger.error("Failed to create technician profile", { userId, error: createError });
        
        // Return demo data as fallback
        return NextResponse.json({
          success: true,
          jobNotifications: getDemoJobNotifications(),
          total: 2,
          fallback: true,
          message: "Using demo data - profile creation failed"
        });
      }
    }

    // Check if technician is available
    if (!technician.isAvailable) {
      return NextResponse.json({
        success: true,
        jobNotifications: [],
        total: 0,
        message: "Technician is currently unavailable"
      });
    }

    // Get pending job notifications for available technicians
    try {
      const jobNotifications = await db
        .collection("job_notifications")
        .find({
          status: "pending",
          $or: [
            { notifiedTechnicians: technician._id },
            { notifiedTechnicians: { $exists: false } }, // Include notifications without specific technician targeting
          ]
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      logger.debug("Job notifications retrieved", {
        userId,
        technicianId: technician._id.toString(),
        notificationCount: jobNotifications.length,
        isAvailable: technician.isAvailable
      });

      return NextResponse.json({
        success: true,
        jobNotifications,
        total: jobNotifications.length,
        technicianId: technician._id.toString(),
        isAvailable: technician.isAvailable,
        message: `Found ${jobNotifications.length} pending job notifications`
      });

    } catch (findError) {
      logger.error("Error finding job notifications", { error: findError });
      
      // Return demo data as fallback
      return NextResponse.json({
        success: true,
        jobNotifications: getDemoJobNotifications(),
        total: 2,
        fallback: true,
        message: "Using demo data - database query failed"
      });
    }

  } catch (error) {
    logger.error("Unexpected error in job notifications endpoint", {
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Demo job notifications for fallback
function getDemoJobNotifications() {
  return [
    {
      _id: "demo_job_1",
      bookingId: "BOOK_DEMO_001",
      serviceName: "Washing Machine Repair",
      customerName: "Demo Customer 1",
      address: "123 Demo Street, Demo City",
      amount: 500,
      urgency: "normal",
      status: "pending",
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      description: "Washing machine not spinning properly",
      estimatedDuration: "1-2 hours"
    },
    {
      _id: "demo_job_2",
      bookingId: "BOOK_DEMO_002",
      serviceName: "Refrigerator Repair",
      customerName: "Demo Customer 2",
      address: "456 Demo Avenue, Demo City",
      amount: 750,
      urgency: "high",
      status: "pending",
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      description: "Refrigerator not cooling properly",
      estimatedDuration: "2-3 hours"
    }
  ];
}
