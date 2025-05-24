import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { logger } from "@/app/config/logger";

// Schema for user settings validation
const UserSettingsSchema = z.object({
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }).optional(),
  privacySettings: z.object({
    shareBookingHistory: z.boolean(),
    shareContactInfo: z.boolean(),
    allowLocationTracking: z.boolean(),
  }).optional(),
}).strict();

// GET handler to fetch user settings
export async function GET(request: NextRequest) {
  try {
    logger.debug('Processing GET /api/user/settings');

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
    if (!userId || role !== "user") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized: User role required" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find user by ID
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      logger.warn("User not found", { userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return user settings with defaults
    const settings = {
      notificationPreferences: user.notificationPreferences || {
        email: true,
        sms: true,
        push: true,
        marketing: false,
      },
      privacySettings: user.privacySettings || {
        shareBookingHistory: false,
        shareContactInfo: false,
        allowLocationTracking: true,
      },
    };

    logger.debug("User settings retrieved", {
      userId,
      hasNotificationPrefs: !!user.notificationPreferences,
      hasPrivacySettings: !!user.privacySettings,
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error fetching user settings", { error: errorMessage });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT handler to update user settings
export async function PUT(request: NextRequest) {
  try {
    logger.debug('Processing PUT /api/user/settings');

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
    if (!userId || role !== "user") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized: User role required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      logger.warn("Invalid JSON in request body");
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate settings data
    let validatedData;
    try {
      validatedData = UserSettingsSchema.parse(requestData.settings);
    } catch (error) {
      logger.warn("Settings validation failed", { error });
      return NextResponse.json(
        { success: false, message: "Invalid settings data" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Update user settings
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.notificationPreferences) {
      updateData.notificationPreferences = validatedData.notificationPreferences;
    }

    if (validatedData.privacySettings) {
      updateData.privacySettings = validatedData.privacySettings;
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      logger.warn("User not found for update", { userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    logger.info("User settings updated successfully", { userId });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error updating user settings", { error: errorMessage });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
