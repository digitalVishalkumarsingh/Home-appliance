import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { logger } from "@/app/config/logger";
import { ObjectId } from "mongodb";

// GET handler to fetch technician availability status
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
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    logger.debug("Technician availability retrieved", {
      userId,
      technicianId: technician._id.toString(),
      isAvailable: technician.isAvailable === true,
    });

    return NextResponse.json({
      success: true,
      isAvailable: technician.isAvailable === true,
    });
  } catch (error) {
    logger.error("Error getting technician availability", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to get availability status";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}

// POST handler to toggle technician availability
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
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Check technician status
    if (technician.status !== "active") {
      logger.warn("Technician is not active", { userId, technicianId: technician._id.toString(), status: technician.status });
      return NextResponse.json(
        { success: false, message: "Only active technicians can toggle availability" },
        { status: 403 }
      );
    }

    // Toggle availability status
    const currentAvailability = technician.isAvailable === true;
    const newAvailability = !currentAvailability;
    const now = new Date();

    // Update technician availability
    const result = await db.collection("technicians").updateOne(
      { _id: technician._id },
      { $set: { isAvailable: newAvailability, updatedAt: now } }
    );

    if (result.matchedCount === 0) {
      logger.warn("Technician not found during update", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      logger.debug("No changes made to technician availability", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "No changes made to availability status" },
        { status: 400 }
      );
    }

    logger.debug("Technician availability toggled", {
      userId,
      technicianId: technician._id.toString(),
      isAvailable: newAvailability,
    });

    return NextResponse.json({
      success: true,
      message: `You are now ${newAvailability ? "available" : "unavailable"} for new job offers`,
      isAvailable: newAvailability,
    });
  } catch (error) {
    logger.error("Error toggling technician availability", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to toggle availability status";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}