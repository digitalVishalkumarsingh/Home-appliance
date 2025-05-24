import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Get technician profile
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

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId (assume userId is stored as string)
    const technician = await db.collection("technicians").findOne({ userId });

    if (!technician) {
      logger.warn("Technician profile not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    logger.debug("Technician profile retrieved", { userId, technicianId: technician._id.toString() });
    return NextResponse.json({
      success: true,
      technician,
    });
  } catch (error) {
    logger.error("Error fetching technician profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician profile" },
      { status: 500 }
    );
  }
}

// Update technician profile
export async function PUT(request: NextRequest) {
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

    const { userId, role, email } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const technicianData = await request.json();
    const { name, phone, ...otherFields } = technicianData;

    // Validate input data
    if (name && typeof name !== "string") {
      logger.warn("Invalid name format", { name });
      return NextResponse.json(
        { success: false, message: "Name must be a string" },
        { status: 400 }
      );
    }
    if (phone && typeof phone !== "string") {
      logger.warn("Invalid phone format", { phone });
      return NextResponse.json(
        { success: false, message: "Phone must be a string" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Find technician by userId
    const existingTechnician = await db.collection("technicians").findOne({ userId });

    if (!existingTechnician) {
      logger.warn("Technician profile not found for update", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Update technician profile
    const technicianUpdateResult = await db.collection("technicians").updateOne(
      { _id: existingTechnician._id },
      {
        $set: {
          ...otherFields,
          ...(name && { name }),
          ...(phone && { phone }),
          updatedAt: now,
        },
      }
    );

    if (technicianUpdateResult.modifiedCount === 0) {
      logger.warn("No changes made to technician profile", { userId, technicianId: existingTechnician._id.toString() });
      return NextResponse.json(
        { success: false, message: "No changes made to technician profile" },
        { status: 400 }
      );
    }

    // Update user collection if name or phone is provided
    if (name || phone) {
      const userUpdateResult = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            ...(name && { name }),
            ...(phone && { phone }),
            updatedAt: now,
          },
        }
      );
      if (userUpdateResult.modifiedCount === 0) {
        logger.warn("No changes made to user profile", { userId });
      }
    }

    logger.debug("Technician profile updated", { userId, technicianId: existingTechnician._id.toString() });
    return NextResponse.json({
      success: true,
      message: "Technician profile updated successfully",
    });
  } catch (error) {
    logger.error("Error updating technician profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to update technician profile" },
      { status: 500 }
    );
  }
}