import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "../../../lib/mongodb";
import { z } from "zod";
import { logger } from "@/app/config/logger";

// Define technician schema for validation
const TechnicianUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().min(1, "Phone number is required").optional(),
  specializations: z.array(z.string().min(1, "Specialization cannot be empty")).min(1, "At least one specialization is required").optional(),
  skills: z.array(z.string().min(1, "Skill cannot be empty")).optional(),
  address: z.string().min(1, "Address is required").optional(),
  location: z
    .object({
      address: z.string().min(1, "Location address is required").optional(),
      coordinates: z.tuple([z.number(), z.number()], { message: "Coordinates must be a [latitude, longitude] pair" }).optional(),
      serviceRadius: z.number().min(0, "Service radius must be non-negative").optional(),
    })
    .optional(),
  availability: z
    .object({
      monday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      tuesday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      wednesday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      thursday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      friday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      saturday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
      sunday: z.object({ available: z.boolean(), hours: z.string().optional() }).optional(),
    })
    .optional(),
  profileImage: z.string().url("Invalid URL for profile image").optional(),
  governmentId: z.string().url("Invalid URL for government ID").optional(),
  certifications: z.array(z.string().url("Invalid URL for certification")).optional(),
}).strict();

// Allowed fields for update
const allowedUpdateFields = [
  "name",
  "email",
  "phone",
  "specializations",
  "skills",
  "address",
  "location",
  "availability",
  "profileImage",
  "governmentId",
  "certifications",
];

// GET handler to fetch technician profile
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
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    logger.debug("Technician profile retrieved", {
      userId,
      technicianId: technician._id.toString(),
    });

    return NextResponse.json({
      success: true,
      technician: {
        ...technician,
        _id: technician._id.toString(),
        createdAt: technician.createdAt?.toISOString(),
        updatedAt: technician.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching technician profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoServerError" && (error as any).code === 11000
        ? "Database error: Duplicate key"
        : error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to fetch technician profile";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}

// PATCH handler to update technician profile
export async function PATCH(request: NextRequest) {
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

    // Parse and validate update data
    const updateData = await request.json();
    let sanitizedUpdate: Record<string, any>;
    try {
      sanitizedUpdate = TechnicianUpdateSchema.parse(updateData);
    } catch (validationError) {
      logger.warn("Invalid update data", {
        error: validationError instanceof Error ? validationError.message : "Unknown validation error",
      });
      return NextResponse.json(
        { success: false, message: `Invalid update data: ${validationError instanceof z.ZodError ? validationError.errors.map(e => e.message).join(", ") : "Unknown validation error"}` },
        { status: 400 }
      );
    }

    // Filter allowed fields
    const filteredUpdate: Partial<z.infer<typeof TechnicianUpdateSchema>> = Object.keys(sanitizedUpdate)
      .filter((key) => allowedUpdateFields.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: sanitizedUpdate[key] }), {});
    if (Object.keys(filteredUpdate).length === 0) {
      logger.warn("No valid fields to update", { userId });
      return NextResponse.json(
        { success: false, message: "No valid fields to update" },
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
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Check for email uniqueness if email is being updated
    if (filteredUpdate.email && filteredUpdate.email !== technician.email) {
      const existingTechnician = await db.collection("technicians").findOne({
        email: filteredUpdate.email,
        _id: { $ne: technician._id },
      });
      if (existingTechnician) {
        logger.warn("Email already in use", { userId, email: filteredUpdate.email });
        return NextResponse.json(
          { success: false, message: "Email is already in use" },
          { status: 409 }
        );
      }
    }

    // Update technician profile
    const now = new Date();
    const result = await db.collection("technicians").updateOne(
      { _id: technician._id },
      {
        $set: {
          ...filteredUpdate,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      logger.warn("Technician not found during update", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      logger.debug("No changes made to technician profile", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "No changes made to technician profile" },
        { status: 400 }
      );
    }

    // Fetch updated technician
    const updatedTechnician = await db.collection("technicians").findOne({ _id: technician._id });
    if (!updatedTechnician) {
      logger.error("Failed to retrieve updated technician profile", { userId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Failed to retrieve updated profile" },
        { status: 500 }
      );
    }

    logger.debug("Technician profile updated", {
      userId,
      technicianId: technician._id.toString(),
      updatedFields: Object.keys(filteredUpdate),
    });

    return NextResponse.json({
      success: true,
      message: "Technician profile updated successfully",
      technician: {
        ...updatedTechnician,
        _id: updatedTechnician._id.toString(),
        createdAt: updatedTechnician.createdAt?.toISOString(),
        updatedAt: updatedTechnician.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error updating technician profile", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error && error.name === "MongoServerError" && (error as any).code === 11000
        ? "Database error: Duplicate key"
        : error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to update technician profile";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}