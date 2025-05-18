import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import { logger } from "@/app/config/logger";

// Constants
const COLLECTION_USERS = "users";
const BCRYPT_SALT_ROUNDS = 12;

export async function POST(request: Request) {
  try {
    logger.info("Processing password reset request");

    // Parse request body
    let token, password;
    try {
      const body = await request.json();
      token = body.token;
      password = body.password;
    } catch (parseError) {
      logger.error("Failed to parse request body", {
        error: parseError instanceof Error ? parseError.message : "Unknown error"
      });
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate input
    if (!token || !password) {
      logger.warn("Missing required fields", {
        hasToken: !!token,
        hasPassword: !!password
      });
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      logger.warn("Password too short");
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Hash the token for comparison using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Connect to MongoDB
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
      logger.debug("Connected to database");
    } catch (dbError) {
      logger.error("Database connection error", {
        error: dbError instanceof Error ? dbError.message : "Unknown error"
      });
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Find user with this token and check if it's still valid
    const user = await db.collection(COLLECTION_USERS).findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      logger.info("Invalid or expired reset token");
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Update user with new password and remove reset token
    await db.collection(COLLECTION_USERS).updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
        },
      }
    );

    logger.info("Password reset successful", { userId: user._id });
    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    logger.error("Password reset error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
