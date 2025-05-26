import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// GET handler to fetch technician notifications
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
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

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

        logger.info("Created new technician profile", { userId, technicianId: result.insertedId });
      } catch (createError) {
        logger.error("Failed to create technician profile", { userId, error: createError });

        // Return empty notifications instead of 404
        return NextResponse.json({
          success: true,
          notifications: [],
          pagination: { total: 0, page: 1, limit: 50, pages: 0 },
          unreadCount: 0,
          fallback: true,
          message: "No technician profile found, showing empty notifications"
        });
      }
    }

    // Get notifications
    const notifications = await db
      .collection("notifications")
      .find({
        recipientId: technician._id.toString(),
        recipientType: "technician",
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    logger.debug("Technician notifications retrieved", {
      userId,
      technicianId: technician._id.toString(),
      notificationCount: notifications.length,
    });

    // Return notifications
    return NextResponse.json({
      success: true,
      notifications: notifications.map((notification) => ({
        ...notification,
        _id: notification._id.toString(),
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt?.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Error fetching technician notifications", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST handler to mark notification as read
export async function POST(request: NextRequest) {
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
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const { notificationId } = await request.json();
    if (!notificationId || typeof notificationId !== "string") {
      logger.warn("Invalid or missing notificationId", { notificationId });
      return NextResponse.json(
        { success: false, message: "Notification ID is required and must be a string" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Find and update notification
    const result = await db.collection("notifications").updateOne(
      {
        _id: new ObjectId(notificationId),
        recipientId: technician._id.toString(),
        recipientType: "technician",
      },
      { $set: { read: true, updatedAt: now } }
    );

    if (result.matchedCount === 0) {
      logger.warn("Notification not found", { notificationId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      logger.warn("Notification already marked as read", { notificationId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Notification already marked as read" },
        { status: 400 }
      );
    }

    logger.debug("Notification marked as read", {
      userId,
      technicianId: technician._id.toString(),
      notificationId,
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Error marking notification as read", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// DELETE handler to delete a notification
export async function DELETE(request: NextRequest) {
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
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get notification ID from query parameters
    const url = new URL(request.url);
    const notificationId = url.searchParams.get("id");
    if (!notificationId || typeof notificationId !== "string") {
      logger.warn("Invalid or missing notificationId", { notificationId });
      return NextResponse.json(
        { success: false, message: "Notification ID is required and must be a string" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Delete notification
    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(notificationId),
      recipientId: technician._id.toString(),
      recipientType: "technician",
    });

    if (result.deletedCount === 0) {
      logger.warn("Notification not found or already deleted", {
        notificationId,
        technicianId: technician._id.toString(),
      });
      return NextResponse.json(
        { success: false, message: "Notification not found or already deleted" },
        { status: 404 }
      );
    }

    logger.debug("Notification deleted", {
      userId,
      technicianId: technician._id.toString(),
      notificationId,
    });

    // Return success
    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting notification", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}