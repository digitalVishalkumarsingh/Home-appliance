import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { logger } from "@/app/config/logger";

// POST handler to change user password
export async function POST(request: NextRequest) {
  try {
    logger.debug('Processing POST /api/user/change-password');

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

    // Parse request body
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

    const { currentPassword, newPassword } = requestData;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      logger.warn("Missing required password fields");
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 8) {
      logger.warn("New password too short");
      return NextResponse.json(
        { success: false, message: "New password must be at least 8 characters long" },
        { status: 400 }
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

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      logger.warn("Invalid current password", { userId });
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        }
      }
    );

    if (result.modifiedCount === 0) {
      logger.error("Failed to update password", { userId });
      return NextResponse.json(
        { success: false, message: "Failed to update password" },
        { status: 500 }
      );
    }

    logger.info("User password changed successfully", { userId });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error changing user password", { error: errorMessage });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
