import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { logger } from "@/app/config/logger";

// Schema for POST request validation
const TechnicianSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  specializations: z.array(z.string().min(1, "Specialization cannot be empty")).optional(),
  serviceRadius: z.number().int().min(1, "Service radius must be at least 1").optional(),
  notificationPreferences: z
    .object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    })
    .optional(),
  profileVisibility: z.enum(["public", "private"]).optional(),
  isAvailable: z.boolean().optional(),
}).strict();

// GET handler to fetch technician settings
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

    // Validate technician data
    const settings = {
      name: technician.name || "",
      email: technician.email || "",
      phone: technician.phone || "",
      address: technician.address || "",
      specializations: Array.isArray(technician.specializations) ? technician.specializations : [],
      serviceRadius: Number.isInteger(technician.serviceRadius) ? technician.serviceRadius : 10,
      notificationPreferences: technician.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
      },
      profileVisibility: technician.profileVisibility === "private" ? "private" : "public",
      isAvailable: technician.isAvailable === true,
    };

    logger.debug("Technician settings retrieved", {
      userId,
      technicianId: technician._id.toString(),
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    logger.error("Error fetching technician settings", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoServerError" && typeof (error as any).code === "number" && (error as any).code === 11000
        ? "Database error: Duplicate key"
        : error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to fetch settings";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}

// POST handler to update technician settings
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

    // Parse and validate request body
    const body = await request.json();
    let updateData: z.infer<typeof TechnicianSettingsSchema>;
    try {
      updateData = TechnicianSettingsSchema.parse(body);
    } catch (validationError) {
      logger.warn("Invalid settings data", {
        error: validationError instanceof Error ? validationError.message : "Unknown validation error",
      });
      return NextResponse.json(
        {
          success: false,
          message: `Invalid settings data: ${validationError instanceof z.ZodError ? validationError.errors.map(e => e.message).join(", ") : "Unknown validation error"}`,
        },
        { status: 400 }
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

    // Check for email uniqueness if email is being updated
    if (updateData.email && updateData.email !== technician.email) {
      const existingTechnician = await db.collection("technicians").findOne({
        email: updateData.email,
        _id: { $ne: technician._id },
      });
      if (existingTechnician) {
        logger.warn("Email already in use", { userId, email: updateData.email });
        return NextResponse.json(
          { success: false, message: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Prepare update data with defaults
    const now = new Date();
    const sanitizedUpdate = {
      name: updateData.name,
      email: updateData.email,
      phone: updateData.phone,
      address: updateData.address || technician.address || "",
      specializations: updateData.specializations || technician.specializations || [],
      serviceRadius: updateData.serviceRadius || technician.serviceRadius || 10,
      notificationPreferences: updateData.notificationPreferences || technician.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
      },
      profileVisibility: updateData.profileVisibility || technician.profileVisibility || "public",
      isAvailable: updateData.isAvailable !== undefined ? updateData.isAvailable : technician.isAvailable !== undefined ? technician.isAvailable : true,
      updatedAt: now,
    };

    // Update technician
    const result = await db.collection("technicians").updateOne(
      { _id: technician._id },
      { $set: sanitizedUpdate }
    );

    if (result.matchedCount === 0) {
      logger.warn("Technician not found during update", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      logger.debug("No changes made to technician settings", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "No changes made to settings" },
        { status: 400 }
      );
    }

    // Fetch updated technician settings
    const updatedTechnician = await db.collection("technicians").findOne({ _id: technician._id });
    if (!updatedTechnician) {
      logger.error("Failed to retrieve updated technician settings", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Failed to retrieve updated settings" },
        { status: 500 }
      );
    }

    const updatedSettings = {
      name: updatedTechnician.name || "",
      email: updatedTechnician.email || "",
      phone: updatedTechnician.phone || "",
      address: updatedTechnician.address || "",
      specializations: Array.isArray(updatedTechnician.specializations) ? updatedTechnician.specializations : [],
      serviceRadius: Number.isInteger(updatedTechnician.serviceRadius) ? updatedTechnician.serviceRadius : 10,
      notificationPreferences: updatedTechnician.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
      },
      profileVisibility: updatedTechnician.profileVisibility === "private" ? "private" : "public",
      isAvailable: updatedTechnician.isAvailable === true,
    };

    logger.debug("Technician settings updated", {
      userId,
      technicianId: technician._id.toString(),
      updatedFields: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    logger.error("Error updating technician settings", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoServerError" && typeof (error as any).code === "number" && (error as any).code === 11000
        ? "Database error: Duplicate key"
        : error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to update settings";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}